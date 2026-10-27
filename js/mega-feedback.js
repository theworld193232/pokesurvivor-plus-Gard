/* [Gard v81] Space with no Mega: say why instead of doing nothing.
   The game's rules (js/ai/92-power.js): beat Act 3 (Tropical Ocean), then hold the Pokémon's Mega Stone;
   after a Mega there's a cooldown. Near a boat Space belongs to the boat (34-boats.js), so we stay quiet there. */
(() => {
  'use strict';
  const R = () => window.__PSX_REG__, AI = () => window.PSXAI;
  const es = () => { try { return AI()?.lang?.() === 'es'; } catch (_) { return false; } };
  const T = (en, sp) => es() ? sp : en;
  let lastSay = 0;
  function say(text) {
    const now = performance.now(); if (now - lastSay < 1600) return; lastSay = now;
    try { R().UI.toast(text, 2200); } catch (_) { try { R().FX.dmgText(R().Game.player.x, R().Game.player.y - 60, text, '#ffd23f', true); } catch (__) {} }
  }
  function reason(p) {
    const r = R(), M = r.Mega, P = AI()?.Power, name = p.mon?.name || 'This Pokémon';
    if (Number(p.megaCd) > 0) return T('Mega Evolution is recharging (' + Math.ceil(p.megaCd) + 's)', 'La Megaevolución se está recargando (' + Math.ceil(p.megaCd) + 's)');
    let forms = []; try { forms = M.formsOf(p.dex) || []; } catch (_) {}
    if (!forms.length) return T(name + " can't Mega Evolve", name + ' no puede megaevolucionar');
    if (P && P.megaStage && !P.megaStage()) return T('Mega Evolution unlocks after you beat the Tropical Ocean (Act 3)', 'La Megaevolución se desbloquea al superar el Océano Tropical (Acto 3)');
    if (P && P.formOf && !P.NO_ITEM?.has?.(forms[0])) { const held = P.formOf(p.item); if (!held || !forms.includes(held)) return T('Hold ' + name + "'s Mega Stone to Mega Evolve", 'Equipa la Megapiedra de ' + name + ' para megaevolucionar'); }
    return T("Mega Evolution isn't ready yet", 'La Megaevolución aún no está lista');
  }
  addEventListener('keydown', ev => {
    if (ev.code !== 'Space' || ev.repeat) return;
    const t = ev.target; if (t && /INPUT|TEXTAREA|SELECT/.test(t.tagName || '')) return;
    const r = R(); if (!r || r.Game.state !== 'playing') return;
    const p = r.Game.player; if (!p || p.dead || p.megaForm || p.megaKey) return;
    try { if (AI()?.Boats?.spaceIsBoat?.()) return; } catch (_) {}
    setTimeout(() => { try { if (r.Game.state === 'playing' && !p.megaForm && !p.megaKey && !p.dead) say(reason(p)); } catch (_) {} }, 160);
  });
})();
