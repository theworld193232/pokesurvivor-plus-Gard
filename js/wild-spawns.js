/* WILD SPAWNS & REWARDS
   1) Missing Pokemon show up: now and then (every ~45-75 s) the game looks at what you DON'T own yet and sends a
      small group of one of them (2-4), cycling through your missing Pokemon one by one. Then normal spawning goes on.
      Never Legendaries, Mythicals or Ultra Beasts (other Epic Pokemon can show up). Pseudo-Legendaries have their
      own rare spawn below. (Both modes.)
   2) Pseudo-Legendaries: every 2-3 minutes there's a 4.5% chance one shows up: Dratini / Dragonair / Dragonite,
      Larvitar line, Bagon line, Beldum line, Gible line, Deino line, Goomy line, Jangmo-o line, Dreepy line,
      Frigibax line - as any of their forms (never Mega), alone or in a group, sometimes in two places at once.
      (Both modes.)
   3) Original mode rewards (Story has catching instead): defeating a wild Pokemon whose first form you don't own gives
      a 40% chance to get that first form (beat a Kirlia -> Ralts, a Dragonair -> Dratini; a Lapras -> Lapras).
      Starters only come from the Gacha. Legendaries, Mythicals and Ultra Beasts never drop.
   Not on Story Route 1 (its own hand-made list), in Rift arenas, Safe Zones, co-op or the Legendary Den mode.
   Every number is in CFG below. */
(() => {
  'use strict';
  if (window.PS_WILDSPAWNS_INSTALLED) return; window.PS_WILDSPAWNS_INSTALLED = true;
  const B = () => window.PS_MEGA_BRIDGE_V5, E = () => window.PS_HOOPA_ENGINE;
  const TAU = Math.PI * 2;
  const CFG = {
    missEvery: [45, 75], missGroup: [2, 4],
    pseudoEvery: [120, 180], pseudoChance: 0.045, pseudoGroup: [1, 3], pseudoTwoSites: 0.35,
    dropChance: 0.40,
    ring: [520, 680]
  };
  const PSEUDO = [[147, 148, 149], [246, 247, 248], [371, 372, 373], [374, 375, 376], [443, 444, 445], [633, 634, 635], [704, 705, 706], [782, 783, 784], [885, 886, 887], [996, 997, 998]];
  const UB = new Set([793, 794, 795, 796, 797, 798, 799, 803, 804, 805, 806]);
  const EXTRA_LEG = new Set([893, 1001, 1002, 1003, 1008, 1014, 1025]);   // Legendaries / Mythicals the game doesn't flag   // Ultra Beasts: never sent as missing Pokemon, never drop
  const PSEUDO_BASE = {}; for (const L of PSEUDO) for (const d of L) PSEUDO_BASE[d] = L[0];
  const clock = () => { try { const t = E().Game.time; return Number(typeof t === 'function' ? t() : t) || 0; } catch (_) { return 0; } };
  const rnd = (a, b) => a + Math.random() * (b - a), irnd = (a, b) => Math.floor(rnd(a, b + 1));
  const story = () => !!(window.PS_STORY && window.PS_STORY.on());
  function ok() {
    const N = E(), g = B()?.game; if (!N || !g || g.state !== 'playing' || !g.player) return false;
    if (N.Coop && N.Coop.active) return false; if (N.Rift && N.Rift.inArena) return false; if (window.PS_SAFEZONE && window.PS_SAFEZONE.active) return false;
    if (window.PS_ROUTE1 && window.PS_ROUTE1.active()) return false; if (window.PS_MODES?.run?.mode === 'legend') return false;
    return true;
  }
  let prev = null, legends = null;
  function evoData() {
    const N = E(); if (!prev && N && N.EVOS) { prev = {}; for (const [f, l] of Object.entries(N.EVOS)) for (const [t] of l || []) prev[t] = Number(f); }
    if (!legends) { try { legends = window.PS_LEGEND_DEX ? window.PS_LEGEND_DEX() : null; } catch (_) {} }
    return prev;
  }
  const STARTER_LINE = new Set([1,4,7,152,155,158,252,255,258,387,390,393,495,498,501,650,653,656,722,725,728,810,813,816,906,909,912]);
  const baseOf = d => { const P = evoData(); let x = Number(d), n = 0; while (P && P[x] != null && n++ < 5) x = P[x]; return x; };
  const isLegend = d => { const p = E().DEX_BY[d]; return !!(p && p.leg) || EXTRA_LEG.has(Number(d)) || !!(legends && legends.has(Number(d))); };
  const noEvo = d => { const P = evoData(); return P && P[d] == null && !((E().EVOS[d] || []).length); };
  // ---- spawning ----
  function spot(p) {
    const W = B()?.world; for (let i = 0; i < 40; i++) { const a = Math.random() * TAU, r = rnd(CFG.ring[0], CFG.ring[1]), x = p.x + Math.cos(a) * r, y = p.y + Math.sin(a) * r * 0.8;
      try { if (W && W.isFree && !W.isFree(x, y, 18)) continue; } catch (_) {} return [x, y]; } return null;
  }
  function spawn(dex, n, x, y, mul) {
    const N = E(), d = N.DEX_BY[dex]; if (!d || !N.SPRITE_META[dex]) return 0;
    const bag = (N.Enemies.bagAt(clock()) || []).filter(b => b && b.hp); const tpl = bag[Math.floor(Math.random() * bag.length)] || { behavior: 'chase', hp: 14, spd: 60, dmg: 6, xp: 4 };
    let sc = { hp: 1, dmg: 1, spd: 1 }; try { sc = N.Enemies.scale(clock()); } catch (_) {}
    let made = 0;
    for (let i = 0; i < n; i++) {
      const def = Object.assign({}, tpl, { dex, name: d.name, hp: Math.round((tpl.hp || 14) * (mul || 1)), dmg: (tpl.dmg || 6) * Math.min(1.4, mul || 1), xp: Math.round((tpl.xp || 4) * (mul || 1)) });
      const a = i / n * TAU, ex = x + Math.cos(a) * 26 * (n > 1 ? 1 : 0), ey = y + Math.sin(a) * 20 * (n > 1 ? 1 : 0);
      try { const e = new N.Enemy(def, ex, ey, sc, false); e.__psWild = true; N.EnemyMgr.add(e); made++; } catch (e) { console.warn('[wild]', e); }
    }
    return made;
  }
  // missing Pokemon, cycled one at a time
  let queue = [], nextMiss = 0, nextPseudo = 0, runP = null;
  function missingList() {
    const N = E(), S = N.DB.save; evoData();
    const L = N.DEX.filter(d => !(S.owned && S.owned[d.dex]) && !isLegend(d.dex) && !UB.has(d.dex) && !PSEUDO_BASE[d.dex] && !STARTER_LINE.has(baseOf(d.dex)) && N.SPRITE_META[d.dex]).map(d => d.dex);   // Pseudo-Legendaries have their own rare spawn
    for (let i = L.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [L[i], L[j]] = [L[j], L[i]]; }
    return L;
  }
  function missTick(p) {
    if (!queue.length) queue = missingList(); const S = E().DB.save;
    while (queue.length && S.owned && S.owned[queue[0]]) queue.shift();
    const dex = queue.shift(); if (!dex) return;
    const at = spot(p); if (at) spawn(dex, irnd(CFG.missGroup[0], CFG.missGroup[1]), at[0], at[1], 1);
  }
  function pseudoTick(p) {
    if (Math.random() >= CFG.pseudoChance) return;
    const L = PSEUDO[Math.floor(Math.random() * PSEUDO.length)], N = E();
    const sites = Math.random() < CFG.pseudoTwoSites ? 2 : 1; let first = null;
    for (let k = 0; k < sites; k++) { const dex = L[Math.floor(Math.random() * L.length)], stage = L.indexOf(dex), at = spot(p); if (!at) continue;
      const n = irnd(CFG.pseudoGroup[0], CFG.pseudoGroup[1]); spawn(dex, stage === 2 ? Math.min(2, n) : n, at[0], at[1], [1.3, 1.7, 2.4][stage]); if (!first) first = dex; }
    if (first) { const nm = (N.DEX_BY[first] || {}).name; try { N.Spawner.say('Something rare is nearby... a wild ' + nm + ' appeared!', 3.5, true); } catch (_) {}
      try { window.PS_TOAST && window.PS_TOAST('Rare Pokémon nearby!', 'A wild ' + nm + ' appeared', { dex: first, gold: true, ms: 5000 }); } catch (_) {} }
  }
  // ---- Original mode: chance to get it when you defeat it ----
  function onKill(e) {
    try {
      if (!e || e.remote || e.boss || e.legend || e.__psCaughtGone || story() || !ok()) return;
      const N = E(), S = N.DB.save, d = Number(e.dex); if (!N.DEX_BY[d] || isLegend(d) || UB.has(d)) return;
      const base = baseOf(d); if (STARTER_LINE.has(base)) return;   // starters only come from the Gacha
      const get = PSEUDO_BASE[d] || base;   // its first form (itself when it doesn't evolve)
      if (!get || (S.owned && S.owned[get]) || Math.random() >= CFG.dropChance) return;
      N.DB.grant(get, 'wild'); try { N.DB.commit(); } catch (_) {}
      const nm = (N.DEX_BY[get] || {}).name;
      try { N.Spawner.say('You got ' + nm + '!', 3, true); B().audio?.sfx?.('shinyGet'); } catch (_) {}
      try { window.PS_TOAST && window.PS_TOAST(nm + ' joined you!', get !== d ? 'From the wild ' + e.name + ' you defeated' : 'Defeated in the wild', { dex: get, ms: 5000 }); } catch (_) {}
    } catch (_) {}
  }
  let wrapped = false;
  function wrap() { const P = E()?.Progress; if (wrapped || !P || typeof P.kill !== 'function') return; wrapped = true; const k = P.kill; P.kill = function (e, ...a) { onKill(e); return k.call(this, e, ...a); }; }
  let last = performance.now();
  function loop(now) {
    requestAnimationFrame(loop); last = now;
    try {
      wrap(); const g = B()?.game, p = g?.player; if (!p || g.state === 'ui' || g.state === 'over') { runP = null; return; }
      if (p !== runP) { runP = p; queue = []; nextMiss = clock() + rnd(CFG.missEvery[0], CFG.missEvery[1]); nextPseudo = clock() + rnd(CFG.pseudoEvery[0], CFG.pseudoEvery[1]); }
      if (!ok()) return; const t = clock();
      if (t >= nextMiss) { nextMiss = t + rnd(CFG.missEvery[0], CFG.missEvery[1]); missTick(p); }
      if (t >= nextPseudo) { nextPseudo = t + rnd(CFG.pseudoEvery[0], CFG.pseudoEvery[1]); pseudoTick(p); }
    } catch (e) { console.warn('[wild]', e); }
  }
  requestAnimationFrame(loop);
  window.PS_WILD = { cfg: CFG, spawn, missTick: () => missTick(B().game.player), pseudoTick: () => { const c = CFG.pseudoChance; CFG.pseudoChance = 1; pseudoTick(B().game.player); CFG.pseudoChance = c; }, queue: () => queue.slice() };
})();
