# Consistent canon-based sizing — v24

This supersedes the separate player multiplier from v23. All Pokémon use the same linear conversion: 32 world pixels (one terrain tile) per metre of listed Pokédex height. Player, wild, boss and legendary actors have no separate size bonuses or arbitrary player cap. The existing explicit Dynamax effect remains a transformation mechanic.

Sizing uses opaque idle-frame pixels rather than padded frame dimensions, compensates for Animator.scale, and reads the currently displayed Mega/Primal form. Gardevoir and Mega Gardevoir both stand 51.2 world pixels tall (1.6 m), Pikachu 12.8 (0.4 m), Groudon 112 (3.5 m), and Primal Groudon 160 (5 m). Large species really are large; tiny species really are tiny. Pokédex length/height figures are treated as the canonical sprite dimension in this top-down representation.

Metadata source: https://github.com/PokeAPI/pokeapi/blob/master/data/v2/csv/pokemon.csv . Runtime is self-contained and does not request the API. The metadata stores its source hash. Cosmetic/type forms without their own Pokémon record retain their species height. Sprite measurements include the Gard form aliases used in co-op.

Install Canon-Size-Fix-v24.zip into the game root and replace matching files, then hard-refresh. No save clearing is needed.
