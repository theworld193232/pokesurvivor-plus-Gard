/* PokéSurvivor+ — Living World AI · the four guardians (the Tropical Ocean)
 * Each island spirit waits at the heart of its own island; step into its arena and it comes for
 * you, each in its own way:
 *   · Tapu Koko, Thundercrest Island: black volcanic rock under a storm that never leaves, Electric
 *     Pokémon, an arena up on the cliff-top (one ramp climbs to it). It drops in with a thunderbolt
 *     and fights fast and furious: lightning keeps striking around you.
 *   · Tapu Lele, Blossomveil Island: pink trees, flowers, petals on the wind, a ring of standing
 *     stones, Psychic and Fairy Pokémon. It giggles, plays, vanishes and reappears behind you;
 *     its games hurt.
 *   · Tapu Bulu, Verdant Crown Island: dense jungle, giant trees, ruins and a waterfall, Grass
 *     Pokémon. It rises from the ruined plaza, slow and immensely strong; the ground erupts.
 *   · Tapu Fini, the Isle of Lost Souls: permanent fog that thickens toward the summit, graves,
 *     ruins, dead trees and ghosts. On the Summit of Two Orbs the Red and Blue Orbs rest on their
 *     pedestals; reach for them and Fini rises from the mist. It tests you once and only once: win,
 *     and both orbs are yours to keep (82-sea.js, kept between runs). Kyogre and Groudon stay
 *     legends.
 * Beat Koko, Lele or Bulu and it joins you (choose it as your partner from the menu), like the
 * legendary beasts of the Shady Forest. Lose (or leave) and it goes back to wait for you.
 */
(function () {
  'use strict';
  const AI = window.PSXAI;
  const U = AI.U;
  const O = () => AI.Ocean;
  const DEX = { koko: 785, lele: 786, bulu: 787, fini: 788 };
  const ISLE = { koko: 'koko', lele: 'lele', bulu: 'bulu', fini: 'fini' };
  const COL = { koko: '#ffe14d', lele: '#ff9cd2', bulu: '#9be05a', fini: '#8fd8ff' };
  const st = { scene: null, battle: null, actor: null, cool: {}, dim: 0, fx: [] };

  function on() { return O() && O().on() && AI.cfg.guardians !== false; }
  function player() { return AI.R.Game.player; }
  function T(en, es) { return (AI.lang && AI.lang() === 'es' && es) || en; }
  function sea() { return AI.Sea; }
  function won(id) { const s = sea(); return !!(s && s.save.tapus[id]); }
  function owned(dex) { try { const sv = AI.R.DB.save; return !!(sv && sv.owned && sv.owned[dex]); } catch (e) { return false; } }
  function done(id) { return id === 'fini' ? won('fini') || (sea() && sea().has('red') && sea().has('blue')) : won(id) || owned(DEX[id]); }
  function busy() { return !!st.scene; }
  function isle(id) { return O().islandById(ISLE[id]); }
  // where its arena is: the island's heart (Fini's summit holds the two pedestals)
  function arena(id) { const o = isle(id); return o ? { x: o.x, y: o.y, r: o.arenaR || 190, o } : null; }
  function pedestals() { const a = arena('fini'); return a ? [[a.x - 46, a.y - 14], [a.x + 46, a.y - 14]] : []; }

  const LINES = {
    koko: [[T('Kokooo! Someone climbed MY cliff in MY storm!', '¡Kokooo! ¡Alguien ha subido a MI acantilado en MI tormenta!'), 'Surprised'], [T('You want a fight? Then keep up! Too slow and you\'re done!', '¿Quieres pelea? ¡Pues sigue el ritmo! ¡Si eres lento, se acabó!'), 'Determined']],
    lele: [[T('Hehe~ you found my garden. Did you come to play?', 'Jiji~ has encontrado mi jardín. ¿Has venido a jugar?'), 'Happy'], [T('Let\'s play a game! If you lose… well, don\'t cry~', '¡Juguemos! Si pierdes… bueno, no llores~'), 'Joyous']],
    bulu: [[T('…You walk in the Crown as if it were yours.', '…Caminas por la Corona como si fuera tuya.'), 'Normal'], [T('Prove you belong among these trees. Or be buried beneath them.', 'Demuestra que perteneces a estos árboles. O quedarás bajo ellos.'), 'Determined']],
    fini: [[T('You climbed through the fog of the dead… for the orbs.', 'Has subido entre la niebla de los muertos… por los orbes.'), 'Normal'], [T('I will test you once. Only once. Win, and they are yours to keep apart.', 'Te pondré a prueba una vez. Solo una. Gana, y serán tuyos para mantenerlos separados.'), 'Determined']],
    kokoWon: T('Hah… hahaha! That was FUN! I\'m coming with you, got it?', '¡Ja… jajaja! ¡Eso fue DIVERTIDO! Me voy contigo, ¿entendido?'),
    leleWon: T('Aww, you won~ Fine, fine. I\'ll come along. It\'ll be fun!', 'Ooh, has ganado~ Vale, vale. Iré contigo. ¡Será divertido!'),
    buluWon: T('…Strong. The Crown accepts you. So do I.', '…Fuerte. La Corona te acepta. Y yo también.'),
    finiWon: T('Then take them. Keep the red from the blue, always. What sleeps must stay asleep.', 'Entonces tómalos. Mantén el rojo lejos del azul, siempre. Lo que duerme debe seguir dormido.'),
    lost: { koko: T('Tapu Koko streaks back into the storm, laughing.', 'Tapu Koko vuelve a la tormenta como un rayo, riendo.'), lele: T('Tapu Lele giggles and vanishes in a swirl of petals.', 'Tapu Lele se ríe y desaparece entre pétalos.'), bulu: T('Tapu Bulu sinks back among the ruins.', 'Tapu Bulu se hunde de nuevo entre las ruinas.'), fini: T('Tapu Fini dissolves into the fog. The orbs remain on their pedestals.', 'Tapu Fini se disuelve en la niebla. Los orbes siguen en sus pedestales.') },
  };

  // ---------------------------------------------------------------- [Gard v92] the guardians wait where you can see them
  /* Each island spirit hovers over its arena until you step in (it used to be invisible until the scene started, so
   * an island looked empty): its own sprite, gently bobbing, with a soft glow in its colour and a shadow below. */
  const idleImg = {}, idleHooked = { on: false };
  function idleSheet(dex) { if (!idleImg[dex]) { const im = new Image(); im.src = 'assets/pokemon/' + dex + '/Idle.png'; idleImg[dex] = im; } return idleImg[dex]; }
  function drawIdle(ctx, id, a) {
    const R = AI.R, dex = DEX[id], im = idleSheet(dex), m = R.SPRITE_META && R.SPRITE_META[dex] && R.SPRITE_META[dex].a && R.SPRITE_META[dex].a.Idle;
    if (!im.complete || !im.naturalWidth || !m) return;
    const t = AI.time || 0, d = m.d || [10], total = d.reduce((x, y) => x + y, 0), tick = Math.floor(t * 30) % total;
    let f = 0, acc = 0; for (; f < d.length; f++) { acc += d[f]; if (tick < acc) break; }
    const SC = 2.2, bob = Math.round(Math.sin(t * 2 + dex) * 3) * 2, x = a.x, y = a.y + 18;
    ctx.save(); ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(x, y, 26, 8, 0, 0, 6.283); ctx.fill();
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.18 + 0.08 * Math.sin(t * 3); const g = ctx.createRadialGradient(x, y - 40 + bob, 0, x, y - 40 + bob, 70); g.addColorStop(0, COL[id]); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(x - 70, y - 110 + bob, 140, 140);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = id === 'fini' ? 0.85 : 1;
    ctx.drawImage(im, f * m.w, 0, m.w, m.h, Math.round(x - m.ax * SC), Math.round(y - m.ay * SC - 10 + bob), Math.round(m.w * SC), Math.round(m.h * SC));
    ctx.restore();
  }
  function hookIdle() {
    const R = AI.R; if (idleHooked.on || !R || !R.Training || typeof R.Training.drawables !== 'function') return;
    idleHooked.on = true;
    const nd = R.Training.drawables;
    R.Training.drawables = function (...args) {
      const base = nd.apply(this, args) || [];
      try {
        if (!on() || st.scene) return base;
        const cam = R.Camera, out = base.slice();
        for (const id of Object.keys(DEX)) {
          if (done(id) || (st.battle && st.battle.id === id) || (st.cool[id] || 0) > AI.time) continue;   // (only when it will actually fight you: not once it's beaten, resting after a fight, or already yours)
          const a = arena(id); if (!a || !cam.sees(a.x, a.y - 60, 140)) continue;
          out.push({ y: a.y, draw: (ctx) => drawIdle(ctx, id, a) });
        }
        return out;
      } catch (e) { return base; }
    };
  }

  // ---------------------------------------------------------------- per frame
  function tick(dt) {
    hookIdle();
    st.dim = Math.max(0, st.dim - dt * 0.3);
    for (let i = st.fx.length - 1; i >= 0; i--) { st.fx[i].t += dt; if (st.fx[i].t > st.fx[i].life) st.fx.splice(i, 1); }
    if (!on()) return;
    if (st.scene) return tickScene(dt);
    if (st.battle) return tickBattle(dt);
    const p = player();
    if (!p || p.dead) return;
    const bossUp = !!(AI.R.EnemyMgr.bossAlive && AI.R.EnemyMgr.bossAlive());
    const otherBusy = !!((AI.Story && AI.Story.busy()) || (AI.Sea && AI.Sea.busy()));
    for (const id of Object.keys(DEX)) {
      if (done(id) || (st.cool[id] || 0) > AI.time) continue;
      const a = arena(id);
      if (!a) continue;
      const d = Math.hypot(p.x - a.x, p.y - a.y);
      const reach = id === 'fini' ? pedestals().some((q) => Math.hypot(p.x - q[0], p.y - q[1]) < 70) : d < a.r * 0.7;
      if (!reach && id === 'koko' && d > a.r * 0.95 && d < a.r + 55 && (st.rampSaid || 0) < AI.time) { st.rampSaid = AI.time + 10; try { AI.R.Spawner.say(T('Tapu Koko waits atop the cliff! Climb the stone ramp on the harbour side.', '¡Tapu Koko espera en lo alto del acantilado! Sube por la rampa de piedra del lado del puerto.'), 3.5, 1); } catch (e) { /* ignore */ } }
      if (reach && O().sample(p.x, p.y).cls === 0) {
        // ([Gard v95] it used to ignore you without a word while a stage boss was alive)
        if (bossUp || otherBusy) { if ((st.waitSaid || 0) < AI.time) { st.waitSaid = AI.time + 8; const nm = { koko: 'Tapu Koko', lele: 'Tapu Lele', bulu: 'Tapu Bulu', fini: 'Tapu Fini' }[id]; try { AI.R.Spawner.say(T(nm + (bossUp ? ' watches you… it won\'t fight while another boss is loose. Beat the boss first!' : ' watches you… finish what\'s happening first, then come back.'), nm + ' te observa… no luchará mientras haya otro jefe suelto.'), 3.5, 1); } catch (e) { /* ignore */ } } break; }
        startScene(id); break;
      }
    }
  }
  function actor(dex, x, y) {
    try { const a = new AI.R.Sprites.Animator(dex, 1, false); a.loop('Idle'); AI.R.Sprites.preload([dex], 4000); return { dex, a, x, y, alpha: 0, z: 0 }; } catch (e) { return null; }
  }
  function startScene(id) {
    const a = arena(id), p = player();
    const ang = Math.atan2(a.y - p.y, a.x - p.x);
    const at = id === 'fini' ? [a.x, a.y - 40] : [p.x + Math.cos(ang) * 130, p.y + Math.sin(ang) * 100];
    st.scene = { id, t: 0, at, step: 0, line: 0 };
    try { AI.Talk.clear && AI.Talk.clear(); } catch (e) { /* ignore */ }
    AI.Bus.emit({ type: 'guardian', what: 'scene', id, x: at[0], y: at[1], loud: 0 });
    if (id === 'fini' && AI.Sky) AI.Sky.st.forced = Object.assign({}, AI.Sky.st.forced || {}, { fog: 0.95 });
  }
  function tickScene(dt) {
    const sc = st.scene, R = AI.R, p = player();
    sc.t += dt;
    if (p) p.invuln = Math.max(p.invuln || 0, 0.4);
    const [ax, ay] = sc.at;
    const dex = DEX[sc.id];
    st.dim = Math.min(0.45, st.dim + dt * 0.5);
    if (sc.step === 0 && sc.t > 1.2) {
      sc.step = 1;
      st.actor = actor(dex, ax, ay);
      const A = st.actor;
      if (sc.id === 'koko') {
        // down with the lightning
        if (AI.Sky) { AI.Sky.st.strikes.push({ x: ax, y: ay, t: 0, seed: (Math.random() * 1e9) | 0, power: 1 }); AI.Sky.st.flash = 1.1; }
        try { R.Camera.kick(1); R.Audio.sfx('ultBolt'); R.FX.burst(ax, ay - 10, '#fff7a0', 40, 300); R.FX.ring(ax, ay, 10, 150, '#ffe14d', 0.7, 6); } catch (e) { /* ignore */ }
        if (A) A.alpha = 1;
      } else if (sc.id === 'lele') {
        // out of a swirl of petals
        for (let i = 0; i < 40; i++) st.fx.push({ kind: 'petal', x: ax + U.rand(-60, 60), y: ay + U.rand(-70, 10), vx: U.rand(-40, 40), vy: U.rand(-50, 10), t: 0, life: U.rand(1.5, 3) });
        try { R.Audio.sfx('legend'); } catch (e) { /* ignore */ }
      } else if (sc.id === 'bulu') {
        // the ground heaves
        try { R.Camera.kick(1.1); R.FX.ring(ax, ay, 12, 170, '#7fd05a', 0.7, 6); R.FX.burst(ax, ay, '#6a5232', 30, 200); R.Audio.sfx('boss'); } catch (e) { /* ignore */ }
        if (A) A.z = -60;
      } else if (sc.id === 'fini') {
        try { AI.Ambience && AI.Ambience.myst && AI.Ambience.myst('shimmer', ax, ay); } catch (e) { /* ignore */ }
      }
    }
    const A = st.actor;
    if (A) {
      try { A.a.update(dt); if (p) A.a.dir = R.Sprites.dirFromAngle(Math.atan2(p.y - A.y, p.x - A.x)); } catch (e) { /* ignore */ }
      if (sc.id === 'lele' || sc.id === 'fini') A.alpha = Math.min(1, A.alpha + dt * 0.7);
      if (sc.id === 'bulu') { A.z = Math.min(0, A.z + dt * 50); A.alpha = Math.min(1, A.alpha + dt); }
      if (Math.random() < dt * 8) try { R.FX.burst(A.x + U.rand(-24, 24), A.y - U.rand(10, 60), COL[sc.id], 2, 60); } catch (e) { /* ignore */ }
    }
    const L = LINES[sc.id];
    if (sc.line < L.length && sc.t > 2.4 + sc.line * 3.2) { const [text, emo] = L[sc.line++]; if (AI.Talk) AI.Talk.legend(dex, text, { emo, life: 3.4 }); }
    if (sc.t > 2.4 + L.length * 3.2 + 0.6) startBattle(sc);
  }
  function startBattle(sc) {
    const R = AI.R;
    const dex = DEX[sc.id];
    const d = R.DEX_BY[dex] || { name: sc.id };
    const A = st.actor;
    const x = A ? A.x : sc.at[0], y = A ? A.y : sc.at[1];
    let hp = 2600, dmg = 18;
    try { hp = Math.round(Math.max(6.5 * R.Stats.hpRef(), 1900)); } catch (e) { /* ignore */ }
    try { dmg = Math.round(R.Enemies.bossDmg(R.Game.st.time)); } catch (e) { /* ignore */ }
    const K = {
      koko: { spd: 160, behavior: 'shooter', range: 300, shotCd: 0.85, hp: 0.9, dmg: 1 },
      lele: { spd: 115, behavior: 'shooter', range: 320, shotCd: 1.1, hp: 0.95, dmg: 1 },
      bulu: { spd: 72, behavior: 'chase', range: 220, shotCd: 1.6, hp: 1.55, dmg: 1.25 },
      fini: { spd: 96, behavior: 'shooter', range: 310, shotCd: 1.25, hp: 1.15, dmg: 1 },
    }[sc.id];
    const def = { dex, name: d.name, hp: Math.round(hp * K.hp), spd: K.spd, dmg: Math.round(dmg * K.dmg), xp: 650, behavior: K.behavior, shotDmg: Math.round(dmg * 0.46), shotCd: K.shotCd, range: K.range };
    let e = null;
    try {
      e = new R.Enemy(def, x, y, { hp: 1, spd: 1, dmg: 1 }, true);
      e.psxGuardian = sc.id; e.psxStory = true; e.psxPlaced = true; e.psxForceTemp = 'aggressive'; e.legend = true;
      R.EnemyMgr.add(e);
      if (!R.EnemyMgr.all().includes(e)) try { R.EnemyMgr.all().push(e); } catch (err) { /* ignore */ }   // (a full population cap must not swallow the guardian)
      if (AI.Talk && AI.Talk.legends) AI.Talk.legends.seen.set(e, { stage: 0 });
    } catch (err) { AI.warn('guardian-battle', err); }
    st.actor = null;
    st.scene = null;
    st.battle = e ? { id: sc.id, e, t: 0, haz: 1.5, tele: 4 } : null;
    try { R.Audio.sfx('boss'); } catch (err) { /* ignore */ }
    AI.Bus.emit({ type: 'guardian', what: 'battle', id: sc.id, x, y, loud: 0 });
  }
  // each fights its own way
  function tickBattle(dt) {
    const b = st.battle;
    const R = AI.R, p = player();
    b.t += dt;
    if (b.e.dead) return victory(b);
    const a = arena(b.id);
    const gone = !R.EnemyMgr.all().includes(b.e);
    const far = p && Math.hypot(p.x - a.x, p.y - a.y) > a.o.R * 1.8 + 400;
    if (gone || far || b.t > 300 || !p || p.dead) return lost(b, gone);
    b.haz -= dt;
    const zone = (x, y, r, delay, k, type, col) => { try { const prev = AI.curEnemy; AI.curEnemy = b.e; R.Hazards.add({ kind: 'zone', x, y, r, delay, dmg: Math.round((b.e.dmg || 18) * k), type, color: col }); AI.curEnemy = prev; } catch (e) { /* ignore */ } };
    if (b.id === 'koko' && b.haz <= 0) {
      // lightning keeps striking around you
      b.haz = U.rand(0.9, 1.5);
      const n = b.e.hp < b.e.maxHp * 0.5 ? 3 : 2;
      for (let i = 0; i < n; i++) {
        const x = p.x + U.rand(-110, 110), y = p.y + U.rand(-80, 80);
        zone(x, y, 40, 0.8, 0.7, 'electric', '#ffe14d');
        setTimeout(() => { if (AI.Sky && st.battle) { AI.Sky.st.strikes.push({ x, y, t: 0, seed: (Math.random() * 1e9) | 0, power: 0.7 }); AI.Sky.st.flash = Math.max(AI.Sky.st.flash, 0.5); } }, 780);
      }
    } else if (b.id === 'lele') {
      // it plays: vanishes, reappears somewhere else
      b.tele -= dt;
      if (b.tele <= 0) {
        b.tele = U.rand(3, 5);
        try { R.FX.burst(b.e.x, b.e.y - 20, '#ff9cd2', 20, 160); } catch (e) { /* ignore */ }
        for (let i = 0; i < 10; i++) {
          const ang = Math.random() * 6.283, x = p.x + Math.cos(ang) * U.rand(140, 220), y = p.y + Math.sin(ang) * U.rand(100, 160);
          if (O().fits('walk', x, y)) { b.e.x = x; b.e.y = y; break; }
        }
        try { R.FX.burst(b.e.x, b.e.y - 20, '#ffd2ec', 20, 160); } catch (e) { /* ignore */ }
      }
      if (b.haz <= 0) { b.haz = U.rand(1.6, 2.4); for (let i = 0; i < 3; i++) { const ang = i / 3 * 6.283 + Math.random(); zone(p.x + Math.cos(ang) * 70, p.y + Math.sin(ang) * 50, 34, 1, 0.6, 'psychic', '#ff7ad0'); } }
    } else if (b.id === 'bulu' && b.haz <= 0) {
      // the ground erupts where you stand
      b.haz = U.rand(1.8, 2.6);
      zone(p.x, p.y, 54, 1.05, 1, 'grass', '#7fd05a');
      try { R.Camera.kick(0.3); } catch (e) { /* ignore */ }
    } else if (b.id === 'fini' && b.haz <= 0) {
      // the mist gathers into rings of water
      b.haz = U.rand(1.4, 2.2);
      zone(p.x + U.rand(-50, 50), p.y + U.rand(-40, 40), 46, 1, 0.75, 'water', '#8fd8ff');
    }
  }
  function victory(b) {
    const R = AI.R;
    const dex = DEX[b.id];
    const s = sea();
    if (s) { s.save.tapus[b.id] = Date.now(); s.persist(); }
    if (b.id === 'fini') {
      // both orbs, to keep (not repeatable)
      if (s) { s.give('red'); setTimeout(() => s.give('blue'), 900); }
      if (AI.Talk) AI.Talk.legend(dex, LINES.finiWon, { emo: 'Normal', life: 5.5 });
    } else {
      try {
        R.DB.grant(dex, 'tropical-ocean');
        const sv = R.DB.save;
        sv.legends = sv.legends || {};
        if (!sv.legends[dex]) sv.legends[dex] = Date.now();
        R.DB.commit && R.DB.commit();
      } catch (e) { AI.warn('guardian-grant', e); }
      if (AI.Talk) AI.Talk.legend(dex, LINES[b.id + 'Won'], { emo: 'Happy', life: 5 });
      try { R.Spawner.say(((R.DEX_BY[dex] || {}).name || b.id) + T(' joined you! Choose it as your partner from the menu.', ' se ha unido a ti. Elígelo como compañero desde el menú.'), 4.5, 1); R.Audio.sfx('legend'); } catch (e) { /* ignore */ }
    }
    if (AI.Exp) AI.Exp.give(10, 'a guardian', { key: 'tapu:' + b.id });
    AI.Bus.emit({ type: 'guardian', what: 'won', id: b.id, dex, x: b.e.x, y: b.e.y, loud: 0 });
    try { R.Pickups.clear && R.Pickups.clear(); } catch (e) { /* ignore */ }
    end(b.id);
  }
  function lost(b, gone) {
    const R = AI.R;
    try { if (!gone) { b.e.dead = true; b.e.hp = 0; R.FX.burst(b.e.x, b.e.y - 30, COL[b.id], 30, 240); } } catch (e) { /* ignore */ }
    try { R.Spawner.say(LINES.lost[b.id], 3, 1); } catch (e) { /* ignore */ }
    st.cool[b.id] = AI.time + 45;
    end(b.id);
  }
  function end(id) {
    st.battle = null;
    if (id === 'fini' && AI.Sky && AI.Sky.st.forced) { delete AI.Sky.st.forced.fog; if (!Object.keys(AI.Sky.st.forced).length) AI.Sky.st.forced = null; }
  }

  // ---------------------------------------------------------------- the arenas, dressed
  /* [Gard v91] The arenas were painted with smooth, see-through shapes (blurry ellipses, thin anti-aliased lines,
   * pillars drawn at 0.9x so their pixels smeared), which looked pasted on next to the game's pixel art. They're
   * pixel art now: each floor is drawn once at half resolution (one art pixel = 2 world pixels, like every other
   * sprite), with hard edges and a small palette, then cached; the pillars are a new hand-made sprite. */
  const PXS = 2, artCache = new Map();
  function rng(seed) { let t = seed >>> 0; return () => { t += 0x6D2B79F5; let r = Math.imul(t ^ (t >>> 15), 1 | t); r ^= r + Math.imul(r ^ (r >>> 7), 61 | r); return ((r ^ (r >>> 14)) >>> 0) / 4294967296; }; }
  function canvasOf(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  // draw a cached low-res canvas centred on (x, y) (or with its base there), crisp
  function blit(ctx, c, x, y, base) {
    if (!c) return;
    const w = c.width * PXS, h = c.height * PXS, prev = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(c, Math.round(x - w / 2), Math.round(base ? y - h : y - h / 2), w, h);
    ctx.imageSmoothingEnabled = prev;
  }
  function px(g, x, y, col) { g.fillStyle = col; g.fillRect(x | 0, y | 0, 1, 1); }
  function line(g, x0, y0, x1, y1, col) { // Bresenham, one art pixel wide
    x0 |= 0; y0 |= 0; x1 |= 0; y1 |= 0;
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy;
    for (let n = 0; n < 2000; n++) { px(g, x0, y0, col); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
  }
  // flagstones inside a mask: staggered rows of stones with dark seams, moss in the cracks, a ragged edge
  function flagstones(g, W, H, inside, pal, rnd, moss) {
    const TW = 9, TH = 6;
    for (let row = 0; row * TH < H; row++) {
      const off = row % 2 ? (TW / 2) | 0 : 0;
      for (let col = -1; col * TW < W; col++) {
        const x0 = col * TW + off, y0 = row * TH, c = pal[(rnd() * pal.length) | 0], broken = rnd() < 0.06;
        if (broken) continue;
        for (let y = y0; y < y0 + TH - 1; y++) for (let x = x0; x < x0 + TW - 1; x++) {
          if (x < 0 || y < 0 || x >= W || y >= H || !inside(x, y, rnd)) continue;
          let k = c;
          if (y === y0) k = pal.hi; else if (y === y0 + TH - 2 || x === x0 + TW - 2) k = pal.lo;
          if (rnd() < 0.04) k = pal.lo;
          px(g, x, y, k);
        }
        // moss creeping along the seams
        if (moss) for (let i = 0; i < 3; i++) if (rnd() < 0.5) { const mx = x0 + ((rnd() * TW) | 0), my = y0 + TH - 1; if (mx >= 0 && mx < W && my < H && inside(mx, my, rnd)) { px(g, mx, my, moss[(rnd() * moss.length) | 0]); if (rnd() < 0.5 && inside(mx, my - 1, rnd)) px(g, mx, my - 1, moss[0]); } }
      }
    }
  }
  function floorArt(id, a) {
    const key = id + ':' + Math.round(a.x) + ':' + Math.round(a.y) + ':' + a.r;
    if (artCache.has(key)) return artCache.get(key);
    const rnd = rng(Math.round(a.x * 7 + a.y * 13) ^ 0x51a7), r = a.r / PXS;
    let c = null;
    if (id === 'bulu') {
      const W = Math.round(r * 1.2), H = Math.round(r * 0.9); c = canvasOf(W, H); const g = c.getContext('2d');
      const pal = ['#9c9478', '#8f876c', '#a7a083', '#857d63']; pal.hi = '#b9b294'; pal.lo = '#5f5a47';
      const edge = (x, y, rn) => { const d = Math.min(x, y, W - 1 - x, H - 1 - y); return d > 2 || (d >= 0 && rn() < 0.55 + d * 0.15); };
      flagstones(g, W, H, edge, pal, rnd, ['#5f8f3a', '#4a7a2e', '#79a948']);
      for (let i = 0; i < W * H * 0.012; i++) { const x = (rnd() * W) | 0, y = (rnd() * H) | 0; if (edge(x, y, rnd)) px(g, x, y, rnd() < 0.5 ? '#6c9a40' : '#4a7a2e'); } // grass through the cracks
      // vines crossing in from the jungle
      for (let v = 0; v < 4; v++) { let x = rnd() < 0.5 ? 0 : W - 1, y = (rnd() * H) | 0; const dir = x ? -1 : 1; for (let n = 0; n < 18 + rnd() * 20; n++) { px(g, x, y, '#2f5e2a'); if (rnd() < 0.3) px(g, x, y - 1, '#4c8a34'); x += dir; y += rnd() < 0.3 ? 1 : rnd() < 0.3 ? -1 : 0; if (y < 0 || y >= H) break; } }
    } else if (id === 'fini') {
      const W = Math.round(r * 1.4), H = Math.round(r * 1.0); c = canvasOf(W, H); const g = c.getContext('2d');
      const pal = ['#9aa3ab', '#8c959d', '#a6aeb5', '#838b93']; pal.hi = '#bcc4ca'; pal.lo = '#5d646b';
      const inside = (x, y, rn) => { const u = (x - W / 2) / (W / 2), w = (y - H / 2) / (H / 2), d = 1 - Math.hypot(u, w); return d > 0.06 || (d > 0 && rn() < 0.5); };
      flagstones(g, W, H, inside, pal, rnd, ['#6f8f8a', '#5a7672']);
      for (let i = 0; i < W * H * 0.01; i++) { const x = (rnd() * W) | 0, y = (rnd() * H) | 0; if (inside(x, y, rnd)) px(g, x, y, '#cfe6f2'); } // frost-pale glints
    } else if (id === 'lele') {
      const W = Math.round(r * 1.6), H = Math.round(r * 1.2); c = canvasOf(W, H); const g = c.getContext('2d');
      const cols = ['#f7b8d4', '#ffd2e5', '#e98fb9', '#fff0f6'];
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const u = (x - W / 2) / (W / 2), w = (y - H / 2) / (H / 2), d = 1 - Math.hypot(u, w);
        if (d <= 0) continue;
        const dens = Math.min(0.42, d * 0.9); // (a meadow carpeted with petals, thinning at its edge)
        if (rnd() < dens) px(g, x, y, cols[(rnd() * 3) | 0]);
      }
      for (let i = 0; i < W * H * 0.004; i++) { // little five-petal flowers
        const x = 2 + ((rnd() * (W - 4)) | 0), y = 2 + ((rnd() * (H - 4)) | 0), u = (x - W / 2) / (W / 2), w = (y - H / 2) / (H / 2);
        if (Math.hypot(u, w) > 0.85) continue;
        const k = cols[(rnd() * 3) | 0]; px(g, x - 1, y, k); px(g, x + 1, y, k); px(g, x, y - 1, k); px(g, x, y + 1, k); px(g, x, y, '#ffe36e');
      }
    } else if (id === 'koko') {
      const rg = a.o.ring, R1 = rg ? rg.r1 / PXS + 2 : r + 2, W = Math.ceil(R1 * 2), H = Math.ceil(R1 * 2 * 0.98); c = canvasOf(W, H); const g = c.getContext('2d');
      const cx = W / 2, cy = H / 2;
      // the scorched plateau
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const u = (x - cx) / r, w = (y - cy) / (r * 0.8), d = 1 - Math.hypot(u, w);
        if (d <= 0) continue;
        if (d < 0.05 && rnd() < 0.5) continue;
        const n = rnd(); px(g, x, y, n < 0.12 ? '#3b3742' : n < 0.24 ? '#1e1b23' : '#2b2830');
      }
      // lightning-scorched cracks, glowing faintly
      for (let i = 0; i < 6; i++) {
        const t0 = i / 6 * 6.283; let x = cx, y = cy;
        const pts = [[cx + Math.cos(t0) * r * 0.5, cy + Math.sin(t0) * r * 0.4], [cx + Math.cos(t0 + 0.3) * r * 0.8, cy + Math.sin(t0 + 0.3) * r * 0.64]];
        for (const [qx, qy] of pts) {
          const steps = 4; for (let k = 1; k <= steps; k++) { const nx = x + (qx - x) / (steps - k + 1) + (k < steps ? (rnd() - 0.5) * 6 : 0), ny = y + (qy - y) / (steps - k + 1) + (k < steps ? (rnd() - 0.5) * 6 : 0); line(g, x + 1, y + 1, nx + 1, ny + 1, '#6b5a22'); line(g, x, y, nx, ny, '#f2d24a'); x = nx; y = ny; }
        }
      }
      // the cliff's edge: a band of dark rock with a lit rim, open where the ramp climbs
      if (rg) {
        const r0 = rg.r0 / PXS, r1 = rg.r1 / PXS;
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
          const dx = x - cx, dy = (y - cy) / 0.98, d = Math.hypot(dx, dy);
          if (d < r0 - 1 || d > r1 + 1) continue;
          let da = Math.atan2(dy, dx) - rg.gap; da = Math.atan2(Math.sin(da), Math.cos(da));
          if (Math.abs(da) < rg.gapW) { if (d > r0 && d < r1 && rnd() < 0.5) px(g, x, y, '#4a4650'); continue; } // (the ramp: worn stone)
          const t = (d - r0) / (r1 - r0);
          let k = t < 0.12 ? '#6a6872' : t < 0.25 ? '#4a4652' : t > 0.88 ? '#141218' : '#2a2830';
          if (rnd() < 0.08) k = '#3a3640';
          if (d < r0 || d > r1) { if (rnd() < 0.5) continue; }
          px(g, x, y, k);
        }
      }
    }
    artCache.set(key, c); if (artCache.size > 12) artCache.delete(artCache.keys().next().value);
    return c;
  }
  // Blossomveil's standing stones: tall carved menhirs with a softly glowing pink rune, petals and grass at the foot
  const stoneC = [];
  function stoneArt(i) {
    const v = i % 3; if (stoneC[v]) return stoneC[v];
    const A = [
      '....oooo....', '...oLLLMo...', '..oLLLMMMo..', '..oLLMMMMo..', '.oLLMMMMMDo.', '.oLLMpMMMDo.', '.oLLMpPpMDo.',
      '.oLLMMpMMDo.', '.oLLMMpMMDo.', '.oLLMpMpMDo.', '.oLLMMMMMDo.', '.oLLMMMMDDo.', '.oLLMMMMMDo.', '.oLMMpMMMDo.',
      '.oLMMMpPMDo.', '.oLMMMMpMDo.', '.oLLMMMMDDo.', 'oLLMMMMMMDDo', 'oLMMMMMMDDDo', 'oGgMMMMMDDGo', 'ogGgMMMDGgGo',
      'gGgfgGgGfgGg', '.gGgGfGgGg..', '..g..g..g...',
    ];
    const P = { o: '#2b2633', L: '#b9b3c4', M: '#918aa0', D: '#6a6479', p: '#ff7ab8', P: '#ffd0e6', g: '#7fb85a', G: '#5a9a42', f: '#ff9cd2' };
    // (three slightly different stones: a different rune each)
    const rows = A.map((r) => r);
    if (v === 1) { rows[5] = '.oLLMMpMMDo.'; rows[6] = '.oLLMpPpMDo.'; rows[9] = '.oLLMpMpMDo.'; rows[13] = '.oLMMMMMMDo.'; rows[14] = '.oLMMpPpMDo.'; }
    if (v === 2) { rows[6] = '.oLLMPpPMDo.'; rows[7] = '.oLLMpMpMDo.'; rows[8] = '.oLLMMpMMDo.'; rows[14] = '.oLMMpMpMDo.'; }
    const c = canvasOf(12, rows.length), g = c.getContext('2d');
    rows.forEach((row, y) => { for (let x = 0; x < 12; x++) { const k = P[row[x]]; if (k) px(g, x, y, k); } });
    return (stoneC[v] = c);
  }
  // the Red and Blue Orbs, in pixels (8x8 art pixels)
  const orbC = [];
  function orbArt(i) {
    if (orbC[i]) return orbC[i];
    const A = ['..oooo..', '.oLHMMo.', 'oLHMMMDo', 'oHMMMMDo', 'oMMMMDDo', 'oMMMDDDo', '.oDDDDo.', '..oooo..'];
    const P = i === 0 ? { o: '#5a1410', H: '#ffffff', L: '#ff9a80', M: '#e0402e', D: '#a02418' } : { o: '#10245a', H: '#ffffff', L: '#9ac4ff', M: '#2f6fe0', D: '#1c47a8' };
    const c = canvasOf(8, 8), g = c.getContext('2d');
    A.forEach((row, y) => { for (let x = 0; x < 8; x++) { const k = P[row[x]]; if (k) px(g, x, y, k); } });
    return (orbC[i] = c);
  }
  // a vine-wrapped jungle pillar with Tapu Bulu's red-and-gold band (16x34 art pixels)
  let pillarC = null;
  function pillarArt() {
    if (pillarC) return pillarC;
    const ART = [
      '..oooooooooooo..', '.oggLLLLLLLLMMo.', 'oGgLLLLLLLLLMMDo', 'oMMMMMMMMMMMMDDo', '.ooDDDDDDDDDDoo.',
      '..oLLMMMMMMDDo..', '..oLLMMvMMMDDo..', '..oLvMMMvMMDDo..', '..ovLMMMMvMDDo..', '..oLLMMMMMvDDo..',
      '..okkkkkkkkkko..', '..oyrrryyrrryo..', '..orryykkyyrro..', '..oyrrryyrrryo..', '..okkkkkkkkkko..',
      '..oLLMMMMMMDDo..', '..oLLMkMMkMDDo..', '..oLLMMMMMMDDo..', '..oLLMkkkkMDDo..', '..oLLMMMMMMDDo..',
      '..oLvMMMMMMDDo..', '..oLLvMMMMMDDo..', '..oLLMvMMMMgDo..', '..oLLMMvMMgGDo..', '..ogLMMMvgGGDo..',
      '..oggMMMMgGGDo..', '..oGgLMMggGGDo..', '..oGggMgggGGGo..', '..oGGgggggGGGo..',
      '.ooDDDDDDDDDDoo.', 'oLLLLMMMMMMMMDDo', 'oMMMMMMMMMMMDDDo', 'oDDDDDDDDDDDDDDo', '.oooooooooooooo.',
    ];
    const PAL = { o: '#1f2622', L: '#9aa58f', M: '#737f6d', D: '#535d52', g: '#7cb04a', G: '#4c7f34', v: '#2f5e2a', r: '#c9452f', y: '#e9c34a', k: '#2c332e' };
    pillarC = canvasOf(16, ART.length); const g = pillarC.getContext('2d');
    ART.forEach((row, y) => { for (let x = 0; x < row.length; x++) { const k = PAL[row[x]]; if (k) px(g, x, y, k); } });
    return pillarC;
  }
  function drawUnder(ctx) {
    if (!on()) return;
    const cam = AI.R.Camera;
    for (const id of Object.keys(DEX)) {
      const a = arena(id);
      if (!a || !cam.sees(a.x, a.y, a.r + 120)) continue;
      ctx.save();
      if (id === 'koko') {
        // the cliff-top: a scorched, cracked plateau, and the cliff's edge with its ramp (pixel art, [Gard v91])
        blit(ctx, floorArt(id, a), a.x, a.y);
      } else if (id === 'lele') {
        blit(ctx, floorArt(id, a), a.x, a.y);
        for (let i = 0; i < 9; i++) { const t0 = i / 9 * 6.283; blit(ctx, stoneArt(i), a.x + Math.cos(t0) * a.r * 0.82, a.y + Math.sin(t0) * a.r * 0.62, true); }
      } else if (id === 'bulu') {
        // the ruined plaza: mossy flagstones, vine-wrapped pillars and the old statue
        blit(ctx, floorArt(id, a), a.x, a.y);
        for (const [dx, dy] of [[-0.55, -0.4], [0.55, -0.4], [-0.55, 0.4], [0.55, 0.4], [0, -0.45]]) {
          if (dy < 0 && dx === 0) { if (AI.Art) AI.Art.draw(ctx, 'g_statue', a.x, a.y + dy * a.r, { scale: 1 }); }
          else blit(ctx, pillarArt(), a.x + dx * a.r, a.y + dy * a.r, true);
        }
      } else if (id === 'fini') {
        // the Summit of Two Orbs
        blit(ctx, floorArt(id, a), a.x, a.y);
        const s = sea();
        pedestals().forEach((q, i) => {
          const id2 = i === 0 ? 'red' : 'blue';
          ctx.fillStyle = '#6f6c66'; ctx.fillRect(q[0] - 12, q[1] - 26, 24, 26);
          ctx.fillStyle = '#8d8a83'; ctx.fillRect(q[0] - 15, q[1] - 30, 30, 6);
          if (s && s.has(id2) && won('fini')) return; // (taken)
          const g = ctx.createRadialGradient(q[0], q[1] - 38, 0, q[0], q[1] - 38, 22);
          const c = i === 0 ? '255,80,60' : '70,140,255';
          g.addColorStop(0, 'rgba(' + c + ',0.9)'); g.addColorStop(1, 'rgba(' + c + ',0)');
          ctx.fillStyle = g; ctx.fillRect(q[0] - 22, q[1] - 60, 44, 44);
          blit(ctx, orbArt(i), q[0], q[1] - 38 + Math.round(Math.sin(AI.time * 2 + i) * 2));
        });
      }
      ctx.restore();
    }
  }
  function drawAir(ctx) {
    if (!on()) return;
    for (const f of st.fx) {
      if (f.kind !== 'petal') continue;
      f.x += f.vx * 0.016; f.y += f.vy * 0.016; f.vy += 0.3;
      ctx.fillStyle = 'rgba(255,170,210,' + Math.min(1, f.life - f.t).toFixed(2) + ')';
      ctx.fillRect(Math.round(f.x), Math.round(f.y), 3, 2);
    }
    const A = st.actor;
    if (A && A.alpha > 0.01) {
      ctx.save();
      const y = A.y - (A.z || 0);
      const c = COL[st.scene ? st.scene.id : 'koko'];
      const g = ctx.createRadialGradient(A.x, y - 30, 0, A.x, y - 30, 80);
      g.addColorStop(0, c + '55'); g.addColorStop(1, c + '00');
      ctx.fillStyle = g; ctx.fillRect(A.x - 80, y - 110, 160, 160);
      try { A.a.draw(ctx, A.x, y, { alpha: A.alpha }); } catch (e) { /* ignore */ }
      ctx.restore();
    }
  }
  function drawScreen(ctx, w, h) {
    if (!on() || st.dim <= 0.01) return;
    ctx.save();
    const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.7);
    g.addColorStop(0, 'rgba(4,6,14,0)'); g.addColorStop(1, 'rgba(4,6,14,' + st.dim.toFixed(3) + ')');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
  function lights(out) {
    if (!on()) return;
    const A = st.actor;
    if (A && st.scene) out.push({ x: A.x, y: A.y - 30, r: 150, c: st.scene.id === 'koko' ? [255, 236, 120] : st.scene.id === 'lele' ? [255, 170, 220] : st.scene.id === 'bulu' ? [170, 240, 120] : [150, 220, 255], i: 0.8 });
    const b = st.battle;
    if (b && !b.e.dead) out.push({ x: b.e.x, y: b.e.y - 30, r: 110, c: b.id === 'koko' ? [255, 236, 120] : b.id === 'lele' ? [255, 170, 220] : b.id === 'bulu' ? [170, 240, 120] : [150, 220, 255], i: 0.45 });
    const a = arena('fini');
    if (a && !won('fini')) pedestals().forEach((q, i) => out.push({ x: q[0], y: q[1] - 38, r: 60, c: i === 0 ? [255, 90, 70] : [80, 150, 255], i: 0.6 }));
  }
  function reset() { st.scene = null; st.battle = null; st.actor = null; st.cool = {}; st.dim = 0; st.fx.length = 0; }

  // (the jungle islands' ruins use the same pillar: 34-ocean-draw.js)
  try { if (AI.Art && AI.Art.addSheet && document.createElement('canvas').getContext) { AI.Art.addSheet(pillarArt().toDataURL(), { jungle_pillar: [0, 0, 16, 34] }); AI.Art.addSheet(stoneArt(0).toDataURL(), { blossom_stone: [0, 0, 12, 24] }); AI.Art.addSheet(stoneArt(1).toDataURL(), { blossom_stone_b: [0, 0, 12, 24] }); } } catch (e) { /* ignore */ }
  AI.define('Guardians', { st, DEX, tick, busy, done, won, arena, pedestals, startScene, drawUnder, drawAir, drawScreen, lights, reset });
})();
