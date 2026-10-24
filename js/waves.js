/* WAVES & BOSS ENCOUNTERS
   Named enemy waves arrive every ~80 s (from 1:30), always announced first so you can get ready:
     Healer wave     a pack escorted by 2 Healers (green +) that restore nearby enemies. Take the Healers out first.
     Shield squad    2 Shielders (blue shield) protect everyone close to them: those enemies take 50% less damage.
     Swift pack      fast, fragile melee attackers that rush you.
     Elite ranged    a few Elites (gold ring) with more HP that hang back and shoot.
     Elemental wave  a whole group of one type: bring the right moves.
     Mini-boss       one big Elite with lots of HP.
     Meteor shower   (from 4:00) red warning circles appear on the ground; get out before they land.
   Wave enemies arrive even when the field is "full", so running in circles doesn't stop new enemies.
   Bosses (any boss, raid or den Pokémon):
     - Slam: a red circle marks where you stand; 1.2 s later it hits. Move out of it.
     - After every slam the boss is EXPOSED for 3 s and takes +50% damage (its weakness: dodge, then punish).
     - Below 50% HP it ENRAGES: slams come faster and in a bigger circle.
     - Body contact no longer chains: after a boss touches you it bounces back and can't touch again for a moment.
   Solo runs only (co-op keeps the normal game). Not in the Legendary Den mode. */
(() => {
  'use strict';
  if (window.PS_WAVES_INSTALLED) return; window.PS_WAVES_INSTALLED = true;
  const B = () => window.PS_MEGA_BRIDGE_V5, E = () => window.PS_HOOPA_ENGINE;
  const TAU = Math.PI * 2;
  const CFG = { first: 90, every: 80, warn: 3, meteorFrom: 240, batchSize: 25 }; // 25 enemies in a normal timed wave; NOT total alive enemy cap
  const clock = () => { try { const t = E().Game.time; return Number(typeof t === 'function' ? t() : t) || 0; } catch (_) { return 0; } };
  const say = (t, d) => { try { E().Spawner.say(t, d || 3); } catch (_) {} };
  const active = () => { const N = E(), g = B()?.game; return !!(N && g && g.player && g.state === 'playing' && !(N.Coop && N.Coop.active) && !(window.PS_SAFEZONE && window.PS_SAFEZONE.active) && !(N.Rift && N.Rift.inArena) && !(N.Judgment && N.Judgment.active) && !(window.PS_MODES && window.PS_MODES.run && window.PS_MODES.run.mode === 'legend')); };
  const WAVES = [
    { id: 'healer', name: 'Healer wave', hint: 'Take out the Healers (green +) first!', w: 1 },
    { id: 'shield', name: 'Shield squad', hint: 'Shielders protect nearby enemies — break them first!', w: 1 },
    { id: 'swift', name: 'Swift pack', hint: 'Fast attackers incoming!', w: 1 },
    { id: 'elite', name: 'Elite ranged formation', hint: 'Elites hang back and shoot. Close the gap!', w: 1 },
    { id: 'element', name: 'Elemental wave', hint: '', w: 1 },
    { id: 'mini', name: 'Mini-boss', hint: 'A powerful Elite approaches!', w: 0.8 },
    { id: 'meteor', name: 'Meteor shower', hint: 'Watch the red circles!', w: 0.8, from: 240 },
  ];
  let runP = null, nextAt = CFG.first, pendingWave = null, warnT = 0, healT = 0, meteorLeft = 0, meteorT = 0;
  const zones = [];   // ground telegraphs {x,y,r,t,dur,dmg,kind,boss}
  const tagged = new Set();

  // ---------- spawning ----------
  function liveDefs() { const L = (B()?.enemies?.all?.() || []).filter(e => e && !e.dead && !e.boss && e.def && !e.remote); return L; }
  function scale() { try { return E().Enemies.scale(clock()); } catch (_) { return { hp: 1, dmg: 1, spd: 1 }; } }
  function spawnAround(def, n, mul, role, ring) {
    const N = E(), p = B().game.player, W = B().world, out = [], base = Math.random() * TAU;
    n = Math.max(1, Math.round(n)); // explicit 25 per wave, unaffected by global spawn-size multipliers
    for (let i = 0; i < n; i++) {
      let x = p.x, y = p.y; for (let k = 0; k < 20; k++) { const a = base + (ring ? i / n * TAU : (Math.random() - 0.5) * 1.2) + (k ? Math.random() : 0), d = 430 + Math.random() * 120; x = p.x + Math.cos(a) * d; y = p.y + Math.sin(a) * d * 0.8; try { if (W && W.isFree && !W.isFree(x, y, 16)) continue; } catch (_) {} break; }
      let e; try { e = new N.Enemy(Object.assign({}, def), x, y, mul, false); } catch (err) { console.warn('[waves]', err); continue; }
      e.__wave = role || 'wave'; N.EnemyMgr.add(e); tagged.add(e); out.push(e);
    }
    return out;
  }
  function pickDef(filter) { const L = liveDefs().filter(e => !filter || filter(e)); const e = L[Math.floor(Math.random() * L.length)]; return e ? e.def : null; }
  function runWave(w) {
    const sc = scale(), p = B().game.player;
    const base = pickDef(); if (!base && w.id !== 'meteor') return;
    switch (w.id) {
      case 'healer': spawnAround(base, CFG.batchSize - 2, sc, 'wave'); spawnAround(pickDef() || base, 2, { hp: sc.hp * 1.3, dmg: sc.dmg * 0.5, spd: sc.spd * 0.85 }, 'healer'); break;
      case 'shield': spawnAround(base, CFG.batchSize - 2, sc, 'wave'); spawnAround(pickDef() || base, 2, { hp: sc.hp * 1.5, dmg: sc.dmg * 0.5, spd: sc.spd * 0.8 }, 'shield'); break;
      case 'swift': spawnAround(pickDef(e => e.behavior !== 'shooter' && e.behavior !== 'ranged') || base, CFG.batchSize, { hp: sc.hp * 0.6, dmg: sc.dmg, spd: sc.spd * 1.6 }, 'swift', true); break;
      case 'elite': spawnAround(base, CFG.batchSize - 5, sc, 'wave', true); spawnAround(pickDef(e => /shoot|range|caster/.test(String(e.behavior))) || base, 5, { hp: sc.hp * 3, dmg: sc.dmg * 1.2, spd: sc.spd * 0.9 }, 'elite', true); break;
      case 'element': { const ty = (pickDef() ? (E().DEX_BY[base.dex]?.types || ['normal'])[0] : 'normal'); const d = pickDef(e => (e.types || []).includes(ty)) || base; w.label = (E().U.TYPE_NAME?.[ty] || ty); spawnAround(d, CFG.batchSize, sc, 'wave', true); break; }
      case 'mini': spawnAround(base, 1, { hp: sc.hp * 12, dmg: sc.dmg * 1.6, spd: sc.spd }, 'mini').forEach(e => { try { e.anim.scale = (Number(e.anim.scale) || 1) * 1.6; e.r = (Number(e.r) || 12) * 1.4; e.bodyH = (Number(e.bodyH) || 36) * 1.6; } catch (_) {} }); break;
      case 'meteor': meteorLeft = 10; meteorT = 0.2; break;
    }
  }
  // ---------- support behaviours ----------
  function supportTick(dt) {
    const all = B()?.enemies?.all?.() || []; healT -= dt; const heal = healT <= 0; if (heal) healT = 0.5;
    const healers = [], shields = [];
    for (const e of tagged) { if (!e || e.dead || e.hp <= 0) { tagged.delete(e); continue; } if (e.__wave === 'healer') healers.push(e); else if (e.__wave === 'shield') shields.push(e); }
    for (const e of all) { if (!e || e.dead) continue; e.__shielded = false;
      if (e.__wave !== 'shield') for (const s of shields) if (s !== e && Math.hypot(s.x - e.x, s.y - e.y) < 170) { e.__shielded = true; break; }
      if (heal && !e.boss && e.__wave !== 'healer' && e.__wave !== 'shield') for (const h of healers) if (h !== e && e.hp < e.maxHp && Math.hypot(h.x - e.x, h.y - e.y) < 180) { e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.02); e.__healFx = 0.4; break; } }
  }
  // ---------- bosses ----------
  function bossTick(dt) {
    const p = B().game.player, all = B()?.enemies?.all?.() || [];
    for (const e of all) {
      if (!e || e.dead || e.remote || !(e.boss || e.__maxRaid || e.__legendDen || e.__wave === 'mini')) continue;
      const enr = e.hp < e.maxHp * 0.5; if (enr && !e.__enraged) { e.__enraged = true; say((e.name || 'The boss') + ' is enraged!', 2.2); try { B().fx.ring(e.x, e.y, 10, 140, '#ff4d4d', 0.6, 6); } catch (_) {} }
      e.__slam = (e.__slam ?? 3 + Math.random() * 2) - dt; if (e.__exposed > 0) e.__exposed -= dt; if (e.__bounce > 0) e.__bounce -= dt;
      const d = Math.hypot(p.x - e.x, p.y - e.y);
      if (e.__slam <= 0 && d < 520) { e.__slam = enr ? 4 : 6.5; const r = enr ? 110 : 85; zones.push({ x: p.x, y: p.y, r, t: 0, dur: 1.2, dmg: Math.max(6, (Number(e._dmg ?? e.dmg) || 20) * 1.4), kind: 'slam', boss: e }); }
      // contact: bounce back after touching you, so damage can't chain
      if (d < (e.r || 14) + (p.r || 12) + 6 && !(e.__bounce > 0)) { e.__bounce = 1.1; const a = Math.atan2(e.y - p.y, e.x - p.x); e.kx = (Number(e.kx) || 0) + Math.cos(a) * 420; e.ky = (Number(e.ky) || 0) + Math.sin(a) * 420; if (typeof e.touchCd === 'number') e.touchCd = Math.max(e.touchCd, 1.1); }
    }
  }
  function zoneTick(dt) {
    const p = B().game.player;
    if (meteorLeft > 0) { meteorT -= dt; if (meteorT <= 0) { meteorLeft--; meteorT = 0.45; const a = Math.random() * TAU, d = Math.random() * 160; zones.push({ x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d * 0.8, r: 70, t: 0, dur: 1.4, dmg: 10 + clock() / 30, kind: 'meteor' }); } }
    for (let i = zones.length - 1; i >= 0; i--) { const z = zones[i]; z.t += dt; if (z.t < z.dur) continue; zones.splice(i, 1);
      try { B().fx.ring(z.x, z.y, 8, z.r * 1.1, z.kind === 'meteor' ? '#ff9a3d' : '#ff4d4d', 0.5, 6); B().fx.burst(z.x, z.y, z.kind === 'meteor' ? '#ffb070' : '#ff8080', 18, 200); } catch (_) {}
      if (Math.hypot(p.x - z.x, p.y - z.y) < z.r && !(p.invuln > 0) && !p.dead) { try { p.hurt(z.dmg, 'normal', null); } catch (_) {} }
      if (z.boss && !z.boss.dead) { z.boss.__exposed = 3; try { B().fx.dmgText(z.boss.x, z.boss.y - (z.boss.bodyH || 50) - 10, 'EXPOSED!', '#ffd23f'); } catch (_) {} }
    }
  }
  // damage: shields and exposed bosses
  let hooked = false;
  function hook() { const H = window.PS_HOOKS; if (!H || hooked) return; hooked = true; const deal = H.deal;
    H.deal = function (...a) { const m = deal ? deal.apply(this, a) : 1; const t = a.find(x => x && typeof x === 'object' && 'hp' in x && 'maxHp' in x && x !== B()?.game?.player); if (!t) return m; return m * (t.__shielded ? 0.5 : 1) * (t.__exposed > 0 ? 1.5 : 1); }; }
  // ---------- main ----------
  function tick(dt) {
    const g = B()?.game, p = g?.player;
    if (!p || g.state === 'ui' || g.state === 'over') { runP = null; zones.length = 0; tagged.clear(); pendingWave = null; return; }
    if (p !== runP) { runP = p; nextAt = CFG.first; zones.length = 0; tagged.clear(); pendingWave = null; meteorLeft = 0; }
    hook(); if (!active()) return;
    const t = clock();
    if (!pendingWave && t >= nextAt) { nextAt = t + CFG.every;
      const L = WAVES.filter(w => !w.from || t >= w.from); let r = Math.random() * L.reduce((s, w) => s + w.w, 0); pendingWave = L.find(w => (r -= w.w) < 0) || L[0]; warnT = CFG.warn;
      say('⚠ ' + pendingWave.name + ' incoming!' + (pendingWave.hint ? ' ' + pendingWave.hint : ''), CFG.warn + 1); try { B().audio?.sfx?.('pause'); } catch (_) {} }
    if (pendingWave) { warnT -= dt; if (warnT <= 0) { const w = pendingWave; pendingWave = null; runWave(w); if (w.id === 'element' && w.label) say('Elemental wave: ' + w.label + ' type!', 2.5); } }
    supportTick(dt); bossTick(dt); zoneTick(dt);
  }
  // ---------- drawing: telegraphs + role markers ----------
  const ov = document.createElement('canvas'); ov.id = 'ps-waves'; ov.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;pointer-events:none;z-index:17;display:none';
  function gameCanvas() { let best = null, area = 0; for (const c of document.querySelectorAll('canvas')) { if (c.id && c.id.startsWith('ps-')) continue; const r = c.getBoundingClientRect(), a = r.width * r.height; if (a > area) { area = a; best = { c, r }; } } return best; }
  function draw() {
    const st = B()?.game?.state, any = zones.length || tagged.size || (B()?.enemies?.all?.() || []).some(e => e && !e.dead && (e.__exposed > 0 || e.__shielded));
    if (!any || st === 'ui' || st === 'over' || (window.PS_SAFEZONE && window.PS_SAFEZONE.active)) { if (ov.style.display !== 'none') ov.style.display = 'none'; return; }
    ov.style.display = 'block';
    const ctx = ov.getContext('2d'), dpr = Math.min(2, devicePixelRatio || 1), W = innerWidth, H = innerHeight;
    if (ov.width !== Math.round(W * dpr) || ov.height !== Math.round(H * dpr)) { ov.width = Math.round(W * dpr); ov.height = Math.round(H * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    const cam = B()?.camera, g = gameCanvas(); if (!cam || !g || typeof cam.left !== 'function') return;
    const k = cam.scale * (Number(cam._cw) > 0 ? g.r.width / cam._cw : 1), now = performance.now() / 1000, sx = x => g.r.left + (x - cam.left()) * k, sy = y => g.r.top + (y - cam.top()) * k;
    for (const z of zones) { const X = sx(z.x), Y = sy(z.y), R = z.r * k, u = z.t / z.dur, col = z.kind === 'meteor' ? '255,140,40' : '255,60,60';
      ctx.save(); ctx.fillStyle = 'rgba(' + col + ',' + (0.12 + 0.22 * u) + ')'; ctx.beginPath(); ctx.ellipse(X, Y, R, R * 0.55, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(' + col + ',.9)'; ctx.lineWidth = 2.5; ctx.setLineDash([8, 6]); ctx.lineDashOffset = -now * 30; ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(' + col + ',.45)'; ctx.beginPath(); ctx.ellipse(X, Y, R * u, R * u * 0.55, 0, 0, TAU); ctx.fill();
      if (z.kind === 'meteor') { const my = Y - (1 - u) * 420 * k; ctx.fillStyle = '#ffb070'; ctx.beginPath(); ctx.arc(X + (1 - u) * 120 * k, my, 9 * k, 0, TAU); ctx.fill(); }
      ctx.restore(); }
    const all = B()?.enemies?.all?.() || [];
    for (const e of all) { if (!e || e.dead) continue; const X = sx(e.x), Y = sy(e.y), top = Y - ((e.bodyH || 36) + 10) * k;
      if (X < -60 || Y < -60 || X > W + 60 || Y > H + 60) continue;
      if (e.__shielded) { ctx.save(); ctx.strokeStyle = 'rgba(120,190,255,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(X, Y - (e.bodyH || 30) * 0.45 * k, (e.r || 12) * 1.6 * k, 0, TAU); ctx.stroke(); ctx.restore(); }
      if (e.__exposed > 0) { ctx.save(); ctx.strokeStyle = 'rgba(255,210,63,' + (0.5 + 0.5 * Math.sin(now * 12)) + ')'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(X, Y, (e.r || 20) * 1.8 * k, (e.r || 20) * 0.8 * k, 0, 0, TAU); ctx.stroke(); ctx.restore(); }
      const role = e.__wave; if (!role || role === 'wave') continue;
      ctx.save(); ctx.font = '700 ' + Math.round(14 * Math.max(1, k * 0.7)) + 'px Pixelify, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.85)'; ctx.lineJoin = 'round';
      const lab = role === 'healer' ? ['✚', '#5fe08a'] : role === 'shield' ? ['🛡', '#7fc4ff'] : role === 'elite' ? ['ELITE', '#ffd23f'] : role === 'mini' ? ['MINI-BOSS', '#ff7a5a'] : role === 'swift' ? ['»', '#ffffff'] : null;
      if (lab) { ctx.strokeText(lab[0], X, top); ctx.fillStyle = lab[1]; ctx.fillText(lab[0], X, top); }
      if (role === 'elite' || role === 'mini') { ctx.strokeStyle = lab[1]; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(X, Y, (e.r || 14) * 1.4 * k, (e.r || 14) * 0.6 * k, 0, 0, TAU); ctx.stroke(); }
      if (role === 'healer') { ctx.strokeStyle = 'rgba(95,224,138,.35)'; ctx.setLineDash([5, 6]); ctx.beginPath(); ctx.ellipse(X, Y, 180 * k, 99 * k, 0, 0, TAU); ctx.stroke(); }
      if (role === 'shield') { ctx.strokeStyle = 'rgba(127,196,255,.35)'; ctx.setLineDash([5, 6]); ctx.beginPath(); ctx.ellipse(X, Y, 170 * k, 93 * k, 0, 0, TAU); ctx.stroke(); }
      ctx.restore(); }
  }
  let last = performance.now();
  function loop(now) { requestAnimationFrame(loop); const dt = Math.min(0.1, (now - last) / 1000); last = now; try { tick(dt); draw(); } catch (e) { console.warn('[waves]', e); } }
  function init() { document.body.append(ov); requestAnimationFrame(loop); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
  window.PS_WAVES = { waves: WAVES, cfg: CFG, force(id) { const w = WAVES.find(x => x.id === id); if (w) { pendingWave = w; warnT = 0.1; } }, get zones() { return zones.length; } };
})();
