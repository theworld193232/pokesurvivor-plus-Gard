# Cave restart and harbor walking fix — v20

Fixed the cave renderer reading player.x after quitting a run clears the player. This could interrupt the render frame and leave later rendering in a broken state. Player-dependent custom draw hooks now defer to native menu rendering until a player exists; ground and lighting functions also guard missing players.

The harbor painting collision mask treated staircase treads as solid cliff pixels. Added narrow image-aligned walking paths down the beach stairs, through town stairs, and along the pier neck/deck. Other walls, buildings, rails and open water retain their existing mask.

Verified three complete cave quit/menu/restart cycles: player movement 52–63 world pixels each, visible sprite pixels each, no new runtime errors. Normal movement reached both beach-stair and pier endpoints. 93 automated checks passed.

Extract Cave-Beach-Fix-v20.zip into the game root (the folder containing index.html), replacing matching files. Keep js/ai/34-ocean.js inside js/ai/. Reload the page completely after uploading; this also resets any canvas state already damaged by the previous error. No save data needs clearing.
