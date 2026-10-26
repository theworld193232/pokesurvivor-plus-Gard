# Fixed brighter orb and more readable small Pokémon — v27

Supersedes v26. LoverGare's Ralts/Gardevoir orb stays beside the shoulder (no orbit, bob or side changes), sits eight world pixels beyond the widest Idle/Walk silhouette, and its pixel-art core and halo are 1.5× larger. Obstructing scenery hides the core instead of relocating it. Its pink world light reaches 260 world pixels rather than 145, with stronger light in the cave darkness mask and native night lighting.

Per the latest clarification, Pokémon still have species-relative sizes. The small end is enlarged: ordinary species use 32 + 32 × metres^0.55 world pixels. Ralts and Pikachu rise from ~34 to ~51 pixels; Gardevoir stays near ~73 pixels. Legendary/Mythical species (the game's legendary classification) retain the previous 56 × metres^0.55 curve and form heights. Player and wild species share the rule. Combat stats, evolution and save data are unchanged.

Install Fixed-Orb-Small-Pokemon-v27.zip in the game root, replace matching files, then hard-refresh. No save clearing needed.

Muted background visual checks covered Ralts beside forest scenery and the stronger light in the cave. Automated tests cover fixed placement, owner restrictions, occlusion, 1.5× core, light masks, shared sizes and unchanged legendary/form sizes.
