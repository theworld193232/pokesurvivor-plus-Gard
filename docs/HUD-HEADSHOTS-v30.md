# In-game move-bar portraits — v30

The native bottom move bar now draws the active Pokémon's headshot in its left-hand frame, replacing only the animated sprite in that slot. Existing layout, HUD scaling, border, life icons, HP, moves, cooldowns and stats are preserved. The source portrait is selected again each frame, so evolution and team switching use the currently controlled species. Mega/Primal actors use their base-species headshot. Shiny Ralts/Gardevoir have correctly coloured SpriteCollab portraits; other shinies currently use the normal headshot. Missing/loading portraits fall back to the original sprite.

This uses the same 966-headshot sheet from v29 and two additional unmodified shiny portrait PNGs. Credits are in SOURCE_LICENSES/site-import-v29/SHINY-HUD-PORTRAITS-v30.md.

The bounded hook is reproducible with scripts/patch-hud-portrait.cjs; scripts/patch-engine.cjs applies it after the existing import hooks. The original surrounding HUD drawing remains intact. See HUD-PORTRAIT-HOOK-v30.json.

Doofcraft was also inspected through a separate authorized test account. A muted Fennekin Waves run reached the first round reward, used Fire Spin, checked movement and saved successfully at 0:50. Account-only special forms and trainer backgrounds were found; this corrects the limited public-catalog findings from v29. Details are recorded in DOOFCRAFT-ACCOUNT-INSPECTION-v30.json. These newly observed event systems/assets are not imported in this HUD update.

Install HUD-Headshots-v30.zip in the game root, replace matching files, then hard-refresh. No save clearing required. The complete v30 game archive also contains all prior v29 additions.
