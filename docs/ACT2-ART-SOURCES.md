# Act 2 art sources and final prompts

Used the built-in image-generation tool for the snowy temple edit and the original winter-tree atlas. Tents use the blue and green cells of the user's supplied sheet, saved unchanged.

Saved assets:
- /Users/joshua/Documents/Codex/PokeSurvivor-Friend-Gard/assets/env/regigigas-snow-gate-v2.png
- /Users/joshua/Documents/Codex/PokeSurvivor-Friend-Gard/assets/env/mountain-tents-reference.png
- /Users/joshua/Documents/Codex/PokeSurvivor-Friend-Gard/assets/env/mountain-round-trees-v1.png

The renderer extracts sprites and applies integer pixel scaling. The saved generated PNG files retain their original alpha channels. All three images are also embedded in js/crystal-peak.js.

## Final temple prompt

Use case: precise-object-edit. Asset type: transparent pixel-art game environment sprite for a Pokémon-style top-down game. Edit target: supplied wewae.png. Keep the original structure, camera angle, rectangular ancient stone facade, four textured cylindrical columns, recessed dark central doorway and steps. Preserve its classic handheld-game pixel art and muted blue-gray stone texture; do not replace with smooth vector shapes or 3D painting. Remove the little human character standing on the stairs and reconstruct the stone steps behind them. Make this an abandoned Regigigas mountain temple entrance: add settled white snow on the roof rim, cornice, column capitals and footings, a few short icicles, and a small weathered seven-dot Regigigas marking on the upper central wall. Keep the central doorway open and pitch black. Maintain the original broad silhouette and its short staircase. No landscape, people, Pokémon, text, glow, border, drop shadow or backdrop; genuine transparent background around the building. Sharp pixel edges, individual pixel stone chips, no antialiasing or soft halo. This must closely follow the reference architecture and texture.

## Final tree prompt

Use case: stylized-concept. Asset type: ORIGINAL handheld-era pixel-art game tree sprite atlas, transparent PNG. Reference tree.webp is a STYLE REFERENCE for the rounded tiered silhouette and winter snow treatment. Create TWO new distinct rounded deciduous mountain trees, side by side in a single horizontal row, each isolated in its own equal-width half with generous transparent margins. Left tree: rounded tiered dark evergreen foliage with heavy settled white and icy-cyan snow on almost all tiers, a small exposed dark-brown trunk and roots. Right tree: a somewhat taller rounded oval canopy almost fully buried in thick white snow, soft blue pixel-shaded scalloped tiers, small visible brown trunk/roots. Both look rooted and face the same elevated top-down Pokémon RPG camera as the reference. Crisp chunky pixel clusters, tiny logical sprite about 48x64 pixels enlarged with nearest-neighbor, limited color palette, no smooth painting, antialiasing or gradient. No scenery, people, letters, logos, watermark, framing, ground disk or cast shadow. Actual alpha transparency outside each tree. Each entire tree including its roots is inside its own half; same baseline, no overlap. Two trees only; do not recreate the reference sheet.

