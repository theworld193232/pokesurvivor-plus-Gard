/* WILD EVOLUTION
   Wild Pokemon can evolve in front of you - every now and then, not all the time:
     - when a wild Pokemon appears it's given its own evolution chance, somewhere between 1% and 5%
       (only 15 Pokemon on the field can have one at a time; the rest never evolve);
     - that chance is rolled once when you've worn it down below 55% HP, and once more when you defeat it
       (then it rises again and evolves instead of fainting);
     - at most one evolution starts every 8 seconds.
   It glows, flickers between its old and new size, flashes, and comes back as its evolution with full HP.
   It can't be hurt while it evolves, nor for 0.8 s after (i-frames).
   An evolved one can keep going: it gets a new 1-5% chance for its next form, never a Mega.
   Defeat one that evolved all the way to its FINAL form in front of you and you get its FIRST form, 100%
   (Ralts -> Kirlia -> Gardevoir, beat that Gardevoir -> Ralts). Ones that stopped halfway use the normal 40% drop.
   (Original mode; in Story you catch them instead. Starters, Legendaries, Ultra Beasts and Story-only Pokemon
   never drop, same as js/wild-spawns.js.)
   Older runs, stronger Pokemon: the longer the run goes, the more wild Pokemon show up already evolved
   (a Ralts that spawns can arrive as a Kirlia, later even as a Gardevoir):
     before 3:00 none - 5:00 25% - 10:00 45% - 15:00 60% - 20:00+ 75% (fully evolved: half of that, from 8:00 on).
   Bosses, Legendaries, roamers, raids and den Pokemon never evolve. Off in co-op and on Story Route 1. Every number is in CFG. */
(() => {
  'use strict';
  if (window.PS_WILDEVO_INSTALLED) return; window.PS_WILDEVO_INSTALLED = true;
  const B = () => window.PS_MEGA_BRIDGE_V5, E = () => window.PS_HOOPA_ENGINE;
  const CFG = { hitBelow: 0.55, chance: [0.01, 0.05], maxEvolvers: 15, minGap: 8, iframesAfter: 0.8, dur: 1.9, hpMul: 1.5, maxAtOnce: 3,
    aged: [[180, 0], [300, 0.25], [600, 0.45], [900, 0.6], [1200, 0.75]], agedTwiceFrom: 480, agedHp: [1.3, 1.7] };
  const STARTER_LINE = new Set([1,4,7,152,155,158,252,255,258,387,390,393,495,498,501,650,653,656,722,725,728,810,813,816,906,909,912]);
  const UB = new Set([793, 794, 795, 796, 797, 798, 799, 803, 804, 805, 806]);
  const story = () => !!(window.PS_STORY && window.PS_STORY.on());
  let prev = null;
  const evoPrev = () => { const N = E(); if (!prev && N && N.EVOS) { prev = {}; for (const [f, l] of Object.entries(N.EVOS)) for (const [t] of l || []) prev[t] = Number(f); } return prev || {}; };
  const baseOf = d => { const P = evoPrev(); let x = Number(d), n = 0; while (P[x] != null && n++ < 5) x = P[x]; return x; };
  const special = e => e.boss || e.legend || e.isLegend || e.__roamer || e.__maxRaid || e.__legendDen || e.__wave || e.__psCatch || e.remote || e.shiny;
  function nextForm(dex) {
    const N = E(), L = (N.EVOS[dex] || []).map(x => Number(x[0])).filter(d => N.DEX_BY[d] && N.SPRITE_META[d]);
    return L.length ? L[Math.floor(Math.random() * L.length)] : 0;
  }
  function allowed() {
    const N = E(), g = B()?.game; if (!N || !g || !g.player || g.state !== 'playing') return false;
    if (N.Coop && N.Coop.active) return false; if (N.Rift && N.Rift.inArena) return false;
    if (window.PS_MODES?.run?.mode === 'legend') return false;
    return true;
  }
  const say = (x, y, t, c) => { try { B().fx.dmgText(x, y, t, c || '#fff'); } catch (_) {} };
  const nameOf = d => (E().DEX_BY[d] || {}).name || '???';

  // ---- i-frames: can't be hurt while evolving, and for a moment after ----
  function guard(e, ms) {
    if (!e.__psHurtWrapped && typeof e.hurt === 'function') { const h = e.hurt; e.__psHurtWrapped = true;
      e.hurt = function () { if (this.__psEvolving || (this.__psInvT || 0) > performance.now()) return; return h.apply(this, arguments); }; }
    if (ms) e.__psInvT = performance.now() + ms;
  }
  // ---- evolutions in progress ----
  const live = [];   // { x, y, from, to, t, r0, r1, e (alive enemy or null), sc }
  function begin(e, from, to, dead) {
    if (live.length >= CFG.maxAtOnce) return false;
    lastEvo = performance.now();
    const r0 = Math.max(18, (Number(e.bodyH) || 28) * 0.8);
    const ev = { first: e.__psEvolvedFrom || 0, x: e.x, y: e.y, from, to, t: 0, r0, r1: r0 * 1.35, e: dead ? null : e, bodyH: Number(e.bodyH) || 28 };
    if (!dead) { guard(e); e.__psEvolving = true; ev.spd = e.spd; ev.dmg = e._dmg; e.spd = 0; if (Number.isFinite(e._dmg)) e._dmg = 0; e.stunT = CFG.dur + 0.3; }
    live.push(ev);
    try { B().audio?.sfx?.('levelup'); } catch (_) {}
    return true;
  }
  function finish(ev) {
    const N = E(), W = window.PS_WILD;
    let x = ev.x, y = ev.y;
    if (ev.e) { x = ev.e.x; y = ev.e.y; if (ev.e.dead) return; ev.e.dead = true; ev.e.fade = 0; ev.e.hp = 0; }   // quietly replaced: no EXP for the old one
    if (!W || typeof W.spawn !== 'function') return;
    const before = new Set(N.EnemyMgr.all());
    W.spawn(ev.to, 1, x, y, CFG.hpMul);
    const ne = N.EnemyMgr.all().find(q => !before.has(q) && Number(q.dex) === ev.to);
    if (ne) { guard(ne, CFG.iframesAfter * 1000); ne.__psEvolvedFrom = ev.first || ev.from; ne.__psEvoChecked = !nextForm(ev.to); ne.__psAged = true; ne.flash = 0.4; }   // can evolve again if it has a next form
    try { B().fx.ring(x, y - ev.bodyH * 0.5, 8, 90, '#ffffff', 0.5, 4); B().fx.burst(x, y - ev.bodyH * 0.5, '#fff6c2', 26, 200); } catch (_) {}
    say(x, y - ev.bodyH - 18, nameOf(ev.from) + ' evolved into ' + nameOf(ev.to) + '!', '#9effa8');
    try { B().audio?.sfx?.('shinyGet'); } catch (_) {}
  }
  function hookDraw() {
    const T = E()?.Training; if (!T || T.__psEvoHooked || typeof T.drawables !== 'function') return; T.__psEvoHooked = true;
    const orig = T.drawables;
    T.drawables = function () {
      const r = orig.apply(this, arguments); if (!live.length) return r;
      const extra = live.map(ev => ({ y: (ev.e ? ev.e.y : ev.y) + 0.3, draw(g) { drawEvo(g, ev); } }));
      return [...(r || []), ...extra];
    };
  }
  function drawEvo(g, ev) {
    const u = Math.min(1, ev.t / CFG.dur), x = ev.e ? ev.e.x : ev.x, y = (ev.e ? ev.e.y : ev.y) - ev.bodyH * 0.5;
    // flicker between the old and the new size, faster and faster
    const f = Math.sin(ev.t * (6 + 26 * u)) > 0 ? 1 : 0, r = (f ? ev.r1 : ev.r0) * (0.9 + 0.1 * Math.sin(ev.t * 20));
    g.save();
    g.globalCompositeOperation = 'lighter';
    // light rays
    g.translate(x, y); g.rotate(ev.t * 1.6);
    for (let i = 0; i < 10; i++) { g.rotate(Math.PI / 5); g.fillStyle = 'rgba(255,245,200,' + (0.10 + 0.2 * u) + ')'; g.beginPath(); g.moveTo(0, 0); g.lineTo(r * (2.4 + u), -r * 0.18); g.lineTo(r * (2.4 + u), r * 0.18); g.fill(); }
    g.restore(); g.save(); g.globalCompositeOperation = 'lighter';
    // glowing body (covers the Pokemon like a white silhouette)
    const grd = g.createRadialGradient(x, y, 1, x, y, r * 1.35);
    grd.addColorStop(0, 'rgba(255,255,255,0.95)'); grd.addColorStop(0.55, 'rgba(255,255,240,' + (0.75 + 0.2 * u) + ')'); grd.addColorStop(1, 'rgba(255,230,150,0)');
    g.fillStyle = grd; g.beginPath(); g.ellipse(x, y, r * 1.1, r * 1.35, 0, 0, Math.PI * 2); g.fill();
    // sparkles spiralling in
    for (let i = 0; i < 8; i++) { const a = ev.t * 3 + i * 0.785, d = r * (2.2 - 1.6 * ((ev.t * 0.9 + i / 8) % 1)); g.fillStyle = 'rgba(255,255,255,0.9)'; g.fillRect(x + Math.cos(a) * d - 1.5, y + Math.sin(a) * d * 0.8 - 1.5, 3, 3); }
    if (u > 0.9) { g.fillStyle = 'rgba(255,255,255,' + ((u - 0.9) * 8) + ')'; g.beginPath(); g.arc(x, y, r * 2.4, 0, Math.PI * 2); g.fill(); }
    g.restore();
  }

  // ---- the longer the run, the more already-evolved spawns ----
  const clock = () => { try { const t = E().Game.time; return Number(typeof t === 'function' ? t() : t) || 0; } catch (_) { return 0; } };
  function agedChance(t) { const A = CFG.aged; if (t <= A[0][0]) return 0;
    for (let i = 1; i < A.length; i++) if (t <= A[i][0]) { const [t0, c0] = A[i - 1], [t1, c1] = A[i]; return c0 + (c1 - c0) * (t - t0) / (t1 - t0); }
    return A[A.length - 1][1]; }
  function age(e, t) {
    e.__psAged = true; if (window.PS_ROUTE1 && window.PS_ROUTE1.active()) return;
    const c = agedChance(t); if (!c || Math.random() >= c) return;
    let to = nextForm(Number(e.dex)); if (!to) return; let stage = 1;
    if (t >= CFG.agedTwiceFrom && Math.random() < 0.5) { const to2 = nextForm(to); if (to2) { to = to2; stage = 2; } }
    const W = window.PS_WILD; if (!W || typeof W.spawn !== 'function') return;
    const N = E(), before = new Set(N.EnemyMgr.all());
    if (!W.spawn(to, 1, e.x, e.y, CFG.agedHp[stage - 1])) return;
    for (const q of N.EnemyMgr.all()) if (!before.has(q)) { q.__psAged = true; q.__psEvoChecked = true; }
    e.dead = true; e.fade = 0; e.hp = 0;   // replaced before you ever saw it
  }
  // ---- triggers ----
  let lastEvo = -1e9;
  const gapOk = () => performance.now() - lastEvo >= CFG.minGap * 1000;
  function scan() {
    const now = clock(), L = E().EnemyMgr.all();
    let evolvers = 0; for (const e of L) if (e && !e.dead && e.__psEvoP > 0) evolvers++;
    for (const e of L) {
      if (!e || e.dead || e.__psEvolving || special(e)) continue;
      if (!e.__psAged) { age(e, now); if (e.dead) continue; }
      if (e.__psEvoP === undefined) {   // its own evolution chance, given once when it appears (15 at a time at most)
        e.__psEvoP = 0;
        if (evolvers < CFG.maxEvolvers && nextForm(Number(e.dex))) { e.__psEvoP = CFG.chance[0] + Math.random() * (CFG.chance[1] - CFG.chance[0]); evolvers++; }
      }
      if (e.__psEvoChecked || !(e.__psEvoP > 0)) continue;
      const mx = Number(e.maxHp) || 0; if (!mx || !(Number(e.hp) < mx * CFG.hitBelow)) continue;
      if (!gapOk()) continue;
      e.__psEvoChecked = true;
      if (Math.random() >= e.__psEvoP) continue;
      const to = nextForm(Number(e.dex)); if (to) begin(e, Number(e.dex), to, false);
    }
  }
  function onKill(e) {
    try {
      if (!e || special(e) || !allowed()) return;
      // an evolving one that gets defeated mid-glow: the evolution is cancelled
      const i = live.findIndex(v => v.e === e); if (i >= 0) live.splice(i, 1);
      if (e.__psEvolvedFrom) reward(e);
      if (!e.__psEvolving && e.__psEvoP > 0 && gapOk() && Math.random() < e.__psEvoP) { const to = nextForm(Number(e.dex)); if (to) begin(e, Number(e.dex), to, true); }
    } catch (err) { console.warn('[wild-evo]', err); }
  }
  function reward(e) {
    if (story()) return; const N = E(), S = N.DB.save, d = Number(e.dex), base = baseOf(d);
    if (!N.DEX_BY[base] || UB.has(base) || STARTER_LINE.has(base)) return;
    try { const p = N.DEX_BY[base]; if (p && p.leg) return; if (window.PS_LEGEND_DEX && window.PS_LEGEND_DEX().has(base)) return; } catch (_) {}
    try { const sx = (window.PS_ROUTE1?.wild?.() || []).map(baseOf); if (sx.includes(base)) return; } catch (_) {}
    if (nextForm(d)) return;   // only a FINAL form that evolved in front of you gives its first form for sure
    if (S.owned && S.owned[base]) return;
    N.DB.grant(base, 'wild'); try { N.DB.commit(); } catch (_) {}
    const nm = nameOf(base);
    try { N.Spawner.say('You got ' + nm + '!', 3, true); B().audio?.sfx?.('shinyGet'); } catch (_) {}
    try { window.PS_TOAST && window.PS_TOAST(nm + ' joined you!', 'The ' + e.name + ' that evolved in the wild', { dex: base, ms: 5000 }); } catch (_) {}
  }
  let wrapped = false;
  function wrap() { const P = E()?.Progress; if (wrapped || !P || typeof P.kill !== 'function') return; wrapped = true; const k = P.kill; P.kill = function (e, ...a) { onKill(e); return k.call(this, e, ...a); }; }
  let last = 0;
  function loop(ts) {
    requestAnimationFrame(loop); const dt = Math.min(0.05, last ? (ts - last) / 1000 : 0); last = ts;
    try {
      wrap(); hookDraw();
      const g = B()?.game; if (!g || !g.player || g.state === 'ui' || g.state === 'over') { live.length = 0; return; }
      if (g.state !== 'playing') return;
      if (!allowed()) return;
      scan();
      for (let i = live.length - 1; i >= 0; i--) { const ev = live[i]; ev.t += dt;
        if (ev.e && ev.e.dead) { live.splice(i, 1); continue; }
        if (ev.e) { ev.e.stunT = Math.max(Number(ev.e.stunT) || 0, 0.2); }
        if (ev.t >= CFG.dur) { live.splice(i, 1); finish(ev); } }
    } catch (err) { console.warn('[wild-evo]', err); }
  }
  requestAnimationFrame(loop);
  window.PS_WILD_EVO = { cfg: CFG, live, agedChance, evolve: (e) => { const to = nextForm(Number(e.dex)); return to ? begin(e, Number(e.dex), to, false) : false; } };
})();
