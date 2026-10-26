# Portraits, appearance previews and move-art integration — v29

This first batch uses public material from https://pokehorde.com/ and inspects https://pokesurvivor.doofcraft.com/ for compatible presentation and collection features.

## Included

- **966 normal Pokémon headshots:** an unmodified SpriteCollab portrait atlas served by PokéHorde. Local assets work offline. Artist records and license texts are in `SOURCE_LICENSES/site-import-v29/`.
- **Collection and team portraits:** the Pokémon screen defaults to headshots, with a toggle back to animated sprites. Profile cards show an 80-pixel headshot above the existing animated preview. Missing Pokémon keep the original sprite silhouettes. The solo team bar uses portraits for normal Pokémon and actual shiny sprite sheets for shiny team members.
- **Appearance comparison:** owned shinies can be compared alongside the normal animated sprite. This is a preview; ownership and unlock rules stay intact. Normal headshots are labelled as normal artwork.
- **Move inspection:** click an owned Pokémon's move icons for type, attack kind, base damage, cooldown and listed status effects.
- **Team shortcut:** add an owned Pokémon to the existing six-member team from its profile, or open team management when already present/full. Native ownership, team limits and level-appropriate evolution rules still apply.
- **Seven elemental animations:** original six-frame pixel generators for fire, water, grass, electric, psychic, ice and fairy. They adapt the native VFX interfaces for common moves and matching enemy projectiles. No damage, cooldown, hitbox, targeting or status changes. Gard's custom signature effects remain intact.

## Scope and source audit

PokéHorde's normal portrait atlas adds coverage far beyond the 72 species with expression folders already present locally. The atlas is kept intact (966 entries, 40×40 cells, 32 columns). SpriteCollab licenses and per-species portrait contributor names are included.

No separate costume/skin pack was identified in either public catalog. The verified appearances are normal, shiny and alternate forms; the local game already contains more form folders than PokéHorde. This release adds appearance preview tools rather than claiming to import new costumes. Both previously removed Gardevoir costumes remain removed.

Doofcraft uses a different client/server engine and its menu requires login. Only public client modules were inspected; no account was created and no private content or server endpoints were accessed. No Doofcraft code or private assets are included. Its move/collection presentation informed the local UI adaptations, and the animations are original native-engine code.

Ordinary Pokémon still use native sizes, legendary/form sizing stays enabled, and the fixed bright pink companion light remains as in v28. Friend AI, maps, weather, balancing, gacha, Mega rules and saved collections are preserved.

## Install

Extract `Portraits-Move-Art-v29.zip` into the game root, replace matching files and merge the `assets`, `js`, `docs` and `SOURCE_LICENSES` folders. Hard-refresh afterward. Do not clear browser storage. A complete root-level game archive is also supplied as `PokeSurvivor-Friend-Gard-v29.zip`.
