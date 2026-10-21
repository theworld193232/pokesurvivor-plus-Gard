/* HARDER LEVELS + HIGHER LIMITS
   Two new levels after Level 3 (Volcano), on the level tabs of the Play panel:
     Level 4 · Abyss      (crystal-cave terrain)  enemies x3 HP, x2 damage · +75% PokéCoins & EXP · unlocks by beating Arceus on Level 3
     Level 5 · Nightmare  (volcano terrain)       enemies x4.5 HP, x2.6 damage · +100% PokéCoins & EXP · unlocks by beating Arceus on Level 4
   Higher limits:
     - Max HP cap 1000 -> 2000, HP regeneration cap doubled.
     - Permanent upgrades (Upgrades screen) go further: most stats 10 -> 20 levels (Reflexes/cooldown 10 -> 15,
       Reroll 5 -> 8). Each extra level costs more, as usual. */
(() => {
  'use strict';
  if (window.PS_LEVELS_INSTALLED) return; window.PS_LEVELS_INSTALLED = true;
  const E = () => window.PS_HOOPA_ENGINE;
  const MORE = { hp: 20, atk: 20, spd: 20, cd: 15, def: 20, regen: 20, magnet: 20, xp: 20, coins: 20, crit: 20, reroll: 8 };
  let done = false;
  function install() {
    const N = E(); if (done || !N || !N.Maps || !N.Maps.LIST || !N.Upgrades || !N.Player) return; done = true;
    // ---- limits ----
    try { const P = N.Player, d = Object.getOwnPropertyDescriptor(P, 'HP_CAP'), orig = d && d.get ? d.get.bind(P) : () => 1000;
      Object.defineProperty(P, 'HP_CAP', { configurable: true, get() { const v = orig(); return v === Infinity ? v : Math.max(v, 2000); } });   // Area Zero stays unlimited
      const r = Object.getOwnPropertyDescriptor(P, 'REGEN_CAP'), rg = r && r.get ? r.get.bind(P) : null;
      if (rg) Object.defineProperty(P, 'REGEN_CAP', { configurable: true, get() { const v = rg(); return v === Infinity ? v : v * 2; } }); } catch (e) { console.warn('[levels] caps', e); }
    for (const u of N.Upgrades.LIST) if (MORE[u.id] && u.max < MORE[u.id]) u.max = MORE[u.id];
    // ---- levels ----
    const M = N.Maps, L = M.LIST, cave = L.find(m => m.n === 2), volc = L.find(m => m.n === 3);
    if (!cave || !volc || L.some(m => m.psLevel)) return;
    const lv4 = Object.assign({}, cave, { n: L.length + 1, psLevel: 4, name: 'Crystal Abyss', diff: 'Abyss', col: '#c47bff', k: 3, dk: 2, bonus: 0.75, coins: 45000, t10: 7, arceusMin: 2000000, legendMin: 200000, arceusK: 45, legendK: 2.5 });
    const lv5 = Object.assign({}, volc, { n: L.length + 2, psLevel: 5, name: 'Volcanic Nightmare', diff: 'Nightmare', col: '#ff3d6d', k: 4.5, dk: 2.6, bonus: 1, coins: 60000, t10: 10, arceusMin: 3000000, legendMin: 300000, arceusK: 60, legendK: 3 });
    L.push(lv4, lv5);
    const wins = () => (N.DB.save && N.DB.save.mapWins) || {};
    const tester = () => String(window.PS_MEGA_BRIDGE_V5?.user || '').trim().toLowerCase() === 'lovergare';   // LoverGare can always pick them (testing)
    const open4 = () => !!wins()[3] || tester() || !!(N.DevMenu && N.DevMenu.on), open5 = () => !!wins()[lv4.n] || tester() || !!(N.DevMenu && N.DevMenu.on);
    const isOpen = M.isOpen, selected = M.selected;
    M.isOpen = n => n === lv4.n ? open4() : n === lv5.n ? open5() : isOpen(n);
    M.selected = function () { const s = N.DB.save, sel = s && s.mapSel; if (sel === lv4.n && open4()) return lv4.n; if (sel === lv5.n && open5()) return lv5.n; return selected.call(this); };
    window.PS_LEVELS = { lv4, lv5, open4, open5 };
  }
  // tabs on the Play panel
  function tabs() {
    const box = document.getElementById('menu-maps'), N = E(), P = window.PS_LEVELS; if (!box || !N || !P) return;
    for (const [lv, n, label, open, need] of [[4, P.lv4.n, '4 · Abyss', P.open4(), 'Defeat Arceus on Level 3 to unlock it.'], [5, P.lv5.n, '5 · Nightmare', P.open5(), 'Defeat Arceus on Level 4 to unlock it.']]) {
      let b = box.querySelector('[data-map="' + n + '"]');
      if (!b) { b = document.createElement('button'); b.className = 'lvl-tab'; b.dataset.map = String(n);
        const zz = box.querySelector('.lvl-tab.zz'); zz ? box.insertBefore(b, zz) : box.appendChild(b);
      }
      const txt = (open ? '' : '🔒 ') + label; if (b.textContent.trim() !== txt) b.textContent = txt;
      b.disabled = !open; b.title = open ? (lv === 4 ? 'Abyss: enemies x3 HP, x2 damage · +75% PokéCoins & EXP' : 'Nightmare: enemies x4.5 HP, x2.6 damage · +100% PokéCoins & EXP') : need;
      b.classList.toggle('on', N.Maps.selected() === n);
    }
  }
  document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('#menu-maps [data-map]'), P = window.PS_LEVELS, N = E(); if (!b || !P || !N) return; const n = +b.dataset.map; if (n !== P.lv4.n && n !== P.lv5.n) return;
    e.stopImmediatePropagation(); e.preventDefault(); if (!N.Maps.isOpen(n)) return; const s = N.DB.save; if (s) { s.mapSel = n; try { N.DB.commit(); } catch (_) {} }
    try { N.Audio.sfx('click'); } catch (_) {} try { N.Game.menuMap(n); } catch (_) {} try { N.MenuUI.open(); } catch (_) {} }, true);
  function banner() {   // the Play panel shows "Level 4/5" and borrows the Cave / Volcano artwork
    const N = E(), P = window.PS_LEVELS; if (!N || !P) return; const sel = N.Maps.selected(), lv = sel === P.lv4.n ? 4 : sel === P.lv5.n ? 5 : 0; if (!lv) return;
    const nm = document.querySelector('#pp-info .pp-name'); if (nm && /Level \d+/.test(nm.textContent) && !nm.textContent.startsWith('Level ' + lv + ' ')) nm.textContent = nm.textContent.replace(/Level \d+/, 'Level ' + lv);
    const zone = lv === 4 ? 2 : 3, bn = document.getElementById('pp-banner'); if (bn && !String(bn.style.backgroundImage).includes('zone-' + zone + '.webp')) { bn.style.backgroundImage = 'url("assets/ui/zone-' + zone + '.webp")'; const i = bn.querySelector('.pp-bgs i'); if (i) i.style.backgroundImage = 'url(assets/ui/zone-' + zone + '-anim.webp)'; }
  }
  // Upgrades screen: 20 levels of pips used to overflow the card. Pips now shrink to fit the card's width.
  const css = document.createElement('style');
  css.textContent = '.upg-item{min-width:0}.upg-item>*{min-width:0}.pips{flex-wrap:nowrap;max-width:100%;overflow:hidden}.pips i{flex:1 1 0;min-width:3px;width:auto!important;max-width:12px}';
  (document.head || document.documentElement).append(css);
  // the game rebuilds the tabs when you click one; fix them up in the same instant (before the screen is painted),
  // so the game's own '5' / '6' labels never flash on screen
  let watched = null, mo = null;
  function watch() { const box = document.getElementById('menu-maps'); if (!box || box === watched) return; watched = box; if (mo) mo.disconnect();
    mo = new MutationObserver(() => { try { tabs(); banner(); } catch (_) {} }); mo.observe(box, { childList: true, subtree: true, characterData: true });
    const nm = document.getElementById('pp-info'); if (nm) mo.observe(nm, { childList: true, subtree: true, characterData: true }); }
  setInterval(() => { try { install(); watch(); tabs(); banner(); } catch (e) { console.warn('[levels]', e); } }, 150);
})();
