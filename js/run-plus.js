/* RUN PLUS: start with 5 cards + biome spawns
   1) Every run starts with 5 cards to pick (5 ★ points: press Shift / tap ★), in every Act and Level,
      in Original and Story. Not in co-op (the host's points are shared there).
   2) More wild Pokemon, matched to the biome you're standing in (js/terrain.js):
        every 12-18 s a group of 3-5 shows up on top of the game's normal spawns, picked from the biome's types
        (Power Plant -> Electric / Steel, Lava Fields -> Fire / Rock, Sea Grotto -> Water / Rock, ...).
        About 40% of each group are Pokemon whose type is super effective against YOUR Pokemon
        (from the biome's types when possible, otherwise any type that beats you).
        Early in a run they're mostly first forms; evolved ones join as the clock goes on.
      Not in co-op, Rift arenas, Safe Zones, Story Route 1 or the Legendary Den mode (same rules as js/wild-spawns.js).
   Every number is in CFG. */
(() => {
  'use strict';
  if (window.PS_RUNPLUS_INSTALLED) return; window.PS_RUNPLUS_INSTALLED = true;
  const B = () => window.PS_MEGA_BRIDGE_V5, E = () => window.PS_HOOPA_ENGINE;
  const CFG = {
    startCards: 5,
    every: [12, 18], group: [3, 5], counterShare: 0.4, maxEnemies: 150,
    rarityByTime: [[0, 2], [240, 3], [600, 4]],   // [from second, highest rarity allowed]
  };
  // biome name (js/terrain.js) -> types that live there
  const BIOME = {
    'Shady Forest': ['bug', 'grass', 'normal'], 'Flower Meadow': ['grass', 'fairy', 'normal', 'flying'],
    'Sunny Beach': ['water', 'ground', 'flying'], 'Lava Fields': ['fire', 'rock'], 'Power Plant': ['electric', 'steel'],
    'Red Desert': ['ground', 'rock', 'fire'], 'Frozen Glacier': ['ice', 'water'], 'Emerald Jungle': ['grass', 'bug', 'poison'],
    'Old Graveyard': ['ghost', 'dark', 'poison'], 'Crystal Caves': ['rock', 'steel', 'psychic', 'fairy'], 'Sea Grotto': ['water', 'rock', 'dragon'],
  };
  const clock = () => { try { const t = E().Game.time; return Number(typeof t === 'function' ? t() : t) || 0; } catch (_) { return 0; } };
  const rnd = (a, b) => a + Math.random() * (b - a), irnd = (a, b) => Math.floor(rnd(a, b + 1));

  // ---- 1) five cards at the start of every run ----
  let giftFor = null;
  function cards(p) {
    const N = E(); if (!p || giftFor === p || !N || !N.Game) return;
    if (N.Coop && N.Coop.active) { giftFor = p; return; }
    if (B()?.game?.state !== 'playing') return;
    giftFor = p; if (typeof N.Game.addSkillPoints === 'function') N.Game.addSkillPoints(CFG.startCards);
  }

  // ---- 2) biome spawns ----
  const UB = new Set([793, 794, 795, 796, 797, 798, 799, 803, 804, 805, 806]);
  const PSEUDO = new Set([147, 148, 149, 246, 247, 248, 371, 372, 373, 374, 375, 376, 443, 444, 445, 633, 634, 635, 704, 705, 706, 782, 783, 784, 885, 886, 887, 996, 997, 998]);
  function ok() {
    const N = E(), g = B()?.game; if (!N || !g || g.state !== 'playing' || !g.player) return false;
    if (N.Coop && N.Coop.active) return false; if (N.Rift && N.Rift.inArena) return false; if (window.PS_SAFEZONE && window.PS_SAFEZONE.active) return false;
    if (window.PS_ROUTE1 && window.PS_ROUTE1.active()) return false; if (window.PS_MODES?.run?.mode === 'legend') return false;
    if (N.Maps && N.Maps.endless) return false;
    return true;
  }
  let legends = null, pools = null;
  const isLegend = d => { const p = E().DEX_BY[d]; if (!legends) try { legends = window.PS_LEGEND_DEX ? window.PS_LEGEND_DEX() : new Set(); } catch (_) { legends = new Set(); } return !!(p && p.leg) || legends.has(Number(d)); };
  function pool() {   // every Pokemon that can be a biome spawn, by type
    if (pools) return pools; const N = E(); pools = {};
    for (const d of N.DEX || []) { if (!d || !N.SPRITE_META[d.dex] || isLegend(d.dex) || UB.has(d.dex) || PSEUDO.has(d.dex) || d.dex > 1025) continue;
      for (const t of d.types || []) (pools[t] = pools[t] || []).push(d); }
    return pools;
  }
  const maxRarity = t => { let r = 2; for (const [from, v] of CFG.rarityByTime) if (t >= from) r = v; return r; };
  function pickFrom(types, t) {
    const P = pool(), mr = maxRarity(t), L = [];
    for (const ty of types) for (const d of P[ty] || []) if ((d.rarity || 1) <= mr) L.push(d);
    return L.length ? L[Math.floor(Math.random() * L.length)] : null;
  }
  function playerTypes(p) { const N = E(); return (p.megaTypes || p.mon?.types || N.DEX_BY[p.dex]?.types || []).slice(0, 2); }
  function counterTypes(p) {   // types that are super effective against the player
    const N = E(), mine = playerTypes(p); if (!mine.length || !N.Types || typeof N.Types.mult !== 'function') return [];
    return Object.keys(pool()).filter(t => { try { return N.Types.mult(t, mine) > 1.01; } catch (_) { return false; } });
  }
  function biomeAt(p) { try { return window.PS_TERRAIN_REGION ? window.PS_TERRAIN_REGION(p.x, p.y) : null; } catch (_) { return null; } }
  function spawnWave(p) {
    const W = window.PS_WILD; if (!W || typeof W.spawn !== 'function') return 0;
    { const M = E().EnemyMgr, c = typeof M.count === 'function' ? M.count() : typeof M.count === 'number' ? M.count : M.all().length; if (c > CFG.maxEnemies) return 0; }
    const t = clock(), name = biomeAt(p), home = BIOME[name] || ['normal', 'flying', 'bug'];
    const counters = counterTypes(p), homeCounters = home.filter(x => counters.includes(x));
    const n = irnd(CFG.group[0], CFG.group[1]); let made = 0;
    const a0 = Math.random() * Math.PI * 2;
    for (let i = 0; i < n; i++) {
      const vsYou = Math.random() < CFG.counterShare && counters.length;
      const d = pickFrom(vsYou ? (homeCounters.length ? homeCounters : counters) : home, t); if (!d) continue;
      const a = a0 + (i - n / 2) * 0.25, r = rnd(520, 650);
      const x = p.x + Math.cos(a) * r, y = p.y + Math.sin(a) * r * 0.8;
      try { const Wd = B()?.world; if (Wd && Wd.isFree && !Wd.isFree(x, y, 18)) continue; } catch (_) {}
      made += W.spawn(d.dex, 1, x, y, 1);
    }
    return made;
  }
  let runP = null, next = 0;
  setInterval(() => { try {
    const g = B()?.game, p = g?.player; if (!p || g.state === 'ui' || g.state === 'over') { runP = null; return; }
    cards(p);
    if (p !== runP) { runP = p; next = clock() + rnd(CFG.every[0], CFG.every[1]); }
    if (!ok()) return; const t = clock();
    if (t >= next) { next = t + rnd(CFG.every[0], CFG.every[1]); spawnWave(p); }
  } catch (e) { console.warn('[run+]', e); } }, 500);
  window.PS_RUNPLUS = { cfg: CFG, biome: BIOME, wave: () => spawnWave(B().game.player), counters: () => counterTypes(B().game.player), biomeAt: () => biomeAt(B().game.player) };
})();
