/* [Gard v88] Glowing moves for the Witch line (LoverGare's skins), like Primal Kyogre's glowing Water moves:
   every move Witch Ralts / Kirlia / Gardevoir uses glows in her colours - green, or purple when shiny;
   as Mega (Dreadful) Gardevoir it glows red and gold, or blue and white when shiny.
   Her shots get a soft halo while they fly; her beams and slashes get a glowing stroke. Appearance only. */
(() => {
  'use strict';
  const TAU = Math.PI * 2, B = () => window.PS_MEGA_BRIDGE_V5;
  const SKIN = { 280: '280-witch', 281: '281-witch', 282: '282-witch' };
  const COLS = {                                    // [outer, middle] rgb + white core
    green: ['46,214,84', '150,255,170'], purple: ['150,60,230', '220,170,255'],
    dread: ['208,31,42', '255,210,63'], dreadS: ['42,124,255', '200,235,255'],
  };
  const canvas = document.createElement('canvas'); canvas.id = 'ps-witch-glow';
  Object.assign(canvas.style, { position: 'fixed', left: '0', top: '0', pointerEvents: 'none', zIndex: '3', display: 'none' });
  const ctx = canvas.getContext('2d'); let mounted = false;
  const glows = []; let owner = null, last = 0, hooked = false;
  function palette(p) {
    try {
      const d = Number(p?.dex); if (!SKIN[d] || window.PS_COSMETICS?.selected(d) !== SKIN[d]) return null;
      const sh = !!(p.shiny || /-s$/.test(String(p.anim?.dex || '')));
      if (/282-mega-witch/.test(String(p.anim?.dex || ''))) return COLS[sh ? 'dreadS' : 'dread'];
      if (p.megaForm) return null;
      return COLS[sh ? 'purple' : 'green'];
    } catch (_) { return null; }
  }
  const near = (x, y, d) => owner && Math.hypot(x - owner.x, y - owner.y) < d;
  function add(g) { g.t = 0; glows.push(g); if (glows.length > 200) glows.splice(0, glows.length - 200); }
  function hook() {
    const F = B()?.fx; if (hooked || !F) return; hooked = true;
    const wrap = (name, fn) => { const o = F[name]; if (typeof o !== 'function') return; F[name] = function (...a) { try { if (owner) fn(...a); } catch (_) {} return o.apply(this, a); }; };
    wrap('beam', (x, y, ang, len, w) => { if (near(x, y, 120)) add({ k: 'beam', x, y, ang, len: Number(len) || 200, w: Number(w) || 20, life: 0.18 }); });
    wrap('ring', (x, y, r0, r1, color, life) => { if (near(x, y, 70)) add({ k: 'ring', x, y, r0: Number(r0) || 8, r1: Number(r1) || 40, life: Math.max(0.2, Number(life) || 0.3) }); });
    wrap('slash', (x, y, ang, r, arc) => { if (near(x, y, 170)) add({ k: 'slash', x, y, ang, r: Number(r) || 60, arc: Number(arc) || 2, life: 0.28 }); });
  }
  function view() {
    const b = B(), cam = b?.camera, c = document.getElementById('game'); if (!cam || !c || typeof cam.left !== 'function') return null;
    const r = c.getBoundingClientRect(), css = Number(cam._cw) > 0 ? r.width / cam._cw : 1, k = cam.scale * css;
    return { k, r, sx: x => r.left + (x - cam.left()) * k, sy: y => r.top + (y - cam.top()) * k };
  }
  const glow = (x, y, r, c0) => { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, c0); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); };
  function halo(x, y, r, pal, a) { glow(x, y, r * 2.6, 'rgba(' + pal[0] + ',' + 0.55 * a + ')'); glow(x, y, r * 1.4, 'rgba(' + pal[1] + ',' + 0.9 * a + ')'); glow(x, y, r * 0.55, 'rgba(255,255,255,' + a + ')'); }
  function frame(ts) {
    requestAnimationFrame(frame);
    const b = B(), p = b?.game?.player, dt = Math.min(0.05, last ? (ts - last) / 1000 : 0); last = ts;
    const pal = p && !p.dead && b.game.state === 'playing' ? palette(p) : null;
    owner = pal ? p : null;
    for (const g of glows) g.t += dt; for (let i = glows.length - 1; i >= 0; i--) if (glows[i].t >= glows[i].life) glows.splice(i, 1);
    if (!pal) { if (canvas.style.display !== 'none') canvas.style.display = 'none'; glows.length = 0; return; }
    hook();
    if (!mounted && document.body) { document.body.appendChild(canvas); mounted = true; }
    const v = view(); if (!v) return;
    const dpr = Math.min(2, devicePixelRatio || 1), w = Math.round(innerWidth * dpr), h = Math.round(innerHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; canvas.style.width = innerWidth + 'px'; canvas.style.height = innerHeight + 'px'; }
    canvas.style.display = 'block'; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, innerWidth, innerHeight);
    ctx.save(); ctx.beginPath(); ctx.rect(v.r.left, v.r.top, v.r.width, v.r.height); ctx.clip(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    const lift = Number(b?.lift) || 18, pulse = 0.85 + 0.15 * Math.sin(ts / 1000 * 9), k = v.k;
    for (const q of b?.projectiles?.all?.() || []) {
      if (!q || !q.friendly || q.ghost || q.dead) continue;
      halo(v.sx(q.x), v.sy(q.y - lift), Math.max(5, Number(q.r) || 6) * k * 1.6 * pulse, pal, Math.min(1, (Number(q.t) || 0) / 0.12));
    }
    const lines = [[2.2, pal[0], 0.45], [1.2, pal[1], 0.8], [0.45, '255,255,255', 0.95]];
    for (const g of glows) {
      const f = 1 - g.t / g.life, sx = v.sx(g.x), sy = v.sy(g.y);
      if (g.k === 'beam') { const ex = v.sx(g.x + Math.cos(g.ang) * g.len), ey = v.sy(g.y + Math.sin(g.ang) * g.len);
        for (const [lw, c, a] of lines) { ctx.strokeStyle = 'rgba(' + c + ',' + a * f + ')'; ctx.lineWidth = g.w * lw * k * 0.55; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke(); }
        halo(ex, ey, g.w * 0.6 * k, pal, f); }
      else if (g.k === 'ring') { const r = (g.r0 + (g.r1 - g.r0) * (1 - f * f)) * k; for (const [lw, c, a] of lines) { ctx.strokeStyle = 'rgba(' + c + ',' + a * f + ')'; ctx.lineWidth = 3.2 * lw * k; ctx.beginPath(); ctx.arc(sx, sy, r, 0, TAU); ctx.stroke(); } }
      else if (g.k === 'slash') { for (const [lw, c, a] of lines) { ctx.strokeStyle = 'rgba(' + c + ',' + a * f + ')'; ctx.lineWidth = 6 * lw * k; ctx.beginPath(); ctx.arc(sx, sy, g.r * k, g.ang - g.arc / 2, g.ang + g.arc / 2); ctx.stroke(); } }
    }
    ctx.restore();
  }
  requestAnimationFrame(frame);
})();
