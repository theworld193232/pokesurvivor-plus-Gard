# Rare dens and safe pink rifts

One shared check every random 120–180 seconds of run time. Each eligible check has a 10% TOTAL chance of creating one encounter, then chooses a den or safe pink rift equally. Legendary dens are a rare subtype of the den choice. No extra rolls from either old scheduler remain. An existing den, pink rift, active raid/Legendary Den challenge, or occupied safe zone blocks additional encounters. Test spawn buttons also respect mutual exclusion. Normal enemy/legendary battle rifts are separate systems.

For the small patch, copy index.html to the game root and the three files inside js/ to the game's js/ folder, replacing matching files. No assets or config changes are needed for this patch. A failed roll produces nothing: a spawn is NOT guaranteed every 2–3 minutes.

Pink safe rifts also require clear, dry ground across their entrance footprint. If no safe placement is available, the spawn is skipped instead of appearing beneath the player.

23 regression tests passed. No additional long playtest was run for this timing change.
