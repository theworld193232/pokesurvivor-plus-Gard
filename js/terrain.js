/* TERRAIN + BIOME REGIONS
   Terrain generators taken from the newer PokéSurvivor's js/world/layouts.js (by Reed Liu), plus big biome regions (v59):
   the world is split into areas about 150 tiles across. Each one is a real biome with its own terrain shape,
   ground colors, liquid (water, lava, ice, quicksand, electric pools), trees and ground details:
     Shady Forest, Flower Meadow, Sunny Beach (palm trees), Lava Fields (charred trees), Power Plant (power poles
     and wires), Red Desert (cacti), Frozen Glacier (snowy pines), Emerald Jungle, Old Graveyard (graves),
     Crystal Caves, Sea Grotto.
   You start in the middle of the map's own biome (about 55 tiles of it in every direction). The borders blend
   over a strip of open ground. Rift arenas, Safe Zones, Area Zero and co-op keep the original world.
   Everything is deterministic from the run seed. Needs the PS_TERRAIN and PS_PROP_AT hooks in js/app.min.js. */
(() => {
  'use strict';
  if (window.PS_TERRAIN_INSTALLED) return; window.PS_TERRAIN_INSTALLED = true;
  function install(G) {
/* ============ layouts.js — cómo se genera el terreno de cada bioma ============
 *
 * Cada bioma de la run tiene su forma de terreno, no sólo sus colores
 * (inspirado en Mundo Misterioso):
 *   plains  campo abierto con charcas y rocas (lo de siempre)
 *   cave    cueva de salas rectangulares al azar (se pisan) y pasillos rectos
 *   islands islas grandes y pequeñas unidas por puentes cortos, islotes de paso o vados
 *   bog     las mismas islas, todo unido por puentes (el pantano venenoso: nada de vadear)
 *   marsh   pantano: ríos de agua que frena, más que los de lava
 *   plant   la cueva con las charcas lejos de las paredes (para la central: su líquido quema)
 *   lava    ríos de lava serpenteantes con puentes de piedra
 *
 * Cada uno se hace con su ancla { tx, ty } (make): el sitio donde empieza, que
 * es parte de sus reglas, no un hueco a la fuerza: la sala, la isla o el trozo
 * de tierra del principio están ahí, unidos a los demás como cualquier otro
 * (al empezar la run, el 0,0; al cambiar de bioma, donde está el jugador). Y un
 * claro de 9 casillas alrededor.
 * Todo es determinista (sólo depende de la casilla y la semilla), así en
 * cooperativo cada uno genera el mismo mapa. world.js decide qué generador
 * va en cada casilla (y el cambio de uno a otro con la onda del bioma).
 *
 *   terrain(tx, ty, seed)  0 suelo · 1 pared · 2 líquido
 *   edgeProp(tx, ty, seed, at?) objeto que el generador pone en esta casilla
 *                          de suelo (`at(tx, ty)` da el terreno ya calculado):
 *                          'tree' (sólido), 'grass' (no bloquea) o null
 *                          (en la cueva, los cristales del borde de las paredes)
 *   liquidHurts            su líquido hace daño (en el juego lo decide la
 *                          paleta del bioma; aquí, para las pruebas)
 *
 * Pasillos y puentes dejan al menos 4 casillas
 * libres (cabe el Pokémon más grande, 104 px) y no quedan zonas cerradas
 * (tests/worldgen.test.cjs). world.js no pone objetos sólidos al azar donde
 * no haya sitio de sobra (ver placeProps).
 */
G.Layouts = G.Layouts || (() => {
  const FLOOR = 0, WALL = 1, LIQUID = 2;
  const H = (x, y, s) => G.U.hash(x, y, s);

  function vnoise(x, y, s) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = H(xi, yi, s), b = H(xi + 1, yi, s), c = H(xi, yi + 1, s), d = H(xi + 1, yi + 1, s);
    return (a + (b - a) * u) * (1 - v) + (c + (d - c) * u) * v;
  }
  const fbm = (x, y, s) => vnoise(x, y, s) * 0.65 + vnoise(x * 2.13 + 17, y * 2.13 - 9, s + 1) * 0.35;

  /**
   * Lo de cada punto de la rejilla (centro, tamaño...) se calcula una vez y se
   * guarda: cada casilla mira las 9 celdas de alrededor, y un chunk son 256.
   * Una caché por semilla (hasta SEEDS a la vez), con tope (se vacía entera al llenarse).
   */
  const SEEDS = 4;
  function cellCache(make, max = 4096) {
    const bySeed = new Map();
    return (i, j, s) => {
      let map = bySeed.get(s);
      if (!map || map.size > max) {
        if (!map && bySeed.size >= SEEDS) bySeed.delete(bySeed.keys().next().value);
        map = new Map();
        bySeed.set(s, map);
      }
      const k = (i + 32768) * 65536 + (j + 32768);
      let c = map.get(k);
      if (!c) { c = make(i, j, s); map.set(k, c); }
      return c;
    };
  }

  /** Cuántas de sus 8 vecinas son pared. */
  function wallsAround(at, tx, ty) {
    let n = 0;
    for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) {
      if ((a || b) && at(tx + a, ty + b) === WALL) n++;
    }
    return n;
  }

  /**
   * Adornos del borde: árbol (o cristal, o tronco seco: lo dibuja el bioma) en
   * los rincones con CORNER o más paredes alrededor, y hierba alta con
   * probabilidad `grass` en el resto del borde.
   */
  const CORNER = 5;
  function edgeProps(lay, grass) {
    return (tx, ty, seed, at = (x, y) => lay.terrain(x, y, seed)) => {
      if (at(tx, ty) !== FLOOR) return null;
      const n = wallsAround(at, tx, ty);
      if (n >= CORNER) return 'tree';
      return n > 0 && H(tx, ty, seed + 1301) < grass ? 'grass' : null;
    };
  }

  // ---------------- campo abierto (el de siempre) ----------------

  const plainsAt = A => ({
    liquidHurts: false,
    terrain(tx, ty, seed) {
      const d = Math.hypot(tx - A.tx, ty - A.ty);
      if (d < 9) return FLOOR;                          // claro inicial
      const ramp = G.U.clamp((d - 9) / 8, 0, 1);       // aparición suave
      if (fbm(tx / 13, ty / 13, seed + 101) < 0.04 + 0.23 * ramp) return LIQUID;
      if (fbm(tx / 8, ty / 8, seed + 202) > 1 - 0.27 * ramp) return WALL;
      return FLOOR;
    },
    edgeProp: () => null
  });

  // ---------------- salas y pasillos: la cueva ----------------
  /*
   * Como el plano de una mazmorra: salas rectangulares de tamaño y forma al azar
   * (de cuadradas a alargadas), repartidas sin rejilla a la vista (cada celda de
   * `cell` casillas tiene una con `keep`, en cualquier punto) y que a veces se
   * pisan, así salen espacios irregulares en L, en T, escalonados...
   * Se unen con pasillos de `w` = [mín, máx] de ancho (cada uno el suyo): recto
   * si las dos salas se miran de frente (sus lados se solapan lo bastante), en L si no.
   * Qué salas se unen: el grafo de vecindad relativa de sus centros (dos se unen
   * si no hay una tercera más cerca de las dos que ellas entre sí). Ese grafo las
   * une todas (contiene el árbol de expansión mínimo) y da callejones y cruces en
   * T; con `loop`, algunas uniones más del grafo de Gabriel cierran vueltas.
   * Lo de fuera es `outside` (la roca), y sus bordes no son rectos: con ruido, el
   * suelo se come hasta `grow` (salas) o `growH` (pasillos) casillas, a trozos.
   * Sólo crece, nunca encoge: los pasillos siguen teniendo su ancho mínimo libre
   * y nada se cierra.
   *   inside(tx, ty, r, seed, edge)  qué hay dentro de una sala (a `edge` del borde)
   *   wetHalls  las charcas de dentro tapan también los pasillos (si su líquido no quema)
   */
  const ROOM_REACH = 3, ROOM_BLOCK = 16;
  const d2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
  /** Rectángulo de casillas (inclusivo). */
  const box = (x0, y0, x1, y1) => ({ x0: Math.min(x0, x1), y0: Math.min(y0, y1), x1: Math.max(x0, x1), y1: Math.max(y0, y1) });

  function rooms(o) {
    const S = o.salt, A = o.anchor, ai = Math.floor(A.tx / o.cell), aj = Math.floor(A.ty / o.cell);

    /** Sala de la celda (i, j), o null. Centro y medio ancho/alto en casillas enteras. La del principio, en el ancla. */
    const room = cellCache((i, j, s) => {
      if (i === ai && j === aj) return { i, j, x: A.tx, y: A.ty, hw: 7, hh: 6, start: true, k: 1 };
      if (H(i, j, s + S + 1) > o.keep) return null;
      const r = o.size[0] + H(i, j, s + S + 2) * (o.size[1] - o.size[0]);
      const asp = Math.pow(o.aspect, H(i, j, s + S + 3) * 2 - 1);
      return { i, j, x: Math.floor((i + 0.1 + H(i, j, s + S + 4) * 0.8) * o.cell), y: Math.floor((j + 0.1 + H(i, j, s + S + 5) * 0.8) * o.cell),
               hw: Math.max(2, Math.round(r * asp)), hh: Math.max(2, Math.round(r / asp)), start: false, k: H(i, j, s + S + 6) };
    });

    function around(i, j, k, s) {
      const out = [];
      for (let b = j - k; b <= j + k; b++) for (let a = i - k; a <= i + k; a++) {
        const q = room(a, b, s);
        if (q) out.push(q);
      }
      return out;
    }

    /**
     * Pasillo de la sala a a la b: recto si se miran de frente (de centro a
     * centro, a una altura o columna al azar de la parte que comparten), en L si
     * no (por la esquina de un lado o del otro, al azar).
     */
    function corridor(a, b, k, s) {
      // Su ancho (al azar entre los de `w`); en el eje c ocupa [c-LO, c-LO+W-1].
      const W = o.w[0] + Math.floor(H(k, 11, s + S + 10) * (o.w[1] - o.w[0] + 1)), LO = Math.floor(W / 2);
      const ox0 = Math.max(a.x - a.hw, b.x - b.hw) + 1, ox1 = Math.min(a.x + a.hw, b.x + b.hw) - 1;
      const oy0 = Math.max(a.y - a.hh, b.y - b.hh) + 1, oy1 = Math.min(a.y + a.hh, b.y + b.hh) - 1;
      const pick = (lo, hi) => lo + Math.floor(H(k, 5, s + S + 7) * (hi - lo + 1));
      if (ox1 - ox0 + 1 >= W) {                                 // uno encima del otro: vertical
        const x = pick(ox0, ox1 - W + 1);
        return [box(x, a.y, x + W - 1, b.y)];
      }
      if (oy1 - oy0 + 1 >= W) {                                 // uno al lado del otro: horizontal
        const y = pick(oy0, oy1 - W + 1);
        return [box(a.x, y, b.x, y + W - 1)];
      }
      // En L: horizontal desde una y vertical hasta la otra. La esquina, una casilla
      // más por fuera: si le sale un adorno en el rincón, sigue cabiendo W.
      const [p, q] = H(k, 6, s + S + 8) < 0.5 ? [a, b] : [b, a];
      const ex = q.x > p.x ? 1 : -1, ey = q.y > p.y ? -1 : 1;  // hacia fuera de la esquina
      const h = box(p.x - LO, p.y - LO, q.x - LO + W - 1, p.y - LO + W - 1);
      const v = box(q.x - LO, p.y - LO, q.x - LO + W - 1, q.y - LO + W - 1);
      const c = box(q.x - LO, p.y - LO, q.x - LO + W - 1, p.y - LO + W - 1);
      return [h, v, box(c.x0 + Math.min(0, ex), c.y0 + Math.min(0, ey), c.x1 + Math.max(0, ex), c.y1 + Math.max(0, ey))];
    }

    /** Pasillos que salen de la sala de la celda hacia salas de celdas "mayores" (así cada uno se guarda una vez). */
    const edges = cellCache((i, j, s) => {
      const p = room(i, j, s);
      if (!p) return [];
      const near = around(i, j, ROOM_REACH + 1, s);
      const out = [];
      for (const q of near) {
        if (q.j < j || (q.j === j && q.i <= i)) continue;
        if (Math.abs(q.i - i) > ROOM_REACH || Math.abs(q.j - j) > ROOM_REACH) continue;
        const pq = d2(p, q);
        let rng = true, gabriel = true;
        for (const r of near) {
          if (r === p || r === q) continue;
          const da = d2(p, r), db = d2(q, r);
          if (da + db < pq) { gabriel = false; rng = false; break; }  // dentro del círculo de diámetro pq
          if (da < pq && db < pq) rng = false;                         // dentro de la "luna"
        }
        const k = (i * 73856093) ^ (j * 19349663) ^ (q.i * 83492791) ^ (q.j * 2971215073);
        if (rng || (gabriel && H(k, 3, s + S + 9) < o.loop)) out.push(...corridor(p, q, k, s));
      }
      return out;
    }, 2048);

    /** Lo que puede tocar un bloque de ROOM_BLOCK casillas (un chunk de world.js): sus salas y sus pasillos. */
    const block = cellCache((bi, bj, s) => {
      const B = ROOM_BLOCK, x0 = bi * B, y0 = bj * B, x1 = x0 + B - 1, y1 = y0 + B - 1;
      const reach = ROOM_REACH + 1, g = o.grow, gh = o.growH;
      const rs = [], halls = [];
      for (let j = Math.floor(y0 / o.cell) - reach; j <= Math.floor(y1 / o.cell) + reach; j++) {
        for (let i = Math.floor(x0 / o.cell) - reach; i <= Math.floor(x1 / o.cell) + reach; i++) {
          const r = room(i, j, s);
          if (r && r.x + r.hw + g >= x0 && r.x - r.hw - g <= x1 && r.y + r.hh + g >= y0 && r.y - r.hh - g <= y1) rs.push(r);
          for (const h of edges(i, j, s)) if (h.x1 + gh >= x0 && h.x0 - gh <= x1 && h.y1 + gh >= y0 && h.y0 - gh <= y1) halls.push(h);
        }
      }
      return { rooms: rs, halls };
    });

    /**
     * Una pasada final, por bloques (un chunk de world.js): las rendijas de una
     * casilla (suelo entre dos paredes, de frente) se cierran: parecen un paso y
     * no cabe nadie. Los pasillos (de 4+) no tienen ninguna casilla así: nada se
     * corta. Varias pasadas (al cerrar una rendija puede quedar otra al lado):
     * el terreno de antes, una vez por casilla con un borde de PASSES, y el
     * resultado guardado.
     */
    const SB = ROOM_BLOCK, PASSES = 3;
    function closeSlits(g, n) {
      const m = n - 2, out = new Uint8Array(m * m);
      const at = (i, j) => g[j * n + i];
      for (let j = 1; j < n - 1; j++) for (let i = 1; i < n - 1; i++) {
        const t = at(i, j);
        const slit = t !== WALL && ((at(i - 1, j) === WALL && at(i + 1, j) === WALL) || (at(i, j - 1) === WALL && at(i, j + 1) === WALL));
        out[(j - 1) * m + i - 1] = slit ? WALL : t;
      }
      return out;
    }
    const finalBlock = cellCache((bi, bj, seed) => {
      const n = SB + 2 * PASSES, x0 = bi * SB - PASSES, y0 = bj * SB - PASSES;
      let g = new Uint8Array(n * n);
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) g[j * n + i] = roughTile(x0 + i, y0 + j, seed);
      for (let k = 0; k < PASSES; k++) g = closeSlits(g, n - 2 * k);
      return g;
    }, 1024);

    /** Dentro de una sala o de un pasillo, con el borde a trozos (la roca). */
    function roughTile(tx, ty, seed) {
      const blk = block(Math.floor(tx / ROOM_BLOCK), Math.floor(ty / ROOM_BLOCK), seed);
      // Cuánto de fuera se come el suelo aquí: manchas de ruido y, encima, algún mordisco suelto.
      const n = fbm(tx / 3.2, ty / 3.2, seed + S + 40) + (H(tx, ty, seed + S + 41) < 0.18 ? 0.35 : 0);
      const grow = Math.min(o.grow, Math.floor(n * (o.grow + 1)));
      const growH = Math.min(o.growH, Math.floor(n * (o.growH + 1)));
      const inRoom = r => Math.abs(tx - r.x) <= r.hw + grow && Math.abs(ty - r.y) <= r.hh + grow;
      const inner = r => o.inside(tx, ty, r, seed, Math.min(r.hw - Math.abs(tx - r.x), r.hh - Math.abs(ty - r.y)));
      // Con `wetHalls`, las charcas de las salas tapan también los pasillos que las cruzan (se vadean).
      if (o.wetHalls) for (const r of blk.rooms) if (!r.start && inRoom(r) && inner(r) === LIQUID) return LIQUID;
      // Los pasillos llegan hasta el centro de sus salas: por donde pasan, nada de lo de dentro.
      for (const h of blk.halls) {
        if (tx >= h.x0 - growH && tx <= h.x1 + growH && ty >= h.y0 - growH && ty <= h.y1 + growH) return FLOOR;
      }
      for (const r of blk.rooms) {
        if (!inRoom(r)) continue;
        return r.start ? FLOOR : inner(r);
      }
      return o.outside;
    }

    return {
      liquidHurts: false,
      terrain(tx, ty, seed) {
        const bi = Math.floor(tx / SB), bj = Math.floor(ty / SB);
        return finalBlock(bi, bj, seed)[(ty - bj * SB) * SB + (tx - bi * SB)];
      }
    };
  }

  /*
   * Cueva: salas de roca con pasillos de 4. Dentro, lejos de las paredes,
   * grupos de estalagmitas y, en tres de cada cuatro salas, una o dos charcas
   * pequeñas (los pasillos las cruzan: hacen de pasarela). Cristales en los rincones.
   *   ring  suelo libre entre las charcas y las paredes
   *   wet   las charcas tapan los pasillos (se vadean)
   *   pond  { n: cuántas por sala como mucho, r: [radio mín, máx] }
   * Con agua (se vadea), las charcas pisan los pasillos. Si el líquido quema (la
   * central eléctrica), los pasillos quedan secos: se cruza siempre en seco.
   */
  function caveOf(anchor, ring, wet, pond = { n: 2, r: [1.6, 3.6] }) {
    const lay = rooms({
      anchor, salt: 2100, cell: 18, keep: 0.72, loop: 0.3, w: [4, 6], grow: 2, growH: 1, size: [3, 6.5], aspect: 1.9, outside: WALL, wetHalls: wet,
      inside(tx, ty, r, seed, edge) {
        if (edge < Math.min(2, ring)) return FLOOR;                // anillo libre junto a las paredes
        if (r.k < 0.75 && edge >= ring) {
          const n = 1 + Math.floor(H(r.i, r.j, seed + 2135) * pond.n);
          const wob = 0.8 + 0.4 * fbm(tx / 2.5, ty / 2.5, seed + 2132);
          for (let c = 0; c < n; c++) {
            // Del tamaño que quepa en la sala (con `ring` hasta las paredes), y al menos de 1,2.
            const pr = Math.min(Math.min(r.hw, r.hh) - ring, pond.r[0] + H(r.i + c * 7, r.j, seed + 2136) * (pond.r[1] - pond.r[0]));
            if (pr < 1.2) continue;
            const rx = r.hw - ring - pr, ry = r.hh - ring - pr;     // cuánto se puede mover sin salir de su sitio
            const px = r.x + (H(r.i + c * 7, r.j, seed + 2133) - 0.5) * 2 * rx;
            const py = r.y + (H(r.i + c * 7, r.j, seed + 2134) - 0.5) * 2 * ry;
            if (Math.hypot(tx - px, ty - py) < pr * wob) return LIQUID;
          }
        }
        if (edge >= 3 && fbm(tx / 2.2, ty / 2.2, seed + 2131) > 0.8) return WALL;   // estalagmitas
        return FLOOR;
      }
    });
    lay.edgeProp = edgeProps(lay, 0.12);
    return lay;
  }
  const cave = A => caveOf(A, 2, true);
  /**
   * La misma cueva con los pasillos secos, para cuando su líquido quema (la
   * central: descarga). Charcas grandes y hasta tres por sala, hasta casi la
   * pared: a veces hay que rodearlas, pero los pasillos las cruzan en seco.
   */
  const plant = A => caveOf(A, 1, false, { n: 3, r: [2.2, 4.2] });

  // ---------------- islas ----------------
  /*
   * Islas grandes y pequeñas (elipses de tamaño, forma y giro al azar, que a veces
   * se pisan) en el agua, con la orilla suave. Cada celda de `cell` casillas tiene
   * una (con `keep`), en cualquier punto de ella; una de cada tantas (`big`),
   * grande (y alguna, enorme: más que la celda; se pisa con las vecinas).
   * Qué islas se unen: el grafo de vecindad relativa de sus centros (dos se unen
   * si no hay una tercera más cerca de las dos que ellas entre sí), que las une
   * todas. Para cada par, el agua que las separa en la recta entre sus centros:
   *   hasta `wade` casillas    nada: se vadea
   *   hasta `maxBridge`        un puente corto y recto de orilla a orilla (`bridge`
   *                            de ancho), o (con `stones`) uno o dos islotes de
   *                            paso, con 1–2 casillas de agua entre uno y otro
   *   más                      uno o dos islotes de paso, más grandes cuanto más
   *                            lejos (un puente así de largo parecería un pasillo);
   *                            sin `stones`, un puente igualmente
   * Así siempre se llega a todas partes andando o vadeando como mucho dos casillas.
   * Con wade = 0 y stones = 0 (el pantano venenoso), todo se une por tierra.
   */
  const ISLE_BLOCK = 16;
  function archipelago(o) {
    const S = o.salt, C = o.cell, A = o.anchor, ai = Math.floor(A.tx / C), aj = Math.floor(A.ty / C);
    /** Isla de la celda (i, j), o null: centro, semiejes y giro. La del principio, grande y en el ancla. */
    const isle = cellCache((i, j, s) => {
      if (i === ai && j === aj) return { i, j, x: A.tx + 0.5, y: A.ty + 0.5, rx: 9, ry: 8, c: 1, sn: 0 };
      if (H(i, j, s + S + 1) > o.keep) return null;
      // Grandes (de vez en cuando, enormes: el tamaño va al cuadrado) o pequeñas.
      const big = H(i, j, s + S + 2) < o.big, [r0, r1] = big ? o.bigR : o.smallR;
      const h = H(i, j, s + S + 3), r = r0 + (big ? h * h : h) * (r1 - r0);
      const asp = Math.pow(o.aspect, H(i, j, s + S + 4) * 2 - 1);
      const th = H(i, j, s + S + 5) * Math.PI;
      return { i, j, x: (i + 0.1 + H(i, j, s + S + 6) * 0.8) * C, y: (j + 0.1 + H(i, j, s + S + 7) * 0.8) * C,
               rx: r * asp, ry: r / asp, c: Math.cos(th), sn: Math.sin(th) };
    });
    /** Radio de la isla en la dirección (ux, uy). */
    const radius = (a, ux, uy) => {
      const u = (ux * a.c + uy * a.sn) / a.rx, v = (-ux * a.sn + uy * a.c) / a.ry;
      return 1 / Math.sqrt(u * u + v * v);
    };
    /** Cuánto le falta a (x, y) para entrar en la isla (≤ 0 dentro): a lo largo del radio. */
    function outside(a, x, y) {
      const dx = x - a.x, dy = y - a.y, d = Math.hypot(dx, dy);
      return d < 1e-6 ? -Math.min(a.rx, a.ry) : d - radius(a, dx / d, dy / d);
    }

    function around(i, j, k, s) {
      const out = [];
      for (let b = j - k; b <= j + k; b++) for (let a = i - k; a <= i + k; a++) {
        const q = isle(a, b, s);
        if (q) out.push(q);
      }
      return out;
    }

    /**
     * Lo que une a dos islas vecinas (de orilla a orilla en la recta entre sus
     * centros): nada, un puente { ax, ay, bx, by, half } o islotes { stones: [x, y, r]... }.
     */
    function link(a, b, k, s) {
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), ux = dx / d, uy = dy / d;
      const ra = radius(a, ux, uy), rb = radius(b, -ux, -uy), gap = d - ra - rb;
      if (gap <= o.wade) return null;
      // Las dos orillas (una casilla hacia dentro, para que el puente empiece en tierra).
      const ax = a.x + ux * (ra - 1), ay = a.y + uy * (ra - 1), bx = b.x - ux * (rb - 1), by = b.y - uy * (rb - 1);
      // Puente sólo si es corto (más largo parecería un pasillo): si no, islotes.
      if (!(o.stones && (gap > o.maxBridge || H(k, 21, s + S + 21) < o.stones))) {
        const half = (o.bridge[0] + H(k, 22, s + S + 22) * (o.bridge[1] - o.bridge[0])) / 2;
        return box({ ax, ay, bx, by, half }, Math.min(ax, bx) - half, Math.min(ay, by) - half, Math.max(ax, bx) + half, Math.max(ay, by) + half);
      }
      // Islotes de paso: uno o dos (nunca una ristra), con no más de MAXW casillas de
      // agua entre uno y otro y con las orillas. Si con dos de los pequeños no basta,
      // los dos más grandes (islitas), con WADE de agua entre cada uno.
      const MAXW = 2.2, WADE = 1.6;
      let sr = 1.7 + H(k, 23, s + S + 23) * 0.6;
      const n = gap - MAXW <= 2 * sr + MAXW ? 1 : 2;
      if (gap - 2 * sr * n > (n + 1) * MAXW) sr = (gap - (n + 1) * WADE) / (2 * n);
      const w = (gap - 2 * sr * n) / (n + 1);                        // agua entre cada dos
      const stones = [];
      for (let m = 0; m < n; m++) {
        const t = ra + w * (m + 1) + sr * (2 * m + 1);
        stones.push([a.x + ux * t, a.y + uy * t, sr]);
      }
      return box({ stones }, Math.min(ax, bx) - sr, Math.min(ay, by) - sr, Math.max(ax, bx) + sr, Math.max(ay, by) + sr);
    }
    function box(e, x0, y0, x1, y1) { return Object.assign(e, { x0, y0, x1, y1 }); }

    /** Uniones de la isla de la celda con las de celdas "mayores" (así cada una se guarda una vez). */
    const links = cellCache((i, j, s) => {
      const p = isle(i, j, s);
      if (!p) return [];
      const near = around(i, j, o.reach + 1, s), out = [];
      for (const q of near) {
        if (q.j < j || (q.j === j && q.i <= i)) continue;
        if (Math.abs(q.i - i) > o.reach || Math.abs(q.j - j) > o.reach) continue;
        const pq = d2(p, q);
        let rng = true;
        for (const r of near) {
          if (r !== p && r !== q && d2(p, r) < pq && d2(q, r) < pq) { rng = false; break; }
        }
        if (!rng) continue;
        const e = link(p, q, (i * 73856093) ^ (j * 19349663) ^ (q.i * 83492791) ^ (q.j * 2971215073), s);
        if (e) out.push(e);
      }
      return out;
    }, 2048);

    /** Lo que puede tocar un bloque de ISLE_BLOCK casillas (un chunk de world.js). */
    const block = cellCache((bi, bj, s) => {
      const B = ISLE_BLOCK, M = o.grow + 1;
      const x0 = bi * B - M, y0 = bj * B - M, x1 = (bi + 1) * B + M, y1 = (bj + 1) * B + M;
      const reach = o.reach + 1, isles = [], ways = [];
      for (let j = Math.floor(y0 / C) - reach; j <= Math.floor(y1 / C) + reach; j++) {
        for (let i = Math.floor(x0 / C) - reach; i <= Math.floor(x1 / C) + reach; i++) {
          const a = isle(i, j, s), r = a && Math.max(a.rx, a.ry);
          if (a && a.x + r > x0 && a.x - r < x1 && a.y + r > y0 && a.y - r < y1) isles.push(a);
          for (const e of links(i, j, s)) if (e.x1 > x0 && e.x0 < x1 && e.y1 > y0 && e.y0 < y1) ways.push(e);
        }
      }
      return { isles, ways };
    });

    /** Tierra o agua, antes de la pasada final. */
    function rawTile(tx, ty, seed) {
      const blk = block(Math.floor(tx / ISLE_BLOCK), Math.floor(ty / ISLE_BLOCK), seed);
      const x = tx + 0.5, y = ty + 0.5;
      // La orilla se ensancha poco a poco con un ruido ancho (sólo crece: las distancias de los vados, como mucho, encogen).
      const e = fbm(tx / 7, ty / 7, seed + S + 30) * o.grow;
      for (const a of blk.isles) {
        const out = outside(a, x, y);
        if (out > e) continue;
        // Dentro, lejos de la orilla, alguna roca suelta.
        return out < -3 && fbm(tx / 2.4, ty / 2.4, seed + S + 31) > 0.82 ? WALL : FLOOR;
      }
      for (const w of blk.ways) {
        if (x < w.x0 - 1 || x > w.x1 + 1 || y < w.y0 - 1 || y > w.y1 + 1) continue;
        if (w.stones) {
          for (const [sx, sy, sr] of w.stones) if (Math.hypot(x - sx, y - sy) < sr) return FLOOR;
          continue;
        }
        const dx = w.bx - w.ax, dy = w.by - w.ay, l2 = dx * dx + dy * dy;
        const u = l2 ? G.U.clamp(((x - w.ax) * dx + (y - w.ay) * dy) / l2, 0, 1) : 0;
        if (Math.hypot(x - w.ax - dx * u, y - w.ay - dy * u) < w.half) return FLOOR;
      }
      return LIQUID;
    }

    /**
     * La pasada final, por bloques (y guardada): la tierra metida en el agua (5+
     * de agua alrededor) se hunde y los charquitos casi rodeados de tierra (7+)
     * se rellenan. Los canales de 1–2 casillas entre islas se quedan.
     */
    const B = ISLE_BLOCK, BW = B + 2, SPIKE = 5, HOLE = 7;
    const finalBlock = cellCache((bi, bj, seed) => {
      const g = new Uint8Array(BW * BW), out = new Uint8Array(B * B);
      const x0 = bi * B - 1, y0 = bj * B - 1;
      for (let j = 0; j < BW; j++) for (let i = 0; i < BW; i++) g[j * BW + i] = rawTile(x0 + i, y0 + j, seed);
      for (let j = 0; j < B; j++) for (let i = 0; i < B; i++) {
        const t = g[(j + 1) * BW + i + 1];
        let other = 0;
        if (t !== WALL) {
          for (let b = 0; b <= 2; b++) for (let a = 0; a <= 2; a++) {
            const u = (a !== 1 || b !== 1) && g[(j + b) * BW + i + a];
            if ((a !== 1 || b !== 1) && u !== WALL && u !== t) other++;
          }
        }
        out[j * B + i] = t === FLOOR && other >= SPIKE ? LIQUID : t === LIQUID && other >= HOLE ? FLOOR : t;
      }
      return out;
    }, 1024);

    const lay = {
      liquidHurts: false,
      terrain(tx, ty, seed) {
        const bi = Math.floor(tx / B), bj = Math.floor(ty / B);
        return finalBlock(bi, bj, seed)[(ty - bj * B) * B + (tx - bi * B)];
      },
      /** Para las pruebas: las uniones que guarda la celda (i, j). */
      _links: (i, j, seed) => links(i, j, seed)
    };
    // En la orilla, algún matojo de hierba alta.
    lay.edgeProp = (tx, ty, seed, at = (x, y) => lay.terrain(x, y, seed)) => {
      if (at(tx, ty) !== FLOOR) return null;
      for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) {
        if ((a || b) && at(tx + a, ty + b) === LIQUID) return H(tx, ty, seed + S + 32) < 0.12 ? 'grass' : null;
      }
      return null;
    };
    return lay;
  }

  const ISLES = { salt: 2200, cell: 20, keep: 0.92, big: 0.4, bigR: [7, 24], smallR: [2.5, 6], aspect: 1.6, reach: 3, grow: 1.3 };
  /** Islas: se vadean los estrechos de hasta 2 casillas; puentes de 3–4 o islotes de paso (la mitad de las veces). */
  const islands = A => archipelago(Object.assign({ anchor: A }, ISLES, { wade: 2, stones: 0.5, maxBridge: 7, bridge: [3.2, 4.4] }));
  /** Pantano venenoso: las mismas islas, todo unido por puentes anchos (su agua quema: nada de vadear; anchos para que, en diagonal, quepan 4). */
  const bog = A => archipelago(Object.assign({ anchor: A }, ISLES, { wade: 0, stones: 0, maxBridge: Infinity, bridge: [6.5, 8] }));

  // ---------------- ríos: lava y pantano ----------------
  /*
   * La tierra son trozos de formas y tamaños al azar: cada celda de `cell`
   * casillas tiene un punto en cualquier sitio, y cada casilla es del trozo del
   * punto más cercano (un diagrama de Voronoi). Los ríos corren por las
   * fronteras entre trozos: cada frontera lleva río o no (con `p`), así se
   * juntan en Y y en T, unos largos y otros cortos, sin rejilla a la vista.
   * Puentes: si ningún otro punto cae dentro del círculo que tiene por diámetro
   * el segmento entre dos puntos vecinos (vecinos de Gabriel), el punto medio de
   * ese segmento está en su frontera; ahí va un puente de 4+ de ancho. El grafo
   * de Gabriel une todos los puntos, así que por tierra se llega a todas partes.
   * Las coordenadas se tuercen con ruido para que los ríos serpenteen.
   *   rocks  umbral de ruido para alguna roca suelta lejos de las fronteras (o null)
   *   banks  probabilidad de hierba alta en la orilla
   */
  function rivers(o) {
    const S = o.salt, C = o.cell, BRIDGE = 3.8, ROCK_AWAY = 5;    // puente: medio largo (torcido, deja 4+)
    const A = o.anchor, ai = Math.floor(A.tx / C), aj = Math.floor(A.ty / C);
    /**
     * Punto de la celda (el "centro" de un trozo de tierra), en cualquier sitio de
     * ella; el de la celda del ancla, en el ancla: así se empieza en mitad de un
     * trozo de tierra, lo más lejos de los ríos (que van por las fronteras).
     */
    const spot = cellCache((i, j, s) => (i === ai && j === aj ? { i, j, x: A.tx + 0.5, y: A.ty + 0.5 }
      : { i, j, x: (i + H(i, j, s + S + 1)) * C, y: (j + H(i, j, s + S + 2)) * C }));
    /**
     * Medio ancho del río de la frontera entre a y b (lo mismo se mire desde un
     * lado o desde el otro), o 0 si no lleva: cada río, de 0,75 a 1,25 veces `half`.
     */
    function riverHalf(a, b, s) {
      const [p, q] = a.i < b.i || (a.i === b.i && a.j < b.j) ? [a, b] : [b, a];
      const x = (p.i * 73856093) ^ (q.i * 83492791), y = (p.j * 19349663) ^ (q.j * 2971215073);
      return H(x, y, s + S + 3) < o.p ? o.half * (0.75 + 0.5 * H(x, y, s + S + 9)) : 0;
    }
    /** { wet: ¿río?, dist: a cuánto está de la frontera más cercana } */
    function river(tx, ty, seed) {
      const x = tx + (fbm(tx / 14, ty / 14, seed + S + 5) - 0.5) * o.warp * 2;
      const y = ty + (fbm(tx / 14 - 30, ty / 14 + 30, seed + S + 6) - 0.5) * o.warp * 2;
      const ci = Math.floor(x / C), cj = Math.floor(y / C);
      // Los dos puntos más cercanos (con un punto por celda, están en las 5×5 de alrededor).
      let a = null, b = null, da = Infinity, db = Infinity;
      for (let j = cj - 2; j <= cj + 2; j++) for (let i = ci - 2; i <= ci + 2; i++) {
        const q = spot(i, j, seed), d = (q.x - x) ** 2 + (q.y - y) ** 2;
        if (d < da) { db = da; b = a; da = d; a = q; } else if (d < db) { db = d; b = q; }
      }
      const ab = Math.sqrt(d2(a, b));
      const dist = (db - da) / (2 * ab);                        // distancia a la frontera (la mediatriz de a y b)
      if (dist >= o.half * 1.25 || dist >= riverHalf(a, b, seed)) return { wet: false, dist };
      // ¿En el puente? Junto al punto medio de a y b, a lo largo de la frontera.
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      const along = ((x - mx) * -(b.y - a.y) + (y - my) * (b.x - a.x)) / ab;
      return { wet: Math.abs(along) >= BRIDGE, dist };
    }
    const lay = {
      liquidHurts: o.liquidHurts,
      terrain(tx, ty, seed) {
        const r = river(tx, ty, seed);
        if (r.wet) return LIQUID;
        // Rocas: sólo lejos de todas las fronteras (no tapan ríos ni puentes).
        if (o.rocks != null && r.dist > ROCK_AWAY && fbm(tx / 6, ty / 6, seed + S + 7) > o.rocks) return WALL;
        return FLOOR;
      },
      edgeProp: () => null
    };
    if (o.banks) {
      lay.edgeProp = (tx, ty, seed, at = (x, y) => lay.terrain(x, y, seed)) => {
        if (at(tx, ty) !== FLOOR) return null;
        for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) {
          if ((a || b) && at(tx + a, ty + b) === LIQUID) return H(tx, ty, seed + S + 8) < o.banks ? 'grass' : null;
        }
        return null;
      };
    }
    return lay;
  }

  /** Volcán: ríos de lava (queman) con puentes de piedra y rocas de ceniza. */
  const lava = A => rivers({ anchor: A, salt: 3100, cell: 18, p: 0.62, half: 1.6, warp: 5, rocks: 0.72, banks: 0, liquidHurts: true });
  /** Pantano: más ríos que el volcán (casi todas las fronteras llevan) y más anchos, de agua que frena; juncos en la orilla. */
  const marsh = A => rivers({ anchor: A, salt: 3300, cell: 14, p: 0.9, half: 2.2, warp: 4, rocks: null, banks: 0.35, liquidHurts: false });

  const BUILD = { plains: plainsAt, cave, plant, lava, islands, bog, marsh };
  const IDS = Object.keys(BUILD);
  const ORIGIN = { tx: 0, ty: 0 };
  /**
   * Un generador nuevo con su ancla (cachés propias): el sitio donde empieza.
   * Con el claro de 9 casillas alrededor (plains ya lo trae en su fórmula).
   */
  function make(id, A = ORIGIN) {
    const build = BUILD[id];
    if (!build) return null;
    const lay = build(A);
    if (id !== 'plains') {
      const raw = lay.terrain;
      lay.terrain = (tx, ty, seed) => ((tx - A.tx) ** 2 + (ty - A.ty) ** 2 < 81 ? FLOOR : raw(tx, ty, seed));
    }
    lay.anchor = A;
    return lay;
  }
  /** El de cada id con el ancla en el 0,0 (el del principio de la run; también para las pruebas). */
  const atOrigin = {};
  const get = id => (BUILD[id] ? atOrigin[id] || (atOrigin[id] = make(id)) : null);
  // Bioma de la run (G.Tiles.BIOMES) -> generador: los tres del principio por su sitio
  // en la lista, los demás por lo que pidan (layout) o por su tipo (BY_TYPE).
  const BY_BIOME = ['plains', 'cave', 'lava'];       // el bosque, con el campo de siempre
  /*
   * Los colores de las grietas (a partir del minuto 12), por su tipo: su líquido
   * con el generador que le va (veneno o descarga en las islas y en la cueva,
   * arenas movedizas en los ríos del desierto...).
   */
  const BY_TYPE = {
    fire: 'lava', dragon: 'lava', ground: 'lava', grass: 'marsh', ice: 'islands', poison: 'bog',
    electric: 'plant', fighting: 'cave', psychic: 'cave', rock: 'cave', dark: 'cave', steel: 'cave'
  };
  /** Generador de un bioma (G.Tiles.BIOMES): el que pida él (layout), el de la lista o el de su tipo; si no, el campo. */
  function forBiome(b) {
    const T = G.Tiles, B = T && T.BIOMES[b];
    if (B && B.layout) return B.layout;
    if (BY_BIOME[b]) return BY_BIOME[b];
    return (T && T.ARENA != null && b >= T.ARENA && BY_TYPE[T.ARENA_TYPES[b - T.ARENA]]) || 'plains';
  }

  return {
    IDS, fbm, get, make,
    forBiome
  };
})();

    // ======================= BIOME REGIONS (v59) =======================
    // The world is split into big areas (about 150 tiles across, ~30-40 s of walking). Each area is a real biome:
    // its own terrain shape, its own ground colors, its own liquid (water, lava, ice, quicksand, electric pools...),
    // its own trees (palm trees on the beach, power poles in the power plant, cacti in the desert, graves in the
    // graveyard, snowy pines on the glacier...) and little ground details (shells, cracks, bones, grates...).
    // Your starting area is the map's own biome. Between two areas there's a strip of open ground where the colors
    // blend, so everything stays connected. Rift arenas, Safe Zones, Area Zero and co-op keep the original world.
    const H = (x, y, s) => G.U.hash(x, y, s);
    const T = G.Tiles, BI = T.BIOMES;
    // ---- palettes: copies of the game's own biome colors (so rifts using those colors are never touched) + the beach
    const clone = (i, name, extra) => { BI.push(Object.assign({}, BI[i], { name }, extra || {})); return BI.length - 1; };
    const BEACH = {
      name: 'Sunny Beach', liquid: 'water', floor: ['#e9d7a0', '#efdeaa', '#e2cf95'], dirt: ['#d8c088', '#d2b980', '#ddc690'], speck: '#cdb57e', light: '#fff2c8',
      flowers: ['#ff8fb0', '#ffffff', '#ffd23f'], wallTop: ['#b39a6e', '#bfa67a', '#a88f64'], wallLight: '#dcc79a', wallEdge: '#4a3a22', wallFace: ['#8a7048', '#7d6440'], wallFaceDark: '#5e4a2e',
      liq: '#2fb5e0', liqDeep: '#1f8ec4', foam: '#e8fbff', shore: '#f6e9bf', prop: 'tree', leaf: ['#2f8a3a', '#3fa64a', '#5cc45a', '#8ade6a'], trunk: ['#8a5a2a', '#a87038'],
      rock: ['#a8a29a', '#c4beb4', '#dcd6cc'], grass: ['#7aa84a', '#9ac45a', '#c4dc7a'] };
    const R = {   // name, terrain layout, palette, tree look, liquid note
      forest:  { name: 'Shady Forest',   lay: 'plains',  pal: clone(0, 'Shady Forest') },
      meadow:  { name: 'Flower Meadow',  lay: 'plains',  pal: clone(3, 'Flower Meadow') },
      beach:   { name: 'Sunny Beach',    lay: 'islands', pal: (BI.push(BEACH), BI.length - 1), deco: 'palm' },
      lava:    { name: 'Lava Fields',    lay: 'lava',    pal: clone(2, 'Lava Fields'), deco: 'charred' },
      power:   { name: 'Power Plant',    lay: 'plains',  pal: clone(7, 'Power Plant', { prop: 'tree' }), deco: 'pole' },
      desert:  { name: 'Red Desert',     lay: 'plains',  pal: clone(11, 'Red Desert'), deco: 'cactus' },
      glacier: { name: 'Frozen Glacier', lay: 'islands', pal: clone(8, 'Frozen Glacier'), deco: 'pine' },
      jungle:  { name: 'Emerald Jungle', lay: 'marsh',   pal: clone(6, 'Emerald Jungle'), deco: 'jungle' },
      grave:   { name: 'Old Graveyard',  lay: 'plains',  pal: clone(16, 'Old Graveyard'), deco: 'grave' },
      crystal: { name: 'Crystal Caves',  lay: 'cave',    pal: clone(1, 'Crystal Caves') },
      grotto:  { name: 'Sea Grotto',     lay: 'bog',     pal: clone(5, 'Sea Grotto') },
    };
    const MINE = new Set(Object.values(R).map(r => r.pal));
    const POOLS = {   // which areas each map can have (home = where you start)
      0: { home: 'forest', list: ['beach', 'meadow', 'desert', 'jungle', 'power', 'glacier', 'grave', 'lava', 'crystal', 'grotto'] },
      1: { home: 'crystal', list: ['grave', 'glacier', 'power', 'forest', 'lava', 'beach', 'desert', 'jungle', 'grotto'] },
      2: { home: 'lava', list: ['beach', 'desert', 'power', 'grave', 'forest', 'glacier', 'jungle', 'meadow', 'grotto'] },
    };
    const CELL = 150, BAND = 5, JIT = 0.33, BLEND = 4;
    const lays = {}; const L = id => lays[id] || (lays[id] = G.Layouts.make(id));
    const seedPt = new Map();
    function pt(i, j, seed) { const key = i * 100003 + j + seed * 7; let v = seedPt.get(key); if (!v) { if (seedPt.size > 20000) seedPt.clear();
      const jit = i === 0 && j === 0 ? 0 : JIT;   // your starting area is centred on the spawn point
      v = [(i + 0.5 + (H(i, j, seed + 811) - 0.5) * 2 * jit) * CELL, (j + 0.5 + (H(i, j, seed + 812) - 0.5) * 2 * jit) * CELL]; seedPt.set(key, v); } return v; }
    const homeCell = () => [0, 0];
    function typeOf(i, j, seed, pool) {
      const hc = homeCell(seed); if (i === hc[0] && j === hc[1]) return pool.home;
      let k = Math.floor(H(i, j, seed + 813) * pool.list.length), t = pool.list[k];
      // neighbours rarely share a biome, so you really do walk from one world into another
      if (H(i, j, seed + 814) < 0.75) { const hl = H(i - 1, j, seed + 813), hu = H(i, j - 1, seed + 813);
        for (let n = 0; n < pool.list.length && (pool.list[Math.floor(hl * pool.list.length)] === t || pool.list[Math.floor(hu * pool.list.length)] === t); n++) { k = (k + 1) % pool.list.length; t = pool.list[k]; } }
      return t;
    }
    const pool = () => { const b = G.Maps && G.Maps.cur ? G.Maps.cur.biome : 0; return POOLS[b] || null; };
    function region(tx, ty, seed, P) {
      tx += CELL / 2; ty += CELL / 2;   // shift so the spawn point (0,0) sits in the middle of cell (0,0)
      const ci = Math.floor(tx / CELL), cj = Math.floor(ty / CELL); let d1 = 1e18, d2 = 1e18, bi = 0, bj = 0, si = 0, sj = 0;
      for (let j = cj - 1; j <= cj + 1; j++) for (let i = ci - 1; i <= ci + 1; i++) { const q = pt(i, j, seed), d = (q[0] - tx) ** 2 + (q[1] - ty) ** 2;
        if (d < d1) { d2 = d1; si = bi; sj = bj; d1 = d; bi = i; bj = j; } else if (d < d2) { d2 = d; si = i; sj = j; } }
      const edge = Math.sqrt(d2) - Math.sqrt(d1);
      return { id: typeOf(bi, bj, seed, P), id2: typeOf(si, sj, seed, P), edge };
    }
    // which biome a tile LOOKS like (the border is ragged, not a straight line)
    function look(tx, ty, seed, P) {
      const r = region(tx, ty, seed, P); if (r.edge >= BLEND * 2 || r.id === r.id2) return r.id;
      const n = G.Layouts.fbm(tx / 3.5, ty / 3.5, seed + 821) * 0.7 + H(tx, ty, seed + 822) * 0.3;
      return n < 0.5 - r.edge / (BLEND * 4) ? r.id2 : r.id;
    }
    const active = () => !!pool() && !(G.Coop && G.Coop.active) && !(window.PS_ROUTE1 && window.PS_ROUTE1.active());   // Story Route 1 has its own hand-made map
    window.PS_TERRAIN = function (tx, ty, seed) {
      try {
        if (!active()) return null;
        window.PS_TERRAIN_SEED = seed;
        const P = pool(), r = region(tx, ty, seed, P);
        if (r.edge < BAND && tx * tx + ty * ty > 400) {   // the open strip between two areas
          const n = G.Layouts.fbm(tx / 6, ty / 6, seed + 815); return n < 0.14 ? 2 : 0; }
        return L(R[r.id].lay).terrain(tx, ty, seed);
      } catch (e) { return null; }
    };
    const regionAtPx = (x, y) => { const P = pool(), seed = window.PS_TERRAIN_SEED; if (!P || seed == null) return null; return look(Math.floor(x / 32), Math.floor(y / 32), seed, P); };
    window.PS_TERRAIN_REGION = function (x, y) { try { const id = regionAtPx(x, y); return id ? R[id].name : null; } catch (_) { return null; } };
    window.PS_BIOME_AT = regionAtPx;

    // ---- ground painting: each tile gets its own biome's colors + little details ----
    const managed = b => active() && (MINE.has(b) || b === (G.Maps && G.Maps.cur ? G.Maps.cur.biome : 0)) && !(G.Judgment && G.Judgment.active);
    const groundCache = new Map();
    const origPaint = T.paintChunk;
    T.paintChunk = function (cx, cy, size, terrAt, noise, biome, seed) {
      if (!managed(biome)) return origPaint.apply(this, arguments);
      const P = pool(), key = cx + ',' + cy + ',' + seed + ',' + (G.Maps.cur ? G.Maps.cur.biome : 0);
      const hit = groundCache.get(key); if (hit) return hit;
      const ids = new Array(size * size), used = new Set();
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) { const id = look(cx * size + x, cy * size + y, seed, P); ids[y * size + x] = id; used.add(id); }
      const first = ids[0], out = origPaint.call(this, cx, cy, size, terrAt, noise, R[first].pal, seed);
      if (used.size > 1) { const g = out.getContext('2d'), Tp = out.width / size, imgs = {};
        for (const id of used) if (id !== first) imgs[id] = origPaint.call(this, cx, cy, size, terrAt, noise, R[id].pal, seed);
        for (let i = 0; i < ids.length; i++) if (ids[i] !== first) { const x = (i % size) * Tp, y = Math.floor(i / size) * Tp; g.drawImage(imgs[ids[i]], x, y, Tp, Tp, x, y, Tp, Tp); } }
      try { decorate(out, cx, cy, size, terrAt, ids, seed); } catch (e) { console.warn('[terrain] decor', e); }
      if (groundCache.size > 110) groundCache.delete(groundCache.keys().next().value);
      groundCache.set(key, out); return out;
    };
    function decorate(cv, cx, cy, size, terrAt, ids, seed) {
      const g = cv.getContext('2d'), Tp = cv.width / size, k = Tp / 16, f = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x * k), Math.round(y * k), Math.max(1, Math.round(w * k)), Math.max(1, Math.round(h * k))); };
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
        const tx = cx * size + x, ty = cy * size + y; if (terrAt(tx, ty) !== 'floor') continue;
        const id = ids[y * size + x], h = H(tx, ty, seed + 830), h2 = H(tx, ty, seed + 831), ox = x * 16, oy = y * 16, a = 2 + Math.floor(h2 * 9), b = 2 + Math.floor(H(tx, ty, seed + 832) * 9);
        if (id === 'beach') {
          if (h < 0.035) { f(ox + a, oy + b, 3, 2, '#fff4e8'); f(ox + a + 1, oy + b - 1, 1, 1, '#ffd0c0'); }                       // shell
          else if (h < 0.05) { const c = '#ff8a4a'; f(ox + a + 2, oy + b, 1, 5, c); f(ox + a, oy + b + 2, 5, 1, c); f(ox + a + 1, oy + b + 1, 3, 3, c); }   // starfish
          else if (h < 0.16) { f(ox + 2, oy + b, 9, 1, 'rgba(160,130,80,.35)'); f(ox + 4, oy + b + 3, 8, 1, 'rgba(160,130,80,.25)'); }   // sand ripples
        } else if (id === 'desert') {
          if (h < 0.06) { f(ox + a, oy + b, 2, 2, '#7a5a38'); f(ox + a + 3, oy + b + 1, 1, 1, '#6a4a2a'); }
          else if (h < 0.09) { f(ox + a, oy + b, 6, 1, 'rgba(90,60,30,.5)'); f(ox + a + 5, oy + b + 1, 1, 3, 'rgba(90,60,30,.5)'); }
          else if (h < 0.095) { f(ox + a, oy + b, 4, 3, '#efe6d2'); f(ox + a + 1, oy + b + 1, 1, 1, '#3a2a1a'); f(ox + a + 2, oy + b + 1, 1, 1, '#3a2a1a'); }   // little skull
        } else if (id === 'lava') {
          if (h < 0.12) { f(ox + a, oy + b, 5, 1, '#ff7a1a'); f(ox + a + 4, oy + b + 1, 1, 3, '#ff7a1a'); f(ox + a + 1, oy + b, 2, 1, '#ffd23f'); }   // glowing cracks
          else if (h < 0.2) f(ox + a, oy + b, 2, 2, '#2a1a14');
        } else if (id === 'power') {
          const plate = G.Layouts.fbm(tx / 7, ty / 7, seed + 840) > 0.58;
          if (plate) { f(ox, oy, 16, 16, 'rgba(120,124,132,.55)'); f(ox, oy, 16, 1, 'rgba(255,255,255,.12)'); f(ox + 2, oy + 2, 1, 1, '#2a2a30'); f(ox + 13, oy + 13, 1, 1, '#2a2a30'); if (h < 0.3) for (let i = 0; i < 4; i++) f(ox + 3 + i * 3, oy + 5, 1, 6, 'rgba(20,20,26,.55)'); }
          else if (h < 0.05) { for (let i = 0; i < 4; i++) f(ox + 2 + i * 3, oy + 6, 2, 3, i % 2 ? '#1a1a1a' : '#ffd23f'); }       // hazard stripe
          else if (h < 0.12) { f(ox, oy + b, 16, 1, '#26262c'); f(ox + a, oy + b - 1, 2, 3, '#3a3a44'); }                       // cable
        } else if (id === 'grave') {
          if (h < 0.04) { f(ox + a, oy + b, 6, 1, '#d8d0c0'); f(ox + a - 1, oy + b - 1, 2, 3, '#d8d0c0'); f(ox + a + 5, oy + b - 1, 2, 3, '#d8d0c0'); }   // bone
          else if (h < 0.12) f(ox + a, oy + b, 3, 2, 'rgba(20,18,30,.5)');
        } else if (id === 'glacier') {
          if (h < 0.1) { f(ox + a, oy + b, 1, 1, '#ffffff'); f(ox + a - 1, oy + b + 1, 3, 1, 'rgba(255,255,255,.7)'); }
          else if (h < 0.15) { f(ox + a, oy + b, 6, 1, 'rgba(90,130,170,.45)'); f(ox + a + 3, oy + b + 1, 1, 3, 'rgba(90,130,170,.45)'); }
        } else if (id === 'jungle') {
          if (h < 0.08) { f(ox + a, oy + b, 5, 3, '#2f8a2a'); f(ox + a + 1, oy + b + 1, 3, 1, '#58c04a'); }
          else if (h < 0.1) { f(ox + a, oy + b + 2, 1, 2, '#e8e0c8'); f(ox + a - 1, oy + b, 3, 2, '#d8402a'); f(ox + a, oy + b, 1, 1, '#ffffff'); }   // mushroom
        } else if (id === 'meadow') {
          if (h < 0.16) { const c = ['#ffd23f', '#ff8ad8', '#ffffff', '#9ad0ff'][Math.floor(h2 * 4)]; f(ox + a, oy + b, 1, 1, c); f(ox + a - 1, oy + b + 1, 3, 1, c); f(ox + a, oy + b + 2, 1, 1, c); f(ox + a, oy + b + 1, 1, 1, '#ffef9a'); }
        } else if (id === 'forest') {
          if (h < 0.05) { f(ox + a, oy + b, 3, 2, '#8a5a2a'); f(ox + a + 3, oy + b + 1, 2, 2, '#a6702a'); }
          else if (h < 0.065) { f(ox + a, oy + b + 2, 1, 2, '#e8e0c8'); f(ox + a - 1, oy + b, 3, 2, '#c8402a'); }
        } else if (id === 'crystal' || id === 'grotto') {
          if (h < 0.04) { const c = id === 'grotto' ? '#7ef0d0' : '#a8c8ff'; f(ox + a, oy + b, 2, 3, c); f(ox + a, oy + b, 1, 1, '#ffffff'); }
        }
      }
    }

    // ---- extra props (trees, palm trees, power poles, cacti, graves...) through the engine's PS_PROP_AT hook ----
    const near = (tx, ty, seed, P, id) => { try { return look(tx, ty, seed, P) === id && L(R[region(tx, ty, seed, P).id].lay) && window.PS_TERRAIN(tx, ty, seed) === 0; } catch (_) { return false; } };
    const poleRow = (tx, ty, seed) => ((ty % 10) + 10) % 10 === 0 && ((tx % 7) + 7) % 7 === 0 && H(Math.floor(tx / 35), ty, seed + 901) < 0.85;
    window.PS_PROP_AT = function (tx, ty, open) {
      const res = propAt(tx, ty); return (res === 'tree' || res === 'rock') && open === false ? undefined : res;
    };
    function propAt(tx, ty) {
      try {
        const P = pool(), seed = window.PS_TERRAIN_SEED; if (!P || seed == null || !active() || tx * tx + ty * ty < 144) return undefined;
        const id = look(tx, ty, seed, P), h = H(tx, ty, seed + 850), n = G.Layouts.fbm(tx / 9, ty / 9, seed + 851);
        if (region(tx, ty, seed, P).edge < 3) return undefined;
        switch (id) {
          case 'power': return poleRow(tx, ty, seed) ? 'tree' : h < 0.006 ? 'rock' : null;
          case 'beach': return h < 0.03 ? 'tree' : h < 0.06 ? 'grass' : undefined;
          case 'desert': return h < 0.022 ? 'tree' : h < 0.03 ? 'rock' : null;
          case 'grave': return (((tx % 4) + 4) % 4 === 0 && ((ty % 5) + 5) % 5 === 0 && n > 0.45) || h < 0.006 ? 'tree' : undefined;
          case 'glacier': return n > 0.55 && h < 0.14 ? 'tree' : undefined;
          case 'jungle': return n > 0.42 && h < 0.16 ? 'tree' : h < 0.06 ? 'grass' : undefined;
          case 'forest': return n > 0.58 && h < 0.13 ? 'tree' : undefined;
          case 'lava': return h < 0.018 ? 'tree' : h < 0.04 ? 'rock' : undefined;
          case 'meadow': return h < 0.08 ? 'grass' : h < 0.09 ? 'tree' : undefined;
        }
      } catch (_) {}
      return undefined;
    }

    // ---- props are drawn in the colors of the biome they stand in; trees get each biome's own look ----
    let cur = null;
    const W = G.World, origDraw = W.drawProp, origSprite = T.propSprite;
    W.drawProp = function (ctx, prop) { cur = prop; try { return origDraw.apply(this, arguments); } finally { cur = null; } };
    T.propSprite = function (biome, type, v) {
      if (cur && managed(biome)) {
        const p = cur; if (p.__rg === undefined) { const seed = window.PS_TERRAIN_SEED, P = pool(); p.__rg = seed == null || !P ? null : look(p.tx, p.ty, seed, P); }
        const r = p.__rg && R[p.__rg];
        if (r) { if (type === 'tree' && r.deco) return SPR(r.deco, variantFor(r.deco, p)); return origSprite.call(this, r.pal, type, v); }
      }
      return origSprite.apply(this, arguments);
    };
    function variantFor(kind, p) {
      const h = H(p.tx, p.ty, 77);
      if (kind === 'pole') { const seed = window.PS_TERRAIN_SEED, P = pool(); const l = near(p.tx - 7, p.ty, seed, P, 'power') && poleRow(p.tx - 7, p.ty, seed), r = near(p.tx + 7, p.ty, seed, P, 'power') && poleRow(p.tx + 7, p.ty, seed); return (l ? 1 : 0) + (r ? 2 : 0) + (h < 0.25 ? 4 : 0); }
      return Math.floor(h * 3);
    }

    // ---- the global biome follows you (liquids: lava burns, water slows, ice slides, electric pools shock...) ----
    let lastSet = null, lastName = null, runP = null;
    setInterval(() => { try {
      const B = window.PS_MEGA_BRIDGE_V5, p = B?.game?.player; if (!p || B.game.state !== 'playing' || !active()) { lastSet = null; return; }
      if ((G.Rift && G.Rift.inArena) || (G.Judgment && G.Judgment.active) || (window.PS_SAFEZONE && window.PS_SAFEZONE.active)) { lastSet = null; return; }
      if (p !== runP) { runP = p; lastName = null; }
      const id = regionAtPx(p.x, p.y); if (!id) return; const pal = R[id].pal;
      if (lastSet !== pal) { lastSet = pal; try { W.setBiome(pal, true); } catch (_) {} }
      if (lastName && lastName !== id) { try { G.Spawner.say('— ' + R[id].name + ' —', 2.5); } catch (_) {} }
      lastName = id;
    } catch (e) {} }, 250);

    // ---- the sprites (pixel art drawn once, then cached) ----
    const sprites = new Map();
    function SPR(kind, v) { const key = kind + v; let c = sprites.get(key); if (!c) { c = build(kind, v); sprites.set(key, c); } return c; }
    function finish(c, outline) {   // hard pixel edges + a dark outline like the game's own sprites
      const g = c.getContext('2d'), d = g.getImageData(0, 0, c.width, c.height), a = d.data, w = c.width, h = c.height, solid = new Uint8Array(w * h);
      for (let i = 0; i < w * h; i++) { if (a[i * 4 + 3] > 110) { a[i * 4 + 3] = 255; solid[i] = 1; } else a[i * 4 + 3] = 0; }
      if (outline) { const o = [parseInt(outline.slice(1, 3), 16), parseInt(outline.slice(3, 5), 16), parseInt(outline.slice(5, 7), 16)];
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; if (solid[i]) continue;
          if ((x > 0 && solid[i - 1]) || (x < w - 1 && solid[i + 1]) || (y > 0 && solid[i - w]) || (y < h - 1 && solid[i + w])) { a[i * 4] = o[0]; a[i * 4 + 1] = o[1]; a[i * 4 + 2] = o[2]; a[i * 4 + 3] = 255; } } }
      g.putImageData(d, 0, 0); return c;
    }
    function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
    function build(kind, v) {
      if (kind === 'palm') {
        const c = canvas(44, 62), g = c.getContext('2d'), lean = v === 1 ? -1 : 1, bx = 22, by = 61, topX = bx + lean * 7, topY = 16;
        for (let i = 0; i <= 44; i++) { const u = i / 44, x = bx + (topX - bx) * u * u, y = by - (by - topY) * u, w = 4.6 - u * 1.4; g.fillStyle = (Math.floor(i / 3) % 2) ? '#8a5a2a' : '#a87038'; g.fillRect(Math.round(x - w / 2), Math.round(y), Math.ceil(w), 2); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(Math.round(x + w / 2 - 1), Math.round(y), 1, 2); }
        const fr = [[-2.9, 18], [-2.3, 20], [-1.7, 15], [-1.25, 17], [-0.6, 18], [-0.15, 19], [0.45, 15]];
        for (const [ang, len] of fr) { for (let s = 0; s <= len; s++) { const u = s / len, x = topX + Math.cos(ang) * s, y = topY + Math.sin(ang) * s + u * u * 9, w = 3.4 * (1 - u * 0.7);
          g.fillStyle = s % 3 === 0 ? '#3fa64a' : '#2f8a3a'; g.beginPath(); g.ellipse(x, y, w, w * 0.7, ang, 0, Math.PI * 2); g.fill();
          if (s % 2 === 0 && s > 2) { g.fillStyle = '#5cc45a'; g.fillRect(Math.round(x), Math.round(y + w * 0.6), 1, 2); } } }
        g.fillStyle = '#5a3a1a'; for (const [dx, dy] of [[-2, 2], [1, 3], [-1, 4]]) { g.beginPath(); g.arc(topX + dx, topY + dy, 2, 0, Math.PI * 2); g.fill(); }
        g.fillStyle = '#8ade6a'; g.fillRect(topX - 1, topY - 2, 3, 2);
        return finish(c, '#1c2a14');
      }
      if (kind === 'pole') {
        const half = 56, c = canvas(half * 2 + 4, 76), g = c.getContext('2d'), mx = half + 2, L = v & 1, Rr = v & 2, tr = v & 4;
        g.fillStyle = '#5a3a22'; g.fillRect(mx - 2, 10, 4, 66); g.fillStyle = '#7a5130'; g.fillRect(mx - 2, 10, 2, 66); g.fillStyle = '#3e2816'; for (let y = 16; y < 76; y += 9) g.fillRect(mx - 2, y, 4, 1);
        g.fillStyle = '#4a3020'; g.fillRect(mx - 12, 13, 24, 3); g.fillRect(mx - 9, 21, 18, 2);
        g.fillStyle = '#cfe8ff'; for (const x of [mx - 11, mx - 1, mx + 9]) g.fillRect(x, 10, 2, 3); for (const x of [mx - 8, mx + 6]) g.fillRect(x, 18, 2, 3);
        if (tr) { g.fillStyle = '#7d8590'; g.fillRect(mx + 2, 30, 7, 11); g.fillStyle = '#a4adb8'; g.fillRect(mx + 2, 30, 7, 2); g.fillStyle = '#4b525b'; g.fillRect(mx + 3, 41, 5, 1); }
        g.strokeStyle = '#18181c'; g.lineWidth = 1;
        const wire = (x0, y0, x1, sag) => { g.beginPath(); for (let i = 0; i <= 40; i++) { const u = i / 40, x = x0 + (x1 - x0) * u, y = y0 + sag * (1 - (1 - u) * (1 - u)); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); };
        if (L) { wire(mx - 11, 11, 0, 9); wire(mx - 8, 19, 0, 8); } else { wire(mx - 11, 11, mx - 20, 6); }
        if (Rr) { wire(mx + 11, 11, c.width, 9); wire(mx + 8, 19, c.width, 8); } else { wire(mx + 11, 11, mx + 20, 6); }
        // no outline (it would thicken the wires); keep edges crisp
        const d = g.getImageData(0, 0, c.width, c.height); for (let i = 3; i < d.data.length; i += 4) d.data[i] = d.data[i] > 60 ? 255 : 0; g.putImageData(d, 0, 0); return c;
      }
      if (kind === 'cactus') {
        const c = canvas(26, 42), g = c.getContext('2d'), G1 = '#3f8a3a', G2 = '#5aae4a', D = '#2a6a2a';
        const col = (x, y, w, h) => { g.fillStyle = G1; g.fillRect(x, y + 2, w, h - 2); g.fillRect(x + 1, y, w - 2, 2); g.fillStyle = G2; g.fillRect(x + 1, y + 2, 1, h - 3); g.fillStyle = D; g.fillRect(x + w - 2, y + 2, 1, h - 3); };
        col(10, 4, 7, 38); if (v !== 2) { col(3, 14, 5, 12); g.fillStyle = G1; g.fillRect(6, 23, 5, 4); } if (v !== 1) { col(19, 10, 5, 13); g.fillStyle = G1; g.fillRect(16, 20, 4, 4); }
        g.fillStyle = '#e8f0c0'; for (let y = 8; y < 40; y += 4) { g.fillRect(9, y, 1, 1); g.fillRect(17, y + 2, 1, 1); }
        if (v === 0) { g.fillStyle = '#ff6a8a'; g.fillRect(12, 2, 3, 2); g.fillStyle = '#ffd23f'; g.fillRect(13, 2, 1, 1); }
        return finish(c, '#1a2a12');
      }
      if (kind === 'grave') {
        const c = canvas(24, 30), g = c.getContext('2d');
        if (v === 1) { g.fillStyle = '#8a8a96'; g.fillRect(10, 2, 5, 26); g.fillRect(4, 8, 17, 5); g.fillStyle = '#a8a8b4'; g.fillRect(10, 2, 2, 26); g.fillRect(4, 8, 17, 2); }
        else { g.fillStyle = '#7d7d8a'; g.beginPath(); g.moveTo(3, 29); g.lineTo(3, 9); g.quadraticCurveTo(3, 1, 12, 1); g.quadraticCurveTo(21, 1, 21, 9); g.lineTo(21, 29); g.fill();
          g.fillStyle = '#9a9aa8'; g.fillRect(4, 8, 3, 20); g.fillStyle = '#4a4a56'; g.fillRect(8, 10, 8, 1); g.fillRect(8, 13, 8, 1); g.fillRect(8, 16, 6, 1); if (v === 2) { g.fillStyle = '#5a7a4a'; g.fillRect(3, 24, 6, 5); g.fillRect(16, 22, 5, 7); } }
        g.fillStyle = '#3a3a2a'; g.fillRect(1, 28, 22, 2);
        return finish(c, '#15141c');
      }
      if (kind === 'pine') {
        const c = canvas(34, 54), g = c.getContext('2d');
        g.fillStyle = '#4a3020'; g.fillRect(15, 42, 5, 12);
        for (let k = 0; k < 4; k++) { const y = 6 + k * 10, w = 7 + k * 4; g.fillStyle = '#1f5a46'; g.beginPath(); g.moveTo(17, y - 6); g.lineTo(17 + w, y + 10); g.lineTo(17 - w, y + 10); g.fill();
          g.fillStyle = '#2f7a5e'; g.beginPath(); g.moveTo(17, y - 6); g.lineTo(17 - w + 2, y + 9); g.lineTo(15, y + 9); g.fill();
          g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(17, y - 6); g.lineTo(17 + w * 0.55, y + 3); g.lineTo(17 - w * 0.55, y + 3); g.fill(); g.fillStyle = '#e4f2ff'; g.fillRect(17 - Math.round(w * 0.9), y + 8, 3, 2); g.fillRect(17 + Math.round(w * 0.6), y + 7, 3, 2); }
        return finish(c, '#0f241e');
      }
      if (kind === 'jungle') {
        const c = canvas(50, 60), g = c.getContext('2d');
        g.fillStyle = '#5a3a1e'; g.fillRect(21, 26, 8, 34); g.fillStyle = '#6e4a26'; g.fillRect(21, 26, 3, 34); g.fillRect(14, 54, 22, 6);
        const blob = (x, y, r, c1, c2) => { g.fillStyle = c1; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); g.fillStyle = c2; g.beginPath(); g.arc(x - r * 0.3, y - r * 0.35, r * 0.55, 0, Math.PI * 2); g.fill(); };
        blob(14, 22, 11, '#1f6a26', '#2f8a32'); blob(36, 22, 11, '#1f6a26', '#2f8a32'); blob(25, 13, 13, '#26782c', '#3fa63e'); blob(25, 26, 10, '#1f6a26', '#2f8a32');
        g.fillStyle = '#58c04a'; for (const [x, y] of [[20, 8], [30, 10], [12, 18], [38, 18], [24, 20]]) g.fillRect(x, y, 2, 2);
        g.fillStyle = '#2f7a2a'; for (const x of [9, 16, 33, 41]) for (let y = 28; y < 28 + 8 + (x % 7); y += 2) g.fillRect(x + ((y >> 2) % 2), y, 1, 2);
        if (v === 0) { g.fillStyle = '#ff5a8a'; g.fillRect(31, 15, 3, 3); g.fillStyle = '#ffd23f'; g.fillRect(32, 16, 1, 1); }
        return finish(c, '#0c200e');
      }
      if (kind === 'charred') {
        const c = canvas(32, 48), g = c.getContext('2d');
        g.strokeStyle = '#1e1614'; g.lineCap = 'round';
        const br = (x0, y0, x1, y1, w) => { g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };
        br(16, 48, 16, 14, 5); br(16, 30, 6, 18, 3); br(16, 24, 26, 12, 3); br(16, 18, 12, 6, 2); br(8, 20, 4, 12, 2); br(24, 14, 28, 6, 2);
        g.fillStyle = '#ff7a1a'; g.fillRect(15, 34, 1, 4); g.fillRect(17, 26, 1, 3); g.fillRect(15, 42, 2, 1); g.fillStyle = '#ffd23f'; g.fillRect(15, 35, 1, 1);
        if (v === 0) { g.fillStyle = '#ff5a1a'; g.fillRect(25, 12, 2, 1); }
        return finish(c, '#0c0806');
      }
      return canvas(1, 1);
    }
  }
  const t = setInterval(() => { const G = window.PS_HOOPA_ENGINE; if (G && G.U && G.U.hash && G.Tiles && G.Tiles.paintChunk && G.World && G.World.drawProp) { clearInterval(t); install(G); } }, 20);
})();
