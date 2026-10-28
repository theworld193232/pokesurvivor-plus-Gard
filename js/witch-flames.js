/* [Gard v89+] Witch Ralts / Kirlia / Gardevoir: green spirit flames flicker beside/around them (purple when shiny).
   Ralts holds one flame at her side; Kirlia has two; Gardevoir has three slowly orbiting around her.
   Also includes active-player lifecycle cleanup for both witchflame and witchaura so wisps/auras never freeze on map rejoin.
   Only for the appearance's owner (PS_COSMETICS.selected already checks the account). */
(() => {
  'use strict';
  const R = () => window.__PSX_REG__, B = () => window.PS_MEGA_BRIDGE_V5, TAU = Math.PI * 2;
  const SKIN = { 280: '280-witch', 281: '281-witch', 282: '282-witch' };
  const PAL = { n: ['#0b3a1c', '#128a3a', '#46e85a', '#b8ff9a', '#f0fff0'], s: ['#2a0f4a', '#6a2ac0', '#b05aff', '#e0b0ff', '#fbf0ff'] };
  const W = 14, H = 22, buf = document.createElement('canvas'); buf.width = W; buf.height = H;
  const activePlayer = () => B()?.game?.player || R()?.Game?.player || null;
  const on = p => { try { const d = Number(p?.dex); return !!p && p === activePlayer() && R()?.Game?.state === 'playing' && !!SKIN[d] && window.PS_COSMETICS?.selected(d) === SKIN[d] && !p.megaForm; } catch (_) { return false; } };
  const shiny = p => !!(p && (p.shiny || /-s$/.test(String(p.anim?.dex || ''))));
  function flame(t, seed, pal) {
    const g = buf.getContext('2d'); g.clearRect(0, 0, W, H);
    const cx = W / 2;
    for (let y = 0; y < H; y++) {
      const v = y / (H - 1);                                     // 0 top (tip) .. 1 base
      const sway = Math.sin(t * 7 + seed + v * 5) * (1 - v) * 2.6 + Math.sin(t * 13 + seed * 2 + v * 9) * (1 - v) * 0.9;
      const half = Math.max(0, (Math.sin(v * Math.PI * 0.95) * 0.85 + v * 0.35) * (W * 0.42) * (0.85 + 0.15 * Math.sin(t * 11 + y + seed)));
      if (half < 0.4) { if (v < 0.25 && ((y + Math.floor(t * 12)) % 3 === 0)) { g.fillStyle = pal[2]; g.fillRect(Math.round(cx + sway), y, 1, 1); } continue; }
      const x0 = Math.round(cx + sway - half), x1 = Math.round(cx + sway + half);
      for (let x = x0; x <= x1; x++) {
        const e = Math.abs(x - (cx + sway)) / (half + 0.01);       // 0 core .. 1 edge
        const heat = (1 - e) * 0.75 + v * 0.35;
        const col = x === x0 || x === x1 ? pal[0] : heat > 0.85 ? pal[4] : heat > 0.62 ? pal[3] : heat > 0.38 ? pal[2] : pal[1];
        g.fillStyle = col; g.fillRect(x, y, 1, 1);
      }
    }
    // a few embers drifting off the tip
    for (let i = 0; i < 3; i++) { const u = (t * 1.6 + i / 3 + seed) % 1; g.fillStyle = pal[i % 2 ? 3 : 2]; g.fillRect(Math.round(cx + Math.sin(seed + i * 2 + t * 3) * 3), Math.round(H * 0.35 - u * H * 0.35), 1, 1); }
    return buf;
  }
  let seen = 0, auraPatched = false;
  function patchWitchAura() {
    if (auraPatched) return;
    const st = window.PS_FX?.styles?.witchaura;
    if (!st || typeof st.update !== 'function') return;
    auraPatched = true;
    const origUpdate = st.update;
    st.update = function(c, dt) {
      const p = c?.player;
      if (!p || p !== activePlayer() || R()?.Game?.state !== 'playing') return false;
      const list = window.PS_FX?.list?.('witchaura');
      if (Array.isArray(list) && list.length > 1 && list[0] !== c) return false;
      return origUpdate.call(this, c, dt);
    };
  }
  function register() {
    const F = window.PS_FX; if (!F || !F.styles) return false;
    patchWitchAura();
    if (F.styles.witchflame) return true;
    F.styles.witchflame = {
      cast(c) { seen = performance.now(); return c; },
      update(c, dt) {
        const p = c.player;
        if (!on(p) || p.dead) return false;
        const list = window.PS_FX?.list?.('witchflame');
        if (Array.isArray(list) && list.length > 1 && list[0] !== c) return false;
        seen = performance.now();
        c.t += dt; c.x = p.x; c.y = p.y; c.H = Number(p.bodyH) || 30;
        const d = Number(p.dex);
        c.kir = d === 281; c.gard = d === 282;
        c.sh = shiny(p); c.face = p.anim?.dir ?? 0;
        return true;
      },
      draw(c, ctx, v) {
        const k = v.k, X = v.sx(c.x), Y = v.sy(c.y), pal = c.sh ? PAL.s : PAL.n;
        const sc = Math.max(1, c.H * k * (c.gard ? 0.52 : c.kir ? 0.55 : 0.6) / H);
        let spots;
        if (c.gard) {
          const rotSpeed = 0.85;
          const rx = 0.72, ry = 0.28, centerY = -0.48;
          spots = [0, 1, 2].map(i => {
            const ang = c.t * rotSpeed + (i * TAU / 3);
            return [Math.cos(ang) * rx, centerY + Math.sin(ang) * ry, i * 2.1, Math.sin(ang)];
          });
          spots.sort((a, b) => a[3] - b[3]);
        } else if (c.kir) {
          spots = [[-0.55, -0.42, 0, 0], [0.58, -0.62, 1.7, 0]];
        } else {
          spots = [[-0.58, -0.3, 0, 0]];
        }
        ctx.save(); ctx.imageSmoothingEnabled = false;
        for (const [ox, oy, seed] of spots) {
          const fx = X + ox * c.H * k, fy = Y + oy * c.H * k + Math.sin(c.t * 2.2 + seed) * 2 * k;
          ctx.globalCompositeOperation = 'lighter';
          const gl = ctx.createRadialGradient(fx, fy, 0, fx, fy, H * sc * 0.6); gl.addColorStop(0, c.sh ? 'rgba(176,90,255,0.35)' : 'rgba(70,232,90,0.35)'); gl.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(fx, fy, H * sc * 0.6, 0, TAU); ctx.fill();
          ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 0.95;
          ctx.drawImage(flame(c.t, seed, pal), Math.round(fx - W * sc / 2), Math.round(fy - H * sc * 0.75), W * sc, H * sc);
          ctx.globalAlpha = 1;
        }
        ctx.restore();
      }
    };
    return true;
  }
  (function loop() {
    requestAnimationFrame(loop);
    try {
      if (!register()) return;
      const p = activePlayer();
      if (!p || !on(p) || R()?.Game?.state !== 'playing') return;
      const liveFlames = window.PS_FX?.list?.('witchflame') || [];
      const hasCurrent = liveFlames.some(c => c.player === p);
      if (!hasCurrent && performance.now() - seen > 150) {
        for (const old of liveFlames) if (old.player && old.player !== p) window.PS_FX?.clearForPlayer?.(old.player);
        seen = performance.now();
        window.PS_FX.cast('witchflame', p, { id: 'witch-flame', fx: {} });
      }
    } catch (_) {}
  })();
})();
