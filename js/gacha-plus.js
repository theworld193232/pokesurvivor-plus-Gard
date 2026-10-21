/* GACHA: ONE SPECIAL SUMMON BANNER
   - A single banner instead of nine regions. It draws from the Special Gacha pool (js/special-gacha.js):
     the starter Pokemon of every region, plus your allowed Legendaries (Magearna, Meloetta, Manaphy, Phione)
     with the same 1.5% Legendary chance (and the same 70-pull guarantee) as before.
   - Shiny chance raised from 1% to 1.5%.
   - New look built from the game's own assets: Poke Ball watermark, the Legendaries on a pedestal, Poke / Great /
     Ultra Ball pull buttons, a collection strip of every Pokemon in the pool (silhouettes until you own them) and
     a clear odds panel. Tickets, pity and the pull animation are the game's own. */
(() => {
  'use strict';
  if (window.PS_GACHAPLUS_INSTALLED) return; window.PS_GACHAPLUS_INSTALLED = true;
  const E = () => window.PS_HOOPA_ENGINE;
  const SP = () => window.PS_SPECIAL_GACHA;
  window.PS_GACHA_SINGLE = true;
  let done = false;
  function patch() {
    const N = E(), G = N && N.Gacha; if (done || !G || !N.DEX || !SP()) return; done = true;
    // one banner
    G.BANNERS.splice(0, G.BANNERS.length, { gen: 1, name: 'Special Summon', color: ['#2a1d6e', '#3a2a9a', '#1a6a8a'] });
    G.featured = () => [648, 801, 490];   // Meloetta, Magearna, Manaphy
    G.SHINY_RATE = 0.015;
  }
  const css = document.createElement('style');
  css.textContent = `
  #scr-gacha #gacha-gens{display:none !important}
  #scr-gacha #banner{position:relative;overflow:hidden;min-height:330px;border:3px solid #ffd23f !important;border-radius:16px;
    background:radial-gradient(ellipse at 50% 78%,rgba(255,230,120,.45),rgba(255,230,120,0) 42%),
      radial-gradient(circle at 85% 18%,rgba(255,120,200,.35),transparent 40%),radial-gradient(circle at 12% 30%,rgba(110,200,255,.35),transparent 42%),
      linear-gradient(160deg,#1b1450 0%,#33238f 45%,#155c7a 100%) !important;box-shadow:inset 0 0 0 3px rgba(0,0,0,.35),0 6px 0 rgba(0,0,0,.35)}
  #scr-gacha #banner::before{content:'';position:absolute;left:50%;top:52%;width:300px;height:300px;margin:-150px 0 0 -150px;background:url(assets/fx/pokeball.png?v=1) center/contain no-repeat;image-rendering:pixelated;opacity:.07;animation:psgSpin 40s linear infinite;pointer-events:none}
  #scr-gacha #banner::after{content:'';position:absolute;left:12%;right:12%;bottom:26px;height:46px;border-radius:50%;background:radial-gradient(ellipse,rgba(255,255,255,.28),rgba(255,255,255,0) 70%);box-shadow:0 0 0 3px rgba(255,210,63,.25);pointer-events:none}
  @keyframes psgSpin{to{transform:rotate(360deg)}}
  #scr-gacha #banner > *{position:relative;z-index:1}
  #scr-gacha #banner-title{font:900 34px Pixelify,Fredoka,system-ui,sans-serif;color:#ffe066;letter-spacing:1px;text-shadow:3px 3px 0 #2a1450,0 0 18px rgba(255,210,63,.55)}
  #scr-gacha #banner-desc{color:#e8ecff;font-weight:700;text-shadow:2px 2px 0 rgba(0,0,0,.45)}
  #scr-gacha #gacha-owned{color:#b9cbf0 !important}
  #scr-gacha .feat{display:flex;justify-content:center;align-items:flex-end;gap:4px;margin-top:6px}
  #scr-gacha .feat canvas{filter:drop-shadow(0 6px 0 rgba(0,0,0,.3)) drop-shadow(0 0 12px rgba(255,230,140,.35))}
  #scr-gacha .feat canvas{image-rendering:pixelated;transform:scale(1.45);transform-origin:50% 100%;margin:0 18px}
  #scr-gacha .feat canvas:nth-child(2){transform:scale(1.75) translateY(-4px)}
  #scr-gacha #banner{padding-bottom:18px}
  #ps-gtag{position:absolute !important;right:12px;bottom:10px;padding:4px 10px;border-radius:999px;background:linear-gradient(#ffe066,#ffb31a);color:#3a2400;font:900 12px Pixelify,Fredoka,system-ui,sans-serif;box-shadow:0 3px 0 #9a6400;letter-spacing:1px}
  #ps-gshiny{position:absolute !important;left:12px;bottom:10px;padding:4px 10px;border-radius:999px;background:linear-gradient(#bff4ff,#5fc8ff);color:#082a44;font:900 12px Pixelify,Fredoka,system-ui,sans-serif;box-shadow:0 3px 0 #1d6a9a}
  #scr-gacha #pull-1,#scr-gacha #pull-10,#scr-gacha #pull-10b,#scr-gacha #pull-100,#scr-gacha #pull-100b{display:flex;align-items:center;justify-content:center;gap:6px;font-weight:900;white-space:nowrap;font-size:15px}
  #scr-gacha .psg-ball{width:22px;height:22px;flex:none;image-rendering:pixelated;filter:drop-shadow(0 2px 0 rgba(0,0,0,.35))}
  #ps-gpool{margin-top:10px;padding:8px;border-radius:12px;background:rgba(10,16,40,.65);border:2px solid #2a3a6a}
  #ps-gpool .hd{display:flex;justify-content:space-between;font:800 12px Pixelify,Fredoka,system-ui,sans-serif;color:#cfe0ff;letter-spacing:1px;margin-bottom:4px}
  #ps-gpool .icons{display:flex;flex-wrap:wrap;gap:2px;max-height:190px;overflow-y:auto}
  #ps-gpool .ic{position:relative;width:40px;height:40px;border-radius:8px;background:rgba(255,255,255,.05)}
  #ps-gpool .ic.leg{background:radial-gradient(circle,rgba(255,210,63,.35),rgba(255,210,63,.05));box-shadow:inset 0 0 0 2px rgba(255,210,63,.6)}
  #ps-gpool .ic.sh::after{content:'✦';position:absolute;right:2px;top:0;color:#9ae6ff;font-size:11px;text-shadow:0 0 4px #9ae6ff}
  #ps-gpool canvas{width:40px;height:40px;image-rendering:pixelated}
  #scr-gacha #gacha-rates{display:block !important}
  #scr-gacha #gacha-rates #ps-grates,#scr-gacha #gacha-rates #ps-gpool{display:block;border-bottom:0;padding:8px}
  #scr-gacha #gacha-rates #ps-grates .r{display:flex;justify-content:flex-start;border-bottom:0;padding:6px 8px}
  #scr-gacha #gacha-rates #ps-gpool .hd{display:flex;justify-content:space-between;border-bottom:0;padding:0}
  #scr-gacha #gacha-rates #ps-gpool .icons{display:flex;justify-content:flex-start;border-bottom:0;padding:0}
  #scr-gacha #gacha-rates #ps-gpool .ic{display:block;border-bottom:0;padding:0}
  #scr-gacha #gacha-rates{font-size:13px}
  #ps-grates{font:700 13px Pixelify,Fredoka,system-ui,sans-serif;color:#e8ecff}
  #ps-grates h4{margin:0 0 8px;font-size:16px;color:#ffe066}
  #ps-grates .r{display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:10px;background:rgba(255,255,255,.05);margin:4px 0}
  #ps-grates .r img{width:22px;height:22px;image-rendering:pixelated}
  #ps-grates .r b{margin-left:auto}
  #ps-grates small{display:block;opacity:.75;font-weight:600;margin-top:8px;line-height:1.35}`;
  const BALL = { 'pull-1': 'ball-poke', 'pull-10': 'ball-great', 'pull-10b': 'ball-great', 'pull-100': 'ball-ultra', 'pull-100b': 'ball-ultra' };
  const MSG = 'The starter Pokémon of every region, plus the rare Legendaries Magearna, Meloetta, Manaphy and Phione! Every other Pokémon is found in the wild.';
  let poolKey = '';
  function decorate() {
    const N = E(), S = N?.DB?.save, scr = document.getElementById('scr-gacha'); if (!scr || scr.classList.contains('hidden') || !S || !SP()) return;
    const t = document.getElementById('banner-title'); if (t && t.textContent !== '✦ Special Summon ✦') t.textContent = '✦ Special Summon ✦';
    const d = document.getElementById('banner-desc'); if (d && d.textContent !== MSG) d.textContent = MSG;
    const bn = document.getElementById('banner');
    if (bn && !document.getElementById('ps-gtag')) { bn.insertAdjacentHTML('beforeend', '<span id="ps-gtag">LEGENDARY 1.5%</span><span id="ps-gshiny">✦ SHINY 1.5%</span>'); }
    for (const [id, b] of Object.entries(BALL)) { const el = document.getElementById(id); if (el && !el.querySelector('.psg-ball')) el.insertAdjacentHTML('afterbegin', '<img class="psg-ball" src="assets/fx/' + b + '.png?v=1" alt="">'); }
    const sp = SP(), pool = Object.keys(sp.LEGENDS).map(Number).concat(sp.pool());   if (pool.length < 5) return;
    const own = pool.filter(dx => S.owned && S.owned[dx]).length, sh = pool.filter(dx => S.shiny && S.shiny[dx]).length;
    const ow = document.getElementById('gacha-owned'), owTxt = 'You have ' + own + ' of ' + pool.length + ' · ' + sh + ' shiny'; if (ow && ow.textContent !== owTxt) ow.textContent = owTxt;
    // collection strip
    const left = bn && bn.parentNode; let strip = document.getElementById('ps-gpool');
    const rcol = document.getElementById('gacha-rates');
    if (rcol && (!strip || strip.parentNode !== rcol) && rcol.querySelector('#ps-grates')) { if (!strip) { strip = document.createElement('div'); strip.id = 'ps-gpool'; } rcol.appendChild(strip); poolKey = ''; }
    const key = pool.map(dx => (S.owned && S.owned[dx] ? 1 : 0) + '' + (S.shiny && S.shiny[dx] ? 1 : 0)).join('');
    if (strip && key !== poolKey) { poolKey = key; strip.innerHTML = '<div class="hd"><span>POKÉMON IN THIS BANNER</span><span>' + own + ' / ' + pool.length + '</span></div><div class="icons"></div>'; const box = strip.querySelector('.icons');
      for (const dx of pool) { const o = !!(S.owned && S.owned[dx]), s = !!(S.shiny && S.shiny[dx]), c = document.createElement('div'); c.className = 'ic' + (sp.LEGENDS[dx] ? ' leg' : '') + (s ? ' sh' : ''); c.title = (N.DEX_BY[dx] || {}).name || '';
        try { c.appendChild(N.UI.spriteCanvas(dx, 40, 40, { scale: 1, silhouette: !o, shiny: s })); } catch (_) {} box.appendChild(c); } }
    // odds
    const rates = document.getElementById('gacha-rates');
    if (rates && !rates.querySelector('#ps-grates')) rates.innerHTML = '<div id="ps-grates"><h4>Odds</h4>' +
      '<div class="r"><img src="assets/fx/ball-master.png?v=1" alt="">Legendary<br>Magearna · Meloetta · Manaphy · Phione<b>1.5%</b></div>' +
      '<div class="r"><img src="assets/fx/ball-great.png?v=1" alt="">A starter Pokémon<br>(Bulbasaur, Charmander, Squirtle… every region)<b>98.5%</b></div>' +
      '<div class="r"><img src="assets/fx/ball-poke.png?v=1" alt="">✦ Shiny (any pull)<b>1.5%</b></div>' +
      '<small>70 pulls without a Legendary guarantee one.<br>Duplicates turn into PokéCoins. Every other Pokémon comes from the wild.</small></div>';
  }
  function init() {
    document.head.append(css);
    const t = setInterval(() => { patch(); if (done) clearInterval(t); }, 300);
    setInterval(() => { try { decorate(); } catch (e) { console.warn('[gacha]', e); } }, 250);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
})();
