/* WILD LIFE — the dungeon feels alive, Pokemon Mystery Dungeon style. Every wild Pokemon is a real Pokemon on the
   field: harmless or harmful, you CAN hit and knock it out — and the others notice.
   - NOT EVERYONE WANTS TO FIGHT: about a quarter of the wild Pokemon that show up just live their lives. They
     wander, nap (Zzz), munch berries, sniff flowers, dig for treasure (and sometimes find a coin), chase their own
     tail until they're dizzy, stare at the clouds, play tag with each other, TRY to swim (and sink, unless they're
     Water-types) or TRY to climb a tree (and fall on their face). They never hurt you, and greet you as you pass.
   - HURTING THE HARMLESS: hit one and it cries out ("Ow! Why?! I wasn't doing anything!"), then runs away crying,
     breaks down in tears, or gets angry and fights back. Knock one out and it may say its last words; the harmless
     ones around it cry ("NO! Leave them alone!"), mourn their friend, flee from you, or turn on you.
   - EVERYONE REACTS: emote bubbles and little speech bubbles everywhere. Harmless Pokemon flee from bosses, gasp at
     shinies, cheer at brawls ("Fight! Fight!"), get startled by your level-ups, and run when fighters drop near
     them. During the big moments — Giratina's Void, the Creation Rift — the Pokemon on
     screen panic: some TRY to run (and can't get far), others cower and shake, shouting "RUN!!".
   - HABITAT SCENES: now and then a little moment plays out near you (a male Ralts proposing to a female Ralts,
     Jigglypuff's concert putting everyone to sleep, Meowth stealing Rattata's Gold Ball...). Its actors are real
     Pokemon too: you can interrupt the scene... at a price.
   - GRUDGES: some hostile Pokemon hate each other more than they hate you (a Rattata attacking another Rattata
     because it stole its Gold Ball!). They brawl until one drops or they call a truce.
   - JOINING YOU (up to 3 allies), for many reasons: fed up with its own pack; begging when badly hurt; one of your own
     species; awed by your knockout streak; freed when its boss falls; talked into it by one of your allies; grateful
     when you win its brawl for it; or hit by its own side (a stray shot: it lashes out at the shooter in a brawl, or
     quits on the spot and defects to you). Shoves between enemies can start brawls too.
   - ALLIES fight like real summons (the Lake sisters, Hoopa's summons): real moves of their own type, levelled with
     you; smart targets; the right range; dodging shots; escaping crowds; regrouping; never walking into walls.
   - Hostile Pokemon taunt you, panic at low HP, bosses introduce themselves.
   Regular wild and enemy Pokemon don't talk (CFG.wildTalk = false): only you, your summons and bosses / legendaries do. Talk-box lines go through js/lake-talk.js (up to three speakers at once), with each Pokemon's portrait.
   The roles (harmless, grudges, allies) only happen in solo, where your game owns the enemies; in co-op you still
   get the chatter, emotes and reactions. Everything is drawn on your own screen only. */
(() => {
  'use strict';
  if (window.PS_WILD_INSTALLED) return; window.PS_WILD_INSTALLED = true;
  const E = () => window.PS_HOOPA_ENGINE, TAU = Math.PI * 2;
  // wildTalk: false = regular wild and enemy Pokemon don't talk; you, your summons (the Lake sisters, your allies) and bosses / legendaries do
  const CFG = { wildTalk: false, idle: 0.25, grudge: 0.035, turn: 0.02, lowTurn: 0.03, maxAllies: 3, sceneFirst: [25, 40], sceneEvery: [50, 80], despawn: 1300,
    taunt: 0.06, spotEmote: 0.14, feudTime: 20, allyCd: 1.1, allyRange: 280, idleSpd: 0.5 };
  const T = () => window.PS_LAKE_TALK, K = () => window.PS_LAKE?.kit;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = L => L[Math.floor(Math.random() * L.length)];
  const sfx = n => { try { E().Audio.sfx(n); } catch (_) {} };
  const txt = (x, y, t, c) => { try { E().FX.dmgText(x, y, t, c || '#fff'); } catch (_) {} };
  const free = (x, y, r) => { const k = K(); if (k) return k.freeAt(x, y, r); try { return E().World.isFree(x, y, Math.max(6, r * 0.6)); } catch (_) { return true; } };
  const kindAt = (x, y) => { try { return E().World.kindAt(x, y); } catch (_) { return 'floor'; } };
  const solo = () => !(E().Coop && E().Coop.active);
  const clock = () => performance.now() / 1000;
  const nameOf = dex => (E().DEX_BY[dex] && E().DEX_BY[dex].name) || ('#' + dex);
  const typesOf = e => (E().DEX_BY[e.dex] && E().DEX_BY[e.dex].types) || [];
  const label = w => w.name + (w.__g === 'm' || w.g === 'm' ? ' ♂' : w.__g === 'f' || w.g === 'f' ? ' ♀' : '');
  const harmless = e => !!(e && e.__role);
  const COL = { wild: '#c8ffaa', foe: '#ffb0a0', ally: '#9ad8ff' };
  function say(w, kind, face, text, em, o) { o = o || {}; if (!here(w) || area() === 'birth') return false; if (!CFG.wildTalk && kind !== 'ally' && kind !== 'legend') return false; try { return T().line(w.dex, face, text.replace(/\{(\w+)\}/g, (_, k) => o[k] || ''), em, Object.assign({ name: label(w) + nat(w), color: COL[kind], kind, obj: w, shiny: w.shiny }, o)); } catch (_) { return false; } }
  // where you are: the open field, a boss rift, Arceus's Judgment, a safe zone, Birth Island... Pokemon only talk in their own area
  function area() { const N = E(); if (window.PS_BIRTH_ISLAND?.active) return 'birth'; if (N?.Judgment?.active) return 'judgment'; if (N?.Rift?.inArena) return 'arena'; if (window.PS_SAFEZONE?.active) return 'safe';
    if (window.PS_MODES?.run?.mode === 'legend') return 'legendmode'; if (window.PS_DENS?.legend) return 'den'; return 'field'; }
  const here = w => !w || !w.__area || w.__area === area();
  const emit = (type, d) => { try { window.dispatchEvent(new CustomEvent('ps-wild', { detail: Object.assign({ type }, d || {}) })); } catch (_) {} };
  const V = () => window.PS_VOICE;   // js/wild-voice.js: every line is generated from the Pokemon's own nature, type and situation
  function speak(w, kind, sit, o) { o = o || {}; const v = V(); if (!v) return false; const l = v.line(w, sit, o); return say(w, kind, l[0], l[1], l[2], o); }
  const vb = (w, k) => (V() ? V().bubble(w, k) : '...');
  const nat = w => { const v = V() && V().who(w); return v ? ' · ' + v.nature : ''; };
  const emo = (w, k) => { try { T().emoteAt(w, k); } catch (_) {} };
  const bubbles = [];   // little speech bubbles over heads (for small talk that shouldn't fill the talk box)
  function bubble(w, text, life) { if (!w || w.dead || !here(w) || (!CFG.wildTalk && w.kind !== 'ally')) return; for (let i = bubbles.length - 1; i >= 0; i--) if (bubbles[i].obj === w) bubbles.splice(i, 1); if (bubbles.length > 7) bubbles.shift(); bubbles.push({ obj: w, text, t: 0, life: life || 2.2 }); }

  // ================= harmless Pokemon: roles and activities =================
  const seen = new WeakSet(), live = new Set(), fx = [];
  const UNSAFE = /fuse|bomb|boom|explo|summon|jump|kamikaze/i;   // behaviours that could still hurt you on their own
  const special = e => e.boss || e.legend || e.__roamer || e.__maxRaid || e.__wave || e.__legendDen || e.remote || e.golden || e.judge || e.dummy || e.__psCatch;
  function setRole(e, role, act) { e.__role = role; if (!e.__spd0) e.__spd0 = Number(e.spd) || 50; e.__home = { x: e.x, y: e.y }; e.__act = act || null; e.__goal = null; e.__hp0 = Number(e.hp) || 0; }
  function clearRole(e) { e.__role = null; e.__act = null; e.__goal = null; e.__fleeT = 0; e.__sleep = false; }
  function provoke(e) { if (!e.__role) return; clearRole(e); emo(e, 'anger'); speak(e, 'foe', 'provoked', { prio: true }); }
  function template() { const N = E(); const src = N.EnemyMgr.all().find(e => e && !e.dead && !special(e) && e.def && !e.__role); if (src) return src.def; const t = (N.Enemies && N.Enemies.TIERS && N.Enemies.TIERS[0]) || { hp: 17, spd: 56, dmg: 6, xp: 3.5 }; return t; }
  function spawnWild(dex, x, y, o) {   // a real Pokemon (it can be hit and knocked out), harmless by role
    const N = E(), b = template(); o = o || {};
    const def = { dex, name: nameOf(dex), behavior: 'chase', hp: b.hp || 17, spd: b.spd || 56, dmg: b.dmg || 6, xp: b.xp || 3 };
    let e = null; try { N.Sprites.preload([dex], 4000); e = new N.Enemy(def, x, y, N.Maps.sc({ hp: 1, spd: 1, dmg: 1 })); N.EnemyMgr.add(e); } catch (err) { console.warn('[wild]', err); return null; }
    seen.add(e); live.add(e); e.__g = o.g || (Math.random() < 0.5 ? 'm' : 'f'); setRole(e, o.role || 'idle'); return e;
  }
  function removeEnemy(e) { const arr = E().EnemyMgr.all(), i = arr.indexOf(e); if (i >= 0) arr.splice(i, 1); e.dead = true; e.gone = true; live.delete(e); }
  // --- finding things to do
  function findKind(e, kind, R) { for (let r = 40; r <= R; r += 28) for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + r * 0.01, x = e.x + Math.cos(a) * r, y = e.y + Math.sin(a) * r; if (kindAt(x, y) === kind) return { x, y }; } return null; }
  function shoreOf(e, w) { const d = dist(e, w), n = Math.ceil(d / 8); let last = { x: e.x, y: e.y }; for (let i = 1; i <= n; i++) { const x = e.x + (w.x - e.x) * i / n, y = e.y + (w.y - e.y) * i / n; if (!free(x, y, e.r || 12)) break; last = { x, y }; } return last; }
  function newAct(e, foes) {
    const kinds = ['wander', 'wander', 'nap', 'eat', 'sniff', 'dig', 'tail', 'gaze', 'swim', 'climb', 'play'];
    for (let tries = 0; tries < 6; tries++) { const k = pick(kinds), a = { kind: k, t: 0, dur: rnd(7, 14), ph: 0, said: false };
      if (k === 'swim') { const w = findKind(e, 'liquid', 280); if (!w) continue; a.water = w; a.shore = shoreOf(e, w); a.dur = 14; }
      if (k === 'climb') { const w = findKind(e, 'wall', 220); if (!w) continue; a.tree = w; a.foot = shoreOf(e, w); a.dur = 12; }
      if (k === 'play') { const m = foes.find(o => o !== e && o.__role === 'idle' && !(o.__act && o.__act.kind === 'play') && dist(o, e) < 220); if (!m) continue; a.mate = m; m.__act = { kind: 'play', t: 0, dur: a.dur, mate: e, ph: 0, said: true }; }
      return a; }
    return { kind: 'wander', t: 0, dur: rnd(6, 10), ph: 0 };
  }
  function goal(e, x, y) { e.__goal = { x, y }; }
  const near = (e, g, r) => Math.hypot(e.x - g.x, e.y - g.y) < (r || 12);
  function runAct(e, dt, p, foes) {
    if (e.__fleeT > 0) { e.__fleeT -= dt; const f = e.__fleeFrom && !e.__fleeFrom.dead ? e.__fleeFrom : p, a = Math.atan2(e.y - f.y, e.x - f.x); goal(e, e.x + Math.cos(a) * 90, e.y + Math.sin(a) * 90); e.__spdMul = 1.15;
      if (e.__crying && Math.random() < dt * 6) fx.push({ kind: 'tear', x: e.x + rnd(-6, 6), y: e.y - (e.bodyH || 40) * 0.7, vx: rnd(-40, 40), vy: -40, t: 0, life: 0.6, g: 300 }); return; }
    e.__crying = false; e.__spdMul = CFG.idleSpd; e.__sleep = false;
    if (e.__chat) { e.__goal = null; return; }   // busy talking to someone
    if (e.__role !== 'idle') return;
    let a = e.__act; if (!a || a.t > a.dur || (a.mate && a.mate.dead)) a = e.__act = newAct(e, foes); a.t += dt;
    const home = e.__home || (e.__home = { x: e.x, y: e.y }), H = e.bodyH || 40;
    switch (a.kind) {
      case 'wander': if (!e.__goal || near(e, e.__goal)) { if ((a.w = (a.w || 0) - dt) <= 0) { const ang = Math.random() * TAU, r = rnd(30, 120); goal(e, home.x + Math.cos(ang) * r, home.y + Math.sin(ang) * r); a.w = rnd(1, 3); } else e.__goal = null; } break;
      case 'nap': e.__goal = null; e.__sleep = true; if (Math.random() < dt * 1.6) fx.push({ kind: 'z', x: e.x + 8, y: e.y - H - 4, vx: rnd(6, 14), vy: -18, t: 0, life: 1.6 }); if (!a.said) { a.said = true; bubble(e, vb(e, 'nap')); }
        if (dist(e, p) < 90 && !a.woke) { a.woke = true; emo(e, 'exclaim'); bubble(e, vb(e, 'wake')); a.dur = a.t + 1.5; } if (a.woke) e.__sleep = false; break;
      case 'eat': e.__goal = null; if (!a.said) { a.said = true; fx.push({ kind: 'berry', obj: e, t: 0, life: a.dur }); } if ((a.n = (a.n || 0) - dt) <= 0) { a.n = rnd(1.5, 3); bubble(e, vb(e, 'eat'), 1.2); if (Math.random() < 0.3) emo(e, 'note'); } break;
      case 'sniff': e.__goal = null; if (!a.said) { a.said = true; fx.push({ kind: 'flower', obj: e, t: 0, life: a.dur }); emo(e, 'heart'); bubble(e, vb(e, 'sniff')); } break;
      case 'dig': e.__goal = null; if (Math.random() < dt * 8) fx.push({ kind: 'dust', x: e.x + rnd(-8, 8), y: e.y + 2, vx: rnd(-50, 50), vy: rnd(-70, -30), t: 0, life: 0.5, g: 200 });
        if (!a.said) { a.said = true; bubble(e, vb(e, 'dig')); } if (a.t > a.dur - 0.1 && !a.done) { a.done = true; if (Math.random() < 0.25) { try { E().Pickups.drop('coin', e.x, e.y + 10, 1); } catch (_) {} emo(e, 'spark'); bubble(e, vb(e, 'digFound')); } else { emo(e, 'dots'); bubble(e, vb(e, 'digNone')); } } break;
      case 'tail': { const s = a.t * 5; goal(e, home.x + Math.cos(s) * 26, home.y + Math.sin(s) * 18); e.__spdMul = 1; if (!a.said) { a.said = true; bubble(e, vb(e, 'tail')); }
        if (a.t > a.dur - 2 && !a.dz) { a.dz = true; e.__goal = null; emo(e, 'question'); bubble(e, vb(e, 'dizzy')); fx.push({ kind: 'stars', obj: e, t: 0, life: 2 }); } if (a.dz) e.__goal = null; break; }
      case 'gaze': e.__goal = null; if (!a.said) { a.said = true; emo(e, 'dots'); if (Math.random() < 0.6) bubble(e, vb(e, 'gaze'), 3); } break;
      case 'swim': {
        const types = typesOf(e), wet = types.includes('water');
        if (a.ph === 0) { goal(e, a.shore.x, a.shore.y); if (near(e, a.shore, 14) || a.t > 6) { a.ph = 1; a.t0 = a.t; bubble(e, vb(e, wet ? 'swimOk' : 'swimTry')); if (!wet) emo(e, 'sweat'); } }
        else if (a.ph === 1) { e.__goal = { x: a.water.x, y: a.water.y }; if (Math.random() < dt * 10) fx.push({ kind: 'drop', x: (e.x + a.water.x) / 2 + rnd(-10, 10), y: (e.y + a.water.y) / 2, vx: rnd(-60, 60), vy: rnd(-110, -60), t: 0, life: 0.6, g: 320 });
          if (a.t - a.t0 > 3) { a.ph = 2; e.__goal = null; if (!wet) { emo(e, 'tear'); bubble(e, vb(e, 'swimFail')); for (let i = 0; i < 8; i++) fx.push({ kind: 'drop', x: e.x, y: e.y - H * 0.6, vx: rnd(-70, 70), vy: rnd(-90, -20), t: -i * 0.05, life: 0.7, g: 300 }); } else emo(e, 'note'); a.dur = a.t + 2.5; } }
        break; }
      case 'climb':
        if (a.ph === 0) { goal(e, a.foot.x, a.foot.y); if (near(e, a.foot, 14) || a.t > 6) { a.ph = 1; a.t0 = a.t; bubble(e, vb(e, 'climbTry')); } }
        else if (a.ph === 1) { const k = Math.sin((a.t - a.t0) * 9); e.__goal = { x: a.tree.x, y: a.tree.y }; e.__lift = Math.max(0, k) * 10 + (a.t - a.t0) * 4;
          if (Math.random() < dt * 5) fx.push({ kind: 'dust', x: a.foot.x + (a.tree.x - a.foot.x) * 0.4 + rnd(-6, 6), y: a.foot.y - H * 0.5, vx: rnd(-30, 30), vy: rnd(10, 40), t: 0, life: 0.5, g: 200, c: '120,170,80' });
          if (a.t - a.t0 > 3.2) { a.ph = 2; e.__lift = 0; e.__goal = null; emo(e, 'sweat'); bubble(e, vb(e, 'climbFall')); fx.push({ kind: 'stars', obj: e, t: 0, life: 2.2 }); txt(e.x, e.y - H - 6, 'Oof!', '#ffe27a'); a.dur = a.t + 2.5; } }
        break;
      case 'play': { const m = a.mate; if (!m || m.dead) { a.dur = 0; break; } const s = a.t * 2 + (m.__act === a ? 0 : Math.PI); goal(e, m.x + Math.cos(s) * 60, m.y + Math.sin(s) * 40); e.__spdMul = 0.9;
        if (!a.said) { a.said = true; bubble(e, vb(e, 'play')); } if (Math.random() < dt * 0.6) emo(e, a.angry ? 'anger' : pick(['note', 'heart'])); break; }
      case 'leave': { const ang = a.ang ?? (a.ang = Math.atan2(e.y - p.y, e.x - p.x)); goal(e, e.x + Math.cos(ang) * 80, e.y + Math.sin(ang) * 80); e.__spdMul = 0.8; if (dist(e, p) > 900) removeEnemy(e); a.dur = 999; break; }
      case 'follow': { const m = a.mate; if (!m || m.dead) { a.dur = 0; break; } if (dist(e, m) > 36) goal(e, m.x - 22, m.y + 6); else e.__goal = null; a.dur = 999; break; }
      case 'cry': e.__goal = null; if (Math.random() < dt * 6) fx.push({ kind: 'tear', x: e.x + rnd(-6, 6), y: e.y - H * 0.7, vx: rnd(-40, 40), vy: -40, t: 0, life: 0.6, g: 300 }); if (!a.said) { a.said = true; bubble(e, vb(e, 'cry')); } break;
    }
    if (a.kind !== 'climb') e.__lift = 0;
  }
  function hops(e, dt) { if (e.__hopN > 0) { e.__hopT += dt * 9; if (e.__hopT >= Math.PI) { e.__hopT = 0; e.__hopN--; } e.__lift = Math.abs(Math.sin(e.__hopT)) * 12; } else if (e.__hopN === 0) { e.__hopN = null; e.__lift = 0; } }
  // a hit on someone harmless
  function onHarmlessHit(e, p, foes) {
    if ((e.__hitCd || 0) > clock()) return; e.__hitCd = clock() + 4;
    if (e.__role === 'scene' && scene) abortScene();
    if (!e.__hurtSaid) { e.__hurtSaid = true; speak(e, 'wild', 'hurt', { prio: true }); emit('hurtHarmless', { e }); } else emo(e, 'tear');
    const r = Math.random();
    if (r < 0.5) { e.__fleeT = 6; e.__fleeFrom = p; e.__crying = true; }
    else if (r < 0.8) provoke(e);
    else { e.__act = { kind: 'cry', t: 0, dur: 5 }; }
    for (const o of foes) if (o !== e && harmless(o) && dist(o, e) < 200) { emo(o, pick(['exclaim', 'sweat'])); if (Math.random() < 0.3) { o.__fleeT = 4; o.__fleeFrom = p; } }
  }
  // a harmless Pokemon knocked out: last words, and the others react
  let deathCd = 0;
  function onHarmlessDeath(e, p) {
    const now = clock(); if (now > deathCd && Math.random() < 0.55) { deathCd = now + 2.5; speak(e, 'wild', 'die', { prio: true }); }
    const W = E().EnemyMgr.all().filter(o => o && !o.dead && harmless(o) && dist(o, e) < 280); let spoke = false;
    for (const o of W) { emo(o, 'tear'); const same = Number(o.dex) === Number(e.dex), mate = same && o.__g && e.__g && o.__g !== e.__g || (o.__act && o.__act.mate === e);
      if (!spoke && now > (onHarmlessDeath.cd || 0)) { spoke = true; onHarmlessDeath.cd = now + 3; speak(o, 'wild', mate ? 'witnessMate' : same ? 'witnessSame' : 'witness', { prio: true, delay: 0.5 }); }
      const r = Math.random(); if (r < 0.5) { o.__fleeT = 6; o.__fleeFrom = p; o.__crying = true; } else if (r < 0.75 || same && r < 0.9) provoke(o); else o.__act = { kind: 'cry', t: 0, dur: 6 }; }
    if (scene && Object.values(scene.actors).includes(e)) abortScene();
  }

  // ================= habitat scenes (real Pokemon) =================
  // actors: [id, dex, dx, dy, opts]; steps: ['say', id, face, text, emote] ['emote', id, kind] ['move', id, idOr[dx,dy], speedMul] ['wait', s] ['hop', id, n]
  //   ['sleep', id, on] ['fx', kind, id] ['mode', id, mode, otherId] ['end']
  const SCENES = {
    proposal: { actors: [['a', 280, -80, 0, { g: 'm' }], ['b', 280, 40, -6, { g: 'f' }]], steps: [
      ['emote', 'b', 'note'], ['wait', 1], ['move', 'a', [10, -2]], ['say', 'a', 'worried', 'R-Ralts... can I tell you something?', 'sweat'], ['say', 'b', 'surprised', 'Hm? What is it?', 'question'],
      ['fx', 'ring', 'a'], ['say', 'a', 'determined', 'Will you... be my partner? Forever and ever?', 'heart'], ['wait', 1.2], ['say', 'b', 'teary', '...Yes! YES! A thousand times yes!', 'heart'],
      ['fx', 'hearts', 'a'], ['fx', 'hearts', 'b'], ['hop', 'a'], ['hop', 'b'], ['say', 'a', 'joyous', 'She said YES!!', 'heart'], ['wait', 1], ['mode', 'b', 'follow', 'a'], ['end']] },
    concert: { actors: [['j', 39, 0, -10], ['l1', 172, -60, 30], ['l2', 35, 60, 30]], steps: [
      ['say', 'j', 'happy', 'Jiggly~ Puff~ Jigglyyy~ ♪', 'note'], ['fx', 'notes', 'j'], ['wait', 1.4], ['sleep', 'l1', true], ['wait', 0.6], ['sleep', 'l2', true], ['fx', 'notes', 'j'], ['wait', 1.5],
      ['say', 'j', 'angry', '...They fell ASLEEP?! AGAIN?!', 'anger'], ['move', 'j', 'l1'], ['fx', 'scribble', 'l1'], ['move', 'j', 'l2'], ['fx', 'scribble', 'l2'],
      ['say', 'j', 'sigh', 'Hmph. Let\'s see them laugh at THAT when they wake up.', 'dots'], ['wait', 1], ['end']] },
    snack: { actors: [['s', 143, 30, 0], ['m', 446, -110, 10]], steps: [
      ['sleep', 's', true], ['fx', 'berry', 's'], ['wait', 1], ['say', 'm', 'happy', 'Shhh... just one little berry...', 'note'], ['move', 'm', [0, 12], 0.6], ['wait', 0.6], ['sleep', 's', false],
      ['say', 's', 'stunned', '...hm? ...Who\'s eating my snack?', 'exclaim'], ['emote', 'm', 'sweat'], ['say', 'm', 'worried', 'N-nobody! It was the wind!', 'sweat'], ['mode', 'm', 'leave'], ['wait', 1.2],
      ['say', 's', 'sigh', '...zzz...', 'dots'], ['sleep', 's', true], ['end']] },
    dream: { actors: [['c', 10, -30, 10], ['b', 12, 40, -10]], steps: [
      ['say', 'c', 'inspired', 'Butterfree... will I really fly like you one day?', 'spark'], ['say', 'b', 'happy', 'Of course, little one. Every wing starts as a dream.', 'heart'],
      ['hop', 'c'], ['say', 'c', 'joyous', 'Then I\'ll eat ALL the leaves and grow super fast!', 'note'], ['fx', 'hearts', 'b'], ['end']] },
    training: { actors: [['m', 66, 0, 0], ['m2', 66, 50, 10]], steps: [
      ['hop', 'm'], ['say', 'm', 'determined', '98... 99... ONE HUNDRED!', 'spark'], ['hop', 'm2'], ['say', 'm2', 'shouting', 'Pfft. I did TWO hundred!', 'anger'],
      ['say', 'm', 'angry', 'Then I\'ll do THREE hundred!', 'anger'], ['hop', 'm'], ['hop', 'm2'], ['say', 'm2', 'joyous', 'Muscles never sleep!!', 'spark'], ['end']] },
    headache: { actors: [['p', 54, -30, 0], ['s', 79, 40, 4]], steps: [
      ['emote', 'p', 'question'], ['say', 'p', 'worried', 'Psy...? My head hurts... again...', 'sweat'], ['wait', 0.8], ['say', 's', 'normal', '...................', 'dots'], ['wait', 2.2],
      ['say', 's', 'surprised', '...oh. Hi.', 'question'], ['say', 'p', 'dizzy', 'That took you a whole minute...', 'sweat'], ['end']] },
    tree: { actors: [['w', 185, 0, 0], ['b', 438, -50, 12]], steps: [
      ['say', 'w', 'determined', 'Shh! I\'m a tree. Totally a tree. Nothing to see here.', 'dots'], ['hop', 'b'], ['say', 'b', 'happy', 'Me too! Me too! I\'m a tree!', 'note'], ['emote', 'w', 'anger'],
      ['say', 'w', 'angry', 'Trees don\'t TALK!', 'anger'], ['say', 'b', 'sad', '...You\'re talking.', 'dots'], ['wait', 0.8], ['say', 'w', 'stunned', '..........', 'sweat'], ['end']] },
    berry: { actors: [['a', 25, -40, 0, { g: 'm' }], ['b', 25, 40, 0, { g: 'f' }]], steps: [
      ['move', 'a', [-12, 0]], ['say', 'a', 'happy', 'I found an Oran Berry! ...Want half?', 'heart'], ['say', 'b', 'joyous', 'You\'re the BEST!', 'heart'], ['fx', 'hearts', 'a'], ['fx', 'hearts', 'b'], ['hop', 'b'], ['mode', 'a', 'follow', 'b'], ['end']] },
    tag: { actors: [['e', 133, -30, 0], ['t', 175, 30, 0]], steps: [
      ['say', 'e', 'joyous', 'Tag! You\'re it!', 'note'], ['move', 'e', [-90, -20], 1], ['say', 't', 'happy', 'Toge-toge-priiii!', 'note'], ['move', 't', 'e', 1], ['hop', 'e'], ['move', 'e', [60, 40], 1],
      ['move', 't', 'e', 1], ['say', 'e', 'joyous', 'Hehe! Can\'t catch me!', 'note'], ['move', 'e', [-20, 70], 1], ['move', 't', 'e', 1], ['say', 't', 'happy', 'Got youuu!', 'heart'], ['hop', 't'], ['end']] },
    thief: { actors: [['r', 19, -40, 0], ['m', 52, 30, 0]], steps: [
      ['fx', 'coin', 'r'], ['wait', 0.8], ['move', 'm', 'r'], ['fx', 'grab', 'm'], ['say', 'r', 'angry', 'HEY! That\'s my Gold Ball!', 'anger'], ['say', 'm', 'joyous', 'Finders keepers, nya~!', 'note'],
      ['mode', 'm', 'leave'], ['wait', 0.5], ['say', 'r', 'shouting', 'Get back here, you thief!!', 'anger'], ['mode', 'r', 'leave'], ['end']] },
    dance: { actors: [['s', 327, 0, 0]], steps: [
      ['say', 's', 'happy', 'Left, right... spin, spin...', 'note'], ['hop', 's'], ['move', 's', [30, 10]], ['move', 's', [-20, 20]], ['move', 's', [0, 0]], ['say', 's', 'dizzy', 'Whoaaa... the world is spinning... wait, it\'s always spinning...', 'question'], ['end']] },
    family: { actors: [['k', 194, -20, 10], ['q', 195, 30, 0]], steps: [
      ['say', 'k', 'happy', 'Papa! Papa! Look, I can swim backwards!', 'note'], ['hop', 'k'], ['say', 'q', 'happy', '...That\'s amazing, kiddo.', 'heart'], ['wait', 0.8], ['say', 'q', 'normal', '...', 'dots'], ['say', 'k', 'joyous', 'Papa, you\'re making the face again!', 'note'], ['fx', 'hearts', 'q'], ['end']] } };
  let scene = null, sceneT = rnd(...CFG.sceneFirst);
  function startScene(name, p) {
    const def = SCENES[name]; if (!def || !p || !solo() || area() !== 'field') return false;
    for (let tries = 0; tries < 24; tries++) {
      const a = Math.random() * TAU, d = rnd(240, 340), cx = p.x + Math.cos(a) * d, cy = p.y + Math.sin(a) * d * 0.6;
      if (!def.actors.every(([, , dx, dy]) => free(cx + dx, cy + dy, 14))) continue;
      if (E().EnemyMgr.all().some(e => e && !e.dead && !harmless(e) && Math.hypot(e.x - cx, e.y - cy) < 150)) continue;
      const actors = {}; for (const [id, dex, dx, dy, o] of def.actors) { const e = spawnWild(dex, cx + dx, cy + dy, Object.assign({ role: 'scene' }, o || {})); if (!e) return false; actors[id] = e; }
      scene = { name, def, actors, i: 0, wait: 0.6, cx, cy, until: null, t: 0 }; return true; }
    return false;
  }
  function runStep(sc, st) {
    const A = sc.actors, w = A[st[1]], at = v => typeof v === 'string' ? { x: A[v].x + (A[v].x > w.x ? -26 : 26), y: A[v].y + 2 } : { x: sc.cx + v[0], y: sc.cy + v[1] };
    switch (st[0]) {
      case 'say': say(w, 'wild', st[2], st[3], st[4], { prio: true }); sc.wait = st[3].length / 45 + 1.3; break;
      case 'emote': emo(w, st[2]); sc.wait = 0.5; break;
      case 'move': { const g = at(st[2]); w.__goal = g; w.__spdMul = st[3] || 0.6; sc.until = () => near(w, g, 14); sc.wait = 5; break; }
      case 'wait': sc.wait = st[1]; break;
      case 'hop': w.__hopN = 2; w.__hopT = 0; fx.push({ kind: 'ring', x: w.x, y: w.y, t: 0, life: 0.5, r: 1 }); sc.wait = 0.3; break;
      case 'sleep': w.__sleep = !!st[2]; if (!st[2]) emo(w, 'exclaim'); sc.wait = 0.3; break;
      case 'fx': { const v = A[st[2]], k = st[1], H = v.bodyH || 40;
        if (k === 'hearts') for (let i = 0; i < 6; i++) fx.push({ kind: 'heart', x: v.x + rnd(-10, 10), y: v.y - H, vx: rnd(-20, 20), vy: rnd(-50, -30), t: -i * 0.12, life: 1.4 });
        else if (k === 'notes') for (let i = 0; i < 8; i++) fx.push({ kind: 'note', x: v.x + rnd(-8, 8), y: v.y - H, vx: rnd(-30, 30), vy: rnd(-40, -25), t: -i * 0.2, life: 1.8 });
        else if (k === 'ring') fx.push({ kind: 'gem', x: v.x + 14, y: v.y - H * 0.6, t: 0, life: 2.6 });
        else if (k === 'scribble') { fx.push({ kind: 'scribble', obj: v, t: 0, life: 99 }); emo(sc.actors.j || v, 'anger'); }
        else if (k === 'berry') fx.push({ kind: 'berry', obj: v, t: 0, life: 6 });
        else if (k === 'coin') fx.push({ kind: 'coin', obj: v, t: 0, life: 99 });
        else if (k === 'grab') { for (const f of fx) if (f.kind === 'coin') f.obj = v; }
        sc.wait = 0.4; break; }
      case 'mode': if (st[2] === 'follow') { w.__role = 'idle'; w.__act = { kind: 'follow', mate: A[st[3]], t: 0, dur: 999 }; } else if (st[2] === 'leave') { w.__role = 'idle'; w.__act = { kind: 'leave', t: 0, dur: 999 }; } sc.wait = 0.2; break;
      case 'end': endScene(); break;
    }
  }
  function endScene() { if (!scene) return; if (scene.i >= scene.def.steps.length - 1 && Object.values(scene.actors).every(a => !a.dead)) emit('scene', { name: scene.name }); for (const id in scene.actors) { const c = scene.actors[id]; if (!c.dead && c.__role === 'scene') { c.__role = 'idle'; c.__home = { x: c.x, y: c.y }; c.__met = true; c.__sleep = false; } } scene = null; sceneT = rnd(...CFG.sceneEvery); }
  function abortScene() { endScene(); }
  function updateScene(dt, p) {
    if (!scene) { sceneT -= dt; if (sceneT <= 0) { sceneT = 8; startScene(pick(Object.keys(SCENES)), p); } return; }
    const sc = scene; sc.t += dt;
    if (Object.values(sc.actors).some(a => a.dead) || Math.hypot(sc.cx - p.x, sc.cy - p.y) > 900 || sc.t > 70) { endScene(); return; }
    for (const a of Object.values(sc.actors)) if (a.__sleep && Math.random() < dt * 1.6) fx.push({ kind: 'z', x: a.x + 8, y: a.y - (a.bodyH || 40) - 4, vx: rnd(6, 14), vy: -18, t: 0, life: 1.6 });
    if (sc.until) { if (sc.until() || (sc.wait -= dt) <= 0) { sc.until = null; sc.wait = 0.15; for (const a of Object.values(sc.actors)) if (near(a, a.__goal || a, 14)) a.__goal = null; } return; }
    if ((sc.wait -= dt) > 0) return;
    const st = sc.def.steps[sc.i++]; if (!st) { endScene(); return; } runStep(sc, st);
  }

  // ================= hostile Pokemon: grudges, changes of heart, chatter =================
  const feuds = [];
  function meet(e, p) {
    seen.add(e); live.add(e); const legendary = e.legend || e.arceus || ((E().DEX_BY[Number(e.dex)] || {}).rarity >= 5); if (!e.__g && !legendary) e.__g = Math.random() < 0.5 ? 'm' : 'f'; e.__area = area();   // legendaries: no gender
    if (special(e) || !solo() || e.__area !== 'field') return;   // the harmless, grudges and changes of heart only live out in the open field
    const r = Math.random(), calm = !e.psAi || e.psAi === 'aggressive' || e.psAi === 'passive' || e.psAi === 'skittish';
    if (r < CFG.idle && !UNSAFE.test(e.behavior || '')) setRole(e, 'idle');
    else if (r < CFG.idle + CFG.grudge && calm) e.__wantFeud = clock() + 12;
    else if (r < CFG.idle + CFG.grudge + CFG.turn && calm) e.__turnAt = clock() + rnd(4, 12);
  }
  function startFeud(a, b, opener) {
    const same = Number(a.dex) === Number(b.dex); if (a.__feud || b.__feud || a.__turning || b.__turning) return;
    feuds.push({ a, b, t: CFG.feudTime, bFights: Math.random() < 0.75 }); emit('feud', { a, b }); a.__feud = b; b.__feud = a; a.__wantFeud = 0;
    speak(a, 'foe', opener || (same && Math.random() < 0.7 ? 'grudgeSame' : 'grudge'), { prio: true, other: b }); speak(b, 'foe', 'grudgeReply', { prio: true, delay: 0.3, other: a });
    emo(a, 'anger'); setTimeout(() => emo(b, 'anger'), 500);
  }
  function endFeud(f, why) {
    feuds.splice(feuds.indexOf(f), 1); const { a, b } = f; a.__feud = null; b.__feud = null;
    const w = !a.dead ? (!b.dead ? null : a) : (!b.dead ? b : null);
    if (why === 'time' && w == null && !a.dead && !b.dead) { speak(a, 'foe', 'truce'); return; }
    const P = E().Game.player; if (w && !w.gone && why === 'ko' && P && dist(w, P) < 320 && Math.random() < 0.35 && startTurn(w, 'saved')) return;
    if (w && !w.gone) { if (Math.random() < 0.3 && solo()) { speak(w, 'wild', 'home', { prio: true }); setRole(w, 'idle', { kind: 'leave', t: 0, dur: 999 }); } else speak(w, 'foe', 'win', { prio: true }); }
  }
  function updateFeuds(dt, foes) {
    for (const f of feuds.slice()) { f.t -= dt; const { a, b } = f;
      if (a.dead || b.dead || a.gone || b.gone) { endFeud(f, 'ko'); continue; } if (f.t <= 0) { endFeud(f, 'time'); continue; }
      for (const [x, y, fights] of [[a, b, true], [b, a, f.bFights]]) { if (!fights) continue; x.__fhit = (x.__fhit || 0) - dt;
        if (dist(x, y) < (x.r || 12) + (y.r || 12) + 10 && x.__fhit <= 0) { x.__fhit = 0.75; let d = 8; try { d = typeof x.dmg === 'function' ? x.dmg() : (x._dmg || 8); } catch (_) {}
          try { y.hurt(Math.max(4, d * 2), '#ff7a3a', y.x - x.x, y.y - x.y, 60); } catch (_) {} if (Math.random() < 0.3) emo(x, 'anger'); } }
      for (const o of foes) if (harmless(o) && !o.__cheered && dist(o, a) < 220) { o.__cheered = true; if (Math.random() < 0.4) { bubble(o, vb(o, 'cheer')); emo(o, 'note'); } else { emo(o, 'sweat'); o.__fleeT = 2; o.__fleeFrom = a; } } }
  }
  // a change of heart, for a reason: 'heart' (fed up with its pack), 'beg' (badly hurt), 'kin' (same species as you), 'awe' (your kill streak),
  // 'freed' (its boss fell), 'convinced' (one of your allies talked it over), 'saved' (you won its fight for it), 'friendly' (its own side hit it)
  function startTurn(e, reason, ctx) { if (!e || e.__feud || e.__turning || e.dead || harmless(e) || special(e) || allies.length >= CFG.maxAllies || !solo()) return false; reason = reason || 'heart';
    const quick = reason === 'friendly' || reason === 'saved'; e.__turning = { t: quick ? 2.4 : 0, said: 0, beg: reason === 'beg', reason }; e.__turnAt = 0;
    speak(e, 'foe', reason === 'beg' ? 'beg' : reason === 'friendly' ? 'defect' : reason === 'saved' ? 'saved' : 'turn1', Object.assign({ prio: true, reason }, ctx || {})); emo(e, reason === 'beg' ? 'tear' : quick ? 'anger' : 'question'); return true; }
  function updateTurns(dt) {
    for (const e of live) { const tn = e.__turning; if (!tn) continue; if (e.dead) { e.__turning = null; continue; } tn.t += dt;
      if (tn.said === 0 && tn.t > 2.4) { tn.said = 1; if (!tn.beg) speak(e, 'ally', 'turn2', { prio: true }); emo(e, 'exclaim'); }
      if (tn.t > 4.2) { e.__turning = null; toAlly(e, tn.reason); } }
  }
  // ---- accidents between enemies: a stray shot or a shove — the victim lashes out at the attacker... or quits and joins you
  let bumpT = 0;
  function accidents(dt, p, foes) {
    if (!solo() || area() !== 'field') return; const N = E(), hostile = foes.filter(e => !harmless(e) && !special(e) && !e.__turning && dist(e, p) < 520);
    try { for (const q of N.Projectiles.all()) { if (!q || q.friendly || q.ghost) continue; const seenQ = q.__ff || (q.__ff = new Set());
      for (const v of hostile) { if (seenQ.has(v) || Math.hypot(q.x - v.x, q.y - (v.y - 10)) > (v.r || 12) + (q.r || 4)) continue; seenQ.add(v); if (Math.random() > 0.06) continue;
        const vx = Number(q.vx) || 0, vy = Number(q.vy) || 0, m = Math.hypot(vx, vy) || 1;   // who fired it: the one behind the shot
        const shooter = hostile.filter(o => o !== v).map(o => ({ o, s: ((o.x - q.x) * -vx + (o.y - q.y) * -vy) / m / Math.max(1, dist(o, q)) })).filter(c => c.s > 0.8).sort((x, y) => dist(x.o, q) - dist(y.o, q))[0]?.o;
        if (!shooter) continue; try { v.hurt(Math.max(3, q.dmg || 6), '#ff9a6a', vx, vy, 40); } catch (_) {} emo(v, 'anger');
        if (Math.random() < 0.4 && allies.length < CFG.maxAllies) startTurn(v, 'friendly', { other: shooter }); else startFeud(v, shooter, 'friendlyFire'); } } } catch (_) {}
    if ((bumpT -= dt) > 0) return; bumpT = 0.5;
    for (const a of hostile) for (const b of hostile) { if (a === b || a.__feud || b.__feud || dist(a, b) > ((a.r || 12) + (b.r || 12)) * 0.6) continue; if (Math.random() < 0.004) { startFeud(a, b, 'bump'); return; } }
  }
  const streak = [];
  function recruitOnKill(e, p, foes) {   // a hostile one went down: awe at your streak, or freedom when the boss falls
    const now = clock(); streak.push(now); while (streak.length && now - streak[0] > 10) streak.shift();
    const pickNear = r => foes.filter(o => !o.dead && !harmless(o) && !special(o) && !o.__turning && dist(o, p) < r);
    if (streak.length >= 15 && now > (recruitOnKill.aweCd || 0)) { recruitOnKill.aweCd = now + 30; const o = pickNear(260).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0]; if (o && Math.random() < 0.4) startTurn(o, 'awe'); }
    if (e.boss || e.legend) for (const o of pickNear(450)) if (Math.random() < 0.25) startTurn(o, 'freed');
  }
  // legendaries and bosses: their own grand voice (js/wild-voice.js), at every turn of the fight
  function legendSays(e, sit, o) { const v = V(); if (!v) return false; const l = v.legendLine(e, sit, o || {}); return say(e, 'legend', l[0], l[1], l[2], Object.assign({ prio: true }, o || {}, { name: label(e) + ' · ' + v.title(e) })); }
  function companionName(p) { if (window.PS_LAKE?.allies?.some(a => !a.dead)) return 'the Lake Guardians'; if (allies.some(a => !a.dead)) return allies.find(a => !a.dead).name; return null; }
  let legendLowCd = 0;
  function legendTick(dt, p, foes) {
    legendLowCd -= dt;
    for (const e of foes) { if (harmless(e) || !(V() && V().isLegend(e)) || !e.__wl || !e.__wl.spot) continue; const st = e.__wl, f = e.hp / e.maxHp;
      for (const [k, at] of [['hp75', 0.75], ['hp50', 0.5], ['hp25', 0.25]]) if (!st[k] && f < at) { st[k] = true; legendSays(e, k); break; }
      if (!st.comp && (st.compT = (st.compT || 0) + dt) > 7) { st.comp = true; const c = companionName(p); if (c && Math.random() < 0.6) legendSays(e, 'companion', { comp: c }); }
      if (p.hp < p.maxHp * 0.25 && legendLowCd <= 0 && dist(e, p) < 520) { legendLowCd = 25; legendSays(e, 'playerLow'); } }
  }
  let chatCd = 0, lowCd = 0;
  function chatter(dt, p, foes) {
    chatCd -= dt; lowCd -= dt;
    if (p.hp < p.maxHp * 0.25 && lowCd <= 0) { const h = foes.find(e => !harmless(e) && !special(e) && dist(e, p) < 260); if (h) { lowCd = 30; speak(h, 'foe', 'playerLow'); } }
    for (const e of foes) {
      const st = e.__wl || (e.__wl = { spot: false, low: false });
      if (harmless(e)) { if (!e.__met && dist(e, p) < 150) { e.__met = true; if (Math.random() < 0.35 && chatCd <= 0) { chatCd = 5; (speak(e, 'wild', 'meetPlayer') && emit('meet', { e })); } else emo(e, 'question'); } continue; }
      if (!st.spot && dist(e, p) < (V() && V().isLegend(e) ? 460 : 230)) { st.spot = true;
        if (V() && V().isLegend(e)) { legendSays(e, 'intro', { prio: true }); emit('legend', { e }); }
        else if (Number(e.dex) === Number(p.dex) && Math.random() < 0.25 && startTurn(e, 'kin')) {}
        else if ((e.behavior === 'thief' || e.golden) && Math.random() < 0.4) speak(e, 'foe', 'thief');
        else if (Math.random() < CFG.taunt && chatCd <= 0) { chatCd = 6; (speak(e, 'foe', 'spotPlayer') && emit('taunt', { e })); }
        else if (Math.random() < CFG.spotEmote) emo(e, pick(['exclaim', 'exclaim', 'anger'])); }
      if (!st.low && e.hp < e.maxHp * 0.3 && !e.boss) { st.low = true;
        if (solo() && !e.__turning && !special(e) && allies.length < CFG.maxAllies && Math.random() < CFG.lowTurn && dist(e, p) < 320) startTurn(e, 'beg');
        else if (Math.random() < 0.08 && chatCd <= 0) { chatCd = 6; speak(e, 'foe', 'lowHp'); } else if (Math.random() < 0.35) emo(e, 'sweat'); }
    }
  }
  // everyone reacts: deaths, bosses, shinies, your level-ups
  let lvl0 = 0;
  function reactions(p, foes) {
    for (const e of [...live]) { if (!e.dead) continue; live.delete(e); if (e.gone) continue;
      if (e.__role) { onHarmlessDeath(e, p); emit('killHarmless', { e }); if (V()) V().run.harmless++; continue; } if (V()) V().run.kills++; emit('kill', { e }); recruitOnKill(e, p, foes);
      if (V() && V().isLegend(e) && e.__wl && e.__wl.spot && here(e)) { legendSays(e, 'defeat'); emit('legendDown', { e }); }
      for (const o of foes) if (harmless(o) && dist(o, e) < 180) { emo(o, 'sweat'); if (Math.random() < 0.4) { o.__fleeT = 3; o.__fleeFrom = e; if (Math.random() < 0.3) bubble(o, vb(o, 'scared'), 1.4); } }
      if (dist(e, p) < 500 && Math.random() < 0.05 && chatCd <= 0) { const pal = foes.find(o => o !== e && !harmless(o) && Number(o.dex) === Number(e.dex) && dist(o, e) < 220); if (pal) { chatCd = 6; speak(pal, 'foe', 'avenge'); } } }
    for (const o of foes) { if (!harmless(o)) continue;
      if (o.__hp0 != null && o.hp < o.__hp0 - 0.01) onHarmlessHit(o, p, foes); o.__hp0 = o.hp;
      const big = foes.find(b => (b.boss || b.legend) && dist(b, o) < 350); if (big && o.__bossFled !== big) { o.__bossFled = big; o.__fleeT = 5; o.__fleeFrom = big; emo(o, 'sweat'); if (Math.random() < 0.4) bubble(o, vb(o, 'bossFlee')); }
      if (!o.__shinySeen) { const sh = foes.find(b => b !== o && b.shiny && dist(b, o) < 220); if (sh) { o.__shinySeen = true; emit('shiny', { e: sh }); if (Math.random() < 0.3) { emo(o, 'heart'); bubble(o, vb(o, 'shiny')); } } } }
    const lv = Number(p.level) || 1; if (lv > lvl0) { if (lvl0) for (const o of foes) if (harmless(o) && dist(o, p) < 250) { emo(o, pick(['exclaim', 'spark'])); if (Math.random() < 0.2) bubble(o, vb(o, 'lvl'), 1.6); } lvl0 = lv; }
  }

  // ================= the big moments: Giratina's Void, the Creation Rift=================
  // the battle is frozen during these, so this runs on its own clock: some Pokemon TRY to run, the rest cower
  let panicKind = null, panicT = 0;
  function eventKind() { if (window.PS_GIRATINA?.active) return 'giratina'; if (window.PS_CREATION_RIFT?.active) return 'rift'; return null; }
  function panicTick(dt) {
    const N = E(), p = N?.Game?.player; if (!p) return; const k = eventKind();
    if (k !== panicKind) { if (panicKind && !k && V()) { const L = N.EnemyMgr.all().find(e => e && !e.dead && V().isLegend(e) && here(e)); if (L) setTimeout(() => legendSays(L, 'event'), 1200); }
      if (panicKind && !k) for (const e of N.EnemyMgr.all()) if (e && !e.dead && e.__panic) { if (harmless(e)) { e.__fleeT = 5; e.__fleeFrom = p; } e.__panic = null; }
      panicKind = k; panicT = 0; if (k && V()) V().run[k] = true;
      if (k) { const L = N.EnemyMgr.all().filter(e => e && !e.dead && !e.boss && !e.legend && !e.arceus && dist(e, p) < 750); let shouts = 0;
        for (const e of L) {
          const run = Math.random() < 0.55; e.__panic = { run, ang: Math.atan2(e.y - p.y, e.x - p.x) + rnd(-0.5, 0.5), v: rnd(40, 75), t: 0, stuck: false };
          setTimeout(() => emo(e, run ? 'exclaim' : 'sweat'), rnd(0, 600)); if (shouts < 3 && Math.random() < 0.35) { shouts++; bubble(e, vb(e, k), 2.6); } } } }
    if (!k) return; panicT += dt;
    for (const e of N.EnemyMgr.all()) { const pn = e && !e.dead && e.__panic; if (!pn) continue; pn.t += dt;
      if (pn.run && !pn.stuck) { const sp = pn.v * Math.max(0.15, 1 - pn.t / 6), nx = e.x + Math.cos(pn.ang) * sp * dt, ny = e.y + Math.sin(pn.ang) * sp * dt;   // they run... but never far enough
        if (free(nx, ny, e.r || 12)) { e.x = nx; e.y = ny; } else pn.ang += rnd(-1.5, 1.5);
        try { e.anim.loop('Walk'); e.anim.dir = N.Sprites.dirFromAngle(pn.ang); e.anim.update(dt); } catch (_) {}
        if (pn.t > 4 && !pn.stuck && Math.random() < dt * 0.3) { pn.stuck = true; emo(e, 'tear'); if (Math.random() < 0.4) bubble(e, vb(e, 'stuck'), 2); } }
      else { const j = Math.sin(pn.t * 40) * 0.8; e.x += j - (pn.j || 0); pn.j = j; if (Math.random() < dt * 0.25) emo(e, pick(['sweat', 'tear'])); } }
  }

  // ================= Pokemon talking to each other =================
  // two harmless Pokemon near each other stop and chat (a sweetheart, a rival type, small talk...); hostile ones banter on the march
  let convo = null, convoCd = rnd(4, 8);
  function startConvo(a, b, p, hostile) {
    if (!CFG.wildTalk) return;
    const v = V(); if (!v) return; const c = v.chat(a, b, { hostile }); if (!c || !c.lines.length) return;
    const now = clock(); a.__chatAt = b.__chatAt = now + rnd(25, 40);
    convo = { a, b, lines: c.lines, outcome: c.outcome, i: 0, wait: 0.2, hostile, box: dist(a, p) < 260 && !(T() && T().busy && T().busy()) };
    if (!hostile) { a.__chat = b.__chat = true; }
  }
  function finishConvo(c) {
    convo = null; convoCd = rnd(5, 10); c.a.__chat = c.b.__chat = false; const { a, b } = c; if (a.dead || b.dead) return;
    if (c.outcome === 'love') { for (const w of [a, b]) for (let i = 0; i < 5; i++) fx.push({ kind: 'heart', x: w.x + rnd(-10, 10), y: w.y - (w.bodyH || 40), vx: rnd(-20, 20), vy: rnd(-50, -30), t: -i * 0.12, life: 1.4 });
      if (harmless(a) && harmless(b)) b.__act = { kind: 'follow', mate: a, t: 0, dur: 999 }; }
    else if (c.outcome === 'reject' && harmless(a)) a.__act = { kind: 'cry', t: 0, dur: 4 };
    else if (c.outcome === 'fight') { emo(a, 'anger'); emo(b, 'anger');
      if (harmless(a) && harmless(b)) { a.__act = { kind: 'play', mate: b, t: 0, dur: 6, angry: true, said: true }; b.__act = { kind: 'play', mate: a, t: 0, dur: 6, angry: true, said: true }; }
      else if (!harmless(a) && !harmless(b) && solo() && !a.__feud && !b.__feud) startFeud(a, b); }
  }
  function convoTick(dt, p, foes) {
    const now = clock();
    if (convo) { const c = convo; if (c.a.dead || c.b.dead || c.a.gone || c.b.gone || c.a.__fleeT > 0 || c.b.__fleeT > 0) { finishConvo(c); return; }
      if ((c.wait -= dt) > 0) return; const ln = c.lines[c.i++]; if (!ln) { finishConvo(c); return; }
      const [w, face, text, em] = ln, kind = harmless(w) ? 'wild' : 'foe';
      if (c.box) say(w, kind, face, text, em, { follow: true }); else { bubble(w, text, Math.max(2, text.length / 28 + 1.2)); emo(w, em); }
      c.wait = text.length / 40 + 1.2; return; }
    if ((convoCd -= dt) > 0) return; convoCd = 1.5;
    const ok = e => !e.__chatAt || e.__chatAt < now, H = foes.filter(e => harmless(e) && e.__role === 'idle' && !(e.__fleeT > 0) && ok(e) && dist(e, p) < 520);
    let best = null; for (const a of H) for (const b of H) { if (a === b || dist(a, b) > 140) continue; const sc = (V() && V().relation(a, b) === 'mate' ? 2 : 1) + Math.random(); if (!best || sc > best.sc) best = { a, b, sc }; }
    if (best && area() === 'field') { startConvo(best.a, best.b, p, false); return; }
    if (Math.random() < 0.25) { const F = foes.filter(e => !harmless(e) && !special(e) && !e.__feud && !e.__turning && ok(e) && dist(e, p) > 260 && dist(e, p) < 620);
      for (const a of F) { const b = F.find(o => o !== a && dist(o, a) < 110); if (b) { startConvo(a, b, p, true); return; } } }
  }

  // ================= allies =================
  // An enemy that switched sides fights for you like a real summon (the Lake sisters, Hoopa's summons): it casts real moves of
  // its own type through the game's combat (levelled with you), picks smart targets (whatever is on you, your own target, the
  // weakened, the ones its type beats), keeps the right range for its move, sidesteps shots, gets out of crowds when hurt,
  // regroups when you run off, finds its way around obstacles and never walks into walls.
  const allies = [];
  const TYPE_COL = { normal: '#e8e0c8', fire: '#ff7a2a', water: '#4aa8ff', grass: '#6ad05a', electric: '#ffe04a', ice: '#9ae8ff', fighting: '#d0503a', poison: '#b05ad0', ground: '#d0a860', flying: '#a8c0ff', psychic: '#ff6ab0', bug: '#a8c83a', rock: '#b8a058', ghost: '#7a6ab0', dragon: '#7a5aff', dark: '#6a5848', steel: '#b8b8d0', fairy: '#ffa8d8' };
  const KINDS = ['projectile', 'beam', 'cone', 'melee', 'dash', 'chain', 'nova', 'meteor', 'boomerang'];
  const SHARE = ['atkMul', 'atkPerm', 'spdMul', 'spdPerm', 'cdMul', 'cdPerm', 'critChance', 'critPerm', 'buffs', 'powers', 'level', 'xpMul', 'coinMul', 'atkItemK'];
  function movesFor(a, p) {   // two real moves of its own type(s), levelled with you
    const M = E().Moves, types = (V() && V().who(a).types) || [a.type || 'normal'], ok = m => m && !m.psCast && KINDS.includes(m.kind) && !m.simon && (m.maxLvl || 1) > 1;
    let L = M.ALL.filter(m => ok(m) && types.includes(String(m.type).toLowerCase()));
    if (L.length < 2) L = L.concat(M.ALL.filter(m => ok(m) && String(m.type).toLowerCase() === 'normal'));
    L = L.sort(() => Math.random() - 0.5).slice(0, 2); if (!L.length && M.BY_ID.tackle) L = [M.BY_ID.tackle];
    return L.map(m => { const lv = Math.max(1, Math.min(m.maxLvl || 5, 1 + Math.floor((Number(p.level) || 1) / 6))); try { return M.instance(m.id, lv); } catch (_) { return m; } });
  }
  function makeCaster(a, p) {
    const N = E(), c = new N.Player(N.DEX_BY[a.dex], {}, a.shiny); a.caster = c; c.psWildAlly = a;
    for (const k of ['x', 'y', 'r', 'bodyH', 'anim', 'dead', 'hp', 'maxHp', 'aim', 'target']) Object.defineProperty(c, k, { configurable: true, get: () => a[k], set: v => { a[k] = v; } });
    for (const k of SHARE) Object.defineProperty(c, k, { configurable: true, get: () => p[k], set: () => {} });
    Object.defineProperty(c, 'baseAtk', { configurable: true, get: () => (Number(p.baseAtk) || 1) * 0.65 });
    Object.defineProperty(c, 'baseSpd', { configurable: true, get: () => Number(p.baseSpd) || 100 });
    Object.defineProperty(c, 'floating', { configurable: true, get: () => false });
    c.hurt = n => allyHurt(a, n); c.ultCd = Infinity; c.ultT = 0;
  }
  function toAlly(e, why) {
    const N = E(), p = N.Game.player; if (!p || allies.length >= CFG.maxAllies) { setRole(e, 'idle', { kind: 'leave', t: 0, dur: 999 }); return; }
    let anim = null; try { anim = new N.Sprites.Animator(Number(e.dex), 1, !!e.shiny); } catch (_) {}
    const a = { kind: 'ally', dex: Number(e.dex), name: e.name, g: e.__g, shiny: !!e.shiny, x: e.x, y: e.y, r: e.r || 12, bodyH: e.bodyH || 40, anim, maxHp: Math.max(60, Math.round((Number(p.maxHp) || 100) * 0.6)), hurtCd: 0,
      type: e.atkType || 'normal', slot: allies.length, idleT: rnd(40, 70), lowSaid: false, dead: false, t: 0, lift: 0, next: rnd(0.3, 0.8), mi: 0, okX: e.x, okY: e.y, path: [], recruitT: rnd(12, 20), dodgeT: 0 };
    a.__voice = e.__voice; a.__g = e.__g; a.hp = a.maxHp;
    try { makeCaster(a, p); a.moves = movesFor(a, p); } catch (err) { console.warn('[wild]', err); a.moves = []; }
    removeEnemy(e); allies.push(a); emit('allyJoin', { e: a, why });
    txt(a.x, a.y - 50, label(a) + ' joined your team!', '#9ad8ff'); sfx('shiny'); emo(a, 'heart');
    for (let i = 0; i < 6; i++) fx.push({ kind: 'heart', x: a.x + rnd(-10, 10), y: a.y - a.bodyH, vx: rnd(-20, 20), vy: rnd(-50, -30), t: -i * 0.1, life: 1.3 });
    for (const o of N.EnemyMgr.all()) if (o && !o.dead && dist(o, a) < 260) { if (harmless(o)) emo(o, 'question'); else if (Math.random() < 0.35) { emo(o, 'anger'); bubble(o, V() ? V().line(o, 'traitor')[1] : 'TRAITOR!', 1.6); } }
  }
  function allyHurt(a, n) { if (a.dead || a.hurtCd > 0 || !(n > 0) || (Number(a.caster && a.caster.invuln) || 0) > 0) return; a.hurtCd = 0.45; a.hp -= n; a.flash = 0.15;
    if (!a.lowSaid && a.hp < a.maxHp * 0.35 && a.hp > 0) { a.lowSaid = true; speak(a, 'ally', 'allyLow'); }
    if (a.hp <= 0) { a.hp = 0; a.dead = true; a.leaveT = 0; speak(a, 'ally', 'allyFaint', { prio: true }); emit('allyFaint', { e: a }); txt(a.x, a.y - 44, a.name + ' fainted...', '#9ad8ff'); } }
  function stepTo(w, gx, gy, sp, dt) {
    const dx = gx - w.x, dy = gy - w.y, d = Math.hypot(dx, dy); if (d < 4) return true; const st = Math.min(d, sp * dt), nx = w.x + dx / d * st, ny = w.y + dy / d * st;
    if (free(nx, ny, w.r)) { w.x = nx; w.y = ny; } else if (free(nx, w.y, w.r)) w.x = nx; else if (free(w.x, ny, w.r)) w.y = ny; else return true;
    w.moved = true; w.dir = Math.atan2(dy, dx); return false;
  }
  const beats = (a, e) => { try { return E().Types.mult(a.type, e.types || ['normal']) > 1; } catch (_) { return false; } };
  function pickTarget(a, p, enemies) {
    let best = null, bs = Infinity;
    for (const e of enemies) { const dp = dist(e, p); if (dp > 340) continue;
      const sc = dist(e, a) - (dp < 140 ? 220 : 0) - (e === p.target ? 120 : 0) - (1 - e.hp / Math.max(1, e.maxHp)) * 90 - (beats(a, e) ? 70 : 0);
      if (sc < bs) { bs = sc; best = e; } }
    return best;
  }
  function updateAllies(dt, p, foes) {
    const k = K(), N = E(), H = window.PS_HOOPA, enemies = foes.filter(e => !e.gone && !harmless(e) && !e.__turning);
    for (let i = allies.length - 1; i >= 0; i--) { const a = allies[i]; a.t += dt; a.moved = false; a.hurtCd -= dt; a.flash = Math.max(0, (a.flash || 0) - dt);
      if (a.dead) { a.leaveT += dt; const ang = Math.atan2(a.y - p.y, a.x - p.x); stepTo(a, a.x + Math.cos(ang) * 40, a.y + Math.sin(ang) * 40, 50, dt); if (a.leaveT > 2.5) { a.gone = true; allies.splice(i, 1); } continue; }
      if (a.caster) for (const key of ['invuln', 'reviveShield', 'shadeInv']) a.caster[key] = Math.max(0, (Number(a.caster[key]) || 0) - dt);
      a.hp = Math.min(a.maxHp, a.hp + a.maxHp * 0.006 * dt);
      if (dist(a, p) > 750 && k) { const f = k.nearFree(p.x - 40, p.y + 30, a.r); a.x = f.x; a.y = f.y; a.okX = f.x; a.okY = f.y; a.path = []; }
      if (a.tg && a.tg.dead) { if (a.lastHitT > a.t - 1.2 && Math.random() < 0.3) speak(a, 'ally', 'allyKill'); a.tg = null; }
      if (!a.tg || dist(a.tg, p) > 420 || (a.retarget = (a.retarget || 0) - dt) <= 0) { a.retarget = 0.6; a.tg = pickTarget(a, p, enemies); }
      const tg = a.tg, def = a.moves && a.moves.length ? a.moves[a.mi % a.moves.length] : null, R = def && H && H.attackRange ? H.attackRange(def) : { min: 0, ideal: 110, max: 180 };
      const side = a.slot % 2 ? 1 : -1; let goal = null, sp = 105, mode = 'follow';
      a.dodgeT -= dt; if (a.dodgeT <= 0 && k) { const q = k.incoming(a); if (q) { a.dodge = q; a.dodgeT = 0.3; } }
      const crowd = enemies.filter(e => dist(e, a) < 150).length, low = a.hp < a.maxHp * 0.35;
      if (k && (crowd >= 3 || (low && crowd >= 1))) { goal = k.escapePoint(a, enemies, p); sp = 135; mode = 'escape'; }
      else if (dist(a, p) > 380) { goal = { x: p.x + side * 50, y: p.y + 30 }; sp = 155; mode = 'regroup'; }
      else if (tg) { const d = dist(a, tg), ang = Math.atan2(tg.y - a.y, tg.x - a.x); mode = 'fight';
        if (d > R.ideal + 12) goal = { x: tg.x - Math.cos(ang) * R.ideal, y: tg.y - Math.sin(ang) * R.ideal };
        else if (d < R.min) { goal = { x: a.x - Math.cos(ang) * 40, y: a.y - Math.sin(ang) * 40 }; sp = 120; }
        else { goal = { x: a.x + Math.cos(ang + side * Math.PI / 2) * 30, y: a.y + Math.sin(ang + side * Math.PI / 2) * 30 }; sp = 55; } a.dir = ang; }
      else { const fx2 = p.x + side * 52, fy = p.y + 34; if (dist(a, { x: fx2, y: fy }) > 26) goal = { x: fx2, y: fy }; else a.dir = Math.atan2(p.y - a.y, p.x - a.x); }
      a.mode = mode;
      if (a.dodgeT > 0 && a.dodge) { const st = sp * 1.8 * dt, nx = a.x + a.dodge.x * st, ny = a.y + a.dodge.y * st; if (free(nx, ny, a.r)) { a.x = nx; a.y = ny; a.moved = true; } }
      else if (goal) { const step = Math.min(Math.max(0, dist(a, goal)), sp * dt); if (step > 0.5) { try { if (H && H.navigate) { H.navigate(a, goal, step, dt, enemies); a.moved = true; } else stepTo(a, goal.x, goal.y, sp, dt); } catch (_) { stepTo(a, goal.x, goal.y, sp, dt); } } }
      try { N.World.collide(a); } catch (_) {}
      if (!free(a.x, a.y, a.r)) { if (free(a.okX, a.okY, a.r)) { a.x = a.okX; a.y = a.okY; } else if (k) { const f = k.nearFree(a.x, a.y, a.r); a.x = f.x; a.y = f.y; } a.path = []; } a.okX = a.x; a.okY = a.y;
      // attack with its real moves
      a.next -= dt;
      if (def && tg && a.next <= 0 && mode !== 'escape' && a.caster) { const d = dist(a, tg); if (d >= R.min && d <= R.max) {
        a.aim = Math.atan2(tg.y - a.y, tg.x - a.x); a.target = tg;
        try { N.Player.prototype.cast.call(a.caster, def); N.Combat.hoopaCast(a.caster, def); a.lastHitT = a.t; } catch (err) { console.warn('[wild]', err); }
        a.mi++; a.next = Math.max(0.35, (def.cd || 1) * 1.2 * (Number(a.caster.cdK) || 1)); } }
      for (const e of enemies) if (dist(e, a) < a.r + (e.r || 12)) { let d = 8; try { d = typeof e.dmg === 'function' ? e.dmg() : (e._dmg || 8); } catch (_) {} allyHurt(a, Number(d) || 8); }
      try { const P = N.Projectiles.all(); for (let j = P.length - 1; j >= 0; j--) { const q = P[j]; if (!q || q.friendly || q.ghost || Math.hypot(q.x - a.x, q.y - (a.y - 10)) > a.r + (q.r || 4)) continue; allyHurt(a, q.dmg || 6); P.splice(j, 1); } } catch (_) {}
      if ((a.idleT -= dt) <= 0) { a.idleT = rnd(55, 90); if (!tg) speak(a, 'ally', 'allyIdle'); }
      // it talks the ones like it into joining too
      if ((a.recruitT -= dt) <= 0) { a.recruitT = rnd(15, 25); if (allies.length < CFG.maxAllies) { const o = enemies.find(e => !special(e) && dist(e, a) < 220 && (Number(e.dex) === a.dex || (V() && V().relation(a, e) === 'kin')));
        if (o && Math.random() < 0.35) { speak(a, 'ally', 'recruit', { prio: true, other: o }); setTimeout(() => { if (!o.dead && allies.length < CFG.maxAllies) startTurn(o, 'convinced', { ally: a.name }); }, 1600); } } }
      if (a.anim) { try { if (!a.anim.once || a.anim.done) a.anim.loop(a.moved ? 'Walk' : 'Idle'); if (Number.isFinite(a.dir)) a.anim.dir = N.Sprites.dirFromAngle(a.dir); a.anim.update(dt); } catch (_) {} } }
  }

  // ================= update & engine hooks =================
  let runP = null;
  function reset() { allies.length = 0; feuds.length = 0; fx.length = 0; bubbles.length = 0; live.clear(); scene = null; sceneT = rnd(...CFG.sceneFirst); lvl0 = 0; }
  let lastArea = null;
  function areaChange(a) {   // walking into a rift (or out of one): what the old area's Pokemon were saying stops right there
    lastArea = a; bubbles.length = 0; convo = null; if (scene) endScene();
    try { T().drop && T().drop(it => ['wild', 'foe', 'ally', 'legend'].includes(it.kind) && it.obj && it.obj.__area !== a); } catch (_) {}
    if (a !== 'field') emit('area', { area: a });
  }
  function update(dt) {
    const N = E(), p = N?.Game?.player; if (!p) return;
    if (p !== runP) { runP = p; reset(); lastArea = area(); }
    if (area() !== lastArea) areaChange(area());
    if (N.Game.state !== 'playing' || p.dead || eventKind()) return;
    const foes = N.EnemyMgr.all().filter(e => e && !e.dead), now = clock();
    for (const e of foes) if (!seen.has(e)) meet(e, p);
    for (const e of foes) {
      if (harmless(e)) { runAct(e, dt, p, foes); hops(e, dt); if (e.__role === 'idle' && dist(e, p) > CFG.despawn && !(e.__act && e.__act.kind === 'follow')) removeEnemy(e); continue; }
      if (e.__wantFeud && !e.__feud && !e.dead) { if (now > e.__wantFeud) e.__wantFeud = 0; else if (dist(e, p) < 520) { const b = foes.find(o => o !== e && !o.dead && !o.__feud && !special(o) && !harmless(o) && !o.__turning && dist(o, e) < 260); if (b) startFeud(e, b); } }
      if (e.__turnAt && now > e.__turnAt && !e.__turning && dist(e, p) < 320 && allies.length < CFG.maxAllies) startTurn(e, 'heart');
    }
    updateFeuds(dt, foes); updateTurns(dt); accidents(dt, p, foes); chatter(dt, p, foes); legendTick(dt, p, foes); reactions(p, foes); convoTick(dt, p, foes);
    updateScene(dt, p); updateAllies(dt, p, foes.filter(e => !e.gone));
  }
  let hooked = false;
  function hook() {
    const N = E(); if (hooked || !N || !N.EnemyMgr || !N.Enemy || !N.Training || !N.Ult) return; hooked = true;
    const emu = N.EnemyMgr.update;
    N.EnemyMgr.update = function () { try { update(Math.min(0.1, Number(arguments[0]) || 0.016)); } catch (err) { console.warn('[wild]', err); } return emu.apply(this, arguments); };
    const eup = N.Enemy.prototype.update;
    const still = e => ({ x: e.x, y: e.y, r: 1, dead: false, hp: 1, maxHp: 1, hurt() {} });
    N.Enemy.prototype.update = function (dt) {
      if (!this.dead) {
        if (this.__role) {   // harmless: it goes where its activity takes it, at an easy pace, and never attacks
          this.touchCd = Math.max(Number(this.touchCd) || 0, 0.3); this.shotCd = Math.max(Number(this.shotCd) || 0, 1); this.skillCd = Math.max(Number(this.skillCd) || 0, 1);
          const g = this.__goal; arguments[1] = g ? { x: g.x, y: g.y, r: 1, dead: false, hp: 1, maxHp: 1, hurt() {} } : still(this);
          const sp = this.spd; this.spd = (this.__spd0 || sp) * (g ? (this.__spdMul || CFG.idleSpd) : 0.0001);
          try { return eup.apply(this, arguments); } finally { if (this.__role || this.spd < sp) this.spd = sp; } }
        if (this.__turning) { this.touchCd = Math.max(Number(this.touchCd) || 0, 0.3); arguments[1] = still(this); return eup.apply(this, arguments); }   // standing still, thinking
        const f = this.__feud; if (f && !f.dead) { this.touchCd = Math.max(Number(this.touchCd) || 0, 0.3);
          const fd = feuds.find(q => q.a === this || q.b === this); if (fd && fd.b === this && !fd.bFights) { const a = Math.atan2(this.y - f.y, this.x - f.x); arguments[1] = { x: this.x + Math.cos(a) * 200, y: this.y + Math.sin(a) * 200, r: 1, dead: false, hp: 1, maxHp: 1, hurt() {} }; }
          else arguments[1] = f; return eup.apply(this, arguments); }
        const p = N.Game.player; if (allies.length && p && !this.boss) { let best = null, bd = p.dead ? Infinity : dist(this, p) - 40; for (const a of allies) if (!a.dead && dist(this, a) < bd) { bd = dist(this, a); best = a; } if (best) arguments[1] = best.caster || best; }
      }
      return eup.apply(this, arguments); };
    const ed = N.Enemy.prototype.draw;   // climbing / hopping Pokemon leave the ground
    if (typeof ed === 'function') N.Enemy.prototype.draw = function (ctx) { const l = this.__lift; if (!(l > 0) || !ctx || typeof ctx.translate !== 'function') return ed.apply(this, arguments); ctx.save(); ctx.translate(0, -l); try { return ed.apply(this, arguments); } finally { ctx.restore(); } };
    const td = N.Training.drawables;
    N.Training.drawables = function () { let r = td.apply(this, arguments); if (!Array.isArray(r)) r = []; try { for (const a of allies) r.push({ y: a.y, draw: g => drawAlly(g, a) }); } catch (_) {} return r; };
    const du = N.Ult.drawUnits;
    N.Ult.drawUnits = function (ctx) { du.apply(this, arguments); try { drawTop(ctx); } catch (err) { console.warn('[wild]', err); } };
  }
  // ================= drawing =================
  function heart(ctx, x, y, s, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, y + s * 0.35); ctx.bezierCurveTo(x - s * 1.1, y - s * 0.35, x - s * 0.45, y - s * 1.05, x, y - s * 0.4); ctx.bezierCurveTo(x + s * 0.45, y - s * 1.05, x + s * 1.1, y - s * 0.35, x, y + s * 0.35); ctx.fill(); }
  function drawAlly(ctx, w) {
    const al = w.dead ? Math.max(0, 1 - (w.leaveT || 0) / 2.5) : 1; ctx.save(); ctx.globalAlpha = al;
    ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(w.x, w.y + 1, w.r * 1.1, w.r * 0.42, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#5ab0ff'; ctx.lineWidth = 2; ctx.globalAlpha = al * 0.85; ctx.beginPath(); ctx.ellipse(w.x, w.y, w.r + 5, (w.r + 5) * 0.4, 0, 0, TAU); ctx.stroke(); ctx.globalAlpha = al;
    if (w.anim) { if (w.flash > 0) ctx.filter = 'brightness(2.2)'; try { w.anim.draw(ctx, w.x, w.y); } catch (_) {} ctx.filter = 'none'; }
    ctx.restore();
  }
  function overlay(ctx, f, w, now) {   // things attached to a Pokemon: a berry, a flower, a coin, dizzy stars, face scribbles
    const H = w.bodyH || 40, hx = w.x, hy = w.y - H * 0.55;
    if (f.kind === 'scribble') { ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(hx - 8, hy - 2); ctx.lineTo(hx - 3, hy + 2); ctx.lineTo(hx + 2, hy - 3); ctx.lineTo(hx + 8, hy + 1); ctx.moveTo(hx - 5, hy + 6); ctx.quadraticCurveTo(hx, hy + 2, hx + 5, hy + 6); ctx.stroke(); }
    else if (f.kind === 'berry') { ctx.fillStyle = '#3a8aff'; ctx.beginPath(); ctx.arc(w.x + (w.r || 12) + 6, w.y - 4, 5, 0, TAU); ctx.fill(); ctx.fillStyle = '#2a6a2a'; ctx.fillRect(w.x + (w.r || 12) + 5, w.y - 11, 2, 4); }
    else if (f.kind === 'flower') { const x = w.x + (w.r || 12) + 8, y = w.y - 2; ctx.fillStyle = '#3a8a3a'; ctx.fillRect(x - 0.5, y - 2, 1.5, 8); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + now; ctx.fillStyle = '#ff8ad0'; ctx.beginPath(); ctx.arc(x + Math.cos(a) * 3, y - 4 + Math.sin(a) * 3, 2.2, 0, TAU); ctx.fill(); } ctx.fillStyle = '#ffe04a'; ctx.beginPath(); ctx.arc(x, y - 4, 1.8, 0, TAU); ctx.fill(); }
    else if (f.kind === 'coin') { ctx.fillStyle = '#ffd23f'; ctx.strokeStyle = '#a07800'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(w.x + 10, w.y - H * 0.4, 5, 0, TAU); ctx.fill(); ctx.stroke(); }
    else if (f.kind === 'stars') { for (let i = 0; i < 3; i++) { const a = now * 5 + i * TAU / 3, x = w.x + Math.cos(a) * 12, y = w.y - H - 2 + Math.sin(a) * 4; ctx.fillStyle = '#ffe04a'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('★', x, y); } }
  }
  function drawBubble(ctx, b) {
    const w = b.obj, u = b.t / b.life, a = u > 0.85 ? (1 - u) / 0.15 : Math.min(1, b.t * 8); if (a <= 0) return;
    const y = w.y - (w.bodyH || 40) - 30 - (w.__lift || 0); ctx.save(); ctx.globalAlpha = a; ctx.font = 'bold 9px sans-serif'; const tw = ctx.measureText(b.text).width + 10, x = w.x - tw / 2;
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#1a1030'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + 4, y - 9); ctx.arcTo(x + tw, y - 9, x + tw, y + 5, 4); ctx.arcTo(x + tw, y + 5, x, y + 5, 4); ctx.lineTo(w.x + 3, y + 5); ctx.lineTo(w.x, y + 10); ctx.lineTo(w.x - 2, y + 5); ctx.arcTo(x, y + 5, x, y - 9, 4); ctx.arcTo(x, y - 9, x + tw, y - 9, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#1a1030'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(b.text, w.x, y - 2); ctx.restore();
  }
  let lastDraw = performance.now();
  function drawTop(ctx) {
    const N = E(), p = N.Game.player, nowMs = performance.now(), now = nowMs / 1000, dt = Math.min(0.1, (nowMs - lastDraw) / 1000); lastDraw = nowMs;
    for (const f of fx) { f.t += dt; if (f.t > 0 && f.vx != null) { f.x += f.vx * dt; f.y += f.vy * dt; if (f.g) f.vy += f.g * dt; } } for (let i = fx.length - 1; i >= 0; i--) if (fx[i].t > fx[i].life || (fx[i].obj && (fx[i].obj.dead || fx[i].obj.gone))) fx.splice(i, 1);
    for (const b of bubbles) b.t += dt; for (let i = bubbles.length - 1; i >= 0; i--) if (bubbles[i].t > bubbles[i].life || bubbles[i].obj.dead || bubbles[i].obj.gone) bubbles.splice(i, 1);
    for (const a of allies) { if (a.dead) continue; const y = a.y - (a.bodyH || 40) - 10; ctx.save(); ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = '#1a1030'; ctx.fillStyle = '#9ad8ff';
      const t = 'Ally · ' + label(a); ctx.strokeText(t, a.x, y); ctx.fillText(t, a.x, y); ctx.fillStyle = '#25152f'; ctx.fillRect(a.x - 18, y + 3, 36, 4); ctx.fillStyle = '#5ab0ff'; ctx.fillRect(a.x - 18, y + 3, 36 * Math.max(0, a.hp / a.maxHp), 4); ctx.restore(); }
    if (p) for (const e of N.EnemyMgr.all()) { if (!e || e.dead || !harmless(e) || dist(e, p) > 280) continue; const y = e.y - (e.bodyH || 40) - 12 - (e.__lift || 0); ctx.save(); ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = '#102010'; ctx.fillStyle = '#c8ffaa';
      const t = '♪ ' + label(e) + nat(e); ctx.strokeText(t, e.x, y); ctx.fillText(t, e.x, y); ctx.restore(); }
    for (const e of feuds) for (const w of [e.a, e.b]) { if (w.dead) continue; const y = w.y - (w.bodyH || 40) - 8; ctx.save(); ctx.globalAlpha = 0.6 + 0.4 * Math.sin(now * 10); ctx.fillStyle = '#ff4a3a'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('💢', w.x + 10, y); ctx.restore(); }
    for (const e of live) if (e.__turning && !e.dead) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const gr = ctx.createRadialGradient(e.x, e.y - 14, 2, e.x, e.y - 14, 34); gr.addColorStop(0, 'rgba(255,180,220,.5)'); gr.addColorStop(1, 'rgba(255,120,200,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(e.x, e.y - 14, 34, 0, TAU); ctx.fill(); ctx.restore(); }
    for (const f of fx) { if (f.t < 0) continue; if (f.obj) { ctx.save(); overlay(ctx, f, f.obj, now); ctx.restore(); continue; } const u = f.t / f.life, a = Math.max(0, 1 - u); ctx.save(); ctx.globalAlpha = a;
      if (f.kind === 'heart') heart(ctx, f.x, f.y, 5, '#ff5a8a');
      else if (f.kind === 'note') { ctx.fillStyle = '#7a4cff'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(Math.floor(f.x) % 2 ? '♪' : '♫', f.x, f.y); }
      else if (f.kind === 'z') { ctx.fillStyle = '#d8e8ff'; ctx.strokeStyle = '#1a2040'; ctx.lineWidth = 2; ctx.font = 'bold ' + Math.round(8 + u * 6) + 'px sans-serif'; ctx.strokeText('z', f.x, f.y); ctx.fillText('z', f.x, f.y); }
      else if (f.kind === 'tear' || f.kind === 'drop') { ctx.fillStyle = f.kind === 'tear' ? '#8fd0ff' : '#5aaaff'; ctx.beginPath(); ctx.arc(f.x, f.y, f.kind === 'tear' ? 2.2 : 2.8, 0, TAU); ctx.fill(); }
      else if (f.kind === 'dust') { ctx.fillStyle = 'rgba(' + (f.c || '160,120,80') + ',.8)'; ctx.beginPath(); ctx.arc(f.x, f.y, 2.5 + u * 2, 0, TAU); ctx.fill(); }
      else if (f.kind === 'ring') { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(f.x, f.y, 8 + u * 20, (8 + u * 20) * 0.4, 0, 0, TAU); ctx.stroke(); }
      else if (f.kind === 'gem') { ctx.globalAlpha = Math.min(1, f.t * 3) * a; const y = f.y - Math.min(1, f.t * 2) * 10; ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(f.x, y, 4.5, 0, TAU); ctx.stroke(); ctx.fillStyle = '#9af0ff'; ctx.beginPath(); ctx.moveTo(f.x, y - 9); ctx.lineTo(f.x + 3, y - 5); ctx.lineTo(f.x, y - 3); ctx.lineTo(f.x - 3, y - 5); ctx.closePath(); ctx.fill();
        ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 4; i++) { const ang = now * 3 + i * TAU / 4; ctx.fillStyle = '#fff6b0'; ctx.fillRect(f.x + Math.cos(ang) * 10 - 1, y - 5 + Math.sin(ang) * 10 - 1, 2, 2); } }
      ctx.restore(); }
    for (const b of bubbles) drawBubble(ctx, b);
  }
  let last = performance.now();
  (function loop(now) { requestAnimationFrame(loop); const dt = Math.min(0.1, (now - last) / 1000); last = now; try { hook(); panicTick(dt); } catch (e) { console.warn('[wild]', e); } })(performance.now());
  window.PS_WILD = { cfg: CFG, scenes: Object.keys(SCENES), scene: n => startScene(n || pick(Object.keys(SCENES)), E().Game.player), get allies() { return allies.map(a => ({ name: a.name, hp: Math.round(a.hp), dead: a.dead })); },
    get feuds() { return feuds.length; }, get running() { return scene && { name: scene.name, step: scene.i }; }, get harmless() { return E().EnemyMgr.all().filter(e => e && !e.dead && e.__role).map(e => e.name + ':' + (e.__fleeT > 0 ? 'flee' : e.__act ? e.__act.kind : e.__role)); },
    get panic() { return panicKind; },
    turn: e => startTurn(e || E().EnemyMgr.all().find(x => x && !x.dead && !special(x) && !harmless(x)), false), feud: (a, b) => { const L = E().EnemyMgr.all().filter(x => x && !x.dead && !special(x) && !harmless(x)); startFeud(a || L[0], b || L[1]); },
    idle: (e, kind) => { const x = e || E().EnemyMgr.all().find(q => q && !q.dead && !special(q) && !harmless(q)); if (x) setRole(x, 'idle', kind ? Object.assign({ kind, t: 0, dur: 14, ph: 0 }, kind === 'swim' ? (() => { const w = findKind(x, 'liquid', 600); return w ? { water: w, shore: shoreOf(x, w) } : {}; })() : kind === 'climb' ? (() => { const w = findKind(x, 'wall', 600); return w ? { tree: w, foot: shoreOf(x, w) } : {}; })() : {}) : null); return x; } };
})();
