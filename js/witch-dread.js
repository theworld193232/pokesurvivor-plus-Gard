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
  const KEY = { n: '282-mega-witch', s: '282-mega-witch-s' }, BASE = '282-witch', FORM = '282-mega';
  const META = { '282-mega-witch': { s: 1, a: {"Idle": {"w": 62, "h": 58, "n": 4, "r": 8, "d": [6, 12, 6, 12], "ax": 30.5, "ay": 37.5}, "Walk": {"w": 62, "h": 50, "n": 4, "r": 8, "d": [8, 12, 8, 12], "ax": 30.5, "ay": 33.5}, "Attack": {"w": 102, "h": 90, "n": 10, "r": 8, "d": [2, 4, 1, 1, 1, 2, 2, 2, 2, 2], "ax": 50.5, "ay": 52.5}, "Shoot": {"w": 62, "h": 58, "n": 10, "r": 8, "d": [2, 2, 2, 2, 2, 2, 2, 2, 2, 2], "ax": 31.5, "ay": 37.5}, "Charge": {"w": 62, "h": 58, "n": 10, "r": 8, "d": [2, 2, 2, 2, 2, 2, 2, 2, 2, 2], "ax": 31.5, "ay": 37.5}, "Hurt": {"w": 70, "h": 66, "n": 2, "r": 8, "d": [2, 8], "ax": 34.5, "ay": 40.5}, "Faint": {"w": 70, "h": 66, "n": 2, "r": 8, "d": [2, 8], "ax": 34.5, "ay": 40.5}, "Appeal": {"w": 70, "h": 58, "n": 8, "r": 8, "d": [1, 6, 1, 4, 5, 4, 5, 4], "ax": 34.5, "ay": 37.5}}, sh: 0 }, '282-mega-witch-s': { s: 1, a: {"Idle": {"w": 62, "h": 58, "n": 4, "r": 8, "d": [6, 12, 6, 12], "ax": 30.5, "ay": 37.5}, "Walk": {"w": 62, "h": 50, "n": 4, "r": 8, "d": [8, 12, 8, 12], "ax": 30.5, "ay": 33.5}, "Attack": {"w": 102, "h": 90, "n": 10, "r": 8, "d": [2, 4, 1, 1, 1, 2, 2, 2, 2, 2], "ax": 50.5, "ay": 52.5}, "Shoot": {"w": 62, "h": 58, "n": 10, "r": 8, "d": [2, 2, 2, 2, 2, 2, 2, 2, 2, 2], "ax": 31.5, "ay": 37.5}, "Charge": {"w": 62, "h": 58, "n": 10, "r": 8, "d": [2, 2, 2, 2, 2, 2, 2, 2, 2, 2], "ax": 31.5, "ay": 37.5}, "Hurt": {"w": 70, "h": 66, "n": 2, "r": 8, "d": [2, 8], "ax": 34.5, "ay": 40.5}, "Faint": {"w": 70, "h": 66, "n": 2, "r": 8, "d": [2, 8], "ax": 34.5, "ay": 40.5}, "Appeal": {"w": 70, "h": 58, "n": 8, "r": 8, "d": [1, 6, 1, 4, 5, 4, 5, 4], "ax": 34.5, "ay": 37.5}}, sh: 0 } };
  let installed = false;
  function install() {
    const r = R(); if (installed || !r || !r.SPRITE_META || !window.PS_FX || !window.PS_FX.styles) return false; installed = true;
    for (const k in META) { r.SPRITE_META[k] = META[k]; try { const C = window.PSXAI_CANON_SIZE; if (C) { C.opaquePx[k] = C.opaquePx['282_mega'] || C.opaquePx[282] || 26; C.heightDm[k] = C.heightDm[282]; } } catch (_) {} }
    register(); wrapCast(); return true;
  }
  const witchOn = p => { try { return !!p && Number(p.dex) === 282 && window.PS_COSMETICS?.selected(282) === BASE; } catch (_) { return false; } };
  const megaKey = p => p && (p.shiny || p.anim?.shiny) ? KEY.s : KEY.n;
  const anim = (key, p) => { const a = new (R().Sprites.Animator)(key, p.scale || p.anim?.scale || 1, false); try { a.dir = p.anim?.dir ?? 0; } catch (_) {} return a; };
  let dread = null;
  const session = p => { try { return window.PS_GARD_MEGA_PRESENTATION?.session(p) || null; } catch (_) { return null; } };   // the player in the middle of a Dreadful Evolution (its look is left alone meanwhile)
  // keep her looking the part: Giratina Mega while Mega, witch outfit otherwise (also when shiny)
  function keepLook() {
    const p = B()?.game?.player; if (!p || p === dread || !witchOn(p)) return;
    const want = String(p.megaForm || '') === FORM ? megaKey(p) : (!p.megaForm ? BASE : null);
    if (want && p.anim && p.anim.dex !== want) p.anim = anim(want, p);
    // the friend's Mega presentation re-applies its own Mega sprite every tick: hand it ours
    const ses = session(p); if (ses && want && String(p.megaForm || '') === FORM && ses.megaAnim !== p.anim) ses.megaAnim = p.anim;
  }
  function wrapCast() {
    const F = window.PS_FX, cast = F.cast;
    F.cast = function (name, player, move, ...rest) {
      if (name === 'megaevo' && witchOn(player) && F.styles.dreadevo) {
        const fx = Object.assign({}, (move && move.fx) || {}); fx.newAnim = anim(megaKey(player), player); fx.form = fx.form || FORM;
        try { if (player.anim && player.anim.dex !== BASE) player.anim = anim(BASE, player); } catch (_) {}
        return cast.call(this, 'dreadevo', player, Object.assign({}, move, { id: 'dreadful-evolution', fx }), ...rest);
      }
      return cast.call(this, name, player, move, ...rest);
    };
  }
  // ---------------------------------------------------------------- the cutscene
  const TAU = Math.PI * 2, rnd = (a, b) => a + Math.random() * (b - a);
  const T = { mist: 0, spirit: 1.1, dive: 2.3, hit: 2.75, end: 4.4 };
  const kick = k => { try { R().Camera.kick(k); } catch (_) {} };
  const sfx = n => { try { B()?.audio?.sfx?.(n); } catch (_) {} };
  function cry(rate) { try { const a = new Audio('assets/cries/282.mp3'); a.volume = 0.8; a.playbackRate = rate; a.preservesPitch = false; a.play().catch(() => {}); } catch (_) {} }
  function register() {
    window.PS_FX.styles.dreadevo = {
      cast(c) {
        const p = c.player; dread = p; c.H = Number(p.bodyH) || 40; c.R = Math.max(40, c.H * 0.8);
        c.puffs = []; for (let i = 0; i < 34; i++) c.puffs.push({ a: rnd(0, TAU), r: rnd(110, 190), s: rnd(10, 22), sp: rnd(0.8, 1.6) * (i % 2 ? 1 : -1), dl: rnd(0, 0.7) });
        c.sparks = []; c.wisps = []; c.trail = [];
        c.a0 = rnd(0, TAU); sfx('ghost'); kick(0.3);
        c.ses = session(p); if (c.ses) c.ses.megaAnim = p.anim;   // (no early reveal: she keeps the witch look until the spirit enters her)
        try { p.invuln = Math.max(Number(p.invuln) || 0, T.end + 0.5); } catch (_) {}
        return c;
      },
      update(c, dt) {
        c.t += dt; const p = c.player; if (!p) { dread = null; return false; }
        c.x = p.x; c.y = p.y;
        try { if (p.anim && c.t < T.hit) { p.anim.dir = 0; } } catch (_) {}
        // the spirit's path: rises from the mist, circles her, dives in
        const u = Math.max(0, Math.min(1, (c.t - T.spirit) / (T.hit - T.spirit)));
        const rad = 260 * (1 - u * u), ang = c.a0 + u * 4.2;
        c.sx = c.x + Math.cos(ang) * rad; c.sy = c.y - c.H * 0.5 + Math.sin(ang) * rad * 0.55 - 40 * (1 - u);
        c.sk = 0.75 - 0.5 * u;
        if (c.t > T.spirit && c.t < T.hit) { c.trail.unshift([c.sx, c.sy, c.sk]); if (c.trail.length > 7) c.trail.pop(); }
        if (c.t > T.dive && c.t < T.hit && !c.rumble) { c.rumble = 1; kick(0.5); }
        if (c.t >= T.hit && !c.hit) {
          c.hit = 1; dread = null; kick(1.3); sfx('bossDown'); cry(0.78);
          if (c.fx.newAnim && String(p.megaForm || '') === String(c.fx.form)) { p.anim = c.fx.newAnim; if (c.ses) c.ses.megaAnim = c.fx.newAnim; }
          for (let i = 0; i < 18; i++) { const a = rnd(0, TAU), v = rnd(80, 220); c.sparks.push({ x: Math.cos(a) * 20, y: -c.H * 0.5 + Math.sin(a) * 20, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.7 - 40, s: rnd(3, 7), life: rnd(0.8, 1.6), t: 0 }); }
          for (let i = 0; i < 14; i++) c.wisps.push({ x: rnd(-30, 30), y: rnd(-10, 10), vy: rnd(-70, -30), s: rnd(8, 16), life: rnd(1, 1.8), t: 0 });
          try { R().FX.ring(p.x, p.y - c.H * 0.5, 10, 190, '#d01f2a', 0.6, 7); R().FX.burst(p.x, p.y - c.H * 0.5, '#2b2230', 40, 260); } catch (_) {}
        }
        for (const s of c.sparks) { s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vx *= 0.95; s.vy *= 0.95; }
        for (const w of c.wisps) { w.t += dt; w.y += w.vy * dt; }
        if (c.t >= T.end) { if (dread === p) dread = null; return false; }
        return true;
      },
      draw(c, ctx, v) {
        const k = v.k, X = v.sx(c.x), Y = v.sy(c.y), CY = v.sy(c.y - c.H * 0.5), t = c.t;
        ctx.save();
        // dark mist closing in (and lingering until she bursts out)
        const mistA = Math.min(1, t / 0.6) * (t < T.hit ? 1 : Math.max(0, 1 - (t - T.hit) / 0.9));
        if (mistA > 0) {
          const g = ctx.createRadialGradient(X, CY, 4 * k, X, CY, 230 * k);
          g.addColorStop(0, 'rgba(10,6,16,' + (0.55 * mistA) + ')'); g.addColorStop(0.7, 'rgba(20,10,28,' + (0.35 * mistA) + ')'); g.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(X, CY, 230 * k, 0, TAU); ctx.fill();
          for (const m of c.puffs) {
            const tt = Math.max(0, t - m.dl); if (tt <= 0) continue;
            const rr = (m.r - Math.min(1, tt / 1.6) * (m.r - 46)) * k, a = m.a + tt * m.sp;
            const px = X + Math.cos(a) * rr, py = CY + Math.sin(a) * rr * 0.6;
            ctx.globalAlpha = Math.min(1, tt * 1.5) * 0.65 * mistA;
            const pg = ctx.createRadialGradient(px, py, 1, px, py, m.s * k * 1.4);
            pg.addColorStop(0, '#3a2a48'); pg.addColorStop(0.6, 'rgba(30,18,40,0.8)'); pg.addColorStop(1, 'rgba(10,6,16,0)');
            ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(px, py, m.s * k * 1.4, 0, TAU); ctx.fill();
          }
          ctx.globalAlpha = 1;
        }
        // Giratina's shadow: trail of after-images, then the spirit itself, red eyes burning
        const A = window.PSXAI && window.PSXAI.Art;
        if (t > T.spirit && t < T.hit + 0.05 && A && A.has && A.has('giratina_shadow')) {
          const rise = Math.min(1, (t - T.spirit) / 0.4);
          c.trail.forEach(([sx, sy, sk], i) => { if (i === 0) return; ctx.save(); ctx.globalAlpha = 0.18 * rise * (1 - i / c.trail.length); ctx.translate(v.sx(sx), v.sy(sy) + 20 * k * sk); ctx.scale(sk * k * 0.6, sk * k * 0.6); A.draw(ctx, 'giratina_shadow', 0, 0, {}); ctx.restore(); });
          ctx.save(); ctx.globalAlpha = 0.9 * rise; ctx.translate(v.sx(c.sx), v.sy(c.sy) + 20 * k * c.sk); ctx.scale(c.sk * k * 0.6, c.sk * k * 0.6); A.draw(ctx, 'giratina_shadow', 0, 0, {}); ctx.restore();
          const ex = v.sx(c.sx), ey = v.sy(c.sy) - 34 * k * c.sk;
          for (const dx of [-9, 9]) { const gx = ex + dx * k * c.sk, eg = ctx.createRadialGradient(gx, ey, 0, gx, ey, 9 * k * c.sk + 3); eg.addColorStop(0, 'rgba(255,60,60,' + rise + ')'); eg.addColorStop(1, 'rgba(255,0,0,0)'); ctx.fillStyle = eg; ctx.beginPath(); ctx.arc(gx, ey, 9 * k * c.sk + 3, 0, TAU); ctx.fill(); }
        }
        // the moment it enters her: a dark-red flash
        if (t >= T.hit && t < T.hit + 0.5) {
          const f = 1 - (t - T.hit) / 0.5, fg = ctx.createRadialGradient(X, CY, 0, X, CY, 160 * k);
          fg.addColorStop(0, 'rgba(255,230,230,' + f + ')'); fg.addColorStop(0.35, 'rgba(200,20,40,' + (0.7 * f) + ')'); fg.addColorStop(1, 'rgba(20,0,10,0)');
          ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(X, CY, 160 * k, 0, TAU); ctx.fill();
        }
        // red four-point sparks and rising black wisps
        for (const s of c.sparks) { const a = Math.max(0, 1 - s.t / s.life); if (a <= 0) continue; const sx = X + s.x * k, sy = CY + s.y * k - (CY - Y) * 0, z = s.s * k * (0.6 + 0.4 * Math.sin(s.t * 12));
          ctx.globalAlpha = a; ctx.fillStyle = '#ff3a3a'; ctx.beginPath(); ctx.moveTo(sx, sy - z); ctx.lineTo(sx + z * 0.28, sy - z * 0.28); ctx.lineTo(sx + z, sy); ctx.lineTo(sx + z * 0.28, sy + z * 0.28); ctx.lineTo(sx, sy + z); ctx.lineTo(sx - z * 0.28, sy + z * 0.28); ctx.lineTo(sx - z, sy); ctx.lineTo(sx - z * 0.28, sy - z * 0.28); ctx.closePath(); ctx.fill(); }
        for (const w of c.wisps) { const a = Math.max(0, 1 - w.t / w.life); if (a <= 0) continue; const wx = X + w.x * k + Math.sin(w.t * 5 + w.x) * 6 * k, wy = Y + w.y * k;
          ctx.globalAlpha = a * 0.7; const wg = ctx.createRadialGradient(wx, wy, 1, wx, wy, w.s * k); wg.addColorStop(0, '#20182a'); wg.addColorStop(1, 'rgba(10,6,16,0)'); ctx.fillStyle = wg; ctx.beginPath(); ctx.arc(wx, wy, w.s * k, 0, TAU); ctx.fill(); }
        ctx.globalAlpha = 1;
        // the name, briefly
        if (t > T.hit + 0.1 && t < T.end) { const a = Math.min(1, (t - T.hit - 0.1) * 3) * Math.min(1, (T.end - t) * 2); ctx.globalAlpha = a; ctx.font = 'bold ' + Math.round(13 * Math.max(1, k * 0.8)) + 'px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = '#120810'; ctx.strokeText('Dreadful Evolution!', X, CY - c.H * k - 18); ctx.fillStyle = '#ff5a5a'; ctx.fillText('Dreadful Evolution!', X, CY - c.H * k - 18); }
        ctx.restore();
      }
    };
  }
  (function loop() { requestAnimationFrame(loop); try { if (!installed) install(); else keepLook(); } catch (e) { console.warn('[witch-dread]', e); } })();
  window.PS_WITCH_DREAD = { KEY, META, witchOn };
})();
