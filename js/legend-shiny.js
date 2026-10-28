/* [Gard v86] Legendary encounters can be shiny.
   The roaming legendaries, Dens and Hoopa already roll their own shinies; the scripted legendary fights
   (the Regis, the Tapu guardians, the forest trio, Birth Island, Lugia...) never did, and their reward
   was always the normal colours. Now:
   - any legendary boss that appears has a SHINY_RATE chance to be shiny (the game's own makeShiny: shiny
     sprite, sparkles, sturdier, more XP) - Arceus is left alone, it's the stage boss;
   - winning a shiny one grants its shiny form as well (DB.grant -> DB.grantShiny).
   Dens, roamers and Hoopa keep their own (rarer) shiny odds: only the one-time scripted fights get this roll.
   Glastrier and Koraidon had no shiny sprites at all; they now have shiny sheets (assets/pokemon/896/s, 1007/s). */
(() => {
  'use strict';
  const SHINY_RATE = 0.10, KEEP = 15 * 60 * 1000, SKIP = new Set([493]);
  const met = new Map();   // dex -> when a shiny one was met
  const R = () => window.__PSX_REG__;
  const SCRIPTED = /\/js\/ai\/|forest-sanctuary|crystal-peak|regi-cave|lore-events|groudon-den/, OWN_ODDS = /dens\.js|roamers\.js|hoopa\.js/;
  const fromScriptedFight = () => { const st = String(new Error().stack || ''); return SCRIPTED.test(st) && !OWN_ODDS.test(st); };
  const isLegend = d => { try { return !!R().getPokemon(Number(d))?.leg; } catch (_) { return false; } };
  function install() {
    const r = R(); if (!r || !r.EnemyMgr || !r.DB || r.EnemyMgr.__gardLegendShiny) return false;
    for (const d of [896, 1007]) try { if (r.SPRITE_META[d] && !r.SPRITE_META[d].sh) r.SPRITE_META[d].sh = 1; } catch (_) {}
    const add = r.EnemyMgr.add;
    r.EnemyMgr.add = function (e, ...a) {
      try {
        if (e && e.boss && !e.remote && !e.__psLegendRolled && isLegend(e.dex) && !SKIP.has(Number(e.dex)) && fromScriptedFight()) {
          e.__psLegendRolled = true;
          if (!e.shiny && Math.random() < Number(window.PS_LEGEND_SHINY?.rate ?? SHINY_RATE) && typeof e.makeShiny === 'function') e.makeShiny();
          if (e.shiny) met.set(Number(e.dex), Date.now());
        }
      } catch (_) {}
      return add.call(this, e, ...a);
    };
    const grant = r.DB.grant;
    r.DB.grant = function (dex, ...a) {
      const out = grant.call(this, dex, ...a);
      try {
        const d = Number(dex), t = met.get(d);
        if (t && Date.now() - t < KEEP) { met.delete(d); if (typeof r.DB.grantShiny === 'function') r.DB.grantShiny(d, ...a); try { r.UI.toast('✨ Shiny ' + (r.getPokemon(d)?.name || '') + ' joined you!', 3200); } catch (_) {} }
      } catch (_) {}
      return out;
    };
    r.EnemyMgr.__gardLegendShiny = true;
    window.PS_LEGEND_SHINY = { SHINY_RATE, rate: SHINY_RATE, met };
    return true;
  }
  (function wait() { if (!install()) setTimeout(wait, 300); })();
})();
