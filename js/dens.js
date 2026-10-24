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
  const CFG = { first: 135, every: 180, chance: 0.25, shinyMul: 2, bandChance: 0.30, xpLevels: 2, life: 70, raidTime: 120, hpMul: 4, dmgMul: 1.3, grow: 1.4, coins: 300, coinsAgain: 450 };
  const FOOTPRINT = Object.freeze({ rx: 84, ry: 44, margin: 20, enter: 34, spacing: 240 });
  const dens = [];        // {x,y,t,life}
  let raid = null;        // {e,t,player}
  let runP = null, nextAt = CFG.first;
  const playing = () => B()?.game?.state === 'playing';
  const coop = () => !!(E()?.Coop?.active);
  const clock = () => { try { const t = E().Game.time; return Number(typeof t === 'function' ? t() : t) || 0; } catch (_) { return 0; } };
  const netHost = () => { try { const n = E().Net; return !!(typeof n.isHost === 'function' ? n.isHost() : n.isHost); } catch (_) { return false; } };
  const tell = msg => { try { if (coop() && netHost()) E().Net.broadcast(msg); } catch (_) {} };   // co-op: the host shares den news with the group
  const say = (t, d) => { try { E().Spawner.say(t, d || 3); } catch (_) {} tell({ k: 'psden', ev: 'say', t, d: d || 3 }); };
  // co-op guests: hear the host's den messages and get the Legendary too
  let denNet = false;
  const claimedClears = new WeakMap();
  function hookDenNet() {
    const n = E()?.Net; if (denNet || !n || typeof n.on !== 'function') return; denNet = true;
    n.on((uid, msg) => { try {
      if (!coop() || !msg || msg.k !== 'psden' || netHost() || String(uid) !== String(n.hostUid)) return; const N = E();
      if (msg.ev === 'say') { try { N.Spawner.say(String(msg.t || ''), Number(msg.d) || 3); } catch (_) {} return; }
      if (msg.ev === 'clear') { const dex = Number(msg.dex), sh = !!msg.shiny; if (!N.DEX_BY[dex]) return;
        const p = B()?.game?.player; if (!p) return;
        // Current hosts attach an encounter ID; old hosts remain compatible.
        if (typeof msg.id === 'string' && msg.id.length > 0 && msg.id.length <= 64) {
          let claims = claimedClears.get(p); if (!claims) claimedClears.set(p, claims = new Set());
          if (claims.has(msg.id)) return; claims.add(msg.id);
        }
        p.coins = (Number(p.coins) || 0) + 600;
        if (!denReward(dex, sh, 'Legendary Den cleared with your group · +600 PokéCoins')) { try { banner.show('Legendary Den cleared! +600 PokéCoins', N.DEX_BY[dex].name + ' got away this time (40% to catch)', true, { dex, shiny: sh, ms: 6000 }); } catch (_) {} }
        try { B().audio?.sfx?.('legend'); } catch (_) {} }
    } catch (_) {} });
  }

  // Solid stone footprint; approach any edge to activate. Resolve every native
  // player movement in small swept steps so a fast dash cannot tunnel through it.
  const STONE = Object.freeze({rx:70, ry:38});
  const ART = Object.freeze({size:150, anchorY:.72});
  function blocksDen(body, x, y, den) {
    const r=Math.max(0,Number(body.r)||0),dx=x-den.x,dy=y-den.y;
    return (dx/(STONE.rx+r))**2+(dy/(STONE.ry+r))**2<1;
  }
  function collideDens(body, from) {
    if(!body || !Number.isFinite(body.x) || !Number.isFinite(body.y))return;
    const list=[...dens,...ldens];if(!list.length)return;
    const endX=body.x,endY=body.y,start=from||{x:endX,y:endY};
    const distance=Math.hypot(endX-start.x,endY-start.y);
    // Teleports are resolved at arrival; ordinary movement and dashes are swept.
    const n=distance<=1000?Math.max(1,Math.ceil(distance/4)):1;
    let x=n===1?endX:start.x,y=n===1?endY:start.y;
    for(let i=0;i<n;i++) {
      if(n>1){x+=(endX-start.x)/n;y+=(endY-start.y)/n;}
      for(const d of list)if(blocksDen(body,x,y,d)){
        const r=Math.max(0,Number(body.r)||0),rx=STONE.rx+r,ry=STONE.ry+r;
        let dx=x-d.x,dy=y-d.y;if(Math.abs(dx)+Math.abs(dy)<.001)dy=-1;
        const norm=Math.hypot(dx/rx,dy/ry)||1;
        x=d.x+dx/norm*1.001;y=d.y+dy/norm*1.001;
      }
    }
    body.x=x;body.y=y;
  }
  function atEntrance(p,d){
    const r=Math.max(0,Number(p.r)||0),dx=p.x-d.x,dy=p.y-d.y;
    return (dx/(STONE.rx+r+12))**2+(dy/(STONE.ry+r+12))**2<=1;
  }
  // Native world depth sorting puts a Pokémon in front of the front stones
  // when its feet are closer to the camera. The beam is no longer a HUD overlay.
  let depthReady=false;
  function denVisible(){const st=B()?.game?.state;return st && st!=='ui' && st!=='over' && !window.PS_SAFEZONE?.active;}
  function worldDen(ctx,d){
    ctx.save();ctx.globalAlpha=Math.max(0,Math.min(1,(d.life-d.t)/1.5));
    drawDenArt(ctx,d.x,d.y,1,!!d.legend,performance.now()/1000,Math.min(1,d.t/.8));
    ctx.font='700 12px Pixelify, monospace';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#15131b';ctx.fillStyle=d.legend?'#ffd49a':'#ffc5de';
    const label=(d.legend?'LEGENDARY DEN':'MAX RAID DEN')+' · '+Math.ceil(d.life-d.t)+'s';
    ctx.strokeText(label,d.x,d.y-151);ctx.fillText(label,d.x,d.y-151);ctx.restore();
  }
  (function hookDenDepth(){
    const T=E()?.Training;if(typeof T?.drawables!=='function'){setTimeout(hookDenDepth,300);return;}
    const original=T.drawables;T.drawables=function(...args){const list=original.apply(this,args)||[];
      if(!denVisible())return list;
      return [...list,...[...dens,...ldens].map(d=>({y:d.y+STONE.ry,draw:ctx=>worldDen(ctx,d)}))];
    };depthReady=true;
  })();
  (function hookDenCollision(){
    const P=E()?.Player?.prototype;if(typeof P?.update!=='function'){setTimeout(hookDenCollision,300);return;}
    const update=P.update;
    P.update=function(...args){const from={x:this.x,y:this.y};const result=update.apply(this,args);collideDens(this,from);return result;};
    const W=E()?.World;
    if(typeof W?.collide==='function'){
      const collide=W.collide;W.collide=function(body,...args){const result=collide.call(this,body,...args);collideDens(body);return result;};
    }
    const EP=E()?.Enemy?.prototype;
    if(typeof EP?.update==='function'){
      const enemyUpdate=EP.update;EP.update=function(...args){const from={x:this.x,y:this.y};const result=enemyUpdate.apply(this,args);collideDens(this,from);return result;};
    }

  })();

  // a den needs open, dry, flat ground: no walls, water, trees, rocks, chests, crystals or altars under or right next to it
  function clearSpot(x, y) {
    try {
      const W = B()?.world, N = E(), R = FOOTPRINT.rx + FOOTPRINT.margin;
      if (!W || typeof W.isFree !== 'function' || typeof W.propsInCircle !== 'function') return false;
      // Check the entire clearing, not just a perimeter that can miss an interior obstacle.
      if (!W.isFree(x, y, R)) return false;
      for (let yy = -FOOTPRINT.ry - FOOTPRINT.margin; yy <= FOOTPRINT.ry + FOOTPRINT.margin; yy += 16)
        for (let xx = -R; xx <= R; xx += 16)
          if (W.isWall?.(x + xx, y + yy) || W.isLiquid?.(x + xx, y + yy)) return false;
      // Tree trunks can be clear while their canopies still cover the den. Reserve visual space too.
      for (const q of W.propsInCircle(x, y + 64, 240) || []) {
        if (!q || q.type === 'grass' || q.flat || (q.destructible && q.hp <= 0)) continue;
        const tree = /tree|pine|palm|cactus|pole/.test(String(q.type));
        const r = Math.max(12, Number(q.r) || 12), half = tree ? Math.max(64, r) : r + 12;
        const top = Number(q.y) - (tree ? 160 : r + 24), bottom = Number(q.y) + r;
        if (q.x + half >= x - R && q.x - half <= x + R && bottom >= y - FOOTPRINT.ry - FOOTPRINT.margin && top <= y + FOOTPRINT.ry + FOOTPRINT.margin) return false;
      }
      if (W.specialsNear?.(x, y, R + 32)?.length) return false;
      const C = N?.Crystal, L = C && (typeof C.all === 'function' ? C.all() : C.list);
      if (Array.isArray(L) && L.some(c => c && Math.hypot(c.x - x, c.y - y) < R + 40)) return false;
      return ![...dens, ...ldens].some(o => Math.hypot(o.x - x, o.y - y) < FOOTPRINT.spacing);
    } catch (_) { return false; } // unavailable world data must never approve an unsafe spot
  }
  function spawnDen(near) {
    const p = B()?.game?.player; if (!p || coop() || dens.length || ldens.length || raid || lden || window.PS_SAFEZONE?.occupied) return null; let x = p.x, y = p.y;
    let found = false;
    for (let i = 0; i < 160 && !found; i++) { const a = Math.random() * TAU, d = (near ? 170 : 300 + Math.random() * 160) + Math.floor(i / 40) * 120, nx = p.x + Math.cos(a) * d, ny = p.y + Math.sin(a) * d * 0.8;
      if (clearSpot(Math.round(nx), Math.round(ny))) { x = Math.round(nx); y = Math.round(ny); found = true; } }
    if (!found) return null; // never put a den under the player when every candidate is blocked
    const d = { x, y, t: 0, life: CFG.life }; dens.push(d);
    say('A Pokémon Den is overflowing with Dynamax energy!', 3);
    try { B().fx.ring(x, y, 10, 120, '#ff2a55', 0.7, 6); B().audio?.sfx?.('legend'); } catch (_) {}
    return d;
  }
  function raidPool() {   // a strong Pokémon from the boss list, a bit ahead of the current time
    const L = (E()?.Enemies?.BOSSES || []).filter(b => b && b.dex && !b.arceus && b.dex !== 493); if (!L.length) return null;
    const t = clock(); let c = L.filter(b => b.at >= t - 60 && b.at <= t + 420); if (!c.length) c = L.slice(0, 6);
    return c[Math.floor(Math.random() * c.length)];
  }
  // [Gard] den rewards: a defeated den Pokemon has a 40% chance to join you (its first form if it evolves; Legendaries
  // stay themselves). The Legendary Den game mode unlocks once you've entered a den in a normal Original run.
  const DEN_GET = 0.40;
  function denReward(dex, shiny, title) {
    const N = E(); if (!N || !N.DEX_BY[dex] || Math.random() >= DEN_GET) return false;
    const get = window.PS_PARTNER ? window.PS_PARTNER.base(dex) : dex; if (!N.DEX_BY[get]) return false;
    try { N.DB.grant(get, 'den'); if (shiny) N.DB.grantShiny(get, 'den'); N.DB.commit(); } catch (_) {}
    try { banner.show((shiny ? 'Shiny ' : '') + N.DEX_BY[get].name + ' joined you!', title || 'From the den', true, { dex: get, shiny: !!shiny, ms: 6000 }); } catch (_) {}
    return true;
  }
  function metDen() { try { const S = E().DB.save; if (S && !S.psDenMet) { S.psDenMet = true; E().DB.commit(); try { window.PS_TOAST && window.PS_TOAST('Legendary Den mode unlocked!', 'Pick it from the Mode button on the Play panel', { gold: true, ms: 5000 }); } catch (_) {} } } catch (_) {} }
  window.PS_DEN_MET = () => { try { return !!E().DB.save.psDenMet; } catch (_) { return false; } };
  function startRaid(den) {
    const p = B()?.game?.player, N = E(); if (!p || !N || raid) return;
    if (!(window.PS_STORY && window.PS_STORY.on())) metDen();
    const def0 = raidPool(); if (!def0) return;
    const def = Object.assign({}, def0, { name: (def0.name || '') });
    const sc = (N.Enemies.scale ? N.Enemies.scale(clock()) : { hp: 1, dmg: 1, spd: 1 });
    const mul = { hp: (sc.hp || 1) * CFG.hpMul, dmg: (sc.dmg || 1) * CFG.dmgMul, spd: Math.min(1.15, sc.spd || 1) };
    let e = null;
    try { e = new N.Enemy(def, den.x, den.y, mul, true); } catch (err) { console.warn('[dens] could not create raid boss', err); return; }
    e.__maxRaid = true; e.legend = true;
    try { const rate = Number(N.Spawner.SHINY_RATE) || 1 / 4096; if (N.Sprites.hasShiny(e.dex) && Math.random() < rate * CFG.shinyMul) { e.shiny = true; try { B().audio?.sfx?.('shiny'); } catch (_) {} e.anim = new N.Sprites.Animator(e.dex, e.scale, true); } } catch (_) {}
    try { e.anim.scale = (Number(e.anim.scale) || e.scale || 1) * CFG.grow; e.scale = (Number(e.scale) || 1) * CFG.grow; e.r = (Number(e.r) || 14) * 1.5; e.bodyH = (Number(e.bodyH) || 40) * CFG.grow; } catch (_) {}
    N.EnemyMgr.add(e);
    raid = { e, t: CFG.raidTime, player: p, name: e.name || def.name || 'Pokémon' };
    say('MAX RAID! A Dynamax ' + raid.name + ' appeared!', 3.2);
    try { B().fx.ring(den.x, den.y, 10, 300, '#ff2a55', 0.8, 8); B().fx.burst(den.x, den.y - 30, '#ff6b8a', 40, 320); B().camera?.kick?.(0.6); } catch (_) {}
    try { window.PS_MUSIC && window.PS_MUSIC.event && window.PS_MUSIC.event('trainer'); } catch (_) {}
  }
  function endRaid(won) {
    const r = raid; raid = null; if (!r) return; const p = B()?.game?.player;
    if (won && p && p === r.player) {
      const had = !!p.__dynBand, got = !had && Math.random() < CFG.bandChance; if (got) p.__dynBand = true;   // the Dynamax Band is a 30% drop
      const coins = had ? CFG.coinsAgain : CFG.coins; p.coins = (Number(p.coins) || 0) + coins;
      dropXp(r.e.x, r.e.y);
      if (had) { try { window.PS_QUALITY && window.PS_QUALITY.dynRecharge && window.PS_QUALITY.dynRecharge(); } catch (_) {} }
      const sh = r.e.shiny ? ' (shiny!)' : '';
      setTimeout(() => denReward(r.e.dex, !!r.e.shiny, 'Caught after the Max Raid (40%)'), 1500);
      say(had ? 'Raid cleared' + sh + '! Dynamax recharged · +' + coins + ' PokéCoins' : got ? 'Raid cleared' + sh + '! The Dynamax Band dropped — press G!' : 'Raid cleared' + sh + '! +' + coins + ' PokéCoins · no Dynamax Band this time', 4);
      banner.show(had ? 'Dynamax recharged!' : got ? 'Dynamax Band obtained!' : 'Max Raid cleared!', had ? '+' + coins + ' PokéCoins · bonus EXP' : got ? 'Press G (or the red button) to Dynamax · +' + coins + ' PokéCoins' : '+' + coins + ' PokéCoins · bonus EXP · the Band drops 30% of the time', got || had);
      try { B().fx.ring(p.x, p.y, 10, 260, '#ff2a55', 0.8, 8); B().fx.burst(p.x, p.y - 20, '#ffd0dc', 40, 300); B().audio?.sfx?.('levelup'); } catch (_) {}
    } else if (!won) {
      try { if (!r.e.dead) { r.e.dead = true; r.e.fade = 1; const L = E().EnemyMgr.all(), i = L.indexOf(r.e); if (i >= 0) L.splice(i, 1); } } catch (_) {}
      say('The Dynamax ' + r.name + ' escaped back into the den…', 3);
    }
  }
  function dropXp(x, y) {   // a good pile of EXP orbs (about CFG.xpLevels levels' worth)
    try { const N = E(), p = B().game.player; let need = Number(p.xpNext) || 0; if (!need) { const lx = N.Game.levelXp; need = Number(typeof lx === 'function' ? lx(p.level) : lx) || 60; }
      const total = Math.max(40, need * CFG.xpLevels), n = 8; for (let i = 0; i < n; i++) { const a = i / n * TAU; N.Pickups.dropXp(x + Math.cos(a) * 30, y + Math.sin(a) * 20, total / n); } } catch (e) { console.warn('[dens] xp', e); }
  }

  // ================= LEGENDARY DENS =================
  // Battle version: rarely (2.5% each 3-minute check) a golden den appears; walk in to face 4 Dynamax bosses (common..epic)
  // and then a Dynamax Legendary. Shiny chance 1/25 each (Shiny Charm triples it). Beat the Legendary and it joins your collection.
  // Game-mode version (PS_MODES 'legend'): you start right inside the den. Shiny 1/150 (bosses) and 1/500 (Legendary).
  // Boss 1 is easy and lifts you to level 20, the next ones +10 levels each (level 40 at the Legendary). Bosses always drop the Dynamax Band.
  const GACHA_ONLY = { 801: 3, 648: 3, 490: 1, 489: 1 };   // Magearna, Meloetta (x3 weight), Manaphy, Phione (rarer)
  const LCFG = { chance: 0.025, stages: 5, battleShiny: 1 / 25, modeBossShiny: 1 / 150, modeLegendShiny: 1 / 500, levels: [20, 30, 40, 40] };
  const EXTRA_LEGENDS = [720, 1001, 1002, 1003, 1004, 1014, 1015, 1016, 1017, 1025];   // Hoopa (own file), Treasures of Ruin, Loyal Three, Ogerpon, Pecharunt
  function legendSet() { return [...Object.keys(window.PS_LEGEND_MOVES || {}).map(Number), ...EXTRA_LEGENDS]; }
  window.PS_LEGEND_DEX = () => new Set(legendSet());
  function legendPool() { const N = E(), L = new Set(legendSet()); return (N?.DEX || []).filter(d => L.has(d.dex) && !GACHA_ONLY[d.dex] && N.SPRITE_META[d.dex] && d.dex !== 493); }
  function bossPool() { const N = E(), L = new Set(legendSet()); return (N?.DEX || []).filter(d => d.rarity >= 1 && d.rarity <= 4 && !L.has(d.dex) && N.SPRITE_META[d.dex]); }
  // gacha: Legendaries are earned in dens now, except the gacha-only ones (Magearna & Meloetta common, Manaphy & Phione rarer)
  window.PS_GACHA_POOL = function (list, rarity) {
    if (rarity !== 5) return list; const L = new Set(legendSet()), out = [];
    for (const d of list) { if (!L.has(d.dex)) out.push(d); else if (GACHA_ONLY[d.dex]) for (let i = 0; i < GACHA_ONLY[d.dex]; i++) out.push(d); }
    return out;   // empty is fine: the pull falls back to the nearest rarity
  };
  let lden = null;   // {kind, stage, list, e, wait, legend}
  const ldens = [];  // golden dens on the map
  const shinyMul = p => (p && p.item === 'shinycharm') ? 3 : 1;
  function partyPower() {   // the solo player, or everyone in a co-op group
    const N = E(); let L = []; try { const ev = N.Game.everyone; L = (typeof ev === 'function' ? ev() : ev) || []; } catch (_) {} if (!Array.isArray(L) || !L.length) L = [B()?.game?.player].filter(Boolean);
    let lv = 0, hp = 0, atk = 0; for (const q of L) { lv += Number(q.level) || 1; hp += Number(q.maxHp) || 100; let a = 1; try { a = typeof q.atk === 'function' ? Number(q.atk()) || 1 : Number(q.atk) || 1; } catch (_) {} atk += Math.max(0.5, Math.min(20, a)); }
    const n = L.length || 1; return { n, lv: lv / n, hp: hp / n, atk: atk / n, party: 1 + (n - 1) * 0.85 };
  }
  function makeBoss(p, dex, x, y, stage, legend) {
    const N = E(), T = N.Enemies.BOSSES[Math.floor(Math.random() * Math.min(8, N.Enemies.BOSSES.length))] || {}, d = N.DEX_BY[dex] || {};
    const mode = lden.kind === 'mode', easy = mode && stage === 0, pw = partyPower(), lv = pw.lv;
    // strength follows your (and your party's) level, attack and HP, so it keeps up as you get stronger
    const hp = easy ? 450 : Math.round((420 + 170 * lv + 0.8 * pw.hp) * Math.pow(pw.atk, 0.85) * pw.party * (legend ? 3 : 1 + stage * 0.2));
    const dmg = easy ? 5 : Math.round((8 + 1.4 * lv + 0.03 * pw.hp) * (legend ? 1.35 : 1) * (1 + (pw.n - 1) * 0.15));
    const def = { dex, name: d.name || 'Pokémon', hp, spd: Math.min(110, Number(T.spd) || 80), dmg, xp: Math.round(40 + lv * 6), behavior: T.behavior || 'charger', shotDmg: Math.round(dmg * 0.55), shotCd: T.shotCd || 1.2, range: T.range || 240 };
    const e = new N.Enemy(def, x, y, { hp: 1, dmg: 1, spd: 1 }, true);
    e.__maxRaid = true; e.__legendDen = true; if (legend) e.legend = true;
    try { e.anim.scale = (Number(e.anim.scale) || 1) * 1.4; e.scale = (Number(e.scale) || 1) * 1.4; e.r = (Number(e.r) || 14) * 1.3; e.bodyH = (Number(e.bodyH) || 40) * 1.4; } catch (_) {}
    const rate = mode ? (legend ? LCFG.modeLegendShiny : LCFG.modeBossShiny) : LCFG.battleShiny;
    try { if (N.Sprites.hasShiny(dex) && Math.random() < rate * shinyMul(p)) { e.shiny = true; try { B().audio?.sfx?.('shiny'); } catch (_) {} e.anim = new N.Sprites.Animator(dex, e.scale, true); } } catch (_) {}
    N.EnemyMgr.add(e); return e;
  }
  function startLegendDen(kind) {
    const p = B()?.game?.player, N = E(); if (!p || !N || lden || raid || window.PS_SAFEZONE?.occupied) return false;
    // A den started from a mode button may begin before the first regular update.
    // Mark this player as the current run so the next tick does not erase the challenge.
    if (p !== runP) { runP = p; nextAt = CFG.first; dens.length = 0; ldens.length = 0; raid = null; }
    const bp = bossPool(), lp = legendPool(); if (!bp.length || !lp.length) { console.warn('[dens] Legendary den has no boss candidates:',{bosses:bp.length,legendaries:lp.length}); say('Legendary Den unavailable: roster not loaded. Try again.',3); return false; }
    const list = []; for (let i = 0; i < 4; i++) list.push(bp[Math.floor(Math.random() * bp.length)].dex); list.push(lp[Math.floor(Math.random() * lp.length)].dex);
    lden = { kind, stage: 0, list, e: null, wait: 1.5, id: Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10) };
    if (kind === 'battle' && !(window.PS_STORY && window.PS_STORY.on())) metDen();
    say('LEGENDARY DEN! Defeat 4 Dynamax Pokémon to reach the Legendary!', 3.5);
    try { window.PS_MUSIC && window.PS_MUSIC.event && window.PS_MUSIC.event('trainer'); } catch (_) {}
    return true;
  }
  function grantLevels(p, target, x, y) {   // drop EXP orbs worth exactly enough to reach the target level, so the normal level-up cards show
    if ((Number(p.level) || 1) >= target) return; const sim = { xp: Number(p.xp) || 0, xpNext: Number(p.xpNext) || 0, level: Number(p.level) || 1, xpK: 1, levelHp() {} };
    let total = 0, n = 0; while (sim.level < target && n++ < 200) { const need = Math.max(1, sim.xpNext - sim.xp) + 0.01; total += need; p.gainXp.call(sim, need); }
    const amt = total / (Number(p.xpK) || 1), k = 16; try { for (let i = 0; i < k; i++) { const a = i / k * TAU; E().Pickups.dropXp(x + Math.cos(a) * 40, y + Math.sin(a) * 26, amt / k); } } catch (e) { console.warn('[dens] xp', e); }
  }
  function legendTick(dt) {
    const p = B()?.game?.player; if (!lden || !p) return;
    if (!lden.e) {
      lden.wait -= dt;
      if (lden.wait > 0) return;
      if (lden.needLv && (Number(p.level) || 1) < lden.needLv && lden.wait > -20) return; // allow EXP pickups/rewards
      const legend = lden.stage === 4, a = Math.random() * TAU;
      lden.e = makeBoss(p, lden.list[lden.stage], p.x + Math.cos(a) * 220, p.y + Math.sin(a) * 160, lden.stage, legend);
      say((legend ? 'The LEGENDARY ' : 'Dynamax ') + lden.e.name + (lden.e.shiny ? ' (shiny!)' : '') + ' appeared! · ' + (lden.stage + 1) + '/5', 3); return; }
    if (!(lden.e.dead || lden.e.hp <= 0)) return;
    const e = lden.e, st = lden.stage; lden.e = null; lden.wait = 2.5; lden.stage++;
    if (!p.__dynBand) { p.__dynBand = true; banner.show('Dynamax Band obtained!', 'Press G (or the red button) to Dynamax', true); }
    if (lden.kind === 'mode' && st < 4) { grantLevels(p, LCFG.levels[st], e.x, e.y); lden.needLv = LCFG.levels[st]; }
    else if (st < 4) dropXp(e.x, e.y);
    p.coins = (Number(p.coins) || 0) + (st === 4 ? 600 : 120);
    if (st < 4) setTimeout(() => denReward(e.dex, !!e.shiny, 'Caught after the Dynamax battle (40%)'), 1200);
    if (st === 4) {   // the Legendary joins you
      const dex = e.dex, sh = !!e.shiny;
      if (!denReward(dex, sh, 'Legendary Den cleared · +600 PokéCoins')) banner.show('Legendary Den cleared! +600 PokéCoins', e.name + ' got away this time (40% to catch)', true, { dex, shiny: sh, ms: 6000 });
      tell({ k: 'psden', ev: 'clear', dex, shiny: sh, id: lden.id });
      try { B().audio?.sfx?.('legend'); } catch (_) {}
      const kind = lden.kind; lden = null;
      if (kind === 'mode') setTimeout(() => { try { if (B()?.game?.player === p && B()?.game?.state !== 'over') E().Game.winRun(0); } catch (_) {} }, 3500);
    }
  }
  function spawnLegendDen() { const d = spawnDen(true); if (!d) return null; const idx = dens.indexOf(d); if (idx >= 0) dens.splice(idx, 1); d.legend = true; d.life = 90; ldens.push(d); say('A LEGENDARY DEN appeared! Follow the orange beacon!', 3.5); return d; }
  // Dynamax vs Dynamax: while you're Dynamaxed you deal 1.5x damage to Dynamax Pokémon
  let dmgWrapped = false;
  function wrapDyn() { const H = window.PS_HOOKS; if (!H || dmgWrapped) return; dmgWrapped = true; const deal = H.deal;
    H.deal = function (...a) { const m = deal ? deal.apply(this, a) : 1; try { if (window.PS_QUALITY?.dyn?.active && a.some(x => x && typeof x === 'object' && x.__maxRaid)) return m * 1.5; } catch (_) {} return m; }; }
  function tick(dt) {
    const g = B()?.game, p = g?.player;
    if (!p || g.state === 'over') { dens.length = 0; ldens.length = 0; lden = null; raid = null; runP = null; return; }
    // A reward card or pause screen must not delete an in-progress raid.
    if (g.state === 'ui' || g.state === 'levelup' || g.state === 'choice') return;
    if (p !== runP) { runP = p; nextAt = CFG.first; dens.length = 0; ldens.length = 0; raid = null; lden = null; }
    wrapDyn(); hookDenNet(); if (g.state === 'playing' && (!coop() || netHost())) legendTick(dt);   // co-op: only the host runs the den
    for (let i = ldens.length - 1; i >= 0; i--) { const d = ldens[i]; d.t += dt; if (d.t >= d.life) { ldens.splice(i, 1); continue; } if (!lden && playing() && d.t > 0.8 && atEntrance(p,d)) { if (startLegendDen('battle')) ldens.splice(i, 1); else { d.t = Math.min(d.t, d.life - 10); } } }
    if (!playing() || coop() || (window.PS_STORY&&window.PS_STORY.on()) || (window.PS_SAFEZONE && window.PS_SAFEZONE.active)) return;   // no dens in Story
    // Natural encounters are scheduled together by rare-encounters.js.
    for (let i = dens.length - 1; i >= 0; i--) { const d = dens[i]; d.t += dt; if (d.t >= d.life) { dens.splice(i, 1); continue; }
      if (!raid && d.t > 0.8 && atEntrance(p,d)) { dens.splice(i, 1); startRaid(d); } }
    if (raid) { raid.t -= dt; if (raid.e.dead || raid.e.hp <= 0) endRaid(true); else if (raid.t <= 0 || p.dead) endRaid(false); }
  }

  // Pixel-art den supplied by the map artist. The *entire* stone ring and beam are
  // one image. Never scale the stone base separately or regenerate its pixels.
  // The den art (assets/dens): full picture + a "beam" layer (just the glowing parts) used for the animation.
  // Max Raid Dens are pink, Legendary Dens orange. The rocks never move; only the light does.
  const DEN = {}; for (const c of ['pink', 'orange']) { DEN[c] = new Image(); DEN[c].src = 'assets/dens/den-' + c + '.png?v=1'; DEN['b' + c] = new Image(); DEN['b' + c].src = 'assets/dens/den-beam-' + c + '.png?v=1'; }
  // The art's beam is cut off at the top of the picture, so the den is painted on a scratch canvas, the top of the
  // pillar is faded out, and a swirling, tapering tip is drawn above it instead.
  const dc = document.createElement('canvas');
  function drawDenArt(ctx, X, Y, k, legendary, t, opening) {
    const w = ART.size * k, h = ART.size * k, pad = Math.ceil(h * 0.55), dpr = ctx.getTransform().a || 1, W = Math.ceil(w * dpr), H = Math.ceil((h + pad) * dpr);
    if (dc.width < W || dc.height < H) { dc.width = Math.max(dc.width, W); dc.height = Math.max(dc.height, H); }
    const c = dc.getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, dc.width, dc.height); c.setTransform(dpr, 0, 0, dpr, 0, 0);
    const lx = w / 2, ly = pad + h * ART.anchorY;   // den position on the scratch canvas
    paintDen(c, lx, ly, k, legendary, t, opening);
    // fade the top of the pillar so it never looks cropped
    c.globalCompositeOperation = 'destination-out';
    const top = pad + h * 0.02, fadeTo = pad + h * 0.30, g = c.createLinearGradient(0, top, 0, fadeTo); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(0, 0, w, fadeTo);
    c.globalCompositeOperation = 'lighter';
    // swirling tip: two glowing strands wind around the pillar and narrow to a point
    const col = legendary ? [255, 120, 30] : [255, 80, 180], hi = legendary ? [255, 214, 140] : [255, 200, 240];
    const baseY = pad + h * 0.32, tipY = pad * 0.08, bw = w * 0.13;
    for (let s = 0; s < 2; s++) {
      c.beginPath();
      for (let i = 0; i <= 40; i++) { const u = i / 40, y = baseY - (baseY - tipY) * u, r = bw * (1 - u) ** 1.3, x = lx + Math.sin(u * 9 + t * 4 + s * Math.PI) * r; i ? c.lineTo(x, y) : c.moveTo(x, y); }
      const sg = c.createLinearGradient(0, baseY, 0, tipY); sg.addColorStop(0, 'rgba(' + hi + ',' + 0.85 * opening + ')'); sg.addColorStop(1, 'rgba(' + hi + ',0)');
      c.strokeStyle = sg; c.lineWidth = Math.max(1.5, 3 * k); c.lineCap = 'round'; c.stroke();
    }
    // soft tapering glow cone up the middle
    const cg = c.createLinearGradient(0, baseY + h * 0.08, 0, tipY); cg.addColorStop(0, 'rgba(' + col + ',' + (0.55 * opening) + ')'); cg.addColorStop(1, 'rgba(' + col + ',0)');
    c.fillStyle = cg; c.beginPath(); c.moveTo(lx - bw * 1.25, baseY + h * 0.08); c.quadraticCurveTo(lx - bw * 0.3, baseY - (baseY - tipY) * 0.5, lx, tipY); c.quadraticCurveTo(lx + bw * 0.3, baseY - (baseY - tipY) * 0.5, lx + bw * 1.25, baseY + h * 0.08); c.closePath(); c.fill();
    // a few sparks spiralling up out of the tip
    for (let i = 0; i < 6; i++) { const f = (t * 0.45 + i / 6) % 1, y = baseY - (baseY - tipY) * f, r = bw * 1.1 * (1 - f), x = lx + Math.cos(f * 12 + i + t * 3) * r;
      c.globalAlpha = opening * (1 - f); c.fillStyle = 'rgb(' + hi + ')'; c.fillRect(Math.round(x), Math.round(y), Math.max(1.5, 2 * k), Math.max(1.5, 2 * k)); }
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    ctx.drawImage(dc, 0, 0, W, H, X - lx, Y - ly, w, h + pad);
  }
  function paintDen(ctx, X, Y, k, legendary, t, opening) {
    const c = legendary ? 'orange' : 'pink', img = DEN[c], beam = DEN['b' + c], w = ART.size * k, h = ART.size * k, dx = X - w / 2, dy = Y - h * ART.anchorY;
    if (!img.complete || !img.naturalWidth) { ctx.save(); ctx.fillStyle = '#523843'; ctx.beginPath(); ctx.ellipse(X, Y, 48 * k, 21 * k, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = legendary ? '#ff9a2e' : '#ee449c'; ctx.lineWidth = 7 * k; ctx.stroke(); ctx.restore(); return; }
    const col = legendary ? [255, 110, 20] : [255, 70, 170], LK = legendary ? 0.55 : 1;   // additive light turns orange into yellow fast, so it's gentler
    ctx.save(); ctx.imageSmoothingEnabled = false; ctx.globalAlpha = opening;
    // contact shadow so the stones sit on the ground
    { const sg = ctx.createRadialGradient(X, Y + h * 0.06, 2, X, Y + h * 0.06, w * 0.5); sg.addColorStop(0, 'rgba(0,0,0,.45)'); sg.addColorStop(0.7, 'rgba(0,0,0,.25)'); sg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = sg; ctx.beginPath(); ctx.ellipse(X, Y + h * 0.06, w * 0.5, h * 0.15, 0, 0, TAU); ctx.fill(); }
    const pu = 0.5 + 0.5 * Math.sin(t * 3.1);
    // the den itself; the beam grows out of it while the den opens
    ctx.drawImage(img, dx, dy, w, h);
    if (beam.complete && beam.naturalWidth) {
      ctx.globalCompositeOperation = 'lighter';
      // 1) the whole glow pulses
      ctx.globalAlpha = opening * (0.18 + 0.32 * pu) * LK; ctx.drawImage(beam, dx, dy, w, h);
      // 2) energy flowing up the pillar: the beam texture scrolls upward inside the pillar, with a slight width wobble
      ctx.save(); ctx.beginPath(); ctx.rect(dx + w * 0.33, dy - 2, w * 0.34, h * 0.66); ctx.clip();
      const sh = (t * 0.55 % 1) * h * 0.66, wob = 1 + 0.05 * Math.sin(t * 7.3), bw = w * wob, bx = X - bw / 2;
      ctx.globalAlpha = opening * 0.55 * LK;
      ctx.drawImage(beam, bx, dy - sh, bw, h); ctx.drawImage(beam, bx, dy - sh + h * 0.66, bw, h);
      // bright core flicker
      ctx.globalAlpha = opening * (0.10 + 0.12 * Math.sin(t * 13.7) ** 2) * LK;
      ctx.fillStyle = 'rgb(' + col + ')'; ctx.fillRect(X - w * 0.07, dy, w * 0.14, h * 0.64);
      ctx.restore();
      // 3) light rings sliding up the pillar
      for (let i = 0; i < 3; i++) { const f = (t * 0.7 + i / 3) % 1, yy = Y - h * 0.08 - f * h * 0.58;
        ctx.globalAlpha = opening * (1 - f) * 0.55; ctx.strokeStyle = 'rgb(' + col + ')'; ctx.lineWidth = Math.max(1.5, 2.2 * k);
        ctx.beginPath(); ctx.ellipse(X, yy, w * (0.12 + 0.04 * (1 - f)), w * 0.035, 0, 0, TAU); ctx.stroke(); }
      ctx.globalCompositeOperation = 'source-over';
    }
    // pixel sparks drifting up
    for (let i = 0; i < 12; i++) {
      const f = (t * (0.22 + i * 0.013) + i * 0.157) % 1, xx = X + Math.sin(i * 2.7 + t * 0.9) * w * (0.08 + 0.02 * (i % 5)), yy = Y - h * 0.08 - f * h * 0.66;
      ctx.globalAlpha = opening * (1 - f) * 0.9; ctx.fillStyle = i % 3 ? (legendary ? '#ffd27a' : '#ff9cdf') : '#ffffff';
      const sz = Math.max(1.5, k * (i % 4 === 0 ? 2.8 : 1.9)); ctx.fillRect(Math.round(xx), Math.round(yy), sz, sz);
    }
    ctx.restore();
  }

  // ---------------- drawing (overlay canvas, world -> screen with the game camera) ----------------
  const ov = document.createElement('canvas'); ov.id = 'ps-dens'; ov.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;pointer-events:none;z-index:18';
  function gameCanvas() { let best = null, area = 0; for (const c of document.querySelectorAll('canvas')) { if (c.id && c.id.startsWith('ps-')) continue; const r = c.getBoundingClientRect(), a = r.width * r.height; if (a > area) { area = a; best = { c, r }; } } return best; }
  // off-screen arrow in the same style as the game's Arceus / Meowth / Gholdengo pointers
  function edgeArrow(ctx, X, Y, W, H, col, text) {
    const m = 46, top = 116, bot = H - 126; if (X > m && X < W - m && Y > top && Y < bot) return;
    const cx = W / 2, cy = (top + bot) / 2, dx = X - cx, dy = Y - cy; const t = Math.min(Math.abs(dx) > 1e-3 ? (W / 2 - m) / Math.abs(dx) : 1e9, Math.abs(dy) > 1e-3 ? ((bot - top) / 2) / Math.abs(dy) : 1e9);
    const ax = cx + dx * t, ay = cy + dy * t, a = Math.atan2(dy, dx), pu = 0.5 + 0.5 * Math.sin(performance.now() / 120);
    ctx.save(); ctx.translate(ax, ay); ctx.globalAlpha = 0.2 + 0.25 * pu; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(0, 0, 26 + 6 * pu, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1; ctx.fillStyle = pu > 0.5 ? '#fff3c8' : col; ctx.beginPath(); ctx.moveTo(34 * Math.cos(a), 34 * Math.sin(a)); ctx.lineTo(17 * Math.cos(a + 2.45), 17 * Math.sin(a + 2.45)); ctx.lineTo(17 * Math.cos(a - 2.45), 17 * Math.sin(a - 2.45)); ctx.closePath(); ctx.fill();
    ctx.font = '700 15px Pixelify, "Segoe UI", system-ui, sans-serif'; ctx.textAlign = Math.cos(a) > 0.3 ? 'right' : Math.cos(a) < -0.3 ? 'left' : 'center';
    ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.85)'; ctx.lineJoin = 'round'; const tx = 30 * -Math.cos(a), ty = 26 * -Math.sin(a) + 4; ctx.strokeText(text, tx, ty); ctx.fillStyle = col; ctx.fillText(text, tx, ty); ctx.restore();
  }
  function draw() {
    const ctx = ov.getContext('2d'), dpr = Math.min(2, devicePixelRatio || 1), W = innerWidth, H = innerHeight;
    if (ov.width !== Math.round(W * dpr) || ov.height !== Math.round(H * dpr)) { ov.width = Math.round(W * dpr); ov.height = Math.round(H * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); if (ov.__dirty) { ctx.clearRect(0, 0, W, H); ov.__dirty = false; }
    const st = B()?.game?.state; if ((!dens.length && !ldens.length && !raid && !lden) || st === 'ui' || st === 'over' || (window.PS_SAFEZONE && window.PS_SAFEZONE.active)) { if (ov.style.display !== 'none') ov.style.display = 'none'; return; } ov.__dirty = true; if (ov.style.display === 'none') ov.style.display = 'block';
    const cam = B()?.camera, g = gameCanvas(); if (!cam || !g || typeof cam.left !== 'function') return;
    const css = Number(cam._cw) > 0 ? g.r.width / cam._cw : 1, k = cam.scale * css, now = performance.now() / 1000;
    // Match Camera.apply's shake and physical-pixel rounding exactly.
    const pixel = cam.scale * (Number(cam.dpr) || dpr);
    const tx = Math.round((-cam.left() + (Number(cam._sx) || 0)) * pixel) / pixel;
    const ty = Math.round((-cam.top() + (Number(cam._sy) || 0)) * pixel) / pixel;
    const sx = x => g.r.left + (x + tx) * k, sy = y => g.r.top + (y + ty) * k;
    for (const d of [...dens, ...ldens]) {
      const X = sx(d.x), Y = sy(d.y), open = Math.min(1, d.t / 0.8), fade = Math.max(0, Math.min(1, (d.life - d.t) / 1.5));
      const legend = !!d.legend;
      ctx.save(); ctx.globalAlpha = fade;
      // Fallback for engines without Training.drawables. Normal Gard rendering
      // draws the complete den in the native world list, below foreground actors.
      if(!depthReady)drawDenArt(ctx,X,Y,k,legend,now,open);
      ctx.restore();
      const p = B()?.game?.player; if (p) edgeArrow(ctx, X, Y - 20 * k, W, H, d.legend ? '#ff9a2e' : '#ff4d7a', (d.legend ? 'LEGENDARY DEN · ' : 'MAX RAID DEN · ') + Math.round(Math.hypot(d.x - p.x, d.y - p.y) / 32) + ' m');
    }
    ctx.filter = 'none';
    if (lden && lden.e && !lden.e.dead) { const p = B()?.game?.player; if (p) edgeArrow(ctx, sx(lden.e.x), sy(lden.e.y) - 30 * k, W, H, '#ffd23f', String(lden.e.name).toUpperCase() + ' · ' + Math.round(Math.hypot(lden.e.x - p.x, lden.e.y - p.y) / 32) + ' m'); }
    if (raid && !raid.e.dead) { const p = B()?.game?.player; if (p) edgeArrow(ctx, sx(raid.e.x), sy(raid.e.y) - 30 * k, W, H, '#ff4d7a', 'DYNAMAX ' + String(raid.name).toUpperCase() + ' · ' + Math.round(Math.hypot(raid.e.x - p.x, raid.e.y - p.y) / 32) + ' m'); }
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
  #ps-raid{position:fixed;left:12px;top:100px;z-index:24;display:none;padding:4px 12px !important;pointer-events:none;font-size:15px;animation:none !important;overflow:visible !important;white-space:nowrap}
  #ps-raid .rb{color:#ff8aa6}#ps-raid .tm{color:var(--gold)}
  #ps-raid .bar{display:none;height:12px;margin-top:6px;border-radius:4px;background:#0b1838;box-shadow:0 0 0 2px var(--edge-in);overflow:hidden}#ps-raid .bar i{display:block;height:100%;background:linear-gradient(180deg,#ff8aa6,#e0335a)}
  #ps-dyn-get{position:fixed;inset:0;z-index:80;display:none;align-items:center;justify-content:center;pointer-events:none}
  #ps-dyn-get .box{text-align:center;min-width:min(460px,90vw)}#ps-dyn-get h2{color:#ff8aa6}#ps-dyn-get.ok h2{color:var(--gold)}#ps-dyn-get .sub{margin:0}`;
  const hud = document.createElement('div'); hud.id = 'ps-raid'; hud.className = 'box';
  const bannerEl = document.createElement('div'); bannerEl.id = 'ps-dyn-get';
  const banner = { show(t, s, ok, opt) { if (window.PS_TOAST) { window.PS_TOAST(t, s, Object.assign({ gold: !!ok, icon: 'u_atk' }, opt || {})); return; } bannerEl.innerHTML = '<div class="box"><h2>' + t + '</h2><p class="sub">' + s + '</p></div>'; bannerEl.classList.toggle('ok', !!ok); bannerEl.style.display = 'flex'; clearTimeout(banner.h); banner.h = setTimeout(() => { bannerEl.style.display = 'none'; }, 3600); } };
  function renderHud() {
    if (lden && lden.e && !lden.e.dead && playing()) { const e = lden.e, f = Math.max(0, Math.min(1, e.hp / (e.maxHp || 1)));
      hud.innerHTML = '<span class="tm">Legendary Den ' + (lden.stage + 1) + '/5</span> · ' + e.name + (e.shiny ? ' ✦' : ''); hud.style.display = 'block'; return; }
    if (!raid || raid.e.dead || !playing()) { hud.style.display = 'none'; return; }
    const e = raid.e, f = Math.max(0, Math.min(1, e.hp / (e.maxHp || 1)));
    hud.innerHTML = '<span class="rb">MAX RAID</span> · Dynamax ' + raid.name + (raid.e.shiny ? ' ✦' : '') + ' <span class="tm">· ' + Math.max(0, Math.ceil(raid.t)) + 's</span><div class="bar"><i style="width:' + (f * 100).toFixed(1) + '%"></i></div>';
    hud.style.display = 'block';
  }
  // test button for LoverGare (inside the Safe Zone test panel)
  function testBtn() {
    const t = document.getElementById('ps-sz-test'); if (!t || t.querySelector('[data-den]')) return;
    const b2 = document.createElement('button'); b2.dataset.lden = '1'; b2.textContent = 'Legendary Den'; b2.addEventListener('click', e => { e.stopPropagation(); spawnLegendDen(); }); t.appendChild(b2);
    const b = document.createElement('button'); b.dataset.den = '1'; b.textContent = 'Dynamax Den'; b.addEventListener('click', e => { e.stopPropagation(); spawnDen(true); }); t.appendChild(b);
  }

  let last = performance.now(), hudT = 0;
  function loop(now) {
    requestAnimationFrame(loop); const dt = Math.min(0.1, (now - last) / 1000); last = now;
    try { tick(dt); if (!window.PS_HUD_LAYERS?.active) draw(); hudT += dt; if (hudT > 0.2) { hudT = 0; renderHud(); testBtn(); } } catch (e) { console.warn('[dens]', e); }
  }
  function init() { document.head.append(css); document.body.append(ov, hud, bannerEl); window.PS_HUD_LAYERS?.register('ps-dens', draw); requestAnimationFrame(loop); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
  window.PS_DENS = { get occupied() { return !!(dens.length || ldens.length || raid || lden); }, version: 'grounded-depth-den-v5', atEntrance, art: ART, get depthReady(){return depthReady;}, collide: collideDens, blocks: blocksDen, stone: STONE, canPlace: clearSpot, footprint: FOOTPRINT, spawn: spawnDen, spawnLegend: spawnLegendDen, startLegend: startLegendDen, get legend() { return lden && { kind: lden.kind, stage: lden.stage, list: lden.list.slice(), boss: lden.e && { name: lden.e.name, hp: lden.e.hp, shiny: !!lden.e.shiny } }; }, lcfg: LCFG, get dens() { return dens.slice(); }, get raid() { return raid && { name: raid.name, t: raid.t, hp: raid.e.hp, maxHp: raid.e.maxHp, dead: raid.e.dead }; }, cfg: CFG };
})();
