# Teams, transformations and portraits — v31

Replace the matching files in the existing game folder with this update, preserving folder paths. Use the full-game ZIP for a complete fresh copy. Save storage keys and account data formats are unchanged. Test controls and offline previews are excluded.

- Fixed returning team members reverting to an earlier evolution, and blocked delayed Primal reveals from overwriting an incoming team sprite.
- Fixed the Team screen crash, unified the menu Pokémon sprite/name/button navigation, and added shiny team headshots.
- Added 965 default shiny portraits and 185 normal/shiny transformation portraits covering 95 Mega/Primal keys from SpriteCollab. HUD and the active team slot follow the current transformation; unavailable art uses the existing base portrait.
- Restored automatic Ad Astra for Mega Rayquaza, Origin Pulse (Primal), and Precipice Blades (Primal). Reversion restores the original learned move without deleting moves acquired while transformed.
- Primal Groudon and Kyogre remain transformed until the form is ended, the Pokémon is switched out, or the run ends. Normal Mega duration remains unchanged.
- Isolated per-member passive stacks and private revive/XP/critical bonuses across team switches. LoverGare Gardevoir’s level-50 J’s Will invokes native Mega activation after its revive, including the Gard presentation and exclusive move kit.
- Groudon creates walkable land on real water, preserving solid structures. Primal Groudon sets the world clock to noon; cave darkness still applies indoors.
- Added ownership-gated, stat-neutral Shadow Mewtwo, Shadow Lugia and Bloodmoon Ursaluna appearances in Pokémon profiles. Imported art is credited under SOURCE_LICENSES/site-import-v31.

Mega stones: defeat Act 2, then transform in Act 3 or later while holding the matching stone (Gardevoirite / Red Orb / Blue Orb). Drop chances: level-up 1%, ordinary chest 5%, big chest 10%, plus a hidden world opportunity. Rayquaza has the item-free exception after the same progression requirement. Native Space activation is retained. J’s Will is the private revive exception.

Validation: 130 automated checks; offline browser checks for all three transformed signatures, Primal persistence past 90 real seconds, correct team passive removal/restoration, the Team menu, collection navigation, special appearance selection, Groudon ocean land, and the exclusive revive’s Mega kit. Online co-op was not covered by this pass.
