/* ACT BALANCE for first-stage starts
   You now start every run as a first-stage Pokemon (Ralts, Dratini...), so the harder Acts used to hit you with
   their full strength from second one (Nightmare: x4.5 HP, x2.6 damage) before you could even evolve.
   Now each Act's extra strength ramps in:
     - it starts at 20% of the Act's bonus and reaches 100% at 15:00, or sooner as you level up
       (full strength once you're level 36 - by then you've usually evolved);
     - while your level is behind the pace of the run (about level 5 + 1 per 25 s), you get +60% EXP to catch up.
   Level 1 / Route 1 are unchanged (they have no bonus). Area Zero's endless scaling is untouched.
   The Act's PokeCoin / EXP bonus is still the full one. */
(() => {
  'use strict';
  if (window.PS_ACTBAL_INSTALLED) return; window.PS_ACTBAL_INSTALLED = true;
  const E = () => window.PS_HOOPA_ENGINE, B = () => window.PS_MEGA_BRIDGE_V5;
  const CFG = { startShare: 0.20, fullAt: 900, fullLevel: 36, catchUp: 1.6, pace: [5, 25] };
  const clock = () => { try { const t = E().Game.time; return Number(typeof t === 'function' ? t() : t) || 0; } catch (_) { return 0; } };
  function ramp() {
    const p = B()?.game?.player, t = clock(), lv = Number(p?.level) || 1;
    const byTime = t / CFG.fullAt, byLevel = (lv - 1) / (CFG.fullLevel - 1);
    return Math.min(1, CFG.startShare + (1 - CFG.startShare) * Math.max(byTime, byLevel));
  }
  let done = false;
  function install() {
    const N = E(), M = N && N.Maps; if (done || !M || typeof M.sc !== 'function') return; done = true;
    const sc = M.sc;
    M.sc = function (s) {
      const cur = M.cur; if (!cur || M.endless || !(Number(cur.k) > 1 || Number(cur.dk) > 1)) return sc.call(this, s);
      const r = ramp(), k = 1 + (Number(cur.k) - 1) * r, dk = 1 + (Number(cur.dk) - 1) * r;
      return Object.assign({}, s, { hp: s.hp * k, dmg: s.dmg * dk });
    };
    window.PS_ACT_BALANCE = { cfg: CFG, ramp };
  }
  // EXP catch-up while you're behind the run's pace (harder Acts only)
  let runP = null, applied = 1;
  setInterval(() => { try {
    install(); const N = E(), p = B()?.game?.player, cur = N?.Maps?.cur;
    if (!p || p !== runP) { runP = p || null; applied = 1; }
    if (!p || !cur || N.Maps.endless || (N.Coop && N.Coop.active)) return;
    const hard = Number(cur.k) > 1 || Number(cur.dk) > 1, want = CFG.pace[0] + clock() / CFG.pace[1];
    const f = hard && (Number(p.level) || 1) < want - 2 ? CFG.catchUp : 1;
    if (f !== applied) { p.xpMul = (Number(p.xpMul) || 1) / applied * f; applied = f; }
  } catch (_) {} }, 1000);
})();
