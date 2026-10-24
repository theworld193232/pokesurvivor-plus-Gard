/* HUD LAYER: move effects never cover the game's HUD or anything outside the game.
   The game draws its HUD (health bar, moves bar, timer...) on its own canvas, so any effect drawn on a canvas on
   top of it used to cover the HUD. Now the game calls window.PS_PRE_HUD right after drawing the world and right
   before drawing its HUD (hook in js/app.min.js): this file paints every effect layer into the game picture at
   that moment (cropped to the game's own area), and the effect canvases themselves stay invisible.
   If the hook isn't there (old cached app.min.js), the effect canvases simply stay visible as before. */
(() => {
  'use strict';
  if (window.PS_HUDLAYER_INSTALLED) return; window.PS_HUDLAYER_INSTALLED = true;
  // world-effect canvases (in drawing order: ground domains first, move effects and markers last)
  const IDS = ['ps-kyogre-fx', 'ps-groudon-fx', 'ps-primal-outbreak', 'ps-delta-stream', 'ps-route1', 'ps-waves', 'ps-dens', 'ps-lore', 'ps-pinkrift', 'ps-timeorbs', 'ps-shots', 'ps-primal-aura-ring'];
  const css = document.createElement('style');
  css.textContent = 'html.ps-hudlayer ' + IDS.map(i => '#' + i).join(',html.ps-hudlayer ') + '{opacity:0 !important}';
  let lastCall = 0, on = false;
  const renderers = new Map();
  window.PS_HUD_LAYERS = Object.freeze({
    register(id, render) { if (IDS.includes(id) && typeof render === 'function') renderers.set(id, render); },
    get active() { return on && performance.now() - lastCall < 600; }
  });
  window.PS_PRE_HUD = function (ctx, w, h) {
    lastCall = performance.now();
    if (!on) { on = true; document.documentElement.classList.add('ps-hudlayer'); }
    const game = document.getElementById('game'); if (!game) return;
    const r = game.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return;
    const VW = innerWidth, VH = innerHeight;
    for (const id of IDS) {
      // Refresh registered world layers with this frame's camera before compositing.
      try { renderers.get(id)?.(); } catch (error) { console.warn('[HUD layer]', id, error); }
      const el = document.getElementById(id); if (!el || !el.width || !el.height) continue;
      if (el.style.display === 'none') continue;
      const kx = el.width / VW, ky = el.height / VH;
      try { ctx.drawImage(el, r.left * kx, r.top * ky, r.width * kx, r.height * ky, 0, 0, w, h); } catch (_) {}
    }
  };
  // safety: if the game stops calling the hook (old engine / a screen that doesn't draw the HUD), show the canvases again
  setInterval(() => { if (on && performance.now() - lastCall > 600) { on = false; document.documentElement.classList.remove('ps-hudlayer'); } }, 300);
  const add = () => document.head.append(css);
  if (document.head) add(); else document.addEventListener('DOMContentLoaded', add, { once: true });
})();
