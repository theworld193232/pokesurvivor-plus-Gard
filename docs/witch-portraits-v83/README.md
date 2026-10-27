# Portrait refinement v83

The final Mega headshots blend the original Mega Gardevoir portrait template with the newer Giratina costume design. They retain the original face angles, rounded haircut and curled cheek hair, with stronger gold/silver side crests, red/blue bows and subtle wing/shoulder accents. Both normal and shiny versions have ten expressions.

Shiny Witch Gardevoir now selects a separate purple portrait set: violet/lavender hair, purple eyes, hat band and collar trim. Normal Witch portraits remain green. Together there are forty distinct skin expression crops. Existing ten-second mood holds and the skin/account restrictions are preserved.

Current art:
- Normal Witch: first two rows of `assets/ui/witch-portraits/emotions-v82.png`.
- Purple shiny Witch: `assets/ui/witch-portraits/witch-shiny-emotions-v83.png`.
- Final blended Mega normal/shiny: `assets/ui/witch-portraits/mega-emotions-blend-v83.png`.

HUD and selection/team portrait rendering use the appropriate atlas cell. Original Gardevoir portraits remain the fallback when the Witch appearance is not selected. This update changes portraits; v81 world-sprite PNGs and wing placement are unchanged.

Install: merge the update into the full game beside index.html, replace matching files, then hard refresh. The archive includes the supplied v81 update and the v82/v83 portrait integration. It is an update archive, not a standalone complete game.
