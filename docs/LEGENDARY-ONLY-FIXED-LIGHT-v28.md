# Native ordinary Pokémon sizes and fixed companion light — v28

Supersedes v27's ordinary species curve. Ordinary Pokémon draw with their native animator sizes: no Pokédex height conversion, compression, species multiplier or scaling-derived collision changes. Player, wild, ordinary bosses and evolved forms follow this rule. Legendary/Mythical species, using the friend game's legendary classification, retain the current canon/form-based size curve. Explicit native transformations remain intact.

LoverGare's Ralts and Gardevoir (including Mega) have a fixed pink companion eight world pixels beyond their maximum Idle/Walk silhouette, with a 1.5× core/halo. It never bobs, orbits or changes sides. Scenery occludes it instead of moving it. The light radius is 320 world pixels with a brighter near-white pink inner light, applied to both native darkness and the cave's dedicated darkness mask. No save-data changes.

The supplied pokesurvivor-plus-main (1).zip was compared byte-for-byte against the upstream revision already imported: 51d69dd6cf94a96019c0e5da484a05f6f2aff999. All 16,266 files match. No additional upstream changes were available. Existing friend AI, maps, weather, team and type integrations remain in place. See FRIEND-ZIP-AUDIT-v28.json.

Install Legendary-Only-Fixed-Light-v28.zip into the game root, replacing matching files, then hard-refresh. Do not clear save data.
