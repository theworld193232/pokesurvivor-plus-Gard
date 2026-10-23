/* GIRATINA'S VOID — a Lake Guardians passive, once per run.
   Playing as Uxie, Mesprit or Azelf with BOTH summoned sisters still standing: the hit that would knock you out
   doesn't. The world goes dark at the edges, a creepy void cracks open under you, and Giratina rises out of it —
   bored out of its mind in the Distortion World and itching to vent. It tells you that you suck, that it'll handle
   this, swallows the whole area in a dark void... and every enemy dies instantly. Then it sinks back, and you get up
   with half your HP. Portrait: assets/portraits/487.png (Giratina).
   Solo: the battle freezes while it plays (click / Enter / Space skips to the void). Co-op: nothing freezes, you are
   untouchable while it plays. Arceus during its Judgment is spared (the finale stays a fight). Needs js/lake-trio.js
   and js/lake-talk.js. */
(() => {
  'use strict';
  if (window.PS_GIRATINA_INSTALLED) return; window.PS_GIRATINA_INSTALLED = true;
  const E = () => window.PS_HOOPA_ENGINE, B = () => window.PS_MEGA_BRIDGE_V5, TAU = Math.PI * 2;
  const GIRA = 487, NAME = { 480: 'Uxie', 481: 'Mesprit', 482: 'Azelf' }, CFG = { reviveHp: 0.5 };
  const T = () => window.PS_LAKE_TALK, sfx = n => { try { E().Audio.sfx(n); } catch (_) {} };
  const pick = L => L[Math.floor(Math.random() * L.length)];

  // ================= the script =================  [speaker ('S' you · 'A'/'B' your sisters · 487), face, text, emote]
  const FALL = { 480: [['stunned', 'I... miscalculated...', 'question']], 481: [['stunned', 'Everything\'s... going dark...', 'question']], 482: [['stunned', 'No... not now... I can still...', 'question']] };
  const SISTERS_SCREAM = { 480: [['shouting', 'NO! Stay with us!', 'exclaim']], 481: [['shouting', 'Get up! Please get up!', 'exclaim']], 482: [['shouting', 'HEY! Don\'t you DARE go down!', 'exclaim']] };
  const SENSE = { 480: [['surprised', 'Wait... the air just went cold. Something is coming through.', 'sweat']], 481: [['worried', 'This feeling... it\'s so heavy. And so... bored?', 'sweat']], 482: [['surprised', 'Uh... why is the ground cracking?!', 'sweat']] };
  const GIR_ARRIVE = [['sigh', '...Ugh. You. You actually managed to fall over with BOTH your sisters standing right there.', 'dots'],
    ['angry', 'Do you know how BORING the Distortion World is? Upside-down rocks. Silence. For eons.', 'anger']];
  const GIR_INSULT = [['angry', 'Pathetic. You suck. Step aside — I\'ll handle this.', 'anger'], ['angry', 'You call that fighting? You suck. Move. My turn.', 'anger']];
  const SHOCK = { 480: [['stunned', 'G-Giratina?! But that\'s— the Distortion World doesn\'t just OPEN!', 'exclaim']], 481: [['stunned', 'Giratina?! Oh no, oh no, it looks SO annoyed...', 'exclaim']], 482: [['stunned', 'Giratina?! Since when do YOU care?!', 'exclaim']] };
  const GIR_VENT = [['determined', 'I don\'t. I\'m bored, and I need to break something. These will do.', 'anger'], ['happy', 'Care? No. Venting? Absolutely.', 'note']];
  const GIR_VOID = [['shouting', 'Let the VOID take ALL of you.', 'exclaim'], ['shouting', 'Welcome to MY world. You won\'t be leaving.', 'exclaim']];
  const GIR_AFTER = [['sigh', '...Better. That was almost fun. ALMOST.', 'dots'], ['happy', 'Hmph. Don\'t make me come back here. ...Actually, do. It\'s dull down there.', 'note']];
  const THANKS = { 480: [['teary', 'Thank you... I think? I\'m not sure what just happened.', 'question']], 481: [['teary', 'It was scary... but thank you, Giratina!', 'heart']], 482: [['sigh', '...Did Giratina just call me bad? ...It\'s not wrong. Thanks.', 'dots']] };

  // ================= trigger: the lethal hit, with both sisters up =================
  let cs = null, usedRun = null;
  const sistersUp = () => { const A = window.PS_LAKE?.allies || []; return A.length >= 2 && A.every(a => !a.dead && !a.spawning); };
  let hooked = false;
  function hook() {
    const N = E(); if (hooked || !N || !N.Player || !N.Player.prototype.hurt) return; hooked = true;
    const ph = N.Player.prototype.hurt;
    N.Player.prototype.hurt = function () {
      const me = this === N.Game.player && !this.psLake && [480, 481, 482].includes(Number(this.dex)), wasUp = !this.dead && this.hp > 0;
      const r = ph.apply(this, arguments);
      if (me && wasUp && (this.dead || this.hp <= 0) && !cs && usedRun !== this && sistersUp() && !window.PS_CREATION_RIFT?.active) {
        this.dead = false; this.hp = 1; this.invuln = Math.max(Number(this.invuln) || 0, 3); start(this);   // the hit that would end you... doesn't
      }
      return r;
    };
  }
  function start(p) {
    const N = E(), S = Number(p.dex), sis = [480, 481, 482].filter(d => d !== S);
    usedRun = p; try { N.Sprites.preload([GIRA], 4000, false); } catch (_) {}
    const steps = [], line = (w, l, act) => steps.push({ who: w, face: l[0], text: l[1], emote: l[2], act });
    line('S', pick(FALL[S]), 'fall'); line(sis[0], pick(SISTERS_SCREAM[sis[0]]));
    line(sis[1], pick(SENSE[sis[1]]), 'dark'); steps.push({ act: 'void' }); steps.push({ act: 'rise' });
    line(GIRA, GIR_ARRIVE[0]); line(GIRA, GIR_ARRIVE[1]); line(GIRA, pick(GIR_INSULT));
    line('S', pick(SHOCK[S])); line(GIRA, pick(GIR_VENT)); line(GIRA, pick(GIR_VOID));
    steps.push({ act: 'engulf' }); line(GIRA, pick(GIR_AFTER)); steps.push({ act: 'sink' }); line('S', pick(THANKS[S]), 'up'); steps.push({ act: 'end' });
    const solo = !(N.Coop && N.Coop.active);
    cs = { p, S, steps, i: -1, next: 0, solo, dark: 0, voidT: -1, gira: null, engulf: null, closing: null, fallen: 1 };
    if (solo) { try { B().game.soloHold(true); } catch (_) {} }
    window.PS_GIRATINA.active = true;
  }
  const dur = text => Math.max(2.0, Math.min(4.2, 1.0 + text.length * 0.036));
  function advance() {
    const c = cs; c.i++; const st = c.steps[c.i]; if (!st) return finish();
    if (st.act === 'void') { c.voidT = 0; sfx('toll'); c.next = 1.4; return; }
    if (st.act === 'rise') { c.gira = { t: 0, anim: mk(GIRA) }; sfx('boss'); c.next = 1.3; return; }
    if (st.act === 'engulf') { c.engulf = { t: 0, done: false }; sfx('judge'); c.next = 3.0; return; }
    if (st.act === 'sink') { if (c.gira) c.gira.sink = 0; c.next = 1.2; return; }
    if (st.act === 'end') { c.closing = 0; c.next = 1.0; return; }
    if (st.act === 'dark') c.darkOn = true;
    if (st.act === 'up') { c.fallen = 0; const p = c.p; p.hp = Math.max(p.hp, Math.round(p.maxHp * CFG.reviveHp)); }
    const who = st.who === 'S' ? c.S : st.who, d = dur(st.text); try { T().cut(who, st.face, st.text, st.emote, d); } catch (_) {} c.next = d;
  }
  function finish() {
    const c = cs; if (!c) return; cs = null; window.PS_GIRATINA.active = false; try { T().place(GIRA, null); } catch (_) {}
    if (c.solo) { try { B().game.soloHold(false); } catch (_) {} }
    c.p.hp = Math.max(c.p.hp, Math.round(c.p.maxHp * CFG.reviveHp)); c.p.invuln = Math.max(Number(c.p.invuln) || 0, 2);
  }
  function mk(dex) { try { return new (E().Sprites.Animator)(dex, 1, false); } catch (_) { return null; } }
  // the void swallows the area: every enemy dies on the spot (Arceus during its Judgment is spared)
  function engulfAll() {
    const N = E(), c = cs; let n = 0;
    if (c.solo) { try { B().game.soloHold(false); } catch (_) {} }
    for (const e of N.EnemyMgr.all()) { if (!e || e.dead) continue; if (N.Judgment && N.Judgment.active && Number(e.dex) === 493) continue;
      const k = (Number(e.hp) || 0) + (Number(e.maxHp) || 0) * 10 + 1e6; try { e.hurt(k, '#2a0010', 0, 0, 0); N.Stats.dmg(c.p, 'shadow-force', Math.min(k, Number(e.maxHp) || k)); n++; } catch (_) {} }
    try { B().camera?.kick?.(1.6); } catch (_) {} sfx('quake'); c.killed = n;
  }

  // ================= drawing =================
  const ov = document.createElement('canvas'); ov.id = 'ps-giratina'; ov.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;pointer-events:none;z-index:56;display:none';
  function gameCanvas() { let b = null, ar = 0; for (const c of document.querySelectorAll('canvas')) { if (c.id && c.id.startsWith('ps-')) continue; const r = c.getBoundingClientRect(), a = r.width * r.height; if (a > ar) { ar = a; b = { c, r }; } } return b; }
  const eyes = Array.from({ length: 14 }, () => ({ x: Math.random(), y: Math.random(), p: Math.random() * TAU, s: 0.6 + Math.random() * 0.8 }));
  function draw(dt) {
    const c = cs; if (!c) { if (ov.style.display !== 'none') ov.style.display = 'none'; return; }
    ov.style.display = 'block'; const ctx = ov.getContext('2d'), dpr = Math.min(2, devicePixelRatio || 1), W = innerWidth, H = innerHeight, now = performance.now() / 1000;
    if (ov.width !== Math.round(W * dpr) || ov.height !== Math.round(H * dpr)) { ov.width = Math.round(W * dpr); ov.height = Math.round(H * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    const cam = B()?.camera, g = gameCanvas(); if (!cam || !g || typeof cam.left !== 'function') return;
    const k = cam.scale * (Number(cam._cw) > 0 ? g.r.width / cam._cw : 1), sx = x => g.r.left + (x - cam.left()) * k, sy = y => g.r.top + (y - cam.top()) * k;
    const P = c.p, PX = sx(P.x), PY = sy(P.y), close = c.closing != null ? Math.max(0, 1 - c.closing / 1) : 1;
    // the world going cold: darkness creeping in from the edges, with eyes watching
    if (c.darkOn) { c.dark = Math.min(1, c.dark + dt * 0.6); const d = c.dark * close;
      const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * (0.55 - 0.3 * d), W / 2, H / 2, Math.max(W, H) * 0.75); vg.addColorStop(0, 'rgba(10,0,8,0)'); vg.addColorStop(1, 'rgba(10,0,8,' + (0.92 * d) + ')'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
      for (const e of eyes) { const ex = e.x < 0.5 ? e.x * W * 0.3 : W - (1 - e.x) * W * 0.3, ey = e.y * H, open = Math.max(0, Math.sin(now * 0.9 * e.s + e.p)) * d; if (open < 0.05) continue;
        ctx.save(); ctx.translate(ex, ey); ctx.fillStyle = 'rgba(255,40,60,' + (0.8 * open) + ')'; ctx.shadowColor = '#ff2040'; ctx.shadowBlur = 10; ctx.beginPath(); ctx.ellipse(0, 0, 7 * e.s, 2.5 * e.s * open + 0.5, 0, 0, TAU); ctx.fill(); ctx.restore(); } }
    // the void under you: a black wound in the ground with crimson cracks
    if (c.voidT >= 0) { c.voidT += dt; const o = Math.min(1, c.voidT / 1.2) * close, R = 120 * k * o;
      if (o > 0) { ctx.save(); ctx.translate(PX + 30 * k, PY + 10 * k);
        for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + Math.sin(i * 7) * 0.4, L = R * (1.5 + 0.6 * Math.sin(i * 3.3 + now)); ctx.strokeStyle = 'rgba(220,30,60,' + (0.7 * o) + ')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 0);
          let x = 0, y = 0; for (let j = 1; j <= 5; j++) { x = Math.cos(a + Math.sin(j * 2.1 + i) * 0.35) * L * j / 5; y = Math.sin(a + Math.sin(j * 2.1 + i) * 0.35) * L * j / 5 * 0.45; ctx.lineTo(x, y); } ctx.stroke(); }
        ctx.beginPath(); for (let i = 0; i <= 24; i++) { const a = i / 24 * TAU, rr = R * (0.85 + 0.15 * Math.sin(a * 5 + now * 3)); ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr * 0.4); } ctx.closePath();
        const vg = ctx.createRadialGradient(0, 0, 2, 0, 0, R); vg.addColorStop(0, '#000000'); vg.addColorStop(0.75, '#14000c'); vg.addColorStop(1, '#5a0018'); ctx.fillStyle = vg; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#ff2a4a'; ctx.shadowColor = '#ff2a4a'; ctx.shadowBlur = 16; ctx.stroke(); ctx.restore(); } }
    // Giratina rises out of the void (and sinks back)
    const gi = c.gira; if (gi && gi.anim) { gi.t += dt; const up = Math.min(1, gi.t / 1.2), e = 1 - Math.pow(1 - up, 3), wx = P.x + 30, wy = P.y + 6, sink = gi.sink != null ? Math.min(1, (gi.sink += dt) / 1.0) : 0;
      const X = sx(wx), Y = sy(wy) + (1 - e) * 140 * k + sink * 160 * k, a = 1 - sink;
      try { T().place(GIRA, { x: wx, y: wy - 30, bodyH: 90 }); } catch (_) {}
      if (a > 0) { ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, sy(wy) + 6 * k); ctx.clip();   // it comes up THROUGH the ground
        ctx.globalAlpha = a; ctx.translate(X, Y); ctx.scale(k * 1.6, k * 1.6); ctx.imageSmoothingEnabled = false; try { gi.anim.loop(c.engulf && c.engulf.t < 1.5 ? 'Attack' : 'Idle'); gi.anim.dir = 0; gi.anim.update(dt); gi.anim.draw(ctx, 0, 0, {}); } catch (_) {} ctx.restore(); } }
    // DARK VOID: the darkness pours out of Giratina and swallows everything, then shatters
    const en = c.engulf; if (en) { en.t += dt; const u = Math.min(1, en.t / 1.1), R = Math.hypot(W, H) * u, GX = sx(P.x + 30), GY = sy(P.y - 30);
      if (!en.done && en.t >= 1.1) { en.done = true; engulfAll(); }
      const fade = en.t < 1.6 ? 1 : Math.max(0, 1 - (en.t - 1.6) / 1.2);
      ctx.save(); ctx.globalAlpha = fade; const vg = ctx.createRadialGradient(GX, GY, R * 0.2, GX, GY, R); vg.addColorStop(0, 'rgba(0,0,0,.96)'); vg.addColorStop(0.85, 'rgba(14,0,10,.94)'); vg.addColorStop(1, 'rgba(90,0,30,0)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(255,40,70,.75)'; ctx.lineWidth = 2; for (let i = 0; i < 16; i++) { const a = i / 16 * TAU + now * 0.3; ctx.beginPath(); ctx.moveTo(GX, GY); for (let j = 1; j <= 6; j++) { const rr = R * j / 6; ctx.lineTo(GX + Math.cos(a + Math.sin(j * 1.7 + i) * 0.25) * rr, GY + Math.sin(a + Math.sin(j * 1.7 + i) * 0.25) * rr); } ctx.stroke(); }
      if (en.done && en.t < 1.5) { ctx.fillStyle = 'rgba(255,255,255,' + (1 - (en.t - 1.1) / 0.4) * 0.6 + ')'; ctx.fillRect(0, 0, W, H); }
      if (en.done && c.killed != null && en.t < 2.8) { ctx.globalAlpha = Math.min(1, (2.8 - en.t) / 0.5); ctx.font = '900 ' + Math.round(Math.min(W / 18, 52)) + 'px Pixelify, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 7; ctx.strokeStyle = '#000';
        const tx = 'DARK VOID · ' + c.killed + ' defeated'; ctx.strokeText(tx, W / 2, H * 0.32); ctx.fillStyle = '#ff4a5e'; ctx.fillText(tx, W / 2, H * 0.32); }
      ctx.restore(); }
    if (c.solo && !c.engulf) { ctx.font = '13px Pixelify, system-ui, sans-serif'; ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillText('Click / Enter: skip', W - 14, H - 14); }
  }
  function skip() { const c = cs; if (!c || c.engulf) return; const i = c.steps.findIndex(s => s.act === 'engulf'); if (i < 0) return;
    c.darkOn = true; if (c.voidT < 0) c.voidT = 1.2; if (!c.gira) c.gira = { t: 1.2, anim: mk(GIRA) }; c.i = i - 1; c.next = 0; }
  addEventListener('keydown', e => { if (!cs || !cs.solo) return; const k = (e.key || '').toLowerCase(); if (k === 'enter' || k === ' ' || k === 'escape') { e.preventDefault(); e.stopImmediatePropagation(); skip(); } }, true);
  addEventListener('pointerdown', () => { if (cs && cs.solo) skip(); }, true);

  let last = performance.now();
  function loop(now) { requestAnimationFrame(loop); const dt = Math.min(0.1, (now - last) / 1000); last = now;
    try { hook(); const c = cs;
      if (c) { const g = B()?.game; if (!g || g.player !== c.p || g.state === 'over' || g.state === 'ui') finish();
        else { c.p.invuln = Math.max(Number(c.p.invuln) || 0, 0.5); if (c.fallen) c.p.hp = Math.max(1, Math.min(c.p.hp, 1)); if (c.closing != null) c.closing += dt; c.next -= dt; if (c.next <= 0) advance(); } }
      draw(dt); } catch (e) { console.warn('[giratina]', e); } }
  function init() { document.body.append(ov); requestAnimationFrame(loop); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
  window.PS_GIRATINA = { active: false, cfg: CFG, start: () => { const p = E()?.Game?.player; if (!p || cs) return false; start(p); return true; }, get used() { return usedRun === E()?.Game?.player; },
    get state() { return cs && { step: cs.i, of: cs.steps.length, engulfed: !!(cs.engulf && cs.engulf.done), killed: cs.killed }; } };
})();
