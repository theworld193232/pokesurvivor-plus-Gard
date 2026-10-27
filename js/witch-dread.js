/* [Gard v80] Witch Gardevoir's MEGA: "Dreadful Evolution" (LoverGare only, with the Witch Gardevoir appearance on)
   Her Mega form takes Giratina's look: black Giratina wings with red spikes, a black head with gold crest pieces,
   a red bow, a grey gown with gold teardrops and a black-and-red stripe down the front.
     - normal Gardevoir -> Giratina's normal colours (black / red / gold / grey)      assets/pokemon/282-mega-witch/
     - shiny Gardevoir  -> shiny Giratina's colours (slate / blue / silver / cream)    assets/pokemon/282-mega-witch-s/
   Her Mega Evolution is replaced by a Dreadful Evolution: dark mist gathers around her, Giratina's shadow rises out
   of it, circles her and dives into her, and she bursts out in her Giratina form with red sparks and black wisps.
   Stats, moves, timing and the rest of Mega Evolution are unchanged; only the look and the cutscene differ.
   (Shiny Gardevoir with the witch appearance also wears the witch outfit before Mega Evolving.) */
(() => {
  'use strict';
  if (window.PS_WITCH_DREAD) return;
  const R = () => window.__PSX_REG__ || window.PS_HOOPA_ENGINE, B = () => window.PS_MEGA_BRIDGE_V5;
  const KEY = { n: '282-mega-witch', s: '282-mega-witch-s' }, BASE = '282-witch', BASE_S = '282-witch-s', FORM = '282-mega';
  const META = { '282-mega-witch': { s: 1, a: {"Idle": {"w": 62, "h": 58, "n": 4, "r": 8, "d": [6, 12, 6, 12], "ax": 30.5, "ay": 37.5}, "Walk": {"w": 62, "h": 50, "n": 4, "r": 8, "d": [8, 12, 8, 12], "ax": 30.5, "ay": 33.5}, "Attack": {"w": 102, "h": 90, "n": 10, "r": 8, "d": [2, 4, 1, 1, 1, 2, 2, 2, 2, 2], "ax": 50.5, "ay": 52.5}, "Shoot": {"w": 62, "h": 58, "n": 10, "r": 8, "d": [2, 2, 2, 2, 2, 2, 2, 2, 2, 2], "ax": 31.5, "ay": 37.5}, "Charge": {"w": 62, "h": 58, "n": 10, "r": 8, "d": [2, 2, 2, 2, 2, 2, 2, 2, 2, 2], "ax": 31.5, "ay": 37.5}, "Hurt": {"w": 70, "h": 66, "n": 2, "r": 8, "d": [2, 8], "ax": 34.5, "ay": 40.5}, "Faint": {"w": 70, "h": 66, "n": 2, "r": 8, "d": [2, 8], "ax": 34.5, "ay": 40.5}, "Appeal": {"w": 70, "h": 58, "n": 8, "r": 8, "d": [1, 6, 1, 4, 5, 4, 5, 4], "ax": 34.5, "ay": 37.5}}, sh: 0 }, '282-mega-witch-s': { s: 1, a: {"Idle": {"w": 62, "h": 58, "n": 4, "r": 8, "d": [6, 12, 6, 12], "ax": 30.5, "ay": 37.5}, "Walk": {"w": 62, "h": 50, "n": 4, "r": 8, "d": [8, 12, 8, 12], "ax": 30.5, "ay": 33.5}, "Attack": {"w": 102, "h": 90, "n": 10, "r": 8, "d": [2, 4, 1, 1, 1, 2, 2, 2, 2, 2], "ax": 50.5, "ay": 52.5}, "Shoot": {"w": 62, "h": 58, "n": 10, "r": 8, "d": [2, 2, 2, 2, 2, 2, 2, 2, 2, 2], "ax": 31.5, "ay": 37.5}, "Charge": {"w": 62, "h": 58, "n": 10, "r": 8, "d": [2, 2, 2, 2, 2, 2, 2, 2, 2, 2], "ax": 31.5, "ay": 37.5}, "Hurt": {"w": 70, "h": 66, "n": 2, "r": 8, "d": [2, 8], "ax": 34.5, "ay": 40.5}, "Faint": {"w": 70, "h": 66, "n": 2, "r": 8, "d": [2, 8], "ax": 34.5, "ay": 40.5}, "Appeal": {"w": 70, "h": 58, "n": 8, "r": 8, "d": [1, 6, 1, 4, 5, 4, 5, 4], "ax": 34.5, "ay": 37.5}}, sh: 0 } };
  let installed = false;
  function install() {
    const r = R(); if (installed || !r || !r.SPRITE_META || !window.PS_FX || !window.PS_FX.styles) return false; installed = true;
    for (const k in META) { r.SPRITE_META[k] = META[k]; try { const C = window.PSXAI_CANON_SIZE; if (C) { C.opaquePx[k] = C.opaquePx['282_mega'] || C.opaquePx[282] || 26; C.heightDm[k] = C.heightDm[282]; } } catch (_) {} }
    register(); wrapCast(); return true;
  }
  const witchOn = p => { try { return !!p && Number(p.dex) === 282 && window.PS_COSMETICS?.selected(282) === BASE; } catch (_) { return false; } };
  const isShiny = p => !!p && (p.shiny || p.anim?.shiny || p.anim?.dex === BASE_S || p.anim?.dex === KEY.s);
  const megaKey = p => isShiny(p) ? KEY.s : KEY.n;
  const baseKey = p => isShiny(p) ? BASE_S : BASE;
  const anim = (key, p) => { const a = new (R().Sprites.Animator)(key, p.scale || p.anim?.scale || 1, false); try { a.dir = p.anim?.dir ?? 0; } catch (_) {} return a; };
  let dread = null;
  const session = p => { try { return window.PS_GARD_MEGA_PRESENTATION?.session(p) || null; } catch (_) { return null; } };   // the player in the middle of a Dreadful Evolution (its look is left alone meanwhile)
  // keep her looking the part: Giratina Mega while Mega, witch outfit otherwise (also when shiny)
  function keepLook() {
    const p = B()?.game?.player; if (!p || p === dread || !witchOn(p)) return;
    const want = String(p.megaForm || '') === FORM ? megaKey(p) : (!p.megaForm ? baseKey(p) : null);
    if (want && p.anim && p.anim.dex !== want) p.anim = anim(want, p);
    // the friend's Mega presentation re-applies its own Mega sprite every tick: hand it ours
    const ses = session(p); if (ses && want && String(p.megaForm || '') === FORM && ses.megaAnim !== p.anim) ses.megaAnim = p.anim;
    if (megaOn(p) && performance.now() - auraSeen > 400) { auraSeen = performance.now(); try { window.PS_FX.cast('witchaura', p, { id: 'witch-aura', fx: {} }); } catch (_) {} }
  }
  function wrapCast() {
    const F = window.PS_FX, cast = F.cast;
    F.cast = function (name, player, move, ...rest) {
      if (name === 'megaevo' && witchOn(player) && F.styles.dreadevo) {
        const fx = Object.assign({}, (move && move.fx) || {}); fx.newAnim = anim(megaKey(player), player); fx.form = fx.form || FORM;
        try { const bk = baseKey(player); if (player.anim && player.anim.dex !== bk) player.anim = anim(bk, player); } catch (_) {}
        return cast.call(this, 'dreadevo', player, Object.assign({}, move, { id: 'dreadful-evolution', fx }), ...rest);
      }
      if (name === 'megaevo' && player && Number(player.dex) === 282) { try { player.invuln = Math.max(Number(player.invuln) || 0, 3.6); } catch (_) {} }
      return cast.call(this, name, player, move, ...rest);
    };
  }
  // ---------------------------------------------------------------- the cutscene
  // 1 dark mist swirls in  2 a towering spirit rises behind her  3 it leans in and pours itself into her
  // 4 the mist condenses into a black orb  5 black and red energy charges it  6 it cracks
  // 7 two red eyes open in the cracks  8 it shatters and she is Mega (Giratina) Gardevoir that same instant
  const TAU = Math.PI * 2, rnd = (a, b) => a + Math.random() * (b - a);
  const T = { spirit: 0.6, lean: 2.3, merged: 3.3, ball: 3.1, charge: 3.9, crack: 5.0, eyes: 5.55, burst: 6.45, end: 8.0 };
  const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), ease = x => { x = cl(x); return x * x * (3 - 2 * x); };
  const kick = k => { try { R().Camera.kick(k); } catch (_) {} };
  const sfx = n => { try { B()?.audio?.sfx?.(n); } catch (_) {} };
  const fx = () => { try { return B()?.fx || R().FX; } catch (_) { return null; } };
  function cry(rate) { try { const a = new Audio('assets/cries/282.mp3'); a.volume = 0.8; a.playbackRate = rate; a.preservesPitch = false; a.play().catch(() => {}); } catch (_) {} }
  const glow = (ctx, x, y, r, c0, c1) => { if (r <= 0) return; const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, c0); g.addColorStop(1, c1 || 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); };
  // a soft smoke puff: dark body, violet rim, a faint highlight
  function puff(ctx, x, y, r, a) {
    if (r <= 0 || a <= 0) return;
    const g = ctx.createRadialGradient(x - r * 0.25, y - r * 0.3, r * 0.05, x, y, r);
    g.addColorStop(0, 'rgba(58,40,78,' + 0.9 * a + ')'); g.addColorStop(0.45, 'rgba(26,16,36,' + 0.85 * a + ')'); g.addColorStop(0.85, 'rgba(12,6,18,' + 0.55 * a + ')'); g.addColorStop(1, 'rgba(8,4,12,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }
  // a glowing ribbon (wide soft edge, coloured middle, hot core), like the Pheromosa / Gardevoir move arcs
  function ribbon(ctx, pts, k, edge, mid, core, a, w) {
    if (pts.length < 2 || a <= 0) return;
    const path = () => { ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); };
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    path(); ctx.strokeStyle = edge.replace('A', 0.35 * a); ctx.lineWidth = w * 3 * k; ctx.stroke();
    path(); ctx.strokeStyle = mid.replace('A', 0.85 * a); ctx.lineWidth = w * 1.4 * k; ctx.stroke();
    if (core) { path(); ctx.strokeStyle = core.replace('A', a); ctx.lineWidth = Math.max(1, w * 0.45 * k); ctx.stroke(); }
  }
  // an angry almond eye with a hot slit pupil and bloom (the "symbol" of a Dreadful Evolution)
  function eye(ctx, x, y, w, h, dir, open, a) {
    if (open <= 0 || a <= 0) return; const hh = h * open;
    ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1);
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, 0, 0, w * 2.2, 'rgba(255,40,30,' + 0.55 * a + ')', 'rgba(120,0,0,0)');
    ctx.globalCompositeOperation = 'source-over';
    const shape = (s) => { ctx.beginPath(); ctx.moveTo(-w * s, -hh * 0.95 * s); ctx.quadraticCurveTo(w * 0.1, -hh * 0.35 * s, w * s, hh * 0.3 * s); ctx.quadraticCurveTo(w * 0.05, hh * 1.25 * s, -w * 0.75 * s, hh * 0.55 * s); ctx.closePath(); };
    shape(1.22); ctx.fillStyle = 'rgba(10,0,4,' + 0.9 * a + ')'; ctx.fill();      // dark socket
    shape(1); const g = ctx.createRadialGradient(0, 0, 0, 0, 0, w); g.addColorStop(0, 'rgba(255,190,150,' + a + ')'); g.addColorStop(0.35, 'rgba(255,40,30,' + a + ')'); g.addColorStop(1, 'rgba(140,0,10,' + a + ')'); ctx.fillStyle = g; ctx.fill();
    ctx.fillStyle = 'rgba(255,240,220,' + a + ')'; ctx.beginPath(); ctx.ellipse(w * 0.05, hh * 0.1, Math.max(1, w * 0.1), Math.max(1, hh * 0.55), 0.25, 0, TAU); ctx.fill();   // slit
    ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(255,120,90,' + 0.6 * a + ')'; ctx.lineWidth = Math.max(1, w * 0.08); ctx.beginPath(); ctx.moveTo(-w * 1.9, -hh * 0.2); ctx.lineTo(w * 1.9, hh * 0.25); ctx.stroke();   // a thin lens streak
    ctx.restore();
  }
  // ---------------------------------------------------------------- the Mega costume's sparkles
  // four-point sparkles twinkling around her while she's Mega (Giratina) Gardevoir: black, gold and red; white and blue when shiny
  const SPARK = { n: ['#d01f2a', '#ffd23f', '#140c18', '#ff5a3a', '#ffd23f'], s: ['#ffffff', '#7fd4ff', '#2a7cff', '#d8f4ff', '#ffffff'] };
  let auraSeen = 0;
  function star(ctx, x, y, z, col, dark) {
    ctx.beginPath(); ctx.moveTo(x, y - z); ctx.quadraticCurveTo(x + z * 0.12, y - z * 0.12, x + z, y); ctx.quadraticCurveTo(x + z * 0.12, y + z * 0.12, x, y + z);
    ctx.quadraticCurveTo(x - z * 0.12, y + z * 0.12, x - z, y); ctx.quadraticCurveTo(x - z * 0.12, y - z * 0.12, x, y - z); ctx.closePath();
    if (dark) { ctx.shadowColor = 'rgba(208,31,42,0.9)'; ctx.shadowBlur = z * 0.9; }
    ctx.fillStyle = col; ctx.fill(); ctx.shadowBlur = 0;
    ctx.lineWidth = Math.max(1, z * 0.12); ctx.strokeStyle = dark ? 'rgba(255,90,60,0.85)' : 'rgba(255,255,255,0.55)'; ctx.stroke();
  }
  const megaOn = p => p && witchOn(p) && String(p.megaForm || '') === FORM && /282-mega-witch/.test(String(p.anim?.dex || ''));
  function register() {
    window.PS_FX.styles.witchaura = {
      cast(c) { c.parts = []; c.acc = 0; auraSeen = performance.now(); return c; },
      update(c, dt) {
        const p = c.player; if (!megaOn(p) || p.dead) return false;
        auraSeen = performance.now(); c.t += dt; c.x = p.x; c.y = p.y; c.H = Number(p.bodyH) || 40; c.shiny = isShiny(p);
        c.acc += dt * 9; while (c.acc >= 1) { c.acc--; const a = rnd(0, TAU), r = rnd(0.55, 1.15); c.parts.push({ x: Math.cos(a) * c.H * 0.8 * r, y: -c.H * 0.55 + Math.sin(a) * c.H * 0.7 * r, vy: rnd(-14, -4), life: rnd(0.7, 1.3), t: 0, s: rnd(5, 10) * (Math.random() < 0.2 ? 1.5 : 1), col: Math.floor(Math.random() * 5) }); }
        for (const q of c.parts) { q.t += dt; q.y += q.vy * dt; }
        c.parts = c.parts.filter(q => q.t < q.life);
        return true;
      },
      draw(c, ctx, v) {
        const k = v.k, X = v.sx(c.x), Y = v.sy(c.y), pal = c.shiny ? SPARK.s : SPARK.n;
        for (const q of c.parts) {
          const u = q.t / q.life, pop = u < 0.3 ? u / 0.3 : 1 - (u - 0.3) / 0.7, z = q.s * k * (0.35 + 0.65 * pop) * (0.85 + 0.15 * Math.sin(q.t * 18));
          const col = pal[q.col], dark = col === '#140c18';
          ctx.globalAlpha = Math.min(1, pop * 1.4); star(ctx, X + q.x * k, Y + q.y * k, z, col, dark);
        }
        ctx.globalAlpha = 1;
      }
    };
    window.PS_FX.styles.dreadevo = {
      cast(c) {
        const p = c.player; dread = p; c.H = Number(p.bodyH) || 40; c.RB = Math.max(28, c.H * 0.8);
        c.puffs = []; for (let i = 0; i < 40; i++) c.puffs.push({ a: rnd(0, TAU), r: rnd(150, 240), s: rnd(18, 34), sp: rnd(0.6, 1.3) * (i % 2 ? 1 : -1), dl: rnd(0, 0.8), front: i % 3 === 0 });
        c.tend = []; for (let i = 0; i < 9; i++) c.tend.push({ a: i / 9 * TAU + rnd(-0.3, 0.3), r: rnd(110, 170), sp: rnd(0.9, 1.5) * (i % 2 ? 1 : -1), len: rnd(1.2, 2.0) });
        c.pour = []; c.streams = []; c.shards = []; c.wisps = []; c.motes = [];
        c.cracks = []; for (let i = 0; i < 7; i++) { const a0 = i / 7 * TAU + rnd(-0.3, 0.3), pts = [[0, 0]]; let r = 0, a = a0; for (let j = 0; j < 5; j++) { r += rnd(0.17, 0.25); a += rnd(-0.45, 0.45); pts.push([Math.cos(a) * r, Math.sin(a) * r]); } c.cracks.push({ pts, at: T.crack + i * 0.12, a0 }); }
        sfx('ghost'); kick(0.3);
        c.ses = session(p); if (c.ses) c.ses.megaAnim = p.anim;   // she keeps the witch look until the orb breaks
        try { p.invuln = Math.max(Number(p.invuln) || 0, T.burst + 0.8); } catch (_) {}
        return c;
      },
      update(c, dt) {
        c.t += dt; const p = c.player, t = c.t; if (!p) { dread = null; return false; }
        if (window.PS_WITCH_DREAD) window.PS_WITCH_DREAD.t = t;
        c.x = p.x; c.y = p.y;
        if (t > T.spirit && !c.rs) { c.rs = 1; kick(0.4); sfx('ghost'); }
        if (t > T.lean && t < T.merged) for (let i = 0; i < 2; i++) c.pour.push({ u: 0, sp: rnd(1.3, 2.0), off: rnd(-1, 1), red: Math.random() < 0.3 });
        for (const q of c.pour) q.u += q.sp * dt; c.pour = c.pour.filter(q => q.u < 1);
        if (t >= T.merged && !c.mg) { c.mg = 1; kick(0.9); sfx('bossDown'); }
        if (t > T.charge && t < T.crack + 0.45 && c.streams.length < 16 && Math.random() < 0.35) c.streams.push({ a: rnd(0, TAU), r0: rnd(120, 170), u: 0, sp: rnd(0.7, 1.05), red: c.streams.length % 2 === 0, tw: rnd(1.1, 1.8) * (Math.random() < 0.5 ? 1 : -1) });
        for (const q of c.streams) q.u += q.sp * dt; c.streams = c.streams.filter(q => q.u < 1);
        if (t > T.charge && t < T.burst && Math.random() < 0.5) c.motes.push({ a: rnd(0, TAU), r: rnd(0.2, 0.85), t: 0 });
        for (const m of c.motes) m.t += dt; c.motes = c.motes.filter(m => m.t < 0.8);
        if (t > T.crack && t < T.burst) { c.rum = (c.rum || 0) - dt; if (c.rum <= 0) { c.rum = 0.08; kick(0.08 + 0.3 * cl((t - T.crack) / (T.burst - T.crack))); } }
        if (t > T.eyes && !c.st) { c.st = 1; cry(0.55); }
        if (t >= T.burst && !c.broke) {
          c.broke = 1; dread = null; kick(1.4); sfx('bossDown'); cry(0.78);
          // she is transformed the instant the orb breaks
          if (c.fx.newAnim && String(p.megaForm || '') === String(c.fx.form)) { try { c.fx.newAnim.dir = p.anim?.dir ?? 0; } catch (_) {} p.anim = c.fx.newAnim; if (c.ses) c.ses.megaAnim = c.fx.newAnim; }
          for (let i = 0; i < 26; i++) { const a = i / 26 * TAU + rnd(-0.12, 0.12), v = rnd(170, 340); c.shards.push({ x: Math.cos(a) * c.RB * 0.75, y: Math.sin(a) * c.RB * 0.75, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 70, r: rnd(0, TAU), vr: rnd(-9, 9), s: rnd(3, 9), t: 0 }); }
          for (let i = 0; i < 14; i++) { const sd = i % 2 ? 1 : -1; c.wisps.push({ x: sd * rnd(34, 70), y: rnd(-6, 10), vy: rnd(-70, -30), s: rnd(8, 15), life: rnd(0.9, 1.5), t: 0 }); }
          const F = fx(), cy = p.y - c.H * 0.5;
          try { F.ring(p.x, cy, c.RB * 0.6, c.RB * 3.2, '#ffffff', 0.5, 6); F.ring(p.x, cy, c.RB * 0.4, c.RB * 2.4, '#d01f2a', 0.6, 8); F.burst(p.x, cy, '#2a1636', 34, 280); F.burst(p.x, cy, '#ff3a3a', 18, 220); } catch (_) {}
        }
        for (const q of c.shards) { q.t += dt; q.vy += 380 * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.r += q.vr * dt; }
        for (const w of c.wisps) { w.t += dt; w.y += w.vy * dt; }
        if (t >= T.end) { if (dread === p) dread = null; return false; }
        return true;
      },
      draw(c, ctx, v) {
        const p = c.player; if (!p) return;
        const k = v.k, t = c.t, X = v.sx(c.x), Y = v.sy(c.y), CY = v.sy(c.y - c.H * 0.5), H = c.H, RB = c.RB * k;
        const A = window.PSXAI && window.PSXAI.Art, hasS = A && A.has && A.has('giratina_shadow');
        const mistIn = ease(t / 0.9), condense = ease((t - T.merged) / (T.charge - T.merged + 0.15)), mistA = mistIn * (1 - condense);
        ctx.save();
        // ---- the world darkens around her
        const dim = t < T.burst ? mistIn * 0.75 : Math.max(0, 0.75 * (1 - (t - T.burst) / 0.25));
        if (dim > 0) glow(ctx, X, CY, 330 * k, 'rgba(6,2,10,' + dim + ')', 'rgba(6,2,10,0)');
        // ---- back mist + curling tendrils
        const puffAt = m => { const tt = Math.max(0, t - m.dl), inR = m.r - ease(tt / 1.8) * (m.r - (m.front ? 52 : 74)), rr = inR * (1 - condense), a = m.a + tt * m.sp * (1 + condense * 3);
          const sn = Math.sin(a), ty = (m.front ? (Math.abs(sn) * 0.6 + 0.4) * rr * 0.55 + H * 0.3 * (1 - condense) : sn * rr * 0.6);
          return [X + Math.cos(a) * rr * k, CY + ty * k, Math.min(1, tt * 1.4), m.s * k * (1 - condense * 0.6)]; };
        for (const m of c.puffs) if (!m.front) { const [px, py, a, r] = puffAt(m); puff(ctx, px, py, r, a * mistA * 0.85); }
        if (mistA > 0.02) for (const q of c.tend) {   // thin smoky tendrils curling around her
          const pts = []; for (let i = 0; i <= 14; i++) { const u = i / 14, a = q.a + t * q.sp + u * q.len, rr = q.r * (0.55 + 0.45 * u) * (1 - condense); pts.push([X + Math.cos(a) * rr * k, CY + Math.sin(a) * rr * 0.55 * k]); }
          ribbon(ctx, pts, k, 'rgba(10,4,16,A)', 'rgba(40,20,56,A)', 'rgba(120,70,170,A)', mistA * 0.45, 4.5);
        }
        // ---- the spirit, towering behind her; then it leans in and pours itself into her
        if (hasS && t > T.spirit && t < T.merged + 0.15) {
          const [w0, h0] = A.size('giratina_shadow');
          const rise = ease((t - T.spirit) / 0.9), q = ease((t - T.lean) / (T.merged - T.lean));
          const big = Math.min(H * 3.7 / h0, 430 / w0) * k, scx = big * (1 - q * 0.9) * (1 + 0.02 * Math.sin(t * 3)), scy = big * (1 - q * 0.9) * (1 + 0.15 * q) * (1 + 0.02 * Math.sin(t * 3 + 1));
          const baseY = Y - 6 * k + 30 * k * (1 - rise), endY = CY + h0 * scy * 0.5;
          const by = baseY * (1 - q) + endY * q, bx = X;
          const sa = 0.96 * rise * (1 - cl((q - 0.8) / 0.2));
          glow(ctx, bx, by - h0 * scy * 0.45, w0 * scx * 0.62, 'rgba(70,0,20,' + 0.45 * sa + ')', 'rgba(20,0,10,0)');   // a red-black aura behind it
          ctx.save(); ctx.imageSmoothingEnabled = false; ctx.globalAlpha = sa; ctx.shadowColor = 'rgba(200,20,40,' + 0.8 * sa + ')'; ctx.shadowBlur = 16 * k;
          ctx.translate(bx, by); ctx.scale(scx, scy); A.draw(ctx, 'giratina_shadow', 0, 0, {}); ctx.restore();
          const ey = by - h0 * scy * 0.49, gl = sa * (0.8 + 0.2 * Math.sin(t * 9));
          ctx.globalCompositeOperation = 'lighter';
          for (const ex of [-0.05, 0.06]) { const gx = bx + ex * w0 * scx; glow(ctx, gx, ey, 30 * scx + 6 * k, 'rgba(255,70,50,' + gl + ')', 'rgba(255,0,0,0)'); glow(ctx, gx, ey, 7 * scx + 2 * k, 'rgba(255,230,210,' + gl + ')', 'rgba(255,60,40,0)'); }
          ctx.globalCompositeOperation = 'source-over';
          c.chest = [bx, by - h0 * scy * 0.4];
        }
        // ---- she stands in front of it (redrawn on top), darkening as the spirit floods into her
        if (t < T.burst) {
          const ox = v.sx(0), oy = v.sy(0), sk = v.sx(1) - ox, ly = p.y - (p.jumpLift || 0);
          const shade = t > T.lean ? ease((t - T.lean) / (T.merged - T.lean)) * (t < T.merged + 0.3 ? 1 : cl(1 - (t - T.merged - 0.3) / 0.5)) : 0;
          ctx.save(); ctx.translate(ox, oy); ctx.scale(sk, sk); ctx.imageSmoothingEnabled = false;
          if (shade > 0) { ctx.shadowColor = 'rgba(230,30,50,' + shade + ')'; ctx.shadowBlur = 10 * k; }
          try { p.anim.draw(ctx, p.x, ly, { alpha: 1 }); } catch (_) {}
          ctx.shadowBlur = 0;
          if (shade > 0) { ctx.globalAlpha = shade * (0.6 + 0.25 * Math.sin(t * 16)); ctx.filter = 'brightness(0)'; try { p.anim.draw(ctx, p.x, ly, { alpha: 1 }); } catch (_) {} ctx.filter = 'none'; }
          ctx.restore();
        }
        // ---- the spirit's shadow pours into her chest: glowing dark ribbons
        if (c.chest && t > T.lean && t < T.merged + 0.1) {
          const fade = 1 - cl((t - T.merged + 0.15) / 0.25);
          for (const q of c.pour) { const pts = []; for (let j = 0; j < 7; j++) { const b = Math.max(0, q.u - j * 0.05), sx0 = c.chest[0], sy0 = c.chest[1], mx = (sx0 + X) / 2 + q.off * 46 * k, my = Math.min(sy0, CY) - 30 * k;
              pts.push([(1 - b) * (1 - b) * sx0 + 2 * (1 - b) * b * mx + b * b * X, (1 - b) * (1 - b) * sy0 + 2 * (1 - b) * b * my + b * b * CY]); }
            if (q.red) { ctx.globalCompositeOperation = 'lighter'; ribbon(ctx, pts, k, 'rgba(160,0,20,A)', 'rgba(255,40,40,A)', 'rgba(255,220,200,A)', fade * 0.9, 1.6); ctx.globalCompositeOperation = 'source-over'; }
            else ribbon(ctx, pts, k, 'rgba(8,2,12,A)', 'rgba(30,14,40,A)', 'rgba(110,60,150,A)', fade, 2.4); }
        }
        // ---- front mist (kept below her face)
        for (const m of c.puffs) if (m.front) { const [px, py, a, r] = puffAt(m); puff(ctx, px, py, r, a * mistA * 0.7); }
        // ---- the merge: a dark-red pulse
        if (t > T.merged - 0.05 && t < T.merged + 0.5) { const f = 1 - (t - T.merged + 0.05) / 0.55; ctx.globalCompositeOperation = 'lighter'; glow(ctx, X, CY, 120 * k, 'rgba(200,20,40,' + 0.6 * f + ')', 'rgba(60,0,10,0)'); ctx.globalCompositeOperation = 'source-over'; }
        // ---- the black orb
        if (t > T.ball && t < T.burst) {
          const grow = ease((t - T.ball) / 0.75), strain = cl((t - T.crack) / (T.burst - T.crack));
          const r = RB * grow * (1 + (t > T.charge ? 0.03 * Math.sin(t * 22) : 0) + 0.07 * strain);
          ctx.globalCompositeOperation = 'lighter'; glow(ctx, X, CY, r * 1.9, 'rgba(160,10,40,' + (0.25 + 0.35 * strain) * grow + ')', 'rgba(60,0,20,0)'); ctx.globalCompositeOperation = 'source-over';
          const g = ctx.createRadialGradient(X - r * 0.3, CY - r * 0.35, r * 0.05, X, CY, r);
          g.addColorStop(0, '#3a2450'); g.addColorStop(0.35, '#140a1e'); g.addColorStop(0.85, '#06030a'); g.addColorStop(1, '#2a0a1a');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(X, CY, r, 0, TAU); ctx.fill();
          // the swirling red storm inside
          if (t > T.charge) { const w = ease((t - T.charge) / 0.8); ctx.save(); ctx.beginPath(); ctx.arc(X, CY, r * 0.96, 0, TAU); ctx.clip(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
            for (let i = 0; i < 5; i++) { const a0 = t * (2.2 + i * 0.4) + i * 1.3, rr = r * (0.3 + i * 0.12); ctx.strokeStyle = 'rgba(220,20,40,' + 0.55 * w + ')'; ctx.lineWidth = r * 0.09; ctx.beginPath(); ctx.arc(X, CY, rr, a0, a0 + 1.6 + i * 0.2); ctx.stroke(); ctx.strokeStyle = 'rgba(255,170,150,' + 0.6 * w + ')'; ctx.lineWidth = r * 0.025; ctx.stroke(); }
            for (const m of c.motes) { const a = m.a + m.t * 3; glow(ctx, X + Math.cos(a) * m.r * r, CY + Math.sin(a) * m.r * r * 0.9, r * 0.12, 'rgba(255,90,70,' + (1 - m.t / 0.8) + ')', 'rgba(255,0,0,0)'); }
            ctx.restore(); }
          // rim: rotating dark-red arcs (like the Mega orb's rainbow rim, turned sinister)
          ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 10; i++) { const a0 = i / 10 * TAU - t * 2.6; ctx.strokeStyle = i % 2 ? 'rgba(200,20,50,0.7)' : 'rgba(110,40,170,0.6)'; ctx.lineWidth = 3 * k; ctx.beginPath(); ctx.arc(X, CY, r * 1.03, a0, a0 + TAU / 10 - 0.08); ctx.stroke(); }
          ctx.globalCompositeOperation = 'source-over';
          ctx.fillStyle = 'rgba(190,160,220,0.35)'; ctx.beginPath(); ctx.ellipse(X - r * 0.38, CY - r * 0.45, r * 0.22, r * 0.1, -0.6, 0, TAU); ctx.fill();   // a cold highlight
          // cracks: red light leaking out
          for (const cr of c.cracks) { if (t < cr.at) continue; const gr = ease((t - cr.at) / 0.15);
            const path = () => { ctx.beginPath(); cr.pts.forEach(([x, y], i) => { const px = X + x * r * gr * 1.1, py = CY + y * r * gr * 1.1; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }); };
            ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.shadowColor = '#ff2030'; ctx.shadowBlur = 10 * k;
            path(); ctx.strokeStyle = 'rgba(255,40,50,0.95)'; ctx.lineWidth = 3.2 * k; ctx.stroke(); ctx.shadowBlur = 0;
            path(); ctx.strokeStyle = 'rgba(255,235,220,0.95)'; ctx.lineWidth = 1.1 * k; ctx.stroke();
            if (strain > 0.3) { ctx.globalCompositeOperation = 'lighter'; const [ex, ey] = cr.pts[cr.pts.length - 1], an = Math.atan2(ey, ex), L = r * (0.6 + strain); ctx.fillStyle = 'rgba(255,50,40,' + 0.22 * strain + ')'; ctx.beginPath(); ctx.moveTo(X + ex * r, CY + ey * r); ctx.lineTo(X + Math.cos(an - 0.12) * (r + L), CY + Math.sin(an - 0.12) * (r + L)); ctx.lineTo(X + Math.cos(an + 0.12) * (r + L), CY + Math.sin(an + 0.12) * (r + L)); ctx.closePath(); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; } }
          // two red eyes open within the cracks and stare out
          if (t > T.eyes) { const o = ease((t - T.eyes) / 0.35), blink = (t > T.eyes + 0.55 && t < T.eyes + 0.63) ? 0.12 : 1; glow(ctx, X, CY - r * 0.06, r * 0.75, 'rgba(4,0,6,' + 0.85 * o + ')', 'rgba(4,0,6,0)'); for (const d of [-1, 1]) eye(ctx, X + d * r * 0.44, CY - r * 0.06, r * 0.33, r * 0.21, d, o * blink, 1); }
        }
        // ---- black and red energy spirals into the orb (a Mega charge, turned dark)
        for (const q of c.streams) { const pts = []; for (let j = 0; j < 9; j++) { const b = Math.max(0, q.u - j * 0.04), rr = q.r0 * (1 - b) * k + RB * 0.95 * b, a = q.a + q.tw * b * 2; pts.push([X + Math.cos(a) * rr, CY + Math.sin(a) * rr * 0.7]); }
          const a = Math.min(1, q.u * 4) * (1 - Math.max(0, q.u - 0.85) / 0.15);
          if (q.red) { ctx.globalCompositeOperation = 'lighter'; ribbon(ctx, pts, k, 'rgba(150,0,20,A)', 'rgba(255,40,40,A)', 'rgba(255,220,200,A)', a, 1.8); ctx.globalCompositeOperation = 'source-over'; }
          else ribbon(ctx, pts, k, 'rgba(6,2,10,A)', 'rgba(26,12,36,A)', 'rgba(120,70,170,A)', a, 2.4); }
        // ---- the shatter
        if (t >= T.burst) {
          const e = t - T.burst;
          if (e < 0.4 && v.box) { ctx.save(); ctx.fillStyle = 'rgba(120,0,16,' + 0.55 * (1 - e / 0.4) * (1 - e / 0.4) + ')'; ctx.fillRect(v.box.left, v.box.top, v.box.width, v.box.height); ctx.restore(); }
          if (e < 0.35) { ctx.globalCompositeOperation = 'lighter'; glow(ctx, X, CY, RB * (1.2 + e * 7), 'rgba(255,220,210,' + (1 - e / 0.35) + ')', 'rgba(200,0,30,0)'); ctx.globalCompositeOperation = 'source-over'; }
          for (const q of c.shards) { const a = Math.max(0, 1 - q.t / 1.1); if (!a) continue; ctx.save(); ctx.globalAlpha = a; ctx.translate(X + q.x * k, CY + q.y * k); ctx.rotate(q.r); const z = q.s * k;
            ctx.beginPath(); ctx.moveTo(-z, -z * 0.6); ctx.lineTo(z, -z * 0.3); ctx.lineTo(-z * 0.2, z); ctx.closePath(); const sg = ctx.createLinearGradient(-z, -z, z, z); sg.addColorStop(0, '#3a2450'); sg.addColorStop(1, '#06030a'); ctx.fillStyle = sg; ctx.fill();
            ctx.strokeStyle = e < 0.25 ? '#ffd0c0' : '#d01f2a'; ctx.lineWidth = 1.4 * k; ctx.stroke(); ctx.restore(); }
          for (const w of c.wisps) { const a = Math.max(0, 1 - w.t / w.life); if (!a) continue; puff(ctx, X + (w.x + Math.sin(w.t * 5 + w.x) * 4) * k, Y + w.y * k, w.s * k, a * 0.6); }
          // the eyes drift up above her head and fade, where a Mega symbol would be
          const rise = ease(e / 0.5), fade = cl(1 - (e - 0.6) / 0.7), ey = CY - (H * 0.5 + 44) * k * rise, er = RB * (1 - 0.4 * rise);
          for (const d of [-1, 1]) eye(ctx, X + d * er * 0.44, ey, er * 0.33, er * 0.21, d, 1, fade);
          if (e > 0.1) { const a = Math.min(1, (e - 0.1) * 3) * Math.min(1, (T.end - t) * 2); ctx.globalAlpha = a; ctx.font = 'bold ' + Math.round(13 * Math.max(1, k * 0.8)) + 'px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = '#120810'; const ty = CY - (H * 0.5 + 78) * k; ctx.strokeText('Dreadful Evolution!', X, ty); ctx.fillStyle = '#ff5a5a'; ctx.fillText('Dreadful Evolution!', X, ty); ctx.globalAlpha = 1; }
        }
        ctx.restore();
      }
    };
  }
  (function loop() { requestAnimationFrame(loop); try { if (!installed) install(); else keepLook(); } catch (e) { console.warn('[witch-dread]', e); } })();
  window.PS_WITCH_DREAD = { KEY, META, witchOn };
})();
