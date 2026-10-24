# Gard and friend feature audit — October 24, 2026

Compared the supplied pokesurvivor-plus-main.zip with the current Gard workspace and GitHub upload 48a8cccb. Both the friend game and Doofcraft remain in scope. A feature already present in Gard is not an import candidate merely because its files have another name.

## Exact file and artwork results

The ZIP has 17,346 entries, including directories, and 15,178 actual files. Of these, 13,991 are byte-identical at their Gard paths, 12 differ, and 1,175 have paths absent from Gard. See FRIEND_FILE_MANIFEST.json for every path, byte size and SHA-256. The archive SHA-256 is 3681d652679a12ea126aa721cb04ebf0298f061ce92c964c87880032b21c053f.

83 alternate-form sprite folders account for 1,134 new paths. Canonicalizing punctuation matches 41 Gard folders: 39 Mega and two Primal forms. All 546 matched sprite sheets are pixel-identical after RGBA decoding, despite different PNG bytes. No dimensions differ. These are duplicate artwork, not new Mega/Primal content or alternate designs. This corrects the earlier assessment which could only establish that PNG bytes differed.

The other 42 folders contain 588 sheets, and have no matching canonical Gard asset directory. They are asset candidates, not proof of playable/registered forms. Each needs matching animation metadata, form triggers, types/stats, ownership/save handling, partner restrictions and multiplayer appearance checks.

Gard's FORM_DATA lists 93 definitions: 91 Mega entries and two Primal entries. Only 41 definitions have spr enabled and matching form asset folders. Definitions alone must not be counted as 93 fully supplied distinct sprite forms.

## Already present in Gard

| Feature | Gard evidence | Treatment |
| --- | --- | --- |
| Primal Kyogre, Primordial Sea and reversion cutscene | mega-native.js, primal-kyogre.js, assets/pokemon/382-primal | Preserve Gard; friend sprite sheets duplicate pixels |
| Primal Groudon, Desolate Land and reversion cutscene | mega-native.js, primal-groudon.js, assets/pokemon/383-primal | Preserve Gard; friend sprite sheets duplicate pixels |
| Primal domain clash / Outbreak | primal-outbreak.js | Preserve Gard's interaction rules |
| Mega Rayquaza and Delta Stream | mega-native.js, delta-stream.js | Preserve weather/domain priority |
| Mega forms, kits, passives and co-op appearance sync | mega-native.js, mega-kits.js, abilities.js, mega-coop-sync.js | Do not layer a second transformation controller |
| Gardevoir/Echo/Hoopa/custom moves and cinematics | echo-singularity.js, echo-cutscene.js, hoopa.js, fx-moves.js, legend-moves.js | Preserve custom mechanics |
| Collection search, type/region/ownership/shiny/favorite filters and sorting | dex-plus.js | Already implements much of the Doofcraft collection idea; Upgrades search would be a separate extension |
| Story chapters, Trainer, ball catching, potions, bag, mart and special gacha | story-mode.js, route1.js, catching.js, special-gacha.js | Story-only; do not add Trainers/catching to Original |
| Individual size categories | catching.js | Different from the friend's species height/weight scaling; do not stack blindly |
| Biome regions, themed spawns, weather effects | terrain.js, run-plus.js, native World/Weather | Partial conceptual overlap with Living Environment |
| Wild evolution | wild-evolve.js | Exists; friend's emotional/environment triggers would require reconciliation |
| Bond across evolution lines and inherited upgrades | bond.js, evo-upgrades.js | Different from NPC social memory; preserve both distinctions |
| Roaming legends, lore encounters, bosses and named 25-enemy waves | roamers.js, lore-events.js, waves.js, modes.js | Preserve spawn ownership, pacing, and rewards |
| Base enemy personalities and provocation | enemy-ai.js | Existing controller; extend it rather than running the friend's installer in parallel |
| First friend species personality port | wildlife.js, wildlife-species.js | Solo-only bounded port; not the full 32-module system |
| Minimap, FPS and reduced base shake | quality.js | Extend existing settings instead of importing a second panel |

## Friend module comparison

| Friend modules | Current status / integration boundary |
| --- | --- |
| 00-core, 99-install | Not imported. Registry/installer conflicts with Gard's hooks. Gard adapter uses PS_HOOPA_ENGINE. |
| 10-species | Ported into isolated wildlife-species.js namespace. |
| 20-mind | Personality-scaled short-term anger/fear adapted; complete emotions, relationships and memory are not yet ported. |
| 60-behaviors | First subset adapted; current extension adds waking/rest/watch, Psyduck headaches and singer/dancer routines. |
| 30-perception, 75-social | Bounded social adapter now adds greetings, chase play, shared rest, comfort and non-lethal rival sparring. Full perception, persistent friendships/grudges and protective group reactions remain candidates. |
| 80-legendary | Nearby fear/awe subset adapted. Primal terrain/weather/damage effects remain owned by Gard. |
| 95-render | Original pixel emote painters and wordless bubble adapted in wildlife-emotes.js. No written reaction labels. | 
| 92-player | Peaceful-target exclusion adapted while preserving incidental damage. Optional focus remains a candidate; Gard's number-key move slots are preserved. |
| 12-sizes, 14-scale | Height/weight-based scaling is new; reconcile existing individual sizes, body anchors, collision, custom Gardevoir and Primal sizing first. |
| 33-gen, 37-areas, 90-population, 91-progress | Partial overlap with Gard biome spawning, pressure, waves and boss/rift pacing. No direct import. |
| 35-env, 36-sky, 62-envbeh | Living day/night, seasons, weather routines, shelter and species environmental reactions remain candidates. Follow Gard's Primal/Delta weather precedence. |
| 38-art, 38-atlas, 39-decor, 93-ground, 94-light | New decor atlas, ground rendering, lighting, shadows, wet ground and lanterns. Need terrain/collision/depth adapters; no direct overlay import. |
| 40-moves, 50-combat | NPC move selection, NPC battles and friendly fire are not ported. They touch kill attribution, catches, XP and owner-controlled damage. |
| 85-evolution | Additional emotional/environment triggers; existing wild evolution must remain the single evolution owner. |
| 86-lore | New rumors, environmental stories and old-trail content; distinguish from Gard's existing Deoxys/egg/other encounters. |
| 96-panel, 97-audio, 98-debug | Not imported. Adapt necessary controls to Gard; ambient sound stays off during agent tests. |

## Other new assets and conflicting files

New non-Pokémon assets: assets/env/atlas.png, three UI item icons (evo-stone, mega-stones, rare-candy), and a social-preview image. The atlas is genuinely new relative to the older friend ZIP. Its supplied credits identify KioRaka for cemetery items and user-provided sheets whose original artists are not fully identified. Preserve the supplied attribution if integrating art; this pass does not redistribute the atlas.

Twelve conflicting paths: CREDITS.md, README.md, four zone-4 UI images, config.js, css/style.css, firestore.rules, index.html, js/app.min.js, version.json. Keep Gard's config/rules/engine/layout; merge only specific compatible improvements. Do not replace Gard's credits with the friend's whole file.

## Loading versus merely having files

Upstream 48a8cccb contains the first wildlife files but its index.html does not load wildlife.js or wildlife-species.js. It also retains older enemy-ai/quality/dens version tags. The local patch index includes the missing scripts and current tags. Upstream has extra copies coop-layout.css at the root and sw.js under js; the working references use css/coop-layout.css and root sw.js. Extra uploaded files have not been deleted.

## Next selected imports

The requested subset is implemented: wordless original pixel emotes, nearby Legendary fear/awe, peaceful-target exclusion with incidental damage and reactive crying/fleeing/retaliation, bounded Pokémon interactions, and den art/depth/collision correction. Dens have no ground energy border and activate from any side. See LIVING_WILDLIFE_V2.md for validation and limits. The co-op/wildlife switch and special-enemy exclusions remain.

After those pass, evaluate a single alternate-form family with its metadata and rules, then a bounded environment/decor adapter. Doofcraft work remains selective: Upgrades-specific search and input/accessibility improvements are useful candidates; collection filtering, basic shake controls and overlapping forms are already present.

## Form folders without a canonical Gard asset directory

- 1017_cornerstone
- 1017_hearthflame
- 1017_wellspring
- 351_rainy
- 351_snowy
- 351_sunny
- 386_attack
- 386_defense
- 386_speed
- 413_sand
- 413_trash
- 421_sunshine
- 479_fan
- 479_frost
- 479_heat
- 479_mow
- 479_wash
- 483_origin
- 484_origin
- 487_origin
- 492_sky
- 555_zen
- 645_therian
- 646_black
- 646_white
- 648_pirouette
- 718_10
- 718_complete
- 720_unbound
- 741_pau
- 741_pompom
- 741_sensu
- 745_dusk
- 745_midnight
- 778_busted
- 800_ultra
- 849_lowkey
- 888_crowned
- 889_crowned
- 892_rapid
- 905_therian
- 964_hero
