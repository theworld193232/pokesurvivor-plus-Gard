/* GAME MODES — pick how the next run plays from the main menu (🎮 Mode button on the Play panel).
   - Classic         the normal game.
   - Timed Survival  survive until the clock runs out (5 / 10 / 15 min). Enemies come faster and bosses arrive early.
                     Make it to 0:00 and you win the run with bonus PokéCoins.
   - Boss Rush       bosses arrive 4x sooner and there are fewer small enemies. Every boss KO pays bonus PokéCoins.
   - Hardcore        no extra hearts and enemies hit 50% harder, but PokéCoins and EXP are doubled.
   The choice is remembered.
   Co-op: the HOST's mode is the one everybody plays (whatever mode the others picked). The host sends its mode to
   the group when the run starts; the Legendary Den itself is run by the host and the Legendary joins everyone. */
(() => {
  'use strict';
  if (window.PS_MODES_INSTALLED) return; window.PS_MODES_INSTALLED = true;
  const B = () => window.PS_MEGA_BRIDGE_V5, E = () => window.PS_HOOPA_ENGINE;
  const MODES = {
    classic:  { name: 'Classic', ico: 'oranberry', icon: '🎮', color: '#5fa8ff', desc: 'The normal PokéSurvivor run.' },
    timed:    { name: 'Timed Survival', ico: 'quickclaw', icon: '⏱️', color: '#ffb13d', desc: 'Survive until the clock hits 0:00. Enemies spawn 50% faster and bosses show up early. Win the run and earn bonus PokéCoins.' },
    bossrush: { name: 'Boss Rush', ico: 'kingsrock', icon: '👑', color: '#ff5f6d', desc: 'Bosses arrive 4× sooner and there are fewer small enemies. Every boss you defeat pays +150 PokéCoins.' },
    legend:   { name: 'Legendary Den', ico: 'shinycharm', icon: '⭐', color: '#ffd23f', desc: 'Start right inside a Legendary Den: 4 Dynamax bosses, then a Legendary. Beat it and it joins your collection! The first boss lifts you to level 20, each next one +10. Shiny: 1/150 bosses, 1/500 Legendary.' },
    hardcore: { name: 'Hardcore', ico: 'lifeorb', icon: '💀', color: '#c86bdc', desc: 'No extra hearts and enemies hit 50% harder — but PokéCoins and EXP are doubled.' },
  };
  const LENGTHS = [300, 600, 900];
  const TIMED_BONUS = { 300: 400, 600: 1000, 900: 1800 };
  const TIMED = { spawn: 1.5, clock: 1.35 };   // spawn speed and boss-schedule speed in Timed Survival
  const RUSH = { clock: 4, spawn: 0.6, bossCoins: 150 };
  const HARD = { take: 1.5, gain: 2 };
  const store = { get(k, d) { try { const v = localStorage.getItem('ps_' + k); return v == null ? d : v; } catch (_) { return d; } }, set(k, v) { try { localStorage.setItem('ps_' + k, v); } catch (_) {} } };
  let sel = MODES[store.get('mode', 'classic')] ? store.get('mode', 'classic') : 'classic';
  let len = Number(store.get('timed_len', 600)); if (!LENGTHS.includes(len)) len = 600;
  const run = { mode: 'classic', player: null, len: 600, done: false, bosses: 0, endT: 0 };   // the run in progress
  const coop = () => !!(E()?.Coop?.active);
  // Legendary Den mode unlocks once you've entered a den in a normal Original run (js/dens.js); LoverGare always has it
  const ldLocked = () => { try { if (String(B()?.user || '').trim().toLowerCase() === 'lovergare') return false; return !(window.PS_DEN_MET && window.PS_DEN_MET()); } catch (_) { return false; } };
  const isHost = () => { try { const C = E().Coop; return !!(typeof C.isHost === 'function' ? C.isHost() : C.isHost); } catch (_) { return false; } };
  const inRoom = () => { try { const S = E().Social; return !!(S && S.room && (typeof S.room === 'function' ? S.room() : S.room)); } catch (_) { return false; } };
  const netHost = () => { try { const n = E().Net; return !!(typeof n.isHost === 'function' ? n.isHost() : n.isHost); } catch (_) { return false; } };
  // ---- co-op: the host's mode is everyone's mode ----
  let hostMode = null;   // {m, len, at} last mode the host sent us
  function sendMode() { try { const n = E().Net; if (n && netHost()) n.broadcast({ k: 'psmode', m: sel, len }); } catch (_) {} }
  let netHooked = false;
  function hookNet() {
    const n = E()?.Net; if (netHooked || !n || typeof n.on !== 'function') return; netHooked = true;
    n.on((uid, msg) => recv(msg));
  }
  function recv(msg) { try {
      if (!msg) return;
      if (msg.k === 'psmodeq' && netHost()) { sendMode(); return; }   // a guest asks which mode we're on
      if (msg.k !== 'psmode' || !MODES[msg.m]) return;
      hostMode = { m: msg.m, len: Number(msg.len) || 600, at: performance.now() };
      // our run already started on another mode: switch to the host's while it's still fresh
      if (run.player && coop() && !isHost() && run.mode !== msg.m && performance.now() - (run.startedAt || 0) < 20000) applyMode(run.player, msg.m, hostMode.len);
    } catch (_) {} }
  const clock = () => { try { const t = E().Game.time; return Number(typeof t === 'function' ? t() : t) || 0; } catch (_) { return 0; } };

  // ---------------- engine hooks ----------------
  function wrapHooks() {
    const H = window.PS_HOOKS; if (!H || H.__psModes) return !!(H && H.__psModes); H.__psModes = true;
    const take = H.take;
    H.take = function (type, pl, ...a) { const m = take ? take.call(this, type, pl, ...a) : 1; return run.mode === 'hardcore' && pl && pl === B()?.game?.player ? m * HARD.take : m; };
    return true;
  }
  let spWrapped = false;
  function wrapSpawner() {
    const Sp = E()?.Spawner; if (!Sp || spWrapped || typeof Sp.update !== 'function') return; spWrapped = true;
    const up = Sp.update;
    Sp.update = function (dt, players, time) {
      if (run.player && (!coop() || isHost())) {
        if (run.mode === 'timed') return up.call(this, dt * TIMED.spawn, players, time * TIMED.clock);
        if (run.mode === 'bossrush') return up.call(this, dt * RUSH.spawn, players, time * RUSH.clock);
        if (run.mode === 'legend') return;   // only the den's own Pokémon in Legendary Den mode
      }
      return up.call(this, dt, players, time);
    };
  }

  // ---------------- run start / tick ----------------
  function startRunMode(p) {
    let m = sel, L = len;
    if (m === 'legend' && ldLocked() && !(coop() && !isHost())) m = 'classic';
    if ((window.PS_STORY&&window.PS_STORY.on())) m = 'classic';   // Story: no game modes
    if (coop()) {
      if (isHost()) { let n = 0; const tm = setInterval(() => { sendMode(); if (++n >= 6) clearInterval(tm); }, 800); sendMode(); }
      else { if (hostMode && performance.now() - hostMode.at < 120000) { m = hostMode.m; L = hostMode.len; } else m = 'classic'; try { E().Net.toHost({ k: 'psmodeq' }); } catch (_) {} }
    }
    run.startedAt = performance.now(); applyMode(p, m, L);
  }
  function applyMode(p, m, L) {
    const prev = run.mode;
    if (prev === 'hardcore' && run.player === p && m !== 'hardcore') { p.coinMul = (Number(p.coinMul) || 1) / HARD.gain; p.xpMul = (Number(p.xpMul) || 1) / HARD.gain; }
    run.player = p; run.mode = m; run.len = L; run.done = false; run.endT = 0; run.bosses = Number(p.bosses) || 0;
    if (run.mode === 'hardcore') { p.lives = 0; p.coinMul = (Number(p.coinMul) || 1) * HARD.gain; p.xpMul = (Number(p.xpMul) || 1) * HARD.gain; }
    if (run.mode === 'legend' && (!coop() || isHost())) { let n = 0; const go = () => { if (B()?.game?.player !== p) return; if (!(window.PS_DENS && window.PS_DENS.startLegend && window.PS_DENS.startLegend('mode')) && n++ < 40) setTimeout(go, 250); }; setTimeout(go, 600); }
    if (run.mode !== 'classic' && run.mode !== 'legend') { try { E().Spawner.say(MODES[run.mode].icon + ' ' + MODES[run.mode].name + (run.mode === 'timed' ? ' · ' + fmt(run.len) : ''), 3); } catch (_) {} }
    renderHud();
  }
  function fmt(s) { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
  function tick(dt) {
    const g = B()?.game, p = g?.player, st = g?.state;
    if (!p || st === 'ui') { if (run.player) { run.player = null; run.mode = 'classic'; } hud.style.display = 'none'; return; }
    if (p !== run.player && (st === 'playing' || st === 'levelup' || st === 'choice')) startRunMode(p);
    if (!run.player) return;
    if (run.mode === 'hardcore' && (Number(p.lives) || 0) > 0 && !p.__psHardWarn) { p.lives = 0; }
    if (run.mode === 'bossrush') { const b = Number(p.bosses) || 0; if (b > run.bosses) { const n = b - run.bosses; run.bosses = b; p.coins = (Number(p.coins) || 0) + n * RUSH.bossCoins; try { B().fx.dmgText(p.x, p.y - (p.bodyH || 40) - 30, '+' + n * RUSH.bossCoins + ' Boss Rush coins!', '#ffd86b'); } catch (_) {} } }
    if (run.mode === 'timed' && !run.done && st === 'playing' && !p.dead) {
      if (clock() >= run.len) {   // survived!
        run.done = true; run.endT = performance.now(); const bonus = TIMED_BONUS[run.len] || 500;
        p.coins = (Number(p.coins) || 0) + bonus; p.invuln = 99; p.god = true;
        try { E().Spawner.say('🏆 You survived! +' + bonus + ' PokéCoins', 3); B().fx.ring(p.x, p.y, 10, 220, '#ffd86b', 0.8, 8); B().fx.burst(p.x, p.y - 20, '#fff2a8', 40, 300); B().audio?.sfx?.('levelup'); } catch (_) {}
        win.show(bonus);
        setTimeout(() => { try { p.god = false; win.hide(); if (B()?.game?.player === p && B()?.game?.state !== 'over') E().Game.winRun(0); } catch (e) { console.warn('[modes]', e); } }, 3200);
      }
    }
    renderHud();
  }

  // ---------------- in-run HUD ----------------
  // ---- side notifications (slide in on the right, game-style box) — shared with dens.js via window.PS_TOAST ----
  const toastBox = document.createElement('div'); toastBox.id = 'ps-toasts';
  window.PS_TOAST = function (title, sub, opt) {
    opt = opt || {}; const el = document.createElement('div'); el.className = 'box ps-toast' + (opt.gold ? ' gold' : '');
    let ic = ''; try { if (opt.dex && E()?.UI?.spriteCanvas) { const c = E().UI.spriteCanvas(opt.dex, 56, 56, { scale: 1, shiny: !!opt.shiny }); c.classList.add('ti'); ic = c; } else if (opt.icon) ic = ico(opt.icon, 40); } catch (_) {}
    el.innerHTML = '<div class="tx"><b>' + title + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + '</div>';
    if (ic && typeof ic === 'object') el.prepend(ic); else if (ic) el.insertAdjacentHTML('afterbegin', '<span class="ti">' + ic + '</span>');
    toastBox.appendChild(el); requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('in')));
    setTimeout(() => { el.classList.remove('in'); el.classList.add('out'); setTimeout(() => el.remove(), 450); }, opt.ms || 5200);
    try { B()?.audio?.sfx?.(opt.gold ? 'legend' : 'levelup'); } catch (_) {}
  };
  const css = document.createElement('style');
  css.textContent = `
  #ps-toasts{position:fixed;right:14px;top:150px;z-index:85;display:flex;flex-direction:column;gap:10px;align-items:flex-end;pointer-events:none}
  .ps-toast{display:flex;align-items:center;gap:12px;padding:10px 16px !important;min-width:250px;max-width:340px;transform:translateX(120%);opacity:0;transition:transform .45s cubic-bezier(.2,1.3,.4,1),opacity .3s;animation:none !important}
  .ps-toast.in{transform:none;opacity:1}.ps-toast.out{transform:translateX(120%);opacity:0}
  .ps-toast.gold{border-color:#fff7d6;box-shadow:0 0 0 3px var(--edge-out),inset 0 0 0 2px var(--gold),0 0 24px rgba(255,210,63,.45)}
  .ps-toast .ti,.ps-toast canvas.ti{flex:none;image-rendering:pixelated}.ps-toast .ti img{width:40px;height:40px;image-rendering:pixelated}
  .ps-toast .tx{display:flex;flex-direction:column}.ps-toast b{font-size:17px;color:var(--gold)}.ps-toast small{font-size:13px;color:var(--muted)}
  #ps-mode-hud{position:fixed;left:12px;top:62px;z-index:24;display:none;align-items:center;gap:8px;padding:4px 12px !important;font-size:15px;pointer-events:none;animation:none !important;overflow:visible !important;white-space:nowrap}
  #ps-mode-hud img{width:20px;height:20px;image-rendering:pixelated}#ps-mode-hud .tm{font-size:19px;color:var(--gold);min-width:64px;text-align:center}#ps-mode-hud .mu{color:var(--muted);font-size:14px}
  #ps-mode-hud.low .tm{color:var(--red);animation:psModePulse .6s infinite alternate}@keyframes psModePulse{to{transform:scale(1.12)}}
  #ps-mode-win{position:fixed;inset:0;z-index:80;display:none;align-items:center;justify-content:center;pointer-events:none}
  #ps-mode-win .box{text-align:center;min-width:min(460px,90vw)}#ps-mode-win h2{color:var(--gold)}#ps-mode-win .sub{margin:0}
  #ps-mode-btn{position:absolute;right:12px;top:12px;z-index:3;display:flex;align-items:center;gap:8px}
  #ps-mode-btn img{width:20px;height:20px;image-rendering:pixelated}
  #ps-mode-pick{position:fixed;inset:0;z-index:90;display:none;align-items:center;justify-content:center;padding:16px;background:radial-gradient(circle at 50% 40%,rgba(10,20,50,.55),rgba(3,6,16,.88))}
  #ps-mode-pick .box{width:min(600px,100%);max-height:calc(100vh - 32px)}
  #ps-mode-pick .menu-list{margin:6px 0 10px}
  #ps-mode-pick .menu-item{width:100%;color:#fff;font-size:21px}#ps-mode-pick .menu-item small{font-size:14px;line-height:1.3}
  #ps-mode-pick .menu-item.on{background:rgba(255,255,255,.1)}#ps-mode-pick .menu-item.on::before{opacity:1;transform:none}
  #ps-mode-pick .menu-item .tg{color:var(--gold);font-size:14px;margin-left:8px}
  #ps-mode-pick .mi-ico img{width:30px;height:30px;image-rendering:pixelated}
  #ps-mode-pick .lens{display:flex;gap:8px;grid-column:2;margin-top:8px}#ps-mode-pick .lens .btn{flex:1}
  #ps-mode-pick .row.end{margin-top:6px}`;
  const ico = (k, n) => { try { const I = E()?.Icons; if (I && E().ITEM_ICONS && E().ITEM_ICONS[k]) return I.html(k, n || 22); } catch (_) {} return ''; };
  const hud = document.createElement('div'); hud.id = 'ps-mode-hud'; hud.className = 'box';
  const winEl = document.createElement('div'); winEl.id = 'ps-mode-win';
  const win = { show(b) { if (window.PS_TOAST) { window.PS_TOAST('You survived!', fmt(run.len) + ' cleared · +' + b + ' PokéCoins', { gold: true, icon: 'quickclaw' }); return; } winEl.innerHTML = '<div class="box"><h2>You survived!</h2><p class="sub">' + fmt(run.len) + ' cleared · +' + b + ' PokéCoins</p></div>'; winEl.style.display = 'flex'; }, hide() { winEl.style.display = 'none'; } };
  let lastHud = '';
  function renderHud() {
    const st = B()?.game?.state;
    if (!run.player || run.mode === 'classic' || st === 'ui' || st === 'over' || (window.PS_SAFEZONE && window.PS_SAFEZONE.active)) { hud.style.display = 'none'; lastHud = ''; return; }
    const M = MODES[run.mode]; let h = ico(M.ico) + '<span>' + M.name + '</span>', low = false;
    if (run.mode === 'timed') { const left = run.len - clock(); low = left <= 30 && !run.done; h += '<span class="tm">' + (run.done ? '0:00' : fmt(left)) + '</span>'; }
    if (run.mode === 'bossrush') h += '<span class="mu">bosses defeated</span><span class="tm">' + run.bosses + '</span>';
    if (run.mode === 'hardcore') h += '<span class="mu">×2 PokéCoins & EXP</span>';
    if (h !== lastHud) { hud.innerHTML = h; lastHud = h; }
    hud.classList.toggle('low', low); hud.style.display = 'flex';
  }

  // ---------------- menu: Mode button + picker ----------------
  const pick = document.createElement('div'); pick.id = 'ps-mode-pick';
  function modeLabel() { const M = MODES[sel]; return M.name + (sel === 'timed' ? ' · ' + (len / 60) + ' min' : ''); }
  function injectBtn() {
    const banner = document.getElementById('pp-banner'); if (!banner) return;
    let b = document.getElementById('ps-mode-btn');
    if (!b) { b = document.createElement('button'); b.id = 'ps-mode-btn'; b.type = 'button'; b.className = 'btn small'; b.addEventListener('click', e => { e.stopPropagation(); openPick(); }); }
    if (b.parentElement !== banner) { if (getComputedStyle(banner).position === 'static') banner.style.position = 'relative'; banner.appendChild(b); }
    const guest = inRoom() && !netHost(); const html = ico(MODES[sel].ico, 20) + '<span>Mode: ' + modeLabel() + (guest ? ' · host decides' : '') + '</span>'; if (b.__h !== html) { b.innerHTML = html; b.__h = html; }
    if (netHost() && sel !== injectBtn.__last) { injectBtn.__last = sel; sendMode(); }
  }
  function openPick() { renderPick(); pick.style.display = 'flex'; }
  function closePick() { pick.style.display = 'none'; injectBtn(); }
  function renderPick() {
    let h = '<div class="box"><h2>Game Mode</h2><p class="sub">Choose how your next run plays. Your choice is remembered. In co-op, everyone plays the host\'s mode.</p><div class="menu-list">';
    for (const [id, M] of Object.entries(MODES)) {
      if (id === 'legend' && ldLocked()) { h += '<button class="menu-item locked" data-locked="1" style="opacity:.55"><span class="mi-ico">' + ico(M.ico, 30) + '</span><span>🔒 ' + M.name + '</span><small>Enter a Max Raid Den or a Legendary Den during a normal (Original) run to unlock this mode.</small></button>'; continue; }
      h += '<button class="menu-item' + (id === sel ? ' on' : '') + '" data-m="' + id + '"><span class="mi-ico">' + ico(M.ico, 30) + '</span><span>' + M.name + (id === sel ? '<span class="tg">· selected</span>' : '') + '</span><small>' + M.desc + '</small>';
      if (id === 'timed') { h += '<span class="lens">'; for (const L of LENGTHS) h += '<span class="btn small' + (L === len && sel === 'timed' ? ' gold' : '') + '" data-len="' + L + '">' + (L / 60) + ' min · +' + TIMED_BONUS[L] + '</span>'; h += '</span>'; }
      h += '</button>';
    }
    h += '</div><div class="row end"><button class="btn gold" data-close="1">Done</button></div></div>';
    pick.innerHTML = h;
  }
  pick.addEventListener('click', e => {
    e.stopPropagation(); if (e.target === pick || e.target.closest('[data-close]')) return closePick();
    const L = e.target.closest('[data-len]'); if (L) { len = Number(L.dataset.len); store.set('timed_len', len); sel = 'timed'; store.set('mode', sel); return renderPick(); }
    if (e.target.closest('[data-locked]')) return;
    const c = e.target.closest('[data-m]'); if (c) { sel = c.dataset.m; store.set('mode', sel); renderPick(); }
  });
  ['pointerdown', 'mousedown', 'touchstart', 'keydown'].forEach(ev => pick.addEventListener(ev, e => e.stopPropagation()));
  addEventListener('keydown', e => { if (pick.style.display === 'flex' && e.key === 'Escape') { closePick(); e.stopImmediatePropagation(); e.preventDefault(); } }, true);

  // ---------------- loop ----------------
  let last = performance.now(), menuT = 0;
  function loop(now) {
    requestAnimationFrame(loop); const dt = Math.min(0.1, (now - last) / 1000); last = now;
    try { wrapHooks(); wrapSpawner(); hookNet(); tick(dt); menuT += dt; if (menuT > 0.5) { menuT = 0; if (B()?.game?.state === 'ui' || !B()?.game?.player) injectBtn(); } } catch (e) { console.warn('[modes]', e); }
  }
  function init() { document.head.append(css); document.body.append(hud, winEl, pick, toastBox); requestAnimationFrame(loop); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
  window.PS_MODES = { _recv: recv, get hostMode() { return hostMode; }, modes: MODES, get selected() { return sel; }, set selected(v) { if (MODES[v]) { sel = v; store.set('mode', v); injectBtn(); } }, get length() { return len; }, set length(v) { if (LENGTHS.includes(v)) { len = v; store.set('timed_len', v); } }, get run() { return Object.assign({}, run, { player: !!run.player }); }, open: openPick, _debugLen(s) { run.len = s; } };
})();
