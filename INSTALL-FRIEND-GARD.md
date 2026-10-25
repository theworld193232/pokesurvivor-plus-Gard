# Friend + Gard merged build — 2026-10-24

Extract the full ZIP into a NEW folder. Keep your existing Gard game and saves as a backup. Run the extracted folder using a local web server (for example, `python3 -m http.server 8767` from that folder), then open http://127.0.0.1:8767/. Deploy the contents together if you host the game. `sw.js` belongs beside `index.html`; keep the js, css and assets folders in place.

This build starts from your friend's supplied **pokesurvivor-plus-main (2).zip**. It is a full game, not a patch for the old Gard folder.

## What owns each system

| System | Build behavior |
|---|---|
| Regular maps | Friend's forest/map generation, lakes, paths, mansion, giant trees and logs, plus seeded solid abandoned cabins |
| Area Zero | Gard's regional terrain generator |
| Wild AI | Friend's original brain, social interactions, native move choices and combat/status system |
| Weather | Friend's original sky, lighting, ambience and lightning; Gard ability weather is a local gameplay effect |
| Gard additions | Balancing, custom Pokémon move kits/animations, Mega/Primal support, cries/music, gacha, grounded dens and five starting upgrades |
| Testing panel | LoverGare only; no account or backend admin permissions changed |

Story mode and Trainer battles are removed. Both the LoverGare-exclusive Gardevoir appearance and Bikini Gardevoir option/assets are removed. Mega Gardevoir and its existing gameplay/cinematics remain.

Lavender Town (the supplied Let's Go MP3) fades in near/inside the haunted mansion, or when the original sky is very dark AND heavily foggy. It loops until the conditions clear, then fades back to normal music. Small entry/exit thresholds prevent flickering. Existing Mega, legendary, Primal, special battle and emergency HP music retain priority. The custom music toggle and volume control apply.

The final preview that looked different was explicitly running **Area Zero**, not the regular forest. The normal map retains your friend's forest generation. Test preview pages are excluded from this release.

## Validation and limits

17 targeted regressions passed and every loaded local JavaScript file passed syntax checking. Friend forest, sky, lighting, ambience, brain, social, moves and combat files were checked byte-for-byte against the supplied ZIP. Previous native playtests covered solo combat, multiple NPC moves and status effects, gacha, Mega/Primal kits, Area Zero dens, and local offline co-op upgrades. See docs/VALIDATION.json.

Firebase configuration now points to your original Gard project so your existing account can load. Included security rule files are still from the friend's source; they were not deployed. See RESTORE-LOVERGARE.md before any backend changes. Live authentication and internet co-op were not verified. Old Gard cloud saves are not automatically migrated. This is an integration build; the entire roster and long-run balance have not been exhaustively tested. Base Pokémon records were compared: all 966 shared records match; custom kits are supplied through the add-ons.

For rollback, use the separately supplied untouched original friend ZIP in a separate folder. Do not overwrite a working copy with an old patch. No deployment or Git push was performed.
