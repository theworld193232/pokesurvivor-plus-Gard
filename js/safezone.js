/* SAFE ZONES — pink rifts that lead to peaceful, walkable maps (from the Gard map design pack).
   - A pink rift sometimes opens near you during a run (or spawn one from the test panel).
   - Walk into it: the battle freezes and you arrive in a Safe Zone: no enemies, the town music plays,
     a healing spot, and a POKé MART where you spend the run's PokéCoins.
   - Walk back into the exit portal to return to the battle exactly where you left it.
   - Esc opens a pause menu (resume / settings / back to battle / quit run).
   Collision comes from a hand-traced walkability mask (paths, plazas, clearings; trees, water, cliffs, buildings block you).
   The water shimmers and the trees, bushes and grass sway in the wind.
   Solo only (co-op keeps playing). */
(() => {
  'use strict';
  if (window.PS_SAFEZONE_INSTALLED) return; window.PS_SAFEZONE_INSTALLED = true;
  const B = () => window.PS_MEGA_BRIDGE_V5, E = () => window.PS_HOOPA_ENGINE;
  const TAU = Math.PI * 2;
  const ART = 1254;       // map art size (art pixels); the image file is 2x for sharpness
  const S = 2.6;          // map art pixel -> screen pixel
  const CELL = 3;         // mask cell size in art pixels
  const ZONES = {
    'forest-shrine': { name: 'Forest Shrine', img: 'assets/safezones/forest-shrine.webp', mask: 'assets/safezones/forest-shrine-mask.png', water: 'assets/safezones/forest-shrine-water.png',
      spawn: [628, 1120], exit: [628, 1192, 28], shop: [232, 392, 46], heal: [633, 683, 46] },
    'portal-shrine': { name: 'Portal Shrine', img: 'assets/safezones/portal-shrine.webp', mask: 'assets/safezones/portal-shrine-mask.png', water: 'assets/safezones/portal-shrine-water.png',
      spawn: [627, 880], exit: [627, 627, 150], shop: [462, 418, 48], heal: [792, 418, 46], exitIsCenter: true, stall: true },
  };
  const SUPPLIES = [
    { id: 'potion', name: 'Super Potion', desc: 'Restores 50% of your HP right away.', price: 30, icon: 'u_hp', emoji: '🧪', buy: p => { p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.5); } },
    { id: 'fullheal', name: 'Max Potion', desc: 'Fully restores your HP.', price: 55, icon: 'u_regen', emoji: '💧', buy: p => { p.hp = p.maxHp; } },
    { id: 'revive', name: 'Max Revive', desc: '+1 heart: a second chance for this run.', price: 150, icon: 'u_life', emoji: '💖', buy: p => { p.lives = (Number(p.lives) || 0) + 1; } },
    { id: 'candy', name: 'Rare Candy', desc: 'Instantly gain a level when you return.', price: 80, icon: 'u_xp', emoji: '🍬', buy: p => { p.xp = Math.max(Number(p.xp) || 0, Number(p.xpNext) || 0); } },
    { id: 'reroll', name: 'Reroll Ticket', desc: '+2 rerolls on level-up rewards.', price: 40, icon: 'u_reroll', emoji: '🎟️', buy: p => { p.rerollBonus = (Number(p.rerollBonus) || 0) + 2; } },
  ];
  const HELD_PRICE = 90, RESTOCK_PRICE = 20;
  const ITEM_EN = { leftovers: 'Leftovers', choiceband: 'Choice Band', quickclaw: 'Quick Claw', focussash: 'Focus Sash', shellbell: 'Shell Bell', amuletcoin: 'Amulet Coin',
    shinycharm: 'Shiny Charm', luckyegg: 'Lucky Egg', lifeorb: 'Life Orb', choicescarf: 'Choice Scarf', rockyhelmet: 'Rocky Helmet', nevermeltice: 'Never-Melt Ice',
    flameorb: 'Flame Orb', toxicorb: 'Toxic Orb', scopelens: 'Scope Lens', sitrusberry: 'Sitrus Berry', kingsrock: "King's Rock", airballoon: 'Air Balloon',
    ejectbutton: 'Eject Button', assaultvest: 'Assault Vest', liechiberry: 'Liechi Berry', apicotberry: 'Apicot Berry', lansatberry: 'Lansat Berry' };
  const ITEM_DESC = { leftovers: 'Heal 3% HP per second.', choiceband: '+40% damage, but you can\'t switch moves.', quickclaw: '-20% cooldown on all moves.', focussash: 'Survive a KO hit once with 1 HP.',
    shellbell: 'Heal 1% of the damage you deal.', amuletcoin: '+50% PokéCoins.', shinycharm: 'Shiny Pokémon appear 3x more.', luckyegg: '+30% EXP.', lifeorb: '+30% damage, costs 1% HP per attack.',
    choicescarf: '+30% speed, -10% cooldown.', rockyhelmet: 'Melee attackers lose 20% HP.', nevermeltice: '30% chance to slow foes.', flameorb: '30% chance to burn foes.', toxicorb: '30% chance to poison foes.',
    scopelens: '+20% critical chance.', sitrusberry: 'Heal 25% when below 50% HP.', kingsrock: '20% chance to stun foes.', airballoon: 'Float over traps and enemy zones.',
    ejectbutton: 'Speed burst below 30% HP.', assaultvest: '+20% defense.', liechiberry: '+30% damage below 33% HP.', apicotberry: '+30% defense below 33% HP.', lansatberry: 'Each KO: tiny crit and damage boost.' };
  const iconUrl = k => { try { const I = E()?.Icons; if (I && E().ITEM_ICONS && E().ITEM_ICONS[k]) return I.url(k); } catch (_) {} return null; };
  const iconHtml = (k, emoji, cls) => { const u = iconUrl(k); return u ? '<img class="' + (cls || 'pi') + '" src="' + u + '" alt="">' : '<span class="' + (cls || 'pi') + ' em">' + (emoji || '🎒') + '</span>'; };

  // ---------------- assets ----------------
  const cache = {};
  function loadZone(id) {
    const z = ZONES[id]; if (cache[id]) return cache[id];
    const c = { img: new Image(), maskImg: new Image(), waterImg: new Image(), mask: null, mw: 0, mh: 0, fol: null, water: [] };
    c.img.src = z.img + '?v=2'; c.maskImg.src = z.mask + '?v=2'; c.waterImg.src = z.water + '?v=2';
    c.maskImg.onload = () => { const cv = document.createElement('canvas'); cv.width = c.mw = c.maskImg.width; cv.height = c.mh = c.maskImg.height;
      const x = cv.getContext('2d'); x.drawImage(c.maskImg, 0, 0); const d = x.getImageData(0, 0, cv.width, cv.height).data; c.mask = new Uint8Array(cv.width * cv.height);
      for (let i = 0; i < c.mask.length; i++) c.mask[i] = d[i * 4] > 127 ? 1 : 0;
      if (active && active.c === c) { const f = nearestFree(c, active.x, active.y, 12); active.x = f[0]; active.y = f[1]; } };
    c.img.onload = () => { try { buildFoliage(c); } catch (e) { console.warn('[safezone] foliage', e); } };
    c.waterImg.onload = () => { try {   // a few glint points on the water
      const cv = document.createElement('canvas'), w = c.waterImg.width, h = c.waterImg.height; cv.width = w; cv.height = h; const x = cv.getContext('2d'); x.drawImage(c.waterImg, 0, 0);
      const d = x.getImageData(0, 0, w, h).data, k = ART / w; for (let i = 0; i < 260; i++) { const px = Math.floor(Math.random() * w), py = Math.floor(Math.random() * h); if (d[(py * w + px) * 4 + 3] > 200) c.water.push({ x: px * k, y: py * k, ph: Math.random() * TAU, sp: 0.6 + Math.random() * 1.2 }); }
    } catch (_) {} };
    cache[id] = c; return c;
  }
  // everything green (grass, bushes, tree tops) goes on a separate layer that is drawn with a gentle wind sway
  function buildFoliage(c) {
    const W = ART, cv = document.createElement('canvas'); cv.width = W; cv.height = W; const x = cv.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(c.img, 0, 0, W, W);
    const id = x.getImageData(0, 0, W, W), d = id.data;
    for (let i = 0; i < d.length; i += 4) { const r = d[i] / 255, g = d[i + 1] / 255, b = d[i + 2] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), s = mx ? (mx - mn) / mx : 0;
      let h = 0; const dd = mx - mn || 1e-6; if (mx === r) h = ((g - b) / dd) % 6; else if (mx === g) h = (b - r) / dd + 2; else h = (r - g) / dd + 4; h *= 60; if (h < 0) h += 360;
      if (!(h > 62 && h < 165 && s > 0.28 && mx > 0.2)) d[i + 3] = 0; }
    x.putImageData(id, 0, 0); c.fol = cv;
  }
  const walk = (c, wx, wy) => { if (!c.mask) return true; const gx = Math.floor(wx / S / CELL), gy = Math.floor(wy / S / CELL); if (gx < 0 || gy < 0 || gx >= c.mw || gy >= c.mh) return false; return c.mask[gy * c.mw + gx] === 1; };
  function free(c, x, y, r) { for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; if (!walk(c, x + Math.cos(a) * r, y + Math.sin(a) * r)) return false; } return walk(c, x, y); }
  function nearestFree(c, x, y, r) { if (free(c, x, y, r)) return [x, y]; for (let d = 6; d < 700; d += 6) for (let i = 0; i < 24; i++) { const a = i / 24 * TAU, nx = x + Math.cos(a) * d, ny = y + Math.sin(a) * d; if (free(c, nx, ny, r)) return [nx, ny]; } return [x, y]; }

  // ---------------- pink rifts in the battle world ----------------
  const rifts = [];   // {x,y,zone,t,life}
  let spawnT = 0;
  function spawnRift(zoneId, near) {
    const p = B()?.game?.player; if (!p) return null; zoneId = zoneId || (Math.random() < 0.5 ? 'forest-shrine' : 'portal-shrine'); loadZone(zoneId);
    let x = p.x, y = p.y;
    for (let i = 0; i < 30; i++) { const a = Math.random() * TAU, d = near ? 150 : 260 + Math.random() * 140; const nx = p.x + Math.cos(a) * d, ny = p.y + Math.sin(a) * d * 0.8;
      try { const W = B().world; if (W && (W.isWall(nx, ny) || (W.isLiquid && W.isLiquid(nx, ny)))) continue; } catch (_) {} x = nx; y = ny; break; }
    const r = { x, y, zone: zoneId, t: 0, life: 75 }; rifts.push(r);
    try { B().fx.ring(x, y, 10, 90, '#ff7ad0', 0.6, 6); B().fx.dmgText(p.x, p.y - (p.bodyH || 40) - 30, 'A pink rift opened!', '#ff8ad8'); } catch (_) {}
    return r;
  }
  function tickRifts(dt) {
    const g = B()?.game, p = g?.player; if (!p || g.state !== 'playing' || active) return;
    if (E()?.Coop?.active) return;
    // natural spawn: every ~4 minutes of play there's a 45% chance
    spawnT += dt; if (spawnT >= 240) { spawnT = 0; if (Math.random() < 0.45 && !rifts.length) spawnRift(); }
    for (let i = rifts.length - 1; i >= 0; i--) { const r = rifts[i]; r.t += dt; if (r.t >= r.life) { rifts.splice(i, 1); continue; }
      if (r.t > 0.8 && Math.hypot(p.x - r.x, p.y - r.y) < 30) { rifts.splice(i, 1); enter(r.zone, r); return; } }
  }
  const ov = document.createElement('canvas'); ov.id = 'ps-pinkrift'; ov.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;pointer-events:none;z-index:19';
  function gameCanvas() { let best = null, area = 0; for (const c of document.querySelectorAll('canvas')) { if (c === ov || c.id === 'ps-sz' || c.id === 'ps-minimap') continue; const r = c.getBoundingClientRect(), a = r.width * r.height; if (a > area) { area = a; best = { c, r }; } } return best; }
  function drawRifts() {
    const ctx = ov.getContext('2d'), dpr = Math.min(2, devicePixelRatio || 1), W = innerWidth, H = innerHeight;
    if (ov.width !== Math.round(W * dpr)) { ov.width = Math.round(W * dpr); ov.height = Math.round(H * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    if (!rifts.length || active || B()?.game?.state === 'ui') return;
    const cam = B()?.camera, g = gameCanvas(); if (!cam || !g || typeof cam.left !== 'function') return;
    const css = Number(cam._cw) > 0 ? g.r.width / cam._cw : 1, k = cam.scale * css, now = performance.now() / 1000;
    for (const r of rifts) {
      const X = g.r.left + (r.x - cam.left()) * k, Y = g.r.top + (r.y - cam.top()) * k - 30 * k, open = Math.min(1, r.t / 0.6), fade = Math.min(1, (r.life - r.t) / 1.5), R = 30 * k * open;
      ctx.save(); ctx.globalAlpha = fade;
      let gr = ctx.createRadialGradient(X, Y + 30 * k, 0, X, Y + 30 * k, 60 * k); gr.addColorStop(0, 'rgba(255,120,210,.45)'); gr.addColorStop(1, 'rgba(255,120,210,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(X, Y + 30 * k, 60 * k, 22 * k, 0, 0, TAU); ctx.fill();
      ctx.translate(X, Y); ctx.scale(1, 1.25);
      gr = ctx.createRadialGradient(0, 0, 2, 0, 0, R); gr.addColorStop(0, '#fff0fb'); gr.addColorStop(0.35, '#ff9ee0'); gr.addColorStop(0.8, '#e0409e'); gr.addColorStop(1, '#8a1a6a'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill();
      ctx.globalCompositeOperation = 'lighter'; ctx.lineWidth = Math.max(2, 3 * k);
      for (let i = 0; i < 4; i++) { const a0 = now * (2 + i * 0.5) + i * 1.6; ctx.strokeStyle = i % 2 ? 'rgba(255,255,255,.8)' : 'rgba(255,170,230,.9)'; ctx.beginPath(); ctx.arc(0, 0, R * (0.45 + i * 0.15), a0, a0 + 2.2); ctx.stroke(); }
      ctx.strokeStyle = '#ffd6f2'; ctx.lineWidth = Math.max(2, 4 * k); ctx.beginPath(); ctx.arc(0, 0, R * 1.02, 0, TAU); ctx.stroke();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#fff'; ctx.strokeStyle = '#7a1458'; ctx.lineWidth = 3; ctx.font = '800 ' + Math.round(11 * Math.max(1, k * 0.8)) + 'px system-ui,sans-serif'; ctx.textAlign = 'center';
      const label = 'SAFE ZONE · ' + Math.ceil(r.life - r.t) + 's'; ctx.strokeText(label, X, Y - R * 1.4 - 6); ctx.fillText(label, X, Y - R * 1.4 - 6);
      ctx.restore();
    }
  }

  // ---------------- the Safe Zone scene ----------------
  let active = null;   // {id,z,c,x,y,face,walk,t,shopOpen,paused,items,anim}
  const cv = document.createElement('canvas'); cv.id = 'ps-sz'; cv.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:55;display:none;background:#0b1410;touch-action:none';
  const fade = document.createElement('div'); fade.style.cssText = 'position:fixed;inset:0;z-index:70;pointer-events:none;background:radial-gradient(circle,#ffd6f2,#ff5ab4);opacity:0;transition:opacity .35s';
  const keys = {};
  function flash(cb) { fade.style.opacity = '1'; setTimeout(() => { try { cb(); } catch (e) { console.warn('[safezone]', e); } setTimeout(() => { fade.style.opacity = '0'; }, 120); }, 360); }
  function makeAnim(p) {   // the player's own look (form, Mega, shiny) using the game's sprite animator
    try { const Sp = E()?.Sprites; if (!Sp || !Sp.Animator || !p || !p.anim) return null; const a = new Sp.Animator(p.anim.dex, Number(p.anim.scale) || 1, !!p.anim.shiny); a.shiny = !!p.anim.shiny; return a; } catch (_) { return null; }
  }
  function enter(id, rift) {
    const g = B()?.game, p = g?.player; if (!p || active || (E()?.Coop?.active)) return false;
    const z = ZONES[id], c = loadZone(id);
    flash(() => {
      try { g.soloHold(true); } catch (_) {}
      active = { id, z, c, x: z.spawn[0] * S, y: z.spawn[1] * S, face: -Math.PI / 2, walk: false, t: 0, shopOpen: false, paused: false, items: rollItems(), rift, anim: makeAnim(p), dex: p.anim && p.anim.dex };
      if (c.mask) { const f = nearestFree(c, active.x, active.y, 12); active.x = f[0]; active.y = f[1]; }
      for (const k in keys) keys[k] = false;
      cv.style.display = 'block'; window.PS_SAFEZONE.active = true; renderHud();
    });
    return true;
  }
  function leave(then) {
    if (!active || active.leaving) return; active.leaving = true;
    flash(() => {
      const g = B()?.game, p = g?.player; cv.style.display = 'none'; closeShop(); closePause(); active = null; window.PS_SAFEZONE.active = false; hud.style.display = 'none';
      try { g.soloHold(false); } catch (_) {}
      if (p) p.invuln = Math.max(Number(p.invuln) || 0, 2);
      if (then) setTimeout(() => { try { then(); } catch (e) { console.warn('[safezone]', e); } }, 60);
    });
  }
  function rollItems() { const L = (E()?.Items?.LIST || []).filter(i => ITEM_EN[i.id] && i.id !== 'shinycharm'); const out = []; while (out.length < 3 && L.length) out.push(L.splice(Math.floor(Math.random() * L.length), 1)[0].id); return out; }
  function updateScene(dt) {
    const a = active; if (!a) return; a.t += dt; const c = a.c, p = B()?.game?.player;
    if (!a.shopOpen && !a.paused) {
      let dx = (keys.arrowright || keys.d ? 1 : 0) - (keys.arrowleft || keys.a ? 1 : 0), dy = (keys.arrowdown || keys.s ? 1 : 0) - (keys.arrowup || keys.w ? 1 : 0);
      if (touch.on) { dx = touch.dx; dy = touch.dy; }
      const L = Math.hypot(dx, dy); a.walk = L > 0.1;
      if (a.walk) { dx /= Math.max(1, L); dy /= Math.max(1, L); a.face = Math.atan2(dy, dx); const sp = 230 * dt, r = 12;
        const nx = a.x + dx * sp, ny = a.y + dy * sp;
        if (free(c, nx, ny, r)) { a.x = nx; a.y = ny; } else if (free(c, nx, a.y, r)) a.x = nx; else if (free(c, a.x, ny, r)) a.y = ny; }
    } else a.walk = false;
    if (a.anim) { try { if (p && p.anim && p.anim.dex !== a.dex) { a.anim = makeAnim(p); a.dex = p.anim.dex; } a.anim.loop(a.walk ? 'Walk' : 'Idle'); a.anim.dir = E().Sprites.dirFromAngle(a.face); a.anim.update(dt); } catch (_) {} }
    const z = a.z, near = (pt) => pt && Math.hypot(a.x / S - pt[0], a.y / S - pt[1]) < pt[2];   // radii are in map-art pixels
    a.nearShop = near(z.shop); a.nearExit = near(z.exit);
    if (a.nearExit && !z.exitIsCenter && a.t > 1) leave();
    if (z.heal && near(z.heal) && p && p.hp < p.maxHp) { p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.12 * dt); a.healing = true; } else a.healing = false;
  }
  // water shimmer texture (generated once)
  let shimmer = null;
  function shimmerTex() {
    if (shimmer) return shimmer; const n = 256, c = document.createElement('canvas'); c.width = n; c.height = n; const x = c.getContext('2d');
    x.lineCap = 'round';
    for (let i = 0; i < 70; i++) { const px = Math.random() * n, py = Math.random() * n, L = 10 + Math.random() * 26, a = 0.25 + Math.random() * 0.5;
      x.strokeStyle = 'rgba(255,255,255,' + a + ')'; x.lineWidth = 1 + Math.random() * 1.6; x.beginPath();
      for (let k = 0; k <= 8; k++) { const u = k / 8, X = px + u * L, Y = py + Math.sin(u * Math.PI * 2) * 2.2; for (const ox of [-n, 0, n]) for (const oy of [-n, 0, n]) { if (k === 0) x.moveTo(X + ox, Y + oy); else x.lineTo(X + ox, Y + oy); } }
      x.stroke(); }
    shimmer = c; return c;
  }
  const wl = document.createElement('canvas');
  function drawWater(ctx, a, ox, oy, mapW, W, H, now) {
    const c = a.c; if (!c.waterImg.complete || !c.waterImg.naturalWidth) return;
    const dpr = ctx.getTransform().a || 1; if (wl.width !== Math.ceil(W * dpr) || wl.height !== Math.ceil(H * dpr)) { wl.width = Math.ceil(W * dpr); wl.height = Math.ceil(H * dpr); }
    const x = wl.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, W, H);
    const pat = x.createPattern(shimmerTex(), 'repeat'), sc = 1.6;
    for (let i = 0; i < 2; i++) { const sx = (now * (i ? -14 : 18)) % (256 * sc), sy = (now * (i ? 6 : -4)) % (256 * sc);
      x.save(); x.globalAlpha = i ? 0.55 : 0.8; x.translate(ox % (256 * sc) + sx, oy % (256 * sc) + sy); x.scale(sc, sc * 0.75); x.fillStyle = pat; x.fillRect(-512, -512, W / sc + 1024, H / sc / 0.75 + 1024); x.restore(); }
    // gentle brightness pulse
    x.globalAlpha = 0.10 + 0.06 * Math.sin(now * 1.3); x.fillStyle = '#bfe8ff'; x.fillRect(0, 0, W, H); x.globalAlpha = 1;
    x.globalCompositeOperation = 'destination-in'; x.imageSmoothingEnabled = true; x.drawImage(c.waterImg, ox, oy, mapW, mapW);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.42; ctx.drawImage(wl, 0, 0); ctx.restore();
    // glints
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const g of c.water) { const tw = Math.sin(now * g.sp * 2 + g.ph); if (tw < 0.75) continue; const X = ox + g.x * S, Y = oy + g.y * S; if (X < -10 || Y < -10 || X > W + 10 || Y > H + 10) continue; star4(ctx, X, Y, 2 + (tw - 0.75) * 18, (tw - 0.75) * 4, '#ffffff'); }
    ctx.restore();
  }
  function drawFoliage(ctx, a, ox, oy, W, H, now) {   // wind sway: green layer redrawn in thin rows with a small sideways offset
    const f = a.c.fol; if (!f) return; const band = 4;
    const y0 = Math.max(0, Math.floor(-oy / S / band) * band), y1 = Math.min(ART, Math.ceil((H - oy) / S));
    const x0 = Math.max(0, Math.floor(-ox / S) - 4), x1 = Math.min(ART, Math.ceil((W - ox) / S) + 4), wpx = x1 - x0; if (wpx <= 0) return;
    const gust = 0.65 + 0.35 * Math.sin(now * 0.37) * Math.sin(now * 0.13 + 1);
    ctx.save(); ctx.imageSmoothingEnabled = true;
    for (let y = y0; y < y1; y += band) {
      const dx = (Math.sin(now * 1.9 + y * 0.055) * 0.55 + Math.sin(now * 3.1 + y * 0.021) * 0.25) * gust * S;
      ctx.drawImage(f, x0, y, wpx, band, ox + x0 * S + dx, oy + y * S, wpx * S, band * S + 0.6);
    }
    ctx.restore();
  }
  function star4(ctx, x, y, r, al, col) { ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(1, al)); ctx.fillStyle = col; ctx.beginPath(); for (let i = 0; i < 8; i++) { const rr = i % 2 ? r * 0.32 : r, an = i / 8 * TAU - Math.PI / 2; ctx.lineTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr); } ctx.closePath(); ctx.fill(); ctx.restore(); }
  const shinySp = [];
  function drawScene(dt) {
    const a = active; if (!a) return; const ctx = cv.getContext('2d'), dpr = Math.min(2, devicePixelRatio || 1), W = innerWidth, H = innerHeight;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = '#0b1410'; ctx.fillRect(0, 0, W, H);
    const c = a.c, mapW = ART * S, mapH = ART * S;
    const camX = mapW <= W ? mapW / 2 : Math.max(W / 2, Math.min(mapW - W / 2, a.x)), camY = mapH <= H ? mapH / 2 : Math.max(H / 2, Math.min(mapH - H / 2, a.y)), ox = Math.round(W / 2 - camX), oy = Math.round(H / 2 - camY);
    const now = performance.now() / 1000;
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    if (c.img.complete && c.img.naturalWidth) ctx.drawImage(c.img, ox, oy, mapW, mapH);
    drawWater(ctx, a, ox, oy, mapW, W, H, now);
    drawFoliage(ctx, a, ox, oy, W, H, now);
    const z = a.z, sx = x => ox + x * S, sy = y => oy + y * S;
    // healing circle
    if (z.heal) { const X = sx(z.heal[0]), Y = sy(z.heal[1]), R = z.heal[2] * S * 0.9; ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const gr = ctx.createRadialGradient(X, Y, 0, X, Y, R); gr.addColorStop(0, 'rgba(120,255,190,.0)'); gr.addColorStop(0.75, 'rgba(120,255,190,' + (0.10 + 0.06 * Math.sin(now * 2)) + ')'); gr.addColorStop(1, 'rgba(120,255,190,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(X, Y, R, R * 0.6, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(160,255,210,' + (0.35 + 0.25 * Math.sin(now * 3)) + ')'; ctx.lineWidth = 3; ctx.setLineDash([10, 8]); ctx.lineDashOffset = -now * 20; ctx.beginPath(); ctx.ellipse(X, Y, R, R * 0.6, 0, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      if (a.healing) { ctx.font = '900 18px system-ui'; ctx.textAlign = 'center'; for (let i = 0; i < 6; i++) { const ph = (now * 0.8 + i / 6) % 1; ctx.fillStyle = 'rgba(160,255,200,' + (1 - ph) + ')'; ctx.fillText('+', X + Math.cos(i * 1.7) * R * 0.6, Y - ph * 60); } }
      ctx.restore(); label(ctx, X, Y - R * 0.6 - 16, a.healing ? 'Healing…' : '✚ Rest here', a.healing); }
    // exit portal
    { const X = sx(z.exit[0]), Y = sy(z.exit[1]) - (z.exitIsCenter ? 0 : 30), R = (z.exitIsCenter ? 64 : 34) * Math.min(1.2, S / 2.6); ctx.save(); ctx.translate(X, Y); ctx.scale(1, z.exitIsCenter ? 0.75 : 1.25);
      const gr = ctx.createRadialGradient(0, 0, 2, 0, 0, R); gr.addColorStop(0, '#fff0fb'); gr.addColorStop(0.4, '#ff9ee0'); gr.addColorStop(0.85, '#e0409e'); gr.addColorStop(1, 'rgba(138,26,106,.0)'); ctx.globalAlpha = 0.9; ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill();
      ctx.globalCompositeOperation = 'lighter'; ctx.lineWidth = 3; for (let i = 0; i < 4; i++) { const a0 = now * (2 + i * 0.5) + i; ctx.strokeStyle = i % 2 ? 'rgba(255,255,255,.8)' : 'rgba(255,170,230,.9)'; ctx.beginPath(); ctx.arc(0, 0, R * (0.4 + i * 0.15), a0, a0 + 2.2); ctx.stroke(); } ctx.restore();
      label(ctx, X, Y - R - 14, z.exitIsCenter && a.nearExit ? 'Press E to return to battle' : 'EXIT ⟶ battle', a.nearExit); }
    // shop
    if (z.shop) { const X = sx(z.shop[0]), Y = sy(z.shop[1]); if (z.stall) drawStall(ctx, X, Y - 40, now); else drawSign(ctx, X + 34, Y - 6, now); label(ctx, X, Y - (z.stall ? 134 : 52), a.nearShop ? 'Press E · Poké Mart' : '🏪 Poké Mart', a.nearShop); }
    // the player's Pokemon (same form / Mega / shiny as in battle)
    const p = B()?.game?.player, PX = sx(0) + a.x, PY = sy(0) + a.y, Z = Number(B()?.camera?.scale) || 1.43;
    ctx.save(); ctx.translate(PX, PY); ctx.scale(Z, Z);
    let drawn = false;
    if (a.anim) { try { ctx.imageSmoothingEnabled = false; try { E().Sprites.drawShadow(ctx, p && p.skin, 0, 0); } catch (_) { ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(0, 0, 12, 4.5, 0, 0, TAU); ctx.fill(); } a.anim.draw(ctx, 0, 0, {}); drawn = true; } catch (_) {} }
    ctx.restore();
    if (!drawn) { const key = (p && p.anim && p.anim.dex) || '25'; ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(PX, PY, 16, 6, 0, 0, TAU); ctx.fill();
      if (!(window.PS_FX && window.PS_FX.sprite && window.PS_FX.sprite(ctx, key, a.walk ? 'Walk' : 'Idle', a.face, a.t, PX, PY, 2 * Z * (Number(p?.anim?.scale) || 1), 1))) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(PX, PY - 16, 12, 0, TAU); ctx.fill(); } }
    // shiny: star crown + sparkle trail, like in battle
    if (p && p.anim && p.anim.shiny) {
      const h = (Number(p.bodyH) || 36) * Z, HY = PY - h * 0.92 - 2;
      if (a.walk) { a.shT = (a.shT || 0) - dt; if (a.shT <= 0) { a.shT = 0.04; shinySp.push({ x: PX + (Math.random() - 0.5) * 28, y: PY - Math.random() * h * 0.9, vy: -20 - Math.random() * 25, t: 0, life: 0.5 + Math.random() * 0.4, r: 3.5 + Math.random() * 3, c: Math.random() < 0.5 ? '#fff6c0' : '#ffffff', wx: a.x, wy: a.y }); } }
      for (let i = 0; i < 3; i++) { const an = now * 1.6 + i * TAU / 3, tw = 0.55 + 0.45 * Math.sin(now * 6 + i * 2.1); star4(ctx, PX + Math.cos(an) * 14 * Z, HY + Math.sin(an) * 4.5 * Z - (i === 1 ? 3 * Z : 0), (4.6 + 2.2 * tw) * Z * 0.8, 0.65 + 0.35 * tw, i === 1 ? '#ffe36a' : '#ffffff'); }
    }
    for (let i = shinySp.length - 1; i >= 0; i--) { const q = shinySp[i]; q.t += dt; q.y += q.vy * dt; if (q.t >= q.life) { shinySp.splice(i, 1); continue; } const f = q.t / q.life; star4(ctx, q.x + (sx(0) + q.wx - PX) * 0 , q.y, q.r * (1 - f * 0.5), 1 - f, q.c); }
    if (shinySp.length > 160) shinySp.splice(0, shinySp.length - 160);
  }
  function label(ctx, x, y, text, hi) { ctx.save(); ctx.font = '800 13px system-ui,sans-serif'; ctx.textAlign = 'center'; const w = ctx.measureText(text).width + 18; ctx.fillStyle = hi ? 'rgba(255,90,180,.95)' : 'rgba(20,16,44,.8)'; roundRect(ctx, x - w / 2, y - 12, w, 23, 9); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fillStyle = '#fff'; ctx.fillText(text, x, y + 4); ctx.restore(); }
  function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function drawStall(ctx, X, Y, now) {   // a little Poké Mart stall with a blue awning
    ctx.save(); ctx.translate(X, Y); ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(0, 20, 66, 15, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#7a4f28'; ctx.fillRect(-58, -10, 116, 32); ctx.fillStyle = '#a8743c'; ctx.fillRect(-58, -10, 116, 8); ctx.fillStyle = '#5a3818'; ctx.fillRect(-58, 18, 116, 4);
    ctx.fillStyle = '#5b3a1c'; ctx.fillRect(-54, -62, 6, 54); ctx.fillRect(48, -62, 6, 54);
    for (let i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? '#ffffff' : '#3d7cf0'; ctx.beginPath(); ctx.moveTo(-62 + i * 15.5, -66); ctx.lineTo(-46.5 + i * 15.5, -66); ctx.lineTo(-46.5 + i * 15.5, -46); ctx.quadraticCurveTo(-54 + i * 15.5, -40, -62 + i * 15.5, -46); ctx.fill(); }
    ctx.fillStyle = '#2b5fc8'; roundRect(ctx, -30, -84, 60, 18, 5); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = '900 11px system-ui'; ctx.textAlign = 'center'; ctx.fillText('MART', 0, -71);
    const bob = Math.sin(now * 3) * 1.5; ctx.fillStyle = '#e8463c'; ctx.beginPath(); ctx.arc(-28, -18 + bob, 7, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-28, -18 + bob, 7, 0, Math.PI); ctx.fill(); ctx.fillStyle = '#222'; ctx.fillRect(-35, -19 + bob, 14, 2);
    ctx.fillStyle = '#9b6cf0'; ctx.fillRect(-6, -27, 12, 15); ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(26, -18 - bob, 7, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function drawSign(ctx, X, Y, now) {   // a small Poké Mart sign board next to the shop spot
    ctx.save(); ctx.translate(X, Y); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(0, 18, 18, 5, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#5b3a1c'; ctx.fillRect(-2, -6, 4, 24); ctx.fillStyle = '#2b5fc8'; roundRect(ctx, -20, -26, 40, 22, 5); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = '900 9px system-ui'; ctx.textAlign = 'center'; ctx.fillText('MART', 0, -11); ctx.restore();
  }

  // ---------------- input ----------------
  addEventListener('keydown', e => {
    if (!active) return; const k = (e.key || '').toLowerCase(); keys[k] = true;
    if (active.paused) { if (k === 'escape') closePause(); e.stopImmediatePropagation(); e.preventDefault(); return; }
    if (active.shopOpen) { shopKey(e, k); e.stopImmediatePropagation(); e.preventDefault(); return; }
    if ((k === 'e' || k === 'enter' || k === ' ') && !e.repeat) { if (active.nearShop) openShop(); else if (active.nearExit) leave(); }
    if (k === 'escape' || k === 'p') openPause();
    e.stopImmediatePropagation(); e.preventDefault();
  }, true);
  addEventListener('keyup', e => { if (!active) return; keys[(e.key || '').toLowerCase()] = false; e.stopImmediatePropagation(); }, true);
  addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
  const touch = { on: false, x0: 0, y0: 0, dx: 0, dy: 0 };
  cv.addEventListener('pointerdown', e => { if (!active) return; const near = active.nearShop || active.nearExit; if (near && e.pointerType !== 'mouse') { if (active.nearShop) openShop(); else leave(); return; } touch.on = true; touch.x0 = e.clientX; touch.y0 = e.clientY; touch.dx = touch.dy = 0; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', e => { if (!touch.on) return; const dx = e.clientX - touch.x0, dy = e.clientY - touch.y0, L = Math.hypot(dx, dy); touch.dx = L > 8 ? dx / Math.max(40, L) : 0; touch.dy = L > 8 ? dy / Math.max(40, L) : 0; });
  cv.addEventListener('pointerup', () => { touch.on = false; touch.dx = touch.dy = 0; });

  // ---------------- HUD, Poké Mart, pause ----------------
  const css = document.createElement('style');
  css.textContent = `
  #ps-sz-hud{position:fixed;left:50%;top:12px;transform:translateX(-50%);z-index:58;display:none;align-items:center;gap:14px;padding:8px 18px;border-radius:14px;border:2px solid rgba(255,255,255,.18);background:linear-gradient(180deg,rgba(38,30,72,.92),rgba(22,18,44,.92));color:#fff;font:800 14px Fredoka,system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.35);backdrop-filter:blur(4px)}
  #ps-sz-hud .t{color:#ff9ad8}#ps-sz-hud .c{color:#ffd86b}#ps-sz-hud .h{color:#8fffc0}#ps-sz-hud .hint{font-size:11px;color:#b9b4d8;font-weight:700}
  #ps-sz-hud .ib{font:800 12px system-ui;border:0;border-radius:8px;padding:4px 10px;background:rgba(255,255,255,.12);color:#fff;cursor:pointer}
  #ps-shop{position:fixed;inset:0;z-index:62;display:none;align-items:center;justify-content:center;background:rgba(8,6,20,.55);backdrop-filter:blur(3px);font:700 14px Fredoka,system-ui,sans-serif;color:#eef0ff}
  #ps-shop .mart{position:relative;width:min(760px,calc(100vw - 20px));max-height:calc(100vh - 24px);display:flex;flex-direction:column;border-radius:20px;overflow:hidden;background:#1b1f3f;border:3px solid #0d1030;box-shadow:0 0 0 3px #5a7cff inset,0 24px 60px rgba(0,0,0,.6);animation:psMartIn .28s cubic-bezier(.2,1.4,.4,1)}
  @keyframes psMartIn{from{transform:scale(.9) translateY(14px);opacity:0}to{transform:none;opacity:1}}
  #ps-shop .awn{height:16px;background:repeating-linear-gradient(90deg,#3d7cf0 0 28px,#fff 28px 56px);box-shadow:0 3px 0 rgba(0,0,0,.25)}
  #ps-shop .top{display:flex;align-items:center;gap:12px;padding:12px 18px 10px;background:linear-gradient(180deg,#2b5fc8,#1f45a0)}
  #ps-shop .logo{width:38px;height:38px;border-radius:50%;background:linear-gradient(#e8463c 0 46%,#222 46% 54%,#fff 54%);border:3px solid #222;position:relative;flex:none}
  #ps-shop .logo:after{content:'';position:absolute;left:50%;top:50%;width:10px;height:10px;transform:translate(-50%,-50%);border-radius:50%;background:#fff;border:3px solid #222}
  #ps-shop .ttl{font:800 24px Fredoka,system-ui,sans-serif;letter-spacing:.5px;text-shadow:0 2px 0 rgba(0,0,0,.3)}#ps-shop .ttl small{display:block;font:700 12px system-ui;opacity:.8;letter-spacing:0}
  #ps-shop .coins{margin-left:auto;display:flex;align-items:center;gap:6px;padding:6px 14px;border-radius:999px;background:rgba(0,0,0,.28);font:800 18px Fredoka,system-ui;color:#ffd86b}
  #ps-shop .coins.bump{animation:psBump .35s}@keyframes psBump{40%{transform:scale(1.15);color:#fff}}
  #ps-shop .tabs{display:flex;gap:6px;padding:10px 16px 0;background:#161a36}
  #ps-shop .tab{border:0;cursor:pointer;padding:9px 16px;border-radius:12px 12px 0 0;font:800 13px system-ui;color:#aab0e0;background:#232853}
  #ps-shop .tab.on{background:#2a3068;color:#fff;box-shadow:inset 0 3px 0 #ff7ac8}
  #ps-shop .body{display:flex;gap:14px;padding:14px 16px;background:#2a3068;min-height:0;flex:1;overflow:auto}
  #ps-shop .grid{flex:1.3;display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;align-content:start}
  #ps-shop .card{position:relative;display:flex;align-items:center;gap:10px;padding:10px;border-radius:14px;background:#343b7d;border:2px solid transparent;cursor:pointer;transition:transform .12s,border-color .12s,background .12s}
  #ps-shop .card:hover{transform:translateY(-2px);background:#3d458f}#ps-shop .card.sel{border-color:#ff7ac8;background:#433f8f;box-shadow:0 0 0 3px rgba(255,122,200,.25)}
  #ps-shop .card.poor .pr{color:#ff8a8a}#ps-shop .card.own{opacity:.6}
  #ps-shop .card .nm{font:800 13px system-ui;line-height:1.15}#ps-shop .card .pr{display:flex;align-items:center;gap:3px;font:800 12px system-ui;color:#ffd86b;margin-top:3px}
  #ps-shop .card.pop{animation:psPop .4s}@keyframes psPop{30%{transform:scale(1.08)}}
  #ps-shop .pi{width:36px;height:36px;image-rendering:pixelated;flex:none;filter:drop-shadow(0 2px 0 rgba(0,0,0,.35))}#ps-shop .pi.em{font-size:26px;line-height:36px;text-align:center}
  #ps-shop .ci{width:16px;height:16px;image-rendering:pixelated}
  #ps-shop .det{flex:1;display:flex;flex-direction:column;align-items:center;text-align:center;gap:8px;padding:16px;border-radius:16px;background:#1f2452;min-width:200px}
  #ps-shop .det .big{width:84px;height:84px;image-rendering:pixelated;filter:drop-shadow(0 4px 0 rgba(0,0,0,.35))}#ps-shop .det .big.em{font-size:62px;line-height:84px}
  #ps-shop .det h4{margin:2px 0 0;font:800 20px Fredoka,system-ui}#ps-shop .det p{margin:0;color:#c5c9ef;font:600 13px system-ui;line-height:1.35}
  #ps-shop .det .note{font:700 11px system-ui;color:#9aa0d8}
  #ps-shop .buy{margin-top:auto;width:100%;border:0;cursor:pointer;padding:12px;border-radius:12px;font:800 16px Fredoka,system-ui;color:#fff;background:linear-gradient(180deg,#ff7ac8,#e0409e);box-shadow:0 4px 0 #9b1d68;display:flex;align-items:center;justify-content:center;gap:6px}
  #ps-shop .buy:active{transform:translateY(2px);box-shadow:0 2px 0 #9b1d68}#ps-shop .buy:disabled{background:#4a4f7a;box-shadow:0 4px 0 #2f3358;cursor:default;color:#b5b8d8}
  #ps-shop .foot{display:flex;align-items:center;gap:10px;padding:10px 16px;background:#161a36;font:700 12px system-ui;color:#9aa0d8}
  #ps-shop .foot button{margin-left:auto;border:0;cursor:pointer;padding:8px 16px;border-radius:10px;font:800 13px system-ui;color:#fff;background:#3b416f}
  #ps-shop .float{position:absolute;pointer-events:none;font:800 16px Fredoka,system-ui;color:#ffd86b;text-shadow:0 2px 0 #000;animation:psFloat .9s forwards}@keyframes psFloat{to{transform:translateY(-34px);opacity:0}}
  @media (max-width:600px){#ps-shop .body{flex-direction:column}#ps-shop .det{min-width:0}}
  #ps-sz-pause{position:fixed;inset:0;z-index:63;display:none;align-items:center;justify-content:center;background:rgba(8,6,20,.6);backdrop-filter:blur(3px)}
  #ps-sz-pause .box{width:min(340px,calc(100vw - 30px));padding:20px;border-radius:18px;background:linear-gradient(180deg,#2a2356,#1b1740);border:2px solid rgba(255,255,255,.15);box-shadow:0 20px 50px rgba(0,0,0,.5);text-align:center;color:#fff;font:700 14px system-ui;animation:psMartIn .25s cubic-bezier(.2,1.4,.4,1)}
  #ps-sz-pause h3{margin:0 0 4px;font:800 24px Fredoka,system-ui;color:#ff9ad8}#ps-sz-pause .sub{color:#b9b4d8;font-size:12px;margin-bottom:14px}
  #ps-sz-pause button{display:block;width:100%;margin:8px 0;padding:11px;border:0;border-radius:12px;cursor:pointer;font:800 15px Fredoka,system-ui;color:#fff;background:#3b3577}
  #ps-sz-pause button.pri{background:linear-gradient(180deg,#ff7ac8,#e0409e)}#ps-sz-pause button.warn{background:#5a2a3a}
  #ps-sz-test{position:fixed;left:50%;top:8px;transform:translateX(-50%);z-index:57;display:none;gap:6px;padding:6px 8px;border-radius:10px;border:2px dashed #ff7ad0;background:rgba(30,10,30,.85);color:#fff;font:700 11px system-ui,sans-serif}
  #ps-sz-test button{font:700 11px system-ui,sans-serif;padding:4px 8px;border-radius:6px;border:1px solid #ff9ad8;background:#5a1a48;color:#fff;cursor:pointer}`;
  const hud = document.createElement('div'); hud.id = 'ps-sz-hud';
  const shop = document.createElement('div'); shop.id = 'ps-shop';
  const pause = document.createElement('div'); pause.id = 'ps-sz-pause';
  const test = document.createElement('div'); test.id = 'ps-sz-test';
  test.innerHTML = '<span>🧪 TEST</span><button data-z="forest-shrine">Pink rift: Forest Shrine</button><button data-z="portal-shrine">Pink rift: Portal Shrine</button><button data-c="1">+500 coins</button>';
  [hud, shop, test, pause].forEach(el => ['pointerdown', 'mousedown', 'touchstart', 'click', 'keydown'].forEach(ev => el.addEventListener(ev, e => e.stopPropagation())));
  test.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.z) spawnRift(b.dataset.z, true); if (b.dataset.c) { const p = B()?.game?.player; if (p) p.coins = (Number(p.coins) || 0) + 500; } });
  const coinIco = () => { const u = (() => { try { return E()?.Icons?.url('coin'); } catch (_) { return null; } })(); return u ? '<img class="ci" src="' + u + '" alt="">' : '🪙'; };
  function renderHud() { if (!active) { hud.style.display = 'none'; return; } const p = B()?.game?.player; hud.style.display = 'flex';
    hud.innerHTML = '<span class="t">🌸 ' + active.z.name + '</span><span class="c">' + coinIco() + ' ' + Math.floor(Number(p?.coins) || 0) + '</span><span class="h">❤ ' + Math.ceil(p?.hp || 0) + '/' + Math.round(p?.maxHp || 0) + '</span><span class="hint">WASD walk · E interact · Esc menu</span><button class="ib" data-pause="1">☰</button>'; }
  hud.addEventListener('click', e => { if (e.target.closest('[data-pause]')) openPause(); });

  // Poké Mart
  const mart = { tab: 'sup', sel: 0 };
  function martList() {
    const p = B()?.game?.player;
    if (mart.tab === 'sup') return SUPPLIES.map(s => ({ kind: 'sup', id: s.id, name: s.name, desc: s.desc, price: s.price, icon: s.icon, emoji: s.emoji }));
    return active.items.map(id => ({ kind: 'held', id, name: ITEM_EN[id] || id, desc: ITEM_DESC[id] || '', price: HELD_PRICE, icon: id, emoji: '🎒', own: p && p.item === id }));
  }
  function openShop() { if (!active) return; active.shopOpen = true; mart.sel = Math.min(mart.sel, martList().length - 1); renderShop(); shop.style.display = 'flex'; }
  function closeShop() { if (active) active.shopOpen = false; shop.style.display = 'none'; }
  function renderShop() {
    if (!active) return; const p = B()?.game?.player, coins = Math.floor(Number(p?.coins) || 0), L = martList(); mart.sel = Math.max(0, Math.min(mart.sel, L.length - 1)); const it = L[mart.sel];
    let h = '<div class="mart"><div class="awn"></div><div class="top"><div class="logo"></div><div class="ttl">Poké Mart<small>' + active.z.name + ' · spend the PokéCoins from this run</small></div><div class="coins">' + coinIco() + ' <span>' + coins + '</span></div></div>';
    h += '<div class="tabs"><button class="tab' + (mart.tab === 'sup' ? ' on' : '') + '" data-tab="sup">🧪 Supplies</button><button class="tab' + (mart.tab === 'held' ? ' on' : '') + '" data-tab="held">🎒 Held items</button></div>';
    h += '<div class="body"><div class="grid">';
    L.forEach((x, i) => { h += '<div class="card' + (i === mart.sel ? ' sel' : '') + (coins < x.price ? ' poor' : '') + (x.own ? ' own' : '') + '" data-i="' + i + '">' + iconHtml(x.icon, x.emoji) + '<div><div class="nm">' + x.name + '</div><div class="pr">' + (x.own ? 'Held' : coinIco() + ' ' + x.price) + '</div></div></div>'; });
    h += '</div><div class="det">';
    if (it) { h += iconHtml(it.icon, it.emoji, 'big') + '<h4>' + it.name + '</h4><p>' + it.desc + '</p>';
      if (it.kind === 'held') h += '<div class="note">' + (p?.item ? 'Replaces: ' + (ITEM_EN[p.item] || p.item) : 'You are not holding an item') + '</div>';
      h += '<button class="buy" data-buy="1" ' + (coins < it.price || it.own ? 'disabled' : '') + '>' + (it.own ? 'Already held' : coins < it.price ? 'Not enough coins' : 'Buy · ' + coinIco() + ' ' + it.price) + '</button>'; }
    h += '</div></div><div class="foot"><span>↑↓←→ select · E buy · Tab switch · Esc close</span>' + (mart.tab === 'held' ? '<button data-restock="1" ' + (coins < RESTOCK_PRICE ? 'disabled' : '') + '>↻ Restock (' + RESTOCK_PRICE + ')</button>' : '') + '<button data-close="1">Close</button></div></div>';
    shop.innerHTML = h;
  }
  function floatText(txt) { const m = shop.querySelector('.coins'); if (!m) return; m.classList.add('bump'); const f = document.createElement('div'); f.className = 'float'; f.textContent = txt; const r = m.getBoundingClientRect(), R = shop.querySelector('.mart').getBoundingClientRect(); f.style.left = (r.left - R.left + 10) + 'px'; f.style.top = (r.bottom - R.top) + 'px'; shop.querySelector('.mart').appendChild(f); }
  function buySel() {
    const p = B()?.game?.player; if (!p || !active) return; const L = martList(), it = L[mart.sel]; if (!it || it.own || (Number(p.coins) || 0) < it.price) { try { B().audio?.sfx?.('error'); } catch (_) {} return; }
    if (it.kind === 'sup') { const s = SUPPLIES.find(x => x.id === it.id); p.coins -= it.price; s.buy(p); }
    else { if (typeof p.equip !== 'function') return; p.coins -= it.price; p.equip(it.id); }
    try { B().audio?.sfx?.('buy'); } catch (_) {}
    renderShop(); renderHud(); floatText('-' + it.price); const c = shop.querySelector('.card[data-i="' + mart.sel + '"]'); if (c) c.classList.add('pop');
  }
  function shopKey(e, k) {
    const L = martList(), cols = Math.max(1, Math.round((shop.querySelector('.grid')?.clientWidth || 300) / 160));
    if (k === 'escape') closeShop();
    else if (k === 'tab' || k === 'q') { mart.tab = mart.tab === 'sup' ? 'held' : 'sup'; mart.sel = 0; renderShop(); }
    else if (k === 'arrowright' || k === 'd') { mart.sel = (mart.sel + 1) % L.length; renderShop(); }
    else if (k === 'arrowleft' || k === 'a') { mart.sel = (mart.sel - 1 + L.length) % L.length; renderShop(); }
    else if (k === 'arrowdown' || k === 's') { mart.sel = Math.min(L.length - 1, mart.sel + cols); renderShop(); }
    else if (k === 'arrowup' || k === 'w') { mart.sel = Math.max(0, mart.sel - cols); renderShop(); }
    else if ((k === 'e' || k === 'enter' || k === ' ') && !e.repeat) buySel();
  }
  shop.addEventListener('click', e => {
    if (e.target === shop) return closeShop();
    const t = e.target.closest('[data-tab],[data-i],[data-buy],[data-close],[data-restock]'); if (!t) return; const p = B()?.game?.player;
    if (t.dataset.close) return closeShop();
    if (t.dataset.tab) { mart.tab = t.dataset.tab; mart.sel = 0; return renderShop(); }
    if (t.dataset.i != null) { const i = Number(t.dataset.i); if (i === mart.sel && e.detail >= 2) return buySel(); mart.sel = i; return renderShop(); }
    if (t.dataset.buy) return buySel();
    if (t.dataset.restock && p && (Number(p.coins) || 0) >= RESTOCK_PRICE) { p.coins -= RESTOCK_PRICE; active.items = rollItems(); mart.sel = 0; renderShop(); renderHud(); floatText('-' + RESTOCK_PRICE); }
  });

  // pause menu (Esc inside a Safe Zone)
  function openPause() { if (!active || active.leaving) return; active.paused = true; closeShop();
    pause.innerHTML = '<div class="box"><h3>Paused</h3><div class="sub">' + active.z.name + ' · Safe Zone</div><button class="pri" data-a="resume">Resume</button><button data-a="settings">⚙ Settings</button><button data-a="leave">Return to battle</button><button class="warn" data-a="quit">Quit run</button></div>';
    pause.style.display = 'flex'; }
  function closePause() { if (active) active.paused = false; pause.style.display = 'none'; }
  pause.addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (e.target === pause) return closePause(); if (!b) return; const a = b.dataset.a;
    if (a === 'resume') closePause();
    else if (a === 'settings') { closePause(); try { const btn = document.querySelector('#ps-q-btn'); if (btn) btn.click(); else (E()?.SettingsUI?.open || (() => {}))(); } catch (_) {} }
    else if (a === 'leave') leave();
    else if (a === 'quit') leave(() => { try { E().Game.quit(); } catch (_) {} });
  });

  // ---------------- loop ----------------
  let last = performance.now(), hudT = 0;
  function loop(now) {
    requestAnimationFrame(loop); const dt = Math.min(0.1, (now - last) / 1000); last = now;
    try { if (active) { updateScene(dt); drawScene(dt); hudT += dt; if (hudT > 0.25) { hudT = 0; renderHud(); } } else { tickRifts(dt); } drawRifts(); } catch (e) { console.warn('[safezone]', e); }
    const isMe = String(B()?.user || '').trim().toLowerCase() === 'lovergare';
    test.style.display = isMe && B()?.game?.state === 'playing' && !active ? 'flex' : 'none';
    if (!active && B()?.game?.state === 'ui' && rifts.length) rifts.length = 0;
  }
  function init() { document.head.append(css); document.body.append(ov, cv, hud, shop, pause, test, fade); requestAnimationFrame(loop); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
  window.PS_SAFEZONE = { active: false, spawnRift, enter, leave, zones: ZONES, openShop, openPause,
    tp(ax, ay) { if (active) { const f = nearestFree(active.c, ax * S, ay * S, 12); active.x = f[0]; active.y = f[1]; } },
    get rifts() { return rifts.slice(); }, get state() { return active && { id: active.id, x: active.x, y: active.y, nearShop: active.nearShop, nearExit: active.nearExit, paused: active.paused, shop: active.shopOpen, anim: !!active.anim, shiny: !!(active.anim && active.anim.shiny) }; } };
})();
