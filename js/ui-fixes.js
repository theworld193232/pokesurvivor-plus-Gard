/* [Gard v81] Small playtest fixes.
   1. Side notifications ("X joined you!") start below the minimap instead of sliding underneath it.
   2. The menu's little toast ("Scorbunny joins you!") sits above the Play button instead of covering it.
   3. Level-up cards: a clearly special attacker (Sp. Atk well above Attack, like Gardevoir) is no longer
      offered "+Attack (physical moves)", and a clearly physical one no longer gets "+Sp. Attack"; the card
      is swapped for another reward from the same roll. */
(() => {
  'use strict';
  const R = () => window.__PSX_REG__;
  // ---- 1 + 2: keep notifications clear of the minimap and the Play button
  function place() {
    const mm = document.getElementById('ps-minimap'), box = document.getElementById('ps-toasts');
    if (box) {
      let top = '';
      if (mm && getComputedStyle(mm).display !== 'none' && getComputedStyle(mm).visibility !== 'hidden') { const b = mm.getBoundingClientRect(); if (b.width > 0 && b.bottom > 0 && b.bottom < innerHeight * 0.6) top = Math.round(b.bottom + 12) + 'px'; }
      if (box.style.top !== top) box.style.top = top;
    }
    const play = document.querySelector('.pp-play'), toasts = document.querySelectorAll('.toast');
    if (toasts.length) {
      const pb = play && play.offsetParent !== null ? play.getBoundingClientRect() : null;
      const bottom = pb && pb.height > 0 ? Math.round(innerHeight - pb.top + 12) + 'px' : '';
      for (const t of toasts) if (t.style.bottom !== bottom) t.style.bottom = bottom;
    }
  }
  setInterval(() => { try { place(); } catch (_) {} }, 250);
  // ---- 3: level-up cards that fit the Pokémon
  function leaning(p) {
    try { const b = (R().BASE_STATS || {})[p.dex]; if (!b) return null; const atk = +b[1], spa = +b[3]; if (spa >= atk * 1.4) return 'special'; if (atk >= spa * 1.4) return 'physical'; } catch (_) {}
    return null;
  }
  function install() {
    const r = R(); if (!r || !r.LevelUp || !r.LevelUp.offer || r.LevelUp.__gardFit) return false;
    const offer = r.LevelUp.offer;
    r.LevelUp.offer = function (p, n, ...rest) {
      const cards = offer.call(this, p, n, ...rest);
      try {
        const lean = leaning(p); if (!lean || !Array.isArray(cards)) return cards;
        const bad = lean === 'special' ? 'stat:atk' : 'stat:spa';
        if (!cards.some(c => c && c.key === bad)) return cards;
        const keys = new Set(cards.map(c => c && c.key));
        for (let i = 0; i < cards.length; i++) {
          if (!cards[i] || cards[i].key !== bad) continue;
          let swap = null;
          for (let tries = 0; tries < 8 && !swap; tries++) { for (const c of offer.call(this, p, n, ...rest) || []) if (c && c.key !== bad && !keys.has(c.key)) { swap = c; break; } }
          if (swap) { cards[i] = swap; keys.add(swap.key); }
        }
      } catch (_) {}
      return cards;
    };
    r.LevelUp.__gardFit = true; return true;
  }
  (function wait() { if (!install()) setTimeout(wait, 300); })();
})();
