/* Quality-of-life + new features, inspired by the Android port of PokéSurvivor (github.com/JayElDragon/poke-survivor,
   MIT code by JPTER78 / JayElDragon). Rewritten for the web game:
   - ⚙ settings button (next to ♫): Minimap, FPS counter, Reduce screen shake (base game only; the mod's effects always keep theirs)
   - Minimap: circular radar (foes, bosses, items, chests, rifts, allies, north marker)
   - Melee buff: melee moves +25% damage, +10% reach, short invincibility on each swing
   - DYNAMAX: earn the Dynamax Band by clearing a Max Raid Den (see dens.js), then press G (or the red button) to go giant for 60s: +30% damage / defense / speed / HP,
     red aura and a Max shockwave of your type every 1.5s (every 3rd one is big). 4-minute cooldown after it ends. */
(() => {
  'use strict';
  if (window.PS_QUALITY_INSTALLED) return; window.PS_QUALITY_INSTALLED = true;
  const B = () => window.PS_MEGA_BRIDGE_V5, E = () => window.PS_HOOPA_ENGINE;
  const KEY = 'ps.quality.v1';
  let Q = { minimap: true, fps: false, calm: false, open: false };
  try { Object.assign(Q, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (_) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(Q)); } catch (_) {} };
  window.PS_SETTINGS = { get reduceFx() { return !!Q.calm; }, get minimap() { return !!Q.minimap; } };
  const ownKick = v => { window.__psModKick = true; try { B()?.camera?.kick?.(v); } catch (_) {} finally { window.__psModKick = false; } };
  const playing = () => B()?.game?.state === 'playing';
  const inRun = () => { const st = B()?.game?.state; return !!(st && st !== 'ui' && st !== 'over'); };

  // ---------------- reduce screen shake: dampen every camera kick ----------------
  function wrapCamera() { const C = B()?.camera; if (!C || C.__psCalm || typeof C.kick !== 'function') return; const k = C.kick; C.__psCalm = true; C.kick = function (v, ...a) { const own = window.__psFullKick || window.__psModKick; return k.call(this, Q.calm && !own ? (Number(v) || 0) * 0.25 : v, ...a); }; }

  // ---------------- melee buff ----------------
  let meleeDone = false;
  function buffMelee() {
    const M = B()?.moves; if (meleeDone || !M || !Array.isArray(M.ALL) || !M.ALL.length) return; meleeDone = true;
    for (const m of M.ALL) if (m && m.kind === 'melee' && !m.__psMelee) { m.__psMelee = true; m.dmg = Math.round((Number(m.dmg) || 10) * 1.25); m.radius = Math.round((Number(m.radius) || 50) * 1.1); }
  }

  // ---------------- hooks: Dynamax stats + melee invincibility ----------------
  const DYN = { minLevel: 20, dur: 60, cooldown: 240, grow: 1.6, stat: 1.3, hp: 0.3, pulse: 1.5 };
  const STATUS = { fire: {}, water: { slow: 0.4 }, electric: { stun: { chance: 1, dur: 0.8 } }, ice: { stun: { chance: 1, dur: 1.0 } }, poison: { poison: 1 },
    psychic: { stun: { chance: 0.5, dur: 0.8 } }, ghost: { stun: { chance: 0.6, dur: 1.2 } }, fairy: { stun: { chance: 0.5, dur: 0.8 } }, bug: { slow: 0.35 }, grass: { poison: 1 }, ground: { slow: 0.3 } };
  const dyn = { active: false, t: 0, cd: 0, bonus: 0, n: 0, pulse: 0, type: 'normal', player: null, f: 1, steps: [], base: new WeakMap() };
  function wrapHooks() {
    const H = window.PS_HOOKS; if (!H || H.__psQuality) return; H.__psQuality = true;
    const deal = H.deal, take = H.take, spd = H.spd;
    H.deal = function (...a) { const m = deal ? deal.apply(this, a) : 1; return dyn.active ? m * DYN.stat : m; };
    H.take = function (type, pl, ...a) { const m = take ? take.call(this, type, pl, ...a) : 1; return dyn.active && pl === dyn.player ? m / DYN.stat : m; };
    H.spd = function (pl, ...a) { const m = spd ? spd.call(this, pl, ...a) : 1; return dyn.active && pl === dyn.player ? m * DYN.stat : m; };
    H.melee = function (p, move, ghost) {   // short invincibility on each melee swing (always shorter than the cooldown)
      const g = B()?.game?.player; if (ghost || !p || p !== g) return;
      const cd = Number(move && move.cd) || 0.5; p.invuln = Math.max(Number(p.invuln) || 0, Math.min(0.4, cd * 0.45));
    };
  }

  // ---------------- DYNAMAX ----------------
  function animBase(a) { if (!a) return 1; if (!dyn.base.has(a)) dyn.base.set(a, Number(a.scale) || 1); return dyn.base.get(a); }
  function applyScale() { const p = dyn.player; if (!p || !p.anim) return; p.anim.scale = animBase(p.anim) * dyn.f; }
  function canDynamax(p) { return !!(p && !p.dead && playing() && !dyn.active && dyn.cd <= 0 && !!p.__dynBand); }
  function startDynamax() {
    const p = B()?.game?.player, b = B(); if (!canDynamax(p)) return false;
    dyn.active = true; dyn.t = DYN.dur; dyn.n = 0; dyn.pulse = 0.6; dyn.player = p;
    dyn.type = String((p.mon && p.mon.types && p.mon.types[0]) || 'normal');
    dyn.bonus = Math.round((Number(p.maxHp) || 100) * DYN.hp); p.maxHp += dyn.bonus; p.hp += dyn.bonus;
    p.invuln = Math.max(Number(p.invuln) || 0, 1.2);
    // grows in steps (grow, shrink a little, grow more), like the giant mushroom
    const st = [[1.22, 0.14], [1.04, 0.10], [1.42, 0.16], [1.16, 0.10], [DYN.grow * 1.12, 0.22], [DYN.grow, 0.18]];
    let at = 0; dyn.steps = st.map(([f, d]) => { at += d; return { f, at }; }); dyn.stepT = 0; dyn.from = 1;
    try { const col = (b.types && b.types.color && b.types.color(dyn.type)) || '#ff2a6d'; b.fx.ring(p.x, p.y, 10, 360, col, 0.7, 6); b.fx.ring(p.x, p.y, 10, 240, '#ffffff', 0.5, 4); b.fx.burst(p.x, p.y, col, 28, 260); ownKick(0.6); b.audio?.sfx?.('levelup'); b.fx.dmgText(p.x, p.y - (p.bodyH || 40) - 30, 'DYNAMAX!', '#ff3d6a'); } catch (_) {}
    try { window.PS_FX && window.PS_FX.cast('dynaura', p, { id: 'dynamax', type: dyn.type, dmg: 0, fx: { life: DYN.dur + 0.4, scale: () => dyn.f, done: () => !dyn.active } }, null, true); } catch (_) {}
    try { window.PS_MUSIC && window.PS_MUSIC.event && window.PS_MUSIC.event('trainer'); } catch (_) {}
    render(); return true;
  }
  function stopDynamax(silent) {
    if (!dyn.active) return; const p = dyn.player; dyn.active = false; dyn.cd = DYN.cooldown;
    if (p) { const mx = Number(p.maxHp) || 1, nm = Math.max(1, mx - dyn.bonus); if (p.hp > 0) p.hp = Math.max(1, Math.round(p.hp * nm / mx)); p.maxHp = nm; }
    dyn.bonus = 0; dyn.shrink = 0.35; dyn.shrinkFrom = dyn.f;
    if (!silent) try { const b = B(); b.fx.ring(p.x, p.y, 10, 200, '#ff3d6a', 0.5, 4); b.fx.burst(p.x, p.y, '#ff3d6a', 14, 160); } catch (_) {}
    render();
  }
  function tickDynamax(dt) {
    const p = B()?.game?.player;
    if (!inRun()) { if (dyn.active) stopDynamax(true); dyn.cd = 0; dyn.f = 1; dyn.player = null; return; }
    if (dyn.player && p !== dyn.player) { if (dyn.active) stopDynamax(true); dyn.f = 1; dyn.player = p; }
    if (!playing()) return;
    if (dyn.cd > 0 && !dyn.active) dyn.cd = Math.max(0, dyn.cd - dt);
    if (dyn.active) {
      // growth steps
      if (dyn.stepT < dyn.steps[dyn.steps.length - 1].at) { dyn.stepT += dt; let prev = { f: 1, at: 0 };
        for (const s of dyn.steps) { if (dyn.stepT <= s.at) { const q = Math.min(1, (dyn.stepT - prev.at) / Math.max(0.01, s.at - prev.at)); dyn.f = prev.f + (s.f - prev.f) * Math.sin(q * Math.PI / 2); break; } prev = s; }
        if (dyn.stepT >= dyn.steps[dyn.steps.length - 1].at) dyn.f = DYN.grow;
        for (const [i, s] of [[0, 0.14], [2, 0.40], [4, 0.72]]) if (!dyn['g' + i] && dyn.stepT >= s) { dyn['g' + i] = 1; try { const b = B(); ownKick(0.25 + 0.15 * i); b.audio?.sfx?.('levelup'); b.fx.ring(p.x, p.y, 8, 90 + 55 * i, '#ff8aa6', 0.45, 4); } catch (_) {} }
      }
      applyScale();
      dyn.t -= dt; dyn.pulse -= dt;
      if (dyn.pulse <= 0) { dyn.pulse = DYN.pulse; dyn.n++; const big = dyn.n % 3 === 0;
        try { window.PS_FX.cast('maxwave', p, { id: 'max-' + dyn.type, type: dyn.type, dmg: (30 + 8 * (Number(p.level) || 1)) * (big ? 1.9 : 1), knock: big ? 260 : 140,
          fx: { radius: big ? 420 : 280, big, status: STATUS[dyn.type] || {}, pal: dyn.type, colors: ['#ffffff', '#ff6a8a', '#ff1a4a'] } }, window.__psHit || null, false); } catch (_) {} }
      if (dyn.t <= 0) stopDynamax();
    } else if (dyn.shrink > 0) { dyn.shrink = Math.max(0, dyn.shrink - dt); dyn.f = 1 + (dyn.shrinkFrom - 1) * (dyn.shrink / 0.35); applyScale(); if (dyn.shrink <= 0) { dyn.f = 1; applyScale(); for (const k of ['g0', 'g2', 'g4']) delete dyn[k]; } }
  }
  addEventListener('keydown', e => { if ((e.key === 'g' || e.key === 'G') && !e.repeat && !/input|textarea/i.test(e.target?.tagName || '')) startDynamax(); });

  // ---------------- UI ----------------
  const css = document.createElement('style');
  css.textContent = `
  #ps-q-btn{position:fixed;left:52px;bottom:10px;z-index:60;width:34px;height:34px;border-radius:50%;border:2px solid #9a7bf0;background:rgba(20,16,44,.88);color:#c9b6ff;font-size:17px;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(0,0,0,.4)}
  #ps-q-btn.battle{bottom:auto;top:10px}
  #ps-q-panel{position:fixed;left:10px;bottom:52px;z-index:61;display:none;min-width:250px;padding:10px 12px;border:2px solid #9a7bf0;border-radius:12px;background:rgba(18,14,40,.96);color:#fff;font:600 13px system-ui,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.5)}
  #ps-q-panel.battle{bottom:auto;top:52px}#ps-q-panel.open{display:block}
  #ps-q-panel h4{margin:0 0 8px;font-size:13px;letter-spacing:1px;text-transform:uppercase;color:#c9b6ff}
  #ps-q-panel label{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:5px 0;cursor:pointer}
  #ps-q-panel input{width:18px;height:18px;cursor:pointer;accent-color:#ff6fb5}
  #ps-q-panel small{display:block;color:#9fb1c9;font-weight:500;margin-top:6px;line-height:1.35}
  #ps-minimap{position:fixed;right:14px;top:122px;z-index:40;width:124px;height:124px;pointer-events:none;display:none;filter:drop-shadow(0 3px 8px rgba(0,0,0,.45))}
  #ps-fps{position:fixed;left:96px;top:16px;z-index:60;display:none;padding:2px 8px;border-radius:8px;background:rgba(0,0,0,.55);color:#9effa8;font:700 12px ui-monospace,monospace;pointer-events:none}
  #ps-dyn{position:fixed;right:20px;bottom:118px;z-index:45;display:none;padding:8px 14px;border-radius:14px;border:3px solid #fff;background:linear-gradient(135deg,#ff2a55,#a0103c);color:#fff;font:800 14px Pixelify,Fredoka,system-ui,sans-serif;letter-spacing:1px;cursor:pointer;box-shadow:0 0 0 3px rgba(255,40,90,.35),0 6px 18px rgba(0,0,0,.45);text-shadow:0 2px 0 rgba(80,0,20,.6)}
  #ps-dyn.ready{animation:psDyn 1.1s ease-in-out infinite}#ps-dyn.wait{filter:grayscale(.75);opacity:.75;cursor:default}
  @keyframes psDyn{50%{box-shadow:0 0 0 6px rgba(255,40,90,.55),0 0 26px rgba(255,40,90,.85)}}
  @media (max-width:700px){#ps-minimap{width:96px;height:96px;top:104px}}`;
  const btn = document.createElement('button'); btn.id = 'ps-q-btn'; btn.type = 'button'; btn.title = 'Game settings (minimap, FPS, effects)'; btn.textContent = '⚙';
  const panel = document.createElement('div'); panel.id = 'ps-q-panel';
  panel.innerHTML = '<h4>Game settings</h4>' +
    '<label>Minimap<input type="checkbox" data-k="minimap"></label>' +
    '<label>FPS counter<input type="checkbox" data-k="fps"></label>' +
    '<label>Reduce screen shake (base game only)<input type="checkbox" data-k="calm"></label>' +
    '<small>DYNAMAX: clear a Max Raid Den (red beam of light) to earn the Dynamax Band, then press <b>G</b> (or the red button) to go giant for 60 s. 4 min cooldown.</small>';
  const mm = document.createElement('canvas'); mm.id = 'ps-minimap'; mm.width = 248; mm.height = 248;
  const fpsEl = document.createElement('div'); fpsEl.id = 'ps-fps';
  const dynBtn = document.createElement('button'); dynBtn.id = 'ps-dyn'; dynBtn.type = 'button';
  [btn, panel, dynBtn].forEach(el => ['pointerdown', 'mousedown', 'touchstart', 'click'].forEach(ev => el.addEventListener(ev, e => e.stopPropagation())));
  btn.addEventListener('click', () => { Q.open = !Q.open; save(); render(); });
  panel.addEventListener('change', e => { const k = e.target?.dataset?.k; if (k) { Q[k] = !!e.target.checked; save(); render(); } });
  dynBtn.addEventListener('click', () => startDynamax());
  function render() {
    const battle = B()?.game?.state === 'playing';
    btn.classList.toggle('battle', battle); panel.classList.toggle('battle', battle); panel.classList.toggle('open', !!Q.open);
    panel.querySelectorAll('input[data-k]').forEach(i => { i.checked = !!Q[i.dataset.k]; });
    mm.style.display = Q.minimap && battle ? 'block' : 'none';
    fpsEl.style.display = Q.fps ? 'block' : 'none';
    const p = B()?.game?.player, lvl = Number(p?.level) || 1;
    if (!battle || !p) { dynBtn.style.display = 'none'; return; }
    dynBtn.style.display = 'block';
    if (dyn.active) { dynBtn.className = 'wait'; dynBtn.textContent = 'DYNAMAX ' + Math.ceil(dyn.t) + 's'; }
    else if (!p.__dynBand) { dynBtn.className = 'wait'; dynBtn.textContent = 'DYNAMAX · clear a Den'; }
    else if (dyn.cd > 0) { dynBtn.className = 'wait'; dynBtn.textContent = 'DYNAMAX ' + Math.floor(dyn.cd / 60) + ':' + String(Math.ceil(dyn.cd % 60)).padStart(2, '0'); }
    else { dynBtn.className = 'ready'; dynBtn.textContent = 'DYNAMAX (G)'; }
  }

  // ---------------- minimap ----------------
  const MM_RANGE = 700;
  function drawMinimap() {
    if (!Q.minimap || !playing()) return;
    const b = B(), e = E(), p = b?.game?.player; if (!p) return;
    const c = mm.getContext('2d'), W = mm.width, R = W / 2 - 6, cx = W / 2, cy = W / 2, s = R / MM_RANGE;
    c.clearRect(0, 0, W, W); c.save();
    c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.fillStyle = 'rgba(12,16,34,.78)'; c.fill(); c.clip();
    c.strokeStyle = 'rgba(255,255,255,.07)'; c.lineWidth = 2; for (const f of [0.33, 0.66]) { c.beginPath(); c.arc(cx, cy, R * f, 0, Math.PI * 2); c.stroke(); }
    const pos = (x, y) => [cx + (x - p.x) * s, cy + (y - p.y) * s];
    const inR = (x, y) => Math.hypot(x - p.x, y - p.y) < MM_RANGE;
    try { const W2 = b.world; if (W2) {
      for (const q of W2.propsInCircle(p.x, p.y, MM_RANGE)) if (q && q.type === 'chest' && q.hp > 0) { const [x, y] = pos(q.x, q.y); c.fillStyle = '#ffcf3a'; c.fillRect(x - 4, y - 4, 8, 8); }
      if (W2.specialsNear) for (const q of W2.specialsNear(p.x, p.y, MM_RANGE)) { const [x, y] = pos(q.x, q.y);
        if (q.type === 'bigchest' && !q.hoopaOpened) { c.fillStyle = '#ff9f1a'; c.fillRect(x - 6, y - 6, 12, 12); c.strokeStyle = '#fff'; c.lineWidth = 2; c.strokeRect(x - 6, y - 6, 12, 12); }
        else if (q.type === 'altar' && !q.used) { c.fillStyle = '#5ee0ff'; c.beginPath(); c.moveTo(x, y - 6); c.lineTo(x + 5, y); c.lineTo(x, y + 6); c.lineTo(x - 5, y); c.fill(); } } } } catch (_) {}
    try { const P = e && e.Pickups; if (P && P.all) for (const d of P.all()) { if (!d || !inR(d.x, d.y) || d.kind === 'xp') continue; const [x, y] = pos(d.x, d.y); c.fillStyle = d.kind === 'heal' ? '#ff7aa8' : d.kind === 'item' ? '#c9a6ff' : '#fff27a'; c.beginPath(); c.arc(x, y, 3, 0, Math.PI * 2); c.fill(); } } catch (_) {}
    try { const allies = [...(window.PS_FX && window.PS_FX.list ? window.PS_FX.list('minion') : []), ...((window.PS_HOOPA && window.PS_HOOPA.summons) || [])];
      for (const a of allies) { if (!a || a.dead || !inR(a.x, a.y)) continue; const [x, y] = pos(a.x, a.y); c.fillStyle = '#5fe08a'; c.beginPath(); c.arc(x, y, 3.5, 0, Math.PI * 2); c.fill(); } } catch (_) {}
    try { for (const en of b.enemies.all()) { if (!en || en.dead || !inR(en.x, en.y)) continue; const [x, y] = pos(en.x, en.y);
      if (en.boss || en.legend) { c.fillStyle = '#ff9a3d'; c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, 6, 0, Math.PI * 2); c.fill(); c.stroke(); }
      else { c.fillStyle = en.shiny ? '#ffe36a' : '#ff4d5e'; c.fillRect(x - 2.5, y - 2.5, 5, 5); } } } catch (_) {}
    // rift: shown on the map, or as an arrow at the edge when it is out of range
    try { const Rf = e && e.Rift; const rf = Rf && Rf.open && Rf.rift; if (rf) { const t = performance.now() / 300, d = Math.hypot(rf.x - p.x, rf.y - p.y);
      let [x, y] = pos(rf.x, rf.y); if (d > MM_RANGE * 0.92) { const a = Math.atan2(rf.y - p.y, rf.x - p.x); x = cx + Math.cos(a) * (R - 9); y = cy + Math.sin(a) * (R - 9); }
      c.fillStyle = '#c86bff'; c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, 6 + Math.sin(t) * 1.5, 0, Math.PI * 2); c.fill(); c.stroke(); } } catch (_) {}
    // you
    const a = Number(p.aim) || 0; c.translate(cx, cy); c.rotate(a); c.fillStyle = '#ffffff'; c.strokeStyle = '#1a1a2e'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(9, 0); c.lineTo(-6, -6); c.lineTo(-3, 0); c.lineTo(-6, 6); c.closePath(); c.fill(); c.stroke(); c.restore();
    c.lineWidth = 4; c.strokeStyle = '#c9a85a'; c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.stroke();
    c.fillStyle = '#ffd23f'; c.font = 'bold 16px system-ui,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('N', cx, 14);
  }

  // ---------------- loop ----------------
  let last = performance.now(), frames = 0, fpsT = 0, mmT = 0, uiT = 0;
  function loop(now) {
    requestAnimationFrame(loop);
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    wrapCamera(); wrapHooks(); buffMelee();
    try { tickDynamax(dt); } catch (e) { console.warn('[dynamax]', e); }
    frames++; fpsT += dt; if (fpsT >= 0.5) { fpsEl.textContent = Math.round(frames / fpsT) + ' FPS'; frames = 0; fpsT = 0; }
    mmT += dt; if (mmT >= 0.05) { mmT = 0; try { drawMinimap(); } catch (_) {} }
    uiT += dt; if (uiT >= 0.25) { uiT = 0; render(); }
  }
  function init() { document.head.append(css); document.body.append(btn, panel, mm, fpsEl, dynBtn); render(); requestAnimationFrame(loop); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
  window.PS_QUALITY = { dynamax: startDynamax, dynRecharge() { if (!dyn.active) dyn.cd = 0; }, get dyn() { return { active: dyn.active, t: dyn.t, cd: dyn.cd, f: dyn.f }; }, settings: Q };
})();
