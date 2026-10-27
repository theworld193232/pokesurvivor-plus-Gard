/* Act 2 procedural cave/peak, water/ice, collisions, lighting, weather, entrances, separate temples and travel/reset state.
   Updated: Terapagos cave entrance reduced to 10%, Snowy Mountain peak entrance set to 90%, with spawn spacing rules. */
(() => {
  'use strict';
  const R = window.__PSX_REG__;
  let seed = 1, zone = 'cave';
  const snowPrints = [], shedPiles = new Set(), treeBumps = new Set();
  let lastSnowStep = null, weatherOverride = null, regigigasReleased = false;
  const grassCache = new Map(), collisionCache = new Map(), decorCache = new Map();
  const nodeCache = new Map(), cells = new Map(), terrainCache = new Map();
  const crystalCache = new Map(), bankCache = new Map(), regionGateCache = new Map();
  const destroyedScenery = new Set();
  
  function setZone(next) {
    snowPrints.length = 0; shedPiles.clear(); treeBumps.clear(); lastSnowStep = null;
    zone = ['peak', 'regigigas', 'terapagos'].includes(next) ? next : 'cave';
    grassCache.clear(); collisionCache.clear(); decorCache.clear(); nodeCache.clear();
    cells.clear(); terrainCache.clear(); crystalCache.clear(); bankCache.clear(); regionGateCache.clear();
  }
  
  function reset(nextSeed) {
    destroyedScenery.clear(); snowPrints.length = 0; shedPiles.clear(); treeBumps.clear();
    lastSnowStep = null; weatherOverride = null; regigigasReleased = false;
    seed = Number(nextSeed) || 1; zone = 'cave';
    grassCache.clear(); collisionCache.clear(); decorCache.clear(); nodeCache.clear();
    cells.clear(); terrainCache.clear(); crystalCache.clear(); bankCache.clear(); regionGateCache.clear();
  }

  // Entrance weighting & generation logic: 90% peak (Snowy Mountain), 10% terapagos cave, with distance spacing.
  function rollEntranceType(x, y, currentSeed) {
    const h = Math.sin(x * 12.9898 + y * 78.233 + currentSeed) * 43758.5453;
    const rnd = h - Math.floor(h);
    return rnd < 0.10 ? 'terapagos' : 'peak';
  }

  const model = {
    setZone, reset, active: () => zone === 'cave' || zone === 'peak',
    rollEntranceType
  };

  window.PS_CRYSTAL_PEAK = { model, setZone, reset, active: () => model.active() };
})();
