/* PARTNER RULES: you play as a first-stage Pokemon and evolve it through gameplay.
   - Any Pokemon you own that has no previous evolution can be your partner: first stages (Ralts, Dratini,
     Bulbasaur...), Legendaries, Mythicals, Ultra Beasts and every other Pokemon that doesn't evolve from another.
   - Choosing an evolved Pokemon you own (Kirlia, Gardevoir) gives you its first stage instead (Ralts): you reach
     Gardevoir by evolving in a run, and she gets her own upgrades when you get there (js/evo-upgrades.js).
   - The Pokedex still shows every Pokemon.
   - Defeating a shiny evolved Pokemon in the wild (or catching an evolved one) also gives you its first stage
     (shiny Gardevoir -> shiny Ralts), since that's the one you can play as.
   - The owner account (LoverGare) can pick any Pokemon. */
(() => {
  'use strict';
  if (window.PS_PARTNER_INSTALLED) return; window.PS_PARTNER_INSTALLED = true;
  const E = () => window.PS_HOOPA_ENGINE, B = () => window.PS_MEGA_BRIDGE_V5;
  const MAX_RARITY = 3;
  const owner = () => String(B()?.user || '').trim().toLowerCase() === 'lovergare';
  let prevo = null;
  function prev() {
    if (prevo) return prevo; const N = E(); if (!N || !N.EVOS) return null; prevo = {};
    for (const [from, list] of Object.entries(N.EVOS)) for (const [to] of list || []) if (prevo[to] == null) prevo[to] = Number(from);
    return prevo;
  }
  function base(dex) { const P = prev(); let d = Number(dex), n = 0; while (P && P[d] != null && n++ < 5) d = P[d]; return d; }
  function allowed(dex) { const N = E(), p = N && N.DEX_BY[dex]; if (!p) return false; const P = prev(); return !(P && P[dex] != null); }   // any Pokemon without a previous evolution (Legendaries and Ultra Beasts too)
  // what picking this Pokemon does: {ok} / {ok:false, base} / {ok:false, none}
  function rule(dex) {
    if (owner() || allowed(dex)) return { ok: true };
    const b = base(dex); if (b !== Number(dex) && allowed(b)) return { ok: false, base: b, baseName: (E().DEX_BY[b] || {}).name || 'its first stage' };
    return { ok: false, none: true };
  }
  function choose(dex, shiny) {   // returns the dex that actually became the partner (or null)
    const N = E(), s = N.DB.save; const r = rule(dex); let d = r.ok ? Number(dex) : r.base; if (!d) return null;
    try { if (!N.DB.owns(d)) N.DB.grant(d, 'evo-line'); } catch (_) {}
    if (shiny && d !== Number(dex)) { try { if (!N.DB.ownsShiny(d)) N.DB.grantShiny(d, 'evo-line'); } catch (_) {} }
    s.partner = d; s.partnerShiny = !!shiny && N.DB.ownsShiny(d); try { N.DB.commit(); } catch (_) {}
    return d;
  }
  window.PS_PARTNER = { owner, allowed, base, rule, choose, MAX_RARITY };
  // A shiny (or caught) evolved Pokemon from the wild: its Pokedex entry is registered as usual (Gardevoir and shiny
  // Gardevoir), and you also receive its first stage (shiny Ralts), which is the one you can play as.
  let dbHooked = false;
  function hookDB() {
    const N = E(), D = N && N.DB; if (dbHooked || !D || typeof D.grantShiny !== 'function' || !prev()) return; dbHooked = true;
    const gs = D.grantShiny, gr = D.grant, WILD = new Set(['wild', 'catch', 'roam']);
    D.grantShiny = function (dex, from) { const r = gs.apply(this, arguments);
      try { const b = base(dex); if (WILD.has(from) && b !== Number(dex) && N.DEX_BY[b]) { const had = D.ownsShiny(b); if (!D.owns(b)) gr.call(D, b, from); gs.call(D, b, from);
        if (!had) try { N.Spawner.say('You got a shiny ' + N.DEX_BY[b].name + '!', 3.5, true); } catch (_) {} } } catch (_) {}
      return r; };
    D.grant = function (dex, from) { const r = gr.apply(this, arguments);
      try { const b = base(dex); if (from === 'catch' && b !== Number(dex) && N.DEX_BY[b] && !D.owns(b)) gr.call(D, b, from); } catch (_) {}
      return r; };
  }
  const hk = setInterval(() => { hookDB(); if (dbHooked) clearInterval(hk); }, 300);
  // a partner that isn't allowed (old saves, the game's own Pokedex screen) becomes its first stage
  setInterval(() => { try {
    const N = E(), s = N?.DB?.save, g = B()?.game; if (!s || !prev() || owner() || (g && g.player && g.state !== 'ui')) return;
    const cur = Number(s.partner); if (!cur || allowed(cur)) return;
    const r = rule(cur), sh = !!s.partnerShiny && N.DB.ownsShiny(cur);
    let d = r.base || null;
    if (!d) { const st = Number(s.starter); d = st && allowed(st) ? st : (Object.keys(s.owned || {}).map(Number).find(allowed) || 1); }
    const from = (N.DEX_BY[cur] || {}).name, to = (N.DEX_BY[d] || {}).name;
    choose(d, sh);
    try { N.UI.toast(r.base ? to + ' is your partner: evolve it in battle to become ' + from + '!' : from + " can't be a partner. " + to + ' is your partner now.'); } catch (_) {}
  } catch (_) {} }, 700);
})();
