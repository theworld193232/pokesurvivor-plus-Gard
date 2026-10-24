# Doofcraft public game review — October 24, 2026

Source: https://pokesurvivor.doofcraft.com/#login
Read-only inspection of the public HTML and its referenced index-DvTSsRo-.js, app-CbZSoc6i.js and screens-V9ZRSHud.js bundles. No account login, private endpoints, account data or multiplayer sessions were accessed. No downloaded code was executed or merged into Gard. Downloaded reference bundles remain outside the project in temporary storage.

The public client is a separately built module-based application. Its app shell calls an API for saves/settings and uses a different room connection flow. Replacing Gard's engine, menus or account files with these bundles would disconnect existing integrations. The inspected bundles did not identify a source repository or reuse license; public readability alone does not establish permission to redistribute their implementation. Features can be implemented independently in Gard.

## Useful candidates

| Observed in public client code | Possible Gard adaptation | Main compatibility check |
| --- | --- | --- |
| Pokémon collection filtering by name/dex, generation, type, rarity and shiny, with sorting | Search and filters for long Pokémon lists | Keep the selected Pokémon stable when filters change; preserve owned/shiny rules and mobile fit |
| Starting move, second move and numbered move bindings | Clear move-slot setup in the Pokémon Upgrades screen | Gard's custom move registration, unlock rules and host/guest choices |
| Keyboard/controller navigation with dedicated input-device and menu-navigation modules | Consistent focus, confirm/back controls and button hints | Avoid intercepting battle movement, chat typing or existing mobile controls |
| Settings for HUD size, damage numbers, damage flash and calm mode | More readable combat and optional reduced effects | Gard already has PS_SETTINGS.reduceFx and a base-game shake setting; extend the existing system |
| Loading recovery message with a bounded retry window | Clear recovery instructions for failed game assets | Avoid reload loops and preserve an active run; use Gard's existing loading flow |

These are confirmed code paths, not a claim that each feature was played or visually verified on the public deployment. No new gameplay, asset or account functionality from this site is included in the co-op download.

## Current sequence

1. Co-op menu, five starting cards and grounded den fixes: implemented, locally tested and packaged separately.
2. The new friend ZIP was supplied and its first solo species/personality subset is ported. See FRIEND_CURRENT_AUDIT.md for file/pixel duplication checks and the outstanding modules. Gard already has collection search/filters in dex-plus.js; adapt only missing Doofcraft features. The requested wordless emotes, Legendary reactions, peaceful targeting with incidental damage, bounded NPC interactions and all-side den activation are now implemented; see LIVING_WILDLIFE_V2.md.
3. Adapt selected Doofcraft features only after the solo behavior work, preserving the stable co-op patch as its own install/rollback pair.
