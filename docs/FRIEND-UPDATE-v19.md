# Friend update integrated into Gard — v19

Source: pokesurvivor-plus-main.zip, revision 76180a2196d2deff569f7f9712d7afba275e8bb4.

## Added and updated
- Latest friend AI, 25 natures, wildlife interactions, breakable objects, multi-move combat and status effects.
- Tropical Ocean replaces the old stage 3 volcano: harbor, boats, islands, reefs, tides and new encounters.
- Updated forest, mansion, weather/lightning, encounter modules, portraits and dialogue assets.
- Exploration experience uses the existing player experience curve.

## Gard systems retained
Level-based wild admission and evolution, player progression, gacha, custom Pokémon kits and balancing, Mega/Primal/Dynamax hooks, dens, soundtrack/Lavender trigger, account configuration, Area Zero and custom Act 2 cave/mountain/temples remain.

Story and trainers remain removed. Friend emotional evolution, no-gacha replacement, milestone power rework and Totem trials are disabled because they conflict with Gard progression. Imported music is present but automatic playback stays under Gard control. Wild speech remains disabled by default. New dialogue/events are suppressed inside quiet Act 2 temples. New dev console is restricted to LoverGare.

The new ocean and the retained Nightmare volcano are distinct maps. Special entrances remain at 50% testing probability.

## Installation
Use the full game ZIP for a clean complete folder, or extract the update ZIP into an existing pre-v19 Gard game root and replace matching files. Do not put the ZIP itself or an extra nested folder inside assets. Keep account/save data; do not clear browser storage. Hard-refresh after updating.

This is a local packaged update, not a deployment. Recovery build: PokeSurvivor-pre-friend-76180-v18.zip.

## Validation
91 automated regression checks plus targeted muted browser checks: forest AI, multiple attacks, poison/burn, lightning, ocean/boats, Act 2 level pools, temple isolation, Area Zero and gacha. Firebase login, internet co-op, every quest ending, and full-roster long-run balance were not exhaustively tested. See VALIDATION.json for current evidence and prior Act 2 history.
