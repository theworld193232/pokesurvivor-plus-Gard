/* LAKE GUARDIANS — Uxie, Mesprit and Azelf fight together.
   - Playing as one of them, you learn the other two as Psychic summon moves (never your own: Azelf can't summon Azelf).
     They show up in your level-up rewards from Lv.3 until you have learned both.
   - Each move calls a PERMANENT ally. It rises from a water drop on the floor (Uxie yellow, Mesprit pink, Azelf blue).
     Azelf spawns on your left, Uxie on your right, Mesprit takes the side that is left.
     If an ally faints it melts back into the ground and the move calls it again after 20 seconds.
     Every time the move's cooldown comes round, the ally uses its signature command.
   - Allies share everything with you at 100%: Attack, cooldowns, crit, regeneration, defense, held item, level and
     your buffs (and the buffs they give are shared with the whole trio).
       Uxie     the guardian. Draws enemies to her but never lets them touch her: she kites away from crowds and
                sidesteps enemy shots, and attacks from range. Her moves buff herself and her sisters, confuse, stun
                and knock back. Lv1 Confuse pulse · Lv2 Cosmic Power (team defense that keeps rising) ·
                Lv3 Recover + shared regeneration · Lv4 Psychic Shove (knockback + stun) · Lv5 all stronger.
                Passives: a Pokemon that hits her has a 10% chance to get confused for 3 s and attack its own allies.
                Below 10% HP she turns untouchable for 20 s and runs to Azelf or Mesprit (then 60 s before it can happen again).
       Mesprit  the balance. Every 5 s she stuns enemies for 3 s, confuses them for 3 s, drains 5% of their HP
                (2% on bosses) or heals her sisters 10%. Lv1 Psybeam / Confusion · Lv2 Lullaby (stall) ·
                Lv3 Protect (team shield) · Lv4 Healing Wish or Helping Hand (team buff) · Lv5 all stronger.
       Azelf    the main damage dealer. Her attacks can raise ATK and SPEED by 10% (up to +50%); like every buff she
                gets, her sisters get it too. Lv1 Psystrike / Psycho Cut · Lv2 Nasty Plot (+2 stacks) ·
                Lv3 Future Sight (delayed blast) · Lv4 Psycho Boost (huge single hit) · Lv5 all stronger.
     MYSTICAL POWER (yours, and in each summoned sister's moveset) is a real buff on the buffs all three share:
       Uxie +10% DEF and pushes enemies back 5 studs · Mesprit +10% ATK & DEF, then either +20% more or enemies walk
       backwards for 5 s · Azelf +10% ATK & SPEED. Up to +50% per stat; the buff part works once every 6 s.
     Playing as one of them, you get her passives too (Uxie: confuse on hit + last stand; Mesprit: the 5 s pulse;
     Azelf: rising ATK & SPEED from your attacks).
   - SMART, LIKE PLAYERS: every sister sidesteps enemy shots, runs from crowds (Uxie at the first enemy, Mesprit at 2,
     Azelf at 4, or 2 when hurt; anyone below 30% HP backs off), circles her target instead of standing still, and
     when nothing is near she picks up drops (a held item becomes HER item; XP, coins and the rest go to you), opens
     chests, waits at a big chest until it opens, and activates the power-up crystals.
   - CO-OP: while her sister-player is far away (600+) or down, she follows and fights for the nearest other player.
   - Their Z-Move deals 3x the damage of a normal Z-Move, with twice the cooldown.
   Solo (your own allies only). Their portraits and emotes (js/lake-talk.js) react to what happens here. */
(() => {
  'use strict';
  if (window.PS_LAKE_INSTALLED) return; window.PS_LAKE_INSTALLED = true;
  const E = () => window.PS_HOOPA_ENGINE, TAU = Math.PI * 2;
  const CFG = { respawn: 20, spawnTime: 1.4, meltTime: 1.0, moveCd: 12, zDmg: 3, zCd: 2, unlockLevel: 3,
    confuseOnHit: 0.10, confuseDur: 3, lastStand: 0.10, lastStandTime: 20, lastStandCd: 60,   // Uxie
    riseChance: 0.15, riseChancePlayer: 0.06, riseStep: 0.10, riseMax: 5, riseTime: 12,       // Azelf: +10% ATK & SPD per stack, up to +50%
    mespritEvery: 5, mespritStun: 3, mespritConfuse: 3, mespritDrain: 0.05, mespritHeal: 0.10,      // Mesprit
    buffStep: 0.10, buffMax: 5, buffTime: 10,   // every trio buff is a +10% stack (up to +50%) on the buffs all three share
    mysticCd: 6, mysticRadius: 260, stud: 32, pushStuds: 5, mespritExtra: 2, fearTime: 5,   // Mystical Power
    coopFar: 600, jobRange: 320, jobSafe: 150,
    tetherFar: 450, tetherNear: 260, tetherSpeed: 320 };   // stray this far from your sisters and they pull you back   // co-op: follow another player past this distance · loot/chest/crystal search, and how clear it must be
  const TRIO = {
    480: { key: 'uxie', name: 'Uxie', move: 'lake-uxie', role: 'Guardian', hp: 2.0, atk: 0.6, spd: 1.0, take: 0.8, leash: 260, dead: 90, ideal: 200,
      kit: ['confusion'], drop: ['#fff7c0', '#ffd84a', '#c8960c'], ring: '#ffd84a',
      desc: 'Calls Uxie, a permanent guardian ally (on your right). Draws enemies but dodges them. Her Mystical Power raises the DEF of all three sisters and pushes enemies back 5 studs; she also confuses and stuns. Hitting her can confuse the attacker; near fainting she turns untouchable and runs to her sisters.',
      ups: ['Cosmic Power: +10% DEF for all three sisters', 'Recover: heals and shares regeneration', 'Psychic Shove: pushes enemies back and stuns them', 'Max: stronger in every way'] },
    481: { key: 'mesprit', name: 'Mesprit', move: 'lake-mesprit', role: 'Balance', hp: 1.25, atk: 1.1, spd: 1.0, take: 1, leash: 260, dead: 45, ideal: 170,
      kit: ['psybeam', 'confusion'], drop: ['#ffe0f4', '#ff8ad0', '#c0408a'], ring: '#ff8ad0',
      desc: 'Calls Mesprit, a permanent all-round ally. Her Mystical Power raises the ATK and DEF of all three sisters, then either 20% more or makes enemies walk backwards for 5 s. Every 5 seconds she stuns, confuses, drains 5% HP from enemies or heals her sisters 10%, and she also buffs, shields and attacks.',
      ups: ['Lullaby: slows and stuns the enemies around you', 'Protect: a short shield for the whole team', 'Healing Wish + Helping Hand: a big heal and a team buff', 'Max: stronger in every way'] },
    482: { key: 'azelf', name: 'Azelf', move: 'lake-azelf', role: 'DPS', hp: 0.8, atk: 2.0, spd: 1.15, take: 1, leash: 420, dead: 50, ideal: 150,
      kit: ['psystrike', 'psycho-cut', 'psybeam'], drop: ['#e0f2ff', '#5ab0ff', '#2060c0'], ring: '#5ab0ff',
      desc: 'Calls Azelf, a permanent damage dealer (on your left). Her Mystical Power raises the ATK and SPEED of all three sisters. Her attacks can raise her ATK and SPEED by 10% (up to 50%), and every buff she gets is shared with her sisters.',
      ups: ['Nasty Plot: two stacks of rising ATK & SPEED', 'Future Sight: a delayed psychic blast', 'Psycho Boost: a huge single hit', 'Max: stronger in every way'] } };
  const IDS = Object.keys(TRIO).map(Number), MOVE_DEX = {}; for (const d of IDS) MOVE_DEX[TRIO[d].move] = d;
  const isTrio = dex => !!TRIO[Number(dex)];
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const player = () => E()?.Game?.player;
  const say = (x, y, t, c) => { try { E().FX.dmgText(x, y, t, c || '#fff'); } catch (_) {} };
  const sfx = n => { try { E().Audio.sfx(n); } catch (_) {} };
  // what the team is doing, for js/lake-talk.js (portraits + emotes): summon, arrive, hurt, faint, skill, z
  const emit = (type, d) => { try { window.dispatchEvent(new CustomEvent('ps-lake', { detail: Object.assign({ type }, d) })); } catch (_) {} };

  // ================= moves =================
  function moveDef(dex) {
    const t = TRIO[dex];
    return { id: t.move, name: t.name, type: 'psychic', kind: 'summon', psCast: t.move, desc: t.desc, cd: CFG.moveCd, dmg: 0, radius: 0, count: 1, maxLvl: 5,
      ups: t.ups.map(x => ({ t: x, m: {} })) };
  }
  let registered = false;
  function register() {
    const N = E(), M = N && N.Moves; if (registered || !M || !M.BY_ID || !Array.isArray(M.ALL)) return; registered = true;
    for (const d of IDS) { const def = moveDef(d); if (!M.BY_ID[def.id]) { M.ALL.push(def); M.BY_ID[def.id] = def; } }
  }
  // Mystical Power's card text says what it now does (the moves come from js/legend-moves.js)
  const MYSTIC_TEXT = { 'mystical-power-uxie': ' Raises the DEF of all three sisters and pushes enemies back 5 studs.',
    'mystical-power-mesprit': ' Raises the ATK and DEF of all three sisters, then either 20% more or enemies walk backwards for 5 s.',
    'mystical-power-azelf': ' Raises the ATK and SPEED of all three sisters.' };
  function patchMystical() { const M = E()?.Moves; if (!M || !M.BY_ID) return; for (const id in MYSTIC_TEXT) { const d = M.BY_ID[id]; if (d && !d.__lake) { d.desc = (d.desc || '') + MYSTIC_TEXT[id]; d.__lake = true; } } }
  // level-up rewards: the other two summons (never your own), pushed to the front until learned
  function hookPool() {
    const M = E()?.Moves; if (!M || typeof M.poolFor !== 'function' || M.poolFor.__lake) return;
    const orig = M.poolFor;
    M.poolFor = function (mon) {
      let r = orig.apply(this, arguments); const d = Number(mon && mon.dex); const mine = IDS.map(x => TRIO[x].move);
      r = (r || []).filter(id => !mine.includes(id)); if (!isTrio(d)) return r;
      const ids = IDS.filter(x => x !== d).map(x => TRIO[x].move), p = player();
      const un = ids.filter(id => !(p && typeof p.hasMove === 'function' && p.hasMove(id)));
      if (p && Number(p.dex) === d && Number(p.level) >= CFG.unlockLevel && un.length) return [...un, ...r.slice(0, 1)];   // a short pool, so the new-move cards reliably show them
      return [...r, ...ids];
    };
    M.poolFor.__lake = true;
  }

  // ================= the team =================
  let owner = null, ownerPos = null;
  const allies = {};   // dex -> ally
  const team = { protect: 0, protectT: 0 };   // Protect: a short extra shield (the DEF buffs live on the shared buffs)
  const sights = [], fx = [];   // Future Sight markers, splash/melt effects
  const moveOf = (p, dex) => p && Array.isArray(p.moves) ? p.moves.find(m => m && m.id === TRIO[dex].move) : null;
  const lvlMul = s => 1 + 0.12 * ((s.lvl || 1) - 1);
  function sideFor(dex) {   // +1 right, -1 left
    if (dex === 482) return -1; if (dex === 480) return 1;
    return Number(owner && owner.dex) === 482 ? -1 : 1;   // Mesprit: whichever side is free
  }
  const SHARE = ['atkMul', 'atkPerm', 'spdMul', 'spdPerm', 'cdMul', 'cdPerm', 'critChance', 'critPerm', 'regenFlat', 'regenPct', 'reductionBase', 'defBonus', 'buffs', 'powers', 'level', 'magnet', 'xpMul', 'coinMul', 'atkItemK'];
  function makeActor(s) {
    const N = E(), a = new N.Player(N.DEX_BY[s.dex], {}, s.shiny); s.caster = a; a.psLake = s;
    for (const k of ['x', 'y', 'r', 'bodyH', 'anim', 'dead', 'hp', 'maxHp', 'aim', 'target']) Object.defineProperty(a, k, { configurable: true, get: () => s[k], set: v => { s[k] = v; } });
    for (const k of SHARE) Object.defineProperty(a, k, { configurable: true, get: () => s.owner[k], set: () => {} });   // shared with you at 100%
    Object.defineProperty(a, 'item', { configurable: true, get: () => s.ownItem || s.owner.item, set: v => { s.ownItem = v; } });   // her own held item once she picks one up
    Object.defineProperty(a, 'baseAtk', { configurable: true, get: () => (Number(s.owner.baseAtk) || 1) * s.t.atk * lvlMul(s) });
    Object.defineProperty(a, 'baseSpd', { configurable: true, get: () => Number(s.owner.baseSpd) || 100 });
    Object.defineProperty(a, 'floating', { configurable: true, get: () => false });   // they walk: no hovering over water or obstacles
    a.hurt = (amt, type) => hurt(s, amt, type); a.ultCd = Infinity; a.ultT = 0;
  }
  function hpFor(s) { return Math.max(30, Math.round((Number(s.owner.maxHp) || 100) * s.t.hp * lvlMul(s))); }
  function summon(dex, again) {
    const N = E(), o = owner; if (!N || !o) return null; const t = TRIO[dex], side = sideFor(dex);
    let shiny = false; try { shiny = !!(N.DB.save && N.DB.save.shiny && N.DB.save.shiny[dex]) && N.Sprites.hasShiny(dex); } catch (_) {}
    const s = { dex, t, name: t.name, owner: o, side, shiny, x: o.x + side * 70, y: o.y + 8, r: 16, bodyH: 36, dead: false, spawnT: 0, age: 0, lvl: moveOf(o, dex)?.lvl || 1,
      next: 0.5, kitI: 0, cd: {}, hurtCd: 0, stunT: 0, slowT: 0, path: [], aim: 0, target: null, anim: null };
    try { N.Sprites.preload([dex], 4000, shiny); s.anim = new N.Sprites.Animator(dex, 1, shiny); } catch (_) {}
    { const f = nearFree(s.x, s.y, s.r); s.x = f.x; s.y = f.y; }   // rises from open ground, never inside a rock or a wall
    makeActor(s); s.maxHp = hpFor(s); s.hp = s.maxHp; s.again = !!again; allies[dex] = s;
    sfx('surge'); emit('summon', { dex, again: !!again }); return s;
  }
  function faint(s) {
    if (s.dead && s.melt != null) return; s.dead = true; s.melt = 0; s.respawnAt = (E().Game.st?.time ?? 0) + CFG.respawn; s.deadAt = performance.now() / 1000;
    say(s.x, s.y - 50, s.name + ' fainted!', s.t.ring); sfx('faint'); emit('faint', { dex: s.dex });
  }
  function hurt(s, amt, type, by) {
    if (!s || s.dead || s.spawnT < CFG.spawnTime || s.hurtCd > 0 || !Number.isFinite(amt) || amt <= 0) return;
    if (s.standT > 0) return;   // Uxie's last stand: untouchable
    s.hurtCd = 0.35; const before = s.hp;
    try { E().Player.prototype.hurt.call(s.caster, amt, type); } catch (_) { s.hp -= amt; }
    if (s.dex === 480 && s.hp < before) {
      if (by && Math.random() < CFG.confuseOnHit && confuse(by, CFG.confuseDur)) emit('confuse', { dex: 480, by: 'hit' });
      if (s.hp > 0 && s.hp < s.maxHp * CFG.lastStand && !(s.standCd > 0)) { lastStand(s); return; } }
    if (s.hp <= 0 || s.dead) { s.hp = 0; s.dead = false; faint(s); return; }
    if (!s.low && s.hp < s.maxHp * 0.5) { s.low = true; emit('hurt', { dex: s.dex, frac: s.hp / s.maxHp }); }
  }
  function clearAll() { for (const d of IDS) delete allies[d]; sights.length = 0; fx.length = 0; team.protect = team.protectT = 0; team.pPulse = undefined; team.pStandT = team.pStandCd = 0; owner = null; ownerPos = null; }

  // ---- skills ----
  function foes() { const N = E(); return N.EnemyMgr.all().filter(e => e && !e.dead); }   // remote (co-op) enemies too: e.hurt / applyStun route through the host
  function blast(s, x, y, radius, dmgK, o) {
    const N = E(); o = o || {}; let n = 0;
    for (const e of foes()) { if (Math.hypot(e.x - x, e.y - y) > radius + (e.r || 12)) continue;
      const dmg = dmgK > 0 ? 10 * dmgK * s.caster.atk * N.Types.mult('psychic', e.types || ['normal']) : 0;
      try { if (dmg > 0) { e.hurt(dmg, o.color || s.t.ring, e.x - x, e.y - y, o.knock || 0); N.Stats.dmg(s.owner, s.t.move, dmg); } else if (o.knock) e.hurt(1, o.color || s.t.ring, e.x - x, e.y - y, o.knock); } catch (_) {}
      if (o.stun && (!o.stunChance || Math.random() < o.stunChance)) try { e.applyStun(o.stun); } catch (_) {}
      if (o.slow) try { e.applySlow(o.slow, o.slowT || 2); } catch (_) {}
      n++; }
    try { N.FX.ring(x, y, 10, radius, o.color || s.t.ring, 0.6, 6); } catch (_) {}
    return n;
  }
  function teamMembers() { const L = owner && !owner.dead ? [owner] : []; for (const d of IDS) { const s = allies[d]; if (s && !s.dead && s.spawnT >= CFG.spawnTime) L.push(s); } return L; }
  function healTeam(frac, s) { for (const m of teamMembers()) { const amt = (Number(m.maxHp) || 100) * frac; if (m === owner) { try { owner.heal(amt); } catch (_) { owner.hp = Math.min(owner.maxHp, owner.hp + amt); } } else { m.hp = Math.min(m.maxHp, m.hp + amt); say(m.x, m.y - 44, '+' + Math.round(amt), '#5fe08a'); } }
    try { E().FX.ring(owner.x, owner.y, 8, 120, s.t.ring, 0.5, 5); } catch (_) {} }
  const near = (c, r) => foes().filter(e => dist(e, c) < r);
  function densest(c, r) { let best = null, bn = 0; for (const e of near(c, r)) { const n = near(e, 110).length; if (n > bn) { bn = n; best = e; } } return best; }
  // ---- passives ----
  // confusion: the enemy turns on its own allies for a while (bosses and Legendaries resist it)
  function confuse(e, dur) { if (!e || e.dead || e.boss || e.legend || e.remote) return false; e.__lakeConfT = Math.max(e.__lakeConfT || 0, dur); e.__lakeConfHit = 0; say(e.x, e.y - (e.bodyH || 30) - 10, 'Confused!', '#c86bff'); return true; }
  const teamPos = () => teamMembers();
  // Azelf: +10% ATK and SPEED per stack (up to +50%), on the shared buffs, so her sisters get it too
  function rise(n, from) {
    if (!owner) return; const B = owner.buffs || {}; const before = (B.atk && B.atk.n) || 0;
    teamBuff('atk', n || 1); teamBuff('spd', n || 1);
    const now = (B.atk && B.atk.n) || 0; if (now <= before) return;
    const x = from ? from.x : owner.x, y = from ? from.y : owner.y; say(x, y - 56, 'ATK & SPD +' + now * 10 + '%', '#5ab0ff');
    for (const m of teamPos()) try { E().FX.ring(m.x, m.y, 6, 44, '#5ab0ff', 0.45, 4); } catch (_) {}
    emit('rise', { dex: 482, stacks: now, max: now >= CFG.riseMax });
  }
  // Mesprit: every 5 s — stun 3 s, confuse 3 s, drain 5% HP, or heal her sisters 10%
  function mespritPulse(src) {
    const hurtSis = teamMembers().some(m => m.hp < m.maxHp * 0.7), around = foes().filter(e => dist(e, src) < 300);
    const roll = Math.random(); let kind;
    if (hurtSis && roll < 0.5) kind = 'heal'; else if (!around.length) kind = 'heal';
    else kind = ['stun', 'confuse', 'drain', 'heal'][Math.floor(Math.random() * (hurtSis ? 4 : 3))];
    const col = TRIO[481].ring, N = E();
    if (kind === 'heal') { for (const m of teamMembers()) { const amt = (Number(m.maxHp) || 100) * CFG.mespritHeal; if (m === owner) { try { owner.heal(amt); } catch (_) {} } else { m.hp = Math.min(m.maxHp, m.hp + amt); say(m.x, m.y - 44, '+' + Math.round(amt), '#5fe08a'); } }
      try { N.FX.ring(src.x, src.y, 8, 90, col, 0.5, 5); } catch (_) {} say(src.x, src.y - 56, 'Heal +10%', col); }
    else { const tg = around.filter(e => !e.boss && !e.legend).sort((a, b) => dist(a, src) - dist(b, src))[0] || around[0], hit = foes().filter(e => dist(e, tg) < 70);
      if (kind === 'stun') { for (const e of hit) try { e.applyStun(CFG.mespritStun); } catch (_) {} say(tg.x, tg.y - 50, 'Stunned!', col); }
      else if (kind === 'confuse') { for (const e of hit) confuse(e, CFG.mespritConfuse); }
      else { for (const e of around) { const k = (e.boss || e.legend) ? 0.02 : CFG.mespritDrain, dmg = (Number(e.maxHp) || 100) * k; try { e.hurt(dmg, col, 0, 0, 0); N.Stats.dmg(owner, TRIO[481].move, dmg); } catch (_) {} } say(src.x, src.y - 56, 'Drain -5%', col); }
      try { N.FX.ring(tg.x, tg.y, 8, kind === 'drain' ? 300 : 70, col, 0.5, 5); } catch (_) {} }
    emit('mesprit', { dex: 481, kind });
  }
  // Uxie: below 10% HP she turns untouchable for 20 s and runs to one of her sisters
  function lastStand(s) { s.standT = CFG.lastStandTime; s.standCd = CFG.lastStandTime + CFG.lastStandCd; say(s.x, s.y - 56, 'Untouchable!', '#ffe27a'); sfx('shield'); emit('stand', { dex: 480 }); }
  // a real buff on the shared buff pool: it shows on the HUD, in the Stats panel, and reaches all three sisters
  function teamBuff(stat, n) { if (!owner) return; for (let i = 0; i < (n || 1); i++) owner.addBuff(stat, CFG.buffStep, CFG.buffTime, CFG.buffMax); }
  const stacks = stat => (owner && owner.buffs && owner.buffs[stat] && owner.buffs[stat].n) || 0;
  // MYSTICAL POWER — Uxie: DEF + pushes enemies back 5 studs · Mesprit: ATK + DEF, then +20% more or enemies walk
  // backwards for 5 s · Azelf: ATK + SPEED. Always on the shared buffs, so her sisters get it too.
  const mysticAt = {};
  function mystical(dex, src) {
    const now = performance.now() / 1000; if (now - (mysticAt[dex] || -99) < CFG.mysticCd) return false; mysticAt[dex] = now;
    const N = E(), col = TRIO[dex].ring, R = CFG.mysticRadius; let kind = '';
    if (dex === 480) { teamBuff('def'); const dist5 = CFG.pushStuds * CFG.stud;
      for (const e of foes()) { const dd = dist(e, src); if (e.remote || dd > R + (e.r || 12)) continue; const a = Math.atan2(e.y - src.y, e.x - src.x), k = (e.boss || e.legend) ? 1 / 3 : 1; e.__lakePush = { vx: Math.cos(a) * dist5 * k / 0.25, vy: Math.sin(a) * dist5 * k / 0.25, t: 0.25 }; }
      say(src.x, src.y - 60, 'DEF ↑ ' + stacks('def') * 10 + '% · Pushed back!', col); kind = 'push'; }
    else if (dex === 481) { teamBuff('atk'); teamBuff('def');
      if (Math.random() < 0.5) { teamBuff('atk', CFG.mespritExtra); teamBuff('def', CFG.mespritExtra); say(src.x, src.y - 60, 'Sisters +20%! ATK & DEF ↑', col); kind = 'boost'; }
      else { for (const e of foes()) if (!e.boss && !e.legend && !e.remote && dist(e, src) < R + (e.r || 12)) e.__lakeFearT = CFG.fearTime; say(src.x, src.y - 60, 'ATK & DEF ↑ · Back off!', col); kind = 'fear'; } }
    else { teamBuff('atk'); teamBuff('spd'); say(src.x, src.y - 60, 'ATK & SPD ↑ ' + stacks('atk') * 10 + '%', col); kind = 'power'; }
    for (const m of teamMembers()) try { N.FX.ring(m.x, m.y, 6, 46, col, 0.5, 4); } catch (_) {}
    emit('mystical', { dex, kind }); return true;
  }
  // a summoned sister's own Mystical Power: a psychic wave around her, then the buff
  function mysticalAlly(s) { if (!near(s, CFG.mysticRadius).length) return false; const N = E();
    blast(s, s.x, s.y, CFG.mysticRadius, (s.dex === 482 ? 2.8 : s.dex === 481 ? 2 : 1.2) * lvlMul(s), { color: s.t.ring });
    try { N.FX.ring(s.x, s.y, 10, CFG.mysticRadius * 0.6, '#ffffff', 0.4, 4); N.FX.burst(s.x, s.y - 20, s.t.ring, 18, 200); } catch (_) {}
    say(s.x, s.y - 46, 'Mystical Power!', s.t.ring); mystical(s.dex, s); return true; }
  // Uxie's last stand: the closest of Azelf / Mesprit (you, if you are one of them)
  function sisterNear(s) { const L = []; if (owner && Number(owner.dex) !== 480) L.push(owner); for (const d of [481, 482]) { const a = allies[d]; if (a && !a.dead && a.spawnT >= CFG.spawnTime) L.push(a); } return L.sort((a, b) => dist(a, s) - dist(b, s))[0] || owner; }
  const SKILLS = {
    480: [   // Uxie: buffs for herself and her sisters, confusion, stuns and knockback
      { lv: 1, cd: 7, use: s => mysticalAlly(s) },
      { lv: 1, cd: 6, use: s => { const L = near(s, 130); if (!L.length) return false; let n = 0; for (const e of L) if (Math.random() < 0.6 && confuse(e, 2.5)) n++; try { E().FX.ring(s.x, s.y, 8, 130, '#c86bff', 0.5, 5); } catch (_) {} if (n) emit('skill', { dex: 480, skill: 'confuse' }); return true; } },
      { lv: 2, cd: 10, use: s => cosmic(s) },
      { lv: 3, cd: 12, use: s => (s.hp < s.maxHp * 0.7 || teamMembers().some(m => m.hp < m.maxHp * 0.5)) && recover(s) },
      { lv: 4, cd: 7, use: s => near(s, 160).length >= 2 && shove(s) }],
    481: [   // Mesprit: stall, defense, heal and buff on top of her 5-second pulse
      { lv: 1, cd: 7, use: s => mysticalAlly(s) },
      { lv: 2, cd: 8, use: s => near(owner, 170).length >= 3 && (blast(s, owner.x, owner.y, 170, 0.3, { slow: 0.5, slowT: 3, stun: 0.9, stunChance: 0.6, color: '#ffb0e0' }), say(s.x, s.y - 50, 'Lullaby', s.t.ring), emit('skill', { dex: 481, skill: 'lullaby' }), true) },
      { lv: 3, cd: 14, use: s => teamMembers().some(m => m.hp < m.maxHp * 0.45) && (team.protect = 0.35, team.protectT = 4, say(owner.x, owner.y - 60, 'Protect!', s.t.ring), sfx('shield'), emit('skill', { dex: 481, skill: 'protect' }), true) },
      { lv: 4, cd: 22, use: s => { if (teamMembers().some(m => m.hp < m.maxHp * 0.4)) { healTeam(0.3, s); say(s.x, s.y - 50, 'Healing Wish', s.t.ring); sfx('levelup'); emit('skill', { dex: 481, skill: 'wish' }); return true; }
        if (near(s, 260).length) { rise(1, s); say(s.x, s.y - 50, 'Helping Hand', s.t.ring); emit('skill', { dex: 481, skill: 'hand' }); return true; } return false; } }],
    482: [   // Azelf: damage
      { lv: 1, cd: 7, use: s => mysticalAlly(s) },
      { lv: 2, cd: 14, use: s => near(s, 300).length > 0 && (rise(2, s), say(s.x, s.y - 50, 'Nasty Plot!', s.t.ring), emit('skill', { dex: 482, skill: 'plot' }), true) },
      { lv: 3, cd: 8, use: s => futureSight(s) },
      { lv: 4, cd: 10, use: s => { const tg = foes().filter(e => dist(e, s) < 320).sort((a, b) => (b.maxHp || 0) - (a.maxHp || 0))[0]; if (!tg) return false;
        blast(s, tg.x, tg.y, 40, 7 * lvlMul(s), { knock: 120, color: '#9ad0ff' }); say(tg.x, tg.y - 50, 'Psycho Boost!', s.t.ring); sfx('boss'); emit('skill', { dex: 482, skill: 'boost' }); return true; } }] };
  function cosmic(s) { emit('skill', { dex: 480, skill: 'cosmic' }); teamBuff('def'); say(s.x, s.y - 50, 'Cosmic Power! DEF ↑ ' + stacks('def') * 10 + '%', s.t.ring); sfx('shield'); for (const m of teamMembers()) try { E().FX.ring(m.x, m.y, 6, 50, '#ffe27a', 0.5, 4); } catch (_) {} return true; }
  function recover(s) { emit('skill', { dex: 480, skill: 'recover' }); s.hp = Math.min(s.maxHp, s.hp + s.maxHp * 0.3); try { if (!owner.dead) owner.heal(owner.maxHp * 0.08); } catch (_) {} owner.addBuff('regen', Math.max(1, owner.maxHp * 0.01), 6, 3); say(s.x, s.y - 50, 'Recover', '#5fe08a'); return true; }
  function shove(s) { emit('skill', { dex: 480, skill: 'shove' }); blast(s, s.x, s.y, 160, 0.6 * lvlMul(s), { knock: 300, stun: 1.5 }); say(s.x, s.y - 50, 'Psychic Shove!', s.t.ring); sfx('quake'); return true; }
  function futureSight(s) { const tg = densest(s, 360); if (!tg) return false; emit('skill', { dex: 482, skill: 'future' }); sights.push({ s, x: tg.x, y: tg.y, t: 0, dur: 1.2, r: 120 }); say(s.x, s.y - 50, 'Future Sight', s.t.ring); return true; }
  // the move's cooldown: call the ally, or use its signature command
  function command(dex) {
    const s = allies[dex];
    if (!s) { summon(dex); return; }
    if (s.dead) { if ((E().Game.st?.time ?? 0) >= s.respawnAt) { delete allies[dex]; summon(dex, true); } return; }
    if (s.spawnT < CFG.spawnTime) return;
    if (dex === 480) { cosmic(s); if (s.lvl >= 4) shove(s); }
    else if (dex === 481) { healTeam(0.1 * lvlMul(s), s); say(s.x, s.y - 50, 'Heal Pulse', s.t.ring); }
    else { if (!futureSight(s)) rise(1, s); }
  }

  // ---- AI ----
  // solid ground for a body of radius r: the engine's own check (walls, rocks, trees' trunks, water...)
  const freeAt = (x, y, r) => { try { return E().World.isFree(x, y, Math.max(6, (r || 16) * 0.6)); } catch (_) { return true; } };
  function nearFree(x, y, r) { if (freeAt(x, y, r)) return { x, y }; for (let d = 8; d <= 240; d += 8) for (let i = 0; i < 16; i++) { const a = i * TAU / 16, nx = x + Math.cos(a) * d, ny = y + Math.sin(a) * d; if (freeAt(nx, ny, r)) return { x: nx, y: ny }; } return { x, y }; }
  function everyone() { try { const N = E(), ev = N.Game.everyone; const L = typeof ev === 'function' ? ev.call(N.Game) : ev; return Array.isArray(L) ? L : []; } catch (_) { return []; } }
  const coopOn = () => !!(E()?.Coop?.active);
  // co-op: while her sister-player is far away or down, she follows and fights for the nearest other player
  function anchorFor(s, p) {
    if (!coopOn() || (!p.dead && dist(s, p) < CFG.coopFar)) return p;
    let best = null, bd = Infinity; for (const q of everyone()) { if (!q || q === p || q.dead || !Number.isFinite(q.x)) continue; const dd = dist(s, q); if (dd < bd) { bd = dd; best = q; } }
    return best || p;
  }
  // an enemy shot about to hit her: the sidestep direction
  function incoming(s) {
    for (const q of E().Projectiles.all()) { if (!q || q.friendly || q.ghost) continue; const dx = s.x - q.x, dy = s.y - q.y, dd = Math.hypot(dx, dy); if (dd > 170) continue;
      const v = Math.hypot(q.vx || 0, q.vy || 0); if (v < 1) continue; const ux = q.vx / v, uy = q.vy / v; if (dx * ux + dy * uy <= 0) continue;
      const perp = dx * uy - dy * ux; if (Math.abs(perp) > 34) continue; const sd = perp >= 0 ? 1 : -1; return { x: uy * sd, y: -ux * sd }; }
    return null;
  }
  // running from a crowd: the free spot (of 16) furthest from enemies, without straying from whoever she protects
  function escapePoint(s, enemies, A) {
    let best = null, bs = -Infinity;
    for (let i = 0; i < 16; i++) { const a = i * TAU / 16, pt = { x: s.x + Math.cos(a) * 120, y: s.y + Math.sin(a) * 120 }; if (!freeAt(pt.x, pt.y, s.r)) continue;
      let sc = 0; for (const e of enemies) { const dd = dist(pt, e); if (dd < 280) sc -= 4000 / (dd + 20); } sc -= Math.max(0, dist(pt, A) - 140) * 0.8;
      if (sc > bs) { bs = sc; best = pt; } }
    return best || { x: A.x, y: A.y };
  }
  // ---- jobs, like a player: loot, power-up crystals, chests (and waiting at the big chest) ----
  const keyOf = c => c.type + ':' + c.tx + ':' + c.ty + ':' + Math.round(c.x) + ':' + Math.round(c.y);
  const claimed = (s, ref) => IDS.some(d => { const o = allies[d]; return o && o !== s && !o.dead && o.job && o.job.ref === ref; });
  function chestsNear(x, y, r) { const W = E().World; return [...new Set([...(W.propsInCircle(x, y, r) || []), ...(W.specialsNear(x, y, r) || [])])].filter(c => c && (c.type === 'chest' || c.type === 'bigchest') && !c.hoopaOpened && !c.broken); }
  const chestRange = (s, c) => Math.max(46, (c.r || 16) + s.r + 24);
  function pickJob(s, A, enemies) {
    const N = E(), R = CFG.jobRange, clear = (pt, r) => !enemies.some(e => !(e.__lakeConfT > 0) && !(e.__lakeFearT > 0) && dist(e, pt) < r);
    if (!clear(s, 100)) { s.jobWhy = 'threat'; return null; }   // a real threat: the fight comes first, and she comes back to the job after
    const ok = pt => dist(pt, A) < s.t.leash * 1.2 && clear(pt, CFG.jobSafe);   // a new job needs a quiet spot...
    let j = s.job;
    if (j) { const still = j.kind === 'crystal' ? !j.ref.used : j.kind === 'loot' ? N.Pickups.all().includes(j.ref) : !j.ref.hoopaOpened && !j.ref.broken && chestsNear(j.ref.x, j.ref.y, 8).some(c => keyOf(c) === keyOf(j.ref));
      if (!still || dist(j.ref, A) > s.t.leash * 1.3 || !clear(j.ref, 90)) { s.jobWhy = !still ? 'done' : !clear(j.ref, 90) ? 'unsafe spot' : 'too far'; j = s.job = null; } }   // ...an ongoing one only stops for a real threat
    if (!j) {
      const alt = (N.World.specialsNear(s.x, s.y, R + 180) || []).filter(c => c && c.type === 'altar' && !c.used && c.kind !== 4 && ok(c) && !claimed(s, c)).sort((a, b) => dist(a, s) - dist(b, s))[0];
      const ch = !alt && chestsNear(s.x, s.y, R).filter(c => ok(c) && !claimed(s, c)).sort((a, b) => dist(a, s) - dist(b, s))[0];
      const team = teamMembers().some(m => m.hp < m.maxHp * 0.7);
      const loot = !alt && !ch && N.Pickups.all().filter(dr => dr && dist(dr, s) < R && ok(dr) && !claimed(s, dr)).sort((a, b) => (dist(a, s) - (a.kind === 'item' ? 200 : a.kind === 'heal' && team ? 120 : 0)) - (dist(b, s) - (b.kind === 'item' ? 200 : b.kind === 'heal' && team ? 120 : 0)))[0];
      if (alt) j = { kind: 'crystal', ref: alt }; else if (ch) j = { kind: ch.type === 'bigchest' ? 'bigchest' : 'chest', ref: ch }; else if (loot) j = { kind: 'loot', ref: loot };
      s.job = j; }
    if (!j) return null;
    return { kind: j.kind, pos: { x: j.ref.x, y: j.ref.y }, stop: j.kind === 'loot' ? 0 : chestRange(s, j.ref) - 12 };
  }
  function doJob(s, dt) {
    const N = E(), j = s.job; if (!j || s.mode !== j.kind) return;
    if (j.kind === 'crystal') { if (!j.ref.used && dist(s, j.ref) < chestRange(s, j.ref)) { N.Interact.hoopaActivateAltar(s.owner, j.ref); say(s.x, s.y - 50, 'Power up!', s.t.ring); s.job = null; } return; }
    if (j.kind === 'chest' || j.kind === 'bigchest') { const c = j.ref; if (dist(s, c) > chestRange(s, c)) { s.chestTime = 0; return; }
      s.chestTime = (s.chestTime || 0) + dt;
      if (j.kind === 'bigchest') { c.open = Math.max(c.open || 0, s.chestTime); if (s.chestTime >= (N.Interact.CHEST_TIME || 3.5)) { c.hoopaOpened = true; N.World.breakProp(c); say(s.x, s.y - 50, 'Opened it!', s.t.ring); s.job = null; s.chestTime = 0; } }
      else if (s.chestTime >= 0.6) { try { s.anim && s.anim.play('Attack'); } catch (_) {} c.hoopaOpened = true; N.World.breakProp(c); s.job = null; s.chestTime = 0; } }
  }
  // a held item she picks up is hers (until then she shares yours)
  const ITEM_NAME = id => String(id).replace(/(orb|band|scarf|claw|sash|bell|coin|charm|egg|lens|berry|helmet|ice|rock|balloon|button|vest)$/, ' $1').replace(/^./, c => c.toUpperCase());
  function equipSister(s, id) { try { s.caster.equip(id); } catch (_) { s.ownItem = id; } if (!s.ownItem) s.ownItem = id; say(s.x, s.y - 56, s.name + ' equipped ' + ITEM_NAME(id), s.t.ring); emit('item', { dex: s.dex, item: id }); }
  const sistersAlive = () => IDS.map(d => allies[d]).filter(s => s && !s.dead && s.spawnT >= CFG.spawnTime);
  function update(dt) {
    const N = E(), p = N?.Game?.player;
    if (!p || !isTrio(p.dex) || (p.dead && !(coopOn() && everyone().some(q => q && q !== p && !q.dead)))) { if (owner) clearAll(); return; }
    if (p !== owner) { clearAll(); owner = p; }
    if (N.Game.state !== 'playing') return;
    // came through a Rift or any teleport: bring the team along
    if (!p.dead && ownerPos && Math.hypot(p.x - ownerPos.x, p.y - ownerPos.y) > 420) for (const d of IDS) { const s = allies[d]; if (s) { const f = nearFree(p.x + s.side * 70, p.y + 8, s.r); s.x = f.x; s.y = f.y; s.path = []; s.okX = f.x; s.okY = f.y; } }
    ownerPos = { x: p.x, y: p.y };
    if ((team.protectT -= dt) <= 0) team.protect = 0;
    for (let i = sights.length - 1; i >= 0; i--) { const f = sights[i]; f.t += dt; if (f.t >= f.dur) { blast(f.s, f.x, f.y, f.r, 4 * lvlMul(f.s), { knock: 140, color: '#9ad0ff' }); sfx('boss'); sights.splice(i, 1); } }
    for (let i = fx.length - 1; i >= 0; i--) { fx[i].t += dt; if (fx[i].t > fx[i].life) fx.splice(i, 1); }
    const enemies = N.EnemyMgr.all().filter(e => e && !e.dead);
    // your own passives when you play one of the trio
    const P = Number(p.dex);
    if (P === 481) { team.pPulse = (team.pPulse ?? CFG.mespritEvery) - dt; if (team.pPulse <= 0) { team.pPulse = CFG.mespritEvery; try { mespritPulse(p); } catch (err) { console.warn('[lake]', err); } } }
    if (P === 480) { team.pStandCd = Math.max(0, (team.pStandCd || 0) - dt); if (team.pStandT > 0 && (team.pStandT -= dt) <= 0) emit('standEnd', { dex: 480 }); }
    for (const d of IDS) {
      const s = allies[d]; if (!s) continue; s.age += dt;
      if (s.dead) { s.melt += dt; continue; }
      if (s.spawnT < CFG.spawnTime) { s.spawnT += dt; if (s.anim) { s.anim.loop('Idle'); s.anim.update(dt); } if (s.spawnT >= CFG.spawnTime) { say(s.x, s.y - 50, s.name + '!', s.t.ring); try { N.FX.burst(s.x, s.y - 20, s.t.drop[1], 24, 200); } catch (_) {} emit('arrive', { dex: d, again: s.again }); } continue; }
      const m = moveOf(p, d); s.lvl = m?.lvl || s.lvl || 1;
      const mh = hpFor(s); if (mh !== s.maxHp) { s.hp = s.hp / s.maxHp * mh; s.maxHp = mh; }
      if (s.low && s.hp > s.maxHp * 0.8) s.low = false;
      let regen = 0; try { regen = Number(s.caster.regen) || 0; } catch (_) {} s.hp = Math.min(s.maxHp, s.hp + regen * dt);
      for (const k of ['invuln', 'reviveShield', 'shadeInv', 'balloonCd']) s.caster[k] = Math.max(0, (Number(s.caster[k]) || 0) - dt);   // the engine's hit i-frames wear off
      s.hurtCd = Math.max(0, s.hurtCd - dt); s.stunT = Math.max(0, s.stunT - dt); s.slowT = Math.max(0, s.slowT - dt);
      if (s.standCd > 0) s.standCd -= dt; if (s.standT > 0 && (s.standT -= dt) <= 0) { s.standT = 0; emit('standEnd', { dex: d }); }
      // whom she follows and fights for: you — or in co-op, the nearest other player while you are far away or down
      const A = anchorFor(s, p);
      let target = null, best = Infinity;
      for (const e of enemies) { if (dist(e, A) > s.t.leash) continue; const sc = dist(s, e) - ((e.behavior === 'thief' || e.golden) ? 400 : 0) + (e.__lakeConfT > 0 ? 200 : 0); if (sc < best) { best = sc; target = e; } }
      s.target = target;
      const post = { x: A.x + s.side * 70, y: A.y + 10 };
      const kitId = s.t.kit[s.kitI % s.t.kit.length], def = N.Moves.BY_ID[kitId] ? N.Moves.instance(kitId, Math.min(N.Moves.BY_ID[kitId].maxLvl || 1, s.lvl)) : null;
      const range = def && window.PS_HOOPA?.attackRange ? window.PS_HOOPA.attackRange(def) : { min: 0, ideal: s.t.ideal, max: 260 };
      // ---- think: dodge > last stand > escape the crowd > regroup > jobs (loot, chests, crystals) > fight > post ----
      let goal = null, stop = 0; s.mode = 'idle';
      const hpF = s.hp / s.maxHp, crowd = enemies.filter(e => dist(e, s) < 130 && !(e.__lakeConfT > 0) && !(e.__lakeFearT > 0));
      const panic = d === 480 ? 1 : d === 481 ? 2 : (hpF < 0.5 ? 2 : 4);
      s.dodgeT = Math.max(0, (s.dodgeT || 0) - dt);
      if (s.dodgeT <= 0) { const q = incoming(s); if (q && Math.random() < (d === 482 ? 0.75 : d === 481 ? 0.85 : 1)) { s.dodge = q; s.dodgeT = 0.3; } }
      if (d === 480 && s.standT > 0) { const sis = sisterNear(s); goal = { x: sis.x + (s.x < sis.x ? -34 : 34), y: sis.y + 10 }; stop = 20; s.mode = 'stand'; }
      else if (crowd.length >= panic || (hpF < 0.3 && crowd.length)) { goal = escapePoint(s, enemies, A); s.mode = 'escape'; }
      else if (dist(s, A) > s.t.leash * 1.3) { goal = post; stop = 30; s.mode = 'regroup'; }
      else { const job = pickJob(s, A, enemies);
        if (job) { goal = job.pos; stop = job.stop; s.mode = job.kind; }
        else if (target) { s.orbit = (s.orbit ?? (s.side > 0 ? 0.6 : -0.6)) + (s.side > 0 ? 0.35 : -0.35) * dt;   // circle the target instead of standing still
          const want = d === 480 ? s.t.ideal : Math.min(range.ideal, s.t.ideal * 1.6), a = Math.atan2(s.y - target.y, s.x - target.x) + Math.sin(s.orbit) * 0.5;
          goal = { x: target.x + Math.cos(a) * want, y: target.y + Math.sin(a) * want }; stop = 8; s.mode = 'fight'; }
        else if (dist(s, post) > s.t.dead) { goal = post; stop = s.t.dead * 0.5; s.mode = 'follow'; } }
      if (s.mode !== 'chest' && s.mode !== 'bigchest') s.chestTime = 0;
      const spd = Math.max(60, Number(s.caster.spd) || 110) * s.t.spd * (s.slowT > 0 ? 0.5 : 1) * (s.standT > 0 || s.mode === 'escape' ? 1.35 : 1);
      let moved = false;
      if (s.dodgeT > 0 && s.dodge && s.stunT <= 0) { const st = spd * 1.8 * dt, nx = s.x + s.dodge.x * st, ny = s.y + s.dodge.y * st;
        if (freeAt(nx, ny, s.r)) { s.x = nx; s.y = ny; moved = true; goal = null; } }
      if (goal && s.stunT <= 0) { const dd = dist(s, goal); const step = Math.min(Math.max(0, dd - stop), spd * dt);
        if (step > 0.5) { moved = true; try { if (window.PS_HOOPA?.navigate) window.PS_HOOPA.navigate(s, goal, step, dt, enemies); else { const a = Math.atan2(goal.y - s.y, goal.x - s.x); s.x += Math.cos(a) * step; s.y += Math.sin(a) * step; } } catch (_) {} } }
      try { doJob(s, dt); } catch (err) { console.warn('[lake]', err); }
      try { s.caster.berryTick(dt); } catch (_) {}   // held berries work for her too
      // keep the trio from stacking on each other and on you
      for (const o of [p, ...IDS.map(x => allies[x]).filter(o => o && o !== s && !o.dead)]) { let dx = s.x - o.x, dy = s.y - o.y, dd = Math.hypot(dx, dy); if (dd < 40) { if (dd < 0.01) { dx = s.side; dy = 0; dd = 1; } const push = Math.min(40 - dd, 80 * dt); s.x += dx / dd * push; s.y += dy / dd * push; } }
      try { N.World.collide(s); } catch (_) {}
      // never inside an obstacle: whatever moved her there (a path shortcut, a sidestep, a shove), she goes back to her last legal spot
      if (!freeAt(s.x, s.y, s.r)) { if (s.okX != null && freeAt(s.okX, s.okY, s.r)) { s.x = s.okX; s.y = s.okY; } else { const f = nearFree(s.x, s.y, s.r); s.x = f.x; s.y = f.y; } s.path = []; }
      s.okX = s.x; s.okY = s.y;
      if (s.anim) { s.anim.loop(moved ? 'Walk' : 'Idle'); if (target) s.anim.dir = N.Sprites.dirFromAngle(Math.atan2(target.y - s.y, target.x - s.x)); else if (!moved) s.anim.dir = N.Sprites.dirFromAngle(Math.atan2(A.y - s.y, A.x - s.x)); s.anim.update(dt); }
      if (s.stunT > 0) continue;
      if (d === 481) { s.pulseT = (s.pulseT ?? CFG.mespritEvery) - dt; if (s.pulseT <= 0) { s.pulseT = CFG.mespritEvery; try { mespritPulse(s); } catch (err) { console.warn('[lake]', err); } } }
      // attack with its own moves (they level up with the summon move)
      s.next -= dt;
      if (def && target && s.next <= 0) { const d2 = dist(s, target); if (d2 >= range.min && d2 <= range.max) {
        s.aim = Math.atan2(target.y - s.y, target.x - s.x);
        try { N.Player.prototype.cast.call(s.caster, def); N.Combat.hoopaCast(s.caster, def); } catch (err) { console.warn('[lake]', err); }
        if (d === 482 && Math.random() < CFG.riseChance) rise(1, s);
        s.kitI++; s.next = Math.max(0.3, (def.cd || 1) * (Number(s.caster.cdK) || 1) * (d === 482 ? 0.8 : 1)); } }
      for (const sk of SKILLS[d]) { const k = sk.lv + ''; s.cd[k] = (s.cd[k] || 0) - dt; if (s.lvl >= sk.lv && s.cd[k] <= 0) { let used = false; try { used = !!sk.use(s); } catch (err) { console.warn('[lake]', err); } s.cd[k] = used ? sk.cd * (Number(s.caster.cdK) || 1) / (s.lvl >= 5 ? 1.25 : 1) : 0.5; } }
    }
    tether(p, dt);
  }

  // ---- the tether: stray too far from your sisters and they psychically pull you back to them ----
  let pull = null;   // {s} while pulling
  function tether(p, dt) {
    const N = E(); if (p.dead || window.PS_CREATION_RIFT?.active || window.PS_GIRATINA?.active) { pull = null; return; }
    const live = sistersAlive().filter(s => !(s.standT > 0)); if (!live.length) { pull = null; return; }
    const s = live.sort((a, b) => dist(a, p) - dist(b, p))[0], d = dist(s, p);
    if (!pull && d > CFG.tetherFar) { pull = { s }; emit('tether', { dex: s.dex }); sfx('surge'); }
    if (!pull) return; if (pull.s !== s) pull.s = s;
    if (d < CFG.tetherNear) { pull = null; return; }
    const a = Math.atan2(s.y - p.y, s.x - p.x), st = Math.min(d - CFG.tetherNear + 1, CFG.tetherSpeed * dt), ox = p.x, oy = p.y;
    p.x += Math.cos(a) * st; p.y += Math.sin(a) * st; try { N.World.collide(p); } catch (_) {}
    if (Math.hypot(p.x - ox, p.y - oy) < st * 0.2) { s.x += (p.x - s.x) * 0.02; s.y += (p.y - s.y) * 0.02; }   // blocked: she drifts your way too
  }
  // ================= engine hooks =================
  let hooked = false;
  function hook() {
    const N = E(); if (hooked || !N || !N.Combat || !N.EnemyMgr || !N.Ult || !N.Enemy || !N.Player) return; hooked = true;
    // the move: its cooldown calls the ally or its command (works from any move slot, like Hyperspace Hole)
    const prevCast = window.PS_CAST;
    window.PS_CAST = function (pl, def, hit, ghost) { if (def && MOVE_DEX[def.psCast]) return;
      const r = prevCast ? prevCast.apply(this, arguments) : undefined;
      try { const m = def && /^mystical-power-(uxie|mesprit|azelf)$/.exec(def.id || ''); if (m && !ghost && pl && pl === N.Game.player && isTrio(pl.dex)) { if (owner !== pl) { clearAll(); owner = pl; } mystical(Number(pl.dex), pl); } } catch (err) { console.warn('[lake]', err); }
      return r; };
    const tick = N.Combat.tick;
    N.Combat.tick = function (dt, pl) {
      const mine = pl && isTrio(pl.dex) && Array.isArray(pl.moves) ? pl.moves.filter(m => m && MOVE_DEX[m.id]) : [];
      if (!mine.length) return tick.apply(this, arguments);
      const saved = mine.map(m => m.t); for (const m of mine) m.t = Infinity;
      try { return tick.apply(this, arguments); }
      finally { mine.forEach((m, i) => { m.t = saved[i];
        if (pl === N.Game.player && !pl.dead && N.Game.state === 'playing') { if (owner !== pl) { clearAll(); owner = pl; }
          m.t = Math.max(0, (Number.isFinite(m.t) ? m.t : 0) - dt); if (m.t <= 0) { command(MOVE_DEX[m.id]); m.t = (m.cd || CFG.moveCd) * (Number(pl.cdK) || 1); } } }); }
    };
    // AI before the enemies move; contact and enemy shots hit the allies after
    const emu = N.EnemyMgr.update;
    N.EnemyMgr.update = function (dt) {
      try { update(dt); } catch (err) { console.warn('[lake]', err); }
      const r = emu.apply(this, arguments);
      if (owner && N.Game.state === 'playing') for (const d of IDS) { const s = allies[d]; if (!s || s.dead || s.spawnT < CFG.spawnTime) continue;
        for (const e of N.EnemyMgr.all()) if (e && !e.dead && !e.__role && dist(s, e) < s.r + (e.r || 12)) { let dmg = 0; try { dmg = typeof e.dmg === 'function' ? e.dmg() : e.dmg; } catch (_) {} hurt(s, Number(dmg) || 8, e.atkType, e); }
        const shots = N.Projectiles.all(); for (let i = shots.length - 1; i >= 0; i--) { const q = shots[i]; if (!q || q.friendly || q.ghost || dist(s, q) > s.r + (q.r || 4)) continue; hurt(s, q.pct ? Math.max(q.dmg, s.maxHp * q.pct) : q.dmg, q.mtype); shots.splice(i, 1); } }
      return r;
    };
    // pseudo-players: the sisters collect drops. A held item is theirs; XP, coins, hearts and the rest go to you.
    const pu = N.Pickups.update;
    if (typeof pu === 'function') N.Pickups.update = function (dt, players, onCollect) {
      const live = owner && owner === N.Game.player ? sistersAlive() : []; if (!live.length || typeof onCollect !== 'function') return pu.apply(this, arguments);
      for (const s of live) s.magnet = Math.max(45, (Number(owner.magnet) || 78) * 0.6);
      const col = Array.isArray(players) ? players.slice() : [players]; col.push(...live);
      return pu.call(this, dt, col, (drop, c) => {
        if (live.includes(c)) { if (drop && drop.kind === 'item' && N.Items.BY && N.Items.BY[drop.value]) { equipSister(c, drop.value); return; } return onCollect(drop, owner); }
        return onCollect(drop, c); });
    };
    // the big chest keeps the progress a sister builds while she waits at it
    const iu = N.Interact.update;
    if (typeof iu === 'function') N.Interact.update = function () {
      const held = sistersAlive().filter(s => s.mode === 'bigchest' && s.job && s.chestTime > 0).map(s => ({ c: s.job.ref, open: s.chestTime }));
      const r = iu.apply(this, arguments); for (const h of held) if (!h.c.hoopaOpened) h.c.open = Math.max(h.c.open || 0, h.open); return r; };
    // enemies go for the trio too (Uxie draws them in)
    const eup = N.Enemy.prototype.update, aggro = new WeakMap();
    N.Enemy.prototype.update = function (dt, target) {
      // Uxie's Mystical Power: shoved back 5 studs
      if (this.__lakePush && !this.dead) { const P = this.__lakePush, k = Math.min(dt, P.t); this.x += P.vx * k; this.y += P.vy * k; try { N.World.collide(this); } catch (_) {} if ((P.t -= dt) <= 0) this.__lakePush = null; }
      // Mesprit's Mystical Power: it walks backwards, away from the team, for 5 s
      if (this.__lakeFearT > 0 && !this.dead) { this.__lakeFearT -= dt; this.touchCd = Math.max(Number(this.touchCd) || 0, 0.25); const o = owner || N.Game.player || this, a = Math.atan2(this.y - o.y, this.x - o.x);
        arguments[1] = { x: this.x + Math.cos(a) * 200, y: this.y + Math.sin(a) * 200, r: 1, dead: false, hp: 1, maxHp: 1, hurt() {} }; return eup.apply(this, arguments); }
      // confused (Uxie / Mesprit): it goes after its own allies instead of you
      if (this.__lakeConfT > 0 && !this.dead) {
        this.__lakeConfT -= dt; this.touchCd = Math.max(Number(this.touchCd) || 0, 0.25);
        let v = this.__lakeVictim;
        if (!v || v.dead || dist(this, v) > 420) { v = null; let bd = 420; for (const o of N.EnemyMgr.all()) if (o && o !== this && !o.dead && !o.remote) { const dd = dist(this, o); if (dd < bd) { bd = dd; v = o; } } this.__lakeVictim = v; }
        if (v) { this.__lakeConfHit = (this.__lakeConfHit || 0) - dt;
          if (dist(this, v) < (this.r || 12) + (v.r || 12) + 8 && this.__lakeConfHit <= 0) { this.__lakeConfHit = 0.7; const dmg = Math.max(4, (Number(this.dmg) || 8) * 2.5);
            try { v.hurt(dmg, '#c86bff', v.x - this.x, v.y - this.y, 60); if (owner) N.Stats.dmg(owner, 'lake-uxie', dmg); } catch (_) {} }
          arguments[1] = v; return eup.apply(this, arguments); }
        const a = performance.now() / 400 + (this.x % 7); arguments[1] = { x: this.x + Math.cos(a) * 80, y: this.y + Math.sin(a) * 80, r: 1, dead: false, hp: 1, maxHp: 1, hurt() {} };   // nobody near: it staggers around
        return eup.apply(this, arguments);
      }
      if (owner && owner === N.Game.player && !this.__role) { const live = IDS.map(d => allies[d]).filter(s => s && !s.dead && s.spawnT >= CFG.spawnTime);
        if (live.length) { let a = aggro.get(this); if (!a || (a.t -= dt) <= 0 || a.c.dead) { let best = owner, bs = owner.dead ? Infinity : dist(this, owner);
            for (const s of live) { const sc = dist(this, s) - (s.dex === 480 ? 140 : 0); if (sc < bs) { bs = sc; best = s; } } a = { c: best, t: 0.75 }; aggro.set(this, a); this.__lakeAggro = best === owner ? null : best.name; }
          if (a.c !== owner) { arguments[1] = a.c.caster || a.c; target = arguments[1]; } } }
      return eup.apply(this, arguments);
    };
    // playing Uxie: a Pokemon that hits you may get confused; below 10% HP you turn untouchable for 20 s
    const ph = N.Player.prototype.hurt;
    N.Player.prototype.hurt = function (amt, type) {
      if (this.psLake || this !== N.Game.player || Number(this.dex) !== 480) return ph.apply(this, arguments);
      const before = this.hp, r = ph.apply(this, arguments);
      if (this.hp < before && !this.dead) {
        let by = null, bd = Infinity; for (const e of N.EnemyMgr.all()) if (e && !e.dead) { const dd = dist(this, e); if (dd < (this.r || 14) + (e.r || 12) + 12 && dd < bd) { bd = dd; by = e; } }
        if (by && Math.random() < CFG.confuseOnHit && confuse(by, CFG.confuseDur)) emit('confuse', { dex: 480, by: 'hit' });
        if (this.hp > 0 && this.hp < this.maxHp * CFG.lastStand && !(team.pStandCd > 0)) { this.invuln = Math.max(Number(this.invuln) || 0, CFG.lastStandTime); team.pStandT = CFG.lastStandTime; team.pStandCd = CFG.lastStandTime + CFG.lastStandCd;
          say(this.x, this.y - 60, 'Untouchable!', '#ffe27a'); sfx('shield'); emit('stand', { dex: 480, player: true }); } }
      return r;
    };
    // playing Azelf: your attacks can raise ATK & SPEED for the whole trio
    const pc = N.Player.prototype.cast; let riseAt = 0;
    N.Player.prototype.cast = function () { const r = pc.apply(this, arguments);
      try { if (!this.psLake && this === N.Game.player && Number(this.dex) === 482 && owner === this) { const t = performance.now(); if (t - riseAt > 1000 && Math.random() < CFG.riseChancePlayer) { riseAt = t; rise(1, this); } } } catch (_) {}
      return r; };
    // shared defense: Protect, and Uxie's own toughness (Cosmic Power / Mystical Power DEF are real buffs)
    const H = window.PS_HOOKS || (window.PS_HOOKS = {}), take = H.take;
    H.take = function (type, who, amt) { let m = take ? take.apply(this, arguments) : 1;
      try { if (owner && (who === owner || (who && who.psLake))) { m *= 1 - team.protect; if (who.psLake && who.psLake.dex === 480) m *= TRIO[480].take; } } catch (_) {} return m; };
    // Z-Move: 3x damage, twice the cooldown (only the Lake Guardians)
    const P = N.Projectiles, C = N.Combat; let zScope = false;
    const addField = C.addField;
    if (typeof addField === 'function') C.addField = function (f) { if (zScope && f) { if (Number.isFinite(f.dmg)) f.dmg *= CFG.zDmg; if (Number.isFinite(f.dps)) f.dps *= CFG.zDmg; } return addField.apply(this, arguments); };
    const zWrap = fn => function (actor) {
      if (!(actor && actor === N.Game.player && isTrio(actor.dex))) return fn.apply(this, arguments);
      const before = new Set(P.all()); zScope = true; let r;
      try { r = fn.apply(this, arguments); } finally { zScope = false; for (const q of P.all()) if (!before.has(q) && q.friendly && !q.__lakeZ) { q.__lakeZ = true; if (Number.isFinite(q.dmg)) q.dmg *= CFG.zDmg; } }
      return r; };
    const ucast = N.Ult.cast, uupd = N.Ult.update;
    const zc = zWrap(ucast); N.Ult.cast = function (actor) { const r = zc.apply(this, arguments); if (r && actor && actor === N.Game.player && isTrio(actor.dex)) { actor.ultCd = (Number(N.Ult.CD) || 90) * CFG.zCd; emit('z', { dex: Number(actor.dex) }); } return r; };
    N.Ult.update = zWrap(uupd);
    // the sisters join the engine's depth-sorted world drawables (the same way js/catching.js adds the trainer)
    const td = N.Training && N.Training.drawables;
    if (typeof td === 'function') { sorted = true; N.Training.drawables = function () { let r = td.apply(this, arguments); if (!Array.isArray(r)) r = [];
      try { if (owner && owner === N.Game.player) for (const d of IDS) { const s = allies[d]; if (s) r.push({ y: s.y, draw: g => drawBody(g, s) }); } } catch (err) { console.warn('[lake]', err); } return r; }; }
    // drawing (world space, under the HUD)
    const du = N.Ult.drawUnits;
    N.Ult.drawUnits = function (ctx) { du.apply(this, arguments); try { draw(ctx); } catch (err) { console.warn('[lake]', err); } };
  }

  // ================= drawing =================
  function drop(ctx, x, y, s, u) {   // the water drop: falls, splashes, rises into the Pokemon's shape
    const [hi, mid, lo] = s.t.drop, H = 46;
    ctx.save();
    if (u < 0.35) { const k = u / 0.35, yy = y - 130 * (1 - k * k);   // falling drop with a little trail
      ctx.globalAlpha = 0.35; ctx.fillStyle = mid; ctx.fillRect(x - 1.5, yy - 26, 3, 22); ctx.globalAlpha = 1;
      tear(ctx, x, yy, 7, 13, hi, mid, lo); }
    const pk = Math.min(1, Math.max(0, (u - 0.32) / 0.2)), pf = u > 1.15 ? Math.max(0, 1 - (u - 1.15) / 0.25) : 1;
    if (u > 0.32) { // puddle + ripple
      ctx.globalAlpha = 0.75 * pf; const g = ctx.createRadialGradient(x, y, 1, x, y, 30 * pk); g.addColorStop(0, hi); g.addColorStop(0.6, mid); g.addColorStop(1, lo); ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(x, y, 28 * pk, 10 * pk, 0, 0, TAU); ctx.fill();
      const rk = Math.min(1, (u - 0.32) / 0.5); ctx.globalAlpha = (1 - rk) * 0.8; ctx.strokeStyle = hi; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y, 20 + 30 * rk, 7 + 11 * rk, 0, 0, TAU); ctx.stroke();
      if (u < 0.7) for (let i = 0; i < 6; i++) { const a = -Math.PI * (0.15 + 0.7 * i / 5), k = (u - 0.32) / 0.38, r = 26 * k; ctx.globalAlpha = 1 - k; ctx.fillStyle = mid; ctx.beginPath(); ctx.arc(x + Math.cos(a) * r, y - 6 + Math.sin(a) * r * 0.9 + 22 * k * k, 2.4, 0, TAU); ctx.fill(); } }
    if (u > 0.55 && u < 1.35) { // the column of water rising and taking shape
      const k = Math.min(1, (u - 0.55) / 0.55), h = H * (1 - Math.pow(1 - k, 3)), w = 15 - 4 * k, wob = Math.sin(u * 22) * 2 * (1 - k), fade = u > 1.0 ? Math.max(0, 1 - (u - 1.0) / 0.35) : 1;
      ctx.globalAlpha = 0.85 * fade; const g = ctx.createLinearGradient(x, y, x, y - h); g.addColorStop(0, lo); g.addColorStop(0.5, mid); g.addColorStop(1, hi); ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(x - w, y); ctx.bezierCurveTo(x - w - 4 + wob, y - h * 0.45, x - w * 0.9, y - h * 0.9, x + wob, y - h); ctx.bezierCurveTo(x + w * 0.9, y - h * 0.9, x + w + 4 + wob, y - h * 0.45, x + w, y); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 0.5 * fade; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(x - w * 0.35 + wob, y - h * 0.6, 2.5, h * 0.18, 0, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
  function tear(ctx, x, y, w, h, hi, mid, lo) { const g = ctx.createLinearGradient(x, y - h, x, y + w); g.addColorStop(0, hi); g.addColorStop(0.6, mid); g.addColorStop(1, lo); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x, y - h); ctx.bezierCurveTo(x + w * 0.4, y - h * 0.4, x + w, y - w * 0.2, x + w, y + w * 0.2); ctx.arc(x, y + w * 0.2, w, 0, Math.PI); ctx.bezierCurveTo(x - w, y - w * 0.2, x - w * 0.4, y - h * 0.4, x, y - h); ctx.fill(); }
  // her body: drawn in the engine's depth-sorted world pass (with trees, rocks, enemies and players), so a tree in
  // front of her covers her like it covers you. Name, HP bar and effects stay on top (draw below).
  let sorted = false;
  function drawBody(ctx, s) {
    if (s.dead) { const k = Math.min(1, s.melt / CFG.meltTime); if (k < 1) { if (s.anim) { ctx.save(); ctx.globalAlpha = 1 - k; s.anim.draw(ctx, s.x, s.y); ctx.restore(); } drop(ctx, s.x, s.y, s, 1.35 - k * 0.8); } return; }
    if (s.spawnT < CFG.spawnTime) { drop(ctx, s.x, s.y, s, s.spawnT); if (s.anim && s.spawnT > 0.95) { ctx.save(); ctx.globalAlpha = Math.min(1, (s.spawnT - 0.95) / 0.4); s.anim.draw(ctx, s.x, s.y); ctx.restore(); } return; }
    ctx.save(); ctx.strokeStyle = s.t.ring; ctx.lineWidth = 2.5; ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.ellipse(s.x, s.y, 20, 7.5, 0, 0, TAU); ctx.stroke(); ctx.restore();
    if (s.anim) s.anim.draw(ctx, s.x, s.y);
  }
  function draw(ctx) {
    if (!owner || owner !== E().Game.player) return; const now = performance.now() / 1000;
    // Future Sight markers
    for (const f of sights) { const k = f.t / f.dur; ctx.save(); ctx.globalAlpha = 0.25 + 0.4 * k; ctx.strokeStyle = '#9ad0ff'; ctx.lineWidth = 3; ctx.setLineDash([8, 6]); ctx.lineDashOffset = -now * 40;
      ctx.beginPath(); ctx.ellipse(f.x, f.y, f.r * k, f.r * 0.45 * k, 0, 0, TAU); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 0.15 * k; ctx.fillStyle = '#5ab0ff'; ctx.fill(); ctx.restore(); }
    // shared shield glow (Cosmic Power / Protect)
    const sh = Math.max(team.protect, stacks('def') * CFG.buffStep);
    if (sh > 0) for (const m of teamMembers()) { ctx.save(); ctx.globalAlpha = 0.25 + sh; ctx.strokeStyle = team.protect > 0 ? '#ff9ad8' : '#ffe27a'; ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) { const a = now * 0.8 + i * TAU / 6, R = 26; ctx.beginPath(); ctx.moveTo(m.x + Math.cos(a) * R, m.y - 18 + Math.sin(a) * R * 0.9); const b = a + TAU / 6; ctx.lineTo(m.x + Math.cos(b) * R, m.y - 18 + Math.sin(b) * R * 0.9); ctx.stroke(); } ctx.restore(); }
    for (const e of foes()) if (e.__lakeConfT > 0) { const h = Number(e.bodyH) || 30; ctx.save(); for (let i = 0; i < 3; i++) { const a = now * 4 + i * TAU / 3, x = e.x + Math.cos(a) * 12, y = e.y - h - 8 + Math.sin(a) * 4;
        ctx.fillStyle = i === 1 ? '#c86bff' : '#ffe27a'; ctx.beginPath(); for (let k = 0; k < 5; k++) { const b = -Math.PI / 2 + k * TAU / 5, r = k % 2 ? 1.6 : 3.6; ctx.lineTo(x + Math.cos(b) * 3.6, y + Math.sin(b) * 3.6); ctx.lineTo(x + Math.cos(b + TAU / 10) * 1.6, y + Math.sin(b + TAU / 10) * 1.6); } ctx.fill(); } ctx.restore(); }
    for (const e of foes()) if (e.__lakeFearT > 0) { const h = Number(e.bodyH) || 30, x = e.x + 10, y = e.y - h - 6 + Math.sin(now * 10) * 1.5; ctx.save(); ctx.fillStyle = '#4aa8ff'; ctx.beginPath(); ctx.moveTo(x, y - 6); ctx.quadraticCurveTo(x + 4.5, y, x, y + 3); ctx.quadraticCurveTo(x - 4.5, y, x, y - 6); ctx.fill(); ctx.restore(); }
    const stand = (x, y, t) => { ctx.save(); ctx.globalAlpha = 0.35 + 0.15 * Math.sin(now * 8); ctx.strokeStyle = '#ffe27a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, y - 18, 26, 30, 0, 0, TAU); ctx.stroke();
      ctx.globalAlpha = 0.12; ctx.fillStyle = '#fff6c0'; ctx.fill(); ctx.globalAlpha = 1; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = '#1a1030'; ctx.fillStyle = '#ffe27a';
      const tx = 'Untouchable ' + Math.ceil(t) + 's'; ctx.strokeText(tx, x, y + 24); ctx.fillText(tx, x, y + 24); ctx.restore(); };
    if (team.pStandT > 0 && owner) stand(owner.x, owner.y, team.pStandT);
    if (pull && pull.s && owner) { const s = pull.s, n = 18, a = Math.atan2(owner.y - s.y, owner.x - s.x) + Math.PI / 2; ctx.save(); ctx.strokeStyle = s.t.ring; ctx.lineWidth = 3; ctx.shadowColor = s.t.ring; ctx.shadowBlur = 10; ctx.globalAlpha = 0.85; ctx.beginPath();
      for (let i = 0; i <= n; i++) { const u = i / n, x = s.x + (owner.x - s.x) * u, y = s.y - 18 + (owner.y - s.y) * u, w = Math.sin(u * Math.PI * 4 - now * 14) * 6 * Math.sin(u * Math.PI); ctx.lineTo(x + Math.cos(a) * w, y + Math.sin(a) * w); }
      ctx.stroke(); ctx.restore(); }
    for (const d of IDS) { const s = allies[d]; if (!s) continue;
      if (s.standT > 0 && !s.dead) stand(s.x, s.y, s.standT);
      if (!sorted) drawBody(ctx, s);   // normally her body is drawn in the world's depth-sorted pass (see drawBody)
      if (s.dead || s.spawnT < CFG.spawnTime) continue;
      ctx.save(); ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = '#1a1030'; ctx.fillStyle = '#fff';
      const label = (s.shiny ? '★ ' : '') + s.name + ' · ' + s.t.role + ' · Lv' + s.lvl + (s.ownItem ? ' · ' + ITEM_NAME(s.ownItem) : ''); ctx.strokeText(label, s.x, s.y - 50); ctx.fillText(label, s.x, s.y - 50);
      ctx.fillStyle = '#25152f'; ctx.fillRect(s.x - 22, s.y - 44, 44, 4); ctx.fillStyle = s.t.ring; ctx.fillRect(s.x - 22, s.y - 44, 44 * Math.max(0, s.hp / s.maxHp), 4); ctx.restore(); }
  }

  // ================= boot =================
  (function boot() { try { register(); hookPool(); hook(); } catch (err) { console.warn('[lake]', err); } if (!(registered && hooked)) setTimeout(boot, 200); else setInterval(() => { try { hookPool(); patchMystical(); } catch (_) {} }, 1000); })();
  window.PS_LAKE = { kit: { freeAt, nearFree, incoming, escapePoint, chestsNear, chestRange, keyOf, itemName: ITEM_NAME, drop },   // shared with other companions (js/digger-bros.js)
    cfg: CFG, trio: TRIO, team, get pulling() { return !!pull; }, get allies() { return IDS.map(d => allies[d]).filter(Boolean).map(s => ({ dex: s.dex, name: s.name, hp: Math.round(s.hp), maxHp: s.maxHp, lvl: s.lvl, dead: s.dead, spawning: s.spawnT < CFG.spawnTime, x: s.x, y: s.y })); },
    _ally: dex => allies[Number(dex)] || null,
    _anchor: (dex, p) => { const s = allies[Number(dex)]; return s ? anchorFor(s, p || owner) : null; },
    summon: dex => { const p = player(); if (!p || !isTrio(p.dex) || Number(dex) === Number(p.dex)) return null; if (owner !== p) { clearAll(); owner = p; } delete allies[dex]; return !!summon(Number(dex)); } };
})();
