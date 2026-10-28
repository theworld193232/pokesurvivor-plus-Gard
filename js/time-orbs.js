/* TIME ORBS — defeated enemies sometimes drop an orb that fast-forwards the run clock, so you reach Arceus sooner.
   small (blue) +15 seconds (5% of KOs)
   medium (purple) +1 minute (1% of KOs)
   large (gold) +5 minutes (0.1% of KOs)
   [Gard v90 Balance Fix]: Picking up a Time Orb now also grants proportional catch-up EXP so fast-forwarding the enemy scaling clock never leaves first-stage starters under-leveled. */
(() => {
  'use strict';
  const R = () => window.__PSX_REG__;
  const ORBS = [
    { kind: 'large', chance: 0.001, sec: 300, col: '#ffd23f', glow: 'rgba(255,210,63,0.55)', r: 10, label: '+5:00', xpMult: 3.5 },
    { kind: 'medium', chance: 0.01, sec: 60, col: '#b05aff', glow: 'rgba(176,90,255,0.5)', r: 8, label: '+1:00', xpMult: 1.2 },
    { kind: 'small', chance: 0.05, sec: 15, col: '#4da6ff', glow: 'rgba(77,166,255,0.45)', r: 6, label: '+0:15', xpMult: 0.35 }
  ];
  const drops = [];
  let hooked = false, lastTs = 0;

  function grantCatchupExp(p, orb) {
    if (!p) return;
    try {
      const need = Number(p.xpNeed || p.nextXp || p.maxXp) || Math.max(20, (Number(p.level || p.lv) || 1) * 18);
      const bonusXp = Math.max(5, Math.round(need * orb.xpMult));
      if (typeof p.gainXp === 'function') p.gainXp(bonusXp);
      else if (typeof p.addXp === 'function') p.addXp(bonusXp);
      else if (typeof R()?.Game?.addXp === 'function') R().Game.addXp(bonusXp);
      else if (typeof p.xp === 'number') p.xp += bonusXp;
    } catch (_) {}
  }

  function advanceClock(sec) {
    const G = R()?.Game;
    if (!G) return;
    if (typeof G.time === 'number') G.time += sec;
    else if (typeof G.elapsed === 'number') G.elapsed += sec;
    else if (typeof G.t === 'number') G.t += sec;
  }

  function install() {
    const reg = R();
    if (hooked || !reg || !reg.Enemy || !reg.Weather) return false;
    hooked = true;

    const EP = reg.Enemy.prototype;
    const origDie = EP.die || EP.onDeath || EP.kill;
    if (typeof origDie === 'function') {
      const methodName = EP.die ? 'die' : EP.onDeath ? 'onDeath' : 'kill';
      EP[methodName] = function (...args) {
        const res = origDie.apply(this, args);
        try {
          if (reg.Game?.state === 'playing' && !this.__timeOrbRolled) {
            this.__timeOrbRolled = true;
            const roll = Math.random();
            for (const o of ORBS) {
              if (roll < o.chance) {
                drops.push({ x: this.x, y: this.y, t: 0, orb: o });
                break;
              }
            }
          }
        } catch (_) {}
        return res;
      };
    }

    const origReset = reg.World?.reset;
    if (typeof origReset === 'function') {
      reg.World.reset = function (...args) {
        drops.length = 0;
        return origReset.apply(this, args);
      };
    }

    const origDraw = reg.Weather.draw;
    reg.Weather.draw = function (ctx, ...args) {
      const res = origDraw.call(this, ctx, ...args);
      try {
        const G = reg.Game, p = G?.player, cam = reg.Camera;
        if (!p || G?.state !== 'playing' || !cam) return res;
        const now = performance.now(), dt = Math.min(0.05, lastTs ? (now - lastTs) / 1000 : 0.016);
        lastTs = now;
        const z = cam.scale || 1;
        for (let i = drops.length - 1; i >= 0; i--) {
          const d = drops[i];
          d.t += dt;
          if (d.t > 45) { drops.splice(i, 1); continue; }
          const dx = p.x - d.x, dy = p.y - d.y, dist = Math.hypot(dx, dy);
          const pullR = Number(p.pickupRange || p.magnet) || 95;
          if (dist < pullR) {
            const spd = Math.max(180, (pullR - dist) * 4.5);
            d.x += (dx / (dist || 1)) * spd * dt;
            d.y += (dy / (dist || 1)) * spd * dt;
          }
          if (dist < 22) {
            advanceClock(d.orb.sec);
            grantCatchupExp(p, d.orb);
            try { reg.FX?.floatText?.(p.x, p.y - 24, d.orb.label + ' & EXP!', d.orb.col); } catch (_) {}
            drops.splice(i, 1);
            continue;
          }
          const sx = (d.x - cam.left()) * z, sy = (d.y - cam.top()) * z + Math.sin(d.t * 4) * 3 * z;
          const r = d.orb.r * z;
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 2.2);
          g.addColorStop(0, d.orb.glow);
          g.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(sx, sy, r * 2.2, 0, Math.PI * 2); ctx.fill();
          ctx.globalCompositeOperation = 'source-over';
          ctx.fillStyle = d.orb.col;
          ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath(); ctx.arc(sx - r * 0.3, sy - r * 0.3, r * 0.3, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
        }
      } catch (_) {}
      return res;
    };
    return true;
  }

  (function wait() {
    if (!install()) requestAnimationFrame(wait);
  })();
})();
