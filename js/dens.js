/* MAX RAID DENS — the way to obtain Dynamax.
   - During a run a Pokémon Den sometimes erupts nearby: a red pillar of light (first one around 2:30, then every few minutes).
   - Walk into it to start a MAX RAID: a giant Dynamax Pokémon appears with a red aura and lots of HP. You have 2 minutes.
   - Win: you earn the DYNAMAX BAND for the rest of the run (press G / the red button to Dynamax) + PokéCoins.
     Already have the band? A cleared den fully recharges Dynamax and pays extra coins instead.
   - Run out of time and the raid boss escapes back into the den.
   Solo only. LoverGare's test panel gets a "Dynamax Den" button. */
(() => {
  'use strict';
  if (window.PS_DENS_INSTALLED) return; window.PS_DENS_INSTALLED = true;
  const B = () => window.PS_MEGA_BRIDGE_V5, E = () => window.PS_HOOPA_ENGINE;
  const TAU = Math.PI * 2;
  const CFG = { first: 150, every: 180, chance: 0.6, life: 70, raidTime: 120, hpMul: 4, dmgMul: 1.3, grow: 1.4, coins: 300, coinsAgain: 450 };
  const dens = [];        // {x,y,t,life}
  let raid = null;        // {e,t,player}
  let runP = null, nextAt = CFG.first;
  const playing = () => B()?.game?.state === 'playing';
  const coop = () => !!(E()?.Coop?.active);
  const clock = () => { try { const t = E().Game.time; return Number(typeof t === 'function' ? t() : t) || 0; } catch (_) { return 0; } };
  const say = (t, d) => { try { E().Spawner.say(t, d || 3); } catch (_) {} };

  function spawnDen(near) {
    const p = B()?.game?.player; if (!p || coop()) return null; let x = p.x, y = p.y;
    for (let i = 0; i < 40; i++) { const a = Math.random() * TAU, d = near ? 170 : 300 + Math.random() * 160, nx = p.x + Math.cos(a) * d, ny = p.y + Math.sin(a) * d * 0.8;
      try { const W = B().world; if (W && (W.isWall(nx, ny) || (W.isLiquid && W.isLiquid(nx, ny)))) continue; } catch (_) {} x = nx; y = ny; break; }
    const d = { x, y, t: 0, life: CFG.life }; dens.push(d);
    say('🔴 A Pokémon Den is overflowing with Dynamax energy!', 3);
    try { B().fx.ring(x, y, 10, 120, '#ff2a55', 0.7, 6); B().audio?.sfx?.('legend'); } catch (_) {}
    return d;
  }
  function raidPool() {   // a strong Pokémon from the boss list, a bit ahead of the current time
    const L = (E()?.Enemies?.BOSSES || []).filter(b => b && b.dex && !b.arceus && b.dex !== 493); if (!L.length) return null;
    const t = clock(); let c = L.filter(b => b.at >= t - 60 && b.at <= t + 420); if (!c.length) c = L.slice(0, 6);
    return c[Math.floor(Math.random() * c.length)];
  }
  function startRaid(den) {
    const p = B()?.game?.player, N = E(); if (!p || !N || raid) return;
    const def0 = raidPool(); if (!def0) return;
    const def = Object.assign({}, def0, { name: (def0.name || '') });
    const sc = (N.Enemies.scale ? N.Enemies.scale(clock()) : { hp: 1, dmg: 1, spd: 1 });
    const mul = { hp: (sc.hp || 1) * CFG.hpMul, dmg: (sc.dmg || 1) * CFG.dmgMul, spd: Math.min(1.15, sc.spd || 1) };
    let e = null;
    try { e = new N.Enemy(def, den.x, den.y, mul, true); } catch (err) { console.warn('[dens] could not create raid boss', err); return; }
    e.__maxRaid = true; e.legend = true;
    try { e.anim.scale = (Number(e.anim.scale) || e.scale || 1) * CFG.grow; e.scale = (Number(e.scale) || 1) * CFG.grow; e.r = (Number(e.r) || 14) * 1.5; e.bodyH = (Number(e.bodyH) || 40) * CFG.grow; } catch (_) {}
    N.EnemyMgr.add(e);
    raid = { e, t: CFG.raidTime, player: p, name: e.name || def.name || 'Pokémon' };
    say('⚠ MAX RAID! A Dynamax ' + raid.name + ' appeared!', 3.2);
    try { B().fx.ring(den.x, den.y, 10, 300, '#ff2a55', 0.8, 8); B().fx.burst(den.x, den.y - 30, '#ff6b8a', 40, 320); B().camera?.kick?.(0.6); } catch (_) {}
    try { window.PS_MUSIC && window.PS_MUSIC.event && window.PS_MUSIC.event('trainer'); } catch (_) {}
  }
  function endRaid(won) {
    const r = raid; raid = null; if (!r) return; const p = B()?.game?.player;
    if (won && p && p === r.player) {
      const had = !!p.__dynBand; p.__dynBand = true;
      const coins = had ? CFG.coinsAgain : CFG.coins; p.coins = (Number(p.coins) || 0) + coins;
      try { window.PS_QUALITY && window.PS_QUALITY.dynRecharge && window.PS_QUALITY.dynRecharge(); } catch (_) {}
      say(had ? '🔴 Raid cleared! Dynamax recharged · +' + coins + ' PokéCoins' : '🔴 Raid cleared! You got the DYNAMAX BAND — press G! · +' + coins + ' PokéCoins', 4);
      banner.show(had ? 'Dynamax recharged!' : 'Dynamax Band obtained!', had ? '+' + coins + ' PokéCoins' : 'Press G (or the red button) to Dynamax · +' + coins + ' PokéCoins');
      try { B().fx.ring(p.x, p.y, 10, 260, '#ff2a55', 0.8, 8); B().fx.burst(p.x, p.y - 20, '#ffd0dc', 40, 300); B().audio?.sfx?.('levelup'); } catch (_) {}
    } else if (!won) {
      try { if (!r.e.dead) { r.e.dead = true; r.e.fade = 1; const L = E().EnemyMgr.all(), i = L.indexOf(r.e); if (i >= 0) L.splice(i, 1); } } catch (_) {}
      say('The Dynamax ' + r.name + ' escaped back into the den…', 3);
    }
  }
  function tick(dt) {
    const g = B()?.game, p = g?.player;
    if (!p || g.state === 'ui' || g.state === 'over') { dens.length = 0; if (raid) raid = null; runP = null; return; }
    if (p !== runP) { runP = p; nextAt = CFG.first; dens.length = 0; raid = null; }
    if (!playing() || coop() || (window.PS_SAFEZONE && window.PS_SAFEZONE.active)) return;
    if (!raid && !dens.length && clock() >= nextAt) { nextAt = clock() + CFG.every; if (!p.__dynBand || Math.random() < CFG.chance) spawnDen(false); }
    for (let i = dens.length - 1; i >= 0; i--) { const d = dens[i]; d.t += dt; if (d.t >= d.life) { dens.splice(i, 1); continue; }
      if (!raid && d.t > 0.8 && Math.hypot(p.x - d.x, p.y - d.y) < 34) { dens.splice(i, 1); startRaid(d); } }
    if (raid) { raid.t -= dt; if (raid.e.dead || raid.e.hp <= 0) endRaid(true); else if (raid.t <= 0 || p.dead) endRaid(false); }
  }

  // ---------------- drawing (overlay canvas, world -> screen with the game camera) ----------------
  const ov = document.createElement('canvas'); ov.id = 'ps-dens'; ov.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;pointer-events:none;z-index:18';
  function gameCanvas() { let best = null, area = 0; for (const c of document.querySelectorAll('canvas')) { if (c.id && c.id.startsWith('ps-')) continue; const r = c.getBoundingClientRect(), a = r.width * r.height; if (a > area) { area = a; best = { c, r }; } } return best; }
  function draw() {
    const ctx = ov.getContext('2d'), dpr = Math.min(2, devicePixelRatio || 1), W = innerWidth, H = innerHeight;
    if (ov.width !== Math.round(W * dpr) || ov.height !== Math.round(H * dpr)) { ov.width = Math.round(W * dpr); ov.height = Math.round(H * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    const st = B()?.game?.state; if ((!dens.length && !raid) || st === 'ui' || st === 'over' || (window.PS_SAFEZONE && window.PS_SAFEZONE.active)) return;
    const cam = B()?.camera, g = gameCanvas(); if (!cam || !g || typeof cam.left !== 'function') return;
    const css = Number(cam._cw) > 0 ? g.r.width / cam._cw : 1, k = cam.scale * css, now = performance.now() / 1000;
    const sx = x => g.r.left + (x - cam.left()) * k, sy = y => g.r.top + (y - cam.top()) * k;
    for (const d of dens) {
      const X = sx(d.x), Y = sy(d.y), open = Math.min(1, d.t / 0.8), fade = Math.min(1, (d.life - d.t) / 1.5);
      ctx.save(); ctx.globalAlpha = fade;
      // rocky den ring
      ctx.fillStyle = 'rgba(40,20,30,.85)'; ctx.beginPath(); ctx.ellipse(X, Y, 30 * k, 12 * k, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#6b5a52'; ctx.lineWidth = 5 * k; ctx.stroke();
      // red light pillar
      ctx.globalCompositeOperation = 'lighter';
      const hgt = 260 * k * open, w = 24 * k * (0.85 + 0.15 * Math.sin(now * 8));
      const gr = ctx.createLinearGradient(X, Y, X, Y - hgt); gr.addColorStop(0, 'rgba(255,60,100,.95)'); gr.addColorStop(0.6, 'rgba(255,40,90,.45)'); gr.addColorStop(1, 'rgba(255,40,90,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(X - w, Y); ctx.lineTo(X - w * 0.6, Y - hgt); ctx.lineTo(X + w * 0.6, Y - hgt); ctx.lineTo(X + w, Y); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,230,240,.8)'; ctx.fillRect(X - w * 0.18, Y - hgt, w * 0.36, hgt);
      for (let i = 0; i < 8; i++) { const ph = (now * 0.6 + i / 8) % 1, ax = X + Math.sin(i * 2.3 + now) * w * 1.3; ctx.fillStyle = 'rgba(255,120,160,' + (1 - ph) + ')'; ctx.beginPath(); ctx.arc(ax, Y - ph * hgt, 3 * k, 0, TAU); ctx.fill(); }
      const gl = ctx.createRadialGradient(X, Y, 0, X, Y, 70 * k); gl.addColorStop(0, 'rgba(255,60,100,.5)'); gl.addColorStop(1, 'rgba(255,60,100,0)'); ctx.fillStyle = gl; ctx.beginPath(); ctx.ellipse(X, Y, 70 * k, 28 * k, 0, 0, TAU); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      ctx.font = '800 ' + Math.round(11 * Math.max(1, k * 0.8)) + 'px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = '#4a0718'; ctx.fillStyle = '#fff';
      const lb = 'MAX RAID DEN · ' + Math.ceil(d.life - d.t) + 's'; ctx.strokeText(lb, X, Y - hgt - 8); ctx.fillText(lb, X, Y - hgt - 8);
      ctx.restore();
    }
    if (raid && !raid.e.dead) {   // red Dynamax aura + cloud crown around the raid boss
      const e = raid.e, X = sx(e.x), Y = sy(e.y), h = (Number(e.bodyH) || 60) * k;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const gr = ctx.createRadialGradient(X, Y - h * 0.5, h * 0.2, X, Y - h * 0.5, h * 0.95); gr.addColorStop(0, 'rgba(255,40,90,0)'); gr.addColorStop(0.7, 'rgba(255,40,90,' + (0.18 + 0.1 * Math.sin(now * 5)) + ')'); gr.addColorStop(1, 'rgba(255,40,90,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(X, Y - h * 0.5, h * 0.95, 0, TAU); ctx.fill();
      for (let i = 0; i < 7; i++) { const a = now * 1.2 + i / 7 * TAU, cx = X + Math.cos(a) * h * 0.45, cy = Y - h * 1.02 + Math.sin(a) * h * 0.08; ctx.fillStyle = 'rgba(255,70,120,.55)'; ctx.beginPath(); ctx.arc(cx, cy, h * 0.11, 0, TAU); ctx.fill(); }
      ctx.restore();
    }
  }

  // ---------------- raid HUD + reward banner ----------------
  const css = document.createElement('style');
  css.textContent = `
  #ps-raid{position:fixed;left:50%;bottom:118px;transform:translateX(-50%);z-index:24;display:none;min-width:280px;padding:8px 14px 10px;border-radius:14px;background:linear-gradient(180deg,rgba(90,8,30,.92),rgba(40,4,16,.92));border:2px solid #ff4d7a;color:#fff;font:800 13px Fredoka,system-ui,sans-serif;text-align:center;pointer-events:none;box-shadow:0 0 18px rgba(255,40,90,.45)}
  #ps-raid .bar{height:10px;margin-top:6px;border-radius:6px;background:rgba(255,255,255,.15);overflow:hidden}#ps-raid .bar i{display:block;height:100%;background:linear-gradient(90deg,#ff4d7a,#ffb0c4)}
  #ps-raid .tm{color:#ffd0dc}
  #ps-dyn-get{position:fixed;inset:0;z-index:80;display:none;align-items:center;justify-content:center;pointer-events:none}
  #ps-dyn-get .b{padding:20px 36px;border-radius:22px;background:linear-gradient(135deg,#ff2a55,#a0103c);color:#fff;text-align:center;font:800 34px Fredoka,system-ui;box-shadow:0 0 0 5px #fff,0 0 60px rgba(255,40,90,.8);animation:psDynGet .6s cubic-bezier(.2,1.6,.4,1)}
  #ps-dyn-get .b small{display:block;font:800 15px Fredoka,system-ui;margin-top:4px;opacity:.95}
  @keyframes psDynGet{from{transform:scale(.3);opacity:0}}`;
  const hud = document.createElement('div'); hud.id = 'ps-raid';
  const bannerEl = document.createElement('div'); bannerEl.id = 'ps-dyn-get';
  const banner = { show(t, s) { bannerEl.innerHTML = '<div class="b">🔴 ' + t + '<small>' + s + '</small></div>'; bannerEl.style.display = 'flex'; clearTimeout(banner.h); banner.h = setTimeout(() => { bannerEl.style.display = 'none'; }, 3600); } };
  function renderHud() {
    if (!raid || raid.e.dead || !playing()) { hud.style.display = 'none'; return; }
    const e = raid.e, f = Math.max(0, Math.min(1, e.hp / (e.maxHp || 1)));
    hud.innerHTML = '🔴 MAX RAID · Dynamax ' + raid.name + ' <span class="tm">· ' + Math.max(0, Math.ceil(raid.t)) + 's</span><div class="bar"><i style="width:' + (f * 100).toFixed(1) + '%"></i></div>';
    hud.style.display = 'block';
  }
  // test button for LoverGare (inside the Safe Zone test panel)
  function testBtn() {
    const t = document.getElementById('ps-sz-test'); if (!t || t.querySelector('[data-den]')) return;
    const b = document.createElement('button'); b.dataset.den = '1'; b.textContent = 'Dynamax Den'; b.addEventListener('click', e => { e.stopPropagation(); spawnDen(true); }); t.appendChild(b);
  }

  let last = performance.now(), hudT = 0;
  function loop(now) {
    requestAnimationFrame(loop); const dt = Math.min(0.1, (now - last) / 1000); last = now;
    try { tick(dt); draw(); hudT += dt; if (hudT > 0.2) { hudT = 0; renderHud(); testBtn(); } } catch (e) { console.warn('[dens]', e); }
  }
  function init() { document.head.append(css); document.body.append(ov, hud, bannerEl); requestAnimationFrame(loop); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
  window.PS_DENS = { spawn: spawnDen, get dens() { return dens.slice(); }, get raid() { return raid && { name: raid.name, t: raid.t, hp: raid.e.hp, maxHp: raid.e.maxHp, dead: raid.e.dead }; }, cfg: CFG };
})();
