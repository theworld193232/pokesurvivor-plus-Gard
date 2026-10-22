/* TIME ORBS — defeated enemies sometimes drop an orb that fast-forwards the run clock, so you reach Arceus sooner.
     small  (blue)   +15 seconds   5% of KOs
     medium (purple) +1 minute     1%
     large  (gold)   +5 minutes    0.1%
   At most 30 orbs drop per run. Walk over one to take it; they vanish after 30 s.
   The time is added gradually over a few seconds (bosses and events keep up normally); the run timer shows it too.
   Once Arceus's Judgment begins, any fast-forward left over is dropped so the final fight plays normally.
   Solo runs only; not in the Legendary Den mode. */
(() => {
  'use strict';
  if (window.PS_TIMEORBS_INSTALLED) return; window.PS_TIMEORBS_INSTALLED = true;
  const B = () => window.PS_MEGA_BRIDGE_V5, E = () => window.PS_HOOPA_ENGINE;
  const TAU = Math.PI * 2;
  const TIERS = [   // checked rarest first
    { sec: 300, chance: 0.001, col: '#ffd23f', glow: '255,210,63', r: 13, name: '+5:00' },
    { sec: 60, chance: 0.01, col: '#c47bff', glow: '196,123,255', r: 10, name: '+1:00' },
    { sec: 15, chance: 0.05, col: '#5fb4ff', glow: '95,180,255', r: 8, name: '+0:15' },
  ];
  const CFG = { maxPerRun: 30, life: 30, pickR: 34, skipRate: 60 };   // skipRate: run-seconds added per real second while catching up
  const orbs = []; let pending = 0, dropped = 0, runP = null;
  const ok = () => { const N = E(); return !!N && !(N.Coop && N.Coop.active) && !(window.PS_MODES && window.PS_MODES.run && window.PS_MODES.run.mode === 'legend'); };
  // the game adds this to its run clock each frame
  window.PS_TIME_ADD = function (dt) { if (pending <= 0) return 0;
    try { const N = E(); if (N.Judgment && N.Judgment.active) { pending = 0; return 0; } } catch (_) {} /* Arceus is here: the fast-forward stops */ const a = Math.min(pending, CFG.skipRate * (Number(dt) || 0)); pending -= a; return a; };
  function onKill(e) {
    try {
      if (!e || e.remote || e.__timeOrb || !ok() || dropped >= CFG.maxPerRun) return; e.__timeOrb = true;
      const r = Math.random(); let acc = 0;
      for (const t of TIERS) { acc += t.chance; if (r < acc) { orbs.push({ x: e.x, y: e.y, t: 0, tier: t, vy: -60 }); dropped++; return; } }
    } catch (_) {}
  }
  let wrapped = false;
  function wrap() { const P = E()?.Progress; if (wrapped || !P || typeof P.kill !== 'function') return; wrapped = true; const k = P.kill; P.kill = function (e, ...a) { onKill(e); return k.call(this, e, ...a); }; }
  function tick(dt) {
    const g = B()?.game, p = g?.player;
    if (!p || g.state === 'ui' || g.state === 'over') { orbs.length = 0; pending = 0; runP = null; return; }
    if (p !== runP) { runP = p; orbs.length = 0; pending = 0; dropped = 0; }
    if (g.state !== 'playing') return;
    for (let i = orbs.length - 1; i >= 0; i--) { const o = orbs[i]; o.t += dt;
      if (o.t >= CFG.life) { orbs.splice(i, 1); continue; }
      const d = Math.hypot(p.x - o.x, p.y - o.y);
      if (d < 120 && o.t > 0.4) { o.x += (p.x - o.x) * Math.min(1, dt * 4); o.y += (p.y - o.y) * Math.min(1, dt * 4); }   // a little magnet
      if (d < CFG.pickR && o.t > 0.4) { orbs.splice(i, 1); pending += o.tier.sec;
        try { B().fx.dmgText(p.x, p.y - (p.bodyH || 40) - 22, '⏩ ' + o.tier.name, o.tier.col); B().fx.ring(p.x, p.y, 8, 90, o.tier.col, 0.5, 5); B().audio?.sfx?.('coin'); } catch (_) {}
        if (o.tier.sec >= 60) { try { window.PS_TOAST && window.PS_TOAST('Time Orb ' + o.tier.name, 'The clock jumps ahead toward Arceus', { gold: o.tier.sec >= 300, icon: 'quickclaw' }); } catch (_) {} } }
    }
  }
  const ov = document.createElement('canvas'); ov.id = 'ps-timeorbs'; ov.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;pointer-events:none;z-index:18;display:none';
  function gameCanvas() { let best = null, area = 0; for (const c of document.querySelectorAll('canvas')) { if (c.id && c.id.startsWith('ps-')) continue; const r = c.getBoundingClientRect(), a = r.width * r.height; if (a > area) { area = a; best = { c, r }; } } return best; }
  function draw() {
    const st = B()?.game?.state; if (!orbs.length || st === 'ui' || st === 'over' || (window.PS_SAFEZONE && window.PS_SAFEZONE.active)) { if (ov.style.display !== 'none') { ov.style.display = 'none'; } return; }
    ov.style.display = 'block';
    const ctx = ov.getContext('2d'), dpr = Math.min(2, devicePixelRatio || 1), W = innerWidth, H = innerHeight;
    if (ov.width !== Math.round(W * dpr) || ov.height !== Math.round(H * dpr)) { ov.width = Math.round(W * dpr); ov.height = Math.round(H * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    const cam = B()?.camera, g = gameCanvas(); if (!cam || !g || typeof cam.left !== 'function') return;
    const k = cam.scale * (Number(cam._cw) > 0 ? g.r.width / cam._cw : 1), now = performance.now() / 1000;
    for (const o of orbs) {
      const X = g.r.left + (o.x - cam.left()) * k, Y = g.r.top + (o.y - cam.top()) * k - (10 + 3 * Math.sin(now * 4 + o.x)) * k, R = o.tier.r * k, blink = o.t > CFG.life - 5 ? (Math.floor(now * 8) % 2 ? 0.35 : 1) : 1;
      ctx.save(); ctx.globalAlpha = blink;
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(X, Y + 12 * k, R * 0.9, R * 0.35, 0, 0, TAU); ctx.fill();
      const gr = ctx.createRadialGradient(X, Y, 0, X, Y, R * 2.4); gr.addColorStop(0, 'rgba(' + o.tier.glow + ',.55)'); gr.addColorStop(1, 'rgba(' + o.tier.glow + ',0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(X, Y, R * 2.4, 0, TAU); ctx.fill();
      ctx.fillStyle = o.tier.col; ctx.strokeStyle = '#0b1838'; ctx.lineWidth = Math.max(1.5, 2 * k); ctx.beginPath(); ctx.arc(X, Y, R, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(1.2, 1.6 * k); ctx.beginPath(); ctx.arc(X, Y, R * 0.62, 0, TAU); ctx.stroke();   // little clock face
      const a = now * 3; ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(X + Math.cos(a) * R * 0.5, Y + Math.sin(a) * R * 0.5); ctx.moveTo(X, Y); ctx.lineTo(X + Math.cos(a / 12) * R * 0.32, Y + Math.sin(a / 12) * R * 0.32); ctx.stroke();
      ctx.restore();
    }
  }
  let last = performance.now();
  function loop(now) { requestAnimationFrame(loop); const dt = Math.min(0.1, (now - last) / 1000); last = now; try { wrap(); tick(dt); draw(); } catch (e) { console.warn('[timeorbs]', e); } }
  function init() { document.body.append(ov); requestAnimationFrame(loop); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
  window.PS_TIMEORBS = { tiers: TIERS, cfg: CFG, get orbs() { return orbs.length; }, get dropped() { return dropped; }, get pending() { return pending; }, drop(x, y, sec) { const t = TIERS.find(t => t.sec === sec) || TIERS[2]; orbs.push({ x, y, t: 0, tier: t }); } };
})();
