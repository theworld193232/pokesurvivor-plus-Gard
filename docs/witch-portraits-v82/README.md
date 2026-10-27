# Witch and Dreadful portraits v82

Adds thirty skin portraits: ten Witch Gardevoir expressions, ten Giratina-style Dreadful Mega expressions, and ten blue/silver shiny Dreadful expressions. The revised Mega art follows the existing Mega Gardevoir headshot's rounded hair, face proportions and three-quarter view. The earlier frontal Mega draft is not used.

The portraits appear in the move-bar HUD, team headshots and Pokémon-selection portrait elements when LoverGare's Witch Gardevoir appearance is selected. Other accounts, species and the Original appearance keep their existing portraits. Existing ten-second mood holds, low-health expressions, level-up happiness, anger, tears and revive moods remain unchanged.

Assets:
- `assets/ui/witch-portraits/emotions-v82.png`: only the first two rows are used for Witch Gardevoir.
- `assets/ui/witch-portraits/mega-emotions-v82.png`: revised normal/shiny Mega portraits, four rows.
- `js/witch-portraits.js`: skin/form/mood atlas selection.
- `js/gardevoir-expressions.js`: existing emotion renderer now accepts the skin atlas and its crop rectangles.

Wing-placement work was cancelled at the user's request. All v81 costume animation PNGs are unchanged and no wing-placement adapter is installed.

Install the update over v81: merge its contents beside `index.html`, replace matching files, and hard refresh. The full-game package also contains the supplied v81 changes over the existing complete game. Preview pages and local test controls are not shipped.
