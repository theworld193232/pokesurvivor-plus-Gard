/* GAME MODES — pick how the next run plays from the main menu (🎮 Mode button on the Play panel).
   - Classic         the normal game.
   - Timed Survival  survive until the clock runs out (5 / 10 / 15 min). Enemies come faster and bosses arrive early.
                     Make it to 0:00 and you win the run with bonus PokéCoins.
   - Boss Rush       bosses arrive 4x sooner and there are fewer small enemies. Every boss KO pays bonus PokéCoins.
   - Hardcore        no extra hearts and enemies hit 50% harder, but PokéCoins and EXP are doubled.
   The choice is remembered. Solo runs only (co-op always plays Classic). */
(() => {
  'use strict';
  if (window.PS_MODES_INSTALLED) return; window.PS_MODES_INSTALLED = true;
  const B = () => window.PS_MEGA_BRIDGE_V5, E = () => window.PS_HOOPA_ENGINE;
  const MODES = {
    classic:  { name: 'Classic', icon: '🎮', color: '#5fa8ff', desc: 'The normal PokéSurvivor run.' },
    timed:    { name: 'Timed Survival', icon: '⏱️', color: '#ffb13d', desc: 'Survive until the clock hits 0:00. Enemies spawn 50% faster and bosses show up early. Win the run and earn bonus PokéCoins.' },
    bossrush: { name: 'Boss Rush', icon: '👑', color: '#ff5f6d', desc: 'Bosses arrive 4× sooner and there are fewer small enemies. Every boss you defeat pays +150 PokéCoins.' },
    hardcore: { name: 'Hardcore', icon: '💀', color: '#c86bdc', desc: 'No extra hearts and enemies hit 50% harder — but PokéCoins and EXP are doubled.' },
  };
  const LENGTHS = [300, 600, 900];
  const TIMED_BONUS = { 300: 400, 600: 1000, 900: 1800 };
  const TIMED = { spawn: 1.5, clock: 1.35 };   // spawn speed and boss-schedule speed in Timed Survival
  const RUSH = { clock: 4, spawn: 0.6, bossCoins: 150 };
  const HARD = { take: 1.5, gain: 2 };
  const store = { get(k, d) { try { const v = localStorage.getItem('ps_' + k); return v == null ? d : v; } catch (_) { return d; } }, set(k, v) { try { localStorage.setItem('ps_' + k, v); } catch (_) {} } };
  let sel = MODES[store.get('mode', 'classic')] ? store.get('mode', 'classic') : 'classic';
  let len = Number(store.get('timed_len', 600)); if (!LENGTHS.includes(len)) len = 600;
  const run = { mode: 'classic', player: null, len: 600, done: false, bosses: 0, endT: 0 };   // the run in progress
  const coop = () => !!(E()?.Coop?.active);
  const clock = () => { try { const t = E().Game.time; return Number(typeof t === 'function' ? t() : t) || 0; } catch (_) { return 0; } };

  // ---------------- engine hooks ----------------
  function wrapHooks() {
    const H = window.PS_HOOKS; if (!H || H.__psModes) return !!(H && H.__psModes); H.__psModes = true;
    const take = H.take;
    H.take = function (type, pl, ...a) { const m = take ? take.call(this, type, pl, ...a) : 1; return run.mode === 'hardcore' && pl && pl === B()?.game?.player ? m * HARD.take : m; };
    return true;
  }
  let spWrapped = false;
  function wrapSpawner() {
    const Sp = E()?.Spawner; if (!Sp || spWrapped || typeof Sp.update !== 'function') return; spWrapped = true;
    const up = Sp.update;
    Sp.update = function (dt, players, time) {
      if (run.player && !coop()) {
        if (run.mode === 'timed') return up.call(this, dt * TIMED.spawn, players, time * TIMED.clock);
        if (run.mode === 'bossrush') return up.call(this, dt * RUSH.spawn, players, time * RUSH.clock);
      }
      return up.call(this, dt, players, time);
    };
  }

  // ---------------- run start / tick ----------------
  function startRunMode(p) {
    run.player = p; run.mode = coop() ? 'classic' : sel; run.len = len; run.done = false; run.endT = 0; run.bosses = Number(p.bosses) || 0;
    if (run.mode === 'hardcore') { p.lives = 0; p.coinMul = (Number(p.coinMul) || 1) * HARD.gain; p.xpMul = (Number(p.xpMul) || 1) * HARD.gain; }
    if (run.mode !== 'classic') { try { E().Spawner.say(MODES[run.mode].icon + ' ' + MODES[run.mode].name + (run.mode === 'timed' ? ' · ' + fmt(run.len) : ''), 3); } catch (_) {} }
    renderHud();
  }
  function fmt(s) { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
  function tick(dt) {
    const g = B()?.game, p = g?.player, st = g?.state;
    if (!p || st === 'ui') { if (run.player) { run.player = null; run.mode = 'classic'; } hud.style.display = 'none'; return; }
    if (p !== run.player && (st === 'playing' || st === 'levelup' || st === 'choice')) startRunMode(p);
    if (!run.player) return;
    if (run.mode === 'hardcore' && (Number(p.lives) || 0) > 0 && !p.__psHardWarn) { p.lives = 0; }
    if (run.mode === 'bossrush') { const b = Number(p.bosses) || 0; if (b > run.bosses) { const n = b - run.bosses; run.bosses = b; p.coins = (Number(p.coins) || 0) + n * RUSH.bossCoins; try { B().fx.dmgText(p.x, p.y - (p.bodyH || 40) - 30, '+' + n * RUSH.bossCoins + ' Boss Rush coins!', '#ffd86b'); } catch (_) {} } }
    if (run.mode === 'timed' && !run.done && st === 'playing' && !p.dead) {
      if (clock() >= run.len) {   // survived!
        run.done = true; run.endT = performance.now(); const bonus = TIMED_BONUS[run.len] || 500;
        p.coins = (Number(p.coins) || 0) + bonus; p.invuln = 99; p.god = true;
        try { E().Spawner.say('🏆 You survived! +' + bonus + ' PokéCoins', 3); B().fx.ring(p.x, p.y, 10, 220, '#ffd86b', 0.8, 8); B().fx.burst(p.x, p.y - 20, '#fff2a8', 40, 300); B().audio?.sfx?.('levelup'); } catch (_) {}
        win.show(bonus);
        setTimeout(() => { try { p.god = false; win.hide(); if (B()?.game?.player === p && B()?.game?.state !== 'over') E().Game.winRun(0); } catch (e) { console.warn('[modes]', e); } }, 3200);
      }
    }
    renderHud();
  }

  // ---------------- in-run HUD ----------------
  const css = document.createElement('style');
  css.textContent = `
  #ps-mode-hud{position:fixed;left:50%;top:46px;transform:translateX(-50%);z-index:24;display:none;align-items:center;gap:8px;padding:6px 14px;border-radius:999px;background:rgba(18,16,40,.82);border:2px solid var(--mc,#ffb13d);color:#fff;font:800 14px Fredoka,system-ui,sans-serif;pointer-events:none;box-shadow:0 6px 18px rgba(0,0,0,.35)}
  #ps-mode-hud .tm{font:800 22px Fredoka,system-ui;letter-spacing:1px;min-width:62px;text-align:center}#ps-mode-hud.low .tm{color:#ff6b6b;animation:psModePulse .6s infinite alternate}
  @keyframes psModePulse{to{transform:scale(1.12)}}
  #ps-mode-win{position:fixed;inset:0;z-index:80;display:none;align-items:center;justify-content:center;pointer-events:none}
  #ps-mode-win .b{padding:22px 40px;border-radius:22px;background:linear-gradient(180deg,#ffd86b,#ff9d3d);color:#3a1d00;text-align:center;font:800 40px Fredoka,system-ui;box-shadow:0 0 0 5px #fff,0 20px 60px rgba(0,0,0,.5);animation:psWin .6s cubic-bezier(.2,1.6,.4,1)}
  #ps-mode-win .b small{display:block;font:800 18px Fredoka,system-ui;margin-top:4px}
  @keyframes psWin{from{transform:scale(.3) rotate(-8deg);opacity:0}}
  #ps-mode-btn{position:absolute;right:12px;top:12px;z-index:3;display:flex;align-items:center;gap:8px;padding:8px 14px;border-radius:12px;border:2px solid rgba(255,255,255,.35);background:rgba(16,14,40,.78);color:#fff;font:800 14px Fredoka,system-ui,sans-serif;cursor:pointer;box-shadow:0 4px 0 rgba(0,0,0,.3);backdrop-filter:blur(2px)}
  #ps-mode-btn:hover{background:rgba(40,34,90,.88)}#ps-mode-btn .sw{width:10px;height:10px;border-radius:50%;background:var(--mc)}
  #ps-mode-pick{position:fixed;inset:0;z-index:90;display:none;align-items:center;justify-content:center;background:rgba(8,6,20,.6);backdrop-filter:blur(3px);font:700 14px Fredoka,system-ui,sans-serif;color:#eef0ff}
  #ps-mode-pick .box{width:min(720px,calc(100vw - 20px));max-height:calc(100vh - 24px);overflow:auto;border-radius:20px;background:#1b1f3f;border:3px solid #0d1030;box-shadow:0 0 0 3px #5a7cff inset,0 24px 60px rgba(0,0,0,.6);animation:psMIn .25s cubic-bezier(.2,1.4,.4,1)}
  @keyframes psMIn{from{transform:scale(.92);opacity:0}}
  #ps-mode-pick .hd{display:flex;align-items:center;gap:10px;padding:14px 18px;background:linear-gradient(180deg,#2b5fc8,#1f45a0);font:800 22px Fredoka,system-ui}
  #ps-mode-pick .hd button{margin-left:auto;border:0;border-radius:10px;padding:6px 12px;background:rgba(0,0,0,.25);color:#fff;font:800 14px system-ui;cursor:pointer}
  #ps-mode-pick .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px;padding:16px}
  #ps-mode-pick .psm-card{display:block;position:relative;text-align:left;padding:14px 14px 14px 72px;border-radius:16px;background:#2a3068;border:3px solid transparent;cursor:pointer;min-height:92px;transition:transform .12s,background .12s}
  #ps-mode-pick .psm-card:hover{transform:translateY(-2px);background:#323a7c}#ps-mode-pick .psm-card.on{border-color:var(--mc);box-shadow:0 0 0 3px color-mix(in srgb,var(--mc) 35%,transparent)}
  #ps-mode-pick .psm-card .ic{position:absolute;left:14px;top:14px;width:46px;height:46px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:26px;background:var(--mc)}
  #ps-mode-pick .psm-card h4{margin:0 0 4px;font:800 18px Fredoka,system-ui}#ps-mode-pick .psm-card p{margin:0;color:#c5c9ef;font:600 12.5px system-ui;line-height:1.35}
  #ps-mode-pick .psm-card .tag{text-shadow:none;position:absolute;right:12px;top:12px;font:800 11px system-ui;padding:3px 8px;border-radius:999px;background:var(--mc);color:#14102a}
  #ps-mode-pick .lens{display:flex !important;flex-direction:row;gap:6px;margin-top:10px}#ps-mode-pick .lens button small{display:block;font:700 10px system-ui;opacity:.85}#ps-mode-pick .lens button{flex:1;min-width:0;line-height:1.2;border:0;border-radius:10px;padding:7px 0;font:800 13px system-ui;background:#1d2250;color:#cfd3ff;cursor:pointer}
  #ps-mode-pick .lens button.on{background:var(--mc);color:#2a1600}
  #ps-mode-pick .ft{padding:0 16px 16px;color:#9aa0d8;font:700 12px system-ui}`;
  const hud = document.createElement('div'); hud.id = 'ps-mode-hud';
  const winEl = document.createElement('div'); winEl.id = 'ps-mode-win';
  const win = { show(b) { winEl.innerHTML = '<div class="b">🏆 You survived!<small>+' + b + ' PokéCoins · ' + fmt(run.len) + ' cleared</small></div>'; winEl.style.display = 'flex'; }, hide() { winEl.style.display = 'none'; } };
  let lastHud = '';
  function renderHud() {
    const st = B()?.game?.state;
    if (!run.player || run.mode === 'classic' || st === 'ui' || st === 'over' || (window.PS_SAFEZONE && window.PS_SAFEZONE.active)) { hud.style.display = 'none'; lastHud = ''; return; }
    const M = MODES[run.mode]; let h = '<span>' + M.icon + '</span><span>' + M.name + '</span>', low = false;
    if (run.mode === 'timed') { const left = run.len - clock(); low = left <= 30 && !run.done; h += '<span class="tm">' + (run.done ? '0:00' : fmt(left)) + '</span>'; }
    if (run.mode === 'bossrush') h += '<span>· 👑 ' + run.bosses + '</span>';
    if (run.mode === 'hardcore') h += '<span>· ×2 coins & EXP</span>';
    if (h !== lastHud) { hud.innerHTML = h; lastHud = h; }
    hud.style.setProperty('--mc', M.color); hud.classList.toggle('low', low); hud.style.display = 'flex';
  }

  // ---------------- menu: Mode button + picker ----------------
  const pick = document.createElement('div'); pick.id = 'ps-mode-pick';
  function modeLabel() { const M = MODES[sel]; return M.icon + ' ' + M.name + (sel === 'timed' ? ' · ' + (len / 60) + ' min' : ''); }
  function injectBtn() {
    const banner = document.getElementById('pp-banner'); if (!banner) return;
    let b = document.getElementById('ps-mode-btn');
    if (!b) { b = document.createElement('button'); b.id = 'ps-mode-btn'; b.type = 'button'; b.addEventListener('click', e => { e.stopPropagation(); openPick(); }); }
    if (b.parentElement !== banner) { if (getComputedStyle(banner).position === 'static') banner.style.position = 'relative'; banner.appendChild(b); }
    const html = '<span class="sw"></span><span>Mode: ' + modeLabel() + '</span>'; if (b.__h !== html) { b.innerHTML = html; b.__h = html; }
    b.style.setProperty('--mc', MODES[sel].color);
  }
  function openPick() { renderPick(); pick.style.display = 'flex'; }
  function closePick() { pick.style.display = 'none'; injectBtn(); }
  function renderPick() {
    let h = '<div class="box"><div class="hd">🎮 Game Mode<button data-close="1">Done</button></div><div class="grid">';
    for (const [id, M] of Object.entries(MODES)) {
      h += '<div class="psm-card' + (id === sel ? ' on' : '') + '" data-m="' + id + '" style="--mc:' + M.color + '"><div class="ic">' + M.icon + '</div>' + (id === sel ? '<span class="tag">Selected</span>' : '') + '<h4>' + M.name + '</h4><p>' + M.desc + '</p>';
      if (id === 'timed') { h += '<div class="lens">'; for (const L of LENGTHS) h += '<button data-len="' + L + '" class="' + (L === len ? 'on' : '') + '">' + (L / 60) + ' min<small>+' + TIMED_BONUS[L] + ' coins</small></button>'; h += '</div>'; }
      h += '</div>';
    }
    h += '</div><div class="ft">Your choice is remembered for your next runs. Co-op runs always use Classic.</div></div>';
    pick.innerHTML = h;
  }
  pick.addEventListener('click', e => {
    e.stopPropagation(); if (e.target === pick || e.target.closest('[data-close]')) return closePick();
    const L = e.target.closest('[data-len]'); if (L) { len = Number(L.dataset.len); store.set('timed_len', len); sel = 'timed'; store.set('mode', sel); return renderPick(); }
    const c = e.target.closest('[data-m]'); if (c) { sel = c.dataset.m; store.set('mode', sel); renderPick(); }
  });
  ['pointerdown', 'mousedown', 'touchstart', 'keydown'].forEach(ev => pick.addEventListener(ev, e => e.stopPropagation()));
  addEventListener('keydown', e => { if (pick.style.display === 'flex' && e.key === 'Escape') { closePick(); e.stopImmediatePropagation(); e.preventDefault(); } }, true);

  // ---------------- loop ----------------
  let last = performance.now(), menuT = 0;
  function loop(now) {
    requestAnimationFrame(loop); const dt = Math.min(0.1, (now - last) / 1000); last = now;
    try { wrapHooks(); wrapSpawner(); tick(dt); menuT += dt; if (menuT > 0.5) { menuT = 0; if (B()?.game?.state === 'ui' || !B()?.game?.player) injectBtn(); } } catch (e) { console.warn('[modes]', e); }
  }
  function init() { document.head.append(css); document.body.append(hud, winEl, pick); requestAnimationFrame(loop); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
  window.PS_MODES = { modes: MODES, get selected() { return sel; }, set selected(v) { if (MODES[v]) { sel = v; store.set('mode', v); injectBtn(); } }, get length() { return len; }, set length(v) { if (LENGTHS.includes(v)) { len = v; store.set('timed_len', v); } }, get run() { return Object.assign({}, run, { player: !!run.player }); }, open: openPick, _debugLen(s) { run.len = s; } };
})();
