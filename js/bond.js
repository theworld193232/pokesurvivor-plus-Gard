/* BOND
   The more you play with a Pokemon, the stronger your bond. Bond is shared by its whole evolution line
   (Ralts, Kirlia and Gardevoir build the same bond), counts every second you're actually playing in a run
   (both modes, co-op too) and is saved with your profile.
     1 stack every 12 minutes of play, up to 10 stacks (2 hours).
     Each stack: +1.6% Attack, HP and Speed, +0.5% crit chance  ->  at 10 stacks: +16% stats, +5% crit.
   It applies right away, also mid-run when a new stack is reached ("Bond up!"). A toast at the start of a run shows it.
   Gardevoir and Pheromosa build bond, but their stats are left exactly as they are (CFG.keepSame) - remove a dex
   number from that list to let the bonus apply to them too. */
(() => {
  'use strict';
  if (window.PS_BOND_INSTALLED) return; window.PS_BOND_INSTALLED = true;
  const B = () => window.PS_MEGA_BRIDGE_V5, E = () => window.PS_HOOPA_ENGINE;
  const CFG = { perStack: 12 * 60, max: 10, stat: 0.016, crit: 0.005, keepSame: [280, 795] };   // keepSame: line bases (280 = Ralts line, 795 = Pheromosa)
  let prev = null;
  const evoPrev = () => { const N = E(); if (!prev && N && N.EVOS) { prev = {}; for (const [f, l] of Object.entries(N.EVOS)) for (const [t] of l || []) prev[t] = Number(f); } return prev || {}; };
  const baseOf = d => { const P = evoPrev(); let x = Number(d), n = 0; while (P[x] != null && n++ < 5) x = P[x]; return x; };
  const save = () => { try { return E().DB.save; } catch (_) { return null; } };
  const secs = base => { const S = save(); return Number(S?.psBond?.[base]) || 0; };
  const stacks = base => Math.min(CFG.max, Math.floor(secs(base) / CFG.perStack));
  const nameOf = d => (E().DEX_BY[d] || {}).name || '';
  // apply k stacks to the player (changes only by the difference from what's applied already)
  function apply(p, k) {
    const had = p.__psBondK || 0; if (k === had) return;
    p.__psBondK = k;
    if (CFG.keepSame.includes(p.__psBondBase)) return;   // bond counts, stats untouched
    const r = (1 + CFG.stat * k) / (1 + CFG.stat * had);
    if (Number.isFinite(p.atkMul)) p.atkMul *= r;
    if (Number.isFinite(p.spdMul)) p.spdMul *= r;
    if (Number.isFinite(p.maxHp)) { const hp0 = p.maxHp; p.maxHp = Math.round(p.maxHp * r); if (Number.isFinite(p.hp)) p.hp = Math.min(p.maxHp, p.hp + (p.maxHp - hp0)); }
    p.critChance = (Number(p.critChance) || 0) + CFG.crit * (k - had);
  }
  const line = k => '+' + (CFG.stat * k * 100).toFixed(1) + '% stats · +' + (CFG.crit * k * 100).toFixed(1) + '% crit';
  let runP = null, acc = 0, lastSave = 0, last = performance.now();
  setInterval(() => { try {
    const now = performance.now(), dt = Math.min(1, (now - last) / 1000); last = now;
    const g = B()?.game, p = g?.player, S = save(); if (!p || !S || g.state === 'ui' || g.state === 'over') { runP = null; return; }
    if (p !== runP) {   // new run
      runP = p; p.__psBondBase = baseOf(p.dex); p.__psBondK = 0; const k = stacks(p.__psBondBase); apply(p, k);
      if (k > 0) try { window.PS_TOAST && window.PS_TOAST('♥ Bond ' + k + '/' + CFG.max + ' with ' + nameOf(p.dex), CFG.keepSame.includes(p.__psBondBase) ? 'Your bond is growing (stats kept the same)' : line(k), { dex: Number(p.dex), ms: 4200 }); } catch (_) {}
    }
    if (g.state !== 'playing') return;
    const base = p.__psBondBase; S.psBond = S.psBond || {};
    S.psBond[base] = (Number(S.psBond[base]) || 0) + dt;
    const k = stacks(base);
    if (k > (p.__psBondK || 0)) {
      apply(p, k);
      try { B().fx.dmgText(p.x, p.y - (Number(p.bodyH) || 30) - 24, '♥ Bond up! ' + k + '/' + CFG.max, '#ff9ad8'); B().fx.ring(p.x, p.y, 8, 120, '#ff9ad8', 0.6, 5); } catch (_) {}
      try { window.PS_TOAST && window.PS_TOAST('♥ Bond up! ' + k + '/' + CFG.max, nameOf(p.dex) + ': ' + (CFG.keepSame.includes(base) ? 'stats kept the same' : line(k)), { dex: Number(p.dex), gold: true, ms: 4500 }); } catch (_) {}
    }
    if (now - lastSave > 60000) { lastSave = now; try { E().DB.commit(); } catch (_) {} }
  } catch (e) { console.warn('[bond]', e); } }, 250);
  window.PS_BOND = { cfg: CFG, stacks: d => stacks(baseOf(d)), seconds: d => secs(baseOf(d)) };
})();
