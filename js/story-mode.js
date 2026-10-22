/* GAME MODE TOGGLE: Original / Story   (main menu, saved with your profile)
   Original  the game as it was: Gacha, Levels, Dens, everything you already have.
   Story     adds the friend's Story content on top:
               - Story chapters replace the Acts on the Play panel (Chapter 1: Kanto Route 1 vs your rival Blue)   js/route1.js
               - your Trainer walking behind you, catching wild Pokemon with Poke Balls, Potions,
                 the Trainer's Bag, wild Pokemon sizes, the Poke Mart and Trainer menu   js/catching.js
               - the Special Gacha (starters, Dratini, Beldum... and a very rare Magearna)  js/special-gacha.js
   Shared by both modes: the smarter wild Pokemon (js/enemy-ai.js), Primal Outbreak (js/primal-outbreak.js) and
   every other feature. Your collection, coins and items are the same in both modes. */
(() => {
  'use strict';
  if (window.PS_STORY_INSTALLED) return; window.PS_STORY_INSTALLED = true;
  const E = () => window.PS_HOOPA_ENGINE, B = () => window.PS_MEGA_BRIDGE_V5;
  const KEY = 'ps-game-mode';
  function get() {
    try { const S = E()?.DB?.save; if (S && (S.psGameMode === 'story' || S.psGameMode === 'original')) return S.psGameMode; } catch (_) {}
    try { const v = localStorage.getItem(KEY); if (v === 'story' || v === 'original') return v; } catch (_) {}
    return 'original';
  }
  function set(mode) {
    if (mode !== 'story' && mode !== 'original') return;
    try { const S = E()?.DB?.save; if (S) { S.psGameMode = mode; E().DB.commit(); } } catch (_) {}
    try { localStorage.setItem(KEY, mode); } catch (_) {}
    render(); try { storyPanel(); } catch (_) {}
    try { window.PS_TOAST && window.PS_TOAST(mode === 'story' ? 'Story Mode on' : 'Original Mode on', mode === 'story' ? 'Story chapters, your Trainer and catching are on' : 'The classic game, no catching', { ms: 3200 }); } catch (_) {}
  }
  // the mode can only change from the main menu (never in the middle of a run)
  window.PS_STORY = { on: () => get() === 'story', mode: get, set };

  const css = document.createElement('style');
  css.textContent = `
  #ps-gm{display:flex;align-items:center;gap:8px;margin:0 0 8px;padding:6px 8px;border-radius:12px;background:rgba(10,20,48,.72);border:2px solid #2a3a6a;font:700 13px Pixelify,Fredoka,system-ui,sans-serif;color:#cfe0ff}
  #ps-gm .lbl{letter-spacing:2px;font-size:11px;opacity:.8;padding-left:4px}
  #ps-gm .seg{display:flex;flex:1;background:#0b1430;border-radius:9px;padding:3px;gap:3px}
  #ps-gm button{flex:1;padding:6px 10px;border:0;border-radius:7px;background:transparent;color:#9fb3e0;font:800 14px Pixelify,Fredoka,system-ui,sans-serif;cursor:pointer;letter-spacing:.5px}
  #ps-gm button.on{background:linear-gradient(#ffe066,#ffc21a);color:#2a1d00;box-shadow:0 2px 0 #b07a00}
  #ps-gm button[data-m="story"].on{background:linear-gradient(#8fd0ff,#4a8cff);color:#071a3a;box-shadow:0 2px 0 #1d4aa8}`;
  function render() {
    const list = document.querySelector('.menu-box .menu-list'); if (!list) return;
    let el = document.getElementById('ps-gm');
    if (!el) {
      el = document.createElement('div'); el.id = 'ps-gm';
      el.innerHTML = '<span class="lbl">MODE</span><div class="seg"><button data-m="original">Original</button><button data-m="story">Story</button></div>';
      el.addEventListener('click', ev => { const b = ev.target.closest('[data-m]'); if (!b) return; ev.preventDefault(); ev.stopPropagation(); if (b.dataset.m !== get()) set(b.dataset.m); }, true);
    }
    if (el.parentNode !== list.parentNode || el.nextSibling !== list) list.parentNode.insertBefore(el, list);
    const m = get(); for (const b of el.querySelectorAll('[data-m]')) b.classList.toggle('on', b.dataset.m === m);
  }
  // ---- Story Mode: the chapters take the place of the Acts on the Play panel ----
  const CH = [
    { id: 'route1', n: 1, name: 'Kanto Route 1', sub: 'Survive 5:00, then your rival Blue challenges you', img: 'assets/fx/blue.png?v=1', ready: () => !!window.PS_ROUTE1, cleared: () => window.PS_ROUTE1 ? window.PS_ROUTE1.cleared() : 0 },
  ];
  let chSel = 'route1';
  css.textContent += `
  html.ps-story #menu-maps{display:none !important}
  html.ps-story #ps-dyn{display:none !important}
  html.ps-story #ps-mode-btn{display:none !important}
  #ps-chapters{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0}
  #ps-chapters .ch{display:flex;align-items:center;gap:8px;flex:1 1 180px;padding:6px 10px;border-radius:10px;border:2px solid #2a3a6a;background:rgba(10,20,48,.75);color:#dfe8ff;font:800 14px Pixelify,Fredoka,system-ui,sans-serif;cursor:pointer;text-align:left}
  #ps-chapters .ch.on{border-color:#8fd0ff;background:linear-gradient(rgba(74,140,255,.35),rgba(10,20,48,.8))}
  #ps-chapters .ch img{width:30px;height:30px;image-rendering:pixelated;object-fit:contain}
  #ps-chapters .ch small{display:block;font-size:11px;font-weight:600;opacity:.75}
  #ps-chapters .ch.soon{opacity:.45;cursor:default}
  #ps-chapters .ok{color:#7dff9a}
  #ps-ch-blue{position:absolute;left:22px;top:16px;height:44%;image-rendering:pixelated;filter:drop-shadow(0 4px 0 rgba(0,0,0,.3));pointer-events:none;z-index:1}`;
  let saved = null;
  function storyPanel() {
    const on = get() === 'story', maps = document.getElementById('menu-maps');
    document.documentElement.classList.toggle('ps-story', on);
    let box = document.getElementById('ps-chapters');
    const bn = document.getElementById('pp-banner'), nm = document.querySelector('#pp-info .pp-name'), dif = document.querySelector('#pp-info .pp-dif');
    if (!on) {
      if (box) box.remove(); const bl = document.getElementById('ps-ch-blue'); if (bl) bl.remove();
      if (saved) { if (nm && nm.textContent === saved.nmStory) nm.textContent = saved.nm; if (dif && dif.textContent === 'Story') { dif.textContent = saved.dif; dif.style.background = saved.difBg; } saved = null; try { E().MenuUI.open(); } catch (_) {} }
      return;
    }
    if (!maps) return;
    if (!box) { box = document.createElement('div'); box.id = 'ps-chapters';
      box.addEventListener('click', ev => { const b = ev.target.closest('[data-ch]'); if (!b || b.classList.contains('soon')) return; ev.preventDefault(); ev.stopPropagation(); chSel = b.dataset.ch; storyPanel(); }, true); }
    if (box.previousSibling !== maps) maps.after(box);
    const c = CH.find(x => x.id === chSel) || CH[0];
    const html = CH.map(x => { const done = x.cleared(); return '<button class="ch' + (x.id === chSel ? ' on' : '') + '" data-ch="' + x.id + '"><img src="' + x.img + '" alt=""><span>Chapter ' + x.n + ' · ' + x.name + '<small>' + (done ? '<span class="ok">✔ Cleared' + (done > 1 ? ' ×' + done : '') + '</span>' : x.sub) + '</small></span></button>'; }).join('') +
      '<button class="ch soon" disabled><span>Chapter 2<small>Coming soon</small></span></button>';
    if (box.__h !== html) { box.innerHTML = html; box.__h = html; }
    const nmTxt = 'Chapter ' + c.n + ' · ' + c.name;
    if (nm && nm.textContent !== nmTxt) { if (!saved) saved = { nm: nm.textContent, dif: dif ? dif.textContent : '', difBg: dif ? dif.style.background : '', nmStory: nmTxt }; nm.textContent = nmTxt; }
    if (dif && dif.textContent !== 'Story') { dif.textContent = 'Story'; dif.style.background = '#4a8cff'; }
    if (bn && !document.getElementById('ps-ch-blue')) { const im = document.createElement('img'); im.id = 'ps-ch-blue'; im.src = c.img; im.alt = ''; bn.append(im); }
  }
  // Play starts the selected chapter while Story is on
  document.addEventListener('click', ev => {
    if (get() !== 'story') return; const b = ev.target.closest && ev.target.closest('.pp-play'); if (!b) return;
    const c = CH.find(x => x.id === chSel); if (!c || !c.ready()) return;
    ev.preventDefault(); ev.stopImmediatePropagation();
    try { E().Audio.sfx('confirm'); } catch (_) {}
    if (c.id === 'route1') window.PS_ROUTE1.start();
  }, true);
  let mo = null, watched = null;
  function watch() { const pp = document.querySelector('.play-panel'); if (!pp || pp === watched) return; watched = pp; if (mo) mo.disconnect();
    mo = new MutationObserver(() => { if (get() === 'story') try { storyPanel(); } catch (_) {} }); mo.observe(pp, { childList: true, subtree: true, characterData: true }); }
  // Story: no rifts (the game's own) and the menu background is Route 1
  let riftWrapped = false, menuWorld = null;
  function storyWorld() {
    const N = E(); if (!N) return;
    if (!riftWrapped && N.Rift && typeof N.Rift.update === 'function') { riftWrapped = true; const up = N.Rift.update;
      N.Rift.update = function () { if (get() === 'story' && !N.Rift.inArena) return; return up.apply(this, arguments); }; }
    const g = B()?.game; if (!g || g.player) { menuWorld = null; return; }
    const want = get();   // rebuild the menu background when the mode changes
    if (menuWorld !== want) { menuWorld = want; try { if (want === 'story') N.Game.menuMap(1); N.World.reset(0x1092); if (want === 'story') N.World.setBiome(0, true); } catch (_) {} }
  }
  function init() { document.head.append(css); setInterval(() => { try { render(); watch(); storyPanel(); storyWorld(); } catch (_) {} }, 300); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
})();
