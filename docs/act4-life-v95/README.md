Act 4 life and visibility update, based on the full supplied gard-v94 archive.

Red, ash-grey and black grass form larger, denser wind-responsive patches. Volcanic groves contain more existing pixel-art trees and charred logs with animated embers. Theme-specific terrain and wide travel routes remain. Vegetation avoids lava, obstacles and bridge decks.

Overworld bridge rail collision follows the exact rendered bridge curves, leaves both ends open, participates in environment queries and blocks projectiles. Groudon den bridges have matching side barriers. Existing flying-legend movement exceptions remain.

Crystals, campfires, burning logs, magma seams, small pumice and slab rocks now emit local light. Fires and crystals receive a reserved light budget separate from nearby obstacle lights. Small rocks receive a subtle nighttime edge glow. Actual lava is sampled more densely, including channels; static samples are cached with bounded memory and invalidated on world reset/reservation changes. Day/night remains intact.

Validation: 26 automated terrain, physics, ecology, bounded-cache and lighting checks pass. Native midnight solo preview checked at hour 0, ambient [34,38,64]. Native bridge test passed all five checks (side collision, stopped before edge, clear deck, solid rail and projectile blocking). Co-op was not exercised.
