# Act 2 — Endless Crystal Cave and Snowy Peak, revision 7

## Install

For an existing merged Friend + Gard game, replace **index.html** in the game root and **js/crystal-peak.js** inside js/. Start a new run and refresh the page. All new artwork is embedded in the script: no separate assets or Markdown upload is required. Keep your config.js and save data. This patch targets the merged build; use the full game ZIP if you skipped earlier integration patches.

## Terrain and scenery

Act 2 preserves its normal unlock, difficulty and rewards. The cave now generates indefinitely around the player rather than stopping at the old eight-room boundary. Gard's native cave samples and continuous terrain noise shape connected, irregular chambers and broad passages. The mountain also generates indefinitely and is loaded separately through a cave mouth. There is no view of snow through a cave wall.

The cave has no sunlight, weather or ambient illumination. Spaced RGB, fused and rainbow crystal clusters provide local light. Some are giant 192-world-pixel formations with wider grounded collision footprints. Placement checks consider complete sprite bounds, including the tall crystal points, nearby scenery and doorway approaches. Rock walls use actual pixel boulder formations rather than distant mountain silhouettes. Mining tracks, carts, mushrooms, moss and fossils remain sparse.

Streams end inside their receiving pool. Short moving streaks travel downstream across the stream width; pools have moving surface glints and drop rings. Shallows and streams use native water slowdown, Water-type immunity and movement ripples. Reflections are mirrored from actual nearby crystal and Pokémon sprites, masked to the visible water, and distorted in thin moving strips. There are no independent decorative reflection crystals.

The snowy exterior uses native Act 1 green grass and white variants of the same grass. New snow-laden firs, snowy boulders/drifts, frozen ponds and pixel cave mouths replace flat mountain cutouts. Continuous snow texture avoids tile/chunk outlines. Falling snow, breeze and visible passing gusts provide a light blizzard effect. Frozen ponds are traversable ice scenery rather than liquid water.

## Rare areas

Regigigas and Terapagos each receive an independent approximately 1% roll once per run seed. A successful roll creates a hidden separate entrance away from the start. No temple or sanctuary is drawn on the ordinary cave map. Discovery displays “Oh, what's this?” and fades into a separate area. Dedicated ancient stone temple and prismatic altar sprites replace the former stacked cemetery statue/stairs/crystal pieces. Return entrances have separate approach space. These are exploration landmarks, not new legendary capture quests.

Transitions stash cave Pokémon and restore them on return. Doorway travel remains solo-only; network co-op area transitions are not implemented.

## Validation

37 automated checks pass, covering the merge, encounters, endless generation, deterministic terrain, stream endpoints, crystal collisions/spacing, giant crystals, scenery overlap, rare rolls and separate discoveries. All loaded local scripts pass syntax checks.

Hidden muted native playtests compared Act 1 and Act 2, inspected snow scenery, giant crystals and the revised altar, exercised mountain/sanctuary travel, and observed native wet movement and Pokémon/crystal reflection sources. Final stream test: dry speed 105.6, wet speed 63.36; 12 actual crystal sources, one Pokémon source, all matched actual scene objects; no runtime warnings/errors. A two-time water render changed 8,455 pixels in the sampled view. Those counts depend on seed and camera.

The whole roster, every world seed, long-run difficulty and internet co-op remain unverified.

## Art direction reference

Top-down Pokémon-style pixel environment at the same chunky pixel scale as the living forest: a near-black, procedurally expanding cave with irregular slate chambers, clearly faceted RGB crystal clusters and occasional giant spires; connected blue-black pools and flowing narrow streams with accurate distorted sprite reflections. Sparse mining debris, fossils, mushrooms and damp moss. Crystal light only, with real darkness between light sources. Separate snowy highland with green and white grass patches, snow-laden firs, blue-shadowed snow drifts, frozen ponds and gusting snowfall. Natural rocky pixel cave mouths. Ancient Regigigas architecture and a Terapagos prismatic altar occur only in rare separate discovery maps. No floating map labels, artificial borders, rectangular terrain seams or mismatched vector scenery.
