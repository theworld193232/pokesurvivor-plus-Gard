/* LORE EVENTS — special Pokémon you meet the way they show up in the games.
   (Deoxys is no longer here: Birth Island, js/birth-island.js, is the only way to get it.)
   MANAPHY / PHIONE EGG — "A mysterious egg washed ashore!": an egg appears by the water. Walk into it and it
     follows you; eggs hatch from walking (just like the games). Walk ~2,000 steps with it and it hatches:
     Phione (75%) or Manaphy (25%), straight into your collection. 2% chance every 5 minutes, needs water nearby.
   Solo only; not in the Legendary Den mode. LoverGare's test panel gets "Mystery egg". */
(() => {
  'use strict';
  if (window.PS_LORE_INSTALLED) return; window.PS_LORE_INSTALLED = true;
  const B = () => window.PS_MEGA_BRIDGE_V5, E = () => window.PS_HOOPA_ENGINE;
  const TAU = Math.PI * 2;
  const CFG = { every: 300, egg: 0.02, eggSteps: 2000, stepPx: 4 };
  const clock = () => { try { const t = E().Game.time; return Number(typeof t === 'function' ? t() : t) || 0; } catch (_) { return 0; } };
  const say = (t, d) => { try { E().Spawner.say(t, d || 3); } catch (_) {} };
  const toast = (t, s, o) => { try { window.PS_TOAST && window.PS_TOAST(t, s, o); } catch (_) {} };
  const sfx = n => { try { B().audio?.sfx?.(n); } catch (_) {} };
  const ok = () => { const N = E(); return !!N && !(N.Coop && N.Coop.active) && !(window.PS_MODES && window.PS_MODES.run && window.PS_MODES.run.mode === 'legend') && !(N.Rift && N.Rift.inArena) && !(window.PS_SAFEZONE && window.PS_SAFEZONE.active); };
  function cry(dex) { try { let v = 0.6; const st = E().Audio && E().Audio.settings; if (st && st.sfx != null) v = Number(st.sfx) > 1 ? Number(st.sfx) / 100 : Number(st.sfx); const a = new Audio('assets/cries/' + dex + '.mp3'); a.volume = Math.max(0, Math.min(1, v * 0.3)); a.play().catch(() => {}); } catch (_) {} }
  function freeSpot(p, dmin, dmax) { const W = B()?.world; for (let i = 0; i < 80; i++) { const a = Math.random() * TAU, d = dmin + Math.random() * (dmax - dmin), x = p.x + Math.cos(a) * d, y = p.y + Math.sin(a) * d * 0.8; try { if (W && W.isFree && !W.isFree(x, y, 24)) continue; } catch (_) {} return [x, y]; } return [p.x + dmin, p.y]; }
  function grant(dex, shiny) { const N = E(); try { if (typeof N.DB.grant === 'function') N.DB.grant(dex); else N.DB.save.owned[dex] = { at: Date.now(), from: 'event' }; } catch (_) { try { N.DB.save.owned[dex] = { at: Date.now(), from: 'event' }; } catch (__) {} }
    if (shiny) { try { if (typeof N.DB.grantShiny === 'function') N.DB.grantShiny(dex); else N.DB.save.shiny[dex] = { at: Date.now(), from: 'event' }; } catch (_) {} } try { N.DB.commit(); } catch (_) {} }

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
    const st = B()?.game?.state; if (!egg || st === 'ui' || st === 'over' || (window.PS_SAFEZONE && window.PS_SAFEZONE.active)) { if (ov.style.display !== 'none') ov.style.display = 'none'; return; }
    ov.style.display = 'block'; const ctx = ov.getContext('2d'), dpr = Math.min(2, devicePixelRatio || 1), W = innerWidth, H = innerHeight;
    if (ov.width !== Math.round(W * dpr) || ov.height !== Math.round(H * dpr)) { ov.width = Math.round(W * dpr); ov.height = Math.round(H * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    const cam = B()?.camera, g = gameCanvas(); if (!cam || !g || typeof cam.left !== 'function') return;
    const k = cam.scale * (Number(cam._cw) > 0 ? g.r.width / cam._cw : 1), now = performance.now() / 1000, sx = x => g.r.left + (x - cam.left()) * k, sy = y => g.r.top + (y - cam.top()) * k, p = B().game.player;
    if (egg) { const X = sx(egg.x), Y = sy(egg.y), s = 13 * k, wob = egg.carried ? Math.sin(now * 8) * 0.12 : Math.sin(now * 2) * 0.05;
      ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(X, Y + 2, s * 1.1, s * 0.4, 0, 0, TAU); ctx.fill();
      ctx.translate(X, Y - s * 1.2); ctx.rotate(wob); const eg = ctx.createRadialGradient(-s * 0.3, -s * 0.4, s * 0.1, 0, 0, s * 1.4); eg.addColorStop(0, '#e6fbff'); eg.addColorStop(0.55, '#6ccdf5'); eg.addColorStop(1, '#2a72c8');
      ctx.fillStyle = eg; ctx.strokeStyle = '#123a6a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, 0, s, s * 1.3, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ff4d6a'; ctx.beginPath(); ctx.arc(0, s * 0.1, s * 0.35, 0, TAU); ctx.fill(); ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(0, s * 0.1, s * 0.14, 0, TAU); ctx.fill(); ctx.restore();
      if (!egg.carried) { label(ctx, X, Y - s * 3, 'Mystery Egg', '#7fd8ff'); if (p) arrow(ctx, X, Y - 10, W, H, '#7fd8ff', 'EGG · ' + Math.round(Math.hypot(egg.x - p.x, egg.y - p.y) / 32) + ' m'); }
      else label(ctx, X, Y - s * 3.2, Math.max(0, Math.ceil(egg.steps)) + ' steps', '#bfefff'); }
  }
  // test buttons
  function testBtns() { const t = document.getElementById('ps-sz-test'); if (!t || t.querySelector('[data-egg]')) return;
    const b = document.createElement('button'); b.dataset.egg = '1'; b.textContent = 'Mystery egg'; b.addEventListener('click', e => { e.stopPropagation(); startEgg(true); }); t.appendChild(b); }
  let last = performance.now(), runP = null, nextAt = CFG.every, ui = 0;
  function loop(now) { requestAnimationFrame(loop); const dt = Math.min(0.1, (now - last) / 1000); last = now;
    try { const g = B()?.game, p = g?.player;
      if (!p || g.state === 'ui' || g.state === 'over') { egg = null; runP = null; }
      else { if (p !== runP) { runP = p; egg = null; nextAt = CFG.every; }
        if (g.state === 'playing' && ok()) { const t = clock(); if (t >= nextAt) { nextAt += CFG.every; if (Math.random() < CFG.egg) startEgg(false); } eggTick(dt); } }
      draw(); ui += dt; if (ui > 0.5) { ui = 0; testBtns(); } } catch (e) { console.warn('[lore]', e); } }
  function init() { document.body.append(ov); requestAnimationFrame(loop); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
  window.PS_LORE = { egg: startEgg, cfg: CFG, get state() { return { egg: egg && { carried: egg.carried, steps: egg.steps, x: egg.x, y: egg.y } }; } };
})();
