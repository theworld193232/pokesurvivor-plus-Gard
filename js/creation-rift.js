/* CREATION RIFT — a Lake Guardians passive.
   Playing as Uxie, Mesprit or Azelf: when BOTH of your summoned sisters are down at the same time, you snap. You call
   out, a rift in space-time tears open, and the Creation trio's other two answer — mid-argument:
     Dialga (50%)  "WHO DARES..." -> ROAR OF TIME, 10x its damage, hitting every enemy
     Palkia (50%)  "WHAT?! Who dragged me out..." -> SPACIAL REND, 10x its damage, hitting every enemy
     both  (10%)   they blame each other, call a truce "just this once" -> combo attack at 20x damage
   They burst out confused (they were busy fighting at Spear Pillar), hop around wondering where they are, hear what
   happened, attack, and bicker their way back into the rift. Portraits: assets/portraits/483.png (Dialga), 484.png (Palkia).
   Solo: the battle freezes while it plays (click / Enter / Space skips to the attack). Co-op: nothing freezes, you are
   just untouchable while it plays. At most once every 90 s. Needs js/lake-trio.js and js/lake-talk.js. */
(() => {
  'use strict';
  if (window.PS_CREATION_RIFT_INSTALLED) return; window.PS_CREATION_RIFT_INSTALLED = true;
  const E = () => window.PS_HOOPA_ENGINE, B = () => window.PS_MEGA_BRIDGE_V5, TAU = Math.PI * 2;
  const CFG = { comboChance: 0.10, single: 10, combo: 20, cooldown: 90 };
  const DIALGA = 483, PALKIA = 484, NAME = { 480: 'Uxie', 481: 'Mesprit', 482: 'Azelf', 483: 'Dialga', 484: 'Palkia' };
  const T = () => window.PS_LAKE_TALK, sfx = n => { try { E().Audio.sfx(n); } catch (_) {} };
  const pick = L => L[Math.floor(Math.random() * L.length)];

  // ================= the script =================
  // [speaker ('S' = you, the sister / 483 / 484), face, text, emote]  — {a} {b} = your two fallen sisters
  const RAGE = {
    480: [['angry', 'You... you struck down {a} and {b}. I have calculated exactly how much you will regret that.', 'anger'], ['shouting', 'My sisters... MY SISTERS! You will ALL answer for this!', 'anger']],
    481: [['shouting', 'NO! {a}! {b}! ...You made them cry. You made ME cry. Now you\'ll pay!', 'anger'], ['angry', 'I can\'t feel their hearts anymore... and all I feel now is ANGER!', 'anger']],
    482: [['shouting', 'THAT\'S IT! You took down {a} AND {b}?! You\'re finished — ALL of you!', 'anger'], ['angry', 'My sisters are down... and I am DONE holding back!', 'anger']] };
  const CALL = {
    480: [['determined', 'Lords of Time and Space — the Lake of Knowledge calls you! HEAR ME!', 'exclaim']],
    481: [['shouting', 'Dialga! Palkia! Somebody — ANYBODY — please hear my heart!', 'exclaim']],
    482: [['shouting', 'Hey, you two up there! The Lake Guardians are calling — GET DOWN HERE!', 'exclaim']] };
  const EXPLAIN = {
    480: [['teary', 'Forgive me... they struck down my sisters. I couldn\'t protect them alone.', 'tear']],
    481: [['crying', 'They hurt my sisters! Please... please help us!', 'tear']],
    482: [['angry', 'These creeps took my sisters down. I want every single one of them GONE.', 'anger']] };
  const THANKS = {
    480: [['teary', 'Thank you... I\'ll call my sisters back soon. I promise.', 'heart']],
    481: [['teary', 'Th-thank you... both of you are a lot nicer than you look~', 'heart']],
    482: [['happy', '...Thanks. Don\'t tell my sisters I needed help, okay?', 'heart']] };
  const SOLO = {
    483: { burst: [['shouting', 'WHO DARES tear me away from my eternal battle with that spatial nuisance?!', 'anger']],
      lost: [['surprised', '...Wait. This isn\'t Spear Pillar. Where is the Pillar?!', 'question'], ['dizzy', 'Where... WHEN am I? What year is this?!', 'question']],
      agree: [['determined', 'The Lake Guardians called... and Time answers. Witness the ROAR OF TIME!', 'exclaim']],
      bye: [['sigh', 'Hmph. Now, back to putting that Palkia in its place.', 'dots']] },
    484: { burst: [['angry', 'WHAT?! Who dragged me out mid-swing?! I nearly had Dialga that time!', 'anger']],
      lost: [['surprised', '...Huh? Where\'s the pillar? Where\'s the stupid time dragon?', 'question'], ['dizzy', 'Which way is UP in this dimension?!', 'question']],
      agree: [['determined', 'Picking on the little lake sprites, eh? Then let space itself tear you apart!', 'exclaim']],
      bye: [['happy', 'Don\'t tell Dialga I helped. ...Seriously. Not a word.', 'note']] } };
  const COMBO = [
    [DIALGA, 'shouting', 'PALKIA! This is YOUR doing!', 'anger'],
    [PALKIA, 'angry', 'MY doing?! You\'re the one who— wait. Where ARE we?!', 'question'],
    [DIALGA, 'dizzy', 'Time feels... wrong here.', 'question'],
    [PALKIA, 'stunned', 'So does space! What just happened?!', 'question'],
    'EXPLAIN',
    [DIALGA, 'determined', '...A truce, Palkia. Just this once.', 'exclaim'],
    [PALKIA, 'determined', 'Just this once! Don\'t get used to it!', 'exclaim'],
    'ATTACK',
    [DIALGA, 'angry', 'And THAT was mostly me.', 'anger'],
    [PALKIA, 'angry', 'In your DREAMS, you overgrown pocket watch!', 'anger']];

  // ================= state + trigger =================
  let cs = null, lastAt = -1e9, runP = null;   // the cutscene
  const allies = () => window.PS_LAKE?.allies || [];
  function check() {
    const p = E()?.Game?.player; if (!p || ![480, 481, 482].includes(Number(p.dex)) || p.dead || cs) return;
    if (p !== runP) { runP = p; lastAt = -1e9; }
    const A = allies(); if (A.length < 2 || !A.every(a => a.dead)) return;   // both of your sisters are down
    const now = performance.now() / 1000; if (now - lastAt < CFG.cooldown) return; lastAt = now;
    start(p);
  }
  addEventListener('ps-lake', ev => { if (ev.detail && ev.detail.type === 'faint') setTimeout(check, 700); });

  function start(p) {
    const N = E(), S = Number(p.dex), fallen = [480, 481, 482].filter(d => d !== S).map(d => NAME[d]);
    const combo = Math.random() < CFG.comboChance, who = combo ? [DIALGA, PALKIA] : [Math.random() < 0.5 ? DIALGA : PALKIA];
    try { N.Sprites.preload(who, 4000, false); } catch (_) {}
    const fill = t => t.replace('{a}', fallen[0]).replace('{b}', fallen[1]);
    const steps = [];   // {who, face, text, emote, act}
    const line = (w, l, act) => steps.push({ who: w, face: l[0], text: fill(l[1]), emote: l[2], act });
    line(S, pick(RAGE[S]), 'rage'); line(S, pick(CALL[S]), 'rift');
    if (combo) { steps.push({ act: 'emerge' }); for (const c of COMBO) { if (c === 'EXPLAIN') line(S, pick(EXPLAIN[S])); else if (c === 'ATTACK') steps.push({ act: 'attack' }); else line(c[0], [c[1], c[2], c[3]], c[2].includes('Where') || c[2].includes('wrong') ? 'hop' : null); } }
    else { const L = SOLO[who[0]]; steps.push({ act: 'emerge' }); line(who[0], pick(L.burst)); line(who[0], L.lost[0], 'hop'); line(who[0], L.lost[1], 'hop'); line(S, pick(EXPLAIN[S])); line(who[0], pick(L.agree)); steps.push({ act: 'attack' }); line(who[0], pick(L.bye)); }
    steps.push({ act: 'leave' }); line(S, pick(THANKS[S])); steps.push({ act: 'end' });
    const solo = !(N.Coop && N.Coop.active);
    cs = { p, S, who, combo, steps, i: -1, t: 0, next: 0, solo, mons: {}, riftT: -1, riftOpen: false, hit: null, flash: 0, rage: 0, done: false, skip: false };
    if (solo) { try { B().game.soloHold(true); } catch (_) {} }
    p.invuln = Math.max(Number(p.invuln) || 0, 3);
    window.PS_CREATION_RIFT.active = true;
  }
  // step through the script; each line stays up long enough to read
  const dur = text => Math.max(2.2, Math.min(4.6, 1.2 + text.length * 0.04));
  function advance() {
    const c = cs; c.i++; const st = c.steps[c.i]; if (!st) return finish();
    if (st.act === 'emerge') { for (const [k, w] of c.who.entries()) c.mons[w] = { dex: w, t: 0, side: c.who.length > 1 ? (k ? 1 : -1) : 0, anim: mkAnim(w), hop: 0, look: 1 }; sfx('legend'); c.next = 1.0; return; }
    if (st.act === 'attack') { attack(); c.next = 2.6; return; }
    if (st.act === 'leave') { for (const m of Object.values(c.mons)) m.leaving = 0; c.next = 0.2; return; }
    if (st.act === 'end') { c.next = 0.8; c.closing = 0; return; }
    if (st.act === 'rage') { c.rage = 1; sfx('boss'); }
    if (st.act === 'rift') { c.riftT = 0; sfx('toll'); }
    if (st.act === 'hop') for (const m of Object.values(c.mons)) { m.hop = 1; m.look = -m.look; }
    const d = dur(st.text); try { T().cut(st.who === 'S' ? c.S : st.who, st.face, st.text, st.emote, d); } catch (_) {}
    c.next = d;
  }
  function finish() {
    const c = cs; if (!c) return; cs = null; window.PS_CREATION_RIFT.active = false;
    for (const w of [DIALGA, PALKIA]) try { T().place(w, null); } catch (_) {}
    if (c.solo) { try { B().game.soloHold(false); } catch (_) {} }
    if (c.p) c.p.invuln = Math.max(Number(c.p.invuln) || 0, 2);
  }
  function mkAnim(dex) { try { return new (E().Sprites.Animator)(dex, 1, false); } catch (_) { return null; } }
  // the special move: every enemy, 10x the move's damage (20x for the combo)
  function attack() {
    const N = E(), c = cs, p = c.p, mult = c.combo ? CFG.combo : CFG.single;
    // one full use of the move: Spacial Rend lands its tears (count) at once; Roar of Time is a beam whose dmg is per tick (~8 ticks)
    const base = id => { const d = N.Moves.BY_ID[id], dm = Number(d && d.dmg) || 30; return d && d.kind === 'beam' ? dm * 8 : dm * (d && d.count ? Math.min(3, d.count) : 1); };
    const per = c.combo ? (base('roar-of-time') + base('spacial-rend')) : base(c.who[0] === DIALGA ? 'roar-of-time' : 'spacial-rend');
    c.hit = { t: 0, kind: c.combo ? 'combo' : c.who[0] === DIALGA ? 'time' : 'space', dmg: per * (Number(p.atk) || 1) * mult, done: false };
    try { T().cut(c.combo ? DIALGA : c.who[0], 'shouting', c.combo ? 'ROAR OF TIME —' : c.who[0] === DIALGA ? 'ROAR OF TIME!!' : 'SPACIAL REND!!', 'exclaim', 1.2); } catch (_) {}
    if (c.combo) setTimeout(() => { try { T().cut(PALKIA, 'shouting', '— SPACIAL REND!!', 'exclaim', 1.4); } catch (_) {} }, 600);
    sfx('judge');
  }
  function impact() {
    const N = E(), c = cs, h = c.hit; h.done = true; let n = 0;
    if (c.solo) { try { B().game.soloHold(false); } catch (_) {} c.unheld = true; }   // the hit lands in the live battle
    for (const e of N.EnemyMgr.all()) { if (!e || e.dead) continue; try { e.hurt(h.dmg, h.kind === 'space' ? '#ff9ad8' : h.kind === 'time' ? '#8ff0ff' : '#ffffff', e.x - c.p.x, e.y - c.p.y, 260); N.Stats.dmg(c.p, h.kind === 'space' ? 'spacial-rend' : 'roar-of-time', h.dmg); n++; } catch (_) {} }
    try { B().camera?.kick?.(1.4); } catch (_) {} sfx('boss'); setTimeout(() => sfx('quake'), 120);
    c.flash = 1; c.hits = n;
  }

  // ================= drawing (screen overlay, world positions through the camera) =================
  const ov = document.createElement('canvas'); ov.id = 'ps-creation'; ov.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;pointer-events:none;z-index:56;display:none';
  function gameCanvas() { let b = null, ar = 0; for (const c of document.querySelectorAll('canvas')) { if (c.id && c.id.startsWith('ps-')) continue; const r = c.getBoundingClientRect(), a = r.width * r.height; if (a > ar) { ar = a; b = { c, r }; } } return b; }
  function draw(dt) {
    const c = cs; if (!c) { if (ov.style.display !== 'none') ov.style.display = 'none'; return; }
    ov.style.display = 'block'; const ctx = ov.getContext('2d'), dpr = Math.min(2, devicePixelRatio || 1), W = innerWidth, H = innerHeight, now = performance.now() / 1000;
    if (ov.width !== Math.round(W * dpr) || ov.height !== Math.round(H * dpr)) { ov.width = Math.round(W * dpr); ov.height = Math.round(H * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    const cam = B()?.camera, g = gameCanvas(); if (!cam || !g || typeof cam.left !== 'function') return;
    const k = cam.scale * (Number(cam._cw) > 0 ? g.r.width / cam._cw : 1), sx = x => g.r.left + (x - cam.left()) * k, sy = y => g.r.top + (y - cam.top()) * k;
    const P = c.p, PX = sx(P.x), PY = sy(P.y), RX = PX, RY = Math.max(90, PY - 140 * k);
    // your rage: a red pulse on the screen and around you
    if (c.rage) { const a = 0.10 + 0.06 * Math.sin(now * 9); ctx.fillStyle = 'rgba(200,20,30,' + a + ')'; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; const gr = ctx.createRadialGradient(PX, PY - 20 * k, 4, PX, PY - 20 * k, 70 * k); gr.addColorStop(0, 'rgba(255,60,60,.5)'); gr.addColorStop(1, 'rgba(255,0,0,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(PX, PY - 20 * k, 70 * k, 0, TAU); ctx.fill(); ctx.restore(); }
    // the rift: a jagged tear of space-time above you
    if (c.riftT >= 0) { c.riftT += dt; const open = c.closing != null ? Math.max(0, 1 - c.closing / 0.7) : Math.min(1, c.riftT / 1.2), w = 150 * k * open, h = 60 * k * open;
      if (open > 0) { ctx.save(); ctx.translate(RX, RY);
        const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, w * 1.6); glow.addColorStop(0, 'rgba(220,160,255,.55)'); glow.addColorStop(1, 'rgba(120,60,200,0)'); ctx.fillStyle = glow; ctx.beginPath(); ctx.ellipse(0, 0, w * 1.6, h * 2.2, 0, 0, TAU); ctx.fill();
        ctx.beginPath(); const N2 = 14; for (let i = 0; i <= N2; i++) { const u = i / N2, x = (u - 0.5) * 2 * w, y = -h * Math.sin(u * Math.PI) * (0.6 + 0.4 * Math.sin(i * 2.7 + now * 6)); ctx.lineTo(x, y); }
        for (let i = N2; i >= 0; i--) { const u = i / N2, x = (u - 0.5) * 2 * w, y = h * Math.sin(u * Math.PI) * (0.6 + 0.4 * Math.cos(i * 3.1 + now * 5)); ctx.lineTo(x, y); } ctx.closePath();
        const core = ctx.createLinearGradient(-w, 0, w, 0); core.addColorStop(0, '#2a7cff'); core.addColorStop(0.5, '#0a0018'); core.addColorStop(1, '#ff6ac8'); ctx.fillStyle = core; ctx.fill();
        ctx.lineWidth = 3; ctx.strokeStyle = '#ffffff'; ctx.shadowColor = '#d8a0ff'; ctx.shadowBlur = 18; ctx.stroke(); ctx.shadowBlur = 0;
        for (let i = 0; i < 6; i++) { const a = now * 2 + i, r = (w * 0.9) * ((now * 0.7 + i / 6) % 1); ctx.fillStyle = i % 2 ? '#8ff0ff' : '#ffb8f0'; ctx.fillRect(Math.cos(a) * r, Math.sin(a) * r * 0.35, 3, 3); }
        ctx.restore(); } }
    // Dialga / Palkia: drop out of the rift, land beside you, hop around lost, then go back up
    for (const m of Object.values(c.mons)) {
      m.t += dt; const land = Math.min(1, m.t / 0.9), ease = 1 - Math.pow(1 - land, 3), wx = P.x + (m.side ? m.side * 95 : 110), wy = P.y - 20;
      let x = sx(wx), y = RY + (sy(wy) - RY) * ease, alpha = 1;
      if (m.hop > 0) { m.hop = Math.max(0, m.hop - dt * 1.6); y -= Math.abs(Math.sin(m.hop * Math.PI * 3)) * 28 * k; }
      if (m.leaving != null) { m.leaving += dt; const u = Math.min(1, m.leaving / 0.9); y = sy(wy) + (RY - sy(wy)) * u * u; alpha = 1 - u; }
      try { T().place(m.dex, { x: wx, y: wy - (m.leaving != null ? 300 : 0), bodyH: 70 }); } catch (_) {}
      if (alpha <= 0) continue;
      ctx.save(); ctx.globalAlpha = alpha; if (land >= 1 && m.leaving == null) { ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(x, sy(wy) + 4 * k, 30 * k, 9 * k, 0, 0, TAU); ctx.fill(); }
      ctx.translate(x, y); ctx.scale(k * 1.35 * m.look, k * 1.35); ctx.imageSmoothingEnabled = false;
      if (m.anim) { try { m.anim.loop(c.hit && !c.hit.done ? 'Attack' : 'Idle'); m.anim.dir = 0; m.anim.update(dt); m.anim.draw(ctx, 0, 0, {}); } catch (_) {} }
      ctx.restore(); }
    // the special move
    const h = c.hit; if (h) { h.t += dt; const kind = h.kind;
      if (!h.done && h.t >= 0.9) impact();
      if (kind === 'time' || kind === 'combo') { const u = Math.min(1, h.t / 1.2), R = Math.hypot(W, H) * u;   // ROAR OF TIME: a wave of frozen time across everything
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(143,240,255,' + (0.9 * (1 - u * 0.6)) + ')'; ctx.lineWidth = 26 * (1 - u) + 4; ctx.beginPath(); ctx.arc(PX, PY, R, 0, TAU); ctx.stroke();
        ctx.strokeStyle = 'rgba(42,124,255,.6)'; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(PX, PY, R * 0.7, 0, TAU); ctx.stroke();
        ctx.translate(PX, PY - 40 * k); ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, 0, 70, 0, TAU); ctx.stroke();   // the clock
        ctx.rotate(h.t * 9); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -58); ctx.stroke(); ctx.rotate(-h.t * 9 + h.t * 1.5); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(38, 0); ctx.stroke(); ctx.restore(); }
      if (kind === 'space' || kind === 'combo') { ctx.save();   // SPACIAL REND: giant tears in space slashed across the screen
        for (let i = 0; i < 6; i++) { const at = 0.12 * i + (kind === 'combo' ? 0.35 : 0), u = (h.t - at) / 0.25; if (u <= 0) continue; const len = Math.min(1, u), fade = Math.max(0, 1 - (h.t - at - 0.6) / 0.9);
          const y0 = H * (0.15 + 0.14 * i), x0 = i % 2 ? W * 1.05 : -W * 0.05, x1 = i % 2 ? -W * 0.05 : W * 1.05, y1 = y0 + (i % 2 ? -1 : 1) * H * 0.25;
          const xe = x0 + (x1 - x0) * len, ye = y0 + (y1 - y0) * len; ctx.globalAlpha = fade; ctx.lineCap = 'round';
          ctx.strokeStyle = '#ff6ac8'; ctx.lineWidth = 22; ctx.shadowColor = '#ff6ac8'; ctx.shadowBlur = 24; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(xe, ye); ctx.stroke();
          ctx.shadowBlur = 0; ctx.strokeStyle = '#0a0018'; ctx.lineWidth = 9; ctx.stroke(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke(); }
        ctx.restore(); }
      if (kind === 'combo' && h.t > 0.8 && h.t < 2.4) { ctx.save(); ctx.font = '900 ' + Math.round(Math.min(W / 16, 64)) + 'px Pixelify, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 8; ctx.strokeStyle = '#0a0018';
        ctx.globalAlpha = Math.min(1, (2.4 - h.t) / 0.4); const tx = 'ROAR OF TIME × SPACIAL REND'; ctx.strokeText(tx, W / 2, H * 0.3); const gt = ctx.createLinearGradient(W * 0.2, 0, W * 0.8, 0); gt.addColorStop(0, '#8ff0ff'); gt.addColorStop(1, '#ff9ad8'); ctx.fillStyle = gt; ctx.fillText(tx, W / 2, H * 0.3); ctx.restore(); } }
    if (c.flash > 0) { ctx.fillStyle = 'rgba(255,255,255,' + c.flash * 0.85 + ')'; ctx.fillRect(0, 0, W, H); c.flash = Math.max(0, c.flash - dt * 1.6); }
    if (c.solo && !c.hit) { ctx.font = '13px Pixelify, system-ui, sans-serif'; ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillText('Click / Enter: skip', W - 14, H - 14); }
  }
  // skip straight to the attack (solo)
  function skip() { const c = cs; if (!c || c.hit) return; const i = c.steps.findIndex(s => s.act === 'attack'); if (i < 0) return;
    if (c.riftT < 0) c.riftT = 1.2; if (!Object.keys(c.mons).length) for (const [k, w] of c.who.entries()) c.mons[w] = { dex: w, t: 1, side: c.who.length > 1 ? (k ? 1 : -1) : 0, anim: mkAnim(w), hop: 0, look: 1 };
    c.i = i - 1; c.next = 0; }
  addEventListener('keydown', e => { if (!cs || !cs.solo) return; const k = (e.key || '').toLowerCase(); if (k === 'enter' || k === ' ' || k === 'escape') { e.preventDefault(); e.stopImmediatePropagation(); skip(); } }, true);
  addEventListener('pointerdown', () => { if (cs && cs.solo) skip(); }, true);

  let last = performance.now();
  function loop(now) { requestAnimationFrame(loop); const dt = Math.min(0.1, (now - last) / 1000); last = now;
    try { const c = cs;
      if (c) { const g = B()?.game; if (!g || !g.player || g.player !== c.p || g.state === 'over' || g.state === 'ui') { finish(); }
        else { c.p.invuln = Math.max(Number(c.p.invuln) || 0, 0.5); if (c.closing != null) c.closing += dt; c.t += dt; c.next -= dt; if (c.next <= 0) advance(); } }
      draw(dt); } catch (e) { console.warn('[creation]', e); } }
  function init() { document.body.append(ov); requestAnimationFrame(loop); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
  window.PS_CREATION_RIFT = { active: false, cfg: CFG, start: (forceCombo, forceWho) => { const p = E()?.Game?.player; if (!p || cs) return false; const R = Math.random;
      if (forceCombo != null || forceWho) Math.random = () => forceCombo ? 0 : forceWho === PALKIA ? 0.75 : forceWho === DIALGA ? 0.25 : R(); try { start(p); } finally { Math.random = R; } return true; },
    get state() { return cs && { step: cs.i, of: cs.steps.length, who: cs.who, combo: cs.combo, hit: cs.hit && { kind: cs.hit.kind, dmg: Math.round(cs.hit.dmg), done: cs.hit.done, hits: cs.hits } }; } };
})();
