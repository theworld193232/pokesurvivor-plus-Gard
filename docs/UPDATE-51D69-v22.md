# Friend update 51d69 — v22

Imported the runtime changes in pokesurvivor-plus-main.zip (51d69dd6cf94a96019c0e5da484a05f6f2aff999): measured sprite heights and more accurate Pokémon sizing, colossal forest trees and their trunk/perching collision, ghost apparitions, revised boat boarding/disembarking, authentic type multipliers and immunities, and teams of six.

Team switching currently applies to solo play. The existing player level stays shared, benched species respect the retained evolution level gates, moves/HP stay with each member, and switching ends native Mega/Primal before changing species. Team portraits are raised above Gard's bottom HUD. Fainting switches to the next healthy member. Team Z/X controls do not also reach other game handlers.

Preserved: Gard gacha, custom kits/balance, native friend Mega stone/stage obtainment, Gard Mega/Primal presentation and music priority, Act 2 cave/mountain/temples, Area Zero, account configuration, owner-only testing, no Story/trainers and the earlier cave restart/beach stair fixes. Imported apparitions respect quiet temple rooms. The engine file did not change in this upstream update.

## Groudon
Active Primal forms repair a base animator overwritten while their native form is still active. This does not restart the cutscene or extend native duration/cooldown. Explicit reversion still works normally.

Base and Primal Groudon can crush ordinary Act 2 scenery on contact: crystals, rocks, trees, tents, campfires, tracks, debris and ground plants. Draw lists, water reflections and collision all use the same run-local destruction state. Cleared objects stay cleared across area travel and return next run. Cave walls, water sources, entrances and special temple architecture/guardians remain protected.

## Restored moves and improved effects
Native friend Mega activation now grants Gard's existing bonus signature and bond moves. Mega Gardevoir gains True Moon Blast + bonded Blackhole. LoverGare's Gardevoir uses Echo's True Potential, with its moon orb, glitter and three moon meteors. The owner variation is applied to the owner's move instances; the shared move definition is preserved. Bonus moves are removed on timed reversion without erasing normal moves or earned move-slot upgrades. Primal signature moves are also restored.

VFX add a shaded lunar core, crescent highlights, orbiting diamond glints and more readable singularity spirals with less bloom. Inspiration: the official Pokémon UNITE Gardevoir / Fairy Singularity presentation: https://unite.pokemon.com/en-us/pokemon/gardevoir/ . No downloaded game/video assets were copied.

## Validation and limits
107 automated checks, production script syntax checks, and targeted offline browser tests passed. Native checks covered Primal animator repair, crystal/tree destruction with clear collision, protected entrances, team switching and faint recovery, ghost apparition creation, exact type immunities, boat double-tap boarding/disembarking, restored moves, owner Echo casts and live VFX. Audio remained muted. Cloud login, internet co-op and every individual form/quest ending were not exhaustively tested.

## Install
Extract Friend-Update-51d69-v22.zip into the game root and replace matching files, preserving folders. Alternatively use the updated full game ZIP. Hard-refresh afterward; do not clear save data. New controls: Team in the menu, Z/X or portraits to switch; click/select a boat and double-tap Space to board, double-tap again in shallow water to get off.

Recovery: PokeSurvivor-pre-51d69-v21.zip.
