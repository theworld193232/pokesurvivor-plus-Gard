/* GACHA BANNER REFRESH
   - Banner previews no longer show Legendaries (they're earned in Legendary Dens and as roaming Pokémon now):
     each region shows its popular Pokémon (a starter-line star in the middle + the two strongest non-legendaries).
   - Each region gets its own scene colors (taken from the Android PokéSurvivor banners), a soft spotlight and a
     ground strip the Pokémon stand on, and new banner text. Pull logic, tickets, pity and your collection are untouched. */
(() => {
  'use strict';
  if (window.PS_GACHAPLUS_INSTALLED) return; window.PS_GACHAPLUS_INSTALLED = true;
  const E = () => window.PS_HOOPA_ENGINE;
  // region -> [center star, scene colors]   (from the Android version's banner list)
  const SCENE = {
    1: [6, '#5b2f8f', '#1f6f7a'], 2: [157, '#b07a1c', '#27428c'], 3: [257, '#9a2f2f', '#1a4f9a'], 4: [448, '#3b2f9a', '#9a2f78'], 5: [571, '#2b2f3b', '#5f6fa0'],
    6: [658, '#2f62a8', '#a8304f'], 7: [778, '#c76a2a', '#2a8f93'], 8: [815, '#8f2f8f', '#2f6fcf'], 9: [908, '#c0581a', '#5a2fa0'] };
  const legends = () => window.PS_LEGEND_DEX ? window.PS_LEGEND_DEX() : new Set(Object.keys(window.PS_LEGEND_MOVES || {}).map(Number));
  let done = false;
  function patch() {
    const N = E(), G = N && N.Gacha; if (done || !G || !N.DEX || !window.PS_LEGEND_MOVES) return; done = true;
    // scene colors
    for (const b of G.BANNERS || []) { const s = SCENE[b.gen]; if (s) b.color = [s[1], s[1], s[2]]; }
    // featured: no Legendaries
    G.featured = function (gen) {
      if (window.PS_SPECIAL_GACHA) return window.PS_SPECIAL_GACHA.featured(gen);   // the Special Gacha's own Pokemon (js/special-gacha.js)
      const L = legends(), s = SCENE[gen], star = s && N.DEX_BY[s[0]] ? s[0] : null;
      const pool = N.DEX.filter(p => p.gen === gen && !L.has(p.dex) && p.dex !== star && p.rarity >= 3 && N.SPRITE_META[p.dex]).sort((a, b) => b.rarity - a.rarity || b.bst - a.bst);
      const two = pool.slice(0, 2).map(p => p.dex);
      return star ? [two[0], star, two[1]].filter(Boolean) : two;
    };
  }
  const css = document.createElement('style');
  css.textContent = `
  #scr-gacha #banner{position:relative;overflow:hidden;border:3px solid rgba(178,199,255,.75) !important}
  #scr-gacha #banner::before{content:'';position:absolute;left:30%;top:-10%;width:70%;padding-top:70%;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.10),rgba(255,255,255,0) 65%);pointer-events:none;animation:psSpot 6s ease-in-out infinite}
  #scr-gacha #banner::after{content:'';position:absolute;left:0;right:0;bottom:0;height:34%;background:linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.22));border-top:2px solid rgba(255,255,255,.08);pointer-events:none}
  @keyframes psSpot{50%{transform:translateX(-12%) scale(1.06)}}
  #scr-gacha #banner > *{position:relative;z-index:1}
  #scr-gacha #banner-title{font-size:30px}
  #scr-gacha .feat canvas{filter:drop-shadow(0 6px 0 rgba(0,0,0,.25))}`;
  // banner text: Legendaries aren't on the banners any more
  const MSG = 'Starters and special Pokémon (Rare and below) await! Allowed Legendaries: Magearna, Meloetta, Manaphy, Phione.';
  const fixText = () => { const d = document.getElementById('banner-desc'); if (d && d.textContent !== MSG && /legendar|Rare and Epic/i.test(d.textContent)) d.textContent = MSG; };
  function init() {
    document.head.append(css);
    const t = setInterval(() => { patch(); if (done) clearInterval(t); }, 300);
    setInterval(() => { const g = document.getElementById('scr-gacha'); if (g && !g.classList.contains('hidden')) fixText(); }, 250);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
})();
