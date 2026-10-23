/* PokéSurvivor custom music — your own songs at certain moments, like area music in other games.
   When none of your songs is playing, the game's own music plays as normal.

   HOW TO CHANGE IT (only edit the two lists below):
   1) TRACKS  every song you uploaded to assets/music/, each with a short nickname.
   2) RULES   which songs play when. Every rule is a list, so you can put several songs in it
              (one is picked at random each time).
        menu     title screen / menus: shuffled one after another.
        mega     Mega Evolution only (never Primal Reversion). TOP PRIORITY: cuts off any song the moment you
                 Mega Evolve, plays once, then the battle / special music carries on.
        special  certain moments, by the game's own music name (shown in the ♫ panel as "Game music: ...").
                 rift = inside a Rift, judgment = the Arceus Judgment fight, zz = Area Zero.
        battle   battle music, shuffled back to back: 'early' songs, then 'mid' from 'midAt' seconds
                 (480 = minute 8), then 'late' from 'after' seconds (900 = minute 15). 'random': every now and then (any minute) one of
                 these plays instead (chance per roll, every = seconds between rolls, first = roll at battle start).
        lowhp    a list of HP lines: when your HP drops below 'below' (0.4 = 40%), that song cuts in at any
                 point of the run; dropping below a lower line cuts in again with its song.
        events   special events (coming soon). Code can call PS_MUSIC.event('trainer') to play one.
        legends  when that legendary appears (Rift legendaries, bosses), its theme cuts in and loops while
                 it's on the field. Order of importance: Mega Evolution > legendary > low HP > special > battle.

   HOW SONGS BEHAVE
   - Mega Evolution music always cuts in right away.
   - Going from the menu into a battle (or back) switches music right away.
   - Inside a battle, a playing song is never cut off or restarted: if the new moment wants the same
     song it simply keeps going; otherwise it finishes first and then the new moment's song starts.
   - ⏭ in the ♫ panel skips to the next song (or back to the game's music if there is no other).
   - ON/OFF turns all of your songs off; the slider is their volume. */
(() => {
  'use strict';
  if (window.PS_MUSIC_PLAYLIST_INSTALLED) return;
  window.PS_MUSIC_PLAYLIST_INSTALLED = true;

  const TRACKS = {
    'tera':      { title: 'Tera Raid Battle — Orchestral Remix', file: 'assets/music/tera-raid-orchestral-remix.mp3' },
    'gym-tera':  { title: 'Gym Leader Tera Raid',                file: 'assets/music/gym-tera.mp3' },
    'zone-zero': { title: 'Zone Zero',                           file: 'assets/music/zone-zero.mp3' },
    'pallet':    { title: 'Pallet Town',                         file: 'assets/music/pallet-town.mp3' },
    'littleroot':{ title: 'Littleroot Town',                     file: 'assets/music/littleroot-town.mp3' },
    'rustboro':  { title: 'Rustboro City',                       file: 'assets/music/rustboro-city.mp3' },
    'cerulean':  { title: 'Cerulean City',                       file: 'assets/music/cerulean-city.mp3' },
    'dewford':   { title: 'Dewford Town',                        file: 'assets/music/dewford-town.mp3' },
    'petalburg': { title: 'Petalburg City',                      file: 'assets/music/petalburg-city.mp3' },
    'oldale':    { title: 'Oldale Town',                         file: 'assets/music/oldale-town.mp3' },
    'viridian':  { title: 'Viridian City',                       file: 'assets/music/viridian-city.mp3' },
    'trainer-red':      { title: 'Battle! Trainer Red',        file: 'assets/music/trainer-red.mp3' },
    'trainer-gym-oras': { title: 'Battle! Gym Leader (ORAS)',  file: 'assets/music/trainer-gym-oras.mp3' },
    'trainer-oras':     { title: 'Battle! Trainer (ORAS)',     file: 'assets/music/trainer-oras.mp3' },
    'trainer-zinnia':   { title: 'Battle! Zinnia',             file: 'assets/music/trainer-zinnia.mp3' },
    'trainer-xy':       { title: 'Battle! Trainer (X & Y)',    file: 'assets/music/trainer-xy.mp3' },
    'route-1':   { title: 'Route 1',                             file: 'assets/music/route-1.mp3' },
    'route-4':   { title: 'Route 4',                             file: 'assets/music/route-4.mp3' },
    'route-11':  { title: 'Route 11',                            file: 'assets/music/route-11.mp3' },
    'route-24':  { title: 'Route 24 / 25',                       file: 'assets/music/route-24-25.mp3' },
    // legendary battle themes
    'vs-dialga-palkia': { title: 'Battle! Dialga / Palkia',     file: 'assets/music/legend-dialga-palkia.mp3' },
    'vs-mewtwo':        { title: 'Battle! Mewtwo',              file: 'assets/music/legend-mewtwo.mp3' },
    'vs-beasts':        { title: 'Battle! Entei / Raikou / Suicune', file: 'assets/music/legend-beasts.mp3' },
    'vs-lake':          { title: 'Battle! Lake Guardians',      file: 'assets/music/legend-lake-guardians.mp3' },
    'vs-giratina':      { title: 'Battle! Giratina',            file: 'assets/music/legend-giratina.mp3' },
    'vs-lugia':         { title: 'Battle! Lugia',               file: 'assets/music/legend-lugia.mp3' },
    'vs-deoxys':        { title: 'Battle! Deoxys',              file: 'assets/music/legend-deoxys.mp3' },
    'primal-kyogre':    { title: 'Battle! Super-Ancient Pokémon (ORAS)', file: 'assets/music/primal-oras.mp3' },
    'primal-groudon':   { title: 'Battle! Super-Ancient Pokémon (ORAS)', file: 'assets/music/primal-oras.mp3' },
    'vs-regi':          { title: 'Battle! Regi Trio',           file: 'assets/music/legend-regi.mp3' },
    'vs-forces':        { title: 'Battle! Tornadus / Thundurus / Landorus', file: 'assets/music/legend-forces.mp3' },
    'vs-lati':          { title: 'Battle! Latias / Latios (Z-A)', file: 'assets/music/legend-lati.mp3' },
    'vs-birds':         { title: 'Battle! Articuno / Zapdos / Moltres', file: 'assets/music/legend-birds.mp3' },
    'vs-cresselia':     { title: 'Battle! Cresselia / Heatran / Regigigas', file: 'assets/music/legend-cresselia.mp3' },
    'boss-red-lgpe':    { title: 'Battle! Trainer Red (Let\'s Go)', file: 'assets/music/boss-red-lgpe.mp3' },
    'boss-gym-oras':    { title: 'Battle! Gym Leader (ORAS)',    file: 'assets/music/boss-gym-oras.mp3' },
  };
  const RULES = {
    menu:    { songs: ['pallet', 'littleroot', 'rustboro', 'cerulean', 'dewford', 'petalburg', 'oldale', 'viridian'] },
    safezone:{ songs: ['pallet', 'littleroot', 'rustboro', 'cerulean', 'dewford', 'petalburg', 'oldale', 'viridian'] },   // pink-rift Safe Zones
    mega:    { songs: ['gym-tera'] },
    special: {
      rift:     { songs: ['tera'] },
      judgment: { songs: ['tera'] },
    },
    // battle music, shuffled one after another: 'early' -> 'mid' from 'midAt' seconds (480 = minute 8) -> 'late' from 'after' (900 = minute 15)
    battle:  { midAt: 480, after: 900,
               early: ['route-1', 'route-4', 'route-11', 'route-24'],
               mid:   ['trainer-red', 'trainer-gym-oras', 'trainer-oras', 'trainer-zinnia', 'trainer-xy'],
               late:  ['vs-dialga-palkia','vs-mewtwo','vs-beasts','vs-lake','vs-giratina','vs-lugia','vs-deoxys','vs-regi'],
               // every now and then (any minute), one of these plays instead: chance per roll, seconds between rolls, roll at battle start
               random: { songs: [], chance: 0, every: 150, first: false } },   // v73: off - Tera Raid only plays for Rifts, Judgment and very low HP
    // low HP: when your HP drops below 'below' (0.2 = 20%), this cuts in at any time of the run
    // low HP: when your HP drops below a line, that song cuts in (the lower line wins). 0.4 = 40%
    lowhp:   [ { below: 0.2, songs: ['tera'] },
               { below: 0.4, songs: ['trainer-red', 'trainer-gym-oras', 'trainer-oras', 'trainer-zinnia', 'trainer-xy'] } ],
    // special events (coming soon): play one with PS_MUSIC.event('trainer') from code
    events:  { trainer: { songs: ['trainer-red', 'trainer-gym-oras', 'trainer-oras', 'trainer-zinnia', 'trainer-xy'] } },
    // a legendary shows up (Rift / boss): its own theme cuts in and loops while it's around. dex number: song
    legends: { 483:'vs-dialga-palkia', 484:'vs-dialga-palkia', 150:'vs-mewtwo', 151:'vs-birds', 144:'vs-birds', 145:'vs-birds', 146:'vs-birds',
               641:'vs-forces', 642:'vs-forces', 645:'vs-forces', 905:'vs-forces', 380:'vs-lati', 381:'vs-lati', 488:'vs-cresselia', 485:'vs-cresselia',
               243:'vs-beasts', 244:'vs-beasts', 245:'vs-beasts', 480:'vs-lake', 481:'vs-lake', 482:'vs-lake',
               487:'vs-giratina', 249:'vs-lugia', 250:'vs-lugia', 386:'vs-deoxys',
               377:'vs-regi', 378:'vs-regi', 379:'vs-regi', 486:'vs-cresselia', 894:'vs-regi', 895:'vs-regi' },
    // any other legendary / Dynamax raid / den boss without its own theme gets one of these (picked once per Pokémon)
    legendDefault: ['boss-red-lgpe', 'boss-gym-oras'],
    // Primal Reversion: the moment Kyogre / Groudon goes Primal, its ORAS theme cuts in and replaces the battle music for the run
    primal:  { '382-primal':'primal-kyogre', '383-primal':'primal-groudon' },
  };

  // ------------------------------------------------------------------------------------------
  const KEY = 'ps.music.zones.v1';
  let S = { on: true, volume: 0.35, open: false, gameMusicWas: null };
  try { Object.assign(S, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (_) {}
  S.volume = Math.max(0, Math.min(1, Number(S.volume))); if (!Number.isFinite(S.volume)) S.volume = 0.35;
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (_) {} };
  const pick = (list, not) => { const l = (list || []).filter(id => TRACKS[id] && id !== not); const L = l.length ? l : (list || []).filter(id => TRACKS[id]); return L.length ? L[Math.floor(Math.random() * L.length)] : null; };
  const B = () => window.PS_MEGA_BRIDGE_V5;
  const STORY = () => { try { return !!(window.PS_STORY && window.PS_STORY.on()); } catch (_) { return false; } };
  const SPECIAL_LOCK = 30;   // seconds: a new special/legendary song can't replace the one that just started within this window
  const now = () => performance.now();

  // ---- the game's own music: silenced while one of our songs plays, restored afterwards ----
  const gameAudio = () => B()?.audio || null;
  let gameTrack = null;   // name of the song the game wants right now ('rift', 'judgment', a biome, ...)
  function watchGame() {  // learn which music the game is asking for (used by RULES.special)
    const A = gameAudio(); if (!A || A.__psWatched || typeof A.music !== 'function') return;
    const orig = A.music; A.__psWatched = true;
    A.music = function (name) { gameTrack = name || null; return orig.apply(this, arguments); };
  }
  function quietGame() {
    const A = gameAudio(); if (!A || !A.settings) return;
    const v = Number(A.settings.music);
    if (v > 0) {
      // Remember the normal music setting once, then mute ONLY the built-in
      // music bus. Never mute SFX or the custom HTMLAudioElement.
      if (S.gameMusicWas == null) { S.gameMusicWas = v; save(); }
      try { A.setVolume('music', 0); } catch (_) {}
    }
  }
  function restoreGame() {
    const A = gameAudio(); if (!A || !A.settings || S.gameMusicWas == null) return;
    if (Number(A.settings.music) === 0) { try { A.setVolume('music', S.gameMusicWas); } catch (_) {} }
    S.gameMusicWas = null; save();
  }
  addEventListener('pagehide', () => {   // closing the tab mid-song: put the game's saved music volume back
    if (S.gameMusicWas == null) return;
    try { const a = JSON.parse(localStorage.getItem('ps.audio') || '{}'); if (!Number(a.music)) { a.music = S.gameMusicWas; localStorage.setItem('ps.audio', JSON.stringify(a)); } } catch (_) {}
  });

  // ---- where are we? -> 'menu' | 'special:<name>' | 'battle'   (Mega Evolution is an event, see below) ----
  function context() {
    const g = B()?.game, st = g?.state;
    const battle = !!(st && st !== 'ui' && st !== 'over');          // 'ui' = menus, 'over' = run ended
    if (!battle) return 'menu';
    if (STORY()) return (window.PS_SAFEZONE && window.PS_SAFEZONE.active) ? 'safezone' : 'battle';   // Story: early-game route music only
    if (window.PS_SAFEZONE && window.PS_SAFEZONE.active) return 'safezone';   // Safe Zones play the town music (the run's timer is kept)
    const lg = legendSong(); if (lg) return 'legend:' + lg;
    if (gameTrack && RULES.special && RULES.special[gameTrack]) return 'special:' + gameTrack;
    const pr = primalSong(); if (pr) return 'primal:' + pr;
    return 'battle';
  }
  const primalFailed = new Set();
  function primalSong() {     // Primal Kyogre / Groudon with its own theme (and the file loads)?
    const f = String(B()?.game?.player?.megaForm || ''), id = RULES.primal && RULES.primal[f];
    return id && TRACKS[id] && !primalFailed.has(id) ? id : null;
  }
  function legendSong() { const L = legendSongs(); return L.length ? L[L.length - 1] : null; }
  function legendSongs() {   // every legendary theme wanted on the field right now (oldest first)
    const out = [], E = B()?.enemies, p = B()?.game?.player; if (!E || !RULES.legends || typeof E.all !== 'function') return out;
    try { const L = E.all(); for (let i = L.length - 1; i >= 0; i--) { const e = L[i]; if (!e || e.dead) continue; const big = e.legend || e.isLegend || e.__maxRaid || e.__legendDen || e.__roamer; if (!(e.boss || big) || (p && Math.hypot(e.x - p.x, e.y - p.y) >= 1100)) continue;
      let id = RULES.legends[Number(e.dex)]; if (!(id && TRACKS[id]) && big && (RULES.legendDefault || []).length) { if (!e.__psSong) e.__psSong = pick(RULES.legendDefault); id = e.__psSong; }
      if (id && TRACKS[id] && !out.includes(id)) out.unshift(id); } } catch (_) {}
    return out;
  }
  const isMega = () => { const p = B()?.game?.player; return !!(p && p.megaForm && !/primal/.test(String(p.megaForm))); };   // Mega only, never Primal
  const menuish = c => c === 'menu' || c === 'safezone';
  const rule = ctx => ctx === 'menu' ? RULES.menu : ctx === 'safezone' ? (RULES.safezone || RULES.menu) : ctx === 'mega' ? RULES.mega : ctx.startsWith('lowhp:') ? lowRules()[Number(ctx.slice(6))] : ctx.startsWith('event:') ? (RULES.events || {})[ctx.slice(6)] : ctx === 'battle' ? battleRule() : ctx.startsWith('legend:') ? { songs: [ctx.slice(7)] } : ctx.startsWith('primal:') ? { songs: [ctx.slice(7)] } : (RULES.special || {})[ctx.slice(8)];
  const loops = ctx => ctx.startsWith('special:') || ctx.startsWith('legend:') || ctx.startsWith('primal:');
  const lowRules = () => (Array.isArray(RULES.lowhp) ? RULES.lowhp : RULES.lowhp ? [RULES.lowhp] : []).slice().sort((a, b) => (a.below ?? 0.2) - (b.below ?? 0.2));
  let runTime = 0, runLast = 0;   // seconds of actual play this run (for RULES.late)
  function battleRule() { const r = RULES.battle; if (!r) return null; if (STORY()) return { songs: r.early || [] }; { const md = window.PS_MODES && window.PS_MODES.run && window.PS_MODES.run.mode; if ((md === 'bossrush' || md === 'legend') && (r.late || []).length) return { songs: r.late }; } return { songs: runTime >= (r.after ?? 900) ? (r.late || []) : runTime >= (r.midAt ?? 480) && (r.mid || []).length ? r.mid : (r.early || []) }; }   // special moments loop; menu shuffles; battle + Mega play once

  // ---- player ----
  const BG_MIX = 0.5;   // songs play as background music: the slider's value x this, so moves and effects are easy to hear
  const V = () => Math.max(0, Math.min(1, S.volume * BG_MIX));
  const audio = new Audio(); audio.preload = 'auto'; audio.volume = V();
  let cur = null;               // { id, ctx }  the song playing now
  let unlocked = false, nextRoll = 0, lastCtx = null, wasPrimal = null, wasMega = false, wasLow = 99, fadeT = null;
  function start(id, ctx) {
    const t = TRACKS[id]; if (!t) return false;
    clearInterval(fadeT); fadeT = null; cur = { id, ctx, at: now(), lock: ctx === 'lowhp:0' };
    audio.src = new URL(t.file, document.baseURI).href; audio.loop = cur.lock ? false : loops(ctx); audio.currentTime = 0; audio.volume = 0; fadeIn();
    audio.play().then(() => { quietGame(); render(); }).catch(() => render());
    render(); return true;
  }
  // smooth transitions: songs fade in over FADE_IN seconds, fade out over FADE_OUT, and the last seconds of a song taper off
  const FADE_IN = 1.4, FADE_OUT = 1.1, TAIL = 2.0; let fadeInT = null, fadeAt = 0;
  function fadeIn() { clearInterval(fadeInT); fadeAt = performance.now(); fadeInT = setInterval(() => { if (fadeT) { clearInterval(fadeInT); fadeInT = null; return; } const u = Math.min(1, (performance.now() - fadeAt) / (FADE_IN * 1000)); audio.volume = V() * u * u; if (u >= 1) { clearInterval(fadeInT); fadeInT = null; } }, 40); }
  audio.addEventListener('timeupdate', () => { if (fadeT || fadeInT || audio.loop || !audio.duration || !isFinite(audio.duration)) return; const left = audio.duration - audio.currentTime; audio.volume = left < TAIL ? V() * Math.max(0, left / TAIL) : V(); });
  function hush() { clearInterval(fadeT); fadeT = null; cur = null; audio.pause(); audio.volume = V(); if (S.on) quietGame(); else restoreGame(); render(); }
  function cut(then) {          // quick fade-out of the current song, then run 'then' (or go back to the game's music)
    clearInterval(fadeT); fadeT = null; const was = cur; cur = null;
    if (!was || audio.paused) { audio.pause(); audio.volume = V(); if (!(then && then())) { if (S.on) quietGame(); else restoreGame(); } render(); return; }
    clearInterval(fadeInT); fadeInT = null; const step = Math.max(0.002, audio.volume / (FADE_OUT * 1000 / 50));
    fadeT = setInterval(() => {
      audio.volume = Math.max(0, audio.volume - step);
      if (audio.volume <= 0.001) { clearInterval(fadeT); fadeT = null; audio.pause(); audio.volume = V(); if (!(then && then())) { if (S.on) quietGame(); else restoreGame(); } render(); }
    }, 50);
    render();
  }
  function chooseNext(ctx, not) {   // which song (if any) should start now in this moment
    const r = rule(ctx); if (!r || !r.songs || !r.songs.length) return null;
    if (ctx === 'battle') { const X = RULES.battle && RULES.battle.random; if (X && X.songs && X.songs.length && now() >= nextRoll) { nextRoll = now() + (X.every ?? 150) * 1000; if (Math.random() < (X.chance ?? 0.3)) { const id = pick(X.songs, not); if (id && id !== not) return id; } } }
    return pick(r.songs, not);
  }
  audio.addEventListener('ended', () => {   // a song finished: the current moment picks what comes next
    const done = cur; cur = null;
    const ctx = context();
    if (done && (done.ctx === 'battle' || done.ctx === 'mega')) nextRoll = now() + (RULES.battle?.random?.every ?? 150) * 1000;
    const id = S.on && unlocked ? chooseNext(ctx, done && done.id) : null;
    if (!(id && start(id, ctx))) hush();
  });
  audio.addEventListener('error', () => { console.warn('[Music] could not load', cur && TRACKS[cur.id]?.file); if (cur && /^primal-/.test(cur.id)) primalFailed.add(cur.id); hush(); });

  function tick() {
    watchGame();
    // Mute the game's soundtrack even before the first browser gesture.
    // Otherwise the built-in soundtrack starts while our MP3 is blocked by autoplay policy.
    if (S.on) quietGame();
    const ctx = context(), mega = isMega() && !STORY();
    const locked = !!(cur && cur.lock && !menuish(ctx));   // low-HP Tera Raid: nothing replaces it until it ends
    const megaNow = mega && !wasMega; wasMega = mega;
    const primalId = primalSong(), primalNow = !!primalId && primalId !== wasPrimal; wasPrimal = primalId;
    { const st = B()?.game?.state, t = now(); if (ctx === 'menu') runTime = 0; else if (st === 'playing' && runLast) runTime += Math.min(1, (t - runLast) / 1000); runLast = t; }
    const leftOrEnteredMenu = lastCtx != null && ctx !== lastCtx && (menuish(ctx) || menuish(lastCtx));
    if (ctx !== lastCtx) { if (ctx === 'battle' && (lastCtx === 'menu' || lastCtx == null)) nextRoll = RULES.battle?.random?.first ? now() : now() + (RULES.battle?.random?.every ?? 150) * 1000; }
    lastCtx = ctx;
    if (!S.on) { if (cur) hush(); else restoreGame(); return; }
    if (!unlocked) return; // Custom playback waits for user activation; the original game stays muted.

    // 1) Mega Evolution has top priority: it cuts off whatever is playing (unless it's already that song), plays once
    if (megaNow) {   // the Mega Evolution Tera theme is the top priority: it replaces anything, even the low-HP Tera
      const id = pick(RULES.mega && RULES.mega.songs);
      if (id) { if (cur && cur.id === id) { cur.ctx = 'mega'; audio.loop = false; } else cut(() => start(id, 'mega')); render(); return; }
    }
    // 1-) Primal Reversion: its ORAS theme cuts in right away (a legendary / Rift / Judgment theme finishes first)
    if (primalNow && ctx.startsWith('primal:') && !locked && !(cur && cur.ctx === 'mega')) {
      if (cur && cur.id === primalId) { cur.ctx = ctx; audio.loop = loops(ctx); } else cut(() => start(primalId, ctx)); render(); return;
    }
    // 1a) low HP: the low-HP song cuts in (never over the Mega song; the 20% Tera one also cuts over legendary themes)
    { const p = B()?.game?.player, L = lowRules(), hp = p && p.maxHp > 0 ? p.hp / p.maxHp : 1;
      let tier = 99; if (!menuish(ctx) && !STORY() && p && !p.dead) L.forEach((r, i) => { if (hp < (r.below ?? 0.2) && i < tier) tier = i; });
      const worse = tier < wasLow; wasLow = tier;
      if (worse && !locked && !(cur && cur.ctx === 'mega') && (tier === 0 || !ctx.startsWith('legend:'))) { /* the low-HP Tera beats every song but the Mega one */ const id = pick(L[tier].songs);
        if (id) { if (cur && cur.id === id) { cur.ctx = 'lowhp:' + tier; cur.lock = tier === 0; audio.loop = false; } else cut(() => start(id, 'lowhp:' + tier)); render(); return; } } }
    // 1b) a legendary appeared: its theme cuts in (but never over the Mega Evolution song)
    if (ctx.startsWith('legend:') && !locked && (!cur || (cur.ctx !== ctx && cur.ctx !== 'mega'))) {
      const id = ctx.slice(7);
      // a special song that started less than 30 s ago keeps playing while its Pokemon is still around;
      // a second special Pokemon that showed up inside that window never replaces it (one arriving later does)
      if (cur && cur.ctx.startsWith('legend:') && cur.id !== id && legendSongs().includes(cur.id)) {
        cur.denied = cur.denied || new Set();
        if (!cur.denied.has(id) && now() - cur.at < SPECIAL_LOCK * 1000) cur.denied.add(id);
        if (cur.denied.has(id)) { audio.loop = true; render(); return; }
      }
      if (cur && cur.id === id) { cur.ctx = ctx; audio.loop = true; render(); return; }
      if (!fadeT) { cut(() => start(id, ctx)); render(); return; }
    }
    // 2) going between the menu and a battle switches music right away (title songs never follow you into battle)
    if (leftOrEnteredMenu && ((cur && cur.ctx !== ctx) || fadeT)) {   // also catches a song that was mid-fade-in
      const r = rule(ctx);
      if (!(cur && r && r.songs && r.songs.includes(cur.id))) { cut(() => { const id = chooseNext(ctx, null); return id ? start(id, ctx) : false; }); return; }
    }
    // 3) inside a battle, a playing song is never interrupted; if the new moment wants the same song it just keeps going
    if (cur) {
      if (cur.ctx !== ctx && cur.ctx !== 'mega') {
        const r = rule(ctx);
        if (cur.lock) audio.loop = false;
        else if (r && r.songs && r.songs.includes(cur.id)) { cur.ctx = ctx; audio.loop = loops(ctx); }
        else audio.loop = false;   // finish it, then the new moment takes over
      }
      if (!audio.paused) { const A = gameAudio(); if (A && A.settings && Number(A.settings.music) > 0) quietGame(); }
      render(); return;
    }
    if (fadeT) return;             // mid-fade: the next song is already decided
    const id = chooseNext(ctx, null);
    if (id) start(id, ctx);
    render();
  }
  setInterval(tick, 300);
  const unlock = () => { if (!unlocked) { unlocked = true; tick(); } };
  ['pointerdown', 'keydown', 'touchstart'].forEach(ev => addEventListener(ev, unlock, { capture: true, passive: true }));

  function skip() {   // ⏭ next song for this moment (or back to the game's music if there is no other)
    unlocked = true; if (!S.on) return;
    const ctx = context(), was = cur;
    if (was && (was.ctx === 'battle' || was.ctx === 'mega')) nextRoll = now() + (RULES.battle?.random?.every ?? 150) * 1000;
    let id = null;
    if (ctx === 'battle') { const r = battleRule(); if (r && r.songs) { id = pick(r.songs, was && was.id); if (was && id === was.id) id = null; } }
    else { id = pick(rule(ctx)?.songs, was && was.id); if (was && id === was.id) id = null; }
    cut(() => id ? start(id, ctx) : false);
  }

  // ---- UI: ♫ button + small panel ----
  const css = document.createElement('style');
  css.textContent = `
  #ps-music{position:fixed;left:10px;bottom:10px;z-index:60;display:flex;align-items:center;gap:6px;font:600 12px system-ui,sans-serif;color:#fff}
  #ps-music.battle{bottom:auto;top:10px}
  #ps-music .pm-main{width:34px;height:34px;border-radius:50%;border:2px solid #ffd23f;background:rgba(20,16,44,.88);color:#ffd23f;font-size:17px;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(0,0,0,.4)}
  #ps-music .pm-main.on{animation:pmPulse 1.6s ease-in-out infinite}
  #ps-music .pm-main.off{opacity:.55;border-color:#8a80a8;color:#c8c0e0}
  @keyframes pmPulse{50%{box-shadow:0 0 14px rgba(255,210,63,.7)}}
  #ps-music .pm-box{display:none;align-items:center;gap:5px;padding:5px 8px;border:2px solid #9a7bf0;border-radius:10px;background:rgba(20,16,44,.92);box-shadow:0 2px 10px rgba(0,0,0,.4)}
  #ps-music.open .pm-box{display:flex}
  #ps-music .pm-title{max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#e6dcff}
  #ps-music button.pm-b{border:1px solid #6f5aa8;border-radius:6px;background:#2e2550;color:#fff;padding:4px 8px;cursor:pointer;font:inherit}
  #ps-music button.pm-b:hover{border-color:#ffd23f}
  #ps-music input{width:70px;cursor:pointer}`;
  const root = document.createElement('div'); root.id = 'ps-music';
  root.innerHTML = '<button type="button" class="pm-main" title="Custom music">♫</button><div class="pm-box"><span class="pm-title"></span><button type="button" class="pm-b pm-skip" title="Skip to the next song">⏭</button><button type="button" class="pm-b pm-on"></button><input type="range" min="0" max="1" step="0.05" title="Custom music volume"></div>';
  const $ = s => root.querySelector(s);
  ['pointerdown', 'mousedown', 'touchstart', 'click'].forEach(ev => root.addEventListener(ev, e => e.stopPropagation()));
  $('.pm-main').addEventListener('click', () => { S.open = !S.open; save(); render(); });
  $('.pm-on').addEventListener('click', () => { S.on = !S.on; save(); unlocked = true; if (!S.on) hush(); tick(); render(); });
  $('.pm-skip').addEventListener('click', skip);
  const vol = $('input'); vol.value = String(S.volume);
  vol.addEventListener('input', () => { S.volume = Number(vol.value); audio.volume = V(); save(); });
  function render() {
    const t = cur && TRACKS[cur.id];
    $('.pm-title').textContent = !S.on ? 'Custom music off' : t ? (cur.ctx === 'mega' ? '✨ ' : '') + t.title : unlocked ? 'Custom music waiting…' : 'Click game once to start MP3 music';
    $('.pm-title').title = $('.pm-title').textContent;
    $('.pm-on').textContent = S.on ? 'ON' : 'OFF';
    $('.pm-on').title = S.on ? 'Turn custom music off' : 'Turn custom music on';
    $('.pm-main').classList.toggle('on', !!(cur && !audio.paused));
    $('.pm-main').classList.toggle('off', !S.on);
    root.classList.toggle('open', !!S.open);
  }
  setInterval(() => root.classList.toggle('battle', B()?.game?.state === 'playing'), 300);
  function init() { document.head.append(css); document.body.append(root); watchGame(); if (S.on) quietGame(); else restoreGame(); render(); }
  audio.addEventListener('play', render); audio.addEventListener('pause', render);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
  function event(name) {   // special events: PS_MUSIC.event('trainer') plays one of that event's songs right away (once)
    const r = (RULES.events || {})[name]; if (!r || !S.on) return false; const id = pick(r.songs); if (!id) return false;
    if (cur && cur.ctx === 'mega') return false;   // the Mega Evolution song always wins over events (e.g. Dynamax)
    unlocked = true; if (cur && cur.id === id) { cur.ctx = 'event:' + name; return true; } cut(() => start(id, 'event:' + name)); return true;
  }
  function forceMega() {   // used by Echo's "Our Bond" cut-in, where she Mega Evolves again without the form changing
    if (!S.on || !unlocked || STORY()) return; const id = pick(RULES.mega && RULES.mega.songs); if (!id) return;
    if (cur && cur.id === id) { cur.ctx = 'mega'; cur.lock = false; audio.loop = false; } else cut(() => start(id, 'mega')); render();
  }
  window.PS_MUSIC = { mega: forceMega, skip, event, stop: hush, rules: RULES, tracks: TRACKS, _audio: audio, get playing() { return cur && { ...cur }; }, get gameTrack() { return gameTrack; } };
})();
