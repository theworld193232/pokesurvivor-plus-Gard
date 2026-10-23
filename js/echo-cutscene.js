/* ECHO'S CUT-IN: "Our Bond" (LoverGare's Mega Gardevoir only) - js/mega-native.js plays it when Mega Gardevoir
   runs out of hearts (once per run; she comes back at full HP, still Mega). About 14 seconds:
     1) the camera zooms in on her in the game; cut-in: Mega Gardevoir takes the final hit and staggers
     2) she turns white, shrinks back into Gardevoir, and faints - she falls on her stomach, dust puffs up
     3) J: "Not like this, Echo!..."  - she lies there breathing weakly, her hand twitches, she tries to lift her head
        and drops it again
     4) J: "I BELIEVE IN YOU... SHOW THEM OUR BOND"  - she lifts her head, pushes up to her knees, trembles... and stands
     5) close-up: she tucks her chin, rocks float up around her, her eye starts to glow...
     6) ROAR: impact frames, her cry, head thrown back, arms flung out, gown blown back, shockwaves, the floor cracks
     7) Mega Evolution: rainbow light wraps her in a glowing shell that cracks and shatters
     8) Mega Gardevoir: slow push-in, she tucks her chin and roars too ("Echo refused to give up!")
   The artwork is rigged (head, arms and gown move separately) and always moving a little, like a Gen 5 sprite.
   She can't be hurt and wild Pokemon are frozen while it plays.
   Pictures: assets/fx/echo-cutin.png and assets/fx/echo-mega-cutin.png. Cry: assets/cries/282.mp3 */
(() => {
  'use strict';
  if (window.PS_ECHO_CUTSCENE) return;
  const B = () => window.PS_MEGA_BRIDGE_V5, E = () => window.PS_HOOPA_ENGINE;
  // ---- timeline (seconds) ----
  const T = { cut: 0.7, hit: 0.85, white: 1.45, revert: 2.0, unwhite: 2.15, fall: 2.55, land: 3.05,
    line1: 3.2, twitch: 4.1, tryLift: 4.5, tryDrop: 5.15, line2: 5.6, lift: 5.9, kneel: 6.7, rise: 6.7, stand: 7.6, risen: 8.25,
    push: 8.4, tuck: 8.6, charge: 8.85, roar: 9.4, exitA: 10.25, realMega: 3.0, megaIn: 10.3, irid: 10.75, dark: 11.2, crack: 11.6, shatter: 12.1, mShow: 12.15, mTuck: 13.0, mRoar: 13.4, fade: 15.1, end: 15.7 };
  const LINES = [
    { who: 'J', text: 'Not like this, Echo!...', a: T.line1, b: T.line2 - 0.15, top: true },
    { who: 'J', text: 'I BELIEVE IN YOU... SHOW THEM OUR BOND', a: T.line2, b: T.push, top: true, big: true },
    { who: 'Echo', text: 'Echo refused to give up!', a: T.mRoar + 0.35, b: T.end, top: false },
  ];
  // ---- rigs: where the head, arms and gown are in each picture (pixels of the picture) ----
  const RIGS = {
    g: { src: 'assets/fx/echo-cutin.png?v=1', neck: [58, 47], neckY: 48, feet: [72, 132], waveY: 82, eye: [57, 29],
         arms: [{ x: 0, y: 58, w: 41, h: 27, p: [41, 63], s: -1 }, { x: 76, y: 54, w: 40, h: 33, p: [77, 60], s: 1 }] },
    m: { src: 'assets/fx/echo-mega-cutin.png?v=1', neck: [64, 44], neckY: 45, feet: [57, 154], waveY: 72, eye: [64, 25],
         arms: [] },
  };
  for (const R of Object.values(RIGS)) { R.img = new Image(); R.img.src = R.src; }
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const ease = u => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
  const seg = (t, a, b) => ease((t - a) / (b - a));
  const back = u => { u = clamp(u, 0, 1); const c = 1.9; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); };   // overshoot
  const bump = (t, a, b) => (t <= a || t >= b) ? 0 : Math.sin((t - a) / (b - a) * Math.PI);
  const lerp = (a, b, u) => a + (b - a) * u;
  let run = null;

  function build(R) {   // body without head/arms, plus white / pink / red copies
    const W = R.img.naturalWidth, H = R.img.naturalHeight; R.W = W; R.H = H;
    const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
    const base = mk(), bg = base.getContext('2d'); bg.drawImage(R.img, 0, 0); bg.clearRect(0, 0, W, R.neckY); for (const a of R.arms) bg.clearRect(a.x, a.y, a.w, a.h);
    const tint = (src, col) => { const c = mk(), g = c.getContext('2d'); g.drawImage(src, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, W, H); return c; };
    R.v = {}; for (const [k, col] of [['w', '#fff'], ['p', '#ff8fd4'], ['r', '#ff3355']]) R.v[k] = { img: tint(R.img, col), base: tint(base, col) };
    R.v.n = { img: R.img, base };
    // outline points of her body (no arms), to keep her standing / lying ON the floor
    const d = base.getContext('2d').getImageData(0, 0, W, H).data, hd = (() => { const c = mk(), g = c.getContext('2d'); g.drawImage(R.img, 0, 0); return g.getImageData(0, 0, W, H).data; })();
    R.pts = []; for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) { const i = (y * W + x) * 4 + 3; if ((y < R.neckY ? hd[i] : d[i]) > 128) R.pts.push([x, y]); }
  }
  // The pose is drawn at the picture's own pixel size, then scaled up crisp (moves in pixel steps, like Gen 5 sprites).
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
    g.drawImage(V.base, 0, R.neckY, W, R.waveY - R.neckY, 0, R.neckY, W, R.waveY - R.neckY);
    const amp = q.wave || 0, blow = q.blow || 0;
    const gs = q.gs || 0, fl = q.flare || 0, fx = R.feet[0];   // gown: squashed flat while she lies, flares out when she powers up
    for (let yy = R.waveY; yy < H; yy++) { const k = Math.pow((yy - R.waveY) / (H - R.waveY), 1.3), m = (1 - gs) * (1 + fl * k);
      const dx = Math.round(Math.sin(t * 3.1 + yy * 0.13) * amp * k + blow * k * k * 14); g.drawImage(V.base, 0, yy, W, 1, Math.round(dx + fx - fx * m), yy, Math.round(W * m), 1); }
    for (const a of R.arms) { const ang = ((q.arms || 0) * (R === RIGS.m ? 0.45 : 1)) * a.s + (a.s < 0 ? (q.armL || 0) : (q.armR || 0)) * -a.s + (q.armJit || 0) * Math.sin(t * 38 + a.s * 2);
      g.save(); g.translate(a.p[0], a.p[1]); g.rotate(ang); if (q.armLen) g.scale(q.armLen, q.armLen);
      const ov = 5, sx0 = a.s < 0 ? a.x : a.x - ov, sw = a.w + ov;   /* a few pixels of her shoulder come along, so the arm never looks cut off */
      g.drawImage(V.img, sx0, a.y, sw, a.h, sx0 - a.p[0], a.y - a.p[1], sw, a.h); g.restore(); }
    // head: bent row by row from the neck up (never comes apart from her body):
    //   q.head > 0 = chin tucked down/forward, < 0 = head thrown back; headSy squashes / stretches it; headDy nods it
    const nY = R.neckY, sy = q.headSy || 1, lean = (q.head || 0) * 0.9, nod = q.headDy || 0;
    const rowAt = u => [Math.round(-u * lean), nY - u * sy + nod * (u / nY)];   // u = rows above the neck -> [dx, y]
    for (let y = 0; y <= nY; y++) { const u = nY - y, [dx, yy] = rowAt(u); g.drawImage(V.img, 0, y, W, 1, dx, Math.round(yy), W, Math.max(1, Math.ceil(sy + 0.6))); }
    if ((q.eye || 0) > 0.01 && (!v || v === 'n')) {
      const e = q.eye, ue = nY - R.eye[1], [edx, ey] = rowAt(ue), ex = R.eye[0] + edx;
      g.save(); g.globalCompositeOperation = 'lighter';
      const rg = g.createRadialGradient(ex, ey, 0, ex, ey, 7 * e + 2); rg.addColorStop(0, 'rgba(255,255,255,' + e + ')'); rg.addColorStop(0.35, 'rgba(255,120,200,' + (0.8 * e) + ')'); rg.addColorStop(1, 'rgba(255,60,160,0)');
      g.fillStyle = rg; g.beginPath(); g.arc(ex, ey, 7 * e + 2, 0, Math.PI * 2); g.fill();
      g.strokeStyle = 'rgba(255,200,240,' + (0.7 * e) + ')'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(ex - 14 * e, ey); g.lineTo(ex + 14 * e, ey); g.moveTo(ex, ey - 6 * e); g.lineTo(ex, ey + 6 * e); g.stroke();
      g.restore();
    }
  }

  function cry(rate, vol) { try { const a = new Audio('assets/cries/282.mp3'); a.volume = vol == null ? 0.8 : vol; a.playbackRate = rate || 1; a.preservesPitch = false; a.play().catch(() => {}); } catch (_) {} }
  function sfx(n) { try { B().audio?.sfx?.(n); } catch (_) {} }

  function play(p, opts) {
    const ok = Object.values(RIGS).every(R => R.img.complete && R.img.naturalWidth);
    if (run || !ok) return false;
    for (const R of Object.values(RIGS)) if (!R.v) build(R);
    const cv = document.createElement('canvas'); cv.id = 'ps-echo-cut';
    cv.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;z-index:2147483600;pointer-events:auto;opacity:0';
    document.body.append(cv);
    const gc = document.getElementById('game'); const was = gc ? { t: gc.style.transform, o: gc.style.transformOrigin, f: gc.style.filter, tr: gc.style.transition } : null;
    run = { p, opts: opts || {}, t: 0, cv, gc, was, fired: {}, last: performance.now(), dust: [], shards: [], cracks: [], rocks: [], puffs: [] };
    if (gc) { const r = gc.getBoundingClientRect(); gc.style.transformOrigin = (r.width / 2) + 'px ' + (r.height * 0.5) + 'px'; gc.style.transition = 'transform .7s cubic-bezier(.35,0,.2,1), filter .7s'; gc.style.transform = 'scale(2.8)'; gc.style.filter = 'saturate(.5) brightness(.85)'; }
    try { p.anim.play('Hurt', { hold: true }); } catch (_) {}
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
    try { const p = r.p; p.invuln = Math.max(Number(p.invuln) || 0, 2.5); p.hp = p.maxHp; p.anim.play('Shoot', { speed: 1.2 });
      const b = B(); b.fx.ring(p.x, p.y, 10, 220, '#ff9ad8', 0.8, 8); b.fx.burst(p.x, p.y - 20, '#ffd0f0', 40, 280); b.fx.dmgText(p.x, p.y - (p.bodyH || 40) - 30, 'Echo refused to give up!', '#ff9ad8'); } catch (_) {}
    try { r.opts.done && r.opts.done(); } catch (_) {}
  }
  function frame(now) {
    if (!run) return;
    const dt = Math.min(0.05, (now - run.last) / 1000); run.last = now;
    freeze();
    // after her roar the cut-in steps aside: the game's own Mega Evolution plays, then the cut-in comes back for Mega Gardevoir
    if (run.waitUntil) {
      if (now < run.waitUntil) { requestAnimationFrame(frame); return; }
      run.waitUntil = 0; run.t = T.mShow - 0.1; run.cv.style.transition = 'opacity .2s'; run.cv.style.opacity = '1';
    }
    if (!run.fired.exitA && run.t + dt >= T.exitA) {
      run.fired.exitA = true; run.t = T.exitA;
      run.cv.style.transition = 'opacity .3s'; run.cv.style.opacity = '0';
      const r = run; if (r.gc && r.was) { r.gc.style.transition = 'transform .35s, filter .35s'; r.gc.style.transform = r.was.t; r.gc.style.filter = r.was.f; }
      setTimeout(() => { try { r.opts.mega && r.opts.mega(); } catch (e) { console.warn('[echo-cut] mega', e); } }, 380);
      run.waitUntil = now + 380 + T.realMega * 1000; requestAnimationFrame(frame); return;
    }
    run.t += dt; const t = run.t;
    if (!run.fired.exitA || t >= T.mShow - 0.1) run.cv.style.opacity = t < T.cut ? '0' : t >= T.fade ? String(Math.max(0, 1 - (t - T.fade) / (T.end - T.fade))) : '1';
    if (t >= T.hit) once('hurt', () => { sfx('hurt'); cry(1.12, 0.55); });
    if (t >= T.land) once('land', () => sfx('bossDown'));
    if (t >= T.roar) once('cry1', () => cry(1));
    if (t >= T.crack) once('crk', () => sfx('select'));
    if (t >= T.mRoar) once('cry2', () => cry(0.84));
    if (t >= T.end) { finish(); return; }
    if (t >= T.cut) draw(t, dt);
    requestAnimationFrame(frame);
  }

  // ---------------- one frame of the cut-in ----------------
  function draw(t, dt) {
    const cv = run.cv, W = cv.width = Math.round(innerWidth), H = cv.height = Math.round(innerHeight), g = cv.getContext('2d');
    g.imageSmoothingEnabled = false;
    const megaEnd = t >= T.mShow, megaStart = t < T.revert, mega = megaEnd || megaStart, R = mega ? RIGS.m : RIGS.g;
    const ground = H * 0.8, cx = W / 2, sc = (H * (mega ? 0.52 : 0.41)) / R.H;   // Gardevoir's picture is drawn bigger than Mega's: scaled so they match
    const q = { t, wave: 1.2, rot: 0, sx: 1, sy: 1, head: 0, headDy: 0, headSy: 1, arms: 0, eye: 0, blow: 0, armJit: 0 };
    let bodyX = cx, bodyY = ground, white = 0, red = 0, idle = 1;
    if (megaStart) {
      // the final hit: recoil, stagger, then she turns white
      const hit = bump(t, T.hit, T.hit + 0.35);
      q.rot = hit * 0.07 + bump(t, T.hit + 0.35, T.white) * -0.03; bodyX = cx + hit * 18 + Math.sin(t * 50) * 3 * hit;
      q.head = -hit * 0.12; q.arms = -hit * 0.5; q.wave = 1 + hit * 3; q.blow = -hit * 0.6;
      red = hit; white = seg(t, T.white, T.revert - 0.05);
      q.sy = 1 - white * 0.04; idle = 1 - hit;
    } else if (!megaEnd) {
      // ---- Gardevoir: white -> faint -> lying -> kneel -> stand -> tuck -> roar -> Mega ----
      white = 1 - seg(t, T.unwhite, T.unwhite + 0.4);
      // her body angle: 0 standing, -1.57 lying on her stomach (head to the left)
      const fall = clamp((t - T.fall) / (T.land - T.fall), 0, 1);
      const push = seg(t, T.kneel, T.kneel + 0.75);                       // pushes her chest up with her arms
      const stand = back((t - T.stand) / (T.risen - T.stand));             // then up onto her feet
      let rot = -1.57 * fall * fall;                                        // falls forward, faster and faster
      if (t >= T.kneel) rot = lerp(-1.57, -0.9, push);
      if (t >= T.stand) rot = lerp(-0.9, 0, stand);
      rot += Math.sin(t * 34) * 0.012 * bump(t, T.kneel + 0.75, T.stand);  // trembling with the effort
      const lie = clamp(-rot / 1.57, 0, 1), hop = bump(t, T.land, T.land + 0.22) * 10;
      q.rot = rot; q.gs = 0.45 * clamp((lie - 0.4) / 0.6, 0, 1);         // the gown lies flat on the floor (her body keeps its shape)
      { // keep her on the floor: the lowest corner of her (rotated) body touches the ground, and she stays centred
        const c = Math.cos(rot), sn = Math.sin(rot), fx = R.feet[0], fy = R.feet[1];
        let low = -1e9, lo = 1e9, hi = -1e9;
        for (const [px, py] of R.pts) { const x = (py >= R.waveY ? (px - fx) * (1 - q.gs) : px - fx), y = py - fy, X = x * c - y * sn, Y = x * sn + y * c;
          if (Y > low) low = Y; if (X < lo) lo = X; if (X > hi) hi = X; }
        bodyX = cx - (lo + hi) / 2 * sc; bodyY = ground - low * sc - hop; }
      if (t > T.fall && t < T.land) { q.armL = -0.5 * fall; q.armR = -0.4 * fall; q.head = 0.15 * fall; }
      // lying: weak breathing, a twitch of her hand, a failed try to lift her head, then the real one
      const lying = lie;
      q.sy = 1 + Math.sin(t * 2.3) * 0.014 * lying;
      if (t > T.twitch && t < T.tryLift) q.armJit = 0.07 * bump(t, T.twitch, T.tryLift);
      q.head += (-0.32 * bump(t, T.tryLift, T.tryDrop + 0.15) - 0.38 * seg(t, T.lift, T.lift + 0.45)) * lying;
      q.headDy += bump(t, T.tryDrop, T.tryDrop + 0.2) * 2 * lying;
      // arms: flat on the floor -> hands planted under her -> arms straighten and push her up
      const plant = seg(t, T.lift + 0.2, T.kneel), down = t < T.stand ? 1 : 1 - seg(t, T.stand, T.risen);
      q.armL = (q.armL || 0) + lerp(-0.55, -1.05, plant) * down * (t >= T.land ? 1 : 0) + 0.5 * push * down;   // the arm under her presses into the floor
      q.armR = (q.armR || 0) + lerp(-0.35, -1.25, plant) * down * (t >= T.land ? 1 : 0) + 0.45 * push * down;  // the other arm reaches down and pushes too
      q.armLen = 1 + 0.18 * push * down;                                     // arms straighten as she pushes
      q.armJit += bump(t, T.kneel + 0.75, T.stand) * 0.06;
      q.wave = 0.6 + lerp(0, 3.4, bump(t, T.stand, T.risen + 0.3)) + 0.4 * lying;
      if (t < T.unwhite + 0.4) q.wave = 0.4;
      // chin tuck -> roar
      const tuck = seg(t, T.tuck, T.tuck + 0.4) * (1 - seg(t, T.roar - 0.04, T.roar + 0.06));
      const roar = seg(t, T.roar, T.roar + 0.1) * (1 - seg(t, T.megaIn, T.megaIn + 0.4));
      q.head += tuck * 0.14 - roar * 0.16; q.headDy += tuck * 2 - roar * 1.5; q.headSy *= 1 - tuck * 0.05 + roar * 0.04;
      q.sy *= 1 - tuck * 0.03 + roar * 0.05; q.sx *= 1 + tuck * 0.03;
      // the charge: arms slowly spread wide to the sides, gown flaring out, swaying with the power (then the roar)
      const charge = seg(t, T.charge, T.roar - 0.05) * (1 - seg(t, T.megaIn + 0.2, T.megaIn + 0.7));
      q.arms += tuck * 0.12 - charge * 0.42 - roar * 0.16 + roar * Math.sin(t * 30) * 0.02;
      q.flare = charge * 0.22 + roar * 0.12; q.rot += Math.sin(t * 2.2) * 0.025 * charge;
      q.blow = roar * 0.6; q.wave += roar * 2.5 + charge * 1.5;
      q.eye = Math.max(seg(t, T.tuck, T.roar) * 0.9, roar, bump(t, T.lift, T.lift + 0.6) * 0.5);
      if (t > T.megaIn) q.eye = Math.max(q.eye, 0.6);
      white = Math.max(white, seg(t, T.megaIn, T.crack));
      idle = clamp(1 - lying * 1.5, 0, 1);
    } else {
      const tuck = seg(t, T.mTuck, T.mTuck + 0.3) * (1 - seg(t, T.mRoar - 0.04, T.mRoar + 0.06));
      const roar = seg(t, T.mRoar, T.mRoar + 0.1) * (1 - seg(t, T.mRoar + 1.1, T.mRoar + 1.5));
      q.sy = 1 - tuck * 0.03 + roar * 0.05; q.sx = 1 + tuck * 0.03 + roar * 0.02;
      q.head = tuck * 0.15 - roar * 0.18; q.headDy = tuck * 2 - roar * 2; q.headSy = 1 - tuck * 0.05 + roar * 0.04;
      const mc = seg(t, T.mTuck + 0.15, T.mRoar) * (1 - seg(t, T.mRoar + 1.2, T.mRoar + 1.7));
      q.arms = tuck * 0.2 - roar * 0.7; q.wave = 1 + roar * 2.5 + mc; q.blow = roar * 0.5; q.flare = mc * 0.12 + roar * 0.1;
      q.eye = Math.max(0.15 + 0.1 * Math.sin(t * 4), seg(t, T.mTuck, T.mRoar) * 0.8, roar * 0.8);
      white = 1 - seg(t, T.mShow, T.mShow + 0.6);
    }
    // Gen 5 style idle: always moving a little
    { const w = 2 * Math.PI * 0.95 * t;
      q.head += Math.sin(w) * 0.03 * idle; q.headDy += Math.sin(w + 0.7) * 0.9 * idle; q.arms += Math.sin(w + 1.3) * 0.07 * idle;
      q.sy *= 1 + Math.sin(w) * 0.018 * idle; q.sx *= 1 - Math.sin(w) * 0.008 * idle; q.wave += 0.6 * idle; }
    // ---- virtual camera ----
    let zoom = 1, fy = 0.5;
    if (megaStart) zoom = lerp(1.3, 1.1, seg(t, T.cut, T.white)) + bump(t, T.hit, T.hit + 0.3) * 0.08;
    else if (!megaEnd) {
      zoom = lerp(1.1, 1.0, seg(t, T.revert, T.fall));
      const low = seg(t, T.land, T.land + 0.6) * (1 - seg(t, T.kneel, T.stand)); zoom = lerp(zoom, 1.35, low); fy = lerp(0.5, 0.15, low);   // down on the floor with her
      const push = seg(t, T.push, T.tuck + 0.45) * (1 - seg(t, T.roar, T.roar + 0.18));
      zoom = lerp(zoom, 2.1, push); fy = lerp(fy, 0.82, push);
      if (t > T.roar) zoom *= 1 + 0.06 * (1 - seg(t, T.roar, T.roar + 0.6));
    } else {
      zoom = lerp(1.08, 1.32, seg(t, T.mShow, T.fade));
      const push = seg(t, T.mTuck - 0.1, T.mTuck + 0.3) * (1 - seg(t, T.mRoar, T.mRoar + 0.18)); zoom = lerp(zoom, 2.0, push); fy = lerp(0.55, 0.86, push);
      if (t > T.mRoar) zoom *= 1 + 0.07 * (1 - seg(t, T.mRoar, T.mRoar + 0.6));
    }
    const focusY = lerp(bodyY - R.H * sc * fy, ground - R.W * sc * 0.25, 0), shakeA = shake(t);
    const camX = (Math.random() - 0.5) * shakeA, camY = (Math.random() - 0.5) * shakeA;
    // ---- background ----
    const bgC = g.createRadialGradient(cx, H * 0.55, 10, cx, H * 0.55, Math.max(W, H) * 0.75);
    const sad = !mega && t < T.lift, hot = t > T.roar;
    bgC.addColorStop(0, megaEnd ? '#7a3a8e' : megaStart ? '#4a2a55' : hot ? '#6e2f63' : sad ? '#2a2236' : '#3e2340'); bgC.addColorStop(0.6, sad ? '#100c18' : '#1a0c20'); bgC.addColorStop(1, '#050208');
    g.fillStyle = bgC; g.fillRect(0, 0, W, H);
    g.save();
    g.translate(cx + camX, focusY + camY); g.scale(zoom, zoom); g.translate(-cx, -focusY);
    if (megaEnd) aurora(g, cx, H, W, t, 1 - seg(t, T.mShow + 1.6, T.mShow + 3.2));
    speedLines(g, cx, bodyY - R.H * sc * 0.55, W, H, t, megaEnd);
    g.fillStyle = 'rgba(255,154,216,.09)'; g.beginPath(); g.ellipse(cx, ground, W * 0.32, H * 0.055, 0, 0, Math.PI * 2); g.fill();
    cracks(g, cx, ground, t, W);
    // light rain while she's down
    if (sad && t > T.land) rain(g, W, H, t, seg(t, T.land, T.line1 + 0.5) * (1 - seg(t, T.line2, T.lift + 0.6)));
    if (!mega && t > T.tuck) aura(g, bodyX, bodyY - R.H * sc * 0.5, R.H * sc, t, '#ff9ad8', seg(t, T.tuck, T.roar) * (t > T.megaIn ? 0.5 : 1));
    if (!mega && t > T.lift && t < T.tuck) aura(g, bodyX, bodyY - R.H * sc * 0.3, R.H * sc * 0.7, t, '#ff9ad8', 0.35 * seg(t, T.lift, T.stand));
    if (megaEnd) aura(g, bodyX, bodyY - R.H * sc * 0.48, R.H * sc, t, '#ffd6f5', 0.7 + 0.3 * seg(t, T.mRoar, T.mRoar + 0.2));
    rocks(g, cx, ground, t, dt);
    const roarT = megaEnd ? T.mRoar : T.roar;
    if (t > roarT && t < roarT + 0.7) { const u = (t - roarT) / 0.7; for (let k = 1; k <= 3; k++) { g.globalAlpha = 0.28 * (1 - u) / k; rig(g, R, q, bodyX - k * 10 * (1 - u), bodyY + k * 2, sc * (1 + k * 0.05 * (1 - u)), 'p'); } g.globalAlpha = 1; }
    // her (crossfading white silhouettes while she shrinks from Mega back to Gardevoir)
    if (t > T.revert - 0.25 && t < T.revert + 0.25) {
      const u = seg(t, T.revert - 0.25, T.revert + 0.25), Rm = RIGS.m, Rg = RIGS.g, qq = { t, wave: 0.5 };
      g.globalAlpha = 1 - u; rig(g, Rm, qq, cx, ground, (H * 0.52) / Rm.H * lerp(1, 0.85, u), 'w');
      g.globalAlpha = u; rig(g, Rg, qq, cx, ground, (H * 0.41) / Rg.H * lerp(1.15, 1, u), 'w'); g.globalAlpha = 1;
    } else {
      rig(g, R, q, bodyX, bodyY, sc, 'n');
      if (red > 0.01) { g.globalAlpha = 0.6 * red; rig(g, R, q, bodyX, bodyY, sc, 'r'); g.globalAlpha = 1; }
      if (white > 0.01) { g.globalAlpha = Math.min(1, white) * ((t > T.megaIn && t < T.shatter) ? 0.85 + 0.15 * Math.sin(t * 50) : 1); rig(g, R, q, bodyX, bodyY, sc, 'w'); g.globalAlpha = 1; }
      if (!mega && t > T.roar && t < T.roar + 0.5) { g.globalAlpha = 0.4 * (1 - (t - T.roar) / 0.5); rig(g, R, q, bodyX, bodyY, sc, 'p'); g.globalAlpha = 1; }
    }
    if (t > T.white && t < T.revert + 0.3) sparkleRing(g, cx, ground - H * 0.25, H * 0.3, t);
    puffs(g, dt, t, cx, ground, R.H * sc);
    if (t > roarT) shock(g, bodyX, bodyY - R.H * sc * 0.65, t - roarT, megaEnd ? '#ffffff' : '#ffb6e6');
    if (!mega && t > T.megaIn) sphere(g, bodyX, bodyY - R.H * sc * 0.5, R.H * sc, t);
    shards(g, dt);
    particles(g, W, H, ground, t, dt, megaEnd);
    g.restore();
    // red flash on the final hit
    const rf = bump(t, T.hit, T.hit + 0.3); if (rf > 0) { g.fillStyle = 'rgba(255,40,80,' + (0.35 * rf) + ')'; g.fillRect(0, 0, W, H); }
    for (const rt of [T.hit, T.roar, T.mRoar]) if (t >= rt && t < rt + 0.1) impact(g, W, H, t - rt < 0.05);
    const fl = t > T.shatter - 0.08 && t < T.mShow + 0.45 ? 1 - Math.abs(t - T.shatter) / 0.5 : 0;
    if (fl > 0) { g.fillStyle = 'rgba(255,255,255,' + clamp(fl, 0, 1) + ')'; g.fillRect(0, 0, W, H); }
    const wf = bump(t, T.revert - 0.15, T.revert + 0.2); if (wf > 0) { g.fillStyle = 'rgba(255,255,255,' + (0.7 * wf) + ')'; g.fillRect(0, 0, W, H); }
    if (t < T.cut + 0.15) { g.fillStyle = 'rgba(255,255,255,' + (1 - (t - T.cut) / 0.15) + ')'; g.fillRect(0, 0, W, H); }
    // desaturate while she's down
    if (sad && t > T.land) { g.save(); g.globalCompositeOperation = 'saturation'; g.fillStyle = 'rgba(128,128,128,' + (0.55 * seg(t, T.land, T.line1) * (1 - seg(t, T.lift, T.stand))) + ')'; g.fillRect(0, 0, W, H); g.restore(); }
    const bar = H * 0.1 * seg(t, T.cut, T.cut + 0.3) * (1 - seg(t, T.fade, T.end));
    g.fillStyle = '#000'; g.fillRect(0, 0, W, bar); g.fillRect(0, H - bar, W, bar);
    for (const L of LINES) if (t >= L.a && t < L.b) caption(g, W, H, bar, L.who, L.text, t - L.a, L.top, L.big, L.b - t);
    if (t > T.mShow + 0.2 && t < T.fade) title(g, W, H, bar, t - T.mShow - 0.2);
    vignette(g, W, H);
  }
  function shake(t) {
    if (t > T.hit && t < T.hit + 0.4) return 14 * (1 - (t - T.hit) / 0.4);
    if (t > T.land && t < T.land + 0.3) return 10 * (1 - (t - T.land) / 0.3);
    if (t > T.stand && t < T.stand + 0.25) return 5;
    if (t > T.tuck && t < T.roar) return 2.5 * seg(t, T.tuck, T.roar);
    if (t > T.roar && t < T.roar + 0.9) return (1 - (t - T.roar) / 0.9) * 16;
    if (t > T.crack && t < T.shatter) return 4;
    if (t > T.shatter && t < T.shatter + 0.5) return 20 * (1 - (t - T.shatter) / 0.5);
    if (t > T.mRoar && t < T.mRoar + 1) return (1 - (t - T.mRoar)) * 18;
    return 0;
  }
  function rain(g, W, H, t, a) {
    if (a <= 0) return; g.save(); g.strokeStyle = 'rgba(180,170,220,' + (0.35 * a) + ')'; g.lineWidth = 1.5; g.beginPath();
    for (let i = 0; i < 90; i++) { const x = (i * 97.3 + t * 140) % (W + 100) - 50, y = ((i * 53.7 + t * 900) % (H + 60)) - 30; g.moveTo(x, y); g.lineTo(x - 6, y + 22); }
    g.stroke(); g.restore();
  }
  function sparkleRing(g, x, y, r, t) {
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2 + t * 3, d = r * (0.6 + 0.4 * Math.sin(t * 5 + i)); g.fillStyle = 'rgba(255,255,255,.9)'; const s = 3 + (i % 3) * 2; g.fillRect(x + Math.cos(a) * d - s / 2, y + Math.sin(a) * d * 0.8 - s / 2, s, s); }
    g.restore();
  }
  function puffs(g, dt, t, x, y, h) {
    if (t >= T.land && !run.fired.puff) { run.fired.puff = true; for (let i = 0; i < 26; i++) { const a = Math.PI + Math.random() * Math.PI, v = 60 + Math.random() * 200; run.puffs.push({ x: x - h * 0.4 + Math.random() * h * 0.9, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.35, r: 6 + Math.random() * 12, life: 0.8 + Math.random() * 0.6 }); } }
    const P = run.puffs; g.save();
    for (let i = P.length - 1; i >= 0; i--) { const s = P[i]; s.life -= dt; if (s.life <= 0) { P.splice(i, 1); continue; } s.x += s.vx * dt; s.y += s.vy * dt; s.vx *= 0.94; s.vy *= 0.94; s.r += 18 * dt;
      g.globalAlpha = Math.min(0.5, s.life * 0.6); g.fillStyle = '#b8a4b8'; g.beginPath(); g.arc(s.x, s.y, s.r, 0, Math.PI * 2); g.fill(); }
    g.restore();
  }
  function rocks(g, x, y, t, dt) {   // pebbles float up while she powers up, then get blasted away by the roar
    const Rk = run.rocks;
    if (t > T.tuck && t < T.roar && Rk.length < 24 && Math.random() < 0.35) Rk.push({ x: x + (Math.random() - 0.5) * 520, y: y + Math.random() * 10, vy: -(20 + Math.random() * 40), vx: 0, s: 3 + Math.random() * 7, rot: Math.random() * 6, life: 9 });
    if (t >= T.roar && !run.fired.blast) { run.fired.blast = true; for (const r of Rk) { const a = Math.atan2(r.y - (y - 120), r.x - x); r.vx = Math.cos(a) * 900; r.vy = Math.sin(a) * 700; r.life = 0.8; } }
    g.save();
    for (let i = Rk.length - 1; i >= 0; i--) { const r = Rk[i]; r.life -= dt; if (r.life <= 0) { Rk.splice(i, 1); continue; } r.x += r.vx * dt; r.y += r.vy * dt; r.vy *= t < T.roar ? 0.985 : 1; r.rot += dt * 2;
      g.save(); g.translate(r.x, r.y + Math.sin(t * 3 + r.s) * 3); g.rotate(r.rot); g.fillStyle = '#5a4a5e'; g.fillRect(-r.s / 2, -r.s / 2, r.s, r.s); g.fillStyle = '#8a7690'; g.fillRect(-r.s / 2, -r.s / 2, r.s, r.s * 0.35); g.restore(); }
    g.restore();
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
  // Mega Evolution sphere: swirling pink energy -> rainbow -> dark with pink bands -> glowing cracks -> burst
  function sphere(g, x, y, h, t) {
    if (t > T.shatter) return;
    const grow = back((t - T.megaIn) / 0.45), r = h * 0.66 * clamp(grow, 0, 1.2), dark = seg(t, T.dark, T.crack), irid = seg(t, T.irid, T.dark) * (1 - dark);
    if (r < 2) return;
    // energy pouring in before it closes
    if (t < T.megaIn + 0.4) { g.save(); g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2 + t * 3, d = h * 1.4 * (1 - seg(t, T.megaIn, T.megaIn + 0.4));
      g.strokeStyle = 'rgba(255,170,230,.6)'; g.lineWidth = 4; g.beginPath(); g.moveTo(x + Math.cos(a) * (d + 80), y + Math.sin(a) * (d + 80)); g.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d); g.stroke(); } g.restore(); }
    g.save(); g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.clip();
    // base colour
    const bg = g.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.05, x, y, r);
    if (dark < 0.5) { bg.addColorStop(0, '#ffffff'); bg.addColorStop(0.45, '#ffb3e8'); bg.addColorStop(1, '#e65fbd'); }
    else { bg.addColorStop(0, '#5a4a6a'); bg.addColorStop(0.6, '#2b2236'); bg.addColorStop(1, '#120d18'); }
    g.fillStyle = bg; g.fillRect(x - r, y - r, r * 2, r * 2);
    if (dark > 0 && dark < 1) { g.fillStyle = 'rgba(30,20,40,' + (dark < 0.5 ? dark * 2 : 1 - (dark - 0.5) * 2) * 0.9 + ')'; g.fillRect(x - r, y - r, r * 2, r * 2); }
    // swirling bands
    g.globalCompositeOperation = dark > 0.5 ? 'source-over' : 'lighter';
    for (let i = 0; i < 11; i++) { const ang = i * 0.57 + t * (1.2 + (i % 3) * 0.5) * (i % 2 ? 1 : -1), ry = r * (0.18 + (i % 4) * 0.08), hue = irid > 0 ? (i * 40 + t * 220) % 360 : 320 + (i % 3) * 12;
      g.save(); g.translate(x, y); g.rotate(ang);
      g.strokeStyle = dark > 0.5 ? 'hsla(320,100%,' + (70 - i) + '%,' + (0.85) + ')' : 'hsla(' + hue + ',100%,' + (irid > 0 ? 72 : 88) + '%,' + (0.35 + 0.25 * Math.sin(t * 6 + i)) + ')';
      g.lineWidth = r * (0.05 + (i % 3) * 0.03); g.lineCap = 'round';
      g.beginPath(); g.ellipse(0, (i % 5 - 2) * r * 0.18, r * 0.95, ry, 0, -1.2 + Math.sin(t * 2 + i), 1.6 + Math.sin(t * 2 + i)); g.stroke(); g.restore(); }
    // her shape faintly inside while it's still bright
    g.restore();
    // rim light
    g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = dark > 0.5 ? 'rgba(255,120,220,.7)' : 'rgba(255,255,255,.85)'; g.lineWidth = 3 + 3 * Math.sin(t * 9);
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke();
    const hl = g.createRadialGradient(x - r * 0.4, y - r * 0.45, 1, x - r * 0.4, y - r * 0.45, r * 0.5); hl.addColorStop(0, 'rgba(255,255,255,.55)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = hl; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    // light streaks shooting off it
    if (t > T.irid) for (let i = 0; i < 3; i++) { const a = t * 1.7 + i * 2.1, l = r * (1.3 + 0.4 * Math.sin(t * 5 + i)); g.strokeStyle = 'rgba(255,240,160,' + (0.5 + 0.3 * Math.sin(t * 11 + i)) + ')'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(x + Math.cos(a) * r * 0.98, y + Math.sin(a) * r * 0.98); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
    g.restore();
    // glowing cracks
    if (t > T.crack) {
      if (!run.net) { run.net = []; const N = 9; for (let i = 0; i < N; i++) { let a = i / N * Math.PI * 2 + Math.random() * 0.3, px = 0, py = 0; const pts = [[0, 0]];
        for (let k = 0; k < 5; k++) { a += (Math.random() - 0.5) * 0.9; const st = 0.2 + Math.random() * 0.12; px += Math.cos(a) * st; py += Math.sin(a) * st; if (px * px + py * py > 1) break; pts.push([px, py]); }
        run.net.push(pts); if (Math.random() < 0.6 && pts.length > 2) { const b = pts[2]; run.net.push([b, [b[0] + Math.cos(a + 1.2) * 0.25, b[1] + Math.sin(a + 1.2) * 0.25]]); } } }
      const c = seg(t, T.crack, T.shatter - 0.08);
      g.save(); g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.clip(); g.lineCap = 'round'; g.lineJoin = 'round';
      for (const pts of run.net) { const n = Math.max(2, Math.ceil(pts.length * c)); g.beginPath(); pts.slice(0, n).forEach((p2, i) => i ? g.lineTo(x + p2[0] * r, y + p2[1] * r) : g.moveTo(x + p2[0] * r, y + p2[1] * r));
        g.strokeStyle = 'rgba(255,190,90,.95)'; g.shadowColor = '#ffb040'; g.shadowBlur = 18; g.lineWidth = 4 + 4 * c; g.stroke(); g.shadowBlur = 0; g.strokeStyle = '#fff6d8'; g.lineWidth = 1.5; g.stroke(); }
      const glow = g.createRadialGradient(x, y, 1, x, y, r); glow.addColorStop(0, 'rgba(255,220,150,' + (0.5 * c) + ')'); glow.addColorStop(1, 'rgba(255,150,60,0)'); g.globalCompositeOperation = 'lighter'; g.fillStyle = glow; g.fillRect(x - r, y - r, r * 2, r * 2);
      g.restore();
    }
    if (t >= T.shatter - 0.02 && !run.fired.sh) { run.fired.sh = true;
      for (let i = 0; i < 46; i++) { const a = Math.random() * Math.PI * 2, v = 300 + Math.random() * 800; run.shards.push({ x: x + Math.cos(a) * r * 0.7, y: y + Math.sin(a) * r * 0.7, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: Math.random() * 6, vr: (Math.random() - 0.5) * 12, s: 8 + Math.random() * 16, life: 0.9 + Math.random() * 0.6, hue: 300 + Math.random() * 60 }); } }
  }
  // the reveal: aurora clouds (green / pink / violet) and falling sparkles behind Mega Gardevoir
  function aurora(g, cx, H, W, t, a) {
    if (a <= 0) return; g.save(); g.globalCompositeOperation = 'lighter';
    const cols = ['rgba(90,255,170,', 'rgba(255,90,200,', 'rgba(160,110,255,', 'rgba(255,220,120,'];
    for (let i = 0; i < 9; i++) { const px = cx + Math.sin(t * 0.6 + i * 1.7) * W * 0.38, py = H * (0.25 + 0.12 * Math.sin(t * 0.8 + i * 2.3)), rr2 = W * (0.16 + 0.05 * (i % 3));
      const gr = g.createRadialGradient(px, py, 1, px, py, rr2); gr.addColorStop(0, cols[i % 4] + (0.32 * a) + ')'); gr.addColorStop(1, cols[i % 4] + '0)'); g.fillStyle = gr; g.fillRect(px - rr2, py - rr2, rr2 * 2, rr2 * 2); }
    for (let i = 0; i < 70; i++) { const px = (i * 137.5 + Math.sin(i) * 40) % W, py = ((i * 61.3 + t * (60 + (i % 5) * 25)) % (H * 0.9)), tw = 0.5 + 0.5 * Math.sin(t * 8 + i);
      g.fillStyle = 'rgba(255,255,255,' + (a * tw) + ')'; const s = 1 + (i % 3); g.fillRect(px, py, s, s); if (i % 7 === 0) { g.fillRect(px - 4, py + s / 2, 8 + s, 1); g.fillRect(px + s / 2, py - 4, 1, 8 + s); } }
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
  function caption(g, W, H, bar, who, text, s, top, big, left) {
    const n = Math.min(text.length, Math.floor(s * (big ? 24 : 30))), fs = Math.round(Math.max(16, H * (big ? 0.04 : 0.032)));
    const bw = Math.min(W - 40, big ? 900 : 780), bh = fs * 2.6, x = (W - bw) / 2, y = top ? bar + 14 : H - bar - bh - 14;
    const a = Math.min(1, s * 4, (left == null ? 1 : left * 4));
    g.save(); g.globalAlpha = a;
    const jx = big && n < text.length ? (Math.random() - 0.5) * 2 : 0;
    g.fillStyle = 'rgba(20,8,24,.88)'; g.strokeStyle = big ? '#ffd0ef' : '#ff9ad8'; g.lineWidth = big ? 4 : 3; rr(g, x + jx, y, bw, bh, 12); g.fill(); g.stroke();
    g.font = '800 ' + Math.round(fs * 0.7) + 'px Pixelify, Fredoka, system-ui, sans-serif'; g.fillStyle = '#ff9ad8'; g.fillText(who, x + 16 + jx, y + fs * 0.9);
    g.font = (big ? '900 ' : '700 ') + fs + 'px Pixelify, Fredoka, system-ui, sans-serif'; g.fillStyle = '#fff';
    if (big) { g.shadowColor = '#ff6fc0'; g.shadowBlur = 12; }
    g.fillText(text.slice(0, n), x + 16 + jx, y + fs * 2.05);
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
  // ---- LoverGare's test panel: Level 50, 1 HP (no hearts), play the cut-in ----
  function levelTo(p, lv) { let n = 0; while ((Number(p.level) || 1) < lv && n++ < 400) { const need = Math.max(1, (Number(p.xpNext) || 1) - (Number(p.xp) || 0)) + 0.01; try { p.gainXp(need / (Number(p.xpMul) || 1) / (Number(p.xpK) || 1) + 0.01); } catch (_) { break; } } }
  function testBtns() {
    const t = document.getElementById('ps-sz-test'); if (!t || t.querySelector('[data-echotest]')) return; t.style.flexWrap = 'wrap'; t.style.maxWidth = '92vw'; t.style.justifyContent = 'center';
    const add = (label, f) => { const b = document.createElement('button'); b.dataset.echotest = '1'; b.textContent = label; b.addEventListener('click', e => { e.stopPropagation(); try { f(B().game.player); } catch (err) { console.warn('[echo test]', err); } }); t.appendChild(b); };
    add('Level 50', p => { if (p) levelTo(p, 50); });
    add('1 HP (no hearts)', p => { if (p) { p.hp = 1; p.lives = 0; } });
    add('Play Our Bond', p => { if (p) play(p, { mode: 'bond' }); });
  }
  setInterval(() => { try { testBtns(); } catch (_) {} }, 1000);
  window.PS_ECHO_CUTSCENE = { play, get playing() { return !!run; }, times: T, rigs: RIGS, _seek: s => { if (run) run.t = s; } };
})();
