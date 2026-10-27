# Browser game imports v37

This update builds on v36. Keep the current game folder, saves, and friend AI/maps.

## Installed and available in the game

- Surfing Pikachu, Witch Gengar, Count Dragonite: select an owned Pokémon, then its Appearance selector. Turn Shiny off for these original-palette costumes. Stats, types, moves, unlocks and held-item rules stay the native species' own. Mega temporarily uses its own form art; returning restores the selected costume.
- Guardian Signs animation strips for selected ordinary fire, water, electric, ice, psychic, fairy, dark, ghost and poison projectiles. Adapted through VFX profiles, with native damage, cooldowns, collision and statuses retained. Custom Gard signatures keep their existing profiles; beams retain their previous beam shapes. Existing Grass leaf art retained.
- Two Daniel Diggle Sunnyside mushroom strips integrated as small decorative accents on suitable dry forest floor and near cave crystals. No new blocking obstacles, no mountain mushrooms, no placements in temple rooms or near cave doors. Seeded positions; bounded visible draw count.
- Mountain camp rest: stand within 85 px of a campfire for six seconds without moving or nearby hostiles. It restores up to 10% of the active Pokémon's maximum HP, once per campsite per run. Damage interrupts resting and blocks it for eight seconds. No revival, healing beyond maximum HP, or co-op healing. This independently adapts the recovery-camp concept seen in PokéDive.

## Source findings

| Source | Findings and decision |
| --- | --- |
| Tutners | Public client modules, SpriteCollab-based promo accessories and per-folder artist credits. Three complete eight-direction costumes imported. Its economy, promo combat bonuses, tower-defense balance and account service were not imported. No public GitHub repository was located in this inspection. |
| Shadows of Almia Showdown | Public GitHub repository. Uses SpriteCollab, Guardian Signs effect strips, Sunnyside World and paid Fan-tasy map art. Selected effect strips and two usable Sunnyside props imported with credits; paid map packs, trainer system, original synthesized music and application code excluded. |
| PokéDive | Guest mode inspected; public manifest has 1,935 base/shiny sprite entries. Credits identify SpriteCollab and PokeAPI. Its public client draws terrain procedurally; the maps are not simply a downloadable set of map PNGs. No application code copied. |
| Pokémon browser games Reddit | Located the creators' PokéDive and Almia descriptions and used them to identify actual feature scope and source links. |

Neither Almia's form directories nor PokéDive's manifest supplied the missing animated Mega Metagross or Mega Mewtwo X. Tutners did not provide a verified directional sheet for either during this inspection. Existing duplicate Mega/forms were left alone. Portraits or battle-only pictures were not installed as walking models.

Potential future adaptations, not installed in this release: PokéDive rescue-and-town work assignments, move-use progression, branching biome routes, and Almia-style extract-to-storage encounters. These need intentional balance/UI design; importing them wholesale would change our run loop and friend AI.

## Map design takeaways

Use connected dry routes with believable water sources; keep bridges as actual traversable connectors; group small props beside major terrain features; reserve room around entrances; use separate floor, wall and canopy layers. Continue using the existing generator and collision rules rather than replacing maps with another game's complete scene.

## Installation

`Browser-Imports-v37.zip` is a patch over the complete v36 build. Extract it, then copy its contents into the existing game root beside `index.html`, merging `js`, `assets`, `docs` and `SOURCE_LICENSES` and replacing matching files. Do not replace a whole assets directory with the patch's smaller assets directory. Use the full v37 ZIP for a complete folder instead. Deploy to the same website/origin and account to retain access to the existing browser save; these packages do not contain or erase personal account data.

Gardevoir skin starter sheets are in the separate `Gardevoir-Skin-Template.zip`; the skin guide explains editing every animation and keeping cell dimensions unchanged. No new Gardevoir outfit was invented or installed in this update.

Credits and precise provenance: `SOURCE_LICENSES/browser-games-v37/PROVENANCE.md`. Source inventory and hashes: `docs/BROWSER-GAMES-AUDIT-v37.json`.
