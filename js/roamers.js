/* ROAMING LEGENDARIES + BOSS RUSH LEGENDARIES
   - Every 2-3 minutes of a run there's an 8% chance a wild Mew appears somewhere near you, and another 8% chance
     for one of the roaming Legendaries (Raikou, Entei, Suicune, Latias, Latios, the legendary birds, Cresselia,
     the Forces of Nature...). "A wild Mew has appeared!" — defeat it before it flees (90 s) and it joins your
     collection (shiny if it was). Normal shiny odds apply (Shiny Charm triples them).
   - Boss Rush mode: on top of the faster bosses, a Legendary boss joins the fight every 75 seconds.
   Co-op too: the host's game spawns them for everyone, and the roaming Legendary joins every player in the group.
   LoverGare's test panel gets a "Roaming Legendary" button. */
(() => {
  'use strict';
  if (window.PS_ROAMERS_INSTALLED) return; window.PS_ROAMERS_INSTALLED = true;
  const B = () => window.PS_MEGA_BRIDGE_V5, E = () => window.PS_HOOPA_ENGINE;
  const TAU = Math.PI * 2;
  const CFG = { every: [120, 180], mewChance: 0.08, roamChance: 0.08, flee: 90, rushEvery: 75 };   // a roll every 2-3 minutes
  const MEW = 151, ROAMERS = [243, 244, 245, 380, 381, 144, 145, 146, 488, 641, 642, 645, 905];
  const GACHA_ONLY = new Set([801, 648, 490, 489]);
  const clock = () => { try { const t = E().Game.time; return Number(typeof t === 'function' ? t() : t) || 0; } catch (_) { return 0; } };
  const coop = () => !!(E()?.Coop?.active);
  const host = () => { try { const n = E().Net; return !!(typeof n.isHost === 'function' ? n.isHost() : n.isHost); } catch (_) { return false; } };
  // co-op: the host's game rolls and spawns the roamers (everyone sees them); the news and the reward reach the whole group
  const tell = msg => { try { if (coop() && host()) E().Net.broadcast(Object.assign({ k: 'psroam' }, msg)); } catch (_) {} };
  let netHooked = false;
  function hookNet() {
    const n = E()?.Net; if (netHooked || !n || typeof n.on !== 'function') return; netHooked = true;
    n.on((uid, msg) => { try {
      if (!msg || msg.k !== 'psroam' || host()) return; const N = E(), d = N.DEX_BY[Number(msg.dex)]; if (!d) return; const dex = Number(msg.dex), sh = !!msg.shiny;
      if (msg.ev === 'appear') { cry(dex); if (sh) { try { B().audio?.sfx?.('shiny'); } catch (_) {} } say('A wild ' + (sh ? 'shiny ' : '') + d.name + ' has appeared!', 4); toast('A wild ' + d.name + ' appeared!', 'Defeat it before it flees to catch it', { dex, shiny: sh, gold: true, ms: 6000 }); }
      else if (msg.ev === 'fled') { say(d.name + ' fled!', 2.5); cry(dex, 0.5); }
      else if (msg.ev === 'caught') caught({ dex, e: { shiny: sh } }, true);
    } catch (_) {} });
  }
  const say = (t, d) => { try { E().Spawner.say(t, d || 3); } catch (_) {} };
  const toast = (t, s, o) => { try { window.PS_TOAST && window.PS_TOAST(t, s, o); } catch (_) {} };
  const live = [];   // {e, kind:'roam'|'rush', t, dex}
  const gap = () => CFG.every[0] + Math.random() * (CFG.every[1] - CFG.every[0]);
  let runP = null, nextRoll = gap(), nextRush = CFG.rushEvery;

  // roamer cries (assets/cries/<dex>.mp3), played at the game's sound-effects volume
  const CRY_VOL = 0.35;   // cries are mastered loud: this scales them down (raise toward 1 for louder)
  function cry(dex, vol) {
    try { let v = 0.6; try { const A = E().Audio, st = A && A.settings; if (st && st.sfx != null) v = Math.max(0, Math.min(1, Number(st.sfx) > 1 ? Number(st.sfx) / 100 : Number(st.sfx))); } catch (_) {}
      const a = new Audio('assets/cries/' + dex + '.mp3'); a.volume = Math.min(1, v * (vol || 0.8) * CRY_VOL); a.play().catch(() => {}); } catch (_) {}
  }
  function template() {   // stats from the boss list entry closest to the current time
    const L = E()?.Enemies?.BOSSES || [], t = clock(); let best = L[0] || {}; for (const b of L) if (Math.abs(b.at - t) < Math.abs((best.at || 0) - t)) best = b; return best;
  }
  function spot(p, dmin, dmax) {
    const W = B()?.world; for (let i = 0; i < 60; i++) { const a = Math.random() * TAU, d = dmin + Math.random() * (dmax - dmin), x = p.x + Math.cos(a) * d, y = p.y + Math.sin(a) * d * 0.8;
      try { if (W && W.isFree && !W.isFree(x, y, 24)) continue; } catch (_) {} return [x, y]; } return [p.x + dmax, p.y];
  }
  const mountain=()=>!!window.PS_CRYSTAL_PEAK?.mountain?.();
  const sanctuary=()=>!!(window.PS_CRYSTAL_PEAK?.active?.()&&window.PS_CRYSTAL_PEAK.model?.special?.());
  function spawnLegend(dex, kind) {
    if(sanctuary())return null;if(mountain())dex=144;
    const N = E(), p = B()?.game?.player; if (!N || !p || !N.DEX_BY[dex] || !N.SPRITE_META[dex]) return null;
    const T = template(), sc = N.Enemies.scale ? N.Enemies.scale(clock()) : { hp: 1, dmg: 1, spd: 1 }, d = N.DEX_BY[dex], roam = kind === 'roam';
    const def = { dex, name: d.name, hp: Math.round((Number(T.hp) || 1500) * (roam ? 1.2 : 1.6)), spd: Math.round((Number(T.spd) || 85) * (roam ? 1.25 : 1)), dmg: Math.round((Number(T.dmg) || 30) * 1.15), xp: Math.round((Number(T.xp) || 200) * 1.5),
      behavior: T.behavior || 'charger', shotDmg: Math.round((Number(T.shotDmg) || 15) * 1.1), shotCd: T.shotCd || 1.2, range: T.range || 260 };
    const [x, y] = spot(p, roam ? 380 : 260, roam ? 620 : 420);
    let e; try { e = new N.Enemy(def, x, y, { hp: sc.hp || 1, dmg: sc.dmg || 1, spd: Math.min(1.2, sc.spd || 1) }, true); } catch (err) { console.warn('[roamers]', err); return null; }
    e.legend = true; e.__roamer = kind;
    try { const rate = (Number(N.Spawner.SHINY_RATE) || 1 / 4096) * (p.item === 'shinycharm' ? 3 : 1); if (N.Sprites.hasShiny(dex) && Math.random() < rate) { e.shiny = true; e.anim = new N.Sprites.Animator(dex, e.scale, true); } } catch (_) {}
    N.EnemyMgr.add(e);if(mountain()&&dex===144){e.psxK=Math.max(2.2,e.psxK||1);e._psxKOn=true;e.r=Math.max(e.r,N.Sprites.bodyRadius(144,e.scale||1)*1.35);e.__mountainLegend=true;} live.push({ e, kind, t: 0, dex, zone:mountain()?'peak':'main' });
    if (e.shiny) { try { B().audio?.sfx?.('shiny'); B().fx.burst(x, y - 30, '#fff6c0', 30, 220); } catch (_) {} }
    try { B().fx.ring(x, y, 10, 160, roam ? '#9ae6ff' : '#ffd23f', 0.7, 6); B().audio?.sfx?.('legend'); } catch (_) {}
    if (roam) { tell({ ev: 'appear', dex, shiny: !!e.shiny }); cry(dex); say('A wild ' + (e.shiny ? 'shiny ' : '') + d.name + ' has appeared!', 4); toast('A wild ' + d.name + ' appeared!', 'Defeat it before it flees to catch it', { dex, shiny: !!e.shiny, gold: true, ms: 6000 }); }
    else say('Legendary ' + d.name + ' joins the Boss Rush!', 3);
    return e;
  }
  function rushPool() { const L = Object.keys(window.PS_LEGEND_MOVES || {}).map(Number).filter(d => !GACHA_ONLY.has(d) && d !== 493 && E()?.SPRITE_META?.[d]); return L; }
  function remove(e) { try { e.dead = true; const L = E().EnemyMgr.all(), i = L.indexOf(e); if (i >= 0) L.splice(i, 1); if (coop() && host()) E().Coop.enemyGone(e, false); } catch (_) {} }
  function caught(r, fromHost) {
    if (!fromHost) tell({ ev: 'caught', dex: r.dex, shiny: !!r.e.shiny });
    const N = E(), dex = r.dex, sh = !!r.e.shiny, name = (N.DEX_BY[dex] || {}).name || 'Pokémon';
    try { if (typeof N.DB.grant === 'function') N.DB.grant(dex); else N.DB.save.owned[dex] = { at: Date.now(), from: 'roam' }; } catch (_) { try { N.DB.save.owned[dex] = { at: Date.now(), from: 'roam' }; } catch (__) {} }
    if (sh) { try { if (typeof N.DB.grantShiny === 'function') N.DB.grantShiny(dex); else N.DB.save.shiny[dex] = { at: Date.now(), from: 'roam' }; } catch (_) {} }
    try { N.DB.commit(); } catch (_) {}
    cry(dex);
    toast((sh ? 'Shiny ' : '') + name + ' joined you!', fromHost ? 'Your group caught the roaming Legendary' : 'You caught the roaming Legendary', { dex, shiny: sh, gold: true, ms: 7000 });
  }
  function tick(dt) {
    const g = B()?.game, p = g?.player;
    if (!p || g.state === 'ui' || g.state === 'over') { live.length = 0; runP = null; return; }
    if (p !== runP) { runP = p; live.length = 0; nextRoll = gap(); nextRush = CFG.rushEvery; }
    if (g.state !== 'playing' || (coop() && !host()) || (window.PS_STORY&&window.PS_STORY.on()) || (window.PS_SAFEZONE && window.PS_SAFEZONE.active)) return;   // no roamers in Story
    const t = clock(), mode = window.PS_MODES?.run?.mode;
    if (!sanctuary() && mode !== 'legend' && t >= nextRoll) { nextRoll = t + gap();
      if(mountain()){if(Math.random()<CFG.roamChance)spawnLegend(144,'roam');}else if (Math.random() < CFG.mewChance) spawnLegend(MEW, 'roam'); else if (Math.random() < CFG.roamChance) spawnLegend(ROAMERS[Math.floor(Math.random() * ROAMERS.length)], 'roam'); }
    if (!sanctuary() && mode === 'bossrush' && t >= nextRush) { nextRush = t + CFG.rushEvery; const L = rushPool(); if (L.length) spawnLegend(L[Math.floor(Math.random() * L.length)], 'rush'); }
    for (let i = live.length - 1; i >= 0; i--) { const r = live[i];if(r.zone==='peak'&&!mountain()){r.e.__fled=true;remove(r.e);live.splice(i,1);continue;}if(r.zone==='main'&&(mountain()||sanctuary()))continue;r.t += dt;
      if (r.e.dead || r.e.hp <= 0) { live.splice(i, 1); if (r.kind === 'roam' && !r.e.__fled) caught(r); continue; }
      if (r.kind === 'roam' && r.t >= CFG.flee) { r.e.__fled = true; tell({ ev: 'fled', dex: r.dex }); say(r.e.name + ' fled!', 2.5); cry(r.dex, 0.5); try { B().fx.ring(r.e.x, r.e.y, 10, 120, '#9ae6ff', 0.6, 5); } catch (_) {} remove(r.e); live.splice(i, 1); }
    }
  }
  function testBtn() {
    const t = document.getElementById('ps-sz-test'); if(!t)return;const existing=t.querySelector('[data-roam]');if(existing){existing.textContent=mountain()?'Roaming Articuno':'Roaming Legendary';return;}
    const b = document.createElement('button'); b.dataset.roam = '1'; b.textContent = 'Roaming Legendary';
    b.addEventListener('click', e => { e.stopPropagation(); spawnLegend(Math.random() < 0.5 ? MEW : ROAMERS[Math.floor(Math.random() * ROAMERS.length)], 'roam'); }); t.appendChild(b);
  }
  let last = performance.now(), ui = 0;
  function loop(now) { requestAnimationFrame(loop); const dt = Math.min(0.1, (now - last) / 1000); last = now; try { hookNet(); tick(dt); ui += dt; if (ui > 0.5) { ui = 0; testBtn(); } } catch (e) { console.warn('[roamers]', e); } }
  requestAnimationFrame(loop);
  window.PS_ROAMERS = { spawn: spawnLegend, cfg: CFG, get live() { return live.map(r => ({ dex: r.dex, kind: r.kind, t: r.t, shiny: !!r.e.shiny })); } };
})();
