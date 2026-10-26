# Scenery-relative Pokémon sizing — v25

Supersedes v24's literal 32 pixels per metre. Canon species/form heights still determine relative size, but a shared gentle curve makes small Pokémon readable against the existing trees, tents and rocks: max(28, 56 × metres^0.55) world pixels. This intentionally compresses real-world size differences for the game camera.

Approximate heights: Pikachu 34 px (was 13), Zubat 50 (was 26), Gardevoir/Mega Gardevoir 73 (was 51), Groudon 112, Primal Groudon 136, Mega Rayquaza 207. Players and wild Pokémon use the same rule; padding and native animator scale are compensated. No rarity bonus. Existing collision limits, damage, evolution, Mega obtainment and save data remain unchanged.

Install Scenery-Size-Fix-v25.zip in the game root, replacing matching files, then hard-refresh. No save clearing needed.
