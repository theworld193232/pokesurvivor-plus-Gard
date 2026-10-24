/* Friend Living World AI 95-render.js: original cached pixel emotes and
   wordless speech bubbles, isolated for Gard. No render-transform installer. */
(()=>{'use strict';
  const ICON_PX = 16;
  const iconCache = new Map();
  const C = { ink: '#2a1f2e', red: '#ff4d6d', pink: '#ff8fc8', yel: '#ffd23f', blue: '#5ab8ff', lblue: '#bfe6ff', white: '#ffffff', grey: '#8f96a8', orange: '#ff9a3d', green: '#6fdc8c', purple: '#b48cff' };
  const painters = {
    love(g) { heart(g, 8, 9, 6, C.pink); heart(g, 12, 4, 3, C.red); },
    heart(g) { heart(g, 8, 9, 7, C.red); },
    happy(g) { face(g, C.yel); g.fillStyle = C.ink; g.fillRect(5, 6, 2, 2); g.fillRect(9, 6, 2, 2); g.fillRect(5, 10, 6, 1); g.fillRect(4, 9, 1, 1); g.fillRect(11, 9, 1, 1); },
    smirk(g) { face(g, C.purple); g.fillStyle = C.ink; g.fillRect(5, 6, 2, 1); g.fillRect(9, 6, 2, 1); g.fillRect(6, 10, 5, 1); g.fillRect(11, 9, 1, 1); },
    question(g) { g.fillStyle = C.blue; g.fillRect(5, 2, 6, 2); g.fillRect(10, 4, 2, 3); g.fillRect(8, 7, 3, 2); g.fillRect(7, 9, 2, 2); g.fillRect(7, 12, 2, 2); },
    anger(g) {
      g.fillStyle = C.red;
      for (const [x, y] of [[3, 3], [10, 3], [3, 10], [10, 10]]) { g.fillRect(x, y + 1, 3, 1); g.fillRect(x + 1, y, 1, 3); }
      g.fillRect(6, 6, 4, 1); g.fillRect(6, 9, 4, 1); g.fillRect(6, 6, 1, 4); g.fillRect(9, 6, 1, 4);
    },
    surprise(g) { g.fillStyle = C.red; g.fillRect(4, 2, 3, 8); g.fillRect(9, 2, 3, 8); g.fillRect(4, 12, 3, 2); g.fillRect(9, 12, 3, 2); },
    alert(g) { g.fillStyle = C.orange; g.fillRect(6, 2, 4, 8); g.fillRect(6, 12, 4, 2); },
    scared(g) { face(g, C.lblue); g.fillStyle = C.ink; g.fillRect(4, 5, 3, 3); g.fillRect(9, 5, 3, 3); g.fillStyle = C.white; g.fillRect(5, 6, 1, 1); g.fillRect(10, 6, 1, 1); g.fillStyle = C.ink; g.fillRect(6, 10, 4, 3); g.fillStyle = C.blue; g.fillRect(12, 2, 2, 3); },
    tear(g) { drop(g, 8, 3, C.blue); g.fillStyle = C.white; g.fillRect(6, 8, 1, 2); },
    sad(g) { face(g, C.lblue); g.fillStyle = C.ink; g.fillRect(5, 6, 2, 1); g.fillRect(9, 6, 2, 1); g.fillRect(5, 11, 6, 1); g.fillRect(4, 12, 1, 1); g.fillRect(11, 12, 1, 1); g.fillStyle = C.blue; g.fillRect(5, 8, 1, 2); },
    zzz(g) { g.fillStyle = C.blue; z(g, 2, 8, 6); z(g, 8, 3, 5); g.fillStyle = C.lblue; z(g, 11, 0, 3); },
    swirl(g) {
      g.strokeStyle = C.purple; g.lineWidth = 2; g.beginPath();
      for (let a = 0; a < 12.5; a += 0.3) { const r = a * 0.55; const x = 8 + Math.cos(a) * r, y = 8 + Math.sin(a) * r; a ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke();
    },
    food(g) { g.fillStyle = '#c8772e'; g.beginPath(); g.ellipse(9, 7, 5, 4, -0.5, 0, 6.283); g.fill(); g.fillStyle = '#f2b06a'; g.fillRect(7, 5, 3, 2); g.fillStyle = C.white; g.fillRect(2, 11, 4, 2); g.fillRect(4, 9, 2, 3); g.fillRect(1, 12, 2, 2); },
    sweat(g) { drop(g, 5, 2, C.lblue); drop(g, 11, 7, C.blue); },
    eyes(g) { for (const x of [3, 9]) { g.fillStyle = C.white; g.fillRect(x, 4, 5, 8); g.fillStyle = C.ink; g.fillRect(x, 4, 5, 1); g.fillRect(x, 11, 5, 1); g.fillRect(x, 4, 1, 8); g.fillRect(x + 4, 4, 1, 8); g.fillRect(x + 2, 7, 2, 3); } },
    sparkle(g) { star(g, 6, 7, 5, C.yel); star(g, 12, 3, 3, C.white); star(g, 12, 12, 2, C.yel); },
    note(g) { g.fillStyle = C.green; g.fillRect(9, 2, 2, 9); g.fillRect(11, 2, 3, 2); g.beginPath(); g.ellipse(8, 11, 3, 2.4, -0.4, 0, 6.283); g.fill(); g.fillRect(3, 5, 2, 6); g.beginPath(); g.ellipse(3, 11, 2.2, 1.8, -0.4, 0, 6.283); g.fill(); },
    dots(g) { g.fillStyle = C.grey; g.fillRect(2, 8, 3, 3); g.fillRect(7, 8, 3, 3); g.fillRect(12, 8, 3, 3); },
  };
  function face(g, col) { g.fillStyle = col; g.beginPath(); g.arc(8, 8, 6.5, 0, 6.283); g.fill(); g.strokeStyle = C.ink; g.lineWidth = 1; g.stroke(); }
  function heart(g, cx, cy, s, col) { g.fillStyle = col; g.beginPath(); g.moveTo(cx, cy + s * 0.75); g.bezierCurveTo(cx - s * 1.4, cy - s * 0.2, cx - s * 0.6, cy - s * 1.2, cx, cy - s * 0.35); g.bezierCurveTo(cx + s * 0.6, cy - s * 1.2, cx + s * 1.4, cy - s * 0.2, cx, cy + s * 0.75); g.fill(); }
  function drop(g, x, y, col) { g.fillStyle = col; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 4, y + 6, x, y + 8); g.quadraticCurveTo(x - 4, y + 6, x, y); g.fill(); }
  function z(g, x, y, s) { g.fillRect(x, y, s, 1); g.fillRect(x, y + s - 1, s, 1); for (let i = 0; i < s; i++) g.fillRect(x + s - 1 - i, y + i, 1, 1); }
  function star(g, cx, cy, r, col) { g.fillStyle = col; g.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr = i % 2 ? r * 0.35 : r; g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } g.closePath(); g.fill(); }

  function icon(name) {
    let c = iconCache.get(name);
    if (c) return c;
    c = document.createElement('canvas');
    c.width = c.height = ICON_PX;
    const g = c.getContext('2d');
    (painters[name] || painters.dots)(g);
    iconCache.set(name, c);
    return c;
  }

  function bubble(ctx, x, y, name, k = 1, alpha = 1) {
    const s = 1 * k;
    const w = 22 * s, h = 20 * s;
    const bx = Math.round(x - w / 2), by = Math.round(y - h);
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#2a1f2e';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const r = 6 * s;
    ctx.moveTo(bx + r, by);
    ctx.arcTo(bx + w, by, bx + w, by + h, r);
    ctx.arcTo(bx + w, by + h, bx, by + h, r);
    ctx.lineTo(bx + w / 2 + 3 * s, by + h);
    ctx.lineTo(bx + w / 2, by + h + 4 * s);
    ctx.lineTo(bx + w / 2 - 3 * s, by + h);
    ctx.arcTo(bx, by + h, bx, by, r);
    ctx.arcTo(bx, by, bx + w, by, r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.imageSmoothingEnabled = false;
    const is = 16 * s;
    ctx.drawImage(icon(name), Math.round(bx + (w - is) / 2), Math.round(by + (h - is) / 2), is, is);
    ctx.restore();
  }


window.PS_WILDLIFE_EMOTES={bubble,icon};
})();
