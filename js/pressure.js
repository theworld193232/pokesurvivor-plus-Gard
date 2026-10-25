/* PROJECTILES & PRESSURE (feedback items 2 and 4)
   Item 2, readable ranged attacks:
     - Enemy shots on screen are capped (10 at the start, growing to 22 by 20 min). When the cap is reached,
       shooters hold their fire for a moment instead of filling the screen.
     - First 5 minutes: ranged enemies fire 35% less often (early runs get swarmed less by bullets).
     - Enemy shots use their native move effects; no separate red-circle overlay.
   Item 4, no more "run in circles forever":
     - The game stops spawning at 64 enemies. If the field stays full for 8 s, extra enemies keep arriving in front
       of you (up to 24 over the limit), and enemies you've left far behind for over a minute are moved back in front of you.
     - Combo: KOs within 2.5 s of each other build a combo. Reaching 15 / 30 / 60 / 100 pays 10 / 25 / 60 / 120 PokéCoins.
   Solo only (co-op unchanged). Not in the Legendary Den mode. */
(() => {
  'use strict';
  if (window.PS_PRESSURE_INSTALLED) return; window.PS_PRESSURE_INSTALLED = true;
  const B = () => window.PS_MEGA_BRIDGE_V5, E = () => window.PS_HOOPA_ENGINE;
  const TAU = Math.PI * 2;
  const clock = () => { try { const t = E().Game.time; return Number(typeof t === 'function' ? t() : t) || 0; } catch (_) { return 0; } };
  const solo = () => { const N = E(); return !!N && !(N.Coop && N.Coop.active) && !(window.PS_MODES && window.PS_MODES.run && window.PS_MODES.run.mode === 'legend') && !(N.Rift && N.Rift.inArena) && !(window.PS_SAFEZONE && window.PS_SAFEZONE.active); };
  const CFG = { capStart: 10, capLate: 22, capRampEnd: 1200, early: 300, earlyMul: 1.35, fullFor: 8, overflow: 24, trickle: 2.5, staleAfter: 60, staleDist: 700 };
  const COMBO = { gap: 2.5, steps: [[15, 10], [30, 25], [60, 60], [100, 120]] };
  let runP = null, fullT = 0, trickleT = 0, combo = 0, comboT = 0, comboPaid = 0, best = 0;
  const hostile = () => (E()?.Projectiles?.all?.() || []).filter(q => q && !q.friendly && !q.orb);

  function shotsTick(dt) {
    const N = E(), p = B().game.player, t = clock(), all = N.EnemyMgr.all();
    const cap = Math.round(CFG.capStart + (CFG.capLate - CFG.capStart) * Math.min(1, t / CFG.capRampEnd));
    const near = hostile().filter(q => Math.abs(q.x - p.x) < 900 && Math.abs(q.y - p.y) < 600).length, full = near >= cap;
    for (const e of all) { if (!e || e.dead || e.remote || !e.def || !e.def.shotCd) continue;
      const cd = Number(e.shotCd) || 0;
      if (t < CFG.early && e.__lastCd != null && cd > e.__lastCd + 0.05 && !e.__slowed) { e.shotCd = cd * CFG.earlyMul; e.__slowed = true; }   // it just fired: stretch the wait
      if (cd > 0.05) e.__slowed = false;
      if (full && e.shotCd < 0.35) e.shotCd = 0.35 + Math.random() * 0.5;   // hold fire while the screen is busy
      e.__lastCd = e.shotCd;
    }
  }
  function capTick(dt) {
    const N = E(), S = N.Spawner, p = B().game.player, all = N.EnemyMgr.all(), cap = Number(S && S.CAP) || 64, t = performance.now() / 1000;
    const alive = all.filter(e => e && !e.dead && !e.remote);
    if (alive.length >= cap - 1) fullT += dt; else fullT = 0;
    // stragglers left far behind for a long time come back in front of you
    for (const e of alive) { if (e.boss || e.legend || e.__maxRaid || e.__roamer || e.__wave) continue; if (!e.__born) e.__born = t;
      if (t - e.__born > CFG.staleAfter && Math.hypot(e.x - p.x, e.y - p.y) > CFG.staleDist && !(e.__moved > t)) { try { if (S.ahead(e, p)) { e.__moved = t + 20; e.__born = t; } } catch (_) {} } }
    if (fullT >= CFG.fullFor && alive.length < cap + CFG.overflow) { trickleT -= dt; if (trickleT <= 0) { trickleT = CFG.trickle; extra(alive, p); } }
  }
  function extra(alive, p) {
    const N = E(), src = alive.filter(e => !e.boss && e.def && !e.__wave); const d = src[Math.floor(Math.random() * src.length)]; if (!d) return;
    const a = Math.hypot(p._vx || 0, p._vy || 0) > 20 ? Math.atan2(p._vy, p._vx) + (Math.random() - 0.5) * 0.9 : Math.random() * TAU, r = 460 + Math.random() * 80;
    const x = p.x + Math.cos(a) * r, y = p.y + Math.sin(a) * r * 0.8; try { const W = B().world; if (W && W.isFree && !W.isFree(x, y, 16)) return; } catch (_) {}
    try { const sc = N.Enemies.scale(clock()); const e = new N.Enemy(Object.assign({}, d.def), x, y, sc, false); N.EnemyMgr.add(e); } catch (_) {}
  }
  // combo
  function onKill(e) { if (!e || e.remote || !solo()) return; combo++; comboT = COMBO.gap; best = Math.max(best, combo);
    for (const [n, c] of COMBO.steps) if (combo === n && comboPaid < n) { comboPaid = n; const p = B()?.game?.player; if (p) { p.coins = (Number(p.coins) || 0) + c; try { B().fx.dmgText(p.x, p.y - (p.bodyH || 40) - 26, 'Combo ×' + n + '! +' + c, '#ffd23f'); B().audio?.sfx?.('coin'); } catch (_) {} } } }
  let wrapped = false;
  function wrap() { const P = E()?.Progress; if (wrapped || !P || typeof P.kill !== 'function') return; wrapped = true; const k = P.kill; P.kill = function (e, ...a) { try { onKill(e); } catch (_) {} return k.call(this, e, ...a); }; }
  // HUD chip
  const css = document.createElement('style');
  css.textContent = `#ps-combo{position:fixed;left:12px;top:138px;z-index:24;display:none;padding:3px 12px !important;font-size:15px;pointer-events:none;animation:none !important;overflow:visible !important;white-space:nowrap}
  #ps-combo b{color:var(--gold);font-size:19px}#ps-combo.hot b{color:#ff8a3d}`;
  const chip = document.createElement('div'); chip.id = 'ps-combo'; chip.className = 'box';
  let lastChip = '';
  function renderChip() { if (combo < 5 || !solo() || B()?.game?.state !== 'playing') { if (chip.style.display !== 'none') chip.style.display = 'none'; lastChip = ''; return; }
    const h = 'Combo <b>×' + combo + '</b>'; if (h !== lastChip) { chip.innerHTML = h; lastChip = h; } chip.classList.toggle('hot', combo >= 30); chip.style.display = 'block'; }
  let last = performance.now(), ui = 0;
  function loop(now) { requestAnimationFrame(loop); const dt = Math.min(0.1, (now - last) / 1000); last = now;
    try { wrap(); const g = B()?.game, p = g?.player;
      if (!p || g.state === 'ui' || g.state === 'over') { runP = null; combo = 0; } else {
        if (p !== runP) { runP = p; fullT = 0; combo = 0; comboPaid = 0; best = 0; }
        if (g.state === 'playing') { comboT -= dt; if (comboT <= 0 && combo) { combo = 0; comboPaid = 0; } if (solo()) { shotsTick(dt); capTick(dt); } } }
      ui += dt; if (ui > 0.15) { ui = 0; renderChip(); } } catch (e) { console.warn('[pressure]', e); } }
  function init() { document.head.append(css); document.body.append(chip); requestAnimationFrame(loop); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
  window.PS_PRESSURE = { cfg: CFG, get combo() { return combo; }, get best() { return best; }, get fullT() { return fullT; } };
})();
