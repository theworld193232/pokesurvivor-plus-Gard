# v98 — terrain seams and walking space

Merge this update ZIP's contents into the game root, preserving the js/, assets/ and docs/ folders. Replace the matching files, including index.html. Reload the deployed page after GitHub Pages finishes publishing. These are game files; the update does not contain or replace browser/cloud saves or config.js.

The faint straight white lines were gaps between independently rasterized terrain chunks at fractional camera transforms. js/ground-edges.js aligns qualifying opaque whole terrain canvases to device-pixel bounds while ground rendering runs. It uses the actual canvas transform, including display density. Sprite crops, transparent effects, rotations and physics coordinates retain their existing drawing behavior. The hook follows late biome renderer installation and restores context state after rendering.

Act 4 generated solid scenery now reserves space based on its visual base as well as its collision footprint. Larger walking gaps, additional meandering travel lanes, bridge-approach reservations and cross-region spacing prevent columns, logs and cliffs from forming dense accidental walls. Static camps, eruption pits and landmarks participate in placement before ordinary props are generated. Ground-cover grass remains non-solid. Existing terrain changes appear when a run is generated again.

Validation: 52 automated checks pass across terrain, collisions, bridge rails, lava, lighting, rifts and dialogue. New checks cover fractional zoom/offset/DPR, late map installation, context cleanup, sprite/effect pass-through and scenery spacing over several seeds. A real browser canvas fixture compares 21 scale/offset cases: 23,898 leaked pixels before correction, zero after. Muted native Act 4 playtest verified the installed renderer and clearer crossing approaches. No browser errors appeared in that playtest.

This is cumulative over the supplied gard-v94 source archive. It includes the v95 volcano lighting/grass, v96 Ultra Beast rifts and v97 wormhole/dialogue updates. Existing app.min.js, configuration and Pokémon artwork are unchanged.
