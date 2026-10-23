/* ECHO'S CUT-IN (LoverGare's Gardevoir only) - plays when J's Will saves her (js/mega-native.js):
   Gardevoir is out of hearts at Lv 50+ and not Mega yet. About 9.5 seconds:
     1) in the game, the camera zooms in while she collapses (her own Faint animation)
     2) cut-in: she's lying on her stomach, breathing weakly. Her hand twitches, she lifts her head
        ("We're not done yet, Echo!... Show them our bond!..")
     3) she pushes herself back up (her gown flutters as she rises)
     4) close-up: she tucks her chin and her eye starts to glow...
     5) ROAR: impact frame, her cry, head thrown back, arms flung out, gown blown back, shockwaves, cracks in the ground
     6) Mega Evolution: rainbow light wraps her in a glowing shell that cracks and shatters (the real Mega Evolution
        happens here)
     7) Mega Gardevoir: slow push-in, she tucks her chin and roars too ("Echo refused to give up!")
   The artwork is rigged (head, arms and gown move separately), so it's animated, not a still picture.
   She can't be hurt and wild Pokemon are frozen while it plays.
   Pictures: assets/fx/echo-cutin.png and assets/fx/echo-mega-cutin.png. Cry: assets/cries/282.mp3 */
(() => {
  'use strict';
  if (window.PS_ECHO_CUTSCENE) return;
  const B = () => window.PS_MEGA_BRIDGE_V5, E = () => window.PS_HOOPA_ENGINE;
  // ---- timeline (seconds) ----
  const T = { zoom: 0, cut: 0.95, twitch: 1.9, lift: 2.25, rise: 2.85, risen: 3.6, push: 3.75, tuck: 3.95, roar: 4.45, megaIn: 5.4, crack: 5.95, shatter: 6.35,
    mShow: 6.4, mTuck: 7.25, mRoar: 7.65, fade: 9.2, end: 9.75 };
  // ---- rigs: where the head, arms and gown are in each picture (pixels of the picture) ----
  const RIGS = {
    g: { src: 'assets/fx/echo-cutin.png?v=1', neck: [58, 47], neckY: 48, feet: [72, 132], waveY: 82, eye: [57, 29],
         arms: [{ x: 0, y: 58, w: 41, h: 27, p: [41, 63], s: -1 }, { x: 76, y: 54, w: 40, h: 33, p: [77, 60], s: 1 }] },
    m: { src: 'assets/fx/echo-mega-cutin.png?v=1', neck: [64, 44], neckY: 45, feet: [57, 154], waveY: 72, eye: [64, 25], arms: [] },
  };
  for (const R of Object.values(RIGS)) { R.img = new Image(); R.img.src = R.src; }
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const ease = u => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
  const seg = (t, a, b) => ease((t - a) / (b - a));
  const back = u => { u = clamp(u, 0, 1); const c = 1.9; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); };   // overshoot
  const lerp = (a, b, u) => a + (b - a) * u;
  let run = null;

  function build(R) {   // body without head/arms, plus white and pink copies of everything
    const W = R.img.naturalWidth, H = R.img.naturalHeight; R.W = W; R.H = H;
    const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
    const base = mk(), bg = base.getContext('2d'); bg.drawImage(R.img, 0, 0); bg.clearRect(0, 0, W, R.neckY); for (const a of R.arms) bg.clearRect(a.x, a.y, a.w, a.h);
    const tint = (src, col) => { const c = mk(), g = c.getContext('2d'); g.drawImage(src, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, W, H); return c; };
    R.v = { n: { img: R.img, base }, w: { img: tint(R.img, '#fff'), base: tint(base, '#fff') }, p: { img: tint(R.img, '#ff8fd4'), base: tint(base, '#ff8fd4') }, k: { img: tint(R.img, '#000'), base: tint(base, '#000') } };
  }
  // draw a rig: feet at (x, y), size 'sc' screen px per picture px, in pose 'q'
  // The pose is drawn at the picture's own pixel size first, then scaled up crisp (pixel steps, like Gen 5 sprites).
  const PAD = 24;
  function rig(g, R, q, x, y, sc, v) {
    const W = R.W, H = R.H;
    const off = R.off || (R.off = document.createElement('canvas')); off.width = W + PAD * 2; off.height = H + PAD * 2;
    const o = off.getContext('2d'); o.imageSmoothingEnabled = false; o.save(); o.translate(PAD, PAD); pose(o, R, q, v); o.restore();
    g.save(); g.imageSmoothingEnabled = false; g.translate(x, y); g.rotate(q.rot || 0); g.scale(sc * (q.sx || 1), sc * (q.sy || 1));
    g.drawImage(off, -R.feet[0] - PAD, -R.feet[1] - PAD); g.restore();
  }
  function pose(g, R, q, v) {
    const V = R.v[v || 'n'], W = R.W, H = R.H, t = q.t || 0;
    g.save();
    // body above the gown in one piece, the gown row by row (it waves)
    g.drawImage(V.base, 0, R.neckY, W, R.waveY - R.neckY, 0, R.neckY, W, R.waveY - R.neckY);
    const amp = q.wave || 0, blow = q.blow || 0;
    for (let yy = R.waveY; yy < H; yy++) { const k = Math.pow((yy - R.waveY) / (H - R.waveY), 1.3);
      const dx = Math.round(Math.sin(t * 3.1 + yy * 0.13) * amp * k + blow * k * k * 14); g.drawImage(V.base, 0, yy, W, 1, dx, yy, W, 1); }
    for (const a of R.arms) { const ang = (q.arms || 0) * a.s + (q.armJit || 0) * Math.sin(t * 40 + a.s);
      g.save(); g.translate(a.p[0], a.p[1]); g.rotate(ang); g.drawImage(V.img, a.x, a.y, a.w, a.h, a.x - a.p[0], a.y - a.p[1], a.w, a.h); g.restore(); }
    // head: rotates around the neck (+ = chin down), can dip and squash
    g.save(); g.translate(R.neck[0], R.neck[1] + Math.round(q.headDy || 0)); g.rotate(q.head || 0); g.scale(1, q.headSy || 1);
    g.drawImage(V.img, 0, 0, W, R.neckY + 1, -R.neck[0], -R.neck[1], W, R.neckY + 1);
    if ((q.eye || 0) > 0.01 && (!v || v === 'n')) {   // glowing eye
      const ex = R.eye[0] - R.neck[0], ey = R.eye[1] - R.neck[1], e = q.eye;
      g.globalCompositeOperation = 'lighter';
      const rg = g.createRadialGradient(ex, ey, 0, ex, ey, 9 * e + 2); rg.addColorStop(0, 'rgba(255,255,255,' + e + ')'); rg.addColorStop(0.35, 'rgba(255,120,200,' + (0.8 * e) + ')'); rg.addColorStop(1, 'rgba(255,60,160,0)');
      g.fillStyle = rg; g.beginPath(); g.arc(ex, ey, 9 * e + 2, 0, Math.PI * 2); g.fill();
      g.strokeStyle = 'rgba(255,200,240,' + (0.7 * e) + ')'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(ex - 14 * e, ey); g.lineTo(ex + 14 * e, ey); g.moveTo(ex, ey - 6 * e); g.lineTo(ex, ey + 6 * e); g.stroke();
    }
    g.restore(); g.restore();
  }

  function cry(rate) { try { const a = new Audio('assets/cries/282.mp3'); a.volume = 0.8; a.playbackRate = rate || 1; a.preservesPitch = false; a.play().catch(() => {}); } catch (_) {} }
  function sfx(n) { try { B().audio?.sfx?.(n); } catch (_) {} }

  function play(p, opts) {
    const ok = Object.values(RIGS).every(R => R.img.complete && R.img.naturalWidth);
    if (run || !ok) return false;
    for (const R of Object.values(RIGS)) if (!R.v) build(R);
    const cv = document.createElement('canvas'); cv.id = 'ps-echo-cut';
    cv.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;z-index:2147483600;pointer-events:auto;opacity:0';
    document.body.append(cv);
    const gc = document.getElementById('game'); const was = gc ? { t: gc.style.transform, o: gc.style.transformOrigin, f: gc.style.filter, tr: gc.style.transition } : null;
    run = { p, opts: opts || {}, t: 0, cv, gc, was, fired: {}, last: performance.now(), dust: [], shards: [], petals: [], cracks: [] };
    if (gc) { const r = gc.getBoundingClientRect(); gc.style.transformOrigin = (r.width / 2) + 'px ' + (r.height * 0.5) + 'px'; gc.style.transition = 'transform .95s cubic-bezier(.35,0,.2,1), filter .95s'; gc.style.transform = 'scale(2.8)'; gc.style.filter = 'saturate(.5) brightness(.85)'; }
    try { p.anim.play('Faint', { hold: true }); } catch (_) {}
    requestAnimationFrame(frame);
    return true;
  }
  function freeze() {
    const p = run.p; p.invuln = Math.max(Number(p.invuln) || 0, 1.5); p.reviveShield = Math.max(Number(p.reviveShield) || 0, 1.5);
    try { for (const e of E().EnemyMgr.all()) if (e && !e.dead) e.stunT = Math.max(Number(e.stunT) || 0, 0.6); } catch (_) {}
  }
  function once(k, f) { if (!run.fired[k]) { run.fired[k] = true; try { f(); } catch (e) { console.warn('[echo-cut]', e); } } }
  function finish() {
    const r = run; run = null; if (!r) return;
    if (r.gc && r.was) { r.gc.style.transition = 'transform .4s, filter .4s'; r.gc.style.transform = r.was.t; r.gc.style.filter = r.was.f; setTimeout(() => { r.gc.style.transformOrigin = r.was.o; r.gc.style.transition = r.was.tr; }, 450); }
    r.cv.style.transition = 'opacity .3s'; r.cv.style.opacity = '0'; setTimeout(() => r.cv.remove(), 350);
    try { r.p.invuln = Math.max(Number(r.p.invuln) || 0, 2); r.p.anim.play('Shoot', { speed: 1.2 }); } catch (_) {}
  }
  function frame(now) {
    if (!run) return;
    const dt = Math.min(0.05, (now - run.last) / 1000); run.last = now; run.t += dt; const t = run.t;
    freeze();
    run.cv.style.opacity = t < T.cut ? '0' : t >= T.fade ? String(Math.max(0, 1 - (t - T.fade) / (T.end - T.fade))) : '1';
    if (t >= T.roar) once('cry1', () => cry(1));
    if (t >= T.crack) once('crk', () => sfx('select'));
    if (t >= T.shatter) once('mega', () => { run.opts.mega && run.opts.mega(); });
    if (t >= T.mRoar) once('cry2', () => cry(0.84));
    if (t >= T.end) { finish(); return; }
    if (t >= T.cut) draw(t, dt);
    requestAnimationFrame(frame);
  }

  // ---------------- one frame of the cut-in ----------------
  function draw(t, dt) {
    const cv = run.cv, W = cv.width = Math.round(innerWidth), H = cv.height = Math.round(innerHeight), g = cv.getContext('2d');
    g.imageSmoothingEnabled = false;
    const mega = t >= T.mShow, R = mega ? RIGS.m : RIGS.g;
    const ground = H * 0.8, cx = W / 2, sc = (H * (mega ? 0.52 : 0.5)) / R.H;
    // ---- her pose ----
    const q = { t, wave: 1.2, rot: 0, sx: 1, sy: 1, head: 0, headDy: 0, headSy: 1, arms: 0, eye: 0, blow: 0, armJit: 0 };
    let bodyX = cx, bodyY = ground;
    if (!mega) {
      const up = back((t - T.rise) / (T.risen - T.rise));       // 0 lying -> 1 standing (overshoots a bit)
      const lie = 1 - clamp(up, 0, 1.2);
      q.rot = -lie * 1.57;                                         // lying on her stomach, head to the left
      q.sx = 1 - 0.45 * clamp(lie, 0, 1);                          // gown flat on the floor
      bodyX = cx + lie * R.H * sc * 0.45; bodyY = ground - lie * R.W * sc * q.sx * 0.5;
      q.sy = 1 + Math.sin(t * 2.4) * 0.012 * lie;                  // weak breathing
      q.wave = lerp(0.5, 3.4, seg(t, T.rise, T.rise + 0.25)) * (1 - seg(t, T.risen, T.push)) + 1.1;
      if (t > T.twitch && t < T.rise) q.armJit = 0.05 * (1 - seg(t, T.twitch + 0.4, T.rise));   // hand twitches
      q.arms = -0.5 * lie + 0.25 * seg(t, T.lift, T.rise) * lie;   // arms forward on the ground, pushing up
      q.head = -0.35 * seg(t, T.lift, T.lift + 0.35) * lie;        // lifts her head while lying
      // chin tuck -> roar
      const tuck = seg(t, T.tuck, T.tuck + 0.35) * (1 - seg(t, T.roar - 0.04, T.roar + 0.06));
      const roar = seg(t, T.roar, T.roar + 0.1) * (1 - seg(t, T.megaIn, T.megaIn + 0.4));
      q.head += tuck * 0.16 - roar * 0.2; q.headDy += tuck * 2.5 - roar * 2; q.headSy *= 1 - tuck * 0.05 + roar * 0.04;
      q.sy *= 1 - tuck * 0.03 + roar * 0.05; q.sx *= 1 + tuck * 0.03;
      q.arms += tuck * 0.15 - roar * 0.75 + roar * Math.sin(t * 30) * 0.03;
      q.blow = roar * 1.0; q.wave += roar * 2.5;
      q.eye = Math.max(seg(t, T.tuck, T.roar) * 0.9, roar);
      if (t > T.megaIn) q.eye = Math.max(q.eye, 0.6);
    } else {
      const tuck = seg(t, T.mTuck, T.mTuck + 0.3) * (1 - seg(t, T.mRoar - 0.04, T.mRoar + 0.06));
      const roar = seg(t, T.mRoar, T.mRoar + 0.1) * (1 - seg(t, T.mRoar + 1.1, T.mRoar + 1.5));
      q.sy = 1 + Math.sin(t * 2.2) * 0.01 - tuck * 0.03 + roar * 0.05; q.sx = 1 + tuck * 0.03 + roar * 0.02;
      q.head = tuck * 0.15 - roar * 0.18; q.headDy = tuck * 2 - roar * 2; q.headSy = 1 - tuck * 0.05 + roar * 0.04;
      q.wave = 1 + roar * 2.5; q.blow = roar * 0.8;
      q.eye = Math.max(0.35 + 0.15 * Math.sin(t * 4), seg(t, T.mTuck, T.mRoar), roar);
    }
    // ---- Gen 5 style idle: always moving a little (breathing, head bob, arms swaying, gown flowing) ----
    { const st = mega ? 1 : clamp((t - T.rise) / (T.risen - T.rise), 0, 1), w = 2 * Math.PI * 0.95 * t;
      q.head += Math.sin(w) * 0.03 * st; q.headDy += Math.sin(w + 0.7) * 0.9 * st; q.arms += Math.sin(w + 1.3) * 0.07 * st;
      q.sy *= 1 + Math.sin(w) * 0.018 * st; q.sx *= 1 - Math.sin(w) * 0.008 * st; q.wave += 0.6 * st; }
    // ---- virtual camera: push in on her face for the chin tuck, whip back out on the roar ----
    let zoom = 1, fy = 0.5;
    if (!mega) {
      zoom = lerp(1.25, 1, seg(t, T.cut, T.cut + 0.8));
      const push = seg(t, T.push, T.tuck + 0.4) * (1 - seg(t, T.roar, T.roar + 0.18));
      zoom = lerp(zoom, 2.1, push); fy = lerp(0.5, 0.82, push);
      if (t > T.roar) zoom *= 1 + 0.06 * (1 - seg(t, T.roar, T.roar + 0.6));
    } else {
      zoom = lerp(1.08, 1.32, seg(t, T.mShow, T.fade));
      const push = seg(t, T.mTuck - 0.1, T.mTuck + 0.3) * (1 - seg(t, T.mRoar, T.mRoar + 0.18)); zoom = lerp(zoom, 2.0, push); fy = lerp(0.55, 0.86, push);
      if (t > T.mRoar) zoom *= 1 + 0.07 * (1 - seg(t, T.mRoar, T.mRoar + 0.6));
    }
    const focusY = bodyY - R.H * sc * fy, shakeA = shake(t);
    const camX = (Math.random() - 0.5) * shakeA, camY = (Math.random() - 0.5) * shakeA;
    // ---- background ----
    const bgC = g.createRadialGradient(cx, H * 0.55, 10, cx, H * 0.55, Math.max(W, H) * 0.75);
    const hot = t > T.roar ? 1 : 0;
    bgC.addColorStop(0, mega ? '#7a3a8e' : hot ? '#6e2f63' : '#3e2340'); bgC.addColorStop(0.6, '#1a0c20'); bgC.addColorStop(1, '#050208');
    g.fillStyle = bgC; g.fillRect(0, 0, W, H);
    g.save();
    g.translate(cx + camX, focusY + camY); g.scale(zoom, zoom); g.translate(-cx, -focusY);
    speedLines(g, cx, bodyY - R.H * sc * 0.55, W, H, t, mega);
    // floor
    g.fillStyle = 'rgba(255,154,216,.09)'; g.beginPath(); g.ellipse(cx, ground, W * 0.32, H * 0.055, 0, 0, Math.PI * 2); g.fill();
    cracks(g, cx, ground, t, W);
    // aura
    if (!mega && t > T.tuck) aura(g, bodyX, bodyY - R.H * sc * 0.5, R.H * sc, t, '#ff9ad8', seg(t, T.tuck, T.roar) * (t > T.megaIn ? 0.5 : 1));
    if (mega) aura(g, bodyX, bodyY - R.H * sc * 0.48, R.H * sc, t, '#ffd6f5', 0.7 + 0.3 * seg(t, T.mRoar, T.mRoar + 0.2));
    // afterimages while she roars
    const roarT = mega ? T.mRoar : T.roar;
    if (t > roarT && t < roarT + 0.7) { const u = (t - roarT) / 0.7; for (let k = 1; k <= 3; k++) { g.globalAlpha = 0.28 * (1 - u) / k; rig(g, R, q, bodyX - k * 10 * (1 - u), bodyY + k * 2, sc * (1 + k * 0.05 * (1 - u)), 'p'); } g.globalAlpha = 1; }
    // her
    const whiteness = mega ? 1 - seg(t, T.mShow, T.mShow + 0.6) : seg(t, T.megaIn, T.crack);
    rig(g, R, q, bodyX, bodyY, sc, 'n');
    if (whiteness > 0.01) { g.globalAlpha = Math.min(1, whiteness) * (mega ? 1 : 0.85 + 0.15 * Math.sin(t * 50)); rig(g, R, q, bodyX, bodyY, sc, 'w'); g.globalAlpha = 1; }
    if (!mega && t > T.roar && t < T.roar + 0.5) { g.globalAlpha = 0.4 * (1 - (t - T.roar) / 0.5); rig(g, R, q, bodyX, bodyY, sc, 'p'); g.globalAlpha = 1; }
    // shockwaves
    if (t > roarT) shock(g, bodyX, bodyY - R.H * sc * 0.65, t - roarT, mega ? '#ffffff' : '#ffb6e6');
    // Mega Evolution: rainbow streams -> glowing shell -> cracks -> shatter
    if (!mega && t > T.megaIn) cocoon(g, bodyX, bodyY - R.H * sc * 0.5, R.H * sc, t);
    shards(g, dt);
    particles(g, W, H, ground, t, dt, mega);
    g.restore();
    // impact frames: two flashes of black/white on each roar
    for (const rt of [T.roar, T.mRoar]) if (t >= rt && t < rt + 0.1) impact(g, W, H, t - rt < 0.05);
    // flash when the shell bursts
    const fl = t > T.shatter - 0.08 && t < T.mShow + 0.45 ? 1 - Math.abs(t - T.shatter) / 0.5 : 0;
    if (fl > 0) { g.fillStyle = 'rgba(255,255,255,' + clamp(fl, 0, 1) + ')'; g.fillRect(0, 0, W, H); }
    // opening flash (the cut)
    if (t < T.cut + 0.15) { g.fillStyle = 'rgba(255,255,255,' + (1 - (t - T.cut) / 0.15) + ')'; g.fillRect(0, 0, W, H); }
    // letterbox + captions + title
    const bar = H * 0.1 * seg(t, T.cut, T.cut + 0.3) * (1 - seg(t, T.fade, T.end));
    g.fillStyle = '#000'; g.fillRect(0, 0, W, bar); g.fillRect(0, H - bar, W, bar);
    if (t > T.cut + 0.3 && t < T.risen) caption(g, W, H, bar, 'J', run.opts.line || "We're not done yet, Echo!... Show them our bond!..", t - T.cut - 0.3, true);
    else if (t > T.mRoar + 0.2) caption(g, W, H, bar, 'Echo', run.opts.after || 'Echo refused to give up!', t - T.mRoar - 0.2);
    if (t > T.mShow + 0.2 && t < T.fade) title(g, W, H, bar, t - T.mShow - 0.2);
    vignette(g, W, H);
  }
  function shake(t) {
    if (t > T.roar && t < T.roar + 0.9) return (1 - (t - T.roar) / 0.9) * 16;
    if (t > T.crack && t < T.shatter) return 4;
    if (t > T.shatter && t < T.shatter + 0.5) return 20 * (1 - (t - T.shatter) / 0.5);
    if (t > T.mRoar && t < T.mRoar + 1) return (1 - (t - T.mRoar)) * 18;
    if (t > T.rise && t < T.rise + 0.2) return 4;
    return 0;
  }
  function speedLines(g, x, y, W, H, t, mega) {
    const on = t > T.roar ? 1 : seg(t, T.push, T.tuck) * 0.5; if (on <= 0) return;
    g.save(); g.translate(x, y); const n = 56;
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + Math.floor(t * 20) * 0.37, l0 = Math.min(W, H) * (0.3 + 0.1 * Math.abs(Math.sin(i * 7.3 + Math.floor(t * 20)))), l1 = Math.max(W, H) * 1.2;
      g.strokeStyle = mega ? 'rgba(255,240,255,' + (0.12 * on) + ')' : 'rgba(255,170,220,' + (0.1 * on) + ')'; g.lineWidth = 1 + (i % 4) * 2; g.beginPath(); g.moveTo(Math.cos(a) * l0, Math.sin(a) * l0); g.lineTo(Math.cos(a) * l1, Math.sin(a) * l1); g.stroke(); }
    g.restore();
  }
  function cracks(g, x, y, t, W) {
    const C = run.cracks;
    if ((t >= T.roar && !run.fired.c1) || (t >= T.mRoar && !run.fired.c2)) { run.fired[t >= T.mRoar ? 'c2' : 'c1'] = true;
      for (let i = 0; i < 9; i++) { const a = Math.PI + (i / 8) * Math.PI * 1 + (Math.random() - 0.5) * 0.3, pts = [[x, y]]; let px = x, py = y;
        for (let k = 0; k < 5; k++) { px += Math.cos(a + (Math.random() - 0.5) * 0.8) * W * 0.035; py += Math.sin(a) * -8 + (Math.random() - 0.5) * 6; pts.push([px, py]); } C.push({ pts, t0: t }); } }
    g.save(); g.lineCap = 'round';
    for (const c of C) { const u = clamp((t - c.t0) / 0.25, 0, 1), n = Math.max(2, Math.ceil(c.pts.length * u));
      g.strokeStyle = 'rgba(20,0,20,.75)'; g.lineWidth = 4; g.beginPath(); c.pts.slice(0, n).forEach((p2, i) => i ? g.lineTo(p2[0], p2[1] * 0 + y + (p2[1] - y) * 0.35) : g.moveTo(p2[0], y)); g.stroke();
      g.strokeStyle = 'rgba(255,150,220,.55)'; g.lineWidth = 1.5; g.stroke(); }
    g.restore();
  }
  function aura(g, x, y, h, t, col, a) {
    if (a <= 0) return; g.save(); g.globalCompositeOperation = 'lighter';
    g.globalAlpha = 0.5 * a; const rg = g.createRadialGradient(x, y, h * 0.1, x, y, h * 0.8); rg.addColorStop(0, col); rg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = rg; g.beginPath(); g.ellipse(x, y, h * 0.56 * (1 + 0.05 * Math.sin(t * 11)), h * 0.78, 0, 0, Math.PI * 2); g.fill();
    for (let i = 0; i < 14; i++) { const u = (t * 1.1 + i / 14) % 1, px = x + Math.sin(i * 2.7 + t * 2.2) * h * 0.38, py = y + h * 0.48 - u * h * 1.15;
      g.globalAlpha = 0.75 * a * (1 - u); g.fillStyle = col; g.beginPath(); g.moveTo(px, py - 22 * (1 - u) - 8); g.quadraticCurveTo(px + 7, py, px, py + 10); g.quadraticCurveTo(px - 7, py, px, py - 22 * (1 - u) - 8); g.fill(); }
    g.restore();
  }
  function shock(g, x, y, s, col) {
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 4; k++) { const u = s * 1.5 - k * 0.2; if (u <= 0 || u > 1) continue; g.globalAlpha = (1 - u) * 0.9; g.strokeStyle = col; g.lineWidth = 14 * (1 - u) + 2;
      g.beginPath(); g.ellipse(x, y, 30 + u * 620, 22 + u * 420, 0, 0, Math.PI * 2); g.stroke(); }
    g.restore();
  }
  function cocoon(g, x, y, h, t) {
    const u = seg(t, T.megaIn, T.crack), c = seg(t, T.crack, T.shatter); if (t > T.shatter) return;
    g.save(); g.globalCompositeOperation = 'lighter';
    // rainbow streams spiralling in
    for (let i = 0; i < 7; i++) { const hue = i * 51 + t * 160; g.strokeStyle = 'hsla(' + hue + ',100%,70%,' + (0.65 * (1 - c)) + ')'; g.lineWidth = 5;
      g.beginPath(); for (let k = 0; k <= 30; k++) { const s = k / 30, a = i * 0.9 + t * 4 + s * 5, r = h * (1.2 - u * 0.65) * (1 - s * 0.85); const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r * 0.75; k ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke(); }
    // the shell
    const rx = h * 0.42, ry = h * 0.6, grd = g.createRadialGradient(x, y, 1, x, y, ry);
    grd.addColorStop(0, 'rgba(255,255,255,' + (0.85 * u) + ')'); grd.addColorStop(0.7, 'rgba(255,220,250,' + (0.55 * u) + ')'); grd.addColorStop(1, 'rgba(200,150,255,0)');
    g.fillStyle = grd; g.beginPath(); g.ellipse(x, y, rx * (1 + 0.03 * Math.sin(t * 30) * c), ry, 0, 0, Math.PI * 2); g.fill();
    g.restore();
    // cracks on the shell
    if (c > 0) { g.save(); g.strokeStyle = 'rgba(255,200,255,.95)'; g.lineWidth = 2.5; g.shadowColor = '#ff9ad8'; g.shadowBlur = 10;
      const n = Math.ceil(c * 8); for (let i = 0; i < n; i++) { const a = i * 2.4; let px = x + Math.cos(a) * rx * 0.2, py = y + Math.sin(a) * ry * 0.2; g.beginPath(); g.moveTo(px, py);
        for (let k = 0; k < 4; k++) { px += Math.cos(a + (k % 2 ? 0.5 : -0.5)) * rx * 0.22; py += Math.sin(a + (k % 2 ? 0.5 : -0.5)) * ry * 0.22; g.lineTo(px, py); } g.stroke(); }
      g.restore(); }
    if (t >= T.shatter - 0.02 && !run.fired.sh) { run.fired.sh = true;
      for (let i = 0; i < 40; i++) { const a = Math.random() * Math.PI * 2, v = 300 + Math.random() * 700; run.shards.push({ x: x + Math.cos(a) * rx * 0.6, y: y + Math.sin(a) * ry * 0.6, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: Math.random() * 6, vr: (Math.random() - 0.5) * 12, s: 6 + Math.random() * 14, life: 0.9 + Math.random() * 0.6, hue: Math.random() * 360 }); } }
  }
  function shards(g, dt) {
    const S = run.shards; if (!S.length) return; g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = S.length - 1; i >= 0; i--) { const s = S[i]; s.life -= dt; if (s.life <= 0) { S.splice(i, 1); continue; } s.x += s.vx * dt; s.y += s.vy * dt; s.vx *= 0.96; s.vy *= 0.96; s.r += s.vr * dt;
      g.save(); g.translate(s.x, s.y); g.rotate(s.r); g.globalAlpha = Math.min(1, s.life * 1.5); g.fillStyle = 'hsl(' + s.hue + ',100%,88%)'; g.beginPath(); g.moveTo(0, -s.s); g.lineTo(s.s * 0.5, 0); g.lineTo(0, s.s * 0.6); g.lineTo(-s.s * 0.4, 0); g.closePath(); g.fill(); g.restore(); }
    g.restore();
  }
  function particles(g, W, H, ground, t, dt, mega) {
    const D = run.dust, roused = t > T.rise;
    if (D.length < 90) D.push({ x: Math.random() * W, y: roused ? H + 10 : ground - Math.random() * 30, vy: roused ? -(30 + Math.random() * (mega ? 160 : 70)) : -(4 + Math.random() * 8), vx: (Math.random() - 0.5) * 24,
      life: 2 + Math.random() * 2, c: mega ? 'hsl(' + Math.floor(Math.random() * 360) + ',100%,86%)' : roused ? '#ffc4ea' : '#9b8894', s: roused ? 3 : 2 });
    g.save();
    for (let i = D.length - 1; i >= 0; i--) { const s = D[i]; s.life -= dt; s.x += s.vx * dt; s.y += s.vy * dt; if (s.life <= 0) { D.splice(i, 1); continue; } g.globalAlpha = Math.min(1, s.life) * 0.9; g.fillStyle = s.c; g.fillRect(s.x, s.y, s.s, s.s); }
    g.restore();
  }
  function impact(g, W, H, first) {   // anime impact frame: black / white, the figure inverted
    const snap = document.createElement('canvas'); snap.width = W; snap.height = H; const s = snap.getContext('2d');
    s.drawImage(run.cv, 0, 0); s.globalCompositeOperation = 'difference'; s.fillStyle = '#fff'; s.fillRect(0, 0, W, H);
    g.save(); g.filter = 'grayscale(1) contrast(4)'; g.drawImage(snap, 0, 0); g.filter = 'none';
    if (!first) { g.globalCompositeOperation = 'difference'; g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); }
    g.restore();
  }
  function caption(g, W, H, bar, who, text, s, top) {
    const n = Math.min(text.length, Math.floor(s * 36)), fs = Math.round(Math.max(16, H * 0.032));
    const bw = Math.min(W - 40, 780), bh = fs * 2.6, x = (W - bw) / 2, y = top ? bar + 14 : H - bar - bh - 14;
    g.save(); g.globalAlpha = Math.min(1, s * 4);
    g.fillStyle = 'rgba(20,8,24,.86)'; g.strokeStyle = '#ff9ad8'; g.lineWidth = 3; rr(g, x, y, bw, bh, 12); g.fill(); g.stroke();
    g.font = '800 ' + Math.round(fs * 0.8) + 'px Pixelify, Fredoka, system-ui, sans-serif'; g.fillStyle = '#ff9ad8'; g.fillText(who, x + 16, y + fs * 0.95);
    g.font = '700 ' + fs + 'px Pixelify, Fredoka, system-ui, sans-serif'; g.fillStyle = '#fff'; g.fillText(text.slice(0, n), x + 16, y + fs * 2.05);
    g.restore();
  }
  function title(g, W, H, bar, s) {
    const u = ease(s / 0.35), fs = Math.round(H * 0.05), y = bar + H * 0.075;
    g.save(); g.globalAlpha = u; g.font = '800 ' + fs + 'px Pixelify, Fredoka, system-ui, sans-serif'; g.textAlign = 'center';
    const x = W / 2 + (1 - u) * -60; g.lineWidth = 7; g.strokeStyle = 'rgba(40,0,40,.85)'; g.strokeText('MEGA GARDEVOIR', x, y);
    const gr = g.createLinearGradient(x - fs * 4, 0, x + fs * 4, 0); for (let i = 0; i <= 6; i++) gr.addColorStop(i / 6, 'hsl(' + (i * 50 + s * 120) % 360 + ',100%,88%)');
    g.fillStyle = gr; g.fillText('MEGA GARDEVOIR', x, y); g.restore();
  }
  function vignette(g, W, H) { const v = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.55)'); g.fillStyle = v; g.fillRect(0, 0, W, H); }
  function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  window.PS_ECHO_CUTSCENE = { play, get playing() { return !!run; }, times: T, rigs: RIGS, _seek: s => { if (run) run.t = s; } };
})();
