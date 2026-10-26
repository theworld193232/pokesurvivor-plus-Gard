# Act 2 — Crystal Cave and Snowy Mountain, revision 18

## Install

Extract the revision 18 patch into the existing merged Friend + Gard game, preserving folders. Replace:

- index.html
- js/crystal-peak.js
- js/pressure.js
- js/roamers.js
- js/gard-testing-panel.js
- js/wild-levels.js
- js/dens.js
- js/safezone.js
- js/rare-encounters.js

Refresh the page and start a new run. All new scenery, altar and doorway artwork is embedded in crystal-peak.js; no separate image upload is required. Keep config.js and your save data. Documentation is optional and does not need uploading. Use the full game ZIP if earlier integration patches were skipped.

## Movement and discovery

Solid props have smaller grounded footprints. Actor movement is swept along its requested direction and stops at first contact; it no longer searches for an arbitrary sideways escape while walking. Spawned or teleported actors still receive nearest-valid-ground recovery. Crystal sprite spacing remains separate from physical footprints. Cave-mouth sides remain solid and doorway centers stay accessible.

The cave and mountain continue generating beyond the old map bounds. Cave interiors remain dark and crystal-lit, without interior weather or sunlight. White terrain seams are prevented by stitching cached chunks before the camera transform. Native Act 1 remains unchanged.

The temporary special-area chance remains 50% independently for Regigigas and Terapagos, rolled once per new run. Successful entrances now appear near the start, reached by dry routes. Terapagos has a distinct crystal-and-stone doorway with hexagonal gold decoration, separate from the mountain's rocky exit. Discovery displays “Oh, what's this?” on approach. Owner-only testing controls also allow direct visits; they do not alter ordinary generation rolls.

## Terapagos sanctuary

The separate sanctuary has more prismatic crystal islands and reflected crystal light. A grounded stone apron and contact shadows connect the altar to the floor. Its stairs and platform floor are walkable; crystal roots, pillars and platform edges have physical collision. Artwork layers place actors on the stairs instead of hiding them behind the whole altar image.

Stepping onto the platform awakens one native Terapagos guardian. It uses the existing Pokémon, animation and move systems. Remaining on the platform does not create duplicates. Defeating it prevents another guardian in the same run; retreating allows a fresh encounter on re-entry. Ordinary enemy waves and roamers are suppressed in the separate sanctuary. This is a guardian encounter, not a newly implemented legendary capture quest.

## Snowy mountain

Snow is the dominant ground cover, with smaller exposed grassy patches and textured frosted turf. Dense wind-swaying white grass uses native grass sprites. Snow-laden firs vary in size; winter shrubs, snowy boulders, ledges, stumps and fallen branches add detail while routes remain clear. Snowfall and passing wind gusts are stronger.

Frozen water forms winding channels and irregular basins. Gard's glacier palette and frozen-ground detail conventions inform its surface, with cloudy depth, branching fractures, patchy frosted banks and faint steady reflections. The former thick continuous white rim is removed. Ice is traversable and does not run stream currents or water-drop ripples.

The mountain has a cold-weather wild pool, including Ice types, appropriate birds, and Swinub/Piloswine/Mamoswine. Native AI behavior, multiple moves and status effects remain in use. Articuno is the mountain's roaming Legendary through the existing roamer controller: its schedule, fleeing and capture rewards remain. It has a larger visual scale (at least 2.2) and matching body-size adjustment. Main-game roaming selection remains unchanged outside the mountain.

The separate red-ring projectile overlay was removed from pressure.js. Native move effects, damage, status effects and pressure/combo balancing remain.

## Performance and validation

Terrain noise and ice fields are sampled on a coarse grid and interpolated at the game's pixel scale, following the forest renderer's approach. Scenery overlap checks use spatial buckets; collision neighborhoods are cached; off-screen props and grass are culled. Ice reflections use the cached visible mask rather than repeated terrain searches.

82 automated checks cover integration, native encounter timing, generation, collision contacts, grounded prop footprints, special entrance reachability, sanctuary stairs/pillars, ice geometry, frosted grass, mountain species and Articuno's existing roamer integration. Loaded local scripts pass syntax checks.

Visible muted playtests verified the actual generated entrance and sanctuary travel; one Terapagos spawned after entering the platform, with no duplicate from a second trigger. The native mountain bag contained 36 appropriate species definitions; all sampled wild inhabitants matched it. Articuno spawned as dex 144 at visual scale 2.2. Grass rendering changed between timed frames. The populated snowy mountain sampled 45 frames at 16.5 ms average and 16.8 ms p95 (roughly 60 FPS) on the tested machine, with no warnings/errors. This is a local sample, not a guarantee for all devices or extended runs.

Area transitions remain solo-only. Internet co-op area travel, the full roster and long-run balance are not exhaustively tested.

## Revision 10 — snow interactions and entrances

Mountain firs sway around a fixed trunk and retain solid grounded trunk footprints. A seeded subset periodically sheds small snow clumps which fall to the ground and fade. Walking on snow leaves alternating footprints, capped at 180 marks. Prints fade after about 48 seconds and are buried faster in a blizzard. Ice and airborne Flying Pokémon do not leave snow footprints.

Frozen channels now retain movement momentum after input release and allow gradual braking/steering. Snow restores grip; object contacts stop the slide without a sideways shove. Ice and Flying types retain their native sure-footed/airborne exception. Native water slowdown remains separate.

Mountain weather cycles between snow and a named Blizzard state. Blizzards ramp up heavy snowfall and wind, with a player-centred whiteout reducing distant visibility. The HUD remains readable. The preview includes controls to test both weather states.

Seeded pixel campsites contain small tents and animated campfires, with solid tent/stone-ring footprints. Camps avoid frozen channels and entrance approaches.

The mountain retains its guaranteed return entrance, plus a 50% entrance roll per generated region. Return entrances are placed in dry clearings, separated by more than 480 world pixels. Cave rooms have at most one entrance; rare entrances take precedence over ordinary exits. The main cave-to-mountain exit is retained at a dry, reachable site. The Terapagos doorway uses solid pillar/crystal-root footprints around its open center. No visible energy fences were added.

Focused native checks observed about 17 world pixels of coasting after input release on ice, nine footprint marks after walking, the Blizzard weather state and its whiteout, campsite sprites, and no runtime warnings/errors.

## Dormant Regigigas and level-based wild encounters

Regigigas now has its rare entrance on the snowy mountain only. Snow-covered rock, ancient sideposts and the Regi markings distinguish it from an ordinary cave return. It leads to a separate dim ruined room, with broken columns, cracked paving and the supplied REGI.png as a large unmoving centerpiece. The original PNG is also included at assets/env/regigigas-dormant.png and embedded in the script. Only the exterior black background is matted by the renderer. The dormant statue stays outside enemy AI, targeting and combat. Before awakening its base and the aligned column roots are solid; the approach stays walkable. Leaving returns to the mountain and preserves its enemies; returning from the mountain restores the cave enemies.

Terapagos remains a separate cave discovery with its existing platform guardian. Each special finding still uses the requested temporary 50% testing roll per run; normal design target is 1%. The short discovery message remains in place.

Wild species now unlock relative to player level across ordinary bags, hordes and elite admission. Mountain Swinub appears from level 1, Piloswine from 20, Mamoswine from 35. Other evolved families use their progression requirements, with eligible ancestor fallbacks to avoid empty waves. Scripted legends, raids, guardians, allies and remote actors remain exempt. Friend AI move selection and status effects are retained.

Validation: 82 automated checks passed. Native offline playtest confirmed level 1/10/20/35 mountain pools, the supplied temple art and collision, and a mountain–temple–mountain round trip restoring all 33 enemies. Network co-op and full long-run balance remain unverified.

## Revision 13 — the three-Regi awakening

The mountain entrance now has a heavier snow cap, icicles, stone lintel and paired carved posts. Temple pillars form two parallel rows with matching left/right positions. Interior lighting is darker. Outdoor rifts and drops from the parent map are isolated from the room.

The owned collection must contain Regirock (377), Regice (378) and Registeel (379); they are not consumed and do not need to be the current partner. Approach the dormant statue to trigger a 4.2-second pixel crack and stone-fragment animation. Afterward, the stone shell disappears and a living Regigigas appears as one native guardian encounter. Defeating it grants Regigigas once for that encounter. Incomplete ownership leaves the statue dormant and shows a clue. Ordinary Regigigas admission and normal/shiny grants are also blocked before the trio is owned. Existing saved ownership is preserved.

Native test: zero/two Regis did not awaken it; all three triggered the cracking sequence and produced exactly one dex 486 encounter. Automated lifecycle tests cover the delayed spawn, duplicate prevention, statue collision release and one-time reward after defeat.

## Revision 14 — cave and summit ecology, silent temples

The ordinary cave has 62 available species, restricted to curated cave-dwelling Rock, Flying, Ground or Dark Pokémon. Examples include Zubat, Geodude, Onix, Aron, Woobat, Drilbur, Sableye, Gible, Deino and Nacli. The mountain has 57 available Ice or Flying species, including snowy evolution families, Swablu/Altaria, Skarmory, Rufflet/Braviary, Sneasel/Weavile, Amaura/Aurorus and Hawlucha. Sprite availability is checked. Existing level gates remain; cave evolution stages also unlock progressively. Ordinary bags, horde admission and wrong-habitat normal spawns use the current region's eligible pool. Scripted guardians/legends keep their special encounter rules. Act 1 is unchanged.

Temple columns now use cached low-resolution bitmap sprites rendered at an integer 3× pixel scale. Both sides share exact x alignment and matching row positions/footprints. The Regigigas room is darker.

Separate temple rooms suppress unrelated progress events, normal waves, Judgment and rifts. Den and pink-rift timers, entry checks and collision are suspended there; owner test spawn requests are rejected. Spawner announcements, UI toasts, collection popups, achievements and discovery overlays are suppressed while inside. This also silences the awakening text; the prerequisite, cracking animation, guardian battle and collection reward continue to work. Notification behavior resumes outside.

Verification: 82 automated checks passed. Native registry checks confirmed all available cave species match Rock/Flying/Ground/Dark and all available mountain species match Ice/Flying. Live temple tests rejected both den and pink-rift spawning, kept their counts unchanged and hid notification containers.

## Revision 15 — reference artwork, living groves and new passages

Regigigas has a separate snow-covered stone facade adapted from the supplied temple reference: four textured columns, an inset doorway, short stairs, heavy snow and the seven-dot marking. It shares no cave-mouth art. Four post roots and the upper threshold are solid; the middle stairs remain open. Its guardian/prerequisite rules and dark, quiet interior remain.

Blue and green front-facing tents come from the supplied tent sheet. Their bases sit in packed snow with a contact shadow and snow against the lower edges. Fires are centered directly in front, 58 world pixels from the tent anchor. Tent cloth flutters in pixel steps with the base rooted, and smoke drifts from the fire.

Mountain groves contain more trees and use two new rounded snow-covered tree variants alongside the firs. Canopies may overlap naturally, while tree roots remain at least 84 world pixels apart. Trees sway with the weather, periodically drop snow and leave bounded temporary soft piles. Snow piles are visual powder, not extra hard obstacles. Cave mushrooms release subtle spores and water receives occasional falling drips; these stay under the cave's crystal lighting.

Loose cliff-rock and grounded scenery bases now sample their full footprint against water and ice. Purpose-built spring rocks sit behind their water mouths. Flow still begins at an actual source and ends in its pool.

Ordinary cave/mountain crossings now choose a distant dry arrival beside another generated doorway after the first mountain visit. The next visit is at least roughly 1,400 world pixels from the previous location; typical routes are farther. Temple visits retain the return to their own exterior doorway. This remains solo-only.

Live validation: three ordinary crossings moved 3,833, 1,924 and 4,690 world pixels, all beside real doorways and on safe ground. Tent animation changed 4,048 sampled pixels; tree sway changed 10,215. The inspected grove had 36 visible trees and temporary shed-snow piles. A 45-frame model/environment sample averaged 16.6 ms (17.6 ms p95) with no warnings/errors. This sample had ambient enemies frozen and is not a full battle stress test. Automated suite: 75 checks passed. Artwork sources and final prompts are in docs/ACT2-ART-SOURCES.md.

## Revision 16 — touch-reactive trees

Walking into a mountain tree now starts a short, damped canopy shake on top of its ordinary wind sway. The root stays anchored and collision does not change. Sustained pushing does not restart the effect every frame; after a brief release, another bump can trigger it again. Only player movement into a trunk triggers the feedback, not NPC pathing or standing still. Contact state is bounded and clears on region/run changes.

Native collision playtest confirmed a live shake, a solid trunk, a safe player position and no sideways displacement. The automated suite now passes 77 checks.

## Revision 17 — entrances throughout the generated world

The original cave had one nearby mountain exit, sparse extra exits (5.5% of cells), and a Terapagos entrance that could only roll once near the world origin. Mountain Regigigas had the same origin-only limitation. Distant passage arrivals therefore moved players away from almost all special discoveries.

Each generated 3×3-cell cave district now has a mountain exit. The guaranteed starting exit is closer at (-300, 180), within the initial screen's neighborhood. Mountain exits use the snowy cave-mouth sprite, a frost-speckled approach and stronger local doorway lighting. Full doorway artwork and approach lanes reserve space against crystals, scenery and water. There is at most one entrance per cell, and separate gates stay more than 480 world pixels apart.

Terapagos now rolls independently in each cave district at the current temporary 50% test chance. Regigigas rolls independently in each mountain district at that same test chance. The original nearby rolls remain as extra starting discoveries. Each entrance leads to its existing separate room; the temples themselves stay off the ordinary maps. Regigigas still requires the owned Regirock/Regice/Registeel trio to awaken.

Special entrances are still RNG discoveries, but a missing starting roll no longer removes the location for the entire run. This supersedes the earlier once-per-run placement description. The intended normal chance remains 1% when testing ends. No guaranteed special entrance has been added.

Verification: 82 automated checks passed. A native cave sample found 7 mountain exits and 3 Terapagos gateways in the tested neighborhood, all with dry, clear approaches. Walking through a generated Terapagos gateway reached the separate sanctuary.

## Revision 18 — nearby entrances allowed

Entrances can share a clearing. A successful regional Terapagos roll now places its gateway about 260 world pixels beside that district's mountain exit. The original starting sanctuary roll is also beside the nearby starting exit. Regigigas discoveries on the mountain have a cave return about 285 world pixels to the side. The previous one-entrance-per-cell rule and 480-pixel exclusion are no longer enforced. A small safety clearance remains so door artwork and entrances do not overlap.

Approach lanes reserve space in front of both doorways. Regional discovery rolls remain at the current 50% testing chance; temple interiors remain separate. This supersedes the stricter spacing descriptions above.

Native playtest showed a snowy mountain exit and Terapagos gateway in the same cave clearing, and the Regigigas facade beside its cave return on the mountain. Sampled doorways and approaches remained clear and dry. Full suite: 82 checks passed. Refresh the game and start a new run to load the new placement rules.
