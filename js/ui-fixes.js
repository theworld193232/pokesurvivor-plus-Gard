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
      // [Gard v91] a burst of catches ("Magikarp joined you!" x6) used to stack the notifications off the bottom of the
      // screen: the same notice twice keeps only the newest, and the oldest go once the stack would run past the HUD
      const kids = [...box.children].filter(k => !k.classList.contains('out')), seen = new Set();
      for (let i = kids.length - 1; i >= 0; i--) { const t = kids[i].textContent.trim(); if (seen.has(t)) { kids[i].remove(); kids.splice(i, 1); } else seen.add(t); }
      const limit = innerHeight - 150;
      while (kids.length > 1 && box.getBoundingClientRect().bottom > limit) kids.shift().remove();
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
  // 4. A legendary's own signature move (js/legend-moves.js) is in its new-move pool, but the final four cards are a
  //    weighted draw against all the stat cards, so it could take ages to show up (Zacian's Behemoth Blade). While it's
  //    unlearned and a move slot is free, half the level-up screens now include it.
  function signature(p, cards) {
    const list = (window.PS_LEGEND_MOVES || {})[Number(p?.dex)]; if (!list || !Array.isArray(cards) || Number(p.level) < 2) return;
    if ((p.slots?.length ?? 0) >= (p.maxMoves || 4)) return;
    const want = list.map(m => m && m.id).filter(id => id && !(typeof p.hasMove === 'function' && p.hasMove(id)));
    if (!want.length || cards.some(c => c && want.some(id => c.key === 'new:' + id)) || Math.random() > 0.5) return;
    const r = R(), id = want[0], def = r.Moves?.BY_ID?.[id]; if (!def) return;
    const card = { w: 10, type: 'new', key: 'new:' + id, icon: 'move:' + id, color: r.U?.TYPE_COLOR?.[def.type] || '#ffd23f', tag: r.U?.TYPE_NAME?.[def.type] || def.type, title: def.name, desc: def.desc, apply: pl => pl.addMove(id) };
    let k = cards.length - 1; while (k > 0 && cards[k] && cards[k].type === 'new') k--;
    cards[k] = card;
  }
  function install() {
    const r = R(); if (!r || !r.LevelUp || !r.LevelUp.offer || r.LevelUp.__gardFit) return false;
    const offer = r.LevelUp.offer;
    r.LevelUp.offer = function (p, n, ...rest) {
      const cards = offer.call(this, p, n, ...rest);
      try {
        const lean = leaning(p); if (!lean || !Array.isArray(cards)) return cards;
        const bad = lean === 'special' ? 'stat:atk' : 'stat:spa';
        // never hide a stat that one of your moves needs to evolve (Ember -> Fire Blast needs Attack, even on special attackers)
        try { const M = R().Moves; for (const inst of p.moves || []) { const info = M.evoInfo(inst, p.statsTaken); if (info && 'stat:' + info.needs === bad) return cards; } } catch (_) {}
        if (!cards.some(c => c && c.key === bad)) return cards;
        const keys = new Set(cards.map(c => c && c.key));
        for (let i = 0; i < cards.length; i++) {
          if (!cards[i] || cards[i].key !== bad) continue;
          let swap = null;
          for (let tries = 0; tries < 8 && !swap; tries++) { for (const c of offer.call(this, p, n, ...rest) || []) if (c && c.key !== bad && !keys.has(c.key)) { swap = c; break; } }
          if (swap) { cards[i] = swap; keys.add(swap.key); }
        }
      } catch (_) {}
      try { signature(p, cards); } catch (_) {}
      return cards;
    };
    r.LevelUp.__gardFit = true; return true;
  }
  (function wait() { if (!install()) setTimeout(wait, 300); })();
})();
