/* [Gard v92] Groudon's Den — a place inside a place, like the haunted mansion in the Shady Forest or the Regigigas
   temple on the snowy mountain.
   Somewhere out in Cinderwake Caldera (Act 4) a mountain stands with a cave in its foot, lava pouring down its face on
   both sides. As you get close the ground starts to tremble, magma fissures and black glass spires show up, and the
   heat rises. Walk into the cave and you go down into the mountain's lower levels: a cavern of brown stone, a lava
   channel crossed on a rope bridge, crystal alcoves, and at the bottom a great lava lake fed by lavafalls with an
   island in the middle - Groudon's den. Step onto the island and Groudon wakes. Beat it and it joins you (10% shiny,
   js/legend-shiny.js). The stairs at the cave's mouth take you back out.
   Everything is pixel art drawn here (2 world px per art pixel, like the rest of the game); collision, spawns and
   lava follow the den's own map while you're inside, and Cinderwake's own world takes over again outside. */
(function install() {
  'use strict';
  const R = window.__PSX_REG__, A = window.PSXAI, V = window.PS_VOLCANO;
  if (!R || !A || !V || !V.setReserve || !R.World || !R.Training) { setTimeout(install, 120); return; }
  if (window.PS_GROUDON_DEN) return;
  const TAU = Math.PI * 2, GROUDON = 383;
  const OX = 120000, OY = 120000, W = 1920, H = 1600, CS = 8, GW = W / CS, GH = H / CS;   // the den, far from the overworld
  const hash = (x, y, s) => { let n = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(s | 0, 1274126177); n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967295; };
  const lerp = (a, b, t) => a + (b - a) * t, clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  function vn(x, y, s) { const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy); return lerp(lerp(hash(ix, iy, s), hash(ix + 1, iy, s), u), lerp(hash(ix, iy + 1, s), hash(ix + 1, iy + 1, s), u), v); }
  const canvasOf = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const say = (t, s) => { try { R.Spawner.say(t, s || 3); } catch (_) {} };
  const kick = (k) => { try { R.Camera.kick(k); } catch (_) {} };

  const st = { phase: 'dormant', age: 0, inDen: false, moving: false, seed: null, site: null, defeated: false, boss: null, awake: false, msg: {}, enterCd: 0, rumble: 0,
    returnTo: null, stashed: false, flag: null, falls: [], quakeAt: 0, eruptAt: 0, warns: [], waves: [], minions: 0, lastHurt: 0, embers: [] };

  // ================================================================ the overworld: Groudon's mountain
  function seed() { return V.seed || 1; }
  let searching = false;
  function site() {
    const s = seed();
    if (st.site && st.siteSeed === s) return st.site;
    searching = true;
    const a = hash(s, 7, 8101) * TAU, d = 2300 + hash(s, 8, 8102) * 700;
    const x = Math.round(Math.cos(a) * d), y = Math.round(Math.sin(a) * d);
    searching = false;
    // magma fissures with black glass spires on the way in: the "you're getting close" signs
    const signs = [];
    for (let i = 0; i < 7; i++) {
      const aa = a + Math.PI + (hash(s, 20 + i, 8103) - 0.5) * 2.2, dd = 520 + hash(s, 30 + i, 8104) * 520;
      signs.push({ x: x + Math.cos(aa) * dd, y: y - 120 + Math.sin(aa) * dd, rx: 26 + hash(s, 40 + i, 8105) * 22, ry: 14 + hash(s, 50 + i, 8106) * 9, k: i });
    }
    st.site = { x, y, signs, pools: [{ x: x - 112, y: y + 6, rx: 40, ry: 16 }, { x: x + 112, y: y + 6, rx: 40, ry: 16 }] };
    st.siteSeed = s;
    return st.site;
  }
  // Cinderwake's obsidian crystals beside each fissure and at the mountain's foot (solid, like every other model)
  function siteModels(S) {
    if (S.models) return S.models;
    const m = S.signs.map((g) => ({ kind: 8, scale: 0.42 + (g.k % 3) * 0.06, h: g.k / 7, x: g.x + g.rx + 20, y: g.y + 6 }));
    m.push({ kind: 8, scale: 0.55, h: 0.2, x: S.x - 176, y: S.y + 18 }, { kind: 8, scale: 0.5, h: 0.6, x: S.x + 180, y: S.y + 20 }, { kind: 2, scale: 0.6, h: 0.4, x: S.x - 60, y: S.y + 34 }, { kind: 17, scale: 0.55, h: 0.8, x: S.x + 64, y: S.y + 40 });
    return (S.models = m);
  }
  function modelSolid(x, y, S) { for (const q of siteModels(S)) { const a = V.ART[q.kind]; if (a && Math.abs(x - q.x) < (a.rx || 14) * q.scale && Math.abs(y - q.y + 3) < (a.ry || 8) * q.scale) return true; } return false; }
  const inEll = (x, y, e, k = 1) => Math.hypot((x - e.x) / (e.rx * k), (y - e.y) / (e.ry * k)) < 1;
  // the mountain's footprint: solid stone except the cave's mouth
  function mountainSolid(x, y, S) {
    const dx = x - S.x, dy = y - S.y;
    if (dy > -6 || dy < -290) return false;
    const half = 200 - Math.max(0, (-dy - 120)) * 0.35;
    if (Math.abs(dx) > half) return false;
    if (Math.abs(dx) < 23 && dy > -52) return false;   // (the cave mouth)
    return true;
  }
  function reserve(x, y) {
    if (searching || st.inDen) return null;
    const S = site();
    const near = Math.hypot(x - S.x, (y - S.y + 110) * 1.15);
    if (V.ART && modelSolid(x, y, S)) return { clear: true, lava: false, solid: true };
    for (const g of S.signs) if (inEll(x, y, g, 2.6)) return inEll(x, y, g) ? { clear: true, lava: true } : { clear: true, lava: false };
    if (near > 440) return null;
    if (mountainSolid(x, y, S)) return { clear: true, lava: false, solid: true };
    for (const q of S.pools) if (inEll(x, y, q)) return { clear: true, lava: true };
    return { clear: true, lava: false };
  }

  // --- pixel art: the mountainside with its cave, lavafalls and crystals (220 x 160 art px, 2 world px each)
  let mountC = null, mountSeed = null;
  function mountainArt() {
    const s = seed();
    if (mountC && mountSeed === s) return mountC;
    const AW = 220, AH = 160, c = canvasOf(AW, AH), g = c.getContext('2d'), px = (x, y, col) => { g.fillStyle = col; g.fillRect(x, y, 1, 1); };
    const top = [];
    for (let x = 0; x < AW; x++) {
      const u = (x - AW / 2) / (AW / 2), base = 150 * Math.pow(Math.max(0, 1 - Math.abs(u) * 0.92), 0.85);
      top[x] = Math.round(AH - Math.max(26, base - 10 + (vn(x / 9, 3, s + 11) - 0.5) * 20 + (vn(x / 3, 7, s + 12) - 0.5) * 6));
    }
    const mouthX = AW / 2, mouthW = 22, mouthH = 30;
    for (let x = 0; x < AW; x++) for (let y = top[x]; y < AH; y++) {
      const depth = y - top[x], n = vn(x / 6, y / 6, s + 13), slope = (top[Math.min(AW - 1, x + 1)] - top[Math.max(0, x - 1)]);
      let col = n < 0.33 ? '#2c2020' : n < 0.66 ? '#3a2a27' : '#46322d';
      if (slope > 1 && depth < 40) col = n < 0.5 ? '#4f3832' : '#5c423a';   // (the lit, west-facing slopes)
      if (depth < 2) col = '#6b4c40';
      if ((y + Math.floor(vn(x / 14, 1, s + 14) * 6)) % 17 === 0 && depth > 6) col = '#5a4038';      // ledges
      if ((y + Math.floor(vn(x / 14, 1, s + 14) * 6)) % 17 === 1 && depth > 6) col = '#1e1515';
      if (hash(x, y, s + 15) > 0.985) col = '#7a5a4a';
      px(x, y, col);
    }
    // glowing cracks
    for (let k = 0; k < 9; k++) {
      let x = 20 + hash(k, 1, s + 16) * (AW - 40) | 0, y = top[x] + 6 + (hash(k, 2, s + 16) * 30 | 0);
      for (let n = 0; n < 26; n++) { if (y >= AH - 2 || y < top[x]) break; px(x, y, n % 4 ? '#ff7a2a' : '#ffc14d'); if (hash(k, n, s + 17) < 0.3) px(x + 1, y, '#a83a1a'); x += hash(k, n, s + 18) < 0.5 ? -1 : 1; y += 1; x = clamp(x, 1, AW - 2); }
    }
    // lavafalls pouring down both sides into the pools (animated over this in draw)
    for (const fx of [56, 164]) for (let y = top[fx] + 4; y < AH; y++) for (let w = -4; w <= 4; w++) { const e = Math.abs(w) === 4; px(fx + w, y, e ? '#a8341a' : (w === 0 || w === 1) ? '#ffd36a' : '#f06a24'); }
    // the cave mouth: a dark arch with stone steps going down
    for (let y = AH - mouthH; y < AH; y++) for (let x = mouthX - mouthW; x <= mouthX + mouthW; x++) {
      const u = (x - mouthX) / mouthW, v = (AH - y) / mouthH, inside = u * u + Math.pow(Math.max(0, v - 0.35) / 0.65, 2) < 1;
      if (!inside) continue;
      const deep = 1 - Math.abs(u);
      px(x, y, deep > 0.7 ? '#0a0505' : deep > 0.4 ? '#140a08' : '#22110c');
      if (Math.abs(u) > 0.86) px(x, y, '#6b4a3a');
    }
    for (let k = 0; k < 4; k++) { const y = AH - 2 - k * 4, w = mouthW - 4 - k * 3; for (let x = mouthX - w; x <= mouthX + w; x++) { px(x, y, k ? '#4a3329' : '#6e5040'); px(x, y + 1, '#2a1a14'); } }
    for (let x = mouthX - mouthW - 3; x <= mouthX + mouthW + 3; x++) { const y = AH - mouthH - 2 + Math.round(Math.pow((x - mouthX) / (mouthW + 3), 2) * 8); px(x, y, '#7a5848'); px(x, y + 1, '#3a2620'); }
    // the red glow deep inside
    for (let y = AH - 12; y < AH - 3; y++) for (let x = mouthX - 8; x <= mouthX + 8; x++) if (hash(x, y, s + 19) < 0.25) px(x, y, '#6a160c');
    // red crystal clusters at the foot
    const crystal = (cx, cy, h) => { for (let k = 0; k < 3; k++) { const ox = cx + (k - 1) * 4, hh = h - Math.abs(k - 1) * 4; for (let y = 0; y < hh; y++) { const w = Math.max(0, Math.round(2 - y / hh * 2)); for (let x = -w; x <= w; x++) px(ox + x, cy - y, x < 0 ? '#ff8a5c' : x > 0 ? '#9c1c1c' : '#e0402e'); } px(ox, cy - hh, '#ffd2b8'); } };
    mountC = c; mountSeed = s; mountC.top = top;
    return c;
  }
  function drawMountain(ctx) {
    const S = site(), c = mountainArt(), t = Number(R.Game.time) || 0, x0 = Math.round(S.x - c.width), y0 = Math.round(S.y - c.height * 2);
    ctx.save(); ctx.imageSmoothingEnabled = false;
    ctx.drawImage(c, x0, y0, c.width * 2, c.height * 2);
    // the lavafalls run: bright bands sliding down, and a splash at the bottom
    for (const fx of [56, 164]) {
      const top = c.top[fx] + 4;
      for (let y = top; y < c.height; y += 1) {
        const band = ((y - t * 40) % 9 + 9) % 9;
        if (band < 2) { ctx.fillStyle = band < 1 ? '#fff0a8' : '#ffb84a'; ctx.fillRect(x0 + (fx - 2) * 2, y0 + y * 2, 8, 2); }
      }
      for (let i = 0; i < 6; i++) { const u = ((t * 1.3 + i / 6) % 1), a = i * 1.7; ctx.globalAlpha = 1 - u; ctx.fillStyle = i % 2 ? '#ffd36a' : '#ff7a2a'; ctx.fillRect(Math.round(x0 + fx * 2 + Math.cos(a) * u * 22), Math.round(y0 + c.height * 2 - u * 14 + 6), 4, 4); }
      ctx.globalAlpha = 1;
    }
    // heat shimmer and steam above the cave
    for (let i = 0; i < 8; i++) { const u = (t * 0.35 + i / 8) % 1; ctx.globalAlpha = (1 - u) * 0.18; ctx.fillStyle = '#d8c3b0'; ctx.beginPath(); ctx.ellipse(S.x + Math.sin(u * 5 + i) * 10, S.y - 70 - u * 120, 8 + u * 22, 5 + u * 12, 0, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
  // ================================================================ the den: map, art, collision
  let G = null;   // Uint8Array GW*GH: 0 wall, 1 floor, 2 lava, 3 bridge, 4 island
  const DEN = {
    entry: { x: 960, y: 1400, r: 230 }, exit: { x: 960, y: 1556 }, start: { x: 960, y: 1470 },
    corridor: [[960, 1250], [840, 1120], [770, 990], [830, 870], [960, 800]],
    middle: { x: 960, y: 790, rx: 430, ry: 170 }, west: { x: 520, y: 860, rx: 180, ry: 130 }, east: { x: 1410, y: 900, rx: 210, ry: 140 },
    hall: { x: 960, y: 410, rx: 720, ry: 330 }, neck: [[960, 720], [960, 590]],
    lake: { x: 960, y: 380, rx: 560, ry: 235 }, island: { x: 960, y: 372, rx: 185, ry: 104 },
    lakeBridge: { x: 960, y0: 460, y1: 640, half: 30 }, chanBridge: { x: 776, y0: 940, y1: 1070, half: 30 },
  };
  function segD(x, y, a, b) { const dx = b[0] - a[0], dy = b[1] - a[1], t = clamp(((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy || 1)); return Math.hypot(x - a[0] - t * dx, y - a[1] - t * dy); }
  function lineD(x, y, pts) { let d = 1e9; for (let i = 0; i < pts.length - 1; i++) d = Math.min(d, segD(x, y, pts[i], pts[i + 1])); return d; }
  const ellD = (x, y, e) => (Math.hypot((x - e.x) / e.rx, (y - e.y) / e.ry) - 1) * Math.min(e.rx, e.ry);
  function classify(x, y) {
    const wob = (vn(x / 70, y / 70, 8201) - 0.5) * 46 + (vn(x / 22, y / 22, 8202) - 0.5) * 12;
    const floor = Math.min(Math.hypot(x - DEN.entry.x, y - DEN.entry.y) - DEN.entry.r, lineD(x, y, DEN.corridor) - 78, ellD(x, y, DEN.middle), ellD(x, y, DEN.west), ellD(x, y, DEN.east), ellD(x, y, DEN.hall), lineD(x, y, DEN.neck) - 70, Math.abs(x - DEN.exit.x) < 44 && y > 1500 && y < 1590 ? -1 : 99) + wob;
    if (floor > 0) return 0;
    const lb = DEN.lakeBridge, cb = DEN.chanBridge;
    if (Math.abs(x - lb.x) < lb.half && y > lb.y0 && y < lb.y1) return 3;
    if (Math.abs(x - cb.x) < cb.half && y > cb.y0 && y < cb.y1) return 3;
    if (ellD(x, y, DEN.island) + wob * 0.3 < 0) return 4;
    if (ellD(x, y, DEN.lake) + wob * 0.5 < 0) return 2;
    const chanY = 1005 + Math.sin(x / 90) * 18;
    if (Math.abs(y - chanY) < 42 + (vn(x / 40, 9, 8203) - 0.5) * 16) return 2;
    return 1;
  }
  function build() {
    if (G) return;
    G = new Uint8Array(GW * GH);
    for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) G[j * GW + i] = classify((i + 0.5) * CS, (j + 0.5) * CS);
    // the exit stairs and the start must be floor
    for (let j = 182; j < GH; j++) for (let i = 114; i < 126; i++) if (G[j * GW + i] === 0 && j < 199) G[j * GW + i] = 1;
    buildProps(); buildArt();
  }
  const cell = (lx, ly) => { const i = Math.floor(lx / CS), j = Math.floor(ly / CS); return i < 0 || j < 0 || i >= GW || j >= GH ? 0 : G[j * GW + i]; };
  const L = (x, y) => [x - OX, y - OY];
  function at(x, y) { build(); const [lx, ly] = L(x, y); return cell(lx, ly); }
  let props = [];
  // the den is dressed with Cinderwake's own painted models (assets/env/volcano-*.png): basalt columns, lava-veined
  // boulders, porous rock, fossil stones, ledges, and black obsidian crystals growing against the walls
  const atl = ['assets/env/volcano-scenery-v91.png', 'assets/env/volcano-variants-v91.png', 'assets/env/volcano-landmarks-v91.png'].map((src) => { const im = new Image(); im.src = src; return im; });
  const OPEN = [1, 2, 17, 19, 20, 4, 18, 2], WALLK = [8, 8, 2, 4];
  function box(q) { const a = V.ART[q.kind]; return { x: q.x, y: q.y - 3, rx: (a.rx || 14) * q.scale, ry: (a.ry || 8) * q.scale }; }
  function buildProps() {
    props = [];
    const ok = (x, y, r) => { for (const [dx, dy] of [[0, 0], [r, 0], [-r, 0], [0, r * 0.6], [0, -r * 0.6]]) { if (cell(x + dx, y + dy) !== 1) return false; } return true; };
    for (let n = 0; n < 1400 && props.length < 30; n++) {
      const x = 80 + hash(n, 1, 8210) * (W - 160), y = 120 + hash(n, 2, 8211) * (H - 200);
      let wallNear = false; for (let a = 0; a < 8; a++) if (cell(x + Math.cos(a / 8 * TAU) * 70, y + Math.sin(a / 8 * TAU) * 70) === 0) wallNear = true;
      const list = wallNear ? WALLK : OPEN, kind = list[Math.floor(hash(n, 3, 8212) * list.length)], A0 = V.ART[kind]; if (!A0) continue;
      const scale = (kind === 8 ? 0.55 : 0.62) + hash(n, 4, 8213) * 0.25, rx = (A0.rx || 14) * scale;
      if (!ok(x, y, rx + 18)) continue;
      if (lineD(x, y, DEN.corridor) < rx + 80 || lineD(x, y, DEN.neck) < rx + 70 || Math.hypot(x - DEN.start.x, y - DEN.start.y) < 150 || Math.abs(x - DEN.lakeBridge.x) < rx + 70 || Math.abs(x - DEN.chanBridge.x) < rx + 70 && y > 880 && y < 1130) continue;
      if (props.some((q) => Math.abs(q.x - x) < box(q).rx + rx + 64 && Math.abs(q.y - y) < box(q).ry + rx * 0.5 + 56)) continue;   // (always a walkable gap between them)
      props.push({ x, y, kind, scale, h: hash(n, 5, 8214), id: 'den' + n });
    }
  }
  function propAt(lx, ly, r) { for (const q of props) { const b = box(q); if (Math.abs(lx - b.x) < b.rx + r && Math.abs(ly - b.y) < b.ry + r) return q; } return null; }
  function wallAt(lx, ly, r) { for (const [dx, dy] of [[0, 0], [-r, 0], [r, 0], [0, -r * 0.6], [0, r * 0.6]]) if (cell(lx + dx, ly + dy) === 0) return true; return false; }
  function lavaAt(lx, ly) { return cell(lx, ly) === 2; }
  function freeDen(x, y, r = 0, wet = false) { build(); const [lx, ly] = L(x, y); if (wallAt(lx, ly, r)) return false; if (propAt(lx, ly, r)) return false; if (!wet && lavaAt(lx, ly)) return false; return true; }

  // --- the den's ground, drawn once (960 x 800 art px = 1920 x 1600 world px)
  let artC = null;
  function buildArt() {
    const AW = W / 2, AH = H / 2, c = canvasOf(AW, AH), g = c.getContext('2d'), im = g.createImageData(AW, AH), d = im.data;
    // distance (in cells) to the nearest wall / lava, for shading
    const near = (want) => { const D = new Uint8Array(GW * GH).fill(9); for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) if (want(G[j * GW + i])) D[j * GW + i] = 0; for (let pass = 0; pass < 6; pass++) for (let j = 1; j < GH - 1; j++) for (let i = 1; i < GW - 1; i++) { const k = j * GW + i; D[k] = Math.min(D[k], D[k - 1] + 1, D[k + 1] + 1, D[k - GW] + 1, D[k + GW] + 1); } return D; };
    const DW = near((v) => v === 0), DL = near((v) => v === 2);
    for (let y = 0; y < AH; y++) for (let x = 0; x < AW; x++) {
      const lx = x * 2 + 1, ly = y * 2 + 1, i = Math.floor(lx / CS), j = Math.floor(ly / CS), k = j * GW + i, n = vn(lx / 40, ly / 40, 8220), grain = hash(x, y, 8221);
      // (smooth edges: where a cell borders a different kind of ground, ask the exact shape per art pixel)
      let v = G[k]; if (i > 0 && j > 0 && i < GW - 1 && j < GH - 1 && (G[k - 1] !== v || G[k + 1] !== v || G[k - GW] !== v || G[k + GW] !== v)) v = classify(lx, ly);
      let col;
      if (v === 0) {
        // a wall: its face where floor lies just below it, its dark top otherwise
        let face = -1; for (let s = 1; s <= 4; s++) { const vv = cell(lx, ly + s * 8); if (vv && vv !== 0) { face = s; break; } }
        if (face > 0) { const stripe = (Math.floor(lx / 6) + Math.floor(vn(lx / 30, 1, 8222) * 4)) % 3; col = face === 1 ? [128, 88, 64] : stripe === 0 ? [104, 70, 52] : stripe === 1 ? [90, 60, 44] : [78, 52, 40]; if (face === 4) col = [56, 38, 32]; if (grain > 0.97) col = col.map((c) => c + 18); }
        else { col = n < 0.4 ? [44, 30, 28] : n < 0.7 ? [54, 38, 34] : [64, 46, 40]; if (cell(lx, ly + 34) === 0 && cell(lx, ly - 8) !== 0) col = [92, 64, 50]; }
        if (grain > 0.992) col = [110, 70, 52];
      } else if (v === 2 || v === 3) {
        const dist = Math.min(4, DL[k] === 0 ? (() => { let m = 9; for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const vv = G[(j + dj) * GW + i + di]; if (vv !== 2 && vv !== 3) m = 1; } return m; })() : 0);
        col = dist === 1 ? [255, 196, 96] : [214 + n * 30, 66 + n * 40, 26];
        if (vn(lx / 26, ly / 12, 8223) > 0.72) col = [255, 150, 54];
        if (grain > 0.985) col = [255, 230, 150];
      } else {
        const island = v === 4;
        col = island ? (n < 0.5 ? [66, 44, 40] : [80, 54, 48]) : n < 0.33 ? [150, 108, 76] : n < 0.66 ? [166, 122, 86] : [178, 134, 96];
        if (!island && grain > 0.975) col = [206, 168, 128];
        if (!island && grain < 0.025) col = [112, 78, 56];
        if (!island && vn(lx / 90, ly / 90, 8225) > 0.68) col = col.map((c) => c * 0.9);
        const dw = DW[k], dl = DL[k];
        if (dw <= 1) col = col.map((c) => c * 0.72); else if (dw === 2) col = col.map((c) => c * 0.86);
        if (dl <= 1) col = [74, 40, 30]; else if (dl === 2 && grain > 0.6) col = [150, 64, 34];
        if (island) { const crack = Math.abs(vn(lx / 34, ly / 34, 8224) - 0.5) < 0.035; if (crack) col = [255, 110, 40]; const rr = Math.hypot((lx - DEN.island.x) / DEN.island.rx, (ly - DEN.island.y) / DEN.island.ry); if (Math.abs(rr - 0.62) < 0.025) col = [200, 50, 30]; }
      }
      const o = (y * AW + x) * 4; d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = 255;
    }
    g.putImageData(im, 0, 0);
    // the stairs back up, at the bottom
    for (let s = 0; s < 5; s++) { g.fillStyle = s % 2 ? '#5a4034' : '#7a5a48'; g.fillRect(DEN.exit.x / 2 - 18 + s, DEN.exit.y / 2 - 6 + s * 3, 36 - s * 2, 3); }
    // rope bridges over the channel and the lake
    for (const b of [DEN.chanBridge, DEN.lakeBridge]) drawRopeV(g, b.x / 2, b.y0 / 2, b.y1 / 2, b.half / 2);
    artC = c;
    // lavafalls from the north wall into the lake
    st.falls = [{ x: 640, y0: 70, y1: 180 }, { x: 1290, y0: 80, y1: 190 }, { x: 960, y0: 40, y1: 160 }];
  }
  // a rope bridge running north-south (art px), the same build as the overworld's
  function drawRopeV(g, cx, y0, y1, hh) {
    const px = (x, y, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), 1, 1); };
    for (let y = y0; y <= y1; y++) {
      const plank = Math.floor((y - y0) / 4), gap = (y - y0) % 4 === 3, h = hash(plank, cx | 0, 8230);
      for (let x = cx - hh; x <= cx + hh; x++) { let col = gap ? '#2e1d12' : plank % 2 ? '#6e4a2a' : '#7b5531'; if (!gap && Math.abs(x - cx) < hh * 0.45 && h > 0.4) col = plank % 2 ? '#7d5734' : '#8a6239'; if (!gap && (x === cx - hh || x === cx + hh)) col = '#4a3019'; px(x, y, col); }
      const ph = ((y - y0) % 24) / 24, sag = Math.round(Math.sin(ph * Math.PI) * 2);
      for (const side of [-1, 1]) { const rx = side < 0 ? cx - hh - 3 + sag : cx + hh + 3 - sag; px(rx, y, '#d8b47a'); px(rx + 1, y, '#8a6a3d'); }
      if ((y - y0) % 24 === 0 || y === Math.floor(y1)) for (const side of [-1, 1]) { const bx = side < 0 ? cx - hh - 6 : cx + hh + 1; for (let k = 0; k < 6; k++) { px(bx + k, y, k === 0 ? '#b88b57' : '#4a2f18'); px(bx + k, y + 1, '#3a2412'); } }
    }
  }
  function drawModel(ctx, q, x, y) {
    const a = V.ART[q.kind], im = atl[a.atlas || 0]; if (!im.complete || !im.naturalWidth) return;
    const [sx, sy, sw, sh] = a.rect, w = a.w * q.scale, h = w * sh / sw;
    ctx.save(); ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = 'rgba(15,8,8,.32)'; ctx.beginPath(); ctx.ellipse(x, y - 4, Math.max(10, (a.rx || w * 0.24) * q.scale), Math.max(3, (a.ry || 6) * q.scale * 0.35), 0, 0, TAU); ctx.fill();
    const p = R.Game.player; if (p && Math.abs(p.x - x) < w * 0.38 && p.y < y - 9 && p.y > y - h * 0.88) ctx.globalAlpha = 0.55;   // (see yourself behind tall ones)
    ctx.drawImage(im, sx, sy, sw, sh, Math.round(x - w / 2), Math.round(y - h), Math.round(w), Math.round(h));
    if (q.kind === 8) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.18 + 0.1 * Math.sin((Number(R.Game.time) || 0) * 2 + q.h * 9); ctx.fillStyle = '#ff6a3a'; ctx.beginPath(); ctx.ellipse(x, y - h * 0.4, w * 0.35, h * 0.3, 0, 0, TAU); ctx.fill(); }
    ctx.restore();
  }

  // ================================================================ the den: drawing
  function viewRect() { const c = R.Camera; return [c.left() - 60, c.top() - 80, c.left() + c.w + 60, c.top() + c.h + 120]; }
  function drawDen(ctx) {
    build();
    const t = Number(R.Game.time) || 0, [x0, y0, x1, y1] = viewRect();
    ctx.save(); ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#140c0b'; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    ctx.drawImage(artC, OX, OY, W, H);
    // lava: bright currents drift across the lake and the channel, bubbles swell and pop
    for (let i = 0; i < 70; i++) {
      const lx = ((hash(i, 1, 8240) * W + t * (12 + hash(i, 2, 8241) * 18)) % W), ly = hash(i, 3, 8242) * H;
      if (cell(lx, ly) !== 2) continue;
      const x = OX + lx, y = OY + ly; if (x < x0 || x > x1 || y < y0 || y > y1) continue;
      ctx.globalAlpha = 0.55 + 0.3 * Math.sin(t * 2 + i); ctx.fillStyle = i % 3 ? '#ffb54d' : '#ffe08a'; ctx.fillRect(Math.round(x / 2) * 2, Math.round(y / 2) * 2, 10 + (i % 3) * 4, 2);
    }
    for (let i = 0; i < 40; i++) {
      const lx = hash(i, 5, 8243) * W, ly = hash(i, 6, 8244) * H; if (cell(lx, ly) !== 2 || cell(lx + 10, ly) !== 2 || cell(lx - 10, ly) !== 2) continue;
      const x = OX + lx, y = OY + ly; if (x < x0 || x > x1 || y < y0 || y > y1) continue;
      const age = (t * (0.35 + hash(i, 7, 8245) * 0.2) + i * 0.37) % 1;
      if (age < 0.6) { const r = 2 + Math.sin(age / 0.6 * Math.PI / 2) * 6; ctx.globalAlpha = 0.85; ctx.fillStyle = '#b8401e'; ctx.fillRect(Math.round(x - r), Math.round(y - r * 0.6), Math.round(r * 2), Math.round(r * 1.2)); ctx.fillStyle = '#ffc45a'; ctx.fillRect(Math.round(x - r + 2), Math.round(y - r * 0.6 + 1), Math.max(2, Math.round(r * 2 - 4)), Math.max(2, Math.round(r * 1.2 - 2))); }
      else { const u = (age - 0.6) / 0.4; ctx.globalAlpha = (1 - u) * 0.8; ctx.fillStyle = '#ffe7a0'; for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + i; ctx.fillRect(Math.round(x + Math.cos(a) * (4 + u * 16)), Math.round(y + Math.sin(a) * (2 + u * 8) - Math.sin(u * Math.PI) * 10), 2, 2); } }
    }
    ctx.globalAlpha = 1;
    // lavafalls pouring from the north wall
    for (const f of st.falls) {
      const fx = OX + f.x, fy0 = OY + f.y0, fy1 = OY + f.y1;
      if (fx < x0 - 40 || fx > x1 + 40) continue;
      for (let y = fy0; y < fy1; y += 2) for (let w = -16; w <= 16; w += 2) {
        const edge = Math.abs(w) >= 14, band = ((y - t * 110 + Math.sin(w * 0.7) * 6) % 18 + 18) % 18;
        ctx.fillStyle = edge ? '#a8341a' : band < 3 ? '#fff0a8' : band < 7 ? '#ffb84a' : '#f06a24'; ctx.fillRect(fx + w, y, 2, 2);
      }
      for (let i = 0; i < 10; i++) { const u = (t * 1.2 + i / 10) % 1, a = i * 1.9; ctx.globalAlpha = 1 - u; ctx.fillStyle = i % 2 ? '#ffd36a' : '#ff7a2a'; ctx.fillRect(Math.round(fx + Math.cos(a) * u * 34), Math.round(fy1 - u * 18 + 4), 3, 3); }
      for (let i = 0; i < 4; i++) { const u = (t * 0.3 + i / 4) % 1; ctx.globalAlpha = (1 - u) * 0.2; ctx.fillStyle = '#d8c3b0'; ctx.beginPath(); ctx.ellipse(fx + Math.sin(u * 4 + i) * 12, fy1 - u * 60, 10 + u * 20, 6 + u * 10, 0, 0, TAU); ctx.fill(); }
      ctx.globalAlpha = 1;
    }
    // warnings for Groudon's eruptions
    for (const w of st.warns) { const k = clamp((t - w.t0) / w.dur); ctx.globalAlpha = 0.35 + 0.35 * Math.sin(t * 18); ctx.strokeStyle = '#ff5a2a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(w.x, w.y, w.r * (0.4 + 0.6 * k), w.r * 0.55 * (0.4 + 0.6 * k), 0, 0, TAU); ctx.stroke(); ctx.globalAlpha = 0.18; ctx.fillStyle = '#ff7a2a'; ctx.beginPath(); ctx.ellipse(w.x, w.y, w.r, w.r * 0.55, 0, 0, TAU); ctx.fill(); }
    for (const q of st.waves) { const u = clamp((t - q.t0) / q.dur), r = q.r0 + (q.r1 - q.r0) * u; ctx.globalAlpha = (1 - u) * 0.8; for (let i = 0; i < 48; i++) { const a = i / 48 * TAU; const x = q.x + Math.cos(a) * r, y = q.y + Math.sin(a) * r * 0.6; ctx.fillStyle = i % 2 ? '#6e4c3c' : '#a87050'; ctx.fillRect(Math.round(x / 2) * 2 - 3, Math.round(y / 2) * 2 - 6, 6, 8); ctx.fillStyle = '#ff9a4a'; ctx.fillRect(Math.round(x / 2) * 2 - 1, Math.round(y / 2) * 2 - 8, 2, 2); } }
    ctx.globalAlpha = 1;
    ctx.restore();
  }
  function denDrawables() {
    build();
    const [x0, y0, x1, y1] = viewRect(), out = [];
    if (!st.defeated && st.phase !== 'awake') out.push({ y: OY + STATUE.y, draw: drawStatue });
    for (const q of props) { const x = OX + q.x, y = OY + q.y; if (x < x0 - 120 || x > x1 + 120 || y < y0 || y > y1 + 200) continue; out.push({ y, draw: (ctx) => drawModel(ctx, q, x, y) }); }
    return out;
  }
  function denAir(ctx) {
    const [x0, y0, x1, y1] = viewRect(), t = Number(R.Game.time) || 0;
    ctx.save();
    ctx.fillStyle = 'rgba(30,8,4,0.12)'; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    ctx.globalCompositeOperation = 'lighter';
    for (let j = Math.floor((y0 - OY) / 96); j <= Math.floor((y1 - OY) / 96); j++) for (let i = Math.floor((x0 - OX) / 96); i <= Math.floor((x1 - OX) / 96); i++) {
      const lx = i * 96 + 48, ly = j * 96 + 48; if (cell(lx, ly) !== 2) continue;
      const x = OX + lx, y = OY + ly, gr = ctx.createRadialGradient(x, y, 0, x, y, 120); gr.addColorStop(0, 'rgba(255,110,40,0.16)'); gr.addColorStop(1, 'rgba(255,110,40,0)'); ctx.fillStyle = gr; ctx.fillRect(x - 120, y - 120, 240, 240);
    }
    ctx.globalCompositeOperation = 'source-over';
    for (let i = 0; i < 70; i++) { const ph = hash(i, 9, 8250), w = x1 - x0, h = y1 - y0, x = x0 + ((ph * w + Math.sin(t * 0.7 + i) * 30) % w + w) % w, y = y1 - ((hash(i, 10, 8251) * h + t * (20 + ph * 30)) % h); ctx.globalAlpha = 0.25 + ph * 0.4; ctx.fillStyle = i % 5 ? '#ff9a4a' : '#ffe08a'; ctx.fillRect(Math.round(x / 2) * 2, Math.round(y / 2) * 2, 2, 2); }
    ctx.restore();
  }

  // ================================================================ in and out
  const fade = document.createElement('div');
  fade.style.cssText = 'position:fixed;inset:0;background:#000;opacity:0;pointer-events:none;transition:opacity .32s;z-index:120';
  (document.body || document.documentElement).appendChild(fade);
  function setVolcano(on) { try { const m = R.Maps.cur; if (m && (m.volcano || st.flag === m)) { m.volcano = on; st.flag = on ? null : m; } } catch (_) {} }
  function clearCombat() { try { R.Projectiles.clear(); R.Hazards.clear(); R.Combat.clearFields && R.Combat.clearFields(); } catch (_) {} }
  function enter() {
    const p = R.Game.player; if (!p || st.inDen || st.moving) return;
    st.moving = true; fade.style.opacity = '1';
    try { R.Game.soloHold && R.Game.soloHold(true); } catch (_) {}
    setTimeout(() => {
      try {
        const S = site();
        st.returnTo = [S.x, S.y + 70];
        st.stashed = !(R.Coop && R.Coop.active);
        if (st.stashed) try { R.EnemyMgr.stash(); } catch (_) { st.stashed = false; }
        clearCombat();
        setVolcano(false); st.inDen = true; build();
        p.x = OX + DEN.start.x; p.y = OY + DEN.start.y; p._vx = p._vy = 0; p.__denSafe = [p.x, p.y];
        R.Camera.x = p.x; R.Camera.y = p.y;
        st.enterCd = (Number(R.Game.time) || 0) + 2; st.minions = 0;
        if (!st.defeated) try { R.Sprites.preload && R.Sprites.preload([GROUDON], 4500); } catch (_) {}
        if (!st.msg.den) { st.msg.den = true; setTimeout(() => say(st.defeated ? 'Groudon\'s den. The lake of fire is quiet now.' : 'The lower levels of the mountain… the heat is unbearable. Something huge is breathing down here.', 4), 600); }
      } finally { st.moving = false; fade.style.opacity = '0'; try { R.Game.soloHold && R.Game.soloHold(false); } catch (_) {} }
    }, 340);
  }
  function leave() {
    const p = R.Game.player; if (!p || !st.inDen || st.moving) return;
    st.moving = true; fade.style.opacity = '1';
    try { R.Game.soloHold && R.Game.soloHold(true); } catch (_) {}
    setTimeout(() => {
      try {
        if (st.boss && !st.boss.dead) { st.boss.dead = true; st.boss.__denGone = true; }
        st.boss = null; if (!st.defeated) st.phase = 'dormant'; st.age = 0; st.warns.length = 0; st.waves.length = 0;
        try { R.EnemyMgr.clear(); } catch (_) {}
        clearCombat();
        st.inDen = false; setVolcano(true);
        if (st.stashed) try { R.EnemyMgr.restore(); } catch (_) {}
        st.stashed = false;
        const back = st.returnTo || [site().x, site().y + 70];
        p.x = back[0]; p.y = back[1]; p._vx = p._vy = 0; p.__volcanoSafe = null;
        R.Camera.x = p.x; R.Camera.y = p.y;
        st.enterCd = (Number(R.Game.time) || 0) + 2.5;
      } finally { st.moving = false; fade.style.opacity = '0'; try { R.Game.soloHold && R.Game.soloHold(false); } catch (_) {} }
    }, 340);
  }

  // ================================================================ Groudon
  /* Groudon sleeps in the lava just across from the platform, grey and still as cold stone. It only answers the Red
   * Orb (Tapu Fini's test on the Isle of Lost Souls, Act 3): with it, stepping onto the platform makes the orb blaze,
   * cracks of fire run through the stone, it shakes, sheds its grey shell - and Groudon is awake (like Regigigas). */
  const hasOrb = () => { try { return !!(A.Sea && A.Sea.has('red')) || !!(R.DB.save && R.DB.save.psxOcean && R.DB.save.psxOcean.orbs && R.DB.save.psxOcean.orbs.red); } catch (_) { return false; } };
  const CRACK = 4.6;
  const sheet = new Image(); sheet.src = 'assets/pokemon/383/Idle.png';
  let stoneC = null;
  function stoneArt() {
    if (stoneC) return stoneC;
    if (!sheet.complete || !sheet.naturalWidth) return null;
    const m = R.SPRITE_META[GROUDON] && R.SPRITE_META[GROUDON].a && R.SPRITE_META[GROUDON].a.Idle, fw = m ? m.w : 64, fh = m ? m.h : 80;
    const c = canvasOf(fw, fh), g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(sheet, 0, fh * 7, fw, fh, 0, 0, fw, fh);   // (first Idle frame, turned toward the platform: down-left)
    const im = g.getImageData(0, 0, fw, fh), d = im.data;
    for (let k = 0; k < d.length; k += 4) { if (!d[k + 3]) continue; const l = 0.3 * d[k] + 0.59 * d[k + 1] + 0.11 * d[k + 2], v = Math.round((34 + l * 0.48) / 6) * 6; d[k] = v + 4; d[k + 1] = v + 2; d[k + 2] = v; }   // (cold grey stone, a few flat tones)
    g.putImageData(im, 0, 0); c.ax = m ? m.ax : 32; c.ay = m ? m.ay : 44;
    // cracks: random walks over the stone itself, one art pixel wide, revealed in order as it wakes
    const solid = (x, y) => x >= 0 && y >= 0 && x < fw && y < fh && d[(y * fw + x) * 4 + 3] > 0;
    let cx = 0, cy = 0, n = 0; for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) if (solid(x, y)) { cx += x; cy += y; n++; }
    cx = Math.round(cx / Math.max(1, n)); cy = Math.round(cy / Math.max(1, n));
    const seen = new Set(), cracks = [];
    for (let b = 0; b < 7; b++) { let x = cx + Math.round((hash(b, 1, 8295) - 0.5) * 6), y = cy + Math.round((hash(b, 2, 8296) - 0.5) * 6); const dx = Math.cos(b / 7 * TAU), dy = Math.sin(b / 7 * TAU) * 0.8;
      for (let s = 0; s < 34; s++) { if (!solid(x, y)) break; const key = x + ',' + y; if (!seen.has(key)) { seen.add(key); cracks.push({ x, y, s: s + b * 2 }); } const r = hash(b, s, 8297); x += Math.round(dx + (r < 0.33 ? -1 : r > 0.66 ? 1 : 0) * 0.9); y += Math.round(dy + (hash(b, s, 8298) - 0.5) * 1.6); } }
    cracks.sort((a, b) => a.s - b.s); c.cracks = cracks;
    // a red copy of its silhouette, for the glow that builds inside the stone
    const red = canvasOf(fw, fh), rg = red.getContext('2d'), ri = rg.createImageData(fw, fh);
    for (let k = 0; k < d.length; k += 4) if (d[k + 3]) { ri.data[k] = 255; ri.data[k + 1] = 70; ri.data[k + 2] = 24; ri.data[k + 3] = 255; }
    rg.putImageData(ri, 0, 0); c.red = red;
    return (stoneC = c);
  }
  const STATUE = { x: 1236, y: 408 }, SC = 3.4;   // (in the lava just east of the platform, facing it)
  const CRACKS = [[[0, -36], [-3, -28], [4, -20], [-2, -12], [5, -4]], [[-3, -28], [-12, -24], [-18, -16], [-26, -13]], [[4, -20], [13, -17], [18, -9], [25, -6]], [[-14, -6], [-9, 2], [-15, 8]], [[12, -2], [8, 6], [14, 11]], [[0, -12], [-6, -4], [-2, 6]]];
  function drawStatue(ctx) {
    if (st.defeated || st.phase === 'awake') return;
    const c = stoneArt(), t = Number(R.Game.time) || 0, x = OX + STATUE.x, y = OY + STATUE.y; if (!c) return;
    const k = st.phase === 'cracking' ? clamp(st.age / CRACK) : 0, sh = k > 0.15 ? Math.round(Math.sin(st.age * 31) * k * 2) * 2 : 0;
    const w = c.width * SC, h = c.height * SC, left = Math.round(x - c.ax * SC + sh), top = Math.round(y - c.ay * SC + 22);   // (its feet are 22 px under the surface: waist-deep in the magma)
    ctx.save(); ctx.imageSmoothingEnabled = false;
    // sunk to the waist in the lava: draw only what stands above the surface
    ctx.beginPath(); ctx.rect(left - 40, top - 60, w + 80, y - (top - 60)); ctx.clip();
    ctx.drawImage(c, left, top, w, h);
    if (k > 0) {
      // the red heat builds inside the stone, and the cracks run through it pixel by pixel, red then white-hot
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(0.85, k * k * (0.6 + 0.3 * Math.sin(st.age * 10))); ctx.drawImage(c.red, left, top, w, h);
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      const shown = Math.floor(c.cracks.length * Math.min(1, k * 1.25));
      for (let i = 0; i < shown; i++) { const q = c.cracks[i], X = left + q.x * SC, Y = top + q.y * SC; ctx.fillStyle = k > 0.75 ? '#fff2b8' : i > shown - 6 ? '#ffd36a' : '#ff5a1e'; ctx.fillRect(Math.round(X), Math.round(Y), Math.ceil(SC), Math.ceil(SC)); }
      // grey chips flaking off
      for (let i = 0; i < 26; i++) { const ph = (st.age * 0.8 + hash(i, 1, 8290)) % 1; if (ph > k) continue; ctx.fillStyle = i % 2 ? '#6a6460' : '#8e8a84'; ctx.fillRect(Math.round((x + (hash(i, 2, 8291) - 0.5) * w * 0.8 + Math.sin(i) * ph * 22) / 2) * 2, Math.round((top + h * 0.15 + hash(i, 3, 8292) * h * 0.4 + ph * ph * 90) / 2) * 2, 4, 4); }
    }
    ctx.restore();
    // the lava laps around it: a glowing ring where stone meets magma
    ctx.save(); ctx.globalAlpha = 0.7 + 0.2 * Math.sin(t * 3); ctx.fillStyle = '#ffcf6a'; for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI; ctx.fillRect(Math.round((x - Math.cos(a) * w * 0.32) / 2) * 2, Math.round((y + Math.sin(i * 1.7 + t * 2) * 2) / 2) * 2, 4, 2); } ctx.restore();
    // the Red Orb rises above you while it wakes
    if (st.phase === 'cracking') { const p = R.Game.player, u = clamp(st.age / 1.2); if (p) { const ox = p.x, oy = p.y - 60 - u * 30 + Math.sin(st.age * 5) * 3; ctx.save(); ctx.globalCompositeOperation = 'lighter'; const gr = ctx.createRadialGradient(ox, oy, 0, ox, oy, 34); gr.addColorStop(0, 'rgba(255,80,40,0.9)'); gr.addColorStop(1, 'rgba(255,80,40,0)'); ctx.fillStyle = gr; ctx.fillRect(ox - 34, oy - 34, 68, 68); ctx.restore(); ctx.fillStyle = '#5a1410'; ctx.fillRect(ox - 7, oy - 7, 14, 14); ctx.fillStyle = '#e0402e'; ctx.fillRect(ox - 6, oy - 6, 12, 12); ctx.fillStyle = '#ff9a80'; ctx.fillRect(ox - 4, oy - 4, 4, 4); ctx.fillStyle = '#ffffff'; ctx.fillRect(ox - 3, oy - 3, 2, 2); } }
  }
  function startCracking() {
    st.phase = 'cracking'; st.age = 0;
    try { R.Sprites.preload && R.Sprites.preload([GROUDON], 4500); } catch (_) {}
    say('The Red Orb blazes in your hands… cracks of fire run through the grey stone!', 4);
    try { R.Audio.sfx('legend'); } catch (_) {}
  }
  function wake(p) {
    const d = R.DEX_BY[GROUDON];
    if (!d || !R.SPRITE_META[GROUDON]) { st.phase = 'dormant'; return; }
    const t = Number(R.Game.time) || 0, T = [...(R.Enemies.BOSSES || [])].sort((a, b) => Math.abs((a.at || 0) - t) - Math.abs((b.at || 0) - t))[0] || {}, sc = (R.Enemies.scale && R.Enemies.scale(t)) || { hp: 1, dmg: 1, spd: 1 };
    const def = { dex: GROUDON, name: d.name, hp: Math.max(1600, Math.round((T.hp || 1000) * 2)), spd: 46, dmg: Math.max(12, Math.round((T.dmg || 15) * 1.2)), xp: Math.max(220, (T.xp || 100) * 3), behavior: 'charger', shotCd: 2, shotDmg: Math.max(8, T.shotDmg || 10), range: 240 };
    const e = new R.Enemy(def, OX + STATUE.x, OY + STATUE.y + 8, sc, true);
    e.legend = true; e.__groudonDen = true;
    if (R.EnemyMgr.add(e) === false) { st.phase = 'dormant'; return; }
    e.psxK = Math.max(2.2, e.psxK || 1); e._psxKOn = true;
    st.boss = e; st.phase = 'awake'; st.quakeAt = t + 6; st.eruptAt = t + 3.5;
    kick(1.2); say('The stone shatters — GROUDON has awakened! Defeat it to befriend it.', 4.5);
    try { R.FX.burst(e.x, e.y - 60, '#8e8a84', 46, 200); R.FX.burst(e.x, e.y - 60, '#ff7a2a', 30, 260); R.FX.ring(e.x, e.y, 12, 140, '#ff6a2a', 0.9, 5); } catch (_) {}
    if (e.psx && A.Combat) { e.psx.stance = 'hostile'; try { A.Combat.engage(e, e.psx, p, 'groudon-awakening'); } catch (_) {} }
  }
  function statueTick(p, t, dt, onPlatform) {
    if (st.defeated) return;
    if (st.phase === 'cracking') { st.age += Math.min(0.2, Math.max(0, dt)); if (st.age > 1.4 && t > st.rumble) { st.rumble = t + 0.6; kick(0.25 + st.age / CRACK * 0.5); } if (st.age >= CRACK) wake(p); return; }
    if (st.phase !== 'dormant' || !onPlatform) return;
    if (!hasOrb()) { if (!st.msg.orb) { st.msg.orb = true; say('Groudon lies in the magma, grey and still as cold stone. Only the Red Orb could wake it — the one the spirit of the Isle of Lost Souls keeps (Act 3).', 6); } return; }
    startCracking();
  }
  function hurt(p, frac, col) { try { p.hurt(Math.max(1, Math.round(p.maxHp * frac)), col || '#ff8a4a', 0, 0, 0); } catch (_) {} }
  function bossTick(p, t) {
    const e = st.boss;
    if (!e) return;
    if (e.dead) {
      if (e.hp <= 0 && !e.__denGone && !st.defeated) {
        st.defeated = true; st.phase = 'defeated'; st.warns.length = 0; st.waves.length = 0;
        try { R.DB.grant(GROUDON, 'groudon-den'); R.DB.commit && R.DB.commit(); } catch (_) {}
        try { R.UI.toast('Groudon joined you!', 4500); } catch (_) {}
        say('Groudon sinks back into the magma… and rises again at your side. Groudon joined you!', 5);
        try { R.FX.ring(e.x, e.y, 12, 120, '#ffcf6a', 1, 5); } catch (_) {}
      }
      st.boss = null; return;
    }
    // Precipice eruptions: warning rings under and around you, then the ground bursts
    if (t >= st.eruptAt) {
      st.eruptAt = t + 6.5;
      for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + t, r = i ? 70 + hash(i, t | 0, 8260) * 60 : 0; const x = p.x + Math.cos(a) * r, y = p.y + Math.sin(a) * r * 0.7; if (!freeDen(x, y, 4, true)) continue; st.warns.push({ x, y, r: 40, t0: t, dur: 1.15 }); }
    }
    for (let i = st.warns.length - 1; i >= 0; i--) { const w = st.warns[i]; if (t - w.t0 < w.dur) continue; st.warns.splice(i, 1); try { R.FX.burst(w.x, w.y - 10, '#ff7a2a', 14, 160); R.FX.burst(w.x, w.y - 10, '#6e4c3c', 8, 120); } catch (_) {} if (Math.hypot((p.x - w.x) / w.r, (p.y - w.y) / (w.r * 0.55)) < 1) hurt(p, 0.06); }
    // the earthquake: Groudon stamps and a ring of broken stone rolls outward
    if (t >= st.quakeAt) { st.quakeAt = t + 10; st.waves.push({ x: e.x, y: e.y, r0: 20, r1: 420, t0: t, dur: 1.4, hit: false }); kick(0.9); say('Groudon stamps — the ground heaves!', 1.6); }
    for (let i = st.waves.length - 1; i >= 0; i--) { const q = st.waves[i], u = (t - q.t0) / q.dur; if (u >= 1) { st.waves.splice(i, 1); continue; } const r = q.r0 + (q.r1 - q.r0) * u, d = Math.hypot(p.x - q.x, (p.y - q.y) / 0.6); if (!q.hit && Math.abs(d - r) < 22) { q.hit = true; hurt(p, 0.05, '#c89060'); } }
  }

  // ================================================================ per-frame logic
  function tickOver(p, t) {
    const S = site(), d = Math.hypot(p.x - S.x, p.y - S.y);
    if (d < 1500 && !st.msg.far) { st.msg.far = true; say('The ground trembles under your feet… something massive sleeps beneath the mountain.', 4); }
    if (d < 1500 && t > st.rumble) { st.rumble = t + 9 + hash(t | 0, 1, 8270) * 8; kick(d < 700 ? 0.45 : 0.25); }
    if (d < 520 && !st.msg.near) { st.msg.near = true; say('A cave in the mountainside breathes out hot air. The way down…', 4); }
    if (t > st.enterCd && Math.abs(p.x - S.x) < 22 && p.y < S.y - 26 && p.y > S.y - 60) enter();
  }
  function tickDen(p, t) {
    const [lx, ly] = L(p.x, p.y);
    // lava burns (Fire types, Groudon and fliers excepted), like Cinderwake's
    const immune = (p.types || p.mon?.types || []).includes('fire') || Number(p.dex) === GROUDON || p.flying || (window.PS_LEGEND_FLIGHT && window.PS_LEGEND_FLIGHT.active(p));
    if (!immune && lavaAt(lx, ly) && t >= st.lastHurt) { st.lastHurt = t + 1; hurt(p, 0.025, '#ef9a52'); }
    statueTick(p, t, Math.max(0, t - (st.lastT || t)), cell(lx, ly) === 4); st.lastT = t;
    bossTick(p, t);
    if (t > st.enterCd && ly > DEN.exit.y - 22 && Math.abs(lx - DEN.exit.x) < 40) leave();
    if (!st.msg.lake && ly < 700) { st.msg.lake = true; say(st.defeated ? 'The great lava lake. Only ripples where Groudon stood.' : 'A lake of fire… and in the magma beyond the island, a grey giant stands as still as stone.', 4); }
  }
  function tick(p) {
    if (!p || p !== R.Game.player || p.dead || R.Game.state !== 'playing' || st.moving) return;
    const t = Number(R.Game.time) || 0;
    if (st.inDen) tickDen(p, t); else if (V.active()) tickOver(p, t);
  }

  // ================================================================ hooking into the world
  V.setReserve(reserve);
  const resetWorld = R.World.reset;
  R.World.reset = function (...a) {
    if (st.flag) { try { st.flag.volcano = true; } catch (_) {} st.flag = null; }
    st.inDen = false; st.moving = false; st.boss = null; st.phase = 'dormant'; st.age = 0; st.defeated = false; st.msg = {}; st.warns.length = 0; st.waves.length = 0; st.site = null; st.enterCd = 0; st.stashed = false; fade.style.opacity = '0';
    const out = resetWorld.apply(this, a);
    try { V.setReserve(reserve); } catch (_) {}
    return out;
  };
  const den = () => st.inDen && R.Maps.cur && !R.Maps.endless;
  function wrap(o, k, fn) { const old = o && o[k]; if (typeof old !== 'function') return; o[k] = function (...a) { return den() ? fn.call(this, old, ...a) : old.apply(this, a); }; }
  wrap(R.World, 'biomeName', () => 'Groudon\'s Den');
  wrap(R.World, 'drawGround', (_, ctx) => drawDen(ctx));
  wrap(R.World, 'drawLiquid', () => {});
  if (A.Ground) wrap(A.Ground, 'drawGround', () => {});
  if (A.Light) wrap(A.Light, 'drawAir', (_, ctx) => denAir(ctx));
  if (A.Sky) wrap(A.Sky, 'weatherKind', () => 'clear');
  wrap(R.World, 'visibleProps', () => []);
  wrap(R.World, 'specialsNear', () => []);
  wrap(R.World, 'kindAt', (_, x, y) => { const v = at(x, y); return v === 0 ? 'wall' : v === 2 ? 'liquid' : 'floor'; });
  wrap(R.World, 'isWall', (_, x, y) => at(x, y) === 0);
  wrap(R.World, 'walkable', (_, tx, ty) => { const v = at(tx * 32 + 16, ty * 32 + 16); return v === 1 || v === 3 || v === 4; });
  wrap(R.World, 'isLiquid', (_, x, y) => at(x, y) === 2);
  wrap(R.World, 'liquidKind', () => 'lava');
  wrap(R.World, 'liquidEffect', () => ({}));
  wrap(R.World, 'isFree', (_, x, y, r, wet) => freeDen(x, y, r || 0, wet));
  wrap(R.World, 'underCanopy', () => false);
  wrap(R.World, 'clearance', () => null);
  wrap(R.World, 'propsInCircle', (_, x, y, r) => { build(); const [lx, ly] = L(x, y); return props.map((q) => ({ q, b: box(q) })).filter(({ b }) => Math.hypot(b.x - lx, b.y - ly) < r + b.rx).map(({ b }) => ({ x: OX + b.x, y: OY + b.y, r: Math.max(b.rx, b.ry), rx: b.rx, ry: b.ry, type: 'rock', solid: true, volcano: true })); });
  wrap(R.World, 'projectileBlock', (_, x, y, r = 0) => { build(); const [lx, ly] = L(x, y); return wallAt(lx, ly, r) || propAt(lx, ly, r) ? { x, y, r: 12, type: 'rock' } : null; });
  wrap(R.World, 'obstacleNear', (_, x, y, r = 12) => { build(); const [lx, ly] = L(x, y); return wallAt(lx, ly, r) || !!propAt(lx, ly, r); });
  // collision: walls and stalagmites stop you where you were (sliding along them); only Fire types wade into lava
  wrap(R.World, 'collide', (_, e) => {
    if (!e) return false;
    const wet = e === R.Game.player || e.flying || (e.types || e.mon?.types || []).includes('fire') || Number(e.dex) === GROUDON, r = Math.min(26, e.r || 12);
    const ok = (x, y) => freeDen(x, y, r, wet), old = e.__denSafe;
    if (ok(e.x, e.y)) { e.__denSafe = [e.x, e.y]; return false; }
    if (old) { if (ok(e.x, old[1])) { e.y = old[1]; e.__denSafe = [e.x, e.y]; return true; } if (ok(old[0], e.y)) { e.x = old[0]; e.__denSafe = [e.x, e.y]; return true; } e.x = old[0]; e.y = old[1]; return true; }
    for (let d = 4; d < 200; d += 6) for (let i = 0; i < 16; i++) { const x = e.x + Math.cos(i / 16 * TAU) * d, y = e.y + Math.sin(i / 16 * TAU) * d; if (ok(x, y)) { e.x = x; e.y = y; e.__denSafe = [x, y]; return true; } }
    return true;
  });
  // drawables: the den's stalagmites and crystals inside, Groudon's mountain and the fissure spires outside
  const nativeDrawables = R.Training.drawables;
  R.Training.drawables = function (...a) {
    const base = nativeDrawables.apply(this, a) || [];
    if (den()) return base.concat(denDrawables());
    if (!V.active()) return base;
    const p = R.Game.player; if (!p) return base;
    const S = site(), out = base.slice(), far = Math.max(R.Camera.w, R.Camera.h) + 500;
    if (Math.hypot(p.x - S.x, p.y - S.y) < far) out.push({ y: S.y, draw: drawMountain });
    for (const q of siteModels(S)) if (Math.hypot(p.x - q.x, p.y - q.y) < far) out.push({ y: q.y, draw: (ctx) => drawModel(ctx, q, q.x, q.y) });
    return out;
  };
  // inside the den only fire and ground Pokémon live, and fewer of them; they must stand on the den's floor
  const DEN_POOL = [218, 219, 322, 323, 324, 74, 75, 111, 104, 105, 328, 246, 449, 551, 631, 850, 636];
  function denBag(base) { const lv = Number(R.Game.player?.level) || 1, ids = DEN_POOL.filter((d) => R.DEX_BY[d] && R.SPRITE_META[d] && ((window.PS_WILD_LEVELS && window.PS_WILD_LEVELS.minimum(d)) || 1) <= lv); if (!base || !base.length || !ids.length) return base || []; return ids.map((dex, i) => ({ ...base[i % base.length], dex, name: R.DEX_BY[dex].name })); }
  const bagAt = R.Enemies.bagAt;
  if (typeof bagAt === 'function') R.Enemies.bagAt = function (...a) { const base = bagAt.apply(this, a); return den() ? denBag(base) : base; };
  const add = R.EnemyMgr.add;
  R.EnemyMgr.add = function (e, ...a) {
    if (den() && e && !e.__groudonDen) {
      if (e.boss || e.legend) return false;               // (no stage bosses down here: this is Groudon's place)
      if (Math.random() < 0.45) return false;              // (quieter than outside)
      if (!freeDen(e.x, e.y, e.r || 12, false)) {
        let placed = false;
        for (let d = 20; d < 360 && !placed; d += 20) for (let i = 0; i < 12; i++) { const x = e.x + Math.cos(i / 12 * TAU) * d, y = e.y + Math.sin(i / 12 * TAU) * d; if (freeDen(x, y, (e.r || 12) + 4, false)) { e.x = x; e.y = y; placed = true; break; } }
        if (!placed) return false;
      }
      const [lx, ly] = L(e.x, e.y); if (cell(lx, ly) === 4) return false;   // (nothing spawns on Groudon's island)
    }
    return add.call(this, e, ...a);
  };
  // lights for the night-light map
  if (A.Forest && typeof A.Forest.lights === 'function') { const fl = A.Forest.lights; A.Forest.lights = function (list, ...a) { const out = fl.call(this, list, ...a); try { if (den() && Array.isArray(list)) { const p = R.Game.player; for (const f of st.falls) list.push({ x: OX + f.x, y: OY + f.y1, r: 260, c: [255, 120, 50], i: 1 }); for (const q of props) if (q.kind === 8 && p && Math.hypot(OX + q.x - p.x, OY + q.y - p.y) < 900) list.push({ x: OX + q.x, y: OY + q.y - 16, r: 90, c: [255, 90, 60], i: 0.6 }); } } catch (_) {} return out; }; }
  const update = R.Player.prototype.update;
  R.Player.prototype.update = function (dt, ...a) { const out = update.call(this, dt, ...a); try { tick(this); } catch (err) { console.warn('[groudon-den]', err); } return out; };

  window.PS_GROUDON_DEN = { st, site, enter, leave, at, freeDen, DEN, OX, OY, build, get props() { return props; }, mountainSolid, reserve };
})();
