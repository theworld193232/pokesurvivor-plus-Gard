/* PokéSurvivor+ — Living World AI · a team of six, switched in and out like in the Pokémon games
 * Choose up to six of your Pokémon from the main menu (Team); the first is your lead, the one a run
 * starts with. In a run your team sits at the bottom left of the screen: switch with Z / X (the
 * previous / next one) or click a portrait. A switch takes a moment (and can't be spammed), and the
 * one coming in gets a breath of invulnerability.
 *   - Each team member keeps its own HP and its own moves: the moves it learns are its own, and one
 *     sent out for the first time starts with its species' first move. The run's level, upgrades,
 *     items and coins belong to the whole team.
 *   - Types matter (66-types.js): send in the Pokémon the wild ones can't touch.
 *   - When the one out faints, the next healthy one is sent out at once; the run ends only when the
 *     whole team has fainted. A benched Pokémon heals a little on every level-up (a fainted one
 *     comes round with a little HP).
 * The team is kept on your save. Setting: team.
 */
(function () {
  'use strict';
  const AI = window.PSXAI;
  const U = AI.U;

  const KEY = 'psx.team.v1';
  const MAX = 6, SWITCH_CD = 1.2, BENCH_HEAL = 0.2;
  const st = { team: load(), run: null, cd: 0, hooked: false, el: null, boxes: [] };

  function load() { try { const t = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(t) ? t.filter((d) => d > 0).slice(0, MAX) : []; } catch (e) { return []; } }
  function T(en, es) { return (AI.lang && AI.lang() === 'es' && es) || en; }
  function on() { return AI.enabled && AI.cfg.team !== false && !R()?.Coop?.active; }
  function R() { return AI.R; }
  function owned(dex) { try { return !!R().DB.owns(dex); } catch (e) { return false; } }
  function nameOf(dex) { const d = R().DEX_BY[dex]; return d ? d.name : '#' + dex; }

  // ---------------------------------------------------------------- the team you've chosen (kept on your save)
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(st.team)); } catch (e) { /* ignore */ }
    try {
      const sv = R().DB.save;
      if (sv) {
        const previousLead=sv.partner,previousShiny=sv.partnerShiny,requested=st.team[0];
        sv.psxTeamShiny=sv.psxTeamShiny||{};if(previousLead)sv.psxTeamShiny[previousLead]=shinyOwned(previousLead)&&!!previousShiny;
        const variant=shinyOwned(requested)&&!!(requested===previousLead?previousShiny:sv.psxTeamShiny?.[requested]);
        if(requested&&owned(requested)){const actual=window.PS_PARTNER?.choose?.(requested,variant)||requested;st.team=[actual,...st.team.slice(1).filter(d=>d!==actual)];sv.partner=actual;sv.partnerShiny=variant&&shinyOwned(actual);sv.psxTeamShiny=sv.psxTeamShiny||{};sv.psxTeamShiny[actual]=sv.partnerShiny;}
        sv.psxTeam = st.team.slice();
        if (R().DB.commit) R().DB.commit();
      }
    } catch (e) { /* ignore */ }
  }
  function sync() {
    try { const t = R().DB.save && R().DB.save.psxTeam; if (Array.isArray(t) && t.length && !st.team.length) st.team = t.slice(0, MAX); } catch (e) { /* ignore */ }
  }
  // the team as it stands: the lead first (your partner, if you picked one in the game's own menu)
  function chosen() {
    const sv = R().DB.save || {};
    let t = st.team.filter(owned);
    const lead = sv.partner;
    if (lead && owned(lead)) t = [lead].concat(t.filter((d) => d !== lead));
    return t.slice(0, MAX);
  }
  function setTeam(list) { st.team = [...new Set(list.filter((d) => owned(d)))].slice(0, MAX); persist();try{localStorage.setItem(KEY,JSON.stringify(st.team));}catch(_){} render(); }

  function shinyOwned(dex){try{return !!(R().DB.ownsShiny?.(dex)||R().DB.save.shiny?.[dex])&&!!R().Sprites.hasShiny?.(dex);}catch(_){return false;}}
  function shinyFor(dex){const sv=R().DB.save||{},choice=sv.psxTeamShiny||{};return shinyOwned(dex)&&!!(Number(sv.partner)===Number(dex)?sv.partnerShiny:choice[dex]);}
  function setShiny(dex,value){if(value&&!shinyOwned(dex))return false;const sv=R().DB.save;sv.psxTeamShiny=sv.psxTeamShiny||{};sv.psxTeamShiny[dex]=!!value;if(Number(sv.partner)===Number(dex))sv.partnerShiny=!!value;R().DB.commit?.();render();return true;}
  // ---------------------------------------------------------------- in a run
  // each member: { dex, shiny, hpK (0…1), moves, slots, active, out }
  function startRun(p) {
    const team = chosen();
    if (!team.includes(p.dex)) {if(team.length)team[0]=p.dex;else team.push(p.dex);}
    const sv = R().DB.save || {};
    st.run = { p, cur: 0, members: team.slice(0, MAX).map((dex) => ({ dex, shiny: dex === p.dex ? p.shiny : shinyFor(dex), hpK: 1, moves: null, slots: null, active: 0, item: window.PS_HELD_ITEMS?.forDex(dex)||null, fainted: false, entered: false })) };
    const lead = st.run.members.findIndex((m) => m.dex === p.dex);
    st.run.cur = Math.max(0, lead);
    st.run.members[st.run.cur].entered=true;
    st.cd = 0;
    const initial=window.PS_SPECIES_PASSIVES?.detach(p);window.PS_SPECIES_PASSIVES?.enter(p,initial);
  }
  function cur() { return st.run && st.run.members[st.run.cur]; }
  // keep what's the member's own (its species, HP, moves) when it goes back to the bench
  function stash(p, m) {
    m.dex = p.dex; m.shiny = p.shiny; m.skin=p.mon?.skin||null;m.nativeForm=p.mon?.form??'';m.entered=true;
    m.hpK = p.maxHp > 0 ? U.clamp(p.hp / p.maxHp, 0, 1) : 0;
    m.moves = p.moves; m.slots = p.slots; m.active = p.active;
  }
  function canSwitchTo(i) {
    const r = st.run;
    return !!r && i !== r.cur && i >= 0 && i < r.members.length && !r.members[i].fainted && !!R().DEX_BY[r.members[i].dex];
  }
  function switchTo(i, forced) { const go=()=>switchMember(i,forced);return window.PS_HELD_ITEMS?window.PS_HELD_ITEMS.transition(go):go(); }
  function switchMember(i, forced) {
    const r = st.run, p = r && r.p;
    if (!on() || !p || p !== R().Game.player || !canSwitchTo(i)) return false;
    if (!forced && (st.cd > 0 || p.dead || R().Game.state !== 'playing' || (p.evoAnim || p.evoTo))) return false;
    const out = r.members[r.cur], m = r.members[i];
    window.PS_QUALITY?.cancelDynamax?.();
    window.PS_GARDEVOIR_ATTRACT?.clear?.();
    out.item=p.item||null;
    const hpK=p.maxHp>0?U.clamp(p.hp/p.maxHp,0,1):0;
    out.form=!forced&&!p.dead?window.PS_GARD_MEGA_PRESENTATION?.suspend(p):null;
    if(p.megaKey) R().Mega.end(p);
    if(p.equip){const clear=()=>p.equip(null);if(window.PS_HELD_ITEMS)window.PS_HELD_ITEMS.transition(clear);else clear();}else p.item=null;
    out.passive=window.PS_SPECIES_PASSIVES?.detach(p);
    stash(p, out);out.hpK=hpK;out.megaCd=Number(p.megaCd)||0;
    if (forced) out.fainted = true;
    // in comes the next one: its species (base stats, sprite, size), then its own HP and moves
    p.shiny = m.shiny;p.megaCd=Number(m.megaCd)||0;
    // Level-gate a fresh bench member once. Returning members keep the evolution they reached.
    const eligible=m.entered||window.PS_PARTNER?.owner?.()?m.dex:(window.PS_WILD_LEVELS?.ancestor(m.dex,p.level)||m.dex);
    p.evolveTo(eligible);
    if(m.entered&&typeof m.nativeForm==='string'&&(m.nativeForm||R().NAMED_FORMS?.[p.dex])&&R().FORM_EVOS&&p.formEvolve){const evos=R().FORM_EVOS[p.dex],wasDead=p.dead;R().FORM_EVOS[p.dex]=[[p.mon?.form||'',m.nativeForm,0]];p.dead=false;try{p.formEvolve();}finally{p.dead=wasDead;if(evos)R().FORM_EVOS[p.dex]=evos;else delete R().FORM_EVOS[p.dex];}}else if(p.dex===718&&p.level>=40)p.formEvolve?.();
    if(p.equip)p.equip(m.item||null);else p.item=m.item||null;
    delete p.__flightSafe;delete p.__cpSafe;delete p._psxOk;delete p._psxWet;
    if (m.moves) { p.moves = m.moves; p.slots = m.slots; p.active = Math.min(m.active, Math.max(0, m.slots.length - 1)); }
    else {
      p.moves = []; p.slots = []; p.active = 0;
      let first = null;
      try { first = R().startMoveOf ? R().startMoveOf(p.dex) : null; } catch (e) { first = null; }
      if (!first || !p.addMove(first)) p.addMove('tackle');
    }
    p.hp = Math.max(1, Math.round(p.maxHp * (m.fainted ? 0 : m.hpK)));
    window.PS_SPECIES_PASSIVES?.enter(p,m.passive);
    p.dead = false;
    if(m.form){const restored=window.PS_GARD_MEGA_PRESENTATION?.resume(p,m.form);if(restored)p.hp=Math.max(1,Math.round(p.maxHp*m.hpK));else m.form=null;}
    p.invuln = Math.max(p.invuln || 0, forced ? 2 : 0.6);
    m.dex=p.dex;m.shiny=p.shiny;m.entered=true;
    r.cur = i;
    st.cd = SWITCH_CD;
    p._pas = null; p._pasSig = null; // (its passive bonuses are worked out again from its own moves)
    try { if (p.bondStale) p.bondStale(); } catch (e) { /* ignore */ }
    try {
      const Rr = R();
      Rr.FX.ring(p.x, p.y, 8, 90, '#ffffff', 0.5, 4); Rr.FX.burst(p.x, p.y - 20, '#ff5252', 14, 120); Rr.Audio.sfx('levelup');
      Rr.Spawner.say(forced ? T(nameOf(out.dex) + ' fainted! Go, ' + nameOf(m.dex) + '!', '¡' + nameOf(out.dex) + ' se ha debilitado! ¡Adelante, ' + nameOf(m.dex) + '!') : T('Go, ' + nameOf(m.dex) + '!', '¡Adelante, ' + nameOf(m.dex) + '!'), 2.4, 1);
    } catch (e) { /* ignore */ }
    AI.Bus.emit({ type: 'team', what: forced ? 'faint' : 'switch', from: out.dex, to: m.dex, x: p.x, y: p.y, loud: 0 });
    return true;
  }
  function step(dir) {
    const r = st.run;
    if (!r) return false;
    for (let k = 1; k < r.members.length; k++) { const i = (r.cur + dir * k + r.members.length * 2) % r.members.length; if (canSwitchTo(i)) return switchTo(i); }
    return false;
  }
  function nextHealthy() {
    const r = st.run;
    if (!r) return -1;
    for (let k = 1; k < r.members.length; k++) { const i = (r.cur + k) % r.members.length; if (canSwitchTo(i)) return i; }
    return -1;
  }
  // a level-up: the bench catches its breath
  function onLevel() {
    const r = st.run;
    if (!r) return;
    r.members.forEach((m, i) => { if (i === r.cur) return; if (m.fainted) { m.fainted = false; m.hpK = BENCH_HEAL; } else m.hpK = Math.min(1, m.hpK + BENCH_HEAL); });
  }

  function tick(dt) {
    const p = R() && R().Game && R().Game.player;
    if (!on() || !p || p.remote) return;
    if (!st.run || st.run.p !== p) startRun(p);
    st.cd = Math.max(0, st.cd - dt);
    const r = st.run, m = cur();
    if (m) { m.dex = p.dex; m.hpK = p.maxHp > 0 ? U.clamp(p.hp / p.maxHp, 0, 1) : 0; }
    if (r && p.level > (r.level || p.level)) onLevel();
    if (r) r.level = p.level;
  }

  // ---------------------------------------------------------------- the team bar (bottom left)
  const icons = new Map();
  function icon(dex, shiny) {
    const key=dex+(shiny?':shiny':'');
    let im = icons.get(key);
    if (!im) { im = new Image(); im.onload = () => { im.ok = true; }; im.src = 'assets/pokemon/' + dex + (shiny?'/s':'') + '/Idle.png'; icons.set(key, im); }
    return im;
  }
  function drawIcon(ctx, dex, x, y, s, alpha, shiny = false, player = null) {
    if(player&&window.PS_GARDEVOIR_EXPRESSIONS?.drawPortrait(ctx,player,x+2,y+2,s-4,alpha))return;
    if(window.PS_PORTRAITS?.draw(ctx,dex,x+2,y+2,s-4,alpha,{shiny}))return;
    shiny=shiny&&!!R().Sprites.hasShiny?.(dex);
    const im = icon(dex,shiny), meta = R().SPRITE_META[dex], a = meta && ((shiny&&meta.sa?.Idle)||meta.a?.Idle);
    if (!im.ok || !a) return;
    const k = Math.min(s / a.w, s / a.h) * 1.25;
    ctx.save(); ctx.globalAlpha = alpha; ctx.imageSmoothingEnabled = false;
    ctx.drawImage(im, 0, 0, a.w, a.h, Math.round(x + (s - a.w * k) / 2), Math.round(y + (s - a.h * k) / 2 + 2), Math.round(a.w * k), Math.round(a.h * k));
    ctx.restore();
  }
  function drawScreen(ctx, w, h) {
    const r = st.run;
    st.boxes.length = 0;
    if (!on() || !r || r.members.length < 2 || R().Game.state !== 'playing') return;
    const S = 40, G = 6, x0 = 12, y0 = h - S - 120;
    ctx.save();
    ctx.font = '600 10px Pixelify, "Segoe UI", sans-serif'; ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(10,14,24,0.55)'; ctx.fillRect(x0 - 6, y0 - 18, r.members.length * (S + G) + 6, S + 30);
    ctx.fillStyle = '#c8d2e6'; ctx.fillText(T('Team · Z / X to switch', 'Equipo · Z / X para cambiar'), x0, y0 - 14);
    r.members.forEach((m, i) => {
      const x = x0 + i * (S + G), y = y0, out = i === r.cur;
      ctx.fillStyle = out ? 'rgba(255,240,170,0.28)' : 'rgba(255,255,255,0.08)';
      ctx.fillRect(x, y, S, S);
      ctx.strokeStyle = out ? '#ffe680' : m.fainted ? '#6a3a3a' : 'rgba(200,210,230,0.5)'; ctx.lineWidth = out ? 2 : 1;
      ctx.strokeRect(x + 0.5, y + 0.5, S - 1, S - 1);
      drawIcon(ctx, out?(r.p.megaKey||r.p.megaForm||r.p.mon?.skin||m.dex):(m.form?.key||m.skin||m.dex), x, y, S, m.fainted ? 0.3 : 1, m.shiny, out?r.p:null);
      // its HP
      const k = out ? (r.p.maxHp > 0 ? r.p.hp / r.p.maxHp : 0) : m.fainted ? 0 : m.hpK;
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(x + 2, y + S + 3, S - 4, 4);
      ctx.fillStyle = k > 0.5 ? '#5fe08a' : k > 0.2 ? '#ffd23f' : '#ff5f6d'; ctx.fillRect(x + 2, y + S + 3, Math.round((S - 4) * U.clamp(k, 0, 1)), 4);
      if (m.fainted) { ctx.fillStyle = '#ff8a8a'; ctx.fillText('KO', x + 3, y + 3); }
      if (out && st.cd > 0) { ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(x, y, S, S * (st.cd / SWITCH_CD)); }
      st.boxes.push({ x, y, w: S, h: S + 8, i });
    });
    ctx.restore();
  }
  // a click on a portrait
  function onClick(ev) {
    if (!on() || !st.run || !st.boxes.length || !(ev.target instanceof HTMLCanvasElement)) return;
    const b = ev.target.getBoundingClientRect(), Rr = R();
    const cw = (Rr.Camera && Rr.Camera._cw) || b.width, ch = (Rr.Camera && Rr.Camera._ch) || b.height;
    const x = (ev.clientX - b.left) * cw / b.width, y = (ev.clientY - b.top) * ch / b.height;
    for (const bx of st.boxes) if (x >= bx.x && x <= bx.x + bx.w && y >= bx.y && y <= bx.y + bx.h) { ev.stopPropagation(); switchTo(bx.i); return; }
  }

  // ---------------------------------------------------------------- the Team screen (main menu)
  // [Gard v80] pixel icons for the Team menu entry and panel (12×12, same style as the game's own menu icons)
  const TICON = {"team": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%20shape-rendering%3D%22crispEdges%22%3E%3Crect%20x%3D%222%22%20y%3D%220%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%223%22%20y%3D%220%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%224%22%20y%3D%220%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%221%22%20y%3D%221%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%222%22%20y%3D%221%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%235fa8ff%22/%3E%3Crect%20x%3D%223%22%20y%3D%221%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%235fa8ff%22/%3E%3Crect%20x%3D%224%22%20y%3D%221%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%235fa8ff%22/%3E%3Crect%20x%3D%225%22%20y%3D%221%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%220%22%20y%3D%222%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%221%22%20y%3D%222%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%235fa8ff%22/%3E%3Crect%20x%3D%222%22%20y%3D%222%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%235fa8ff%22/%3E%3Crect%20x%3D%223%22%20y%3D%222%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%235fa8ff%22/%3E%3Crect%20x%3D%224%22%20y%3D%222%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%235fa8ff%22/%3E%3Crect%20x%3D%225%22%20y%3D%222%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%235fa8ff%22/%3E%3Crect%20x%3D%226%22%20y%3D%222%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%220%22%20y%3D%223%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%221%22%20y%3D%223%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%222%22%20y%3D%223%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%223%22%20y%3D%223%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23f4f2f8%22/%3E%3Crect%20x%3D%224%22%20y%3D%223%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%225%22%20y%3D%223%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%226%22%20y%3D%223%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%220%22%20y%3D%224%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%221%22%20y%3D%224%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23f4f2f8%22/%3E%3Crect%20x%3D%222%22%20y%3D%224%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23f4f2f8%22/%3E%3Crect%20x%3D%223%22%20y%3D%224%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23f4f2f8%22/%3E%3Crect%20x%3D%224%22%20y%3D%224%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23f4f2f8%22/%3E%3Crect%20x%3D%225%22%20y%3D%224%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23f4f2f8%22/%3E%3Crect%20x%3D%226%22%20y%3D%224%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%227%22%20y%3D%224%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%228%22%20y%3D%224%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%229%22%20y%3D%224%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%221%22%20y%3D%225%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%222%22%20y%3D%225%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23f4f2f8%22/%3E%3Crect%20x%3D%223%22%20y%3D%225%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23f4f2f8%22/%3E%3Crect%20x%3D%224%22%20y%3D%225%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23f4f2f8%22/%3E%3Crect%20x%3D%225%22%20y%3D%225%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%226%22%20y%3D%225%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%227%22%20y%3D%225%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23e8404a%22/%3E%3Crect%20x%3D%228%22%20y%3D%225%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23e8404a%22/%3E%3Crect%20x%3D%229%22%20y%3D%225%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23e8404a%22/%3E%3Crect%20x%3D%2210%22%20y%3D%225%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%222%22%20y%3D%226%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%223%22%20y%3D%226%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%224%22%20y%3D%226%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%225%22%20y%3D%226%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%226%22%20y%3D%226%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23e8404a%22/%3E%3Crect%20x%3D%227%22%20y%3D%226%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23e8404a%22/%3E%3Crect%20x%3D%228%22%20y%3D%226%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23e8404a%22/%3E%3Crect%20x%3D%229%22%20y%3D%226%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23e8404a%22/%3E%3Crect%20x%3D%2210%22%20y%3D%226%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23e8404a%22/%3E%3Crect%20x%3D%2211%22%20y%3D%226%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%225%22%20y%3D%227%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%226%22%20y%3D%227%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%227%22%20y%3D%227%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%228%22%20y%3D%227%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23f4f2f8%22/%3E%3Crect%20x%3D%229%22%20y%3D%227%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%2210%22%20y%3D%227%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%2211%22%20y%3D%227%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%225%22%20y%3D%228%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%226%22%20y%3D%228%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23f4f2f8%22/%3E%3Crect%20x%3D%227%22%20y%3D%228%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23f4f2f8%22/%3E%3Crect%20x%3D%228%22%20y%3D%228%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23f4f2f8%22/%3E%3Crect%20x%3D%229%22%20y%3D%228%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23f4f2f8%22/%3E%3Crect%20x%3D%2210%22%20y%3D%228%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23f4f2f8%22/%3E%3Crect%20x%3D%2211%22%20y%3D%228%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%226%22%20y%3D%229%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%227%22%20y%3D%229%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23f4f2f8%22/%3E%3Crect%20x%3D%228%22%20y%3D%229%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23f4f2f8%22/%3E%3Crect%20x%3D%229%22%20y%3D%229%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23f4f2f8%22/%3E%3Crect%20x%3D%2210%22%20y%3D%229%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%227%22%20y%3D%2210%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%228%22%20y%3D%2210%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%229%22%20y%3D%2210%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3C/svg%3E", "crown": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%20shape-rendering%3D%22crispEdges%22%3E%3Crect%20x%3D%221%22%20y%3D%222%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%225%22%20y%3D%222%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%229%22%20y%3D%222%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%220%22%20y%3D%223%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%221%22%20y%3D%223%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23ffd34a%22/%3E%3Crect%20x%3D%222%22%20y%3D%223%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%224%22%20y%3D%223%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%225%22%20y%3D%223%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23ffd34a%22/%3E%3Crect%20x%3D%226%22%20y%3D%223%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%228%22%20y%3D%223%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%229%22%20y%3D%223%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23ffd34a%22/%3E%3Crect%20x%3D%2210%22%20y%3D%223%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%220%22%20y%3D%224%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%221%22%20y%3D%224%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23ffd34a%22/%3E%3Crect%20x%3D%222%22%20y%3D%224%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23ffd34a%22/%3E%3Crect%20x%3D%223%22%20y%3D%224%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%224%22%20y%3D%224%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23ffd34a%22/%3E%3Crect%20x%3D%225%22%20y%3D%224%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23ffd34a%22/%3E%3Crect%20x%3D%226%22%20y%3D%224%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23ffd34a%22/%3E%3Crect%20x%3D%227%22%20y%3D%224%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%228%22%20y%3D%224%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23ffd34a%22/%3E%3Crect%20x%3D%229%22%20y%3D%224%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23ffd34a%22/%3E%3Crect%20x%3D%2210%22%20y%3D%224%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%220%22%20y%3D%225%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%221%22%20y%3D%225%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23ffd34a%22/%3E%3Crect%20x%3D%222%22%20y%3D%225%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23ffd34a%22/%3E%3Crect%20x%3D%223%22%20y%3D%225%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23ffd34a%22/%3E%3Crect%20x%3D%224%22%20y%3D%225%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23ffd34a%22/%3E%3Crect%20x%3D%225%22%20y%3D%225%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23ffd34a%22/%3E%3Crect%20x%3D%226%22%20y%3D%225%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23ffd34a%22/%3E%3Crect%20x%3D%227%22%20y%3D%225%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23ffd34a%22/%3E%3Crect%20x%3D%228%22%20y%3D%225%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23ffd34a%22/%3E%3Crect%20x%3D%229%22%20y%3D%225%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23ffd34a%22/%3E%3Crect%20x%3D%2210%22%20y%3D%225%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%220%22%20y%3D%226%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%221%22%20y%3D%226%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23ffd34a%22/%3E%3Crect%20x%3D%222%22%20y%3D%226%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23fff2a0%22/%3E%3Crect%20x%3D%223%22%20y%3D%226%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23ffd34a%22/%3E%3Crect%20x%3D%224%22%20y%3D%226%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23ffd34a%22/%3E%3Crect%20x%3D%225%22%20y%3D%226%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23fff2a0%22/%3E%3Crect%20x%3D%226%22%20y%3D%226%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23ffd34a%22/%3E%3Crect%20x%3D%227%22%20y%3D%226%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23ffd34a%22/%3E%3Crect%20x%3D%228%22%20y%3D%226%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23fff2a0%22/%3E%3Crect%20x%3D%229%22%20y%3D%226%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23ffd34a%22/%3E%3Crect%20x%3D%2210%22%20y%3D%226%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%220%22%20y%3D%227%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%221%22%20y%3D%227%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23ffd34a%22/%3E%3Crect%20x%3D%222%22%20y%3D%227%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23ffd34a%22/%3E%3Crect%20x%3D%223%22%20y%3D%227%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23ffd34a%22/%3E%3Crect%20x%3D%224%22%20y%3D%227%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23ffd34a%22/%3E%3Crect%20x%3D%225%22%20y%3D%227%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23ffd34a%22/%3E%3Crect%20x%3D%226%22%20y%3D%227%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23ffd34a%22/%3E%3Crect%20x%3D%227%22%20y%3D%227%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23ffd34a%22/%3E%3Crect%20x%3D%228%22%20y%3D%227%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23ffd34a%22/%3E%3Crect%20x%3D%229%22%20y%3D%227%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23ffd34a%22/%3E%3Crect%20x%3D%2210%22%20y%3D%227%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%220%22%20y%3D%228%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%221%22%20y%3D%228%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23d89a1c%22/%3E%3Crect%20x%3D%222%22%20y%3D%228%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23d89a1c%22/%3E%3Crect%20x%3D%223%22%20y%3D%228%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23d89a1c%22/%3E%3Crect%20x%3D%224%22%20y%3D%228%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23d89a1c%22/%3E%3Crect%20x%3D%225%22%20y%3D%228%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23d89a1c%22/%3E%3Crect%20x%3D%226%22%20y%3D%228%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23d89a1c%22/%3E%3Crect%20x%3D%227%22%20y%3D%228%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23d89a1c%22/%3E%3Crect%20x%3D%228%22%20y%3D%228%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23d89a1c%22/%3E%3Crect%20x%3D%229%22%20y%3D%228%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23d89a1c%22/%3E%3Crect%20x%3D%2210%22%20y%3D%228%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%221%22%20y%3D%229%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%222%22%20y%3D%229%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%223%22%20y%3D%229%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%224%22%20y%3D%229%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%225%22%20y%3D%229%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%226%22%20y%3D%229%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%227%22%20y%3D%229%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%228%22%20y%3D%229%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%229%22%20y%3D%229%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3C/svg%3E", "ball": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%20shape-rendering%3D%22crispEdges%22%3E%3Crect%20x%3D%224%22%20y%3D%220%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%225%22%20y%3D%220%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%226%22%20y%3D%220%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%227%22%20y%3D%220%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%222%22%20y%3D%221%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%223%22%20y%3D%221%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%224%22%20y%3D%221%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23b8b4c8%22/%3E%3Crect%20x%3D%225%22%20y%3D%221%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23b8b4c8%22/%3E%3Crect%20x%3D%226%22%20y%3D%221%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23b8b4c8%22/%3E%3Crect%20x%3D%227%22%20y%3D%221%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23b8b4c8%22/%3E%3Crect%20x%3D%228%22%20y%3D%221%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%229%22%20y%3D%221%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%221%22%20y%3D%222%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%222%22%20y%3D%222%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23b8b4c8%22/%3E%3Crect%20x%3D%223%22%20y%3D%222%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23b8b4c8%22/%3E%3Crect%20x%3D%224%22%20y%3D%222%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23b8b4c8%22/%3E%3Crect%20x%3D%225%22%20y%3D%222%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23b8b4c8%22/%3E%3Crect%20x%3D%226%22%20y%3D%222%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23b8b4c8%22/%3E%3Crect%20x%3D%227%22%20y%3D%222%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23b8b4c8%22/%3E%3Crect%20x%3D%228%22%20y%3D%222%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23b8b4c8%22/%3E%3Crect%20x%3D%229%22%20y%3D%222%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23b8b4c8%22/%3E%3Crect%20x%3D%2210%22%20y%3D%222%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%221%22%20y%3D%223%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%222%22%20y%3D%223%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23b8b4c8%22/%3E%3Crect%20x%3D%223%22%20y%3D%223%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23b8b4c8%22/%3E%3Crect%20x%3D%224%22%20y%3D%223%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23b8b4c8%22/%3E%3Crect%20x%3D%225%22%20y%3D%223%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23b8b4c8%22/%3E%3Crect%20x%3D%226%22%20y%3D%223%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23b8b4c8%22/%3E%3Crect%20x%3D%227%22%20y%3D%223%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23b8b4c8%22/%3E%3Crect%20x%3D%228%22%20y%3D%223%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23b8b4c8%22/%3E%3Crect%20x%3D%229%22%20y%3D%223%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23b8b4c8%22/%3E%3Crect%20x%3D%2210%22%20y%3D%223%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%220%22%20y%3D%224%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%221%22%20y%3D%224%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23b8b4c8%22/%3E%3Crect%20x%3D%222%22%20y%3D%224%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23b8b4c8%22/%3E%3Crect%20x%3D%223%22%20y%3D%224%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23b8b4c8%22/%3E%3Crect%20x%3D%224%22%20y%3D%224%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23b8b4c8%22/%3E%3Crect%20x%3D%225%22%20y%3D%224%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%226%22%20y%3D%224%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%227%22%20y%3D%224%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23b8b4c8%22/%3E%3Crect%20x%3D%228%22%20y%3D%224%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23b8b4c8%22/%3E%3Crect%20x%3D%229%22%20y%3D%224%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23b8b4c8%22/%3E%3Crect%20x%3D%2210%22%20y%3D%224%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23b8b4c8%22/%3E%3Crect%20x%3D%2211%22%20y%3D%224%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%220%22%20y%3D%225%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%221%22%20y%3D%225%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%222%22%20y%3D%225%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%223%22%20y%3D%225%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%224%22%20y%3D%225%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%225%22%20y%3D%225%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23f4f2f8%22/%3E%3Crect%20x%3D%226%22%20y%3D%225%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23f4f2f8%22/%3E%3Crect%20x%3D%227%22%20y%3D%225%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%228%22%20y%3D%225%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%229%22%20y%3D%225%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%2210%22%20y%3D%225%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%2211%22%20y%3D%225%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%220%22%20y%3D%226%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%221%22%20y%3D%226%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23b8b4c8%22/%3E%3Crect%20x%3D%222%22%20y%3D%226%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23b8b4c8%22/%3E%3Crect%20x%3D%223%22%20y%3D%226%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23b8b4c8%22/%3E%3Crect%20x%3D%224%22%20y%3D%226%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%225%22%20y%3D%226%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23f4f2f8%22/%3E%3Crect%20x%3D%226%22%20y%3D%226%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23f4f2f8%22/%3E%3Crect%20x%3D%227%22%20y%3D%226%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%228%22%20y%3D%226%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23b8b4c8%22/%3E%3Crect%20x%3D%229%22%20y%3D%226%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23b8b4c8%22/%3E%3Crect%20x%3D%2210%22%20y%3D%226%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23b8b4c8%22/%3E%3Crect%20x%3D%2211%22%20y%3D%226%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%220%22%20y%3D%227%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%221%22%20y%3D%227%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23b8b4c8%22/%3E%3Crect%20x%3D%222%22%20y%3D%227%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23b8b4c8%22/%3E%3Crect%20x%3D%223%22%20y%3D%227%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23b8b4c8%22/%3E%3Crect%20x%3D%224%22%20y%3D%227%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23b8b4c8%22/%3E%3Crect%20x%3D%225%22%20y%3D%227%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%226%22%20y%3D%227%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%227%22%20y%3D%227%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23b8b4c8%22/%3E%3Crect%20x%3D%228%22%20y%3D%227%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23b8b4c8%22/%3E%3Crect%20x%3D%229%22%20y%3D%227%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23b8b4c8%22/%3E%3Crect%20x%3D%2210%22%20y%3D%227%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23b8b4c8%22/%3E%3Crect%20x%3D%2211%22%20y%3D%227%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%221%22%20y%3D%228%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%222%22%20y%3D%228%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23b8b4c8%22/%3E%3Crect%20x%3D%223%22%20y%3D%228%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23b8b4c8%22/%3E%3Crect%20x%3D%224%22%20y%3D%228%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23b8b4c8%22/%3E%3Crect%20x%3D%225%22%20y%3D%228%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23b8b4c8%22/%3E%3Crect%20x%3D%226%22%20y%3D%228%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23b8b4c8%22/%3E%3Crect%20x%3D%227%22%20y%3D%228%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23b8b4c8%22/%3E%3Crect%20x%3D%228%22%20y%3D%228%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23b8b4c8%22/%3E%3Crect%20x%3D%229%22%20y%3D%228%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23b8b4c8%22/%3E%3Crect%20x%3D%2210%22%20y%3D%228%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%221%22%20y%3D%229%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%222%22%20y%3D%229%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23b8b4c8%22/%3E%3Crect%20x%3D%223%22%20y%3D%229%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23b8b4c8%22/%3E%3Crect%20x%3D%224%22%20y%3D%229%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23b8b4c8%22/%3E%3Crect%20x%3D%225%22%20y%3D%229%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23b8b4c8%22/%3E%3Crect%20x%3D%226%22%20y%3D%229%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23b8b4c8%22/%3E%3Crect%20x%3D%227%22%20y%3D%229%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23b8b4c8%22/%3E%3Crect%20x%3D%228%22%20y%3D%229%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23b8b4c8%22/%3E%3Crect%20x%3D%229%22%20y%3D%229%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23b8b4c8%22/%3E%3Crect%20x%3D%2210%22%20y%3D%229%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%222%22%20y%3D%2210%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%223%22%20y%3D%2210%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%224%22%20y%3D%2210%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23b8b4c8%22/%3E%3Crect%20x%3D%225%22%20y%3D%2210%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23b8b4c8%22/%3E%3Crect%20x%3D%226%22%20y%3D%2210%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23b8b4c8%22/%3E%3Crect%20x%3D%227%22%20y%3D%2210%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23b8b4c8%22/%3E%3Crect%20x%3D%228%22%20y%3D%2210%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%229%22%20y%3D%2210%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%224%22%20y%3D%2211%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%225%22%20y%3D%2211%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%226%22%20y%3D%2211%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3Crect%20x%3D%227%22%20y%3D%2211%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%231b1528%22/%3E%3C/svg%3E"};
  const ticon = (k, px, extra) => '<img src="' + TICON[k] + '" width="' + px + '" height="' + px + '" alt="" style="image-rendering:pixelated;vertical-align:middle;' + (extra || '') + '">';
  function build() {
    const el = document.createElement('div');
    el.id = 'psx-team';
    el.style.cssText = 'position:fixed;inset:0;z-index:9000;display:none;align-items:center;justify-content:center;background:rgba(6,8,14,0.72)';
    el.innerHTML = '<div style="width:min(860px,calc(100vw - 32px));max-height:88vh;display:flex;flex-direction:column;gap:10px;padding:14px;background:#141a2a;border:2px solid #3d4a80;border-radius:12px;color:#e6ecff;font:14px system-ui,sans-serif">' +
      '<div style="display:flex;justify-content:space-between;align-items:center"><b data-t style="font-size:18px"></b><button data-close style="padding:6px 12px;background:#232b48;color:#e6ecff;border:1px solid #3d4a80;border-radius:6px;cursor:pointer"></button></div>' +
      '<div data-sub style="opacity:.75;font-size:12px"></div>' +
      '<div data-team style="display:grid;grid-template-columns:repeat(auto-fit,minmax(92px,1fr));gap:8px;max-height:40vh;overflow:auto;flex-shrink:0"></div>' +
      '<input data-q style="padding:7px 9px;background:#0e1322;color:#fff;border:1px solid #3a4a7a;border-radius:6px">' +
      '<div data-list style="flex:1;overflow:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:6px;min-height:160px"></div></div>';
    document.body.appendChild(el);
    el.querySelector('[data-close]').onclick = close;
    el.addEventListener('click', (e) => { if (e.target === el) close(); });
    el.querySelector('[data-q]').addEventListener('input', renderList);
    el.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Escape') close(); });
    st.el = el;
  }
  function card(dex, extra) {
    const shiny=shinyFor(dex);
    const d = document.createElement('button');
    d.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:2px;padding:6px 4px;background:#1c2440;color:#e6ecff;border:1px solid #33406e;border-radius:8px;cursor:pointer;font:12px system-ui,sans-serif;min-height:92px';
    const cv = document.createElement('canvas'); cv.width = cv.height = 56;
    const im = icon(dex,shiny), meta = R().SPRITE_META[dex], a = meta && ((shiny&&meta.sa?.Idle)||meta.a?.Idle);
    const paint = () => { if (!a) return; const g = cv.getContext('2d'); g.imageSmoothingEnabled = false; const k = Math.min(56 / a.w, 56 / a.h) * 1.25; g.clearRect(0, 0, 56, 56); g.drawImage(im, 0, 0, a.w, a.h, (56 - a.w * k) / 2, (56 - a.h * k) / 2, a.w * k, a.h * k); };
    if (im.ok) paint(); else im.addEventListener('load', paint, { once: true });
    const tlist = ((R().DEX_BY[dex] || {}).types || []), types = tlist.join(' / ');
    d.appendChild(window.PS_PORTRAITS?.element(dex,56,{shiny,name:nameOf(dex)})||cv);
    const n = document.createElement('div'); n.textContent = nameOf(dex); d.appendChild(n);
    const t = document.createElement('div'); t.title = types; t.style.cssText = 'display:flex;gap:3px;justify-content:center;align-items:center;min-height:16px;font-size:10px;opacity:.85';
    const TI = R().TYPE_ICONS || {};
    for (const ty of tlist) { if (TI[ty]) { const im2 = document.createElement('img'); im2.src = TI[ty]; im2.width = im2.height = 16; im2.alt = ty; im2.title = ty; im2.style.imageRendering = 'pixelated'; t.appendChild(im2); } else { const sp = document.createElement('span'); sp.textContent = ty; sp.style.opacity = '.7'; t.appendChild(sp); } }
    d.appendChild(t);
    if (extra) { const x = document.createElement('div'); x.innerHTML = ticon('crown', 12, 'margin-right:3px') + extra; x.style.cssText = 'color:#ffe680;font-size:10px;display:flex;align-items:center'; d.appendChild(x); }
    const wrap=document.createElement('div');wrap.style.cssText='display:flex;flex-direction:column;gap:3px;min-width:0';wrap.append(d);
    const select=document.createElement('select');select.setAttribute('aria-label',nameOf(dex)+' appearance');select.style.cssText='width:100%;min-width:0;background:#151e34;color:#e6ecff;border:1px solid #50628c;border-radius:5px;padding:4px;font:11px system-ui';
    for(const [value,label]of [['normal',T('Normal','Normal')],['shiny',T('Shiny ✨','Variocolor ✨')]]){const o=document.createElement('option');o.value=value;o.textContent=label;o.disabled=value==='shiny'&&!shinyOwned(dex);select.append(o);}select.value=shiny?'shiny':'normal';
    select.onclick=e=>e.stopPropagation();select.onkeydown=e=>e.stopPropagation();select.onchange=e=>{e.stopPropagation();setShiny(dex,select.value==='shiny');};wrap.append(select);return wrap;
  }
  function render() {
    const el = st.el;
    if (!el || el.style.display === 'none') return;
    el.querySelector('[data-t]').innerHTML = ticon('team', 24, 'margin-right:8px') + T('Your team', 'Tu equipo');
    el.querySelector('[data-close]').textContent = T('Done', 'Listo');
    el.querySelector('[data-sub]').textContent = T('Pick up to six of your Pokémon and choose Normal or Shiny below each portrait. Fresh members start at their level-appropriate evolution stage. Click one below to add it. The first is your lead, the one a run starts with. Click a team member to take it out, or "Make lead" to lead with it. In a run, switch with Z / X or click its portrait.', 'Elige hasta seis de tus Pokémon: haz clic en uno de abajo para añadirlo. El primero es tu líder, con el que empieza la partida. Haz clic en uno del equipo para quitarlo, o en "Hacer líder". En partida, cambia con Z / X o haciendo clic en su retrato.');
    el.querySelector('[data-q]').placeholder = T('Search your Pokémon…', 'Busca entre tus Pokémon…');
    const tb = el.querySelector('[data-team]');
    tb.innerHTML = '';
    const team = chosen();
    for (let i = 0; i < MAX; i++) {
      const dex = team[i];
      if (!dex) { const e = document.createElement('div'); e.style.cssText = 'min-height:92px;border:1px dashed #33406e;border-radius:8px;display:flex;align-items:center;justify-content:center;opacity:.5;font-size:12px'; e.style.flexDirection = 'column'; e.style.gap = '4px'; e.innerHTML = ticon('ball', 24, 'opacity:.7') + '<span>' + T('empty', 'vacío') + '</span>'; tb.appendChild(e); continue; }
      const c = card(dex, i === 0 ? T('Lead', 'Líder') : null);
      c.title = T('Click to take it out of the team', 'Haz clic para quitarlo del equipo');
      c.querySelector('button').onclick = () => setTeamLead(chosen().filter((d) => d !== dex));
      if (i > 0) {
        const lead = document.createElement('button');lead.type='button';
        lead.innerHTML = ticon('crown', 10, 'margin-right:2px') + T('Make lead', 'Hacer líder');
        lead.style.cssText = 'margin-top:2px;padding:1px 6px;border:1px solid #6a76b0;border-radius:4px;font-size:10px;color:#cfd8ff';
        lead.onclick = (e) => { e.stopPropagation(); setTeamLead([dex].concat(chosen().filter((d) => d !== dex))); };
        c.appendChild(lead);
      }
      for(const [label,delta]of [['←',-1],['→',1]]){if(i+delta<0||i+delta>=team.length)continue;const b=document.createElement('button');b.type='button';b.textContent=label;b.setAttribute('aria-label','Move '+nameOf(dex)+' '+(delta<0?'earlier':'later'));b.onclick=e=>{e.stopPropagation();const list=chosen(),j=list.indexOf(dex);[list[j],list[j+delta]]=[list[j+delta],list[j]];setTeamLead(list);};c.append(b);}
      tb.appendChild(c);
    }
    renderList();
  }
  // (changing the lead changes your partner)
  function setTeamLead(list) {
    setTeam(list);
  }
  function renderList() {
    const el = st.el;
    if (!el) return;
    const q = (el.querySelector('[data-q]').value || '').toLowerCase().trim();
    const team = chosen();
    const list = el.querySelector('[data-list]');
    list.innerHTML = '';
    const sv = R().DB.save || {};
    const all = Object.keys(sv.owned || {}).map(Number).filter((d) => R().DEX_BY[d] && !team.includes(d)).filter((d) => !q || nameOf(d).toLowerCase().includes(q) || ((R().DEX_BY[d].types || []).join(' ').includes(q))).sort((a, b) => a - b);
    for (const dex of all.slice(0, 240)) {
      const c = card(dex);
      c.querySelector('button').onclick = () => { const t = chosen(); if (t.length >= MAX) { c.style.borderColor = '#ff6a6a'; return; } setTeam(t.concat([dex])); };
      list.appendChild(c);
    }
    if (all.length > 240) { const m = document.createElement('div'); m.style.cssText = 'grid-column:1/-1;opacity:.6;font-size:12px'; m.textContent = T('… type to search the rest (' + all.length + ' in all)', '… escribe para buscar el resto (' + all.length + ')'); list.appendChild(m); }
    if (!all.length) { const m = document.createElement('div'); m.style.cssText = 'grid-column:1/-1;opacity:.6;font-size:12px'; m.textContent = T('No other Pokémon yet: defeat wild ones to have them join you.', 'Aún no tienes más Pokémon: derrota a los salvajes para que se unan a ti.'); list.appendChild(m); }
  }
  function open() { if (!st.el) build(); st.el.style.display = 'flex'; render(); }
  function close() { if (st.el) st.el.style.display = 'none';window.PS_DEXPLUS?.refresh?.(); try { if (R().MenuUI && R().MenuUI.refresh) R().MenuUI.refresh(); } catch (e) { /* ignore */ } }
  function addMenuButton() {
    const list = document.querySelector('.menu-list');
    if (!list || document.getElementById('psx-team-btn')) return;
    const b = document.createElement('button');
    b.id = 'psx-team-btn'; b.className = 'menu-item'; b.dataset.sfx = 'click';
    b.innerHTML = '<span class="mi-ico">' + ticon('team', 32, 'display:block') + '</span>' + T('Team', 'Equipo') + '<small>' + T('Your six Pokémon, switched in and out', 'Tus seis Pokémon, para cambiar en partida') + '</small>';
    b.onclick = (e) => { e.stopPropagation(); open(); };
    list.insertBefore(b, list.children[1] || null);
  }

  // ---------------------------------------------------------------- wiring
  function install(r) {
    if (st.hooked) return;
    st.hooked = true;
    sync();
    addMenuButton();
    setInterval(addMenuButton, 1500); // (the menu is rebuilt now and then)
    addEventListener('keydown', (ev) => {
      if (!on() || ev.repeat || (ev.code !== 'KeyZ' && ev.code !== 'KeyX')) return;
      const t = ev.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      const p = r.Game.player;
      if (!p || r.Game.state !== 'playing' || !st.run) return;
      if (step(ev.code === 'KeyX' ? 1 : -1)) {ev.preventDefault();ev.stopImmediatePropagation();}
    }, true);
    addEventListener('click', (ev) => { try { onClick(ev); } catch (e) { AI.warn('team-click', e); } }, true);
    // the one out faints: the next healthy one comes in, unless the whole team is down
    const PP = r.Player.prototype, oHurt = PP.hurt;
    PP.hurt = function () {
      const out = oHurt.apply(this, arguments);
      if (on() && this.dead && this === r.Game.player && st.run && st.run.p === this) {
        const i = nextHealthy();
        if (i >= 0) { try { this.anim && this.anim.play && this.anim.play('Idle'); } catch (e) { /* ignore */ } switchTo(i, true); }
      }
      return out;
    };
  }

  AI.define('Team', { st, MAX, install, tick, drawScreen, open, close, chosen, setTeam, shinyFor, setShiny, switchTo, step, startRun, cur, nextHealthy, onLevel, get run() { return st.run; } });
})();
