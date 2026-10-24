# Living wildlife V2 — October 24, 2026

This cumulative patch includes the previously packaged co-op menu/five-card fixes, Echo/Mega synchronization fixes, service worker and solo species port.

## Wildlife

Gard retains its existing enemy movement controller. The friend species weights/traits and original pixel emote painters are adapted into isolated modules. Bubbles contain icons only, with no written “aww”, “Awe”, “Scared” or other emotion labels. At most ten nearby bubbles render at a time.

Automatic aiming and projectile steering skip peaceful Pokémon. Collision and area damage still see the complete population, so a stray attack can hurt them. Gentle individuals may cry and flee; brave individuals retaliate, and repeated hits can make non-timid individuals fight. Damage from NPC sparring is not blamed on the player. Sleepy individuals wake when approached; Psyduck can have headaches and singers/dancers have idle routines.

Nearby Legendaries inspire fear/fleeing or awe according to temperament/bravery. Pokémon can greet, play chase, rest together, comfort and spar with rivals. Social scanning is bounded to 48 nearby actors every half-second, with six simultaneous pairs. Sparring is non-lethal and stops at half maximum HP. This is a bounded subset of the friend's social system, not its full 32-module simulation or four-move/lethal NPC combat.

The wildlife gear-menu switch remains available. New routines skip co-op and special actors such as bosses, raids, named waves, catching holds, support enemies and allies. Original remains free of Trainers/catching; those stay Story-only. Existing evolution, weather, rewards, accounts and Primal/Mega mechanics remain Gard-owned.

## Dens

Den artwork now participates in native world depth sorting and uses an adjusted ground anchor. Player and wild Pokémon collision covers the entire stone footprint, with swept player movement to stop dashes crossing it. The added ground energy border is removed; the original vertical raid beacon remains. Approaching any edge activates the den, including the left, right and back. Consumed or expired dens stop blocking.

## Install and rollback

Back up the game. Extract Gard-Living-Wildlife-V2-2026-10-24.zip into the folder containing index.html, merging css/ and js/ and replacing included files. sw.js goes beside index.html. Deploy and reload the game. The archive excludes Firebase config/rules, the main engine, assets, accounts and test fixtures.

Gard-Living-Wildlife-V2-Rollback-2026-10-24.zip restores the exact files from Gard-Solo-Wildlife-2026-10-24.zip, preserving its prior co-op fixes. After rollback, the new wildlife-emotes.js, wildlife-interactions.js and wildlife-social.js are unreferenced and may be removed. Rollback also restores the earlier front-entry den behavior.

## Validation and limits

All 40 regression checks passed, including targeting versus damage, crying/fleeing/repeated-hit retaliation, NPC play and non-lethal sparring, Legendary reactions, wordless bounded bubbles, native depth hooks, swept collision and 16 den approach directions. JavaScript syntax and patch whitespace checks passed.

Hidden, muted offline native-engine tests confirmed a closer peaceful Eevee was skipped for an aggressive Rattata, incidental attacks damaged Eevee and caused crying/retaliation, Pikachu/Eevee played chase, and Zangoose/Seviper sparred and survived with 575/650 HP from 1000 HP. A run progressed beyond six minutes and reached level four; sampled positions stayed finite. Approaching a den from the left started a native Dynamax Wyrdeer raid. No browser warning/error logs were recorded.

Fixtures use offline test data and player invulnerability. These checks do not establish full-run balance, every species/biome, live Firebase co-op or latency behavior. Prior offline native co-op checks covered the five starting cards and menu layouts; this extension is solo-only. Shipping app.min.js is unchanged.

## Audit and next candidates

FRIEND_CURRENT_AUDIT.md records the exact file/pixel comparison. Both Primals and 39 matching Mega asset folders already exist: their 546 matching sheets decode to identical pixels. The other 42 form folders remain unintegrated asset candidates, not newly playable forms. Doofcraft was inspected separately; no Doofcraft bundle was merged. Upgrades-specific search/input improvements and selected friend forms/environment remain future candidates.
