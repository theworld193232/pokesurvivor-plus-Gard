/* BIRTH ISLAND — the only way to get Deoxys.
   - Original Mode only, solo. When the map changes abruptly (you cross into a new biome region, or a Rift
     pulls you in or out of its arena) there is a small chance you end up on Birth Island instead: a lonely
     triangle of cliffs out at sea, with a strange black TRIANGLE sitting on the rock. At most once per run.
   - The puzzle, like FireRed / LeafGreen: walk on the tile grid and touch the triangle. It jumps somewhere
     else. From then on you must reach it in exactly the fewest steps possible (walking around trees and
     cliffs). Take even one step too many and it snaps back to where it started. Touch it 10 times and it turns
     red... and Deoxys descends. You are thrown back into battle with it: defeat it before it flees to catch it.
   - Walk down the pier to the boat to leave without solving it (the island is gone for this run).
   - Deoxys can't be obtained any other way: it is kept out of wild spawns, and any grant of Deoxys that does not
     come from Birth Island is refused (a Deoxys already in an old save is kept).
   Map: hand-made 16-px tiles drawn here (no image files). LoverGare's test panel gets a "Birth Island" button. */
(() => {
  'use strict';
  if (window.PS_BIRTH_ISLAND_INSTALLED) return; window.PS_BIRTH_ISLAND_INSTALLED = true;
  const B = () => window.PS_MEGA_BRIDGE_V5, E = () => window.PS_HOOPA_ENGINE;
  const TAU = Math.PI * 2, DEOXYS = 386, FROM = 'birth-island';
  const CFG = { chance: 0.03, stepTime: 0.16 };   // chance per abrupt map change; seconds per tile step
  // Map legend: ~ sea, r rock in the sea, C cliff, . grass, # rock floor, T tree, S stairs, B pier, D boat (leave)
  const GRID = [
    '~~~~~~~~~~~~~~~~~~~~~~~~~',
    '~~~~~~~~~~~~r~~~~~~~~~~~~',
    '~~~~~~~~~~~CTC~~~~~~~~~~~',
    '~~~~~~~~~~C...C~~~~~~~~~~',
    '~~~~r~~~~C.....C~~~~r~~~~',
    '~~~~~~~~C...#...C~~~~~~~~',
    '~~~~~~~C...###...C~~~~~~~',
    '~~~~~~C...#####...C~~~~~~',
    '~~~~~C...#######...C~~~~~',
    '~~~~C...#########...C~~~~',
    '~~~C...###########...C~~~',
    '~~C.T.#############.T.C~~',
    '~~C...#############...C~~',
    '~~CCCCCCCCCCSCCCCCCCCCC~~',
    '~~CCCCCCCCCCSCCCCCCCCCC~~',
    '~~~~~~~~~~~~B~~~~~~~~~~~~',
    '~~~~~~~~~~~~B~~~~~~~~~~~~',
    '~~~~~~~~~~~~B~~~~~~~~~~~~',
    '~~~~~~~~~~~~D~~~~~~~~~~~~',
    '~~~~~~~~~~~~~~~~~~~~~~~~~'];
  const GW = GRID[0].length, GH = GRID.length, TS = 16;   // tiles; art pixels per tile
  const SPAWN = [12, 17];
  // where the triangle sits for each touch; touching it at the last spot wakes Deoxys
  const SEQ = [[12, 8], [12, 4], [19, 11], [5, 11], [9, 7], [15, 7], [12, 12], [3, 12], [21, 12], [12, 6]];
  const tile = (x, y) => (x < 0 || y < 0 || x >= GW || y >= GH) ? '~' : GRID[y][x];
  const walkable = (x, y) => '.#SBD'.includes(tile(x, y));
  const say = (t, d) => { try { E().Spawner.say(t, d || 3); } catch (_) {} };
  const sfx = n => { try { B().audio?.sfx?.(n); } catch (_) {} };
  function cry(dex) { try { let v = 0.6; const st = E().Audio && E().Audio.settings; if (st && st.sfx != null) v = Number(st.sfx) > 1 ? Number(st.sfx) / 100 : Number(st.sfx); const a = new Audio('assets/cries/' + dex + '.mp3'); a.volume = Math.max(0, Math.min(1, v * 0.35)); a.play().catch(() => {}); } catch (_) {} }

  // ================= Deoxys is Birth Island only =================
  let allow = false;   // true while the Deoxys from Birth Island is out in the battle
  let seenSave = null, legacy = false, legacyShiny = false;
  function snap(s) { seenSave = s; legacy = !!(s && s.owned && s.owned[DEOXYS]); legacyShiny = !!(s && s.shiny && s.shiny[DEOXYS]); }
  function guard() {
    const N = E(), D = N && N.DB; if (!D) return;
    if (!D.__birthIsland && typeof D.grant === 'function') { D.__birthIsland = true;
      const g = D.grant, gs = D.grantShiny;
      D.grant = function (dex, from) { if (Number(dex) === DEOXYS) { if (!allow) return; from = FROM; } return g.call(this, dex, from); };
      if (typeof gs === 'function') D.grantShiny = function (dex, from) { if (Number(dex) === DEOXYS) { if (!allow) return false; from = FROM; } return gs.call(this, dex, from); };
      try { D.onSync(() => snap(D.save)); } catch (_) {} }
    // anything that writes Deoxys straight into the save without going through DB.grant is undone
    const s = D.save; if (!s || !s.owned) return; if (s !== seenSave) snap(s);
    let fix = false;
    if (!legacy && s.owned[DEOXYS] && s.owned[DEOXYS].from !== FROM) { delete s.owned[DEOXYS]; fix = true; }
    if (!legacyShiny && s.shiny && s.shiny[DEOXYS] && !(s.owned[DEOXYS] && s.owned[DEOXYS].from === FROM)) { delete s.shiny[DEOXYS]; fix = true; }
    if (fix) { try { D.commit(); } catch (_) {} }
    // no wild Deoxys
    const EN = N.Enemies; if (EN && typeof EN.bagAt === 'function' && !EN.bagAt.__birthIsland) { const bag = EN.bagAt;
      EN.bagAt = function () { const r = bag.apply(this, arguments); if (!Array.isArray(r)) return r; const f = r.filter(d => Number(d && d.dex) !== DEOXYS); return f.length ? f : r; };
      EN.bagAt.__birthIsland = true; }
  }

  // ================= tile art (16-px tiles, GBA style) =================
  let mapArt = null;   // [frame0, frame1] canvases (the sea animates between them)
  function rnd(x, y, i) { const n = Math.sin(x * 127.1 + y * 311.7 + i * 74.7) * 43758.5453; return n - Math.floor(n); }
  const isSea = (x, y) => tile(x, y) === '~' || tile(x, y) === 'r';
  function shallow(x, y) { for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if (!isSea(x + i, y + j) && tile(x + i, y + j) !== 'D') return true; return false; }
  function drawSea(m, x, y, f) {
    const px = x * TS, py = y * TS, sh = shallow(x, y);
    m.fillStyle = sh ? '#78b0f8' : '#5890f0'; m.fillRect(px, py, TS, TS);
    m.fillStyle = sh ? '#a8d0ff' : '#80b0f8';
    for (let k = 0; k < 2; k++) { const ox = ((x + y + k) % 2) * 8 + f * 3, oy = k * 8 + 3; for (let i = 0; i < 5; i++) m.fillRect(px + (ox + i) % TS, py + oy - (i === 2 ? 1 : 0), 1, 1); }
    m.fillStyle = sh ? '#c8e4ff' : '#a0c8ff'; if (rnd(x, y, f) > 0.7) m.fillRect(px + 2 + Math.floor(rnd(x, y, 3) * 11), py + 2 + Math.floor(rnd(x, y, 4) * 11), 2, 1);
  }
  function drawGrass(m, x, y) {
    const px = x * TS, py = y * TS; m.fillStyle = '#80c8a0'; m.fillRect(px, py, TS, TS);
    for (let i = 0; i < 3; i++) { const gx = px + 2 + Math.floor(rnd(x, y, i) * 11), gy = py + 3 + Math.floor(rnd(x, y, i + 5) * 10);
      m.fillStyle = '#a8e0c0'; m.fillRect(gx, gy, 1, 2); m.fillRect(gx + 2, gy, 1, 2); m.fillStyle = '#60a880'; m.fillRect(gx + 1, gy + 1, 1, 2); }
  }
  function drawRock(m, x, y) {
    const px = x * TS, py = y * TS; m.fillStyle = '#a8a098'; m.fillRect(px, py, TS, TS);
    for (let i = 0; i < 7; i++) { m.fillStyle = i % 2 ? '#948c84' : '#bcb4ac'; m.fillRect(px + Math.floor(rnd(x, y, i) * 15), py + Math.floor(rnd(x, y, i + 9) * 15), 1 + (i % 3 === 0 ? 1 : 0), 1); }
    // soft edge where the rock meets the grass
    m.fillStyle = 'rgba(96,88,80,.35)'; if (tile(x, y - 1) === '.') m.fillRect(px, py, TS, 1); if (tile(x - 1, y) === '.') m.fillRect(px, py, 1, TS); if (tile(x + 1, y) === '.') m.fillRect(px + TS - 1, py, 1, TS);
  }
  function drawCliff(m, x, y) {
    const px = x * TS, py = y * TS; m.fillStyle = '#b07850'; m.fillRect(px, py, TS, TS);
    for (let r = 0; r < TS; r += 4) { m.fillStyle = '#885838'; m.fillRect(px, py + r + 3, TS, 1); m.fillStyle = '#d09868'; m.fillRect(px, py + r, TS, 1); }
    for (let i = 0; i < 3; i++) { m.fillStyle = '#704830'; m.fillRect(px + Math.floor(rnd(x, y, i) * 14), py + Math.floor(rnd(x, y, i + 2) * 4) * 4 + 1, 2, 2); }
    if (tile(x, y - 1) === '.' || tile(x, y - 1) === '#') { m.fillStyle = '#60a880'; m.fillRect(px, py, TS, 2); }   // grass lip on top
    if (isSea(x, y + 1)) { m.fillStyle = '#5a3a24'; m.fillRect(px, py + TS - 2, TS, 2); }   // dark foot at the waterline
  }
  function drawTree(m, x, y) {
    drawGrass(m, x, y); const cx = x * TS + 8, by = y * TS + 15;
    m.fillStyle = 'rgba(0,0,0,.22)'; m.fillRect(cx - 7, by - 2, 14, 3);
    m.fillStyle = '#6a4a2a'; m.fillRect(cx - 2, by - 6, 4, 5);
    const blob = (r, oy, c) => { m.fillStyle = c; for (let j = -r; j <= r; j++) { const w = Math.round(Math.sqrt(r * r - j * j)); m.fillRect(cx - w, by - 12 + oy + j, w * 2, 1); } };
    blob(9, -2, '#2f7a40'); blob(8, -3, '#46a050'); blob(5, -6, '#68c060'); m.fillStyle = '#98e080'; m.fillRect(cx - 4, by - 21, 3, 2);
  }
  function drawStairs(m, x, y) { const px = x * TS, py = y * TS; m.fillStyle = '#c8c8c8'; m.fillRect(px + 3, py, 10, TS); m.fillStyle = '#e8e8e8'; for (let r = 0; r < TS; r += 3) m.fillRect(px + 3, py + r, 10, 1); m.fillStyle = '#808080'; for (let r = 2; r < TS; r += 3) m.fillRect(px + 3, py + r, 10, 1); m.fillStyle = '#885838'; m.fillRect(px, py, 3, TS); m.fillRect(px + 13, py, 3, TS); }
  function drawPier(m, x, y) { drawSea(m, x, y, 0); const px = x * TS, py = y * TS; m.fillStyle = '#d8b860'; m.fillRect(px + 2, py, 12, TS); m.fillStyle = '#b09040'; for (let i = 4; i < 14; i += 3) m.fillRect(px + i, py, 1, TS); m.fillStyle = '#806020'; m.fillRect(px + 2, py, 1, TS); m.fillRect(px + 13, py, 1, TS); m.fillStyle = '#f0d890'; for (let r = 0; r < TS; r += 6) m.fillRect(px + 3, py + r, 10, 1); }
  function drawBoat(m, x, y, f) { drawSea(m, x, y, f); const px = x * TS, py = y * TS;
    m.fillStyle = '#e8e0d0'; m.fillRect(px + 1, py + 2, 14, 12); m.fillStyle = '#d04040'; m.fillRect(px + 1, py + 2, 14, 5); m.fillStyle = '#902828'; for (let i = 2; i < 15; i += 3) m.fillRect(px + i, py + 2, 1, 5);
    m.fillStyle = '#5a5a6a'; m.fillRect(px + 1, py + 13, 14, 2); m.fillStyle = '#d04040'; m.fillRect(px + 6, py + 9, 4, 1); m.fillRect(px + 7, py + 10, 2, 1); }
  function drawSeaRock(m, x, y, f) { drawSea(m, x, y, f); const px = x * TS, py = y * TS; m.fillStyle = '#5a6070'; m.fillRect(px + 3, py + 6, 10, 7); m.fillStyle = '#a8b0c0'; m.fillRect(px + 4, py + 5, 8, 5); m.fillStyle = '#e0e8f0'; m.fillRect(px + 5, py + 5, 3, 2); m.fillStyle = '#c8e4ff'; m.fillRect(px + 2, py + 13, 12, 1); }
  function buildArt() {
    if (mapArt) return mapArt; mapArt = [];
    for (let f = 0; f < 2; f++) { const c = document.createElement('canvas'); c.width = GW * TS; c.height = GH * TS; const m = c.getContext('2d');
      for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) { const t = tile(x, y);
        if (t === '~') drawSea(m, x, y, f); else if (t === 'r') drawSeaRock(m, x, y, f); else if (t === 'C') drawCliff(m, x, y); else if (t === '.') drawGrass(m, x, y);
        else if (t === '#') drawRock(m, x, y); else if (t === 'S') drawStairs(m, x, y); else if (t === 'B') drawPier(m, x, y); else if (t === 'D') drawBoat(m, x, y, f); }
      for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (tile(x, y) === 'T') drawTree(m, x, y);   // trees last: their tops overlap the row above
      mapArt.push(c); }
    return mapArt;
  }

  // ================= the puzzle =================
  // fewest steps from (sx,sy) to any tile next to the triangle (the triangle itself blocks the way)
  function shortest(sx, sy, tx, ty) {
    const goal = (x, y) => Math.abs(x - tx) + Math.abs(y - ty) === 1, seen = new Uint8Array(GW * GH), q = [[sx, sy, 0]]; seen[sy * GW + sx] = 1;
    while (q.length) { const [x, y, d] = q.shift(); if (goal(x, y)) return d;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (!walkable(nx, ny) || (nx === tx && ny === ty) || seen[ny * GW + nx]) continue; seen[ny * GW + nx] = 1; q.push([nx, ny, d + 1]); } }
    return Infinity;
  }
  let st = null;   // the island scene: {x,y,fx,fy,tx,ty,mv,face,step,tri,steps,need,t,msg,solved,anim,...}
  function moveTriangle(i) { st.step = i; const [x, y] = SEQ[i]; st.tri = { x, y, t: 0 }; st.steps = 0; st.need = i === 0 ? null : shortest(st.x, st.y, x, y); }
  function touch() {
    if (st.solved) return; const first = st.step === 0 && st.need === null;
    if (!first && st.steps !== st.need) {   // too many steps: back to the start
      sfx('error'); st.flash = { c: '#202028', t: 0 }; moveTriangle(0); st.need = null; st.streak = 0;
      text('...The triangle flickered and returned to where it first was.'); return; }
    st.streak = (st.streak || 0) + 1; sfx('star');
    if (st.step >= SEQ.length - 1) { solve(); return; }
    st.flash = { c: '#c47bff', t: 0 }; moveTriangle(st.step + 1);
    text(st.streak === 1 ? 'The triangle shimmered... and moved! It seems to want you to come straight to it.' : 'The triangle moved again! (' + st.streak + ' / ' + SEQ.length + ')');
  }
  function solve() {
    st.solved = 0.001; st.red = true; text('The triangle is glowing bright red...!'); sfx('judge');
    setTimeout(() => { if (!st) return; st.deoxys = 0.001; cry(DEOXYS); sfx('legend'); try { B().camera?.kick?.(1); } catch (_) {} text('Deoxys appeared!'); }, 1700);
    setTimeout(() => { if (!st) return; leave(() => spawnDeoxys()); }, 4200);
  }
  function spawnDeoxys() {
    allow = true; let e = null;
    try { e = window.PS_ROAMERS && window.PS_ROAMERS.spawn(DEOXYS, 'roam'); } catch (err) { console.warn('[birth-island]', err); }
    if (!e) { allow = false; return; }
    const p = B()?.game?.player; if (p) { e.x = p.x + 180; e.y = p.y - 40; }
    say('Deoxys followed you out of Birth Island!', 3.5);
    const watch = setInterval(() => { if (!e.dead && e.hp > 0 && B()?.game?.state !== 'over' && B()?.game?.state !== 'ui') return; clearInterval(watch); setTimeout(() => { allow = false; }, 1500); }, 300);
  }

  // ================= scene =================
  const cv = document.createElement('canvas'); cv.id = 'ps-birth'; cv.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:55;display:none;background:#5890f0;touch-action:none';
  const fade = document.createElement('div'); fade.style.cssText = 'position:fixed;inset:0;z-index:70;pointer-events:none;background:#fff;opacity:0;transition:opacity .45s';
  const keys = {};
  function flashTo(cb) { fade.style.opacity = '1'; setTimeout(() => { try { cb(); } catch (e) { console.warn('[birth-island]', e); } setTimeout(() => { fade.style.opacity = '0'; }, 160); }, 480); }
  function makeAnim(p) { try { const Sp = E()?.Sprites; if (!Sp || !Sp.Animator || !p || !p.anim) return null; return new Sp.Animator(p.anim.dex, Number(p.anim.scale) || 1, !!p.anim.shiny); } catch (_) { return null; } }
  function text(t) { if (st) st.msg = { t, at: performance.now() / 1000 }; }
  let usedRun = null;   // the run (player object) that already had its Birth Island
  function enter() {
    const g = B()?.game, p = g?.player; if (!p || st || (E()?.Coop?.active) || (window.PS_SAFEZONE && window.PS_SAFEZONE.active)) return false;
    usedRun = p; buildArt();
    flashTo(() => {
      try { g.soloHold(true); } catch (_) {}
      st = { x: SPAWN[0], y: SPAWN[1], fx: SPAWN[0], fy: SPAWN[1], mv: 0, face: [0, -1], t: 0, anim: makeAnim(p), dex: p.anim && p.anim.dex, bump: 0 };
      moveTriangle(0); st.need = null;
      for (const k in keys) keys[k] = false;
      cv.style.display = 'block'; document.body.classList.add('ps-in-birth'); window.PS_BIRTH_ISLAND.active = true;
      text('...Where is this? The world twisted, and you washed up on a lonely island. Something sits atop the rock.');
      sfx('toll');
    });
    return true;
  }
  function leave(then) {
    if (!st || st.leaving) return; st.leaving = true;
    flashTo(() => {
      const g = B()?.game, p = g?.player; cv.style.display = 'none'; document.body.classList.remove('ps-in-birth'); st = null; window.PS_BIRTH_ISLAND.active = false;
      try { g.soloHold(false); } catch (_) {}
      if (p) p.invuln = Math.max(Number(p.invuln) || 0, 2);
      if (then) setTimeout(() => { try { then(); } catch (e) { console.warn('[birth-island]', e); } }, 80);
      else say('The island vanished into the sea mist...', 2.5);
    });
  }
  function wantDir() {
    let dx = (keys.arrowright || keys.d ? 1 : 0) - (keys.arrowleft || keys.a ? 1 : 0), dy = (keys.arrowdown || keys.s ? 1 : 0) - (keys.arrowup || keys.w ? 1 : 0);
    if (pad.on && (pad.dx || pad.dy)) { dx = pad.dx; dy = pad.dy; }
    if (dx && dy) { if (Math.abs(pad.on ? pad.rx : 0) >= Math.abs(pad.on ? pad.ry : 1)) dy = 0; else dx = 0; }   // one axis at a time
    return dx || dy ? [Math.sign(dx), Math.sign(dy)] : null;
  }
  function update(dt) {
    const a = st; if (!a) return; a.t += dt; if (a.tri) a.tri.t += dt; if (a.flash) { a.flash.t += dt; if (a.flash.t > 0.6) a.flash = null; }
    if (a.solved) a.solved += dt; if (a.deoxys) a.deoxys += dt; a.bump = Math.max(0, a.bump - dt);
    const p = B()?.game?.player;
    if (a.mv > 0) { a.mv -= dt / CFG.stepTime; if (a.mv <= 0) { a.mv = 0; a.fx = a.x; a.fy = a.y; if (tile(a.x, a.y) === 'D') { text('You boarded the boat and sailed away.'); leave(); return; } } }
    if (a.mv === 0 && !a.solved && !a.leaving) { const d = wantDir();
      if (!d) a.hold = false;   // after a touch the triangle's old tile is free: holding the key must not walk into it (that would cost a step)
      if (d) { a.face = d; const nx = a.x + d[0], ny = a.y + d[1];
        if (a.hold) { /* just touched the triangle: wait for the direction to be let go */ }
        else if (a.tri && nx === a.tri.x && ny === a.tri.y) { if (a.bump <= 0) { a.bump = 0.35; a.hold = true; touch(); } }
        else if (walkable(nx, ny)) { a.fx = a.x; a.fy = a.y; a.x = nx; a.y = ny; a.mv = 1; a.steps++; } } }
    a.walk = a.mv > 0 || !!wantDir();
    if (a.anim) { try { if (p && p.anim && p.anim.dex !== a.dex) { a.anim = makeAnim(p); a.dex = p.anim.dex; } a.anim.loop(a.walk ? 'Walk' : 'Idle'); a.anim.dir = E().Sprites.dirFromAngle(Math.atan2(a.face[1], a.face[0])); a.anim.update(dt); } catch (_) {} }
  }
  function interact() { const a = st; if (!a || a.mv || a.solved) return; const nx = a.x + a.face[0], ny = a.y + a.face[1]; if (a.tri && nx === a.tri.x && ny === a.tri.y && a.bump <= 0) { a.bump = 0.35; touch(); } }

  // ---- drawing ----
  function draw() {
    const a = st, ctx = cv.getContext('2d'), dpr = Math.min(2, devicePixelRatio || 1), W = innerWidth, H = innerHeight;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.imageSmoothingEnabled = false;
    const T = Math.round(Math.max(36, Math.min(76, Math.min(W / 15, H / 10)))), Z = T / TS, now = performance.now() / 1000;
    // camera follows the player, clamped to the map (centered when the map is smaller than the screen)
    const u = 1 - a.mv, px = (a.fx + (a.x - a.fx) * u + 0.5) * T, py = (a.fy + (a.y - a.fy) * u + 0.5) * T, mw = GW * T, mh = GH * T;
    const ox = mw <= W ? (W - mw) / 2 : Math.round(Math.min(0, Math.max(W - mw, W / 2 - px))), oy = mh <= H ? (H - mh) / 2 : Math.round(Math.min(0, Math.max(H - mh, H / 2 - py)));
    ctx.fillStyle = '#5890f0'; ctx.fillRect(0, 0, W, H);
    ctx.drawImage(mapArt[Math.floor(now * 1.6) % 2], ox, oy, mw, mh);
    // the triangle
    if (a.tri) { const X = ox + (a.tri.x + 0.5) * T, Y = oy + (a.tri.y + 0.5) * T, s = T * 0.34, appear = Math.min(1, a.tri.t / 0.45);
      ctx.save(); ctx.translate(X, Y + T * 0.08); ctx.globalAlpha = appear;
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(0, s * 0.85, s * 0.95, s * 0.28, 0, 0, TAU); ctx.fill();
      const glow = a.red ? 0.55 + 0.45 * Math.sin(now * 10) : 0.12 + 0.1 * Math.sin(now * 2);
      ctx.globalCompositeOperation = 'lighter'; const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 2.4); gr.addColorStop(0, a.red ? 'rgba(255,60,60,' + glow + ')' : 'rgba(180,140,255,' + glow + ')'); gr.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, s * 2.4, 0, TAU); ctx.fill(); ctx.globalCompositeOperation = 'source-over';
      const tri = (k) => { ctx.beginPath(); ctx.moveTo(0, -s * k); ctx.lineTo(s * 0.95 * k, s * 0.75 * k); ctx.lineTo(-s * 0.95 * k, s * 0.75 * k); ctx.closePath(); };
      tri(1); ctx.fillStyle = a.red ? '#d82020' : '#303038'; ctx.fill(); ctx.lineWidth = Math.max(2, Z); ctx.strokeStyle = a.red ? '#ffb0a0' : '#787888'; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(-s * 0.95, s * 0.75); ctx.lineTo(-s * 0.4, s * 0.75); ctx.closePath(); ctx.fillStyle = a.red ? '#ff6050' : '#505060'; ctx.fill();   // lit face
      ctx.restore();
      if (a.solved) { const k = Math.min(1, a.solved / 1.6); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(255,90,70,' + (1 - k) + ')'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(X, Y, T * (0.5 + k * 3), 0, TAU); ctx.stroke(); ctx.restore(); } }
    // Deoxys descends over the triangle
    if (a.deoxys && a.tri) { const X = ox + (a.tri.x + 0.5) * T, Y = oy + (a.tri.y - 0.2) * T, k = Math.min(1, a.deoxys / 1.2), drop = (1 - k) * T * 4;
      ctx.save(); ctx.globalAlpha = k; ctx.globalCompositeOperation = 'lighter'; const gr = ctx.createRadialGradient(X, Y - drop, 0, X, Y - drop, T * 2); gr.addColorStop(0, 'rgba(255,150,90,.7)'); gr.addColorStop(1, 'rgba(120,80,255,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(X, Y - drop, T * 2, 0, TAU); ctx.fill(); ctx.restore();
      ctx.save(); ctx.globalAlpha = k; if (!a.dxAnim) a.dxAnim = (() => { try { return new (E().Sprites.Animator)(DEOXYS, 1, false); } catch (_) { return null; } })();
      if (a.dxAnim) { try { a.dxAnim.loop('Idle'); a.dxAnim.dir = 0; a.dxAnim.update(1 / 60); ctx.translate(X, Y - drop + T * 0.4); ctx.scale(T / 22, T / 22); a.dxAnim.draw(ctx, 0, 0, {}); } catch (_) {} }
      else if (window.PS_FX && window.PS_FX.sprite) window.PS_FX.sprite(ctx, String(DEOXYS), 'Idle', Math.PI / 2, a.deoxys, X, Y - drop + T * 0.4, T / 11, 1);
      ctx.restore(); }
    // the player's Pokemon
    { const p = B()?.game?.player, X = ox + px, Y = oy + py + T * 0.32, k = T / 32; ctx.save(); ctx.translate(X, Y); ctx.scale(k * 1.15, k * 1.15); let drawn = false;
      if (a.anim) { try { try { E().Sprites.drawShadow(ctx, p && p.skin, 0, 0); } catch (_) {} a.anim.draw(ctx, 0, 0, {}); drawn = true; } catch (_) {} }
      ctx.restore();
      if (!drawn) { ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(X, Y, T * 0.3, T * 0.1, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(X, Y - T * 0.35, T * 0.25, 0, TAU); ctx.fill(); } }
    // tree tops in front of the player when they walk behind one
    for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (tile(x, y) === 'T' && a.y === y - 1 && Math.abs(a.x - x) <= 1) ctx.drawImage(mapArt[0], x * TS - 4, y * TS - 14, TS + 8, 14, ox + x * T - 4 * Z, oy + y * T - 14 * Z, T + 8 * Z, 14 * Z);
    if (a.flash) { ctx.fillStyle = a.flash.c; ctx.globalAlpha = 0.35 * (1 - a.flash.t / 0.6); ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
    if (a.red) { ctx.fillStyle = 'rgba(255,40,40,' + (0.08 + 0.06 * Math.sin(now * 10)) + ')'; ctx.fillRect(0, 0, W, H); }
    // title plate (FRLG location sign) for the first seconds
    if (a.t < 3.2) { const k = Math.min(1, a.t / 0.4, (3.2 - a.t) / 0.4), w = 210, h = 40, x = 16, y = 16 - (1 - k) * 60;
      ctx.save(); ctx.globalAlpha = k; ctx.fillStyle = '#f8f0d8'; ctx.strokeStyle = '#806040'; ctx.lineWidth = 4; rr(ctx, x, y, w, h, 6); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#403830'; ctx.font = '700 20px PSBW, Pixelify, monospace'; ctx.textAlign = 'center'; ctx.fillText('BIRTH ISLAND', x + w / 2, y + 27); ctx.restore(); }
    // FRLG-style text box
    if (a.msg) { const age = now - a.msg.at; if (age < 6) { const bw = Math.min(W - 24, 720), bh = 74, bx = (W - bw) / 2, by = H - bh - 14;
      ctx.save(); ctx.globalAlpha = Math.min(1, (6 - age) / 0.5); ctx.fillStyle = '#f8f8f8'; ctx.strokeStyle = '#506078'; ctx.lineWidth = 4; rr(ctx, bx, by, bw, bh, 10); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#a8c0d8'; ctx.lineWidth = 2; rr(ctx, bx + 5, by + 5, bw - 10, bh - 10, 7); ctx.stroke();
      ctx.font = '18px PSBW, Pixelify, monospace'; ctx.textAlign = 'left'; const shown = a.msg.t.slice(0, Math.floor(age * 60)), lines = wrap(ctx, shown, bw - 36);
      lines.slice(0, 2).forEach((l, i) => { ctx.fillStyle = '#d0d0c8'; ctx.fillText(l, bx + 19, by + 31 + i * 24); ctx.fillStyle = '#484850'; ctx.fillText(l, bx + 18, by + 30 + i * 24); });
      ctx.restore(); } }
    // hint corner
    ctx.save(); ctx.font = '13px PSBW, Pixelify, monospace'; ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillText('Arrows / WASD: walk · walk into the triangle to touch it · the boat: leave', W - 13, H - (a.msg && now - a.msg.at < 6 ? 98 : 13) + 1); ctx.fillStyle = '#fff'; ctx.fillText('Arrows / WASD: walk · walk into the triangle to touch it · the boat: leave', W - 14, H - (a.msg && now - a.msg.at < 6 ? 98 : 14)); ctx.restore();
  }
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function wrap(ctx, t, w) { const out = []; let line = ''; for (const word of t.split(' ')) { const n = line ? line + ' ' + word : word; if (ctx.measureText(n).width > w && line) { out.push(line); line = word; } else line = n; } if (line) out.push(line); return out.length > 2 ? out.slice(-2) : out; }

  // ---- input ----
  addEventListener('keydown', e => {
    if (!st) return; const k = (e.key || '').toLowerCase(); keys[k] = true;
    if ((k === 'e' || k === 'enter' || k === ' ' || k === 'z') && !e.repeat) interact();
    e.stopImmediatePropagation(); e.preventDefault();
  }, true);
  addEventListener('keyup', e => { if (!st) return; keys[(e.key || '').toLowerCase()] = false; e.stopImmediatePropagation(); }, true);
  addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
  const pad = { on: false, x0: 0, y0: 0, dx: 0, dy: 0, rx: 0, ry: 0, moved: false };
  cv.addEventListener('pointerdown', e => { if (!st) return; pad.on = true; pad.moved = false; pad.x0 = e.clientX; pad.y0 = e.clientY; pad.dx = pad.dy = 0; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', e => { if (!pad.on) return; const dx = e.clientX - pad.x0, dy = e.clientY - pad.y0; pad.rx = dx; pad.ry = dy;
    if (Math.hypot(dx, dy) > 18) { pad.moved = true; if (Math.abs(dx) > Math.abs(dy)) { pad.dx = Math.sign(dx); pad.dy = 0; } else { pad.dy = Math.sign(dy); pad.dx = 0; } } else { pad.dx = pad.dy = 0; } });
  cv.addEventListener('pointerup', () => { if (pad.on && !pad.moved) interact(); pad.on = false; pad.dx = pad.dy = 0; });

  // ================= when the map changes abruptly =================
  let runP = null, lastBiome = null, lastArena = null;
  function mayWarp() {
    const N = E(), g = B()?.game, p = g?.player; if (!N || !p || g.state !== 'playing' || st) return;
    if (p !== runP) { runP = p; lastBiome = null; lastArena = null; }
    if (usedRun === p) return;
    if (window.PS_STORY && window.PS_STORY.on()) return;   // Original Mode only
    if ((N.Coop && N.Coop.active) || (window.PS_MODES && window.PS_MODES.run && window.PS_MODES.run.mode === 'legend') || (window.PS_SAFEZONE && window.PS_SAFEZONE.active) || (N.Judgment && N.Judgment.active)) return;
    let changed = false;
    const arena = !!(N.Rift && N.Rift.inArena); if (lastArena !== null && arena !== lastArena) changed = true; lastArena = arena;
    let biome = null; try { biome = window.PS_BIOME_AT ? window.PS_BIOME_AT(p.x, p.y) : null; } catch (_) {}
    if (biome && lastBiome && biome !== lastBiome) changed = true; if (biome) lastBiome = biome;
    if (changed && Math.random() < CFG.chance) enter();
  }

  function testBtn() { const t = document.getElementById('ps-sz-test'); if (!t || t.querySelector('[data-birth]')) return;
    const b = document.createElement('button'); b.dataset.birth = '1'; b.textContent = 'Birth Island'; b.addEventListener('click', e => { e.stopPropagation(); enter(); }); t.appendChild(b); }
  let last = performance.now(), slow = 0;
  function loop(now) { requestAnimationFrame(loop); const dt = Math.min(0.1, (now - last) / 1000); last = now;
    try { slow += dt; if (slow > 0.25) { slow = 0; guard(); testBtn(); }
      if (st) { update(dt); if (st) draw(); } else mayWarp(); } catch (e) { console.warn('[birth-island]', e); } }
  function init() { document.body.append(cv, fade); requestAnimationFrame(loop); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
  window.PS_BIRTH_ISLAND = { active: false, enter, leave, cfg: CFG, seq: SEQ, shortest,
    get state() { return st && { x: st.x, y: st.y, step: st.step, steps: st.steps, need: st.need, tri: st.tri && [st.tri.x, st.tri.y], solved: !!st.solved }; } };
})();
