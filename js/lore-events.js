/* LORE EVENTS — special Pokémon you meet the way they show up in the games.
   DEOXYS — "A meteor is falling!": a meteor streaks across the sky and crashes near you (big boom + shake).
     A strange glowing TRIANGLE appears in the crater. Touch it and it jumps somewhere else, like the Birth Island
     puzzle. Catch it 6 times (an arrow always points to it) and Deoxys descends: notification, cry, its theme.
     Defeat it before it flees to add it to your collection. 2% chance every 5 minutes of a run.
   MANAPHY / PHIONE EGG — "A mysterious egg washed ashore!": an egg appears by the water. Walk into it and it
     follows you; eggs hatch from walking (just like the games). Walk ~2,000 steps with it and it hatches:
     Phione (75%) or Manaphy (25%), straight into your collection. 2% chance every 5 minutes, needs water nearby.
   Solo only; not in the Legendary Den mode. LoverGare's test panel gets "Deoxys meteor" and "Mystery egg". */
(() => {
  'use strict';
  if (window.PS_LORE_INSTALLED) return; window.PS_LORE_INSTALLED = true;
  const B = () => window.PS_MEGA_BRIDGE_V5, E = () => window.PS_HOOPA_ENGINE;
  const TAU = Math.PI * 2;
  const CFG = { every: 300, deoxys: 0.02, egg: 0.02, triangleHops: 6, triangleLife: 150, eggSteps: 2000, stepPx: 4 };
  const clock = () => { try { const t = E().Game.time; return Number(typeof t === 'function' ? t() : t) || 0; } catch (_) { return 0; } };
  const say = (t, d) => { try { E().Spawner.say(t, d || 3); } catch (_) {} };
  const toast = (t, s, o) => { try { window.PS_TOAST && window.PS_TOAST(t, s, o); } catch (_) {} };
  const sfx = n => { try { B().audio?.sfx?.(n); } catch (_) {} };
  const ok = () => { const N = E(); return !!N && !(N.Coop && N.Coop.active) && !(window.PS_MODES && window.PS_MODES.run && window.PS_MODES.run.mode === 'legend') && !(N.Rift && N.Rift.inArena) && !(window.PS_SAFEZONE && window.PS_SAFEZONE.active); };
  function cry(dex) { try { let v = 0.6; const st = E().Audio && E().Audio.settings; if (st && st.sfx != null) v = Number(st.sfx) > 1 ? Number(st.sfx) / 100 : Number(st.sfx); const a = new Audio('assets/cries/' + dex + '.mp3'); a.volume = Math.max(0, Math.min(1, v * 0.3)); a.play().catch(() => {}); } catch (_) {} }
  function freeSpot(p, dmin, dmax) { const W = B()?.world; for (let i = 0; i < 80; i++) { const a = Math.random() * TAU, d = dmin + Math.random() * (dmax - dmin), x = p.x + Math.cos(a) * d, y = p.y + Math.sin(a) * d * 0.8; try { if (W && W.isFree && !W.isFree(x, y, 24)) continue; } catch (_) {} return [x, y]; } return [p.x + dmin, p.y]; }
  function grant(dex, shiny) { const N = E(); try { if (typeof N.DB.grant === 'function') N.DB.grant(dex); else N.DB.save.owned[dex] = { at: Date.now(), from: 'event' }; } catch (_) { try { N.DB.save.owned[dex] = { at: Date.now(), from: 'event' }; } catch (__) {} }
    if (shiny) { try { if (typeof N.DB.grantShiny === 'function') N.DB.grantShiny(dex); else N.DB.save.shiny[dex] = { at: Date.now(), from: 'event' }; } catch (_) {} } try { N.DB.commit(); } catch (_) {} }

  // ================= DEOXYS =================
  let dx = null;   // {phase:'meteor'|'puzzle', t, x, y, hops, sx, sy}
  function startDeoxys() {
    const p = B()?.game?.player; if (!p || dx) return false; const [x, y] = freeSpot(p, 170, 280);
    dx = { phase: 'meteor', t: 0, x, y, hops: 0, life: CFG.triangleLife };
    say('A meteor is falling from the sky!', 3); sfx('toll'); return true;
  }
  function deoxysTick(dt) {
    if (!dx) return; const p = B().game.player; dx.t += dt;
    if (dx.phase === 'meteor') { if (dx.t >= 2.6) { dx.phase = 'puzzle'; dx.t = 0;
      sfx('quake'); setTimeout(() => sfx('boss'), 120); try { B().camera?.kick?.(1); B().fx.ring(dx.x, dx.y, 10, 260, '#ffb070', 0.8, 9); B().fx.ring(dx.x, dx.y, 10, 160, '#ffffff', 0.6, 6); B().fx.burst(dx.x, dx.y, '#ffb070', 50, 360); B().fx.burst(dx.x, dx.y, '#9a7cff', 30, 260); } catch (_) {}
      for (const e of B().enemies.all()) if (e && !e.dead && !e.boss && Math.hypot(e.x - dx.x, e.y - dx.y) < 160) { try { e.hurt(e.maxHp * 0.6, '#ffb070', 0, 0, 300); } catch (_) {} }
      say('Something strange is glowing in the crater...', 3); } return; }
    dx.life -= dt; if (dx.life <= 0) { say('The strange triangle faded away...', 2.5); dx = null; return; }
    if (dx.t > 0.6 && Math.hypot(p.x - dx.x, p.y - dx.y) < 36) {
      dx.hops++; sfx('star'); try { B().fx.ring(dx.x, dx.y, 8, 90, '#c47bff', 0.5, 5); } catch (_) {}
      if (dx.hops >= CFG.triangleHops) {   // puzzle solved
        const x = dx.x, y = dx.y; dx = null; say('The triangle shatters... a presence from space descends!', 3); sfx('judge');
        setTimeout(() => { try { const e = window.PS_ROAMERS && window.PS_ROAMERS.spawn(386, 'roam'); if (e) { e.x = x; e.y = y; } } catch (err) { console.warn('[lore]', err); } }, 1600);
        return; }
      const [nx, ny] = freeSpot(p, 320, 620); dx.x = nx; dx.y = ny; dx.t = 0; say('The triangle moved! ' + dx.hops + ' / ' + CFG.triangleHops, 1.6);
    }
  }

  // ================= MANAPHY / PHIONE EGG =================
  let egg = null;   // {x,y,carried,steps,lx,ly,t}
  function waterSpot(p) { const W = B()?.world; if (!W || !W.isLiquid) return null;
    for (let i = 0; i < 400; i++) { const a = Math.random() * TAU, d = 200 + Math.random() * 700, x = p.x + Math.cos(a) * d, y = p.y + Math.sin(a) * d;
      if (!W.isLiquid(x, y)) continue; for (let s = 0; s < 16; s++) { const b = s / 16 * TAU, sx = x + Math.cos(b) * 60, sy = y + Math.sin(b) * 60; if (!W.isLiquid(sx, sy) && W.isFree(sx, sy, 18)) return [sx, sy]; } } return null; }
  function startEgg(force) {
    const p = B()?.game?.player; if (!p || egg) return false; let s = waterSpot(p); if (!s) { if (!force) return false; s = freeSpot(p, 200, 320); }
    egg = { x: s[0], y: s[1], carried: false, steps: CFG.eggSteps, t: 0 }; say('A mysterious egg washed ashore!', 3); sfx('ball'); return true;
  }
  function eggTick(dt) {
    if (!egg) return; const p = B().game.player; egg.t += dt;
    if (!egg.carried) { if (egg.t > 0.5 && Math.hypot(p.x - egg.x, p.y - egg.y) < 34) { egg.carried = true; egg.lx = p.x; egg.ly = p.y; sfx('confirm'); toast('You picked up a Mystery Egg', 'Eggs hatch by walking — keep moving with it!', { icon: 'luckyegg' }); } return; }
    const d = Math.hypot(p.x - egg.lx, p.y - egg.ly); egg.lx = p.x; egg.ly = p.y; if (d < 200) egg.steps -= d / CFG.stepPx;
    const a = Math.atan2(egg.y - p.y, egg.x - p.x), tx = p.x + Math.cos(a) * 34, ty = p.y + Math.sin(a) * 22; egg.x += (tx - egg.x) * Math.min(1, dt * 6); egg.y += (ty - egg.y) * Math.min(1, dt * 6);
    if (egg.steps <= 0) {
      const dex = Math.random() < 0.25 ? 490 : 489, N = E(), name = (N.DEX_BY[dex] || {}).name || (dex === 490 ? 'Manaphy' : 'Phione');
      let shiny = false; try { shiny = N.Sprites.hasShiny(dex) && Math.random() < (Number(N.Spawner.SHINY_RATE) || 1 / 4096) * (p.item === 'shinycharm' ? 3 : 1); } catch (_) {}
      grant(dex, shiny); cry(dex); sfx(shiny ? 'shinyGet' : 'levelup'); try { B().fx.ring(egg.x, egg.y, 8, 120, '#7fd8ff', 0.7, 7); B().fx.burst(egg.x, egg.y - 10, '#bfefff', 40, 240); } catch (_) {}
      say('Oh? The egg hatched into ' + (shiny ? 'a shiny ' : '') + name + '!', 3.5); toast((shiny ? 'Shiny ' : '') + name + ' hatched!', 'It joined your collection', { dex, shiny, gold: true, ms: 7000 });
      egg = null;
    }
  }

  // ================= drawing =================
  const ov = document.createElement('canvas'); ov.id = 'ps-lore'; ov.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;pointer-events:none;z-index:18;display:none';
  function gameCanvas() { let b = null, ar = 0; for (const c of document.querySelectorAll('canvas')) { if (c.id && c.id.startsWith('ps-')) continue; const r = c.getBoundingClientRect(), a = r.width * r.height; if (a > ar) { ar = a; b = { c, r }; } } return b; }
  function arrow(ctx, X, Y, W, H, col, text) { const m = 46, top = 116, bot = H - 126; if (X > m && X < W - m && Y > top && Y < bot) return;
    const cx = W / 2, cy = (top + bot) / 2, dx2 = X - cx, dy2 = Y - cy, t = Math.min(Math.abs(dx2) > 1e-3 ? (W / 2 - m) / Math.abs(dx2) : 1e9, Math.abs(dy2) > 1e-3 ? ((bot - top) / 2) / Math.abs(dy2) : 1e9), ax = cx + dx2 * t, ay = cy + dy2 * t, a = Math.atan2(dy2, dx2), pu = 0.5 + 0.5 * Math.sin(performance.now() / 120);
    ctx.save(); ctx.translate(ax, ay); ctx.globalAlpha = 0.2 + 0.25 * pu; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(0, 0, 26 + 6 * pu, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; ctx.fillStyle = pu > 0.5 ? '#fff3c8' : col; ctx.beginPath(); ctx.moveTo(34 * Math.cos(a), 34 * Math.sin(a)); ctx.lineTo(17 * Math.cos(a + 2.45), 17 * Math.sin(a + 2.45)); ctx.lineTo(17 * Math.cos(a - 2.45), 17 * Math.sin(a - 2.45)); ctx.closePath(); ctx.fill();
    ctx.font = '700 15px Pixelify, system-ui, sans-serif'; ctx.textAlign = Math.cos(a) > 0.3 ? 'right' : Math.cos(a) < -0.3 ? 'left' : 'center'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.85)'; ctx.lineJoin = 'round'; const tx = 30 * -Math.cos(a), ty = 26 * -Math.sin(a) + 4; ctx.strokeText(text, tx, ty); ctx.fillStyle = col; ctx.fillText(text, tx, ty); ctx.restore(); }
  function label(ctx, X, Y, t, col) { ctx.save(); ctx.font = '700 14px Pixelify, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.85)'; ctx.lineJoin = 'round'; ctx.strokeText(t, X, Y); ctx.fillStyle = col; ctx.fillText(t, X, Y); ctx.restore(); }
  function draw() {
    const st = B()?.game?.state; if ((!dx && !egg) || st === 'ui' || st === 'over' || (window.PS_SAFEZONE && window.PS_SAFEZONE.active)) { if (ov.style.display !== 'none') ov.style.display = 'none'; return; }
    ov.style.display = 'block'; const ctx = ov.getContext('2d'), dpr = Math.min(2, devicePixelRatio || 1), W = innerWidth, H = innerHeight;
    if (ov.width !== Math.round(W * dpr) || ov.height !== Math.round(H * dpr)) { ov.width = Math.round(W * dpr); ov.height = Math.round(H * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    const cam = B()?.camera, g = gameCanvas(); if (!cam || !g || typeof cam.left !== 'function') return;
    const k = cam.scale * (Number(cam._cw) > 0 ? g.r.width / cam._cw : 1), now = performance.now() / 1000, sx = x => g.r.left + (x - cam.left()) * k, sy = y => g.r.top + (y - cam.top()) * k, p = B().game.player;
    if (dx) { const X = sx(dx.x), Y = sy(dx.y);
      if (dx.phase === 'meteor') { const u = Math.min(1, dx.t / 2.6), mx = X - (1 - u) * 260, my = Y - (1 - u) * (Y + 160), r = 14 * k + 10;
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; const tl = ctx.createLinearGradient(mx, my, mx - 200, my - 380); tl.addColorStop(0, 'rgba(255,190,120,.95)'); tl.addColorStop(1, 'rgba(160,120,255,0)'); ctx.strokeStyle = tl; ctx.lineWidth = r * 1.7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(mx - 200, my - 380); ctx.stroke();
        const gr = ctx.createRadialGradient(mx, my, 0, mx, my, r * 2.6); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.4, 'rgba(255,170,90,.9)'); gr.addColorStop(1, 'rgba(255,120,60,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(mx, my, r * 2.6, 0, TAU); ctx.fill(); ctx.restore();
        ctx.save(); ctx.strokeStyle = 'rgba(255,90,60,' + (0.4 + 0.4 * Math.sin(now * 14)) + ')'; ctx.lineWidth = 3; ctx.setLineDash([8, 6]); ctx.beginPath(); ctx.ellipse(X, Y, 160 * k * u, 70 * k * u, 0, 0, TAU); ctx.stroke(); ctx.restore(); }
      else { // crater + glowing triangle
        if (dx.hops === 0) { ctx.save(); ctx.fillStyle = 'rgba(40,25,30,.55)'; ctx.beginPath(); ctx.ellipse(X, Y + 4 * k, 70 * k, 28 * k, 0, 0, TAU); ctx.fill(); ctx.restore(); }
        const s = 22 * k, bob = Math.sin(now * 3) * 4 * k, rot = now * 0.8; ctx.save(); ctx.translate(X, Y - 24 * k + bob);
        ctx.globalCompositeOperation = 'lighter'; const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 2.6); gr.addColorStop(0, 'rgba(196,123,255,.55)'); gr.addColorStop(1, 'rgba(196,123,255,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, s * 2.6, 0, TAU); ctx.fill(); ctx.globalCompositeOperation = 'source-over';
        ctx.rotate(Math.sin(rot) * 0.25); ctx.beginPath(); for (let i = 0; i < 3; i++) { const a = -Math.PI / 2 + i * TAU / 3; ctx.lineTo(Math.cos(a) * s, Math.sin(a) * s); } ctx.closePath();
        const tg = ctx.createLinearGradient(0, -s, 0, s); tg.addColorStop(0, '#ffe9a8'); tg.addColorStop(0.5, '#ff9a3d'); tg.addColorStop(1, '#c43c6a'); ctx.fillStyle = tg; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#2a1030'; ctx.stroke();
        ctx.fillStyle = '#7fe6ff'; ctx.beginPath(); ctx.arc(0, s * 0.12, s * 0.22, 0, TAU); ctx.fill(); ctx.restore();
        label(ctx, X, Y - 56 * k, 'Strange Triangle · ' + dx.hops + '/' + CFG.triangleHops, '#c9a6ff');
        if (p) arrow(ctx, X, Y - 20 * k, W, H, '#c47bff', 'TRIANGLE · ' + Math.round(Math.hypot(dx.x - p.x, dx.y - p.y) / 32) + ' m'); } }
    if (egg) { const X = sx(egg.x), Y = sy(egg.y), s = 13 * k, wob = egg.carried ? Math.sin(now * 8) * 0.12 : Math.sin(now * 2) * 0.05;
      ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(X, Y + 2, s * 1.1, s * 0.4, 0, 0, TAU); ctx.fill();
      ctx.translate(X, Y - s * 1.2); ctx.rotate(wob); const eg = ctx.createRadialGradient(-s * 0.3, -s * 0.4, s * 0.1, 0, 0, s * 1.4); eg.addColorStop(0, '#e6fbff'); eg.addColorStop(0.55, '#6ccdf5'); eg.addColorStop(1, '#2a72c8');
      ctx.fillStyle = eg; ctx.strokeStyle = '#123a6a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, 0, s, s * 1.3, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ff4d6a'; ctx.beginPath(); ctx.arc(0, s * 0.1, s * 0.35, 0, TAU); ctx.fill(); ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(0, s * 0.1, s * 0.14, 0, TAU); ctx.fill(); ctx.restore();
      if (!egg.carried) { label(ctx, X, Y - s * 3, 'Mystery Egg', '#7fd8ff'); if (p) arrow(ctx, X, Y - 10, W, H, '#7fd8ff', 'EGG · ' + Math.round(Math.hypot(egg.x - p.x, egg.y - p.y) / 32) + ' m'); }
      else label(ctx, X, Y - s * 3.2, Math.max(0, Math.ceil(egg.steps)) + ' steps', '#bfefff'); }
  }
  // test buttons
  function testBtns() { const t = document.getElementById('ps-sz-test'); if (!t || t.querySelector('[data-deoxys]')) return;
    const a = document.createElement('button'); a.dataset.deoxys = '1'; a.textContent = 'Deoxys meteor'; a.addEventListener('click', e => { e.stopPropagation(); startDeoxys(); }); t.appendChild(a);
    const b = document.createElement('button'); b.dataset.egg = '1'; b.textContent = 'Mystery egg'; b.addEventListener('click', e => { e.stopPropagation(); startEgg(true); }); t.appendChild(b); }
  let last = performance.now(), runP = null, nextAt = CFG.every, ui = 0;
  function loop(now) { requestAnimationFrame(loop); const dt = Math.min(0.1, (now - last) / 1000); last = now;
    try { const g = B()?.game, p = g?.player;
      if (!p || g.state === 'ui' || g.state === 'over') { dx = null; egg = null; runP = null; }
      else { if (p !== runP) { runP = p; dx = null; egg = null; nextAt = CFG.every; }
        if (g.state === 'playing' && ok()) { const t = clock(); if (t >= nextAt) { nextAt += CFG.every; if (Math.random() < CFG.deoxys) startDeoxys(); else if (Math.random() < CFG.egg) startEgg(false); } deoxysTick(dt); eggTick(dt); } }
      draw(); ui += dt; if (ui > 0.5) { ui = 0; testBtns(); } } catch (e) { console.warn('[lore]', e); } }
  function init() { document.body.append(ov); requestAnimationFrame(loop); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
  window.PS_LORE = { deoxys: startDeoxys, egg: startEgg, cfg: CFG, get state() { return { deoxys: dx && { phase: dx.phase, hops: dx.hops, x: dx.x, y: dx.y }, egg: egg && { carried: egg.carried, steps: egg.steps, x: egg.x, y: egg.y } }; } };
})();
