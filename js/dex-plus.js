/* POKÉMON COLLECTION SCREEN (ported from the newer PokéSurvivor "Pokémon" screen, adapted to this game).
   Opens from the main menu's "Pokémon" button. Region tabs with counts, search by name or number, type filter,
   Owned / Missing / Shiny / Favorites / rarity chips, sorting, a grid that loads in pages, and a detail card with
   the big animated sprite, Normal / Shiny toggle, favorite, type chips, HP / Attack / Speed bars and "Choose as partner".
   (No Sp. Atk / Defense / Sp. Def: this game doesn't use them.) Favorites are saved in your save as "favs". */
(() => {
  'use strict';
  if (window.PS_DEXPLUS_INSTALLED) return; window.PS_DEXPLUS_INSTALLED = true;
  const E = () => window.PS_HOOPA_ENGINE;
  const GEN = ['Kanto', 'Johto', 'Hoenn', 'Sinnoh', 'Unova', 'Kalos', 'Alola', 'Galar', 'Paldea'];
  const RAR = { 1: 'Common', 2: 'Uncommon', 3: 'Rare', 4: 'Epic', 5: 'Legendary' };
  const RCOL = { 1: '#9fb1c9', 2: '#5fe08a', 3: '#4fb4ff', 4: '#c47bff', 5: '#ffcb3d' };
  const SORTS = [['num', 'No.'], ['name', 'Name'], ['rar', 'Rarity'], ['new', 'Recently caught'], ['used', 'Most played']];
  const F0 = () => ({ q: '', type: '', status: 'all', shiny: false, fav: false, rar: new Set(), sort: 'num' });
  let F = F0(), gen = 0, sel = null, viewShiny = false;
  const S = () => E()?.DB?.save || {};
  const isFav = d => !!(S().favs && S().favs[d]);
  const setFav = (d, v) => { const s = S(); s.favs = s.favs || {}; if (v) s.favs[d] = 1; else delete s.favs[d]; try { E().DB.commit(); } catch (_) {} };
  const owns = d => !!(S().owned && S().owned[d]);
  const ownsShiny = d => { try { return E().DB.ownsShiny(d); } catch (_) { return !!(S().shiny && S().shiny[d]); } };
  const ico = (k, n) => { try { return E().Icons.html(k, n); } catch (_) { return ''; } };
  const stars = (r, n) => { try { return E().UI.stars(r, n); } catch (_) { return ''; } };
  const TN = () => (E()?.U?.TYPE_NAME) || {};
  const tname = t => { const n = TN()[t] || t; return ({ Fuego: 'Fire', Agua: 'Water', Planta: 'Grass', 'Eléctrico': 'Electric', Hielo: 'Ice', Lucha: 'Fighting', Veneno: 'Poison', Tierra: 'Ground', Volador: 'Flying', 'Psíquico': 'Psychic', Bicho: 'Bug', Roca: 'Rock', Fantasma: 'Ghost', 'Dragón': 'Dragon', Siniestro: 'Dark', Acero: 'Steel', Hada: 'Fairy', Normal: 'Normal' })[n] || n; };

  const css = document.createElement('style');
  css.textContent = `
  #ps-dex .box{width:min(1180px,100%);height:min(860px,calc(100vh - 40px));display:flex;flex-direction:column;padding:18px 22px}
  #ps-dex .hd{display:flex;align-items:center;gap:12px}#ps-dex .hd h2{margin:0}#ps-dex .hd .tot{color:var(--muted);font-size:20px}#ps-dex .hd .btn{margin-left:auto}
  #ps-dex .gens{display:flex;gap:6px;flex-wrap:wrap;margin:12px 0 10px}
  #ps-dex .gen{appearance:none;cursor:pointer;padding:6px 12px;border-radius:9px;border:2px solid var(--edge-in);background:rgba(0,0,0,.18);color:#fff;text-align:center;font:inherit;text-shadow:2px 2px 0 var(--shadow)}
  #ps-dex .gen b{display:block;font-size:16px}#ps-dex .gen small{font-size:12px;color:var(--muted)}#ps-dex .gen.on{border-color:var(--gold);background:rgba(255,210,63,.12)}
  #ps-dex .main{flex:1;min-height:0;display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:16px}
  #ps-dex .left{min-height:0;display:flex;flex-direction:column}
  #ps-dex .row1{display:flex;gap:10px;align-items:center;flex-wrap:wrap}#ps-dex .row1 .field{flex:1;min-width:180px;padding:8px 12px;font-size:15px}
  #ps-dex select.field{flex:0 0 auto;width:auto}#ps-dex .cnt{color:var(--muted);font-size:14px}
  #ps-dex .chips{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0 0;align-items:center}#ps-dex .chips .sub{margin:0 4px 0 0}
  #ps-dex .chip{appearance:none;cursor:pointer;padding:5px 12px;border-radius:999px;border:2px solid var(--edge-in);background:rgba(0,0,0,.18);color:#fff;font:inherit;font-size:14px;display:inline-flex;align-items:center;gap:5px;text-shadow:2px 2px 0 var(--shadow)}
  #ps-dex .chip.on{border-color:var(--gold);color:var(--gold);background:rgba(255,210,63,.1)}#ps-dex .chip img{image-rendering:pixelated}
  #ps-dex .grid{flex:1;min-height:0;overflow:auto;margin-top:10px;display:grid;grid-template-columns:repeat(auto-fill,minmax(118px,1fr));gap:8px;align-content:start;padding-right:4px}
  #ps-dex .cell{position:relative;cursor:pointer;border-radius:10px;border:2px solid var(--edge-in);background:rgba(0,0,0,.18);padding:6px 4px 6px;display:flex;flex-direction:column;align-items:center;min-height:132px}
  #ps-dex .cell:hover{background:rgba(255,255,255,.06)}#ps-dex .cell.on{border-color:var(--gold);box-shadow:0 0 0 2px rgba(255,210,63,.35)}
  #ps-dex .cell .no{position:absolute;left:8px;top:5px;font-size:12px;color:var(--muted)}#ps-dex .cell .br{position:absolute;right:6px;top:4px}
  #ps-dex .cell canvas{margin-top:14px;image-rendering:pixelated}#ps-dex .cell b{font-size:13px;text-align:center;line-height:1.1;margin:2px 0}
  #ps-dex .cell.locked b{color:var(--muted)}
  #ps-dex .det{min-height:0;overflow:auto;border-radius:12px;border:2px solid var(--edge-in);background:rgba(0,0,0,.2);padding:14px;display:flex;flex-direction:column;gap:6px}
  #ps-dex .stage{display:block;margin:0 auto;width:220px;height:190px;border-radius:12px;border:4px solid var(--stage-c,#5b83d6);background:radial-gradient(circle at 50% 60%,rgba(255,255,255,.08),rgba(0,0,0,.35))}
  #ps-dex .stage.shiny{box-shadow:0 0 18px rgba(154,230,255,.5)}
  #ps-dex .seg{display:flex;justify-content:center;gap:6px}#ps-dex .seg button{appearance:none;cursor:pointer;padding:4px 12px;border-radius:8px;border:2px solid var(--edge-in);background:rgba(0,0,0,.2);color:#fff;font:inherit;font-size:13px}#ps-dex .seg button.on{border-color:var(--gold);color:var(--gold)}
  #ps-dex .det h3{margin:0;font-size:24px}#ps-dex .center{text-align:center}#ps-dex .mut{color:var(--muted);font-size:13px}
  #ps-dex .stat{display:grid;grid-template-columns:70px 1fr 54px;gap:8px;align-items:center;font-size:15px}
  #ps-dex .stat .bar{height:10px;border-radius:5px;background:#0b1838;box-shadow:0 0 0 2px var(--edge-in);overflow:hidden}#ps-dex .stat .bar i{display:block;height:100%;background:linear-gradient(180deg,#ffe37a,#f0a31e)}
  #ps-dex .types{display:flex;justify-content:center;gap:6px}#ps-dex .ty{padding:2px 10px;border-radius:6px;font-size:13px;color:#14102a;text-shadow:none}
  #ps-dex .moves{display:flex;flex-wrap:wrap;gap:3px;justify-content:center}#ps-dex .moves img{image-rendering:pixelated}
  @media (max-width:820px){#ps-dex .main{grid-template-columns:1fr}#ps-dex .det{max-height:46vh}}`;
  const scr = document.createElement('section'); scr.id = 'ps-dex'; scr.className = 'scr dim hidden'; scr.style.zIndex = '30';
  scr.innerHTML = '<div class="box"><div class="hd"><h2>Pokémon</h2><span class="tot"></span><button class="btn small" data-back="1">Back</button></div><div class="gens"></div>' +
    '<div class="main"><div class="left"><div class="row1"><input class="field" data-q="1" placeholder="Search by name or number"><select class="field" data-type="1"></select><span class="cnt"></span></div>' +
    '<div class="chips" data-f="1"></div><div class="chips" data-s="1"></div><div class="grid"></div></div><div class="det"></div></div></div>';
  const $ = q => scr.querySelector(q);

  function open() {
    const s = S(), N = E(); if (!N || !N.DEX) return;
    if (sel == null) { sel = s.partner || 1; gen = (N.DEX_BY[sel] && N.DEX_BY[sel].gen) || 0; }
    $('.tot').textContent = Object.keys(s.owned || {}).filter(d => N.DEX_BY[d]).length + ' / ' + N.DEX.length;
    const tabs = $('.gens'); tabs.innerHTML = '';
    ['All', ...GEN].forEach((name, g) => { const L = g ? N.DEX.filter(p => p.gen === g) : N.DEX, have = L.filter(p => owns(p.dex)).length;
      const b = document.createElement('button'); b.className = 'gen' + (g === gen && !F.q ? ' on' : ''); b.innerHTML = '<b>' + name + '</b><small>' + have + '/' + L.length + '</small>'; b.onclick = () => { gen = g; open(); }; tabs.appendChild(b); });
    const fb = $('[data-f]'); fb.innerHTML = '';
    const chip = (html, on, fn, box) => { const c = document.createElement('button'); c.className = 'chip' + (on ? ' on' : ''); c.innerHTML = html; c.onclick = () => { fn(); open(); }; (box || fb).appendChild(c); };
    for (const [k, l] of [['all', 'All'], ['own', 'Owned'], ['miss', 'Missing']]) chip(l, F.status === k, () => { F.status = k; });
    chip(ico('shiny', 12) + ' Shiny', F.shiny, () => { F.shiny = !F.shiny; });
    chip(ico('star', 12) + ' Favorites', F.fav, () => { F.fav = !F.fav; });
    for (const r of [5, 4, 3, 2, 1]) chip(stars(r, 12) + ' ' + RAR[r], F.rar.has(r), () => { F.rar.has(r) ? F.rar.delete(r) : F.rar.add(r); });
    const sb = $('[data-s]'); sb.innerHTML = '<span class="sub">Sort:</span>';
    for (const [k, l] of SORTS) chip(l, F.sort === k, () => { F.sort = k; }, sb);
    const ts = $('[data-type]'); ts.innerHTML = '<option value="">All types</option>' + Object.keys(TN()).map(t => '<option value="' + t + '">' + tname(t) + '</option>').join(''); ts.value = F.type; ts.onchange = () => { F.type = ts.value; open(); };
    const q = $('[data-q]'); if (q.value !== F.q) q.value = F.q;
    q.oninput = () => { clearTimeout(qT); qT = setTimeout(() => { F.q = q.value; grid(); tabs.querySelectorAll('.gen').forEach((b, g) => b.classList.toggle('on', g === gen && !F.q)); }, 150); };
    q.onkeydown = e => { e.stopPropagation(); if (e.key === 'Escape') q.blur(); };
    grid(); detail(sel);
    scr.classList.remove('hidden'); scr.style.display = 'flex';
  }
  function close() { scr.classList.add('hidden'); scr.style.display = 'none'; try { E().MenuUI.open(); } catch (_) {} }
  function list() {
    const s = S(), N = E(), q = F.q.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''), num = /^#?\d+$/.test(q) ? +q.replace('#', '') : null;
    const L = N.DEX.filter(p => { const own = owns(p.dex);
      if (q) { if (num != null ? p.dex !== num : !(own && String(p.name).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').includes(q))) return false; } else if (gen && p.gen !== gen) return false;
      if (F.status === 'own' && !own) return false; if (F.status === 'miss' && own) return false;
      if (F.shiny && !ownsShiny(p.dex)) return false; if (F.fav && !isFav(p.dex)) return false;
      if (F.rar.size && !F.rar.has(p.rarity)) return false; if (F.type && !(own && p.types.includes(F.type))) return false; return true; });
    const at = p => (s.owned && s.owned[p.dex] && s.owned[p.dex].at) || 0, used = p => +((s.pused || {})[p.dex] || (s.stats && s.stats.plays && s.stats.plays[p.dex]) || 0);
    const by = { num: (a, b) => a.dex - b.dex, name: (a, b) => String(a.name).localeCompare(String(b.name)), rar: (a, b) => b.rarity - a.rarity || a.dex - b.dex, new: (a, b) => at(b) - at(a) || a.dex - b.dex, used: (a, b) => used(b) - used(a) || a.dex - b.dex }[F.sort];
    if (F.sort === 'name') L.sort((a, b) => (!owns(a.dex)) - (!owns(b.dex)) || by(a, b)); else L.sort(by);
    return L;
  }
  const PAGE = 48; let qT = 0, gl = [], shown = 0, io = null;
  function grid(keep) {
    const g = $('.grid'), want = keep ? Math.max(PAGE, shown) : PAGE, top = g.scrollTop; g.innerHTML = ''; gl = list(); shown = 0;
    $('.cnt').textContent = gl.length === 1 ? '1 Pokémon' : gl.length + ' Pokémon';
    if (!gl.length) { g.innerHTML = '<p class="sub" style="grid-column:1/-1">No Pokémon match these filters.</p>'; return; }
    more(want); if (keep) g.scrollTop = top;
  }
  function more(n) {
    const g = $('.grid'), old = g.querySelector('.more'); if (old) { if (io) io.unobserve(old); old.remove(); }
    const end = Math.min(gl.length, shown + (n || PAGE)); for (let i = shown; i < end; i++) g.appendChild(cell(gl[i])); shown = end;
    if (shown >= gl.length) return; const m = document.createElement('div'); m.className = 'more'; m.style.cssText = 'grid-column:1/-1;height:4px'; g.appendChild(m);
    if (!('IntersectionObserver' in window)) { more(gl.length); return; }
    io = io || new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) more(); }, { root: g, rootMargin: '300px' }); io.observe(m);
  }
  function cell(p) {
    const s = S(), own = owns(p.dex), sh = ownsShiny(p.dex), c = document.createElement('div');
    c.className = 'cell' + (own ? '' : ' locked') + (p.dex === sel ? ' on' : '');
    c.insertAdjacentHTML('beforeend', '<span class="no">' + String(p.dex).padStart(3, '0') + '</span>');
    if (p.dex === s.partner) c.insertAdjacentHTML('beforeend', '<span class="br" title="Partner">' + ico('crown', 14) + '</span>');
    else if (isFav(p.dex)) c.insertAdjacentHTML('beforeend', '<span class="br" title="Favorite">' + ico('star', 12) + '</span>');
    else if (sh) c.insertAdjacentHTML('beforeend', '<span class="br" title="Shiny owned">' + ico('shiny', 12) + '</span>');
    try { c.appendChild(E().UI.spriteCanvas(p.dex, 92, 74, { scale: 2, silhouette: !own, shadow: own, shiny: sh && p.dex === s.partner && s.partnerShiny })); } catch (_) {}
    c.insertAdjacentHTML('beforeend', '<b>' + (own ? p.name : '???') + '</b>' + stars(p.rarity, 9));
    c.onclick = () => { sel = p.dex; $('.grid').querySelectorAll('.cell').forEach(x => x.classList.remove('on')); c.classList.add('on'); detail(p.dex); };
    return c;
  }
  // partner button, following js/partner-rules.js (first-stage Pokemon only; evolved ones start as their first stage)
  function pickBtn(dex, p, viewShiny) {
    const R = window.PS_PARTNER, r = R ? R.rule(dex) : { ok: true };
    if (r.ok) return '<button class="btn gold" data-pick="1" style="width:100%">Choose as partner' + (viewShiny ? ' (shiny)' : '') + '</button>';
    if (r.base) return '<button class="btn gold" data-pick="1" style="width:100%">Play as ' + r.baseName + (viewShiny ? ' (shiny)' : '') + '</button><p class="sub center" style="margin:4px 0 0">Evolve ' + r.baseName + ' in battle to play as ' + p.name + '.</p>';
    return '<button class="btn" disabled style="width:100%">Can\'t be a partner</button><p class="sub center" style="margin:4px 0 0">Only Pokémon without a previous evolution can be partners.</p>';
  }
  function detail(dex) {
    const s = S(), N = E(), p = N.DEX_BY[dex]; if (!p) return;
    const own = owns(dex), hasSh = ownsShiny(dex), isP = dex === s.partner;
    if (!hasSh) viewShiny = false; else if (isP && dex !== detail.last) viewShiny = !!s.partnerShiny; detail.last = dex;
    const bar = (l, v, m, t) => '<div class="stat"><span>' + l + '</span><div class="bar"><i style="width:' + Math.min(100, v / m * 100) + '%"></i></div><span>' + t + '</span></div>';
    const using = isP && (!hasSh || !!s.partnerShiny === viewShiny);
    const tc = t => '<span class="ty" style="background:' + ((N.U.TYPE_COLOR || {})[t] || '#ccc') + '">' + tname(t) + '</span>';
    let moves = ''; try { moves = N.Moves.poolFor(p).map(id => '<span title="' + (N.Moves.BY_ID[id] || {}).name + '">' + ico('move:' + id, 16) + '</span>').join(''); } catch (_) {}
    let start = ''; try { start = (N.Moves.BY_ID[N.startMoveOf(dex)] || {}).name || ''; } catch (_) {}
    const d = $('.det');
    d.innerHTML = '<canvas class="stage" width="220" height="190"></canvas>' +
      (hasSh ? '<div class="seg"><button class="' + (viewShiny ? '' : 'on') + '" data-v="0">Normal</button><button class="' + (viewShiny ? 'on' : '') + '" data-v="1">' + ico('shiny', 12) + ' Shiny</button></div>' : '') +
      '<div class="center"><div class="mut">Nº ' + String(p.dex).padStart(3, '0') + ' · ' + (GEN[p.gen - 1] || '') + '</div><h3>' + (own ? p.name : '???') + '</h3>' +
      (own ? '<button class="chip' + (isFav(dex) ? ' on' : '') + '" data-fav="1" style="margin:6px auto">' + ico('star', 12) + ' ' + (isFav(dex) ? 'Favorite' : 'Mark as favorite') + '</button>' : '') +
      '<div style="color:' + RCOL[p.rarity] + ';margin:4px 0">' + stars(p.rarity, 24) + ' ' + RAR[p.rarity] + '</div>' + (own ? '<div class="types">' + p.types.map(tc).join('') + '</div>' : '') + '</div>' +
      (own ? bar('HP', p.hp, 183, p.hp) + bar('Attack', p.atk, 1.55, '×' + Number(p.atk).toFixed(2)) + bar('Speed', p.spd, 137, p.spd) +
        (p.types.length === 1 ? '<p class="sub center" style="margin:4px 0 0">Single type: +20% damage with its ' + tname(p.types[0]) + ' moves</p>' : '') +
        (start ? '<p class="center" style="margin:6px 0 2px;font-size:14px">Starts with <b class="gold">' + start + '</b></p>' : '') + (moves ? '<div class="moves">' + moves + '</div>' : '') +
        (using ? '<button class="btn" disabled style="width:100%">Your partner</button>' : pickBtn(dex, p, viewShiny))
        : '<p class="center mut">You don\'t have it yet.<br>Get it from the <b class="gold">' + (GEN[p.gen - 1] || '') + '</b> banner' + (p.rarity === 5 ? ', a Legendary Den,' : '') + ' or by defeating it when it shows up shiny.</p>');
    const cv = d.querySelector('.stage'); cv.style.setProperty('--stage-c', !own ? '#5b83d6' : viewShiny ? '#9ae6ff' : ((N.U.TYPE_COLOR || {})[p.types[0]] || '#5b83d6')); cv.classList.toggle('shiny', own && viewShiny);
    try { N.UI.sprite(cv, dex, { lively: own, spin: own, silhouette: !own, scale: 3, hero: true, shiny: own && viewShiny }); } catch (_) {}
    d.querySelectorAll('.seg button').forEach(b => { b.onclick = () => { viewShiny = b.dataset.v === '1'; detail(dex); }; });
    const fv = d.querySelector('[data-fav]'); if (fv) fv.onclick = () => { setFav(dex, !isFav(dex)); grid(true); detail(dex); };
    const pk = d.querySelector('[data-pick]'); if (pk) pk.onclick = () => {
      const R = window.PS_PARTNER; let nd = dex;
      if (R) nd = R.choose(dex, hasSh && viewShiny) || dex; else { s.partner = dex; s.partnerShiny = hasSh && viewShiny; try { N.DB.commit(); } catch (_) {} }
      const q = N.DEX_BY[nd] || p; try { N.UI.toast(q.name + (s.partnerShiny ? ' (shiny)' : '') + ' is now your partner' + (nd !== dex ? ': evolve it in battle to become ' + p.name + '!' : '')); } catch (_) {} grid(true); detail(nd !== dex ? dex : dex); };
  }
  scr.addEventListener('click', e => { if (e.target.closest('[data-back]')) close(); });
  addEventListener('keydown', e => { if (scr.style.display === 'flex' && e.key === 'Escape') { e.stopImmediatePropagation(); e.preventDefault(); close(); } }, true);
  // the main menu's "Pokémon" button opens this screen instead of the old one
  document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-go="dex"]'); if (!b || !E()) return; e.stopImmediatePropagation(); e.preventDefault(); try { E().Audio.sfx('click'); } catch (_) {} open(); }, true);
  function init() { document.head.append(css); document.body.append(scr); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
  window.PS_DEXPLUS = { open, close };
})();
