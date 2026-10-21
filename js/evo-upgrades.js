/* EVOLUTION KEEPS UPGRADES
   Upgrades are bought per Pokemon. Before, a run started with Ralts only had Ralts' upgrades, even after it
   evolved into a fully upgraded Gardevoir. Now, when your Pokemon evolves during a run, it gets the upgrades of
   the Pokemon it evolved into: for every stat you keep whichever is better, the upgrades you started with or the
   new form's (HP, Strength, Speed, Cooldown, Defense, Regen, Magnet, EXP, Coins, Critical, Rerolls, Lives).
   Moves, bans and the starting item stay as they were picked at the start of the run.
   Evolving also registers the evolved form in your Pokedex (as shiny when your Pokemon is shiny). */
(() => {
  'use strict';
  if (window.PS_EVOUPG_INSTALLED) return; window.PS_EVOUPG_INSTALLED = true;
  const E = () => window.PS_HOOPA_ENGINE;
  const perksOf = dex => { const N = E(); try { return N.Upgrades.perks(N.DB.upgradesOf(dex) || {}); } catch (_) { return null; } };
  const KEYS_MUL = ['atkMul', 'spdMul', 'magnetMul', 'xpMul', 'coinMul'], KEYS_ADD = ['hp', 'dmgReduce', 'regen', 'crit', 'rerolls', 'lives'];
  function best(a, b) {
    const o = Object.assign({}, a);
    for (const k of KEYS_MUL) o[k] = Math.max(Number(a[k]) || 1, Number(b[k]) || 1);
    for (const k of KEYS_ADD) o[k] = Math.max(Number(a[k]) || 0, Number(b[k]) || 0);
    o.cdMul = Math.min(Number(a.cdMul) || 1, Number(b.cdMul) || 1);   // lower cooldown is better
    return o;
  }
  function apply(p, cur, nxt) {
    const N = E(), r = k => (Number(nxt[k]) || 1) / (Number(cur[k]) || 1), d = k => (Number(nxt[k]) || 0) - (Number(cur[k]) || 0);
    let x;
    if ((x = r('atkMul')) !== 1) { p.atkMul *= x; if (p.atkPerm) p.atkPerm *= x; }
    if ((x = r('spdMul')) !== 1) { p.spdMul *= x; if (p.spdPerm) p.spdPerm *= x; }
    if ((x = r('cdMul')) !== 1) { p.cdMul *= x; if (p.cdPerm) p.cdPerm *= x; }
    if ((x = r('magnetMul')) !== 1) { p.magnet *= x; if (p.magPerm) p.magPerm *= x; }
    if ((x = r('xpMul')) !== 1) { p.xpMul *= x; if (p.xpPerm) p.xpPerm *= x; }
    if ((x = r('coinMul')) !== 1) p.coinMul *= x;
    if ((x = d('hp'))) { const cap = Number(N.Player.HP_CAP) || 1e9; p.maxHp = Math.min(cap, p.maxHp + x); p.hp = Math.min(p.maxHp, p.hp + Math.max(0, x)); }
    if ((x = d('dmgReduce'))) p.dmgReduce = (Number(p.dmgReduce) || 0) + x;
    if ((x = d('regen'))) p.regenFlat = (Number(p.regenFlat) || 0) + x;
    if ((x = d('crit'))) p.critChance = (Number(p.critChance) || 0) + x;
    if ((x = d('rerolls'))) p.rerollBonus = (Number(p.rerollBonus) || 0) + x;
    if ((x = d('lives'))) p.lives = (Number(p.lives) || 0) + x;
    return x;
  }
  function install() {
    const N = E(), P = N && N.Player && N.Player.prototype; if (!P || typeof P.evolveTo !== 'function' || !N.Upgrades || !N.DB) return false;
    if (P.__psEvoUpg) return true; P.__psEvoUpg = true;
    const orig = P.evolveTo;
    P.evolveTo = function (dex) {
      const before = this.dex;
      if (!this.__psPerk) this.__psPerk = perksOf(this.baseDex || before) || {};   // what the run started with
      const res = orig.apply(this, arguments);
      try {
        if (this.dex !== before && !this.remote) {
          // the evolved form joins your Pokedex, shiny too when your Pokemon is shiny
          try { const N2 = E(), me = window.PS_MEGA_BRIDGE_V5?.game?.player; if (this === me && N2.DEX_BY[this.dex]) { let ch = false;
            if (!N2.DB.owns(this.dex)) { N2.DB.grant(this.dex, 'evolve'); ch = true; }
            const sh = !!(this.shiny || (this.anim && this.anim.shiny)); if (sh && !N2.DB.ownsShiny(this.dex)) { N2.DB.grantShiny(this.dex, 'evolve'); ch = true; }
            if (ch) N2.DB.commit(); } } catch (_) {}
          const nxt = perksOf(this.dex);
          if (nxt) { const b = best(this.__psPerk, nxt), gained = JSON.stringify(b) !== JSON.stringify(this.__psPerk); apply(this, this.__psPerk, b); this.__psPerk = b;
            if (gained) try { N.FX.dmgText(this.x, this.y - (this.bodyH || 40) - 34, 'Upgrades: ' + ((N.DEX_BY[this.dex] || {}).name || 'evolved form'), '#7dff9a'); } catch (_) {} }
        }
      } catch (e) { console.warn('[evo-upgrades]', e); }
      return res;
    };
    return true;
  }
  const t = setInterval(() => { if (install()) clearInterval(t); }, 200);
})();
