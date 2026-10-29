# v99 — Act 4 night performance

Merge the update ZIP into the game's root folder and replace matching files, including index.html. Reload after publishing. No new assets are needed for this performance fix; saves and config.js are not included or changed.

## Changes

- Act 4's lighting pass reuses bounded, color-specific glow textures instead of constructing two radial gradients for every light on every frame. Source positions, radii and flickering intensity still update normally. All existing light sources remain enabled. The ambient light map still follows the day/night cycle.
- Nighttime rock brightness and soft edge glow are baked once per scenery model. Large rocks no longer apply live shadow blur and brightness filters on each frame.
- Scenery drawing excludes objects whose full artwork is outside the camera bounds, retaining margin for tall sprites and glow.
- Other maps use their original gradient renderer. Terrain generation, collision, enemy AI, damage and spawn settings are unchanged by this update.

## Verification

Controlled native browser comparison: same seed (52), player location (730,850), 1280×720 viewport, DPR 2, clear weather. Enemies were frozen/cleared to isolate the environment's cost. Each day/night phase collected 180 frame intervals after 30 warm-up frames. Daylight median remained 16.7 ms. Midnight median improved from 33.3 ms (~30 FPS) to 16.7 ms (~60 FPS); 95th percentile improved from 34.3 to 17.6 ms. Gradient constructions across the midnight phase dropped from 12,167 to 1,057. The remaining gradients belong to other effects and source initialization.

These are local controlled measurements, not a guarantee of frame rate on every device or in large battles. See before.json and after.json for raw results. Muted night playtest verified lava visibility and lighting. 55 automated checks passed, including glow-cache bounds/reuse and canvas-state restoration, plus the previous terrain, spacing, collision, lava, rift and dialogue regressions.

This ZIP is cumulative over the user's gard-v94 archive and includes the earlier v95–v98 updates.
