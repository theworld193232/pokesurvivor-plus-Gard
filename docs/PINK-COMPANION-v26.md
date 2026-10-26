# Pink companion light — v26

LoverGare's currently controlled Ralts (280) and Gardevoir (282, including Mega) get a small pixel-art pink orb. It floats beside the right shoulder with a soft bob, following the displayed body's height. Clearance uses the widest opaque Idle/Walk silhouette across all eight facings, with extra room for the orb core; the orb does not orbit through the avatar. It contributes a 145-world-pixel pink light to the normal lighting system and the Act 2 cave's separate darkness mask. The rest of the cave stays dark.

The orb is visual only: no entity, collision, targeting, damage, status or save changes. It hides when switching to another species, leaving gameplay or fainting. Other accounts and wild Pokémon do not receive it. Candidate positions check world collision and visible scenery bounds (crystals, rocks, trees, tents and entrances). It slides toward an open side or above the head at up to 100 world pixels per second. Routes sweep-test the body and scenery every four pixels; if no clear route exists it fades out before reforming safely. If scenery surrounds every candidate, the visible orb is occluded while its soft light remains. Kirlia is not included in this request.

Install Pink-Companion-Orb-v26.zip into the game root and replace matching files, then hard-refresh. Includes the current v25 sizing. Do not clear save data.

Validation: seven companion regressions cover identity/species/lifecycle, floating position and combat immutability, renderer chaining and light-mask integration. Cave preview visually checked with no browser errors. Existing regression suites also run.
