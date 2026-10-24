/* ECHO'S SINGULARITY — an owner-only, once-per-run rescue cinematic.
 * Activates for LoverGare's Mega Gardevoir if a co-op teammate falls below 20% HP,
 * or when Mega Gardevoir falls below 20% HP after her existing second revival.
 * Everybody sees the cut-in; only the host kills world enemies (to avoid duplicate loot).
 * Original game engine, other Pokemon and saved progress are untouched.
 */
(() => {
  'use strict';
  if (window.PS_ECHO_SINGULARITY) return;
  const USER = 'lovergare';
  const FORM = '282-mega';
  const LOW_HP = 0.20;
  const DURATION_MS = 4900;
  const IMPACT_MS = 3450;
  const IFRAME_AFTER = 5;
  const B = () => window.PS_MEGA_BRIDGE_V5;
  const E = () => window.PS_HOOPA_ENGINE;
  const id = () => String(B()?.user || '').trim().toLowerCase();
  const isHost = () => { const v = E()?.Coop?.isHost; return typeof v === 'function' ? !!v() : !!v; };
  const cooping = () => !!E()?.Coop?.active;
  const ownerPlayer = () => B()?.game?.player;
  const ratio = p => p && Number(p.maxHp) > 0 ? Number(p.hp) / Number(p.maxHp) : 1;
  let active = null, usedPlayer = null, used = false, last = performance.now(), installed = false;
  let netHooked = false;
  let cssAdded = false;
  let test = null;
  // Persistent per-run flag prevents retriggers when leaving a reward screen and returning.
  const ownerEligible = p => id() === USER && p && !p.dead && Number(p.dex) === 282 && p.megaForm === FORM;
  const battle = () => ['playing', 'levelup', 'choice'].includes(String(B()?.game?.state));
  const suitable = p => ownerEligible(p) && battle() && !p.__echoSingularityUsed && !window.PS_ECHO_CUTSCENE?.playing;
  const allyLow = p => {
    if (!cooping()) return false;
    const C = E()?.Coop;
    return (C?.mates || []).some(m => m && m.connected && m.pl && m.pl !== p && !m.pl.dead && ratio(m.pl) > 0 && ratio(m.pl) <= LOW_HP);
  };
  const selfLow = p => ratio(p) > 0 && ratio(p) <= LOW_HP && Number(p.lives) <= 0 && p.__echoBondUsed === true;

  function style() {
    if (cssAdded) return; cssAdded = true;
    const st = document.createElement('style');
    st.textContent = `
      #ps-singularity-cut { position:fixed; inset:0; z-index:2147483600; background:#020107; pointer-events:none;
        display:flex; align-items:center; justify-content:center; opacity:0; overflow:hidden; }
      #ps-singularity-cut.on { opacity:1; transition:opacity .25s; }
      #ps-singularity-cut .echo-blackhole { width:min(92vmin,740px); height:min(92vmin,740px); object-fit:contain;
        image-rendering:pixelated; transform:scale(.74); filter:drop-shadow(0 0 35px #c354ff); }
      #ps-singularity-cut.charge .echo-blackhole { transition:transform 2s cubic-bezier(.16,.62,.08,1); transform:scale(1.46); }
      #ps-singularity-cut.release .echo-blackhole { transition:transform .55s ease-out; transform:scale(.55); }
      #ps-singularity-cut .echo-label { position:absolute; top:6vh; left:0; right:0; text-align:center; color:#f9e4ff;
        font:900 clamp(16px,3vw,35px) Pixelify,system-ui,sans-serif; text-shadow:0 3px 0 #391352,0 0 18px #aa57ff;
        letter-spacing:3px; }
      #ps-singularity-cut .echo-flash { position:absolute; inset:0; background:#fff; opacity:0; pointer-events:none; }
      #ps-singularity-cut.boom .echo-flash { animation:ps-singularity-flash 1s ease-out both; }
      #ps-singularity-cut .echo-wave { position:absolute; width:40vmin; height:40vmin; border-radius:50%; border:8px solid #f8beff;
        box-shadow:0 0 60px #f0b7ff, 0 0 160px #a849ff; opacity:0; }
      #ps-singularity-cut.boom .echo-wave { animation:ps-singularity-wave 1.1s ease-out both; }
      @keyframes ps-singularity-flash { 0%{opacity:1} 24%{opacity:.8} 100%{opacity:0} }
      @keyframes ps-singularity-wave { 0%{transform:scale(.1);opacity:1} 100%{transform:scale(7);opacity:0} }
      #ps-singularity-test {position:fixed;bottom:62px;right:14px;z-index:2147483000;font:700 12px system-ui;
        background:#33134f;border:2px solid #fa88e2;color:white;border-radius:8px;padding:8px 12px;cursor:pointer;}
    `;
    document.head.appendChild(st);
  }

  function cleanup() {
    const r = active; if (!r) return;
    active = null;
    try { r.ui.remove(); } catch (_) {}
    if (r.owner && r.p && !r.p.dead) {
      r.p.invuln = Math.max(Number(r.p.invuln) || 0, IFRAME_AFTER);
      r.p.reviveShield = Math.max(Number(r.p.reviveShield) || 0, IFRAME_AFTER);
      r.p.hp = Math.max(Number(r.p.hp) || 1, Math.min(Number(r.p.maxHp) || 1, (Number(r.p.maxHp) || 1) * 0.3));
    }
    if (r.p) { r.p.invuln = Math.max(Number(r.p.invuln) || 0, 1.5); r.p.reviveShield = Math.max(Number(r.p.reviveShield) || 0, 1.5); }
    if (r.owner) try { r.p._vx = 0; r.p._vy = 0; } catch (_) {}
  }

  // Native enemy hurt -> native KO and reward bookkeeping. Never kill simulated remote copies.
  function clearField() {
    if (cooping() && !isHost()) return;
    const N = E(); const p = ownerPlayer();
    if (!N?.EnemyMgr?.all) return;
    let killed = 0;
    for (const enemy of [...N.EnemyMgr.all()]) {
      if (!enemy || enemy.dead || enemy.remote || typeof enemy.hurt !== 'function') continue;
      try {
        const hp = Math.max(1, Number(enemy.hp) || 1), shield = Math.max(0, Number(enemy.shield) || 0);
        // Normal damage pathway handles boss KO events, loot, waves and counters.
        enemy.hurt(Math.max(1e8, (hp + shield) * 100), '#ffd6ff', (enemy.x || 0) - (p?.x || 0), (enemy.y || 0) - (p?.y || 0), 500);
        if (enemy.dead) killed++;
      } catch (err) { console.warn('[EchoSingularity] enemy hurt', err); }
    }
    try { const fx = B()?.fx; if (p && fx) { fx.ring(p.x,p.y,8,1400,'#e9b3ff',1.2,10); fx.burst(p.x,p.y-24,'#fae4ff',80,620); fx.dmgText(p.x,p.y-90,'SINGULARITY · '+killed+' KO','#e4aaff'); } } catch (_) {}
  }

  function begin(nonce, caster, owner) {
    if (active || !battle() || !nonce || typeof nonce !== 'string' || nonce.length > 64) return false;
    // Even spectators get temporary protection while the full-screen cut-in obscures combat.
    const p = ownerPlayer();
    if (owner && !ownerEligible(p)) return false;
    style();
    const ui = document.createElement('div'); ui.id = 'ps-singularity-cut';
    const picture = document.createElement('img'); picture.className = 'echo-blackhole'; picture.alt = 'Mega Gardevoir opens a black hole';
    picture.src = 'assets/fx/echo-singularity.gif?v=1';
    const label = document.createElement('div'); label.className = 'echo-label'; label.textContent = "ECHO'S SINGULARITY";
    const flash = document.createElement('div'); flash.className = 'echo-flash';
    const wave = document.createElement('div'); wave.className = 'echo-wave';
    ui.append(picture,label,wave,flash); document.body.append(ui);
    // Cinematic begins after all players have received the host announcement.
    active = { nonce, ui, p, owner, caster, start: performance.now(), boom:false, cleared:false,
      x:p?.x || 0, y:p?.y || 0 };
    requestAnimationFrame(() => { if (active?.nonce === nonce) { ui.classList.add('on'); ui.classList.add('charge'); } });
    return true;
  }

  function announce(nonce, caster) {
    const N = E(); if (!cooping()) { begin(nonce,caster,true); return; }
    if (isHost()) {
      begin(nonce,caster,true);
      N.Net.broadcast({k:'psEchoSingularity',nonce,who:String(N.Coop.me || ''),form:FORM});
    } else {
      // The guest starts locally while asking host to relay the animation and damage.
      begin(nonce,caster,true);
      N.Net.toHost({k:'psEchoSingularityReq',nonce,form:FORM});
    }
  }

  function request(p, reason) {
    if (!suitable(p) || used || active) return false;
    used = true; p.__echoSingularityUsed = true;
    p.invuln = Math.max(Number(p.invuln)||0, 2);
    p.reviveShield = Math.max(Number(p.reviveShield)||0, 2);
    const nonce = String(Date.now())+'-'+Math.floor(Math.random()*1e8).toString(16);
    announce(nonce,reason);
    return true;
  }

  function hookNet() {
    const N = E(); if (netHooked || !N?.Net?.on || !N.Coop) return; netHooked = true;
    N.Net.on((uid, msg) => {
      if (!cooping() || !msg || typeof msg.nonce !== 'string' || !/^\d{10,14}-[a-f0-9]{1,8}$/.test(msg.nonce)) return;
      if (msg.k === 'psEchoSingularityReq' && isHost()) {
        // A guest cannot request the action on behalf of an unrelated or untransformed teammate.
        const m = N.Coop.mate?.(uid);
        const remote = m?.pl;
        if (!m?.connected || remote?.megaForm !== FORM || Number(remote.dex) !== 282) return;
        const declared = String(m.user || m.name || m.username || m.displayName || '').toLowerCase();
        if (declared && declared !== USER) return;
        if (m.__echoSingularityNetUsed) return;
        m.__echoSingularityNetUsed = true;
        // Host starts locally and re-broadcasts one trusted announcement to all guests.
        begin(msg.nonce,'guest-rescue',false);
        N.Net.broadcast({k:'psEchoSingularity',nonce:msg.nonce,who:String(uid),form:FORM});
      } else if (msg.k === 'psEchoSingularity' && !isHost()) {
        // Network announcements can only come from the session's host.
        if (String(uid) !== String(N.Net.hostUid)) return;
        if (active && active.nonce === msg.nonce) return;
        begin(msg.nonce,'remote',false);
      }
    });
  }

  function tick(now) {
    requestAnimationFrame(tick);
    const dt = Math.min(.08,(now-last)/1000); last = now;
    const p = ownerPlayer();
    if (p !== usedPlayer) { cleanup(); usedPlayer = p; used = Boolean(p?.__echoSingularityUsed); }
    if (!installed) { installed = true; style(); }
    hookNet();
    if (test) test.style.display = id()===USER && ownerEligible(p) && battle() ? '' : 'none';
    if (active) {
      const r=active;
      if (!battle() && B()?.game?.state === 'ui') { cleanup(); return; }
      if (r.p && !r.p.dead) {
        r.p.invuln = Math.max(Number(r.p.invuln)||0, 1);
        r.p.reviveShield = Math.max(Number(r.p.reviveShield)||0, 1);
        // Lock Gardevoir's movement throughout the cut-in, even while the game loop runs.
        if (r.owner) { r.p.x = r.x; r.p.y = r.y; r.p._vx = 0; r.p._vy = 0; }
      }
      const elapsed = now-r.start;
      if (elapsed > 2300 && elapsed < IMPACT_MS) r.ui.classList.add('release');
      if (!r.boom && elapsed >= IMPACT_MS) {
        r.boom=true; r.ui.classList.add('boom');
        if (r.owner) { try { r.p.invuln=Math.max(r.p.invuln||0, 5); r.p.reviveShield=Math.max(r.p.reviveShield||0, 5); } catch (_) {} }
        // The local host, and ONLY the host, removes enemies.
        if (!cooping() || isHost()) clearField();
      }
      if (elapsed >= DURATION_MS) cleanup();
      return;
    }
    if (!ownerEligible(p) || !battle() || used || window.PS_ECHO_CUTSCENE?.playing) return;
    if (allyLow(p)) request(p,'ally-critical');
    else if (selfLow(p)) request(p,'last-chance');
  }

  // Debug button appears only with ?singularityTest=1, and only for LoverGare's Mega Gardevoir.
  function setup() {
    if (new URLSearchParams(location.search).has('singularityTest')) {
      test = document.createElement('button'); test.id='ps-singularity-test'; test.textContent='TEST · Echo Singularity';
      test.onclick = () => { const p = ownerPlayer(); if (ownerEligible(p) && !used) request(p,'manual-test'); };
      document.body.appendChild(test);
    }
    requestAnimationFrame(tick);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',setup,{once:true}); else setup();
  window.PS_ECHO_SINGULARITY = Object.freeze({version:1, trigger:request,
    get playing(){return !!active;}, get used(){return used;}, get owner(){return id()===USER;},
    config:{ hpThreshold:LOW_HP,durationMs:DURATION_MS, impactMs:IMPACT_MS }});
})();
