# Occasional wildlife correction — October 24, 2026

The previous V2 release changed too much of the population and kept six social pairs running. The user's correction takes priority: preserve PokéSurvivor combat, with occasional social moments.

## Changed behavior

- Each eligible individual gets one 10% selection roll for the new wildlife routines, with a maximum of six selected living actors. Repeated target queries never reroll ordinary attackers into peaceful wildlife.
- The unselected majority keeps normal pursuit/contact attacks or ranged combat. It does not inherit the legacy skittish/passive/crybaby/retreat routines while the new solo wildlife option is enabled. Nearby Legendaries only affect the selected wildlife minority.
- At most one social pair runs at once. Natural opportunities are checked every 12–22 seconds after an initial eight-second delay. Individual social cooldowns last 24 seconds (30 for sparring). Combat takes priority in selecting partners.
- Greetings last 3.5 seconds, play six seconds, rest seven seconds; rival sparring remains at most 12 seconds and non-lethal. Play stays within roughly 100 world units of its starting midpoint. The runner waits for a distant chaser rather than continually moving away. Partners face one another when stationary.
- Wordless bubbles show interactions, reactions or a brief occasional idle expression. Quiet wandering has no permanent bubble. At most four bubble drawables are added.
- Interaction time pauses with gameplay. No population, spawn pacing, XP, waves, boss or evolution system is imported from the friend's engine.
- The existing all-side den activation, grounding, solid footprint, co-op fixes and incidental damage behavior are retained.

## Friend comparison

The supplied pokesurvivor-plus-main.zip was extracted into an isolated temporary preview. Its original main engine and all 32 AI modules ran offline with muted audio and a test-invulnerable player. Original social logic gates participation on combat/behavior tier, cooldown, nearby perception and sociability. Greetings approach then stop and face; play swaps chaser roles; rest settles together; sparring postures before combat. The live comparison observed greetings, rest, race, play, sparring and gossip over more than three minutes. The reference preview recorded a missing service-worker warning (its ZIP has no root sw.js); no reference account or production save was used.

Gard adapts a smaller, deliberately rarer subset to preserve the survivor game. This is not a claim that Gard now contains the friend's complete combat, relationship, group or environment simulation.

## Install

Back up the game, then extract Gard-Occasional-Wildlife-2026-10-24.zip into the folder containing index.html. Merge css/ and js/ and replace included files. sw.js belongs beside index.html. docs/ contains optional notes. Reload after deployment.

The cumulative package includes earlier co-op and den fixes. Gard-Occasional-Wildlife-Rollback-2026-10-24.zip restores the exact previous V2 package files. Firebase config/rules, main engine, assets, accounts and test fixtures are excluded.

## Checks

43 regression checks pass. New cases cover a 201-actor population retaining at least 195 native attackers, a stable one-time selection roll, releasing a dead wildlife slot, one social pair, local play boundaries, pause-safe interaction timing and no permanent wandering bubbles. Existing targeting/damage, reaction, co-op, den and cinematic checks remain green. The hidden, muted revised native run reached level three. At 88 seconds it had 64 actors, including 56 normal pursuit attackers and six selected wildlife; 39 ordinary actors were within 150 units of the player after movement. At 112 seconds it had 90 actors, including 82 normal pursuit attackers and six selected wildlife, with 76 ordinary actors within 150 units. A natural greeting occurred, with no overlapping social pairs. No revised-game warning/error logs were recorded. These samples verify that broad pursuit pressure is present; they are not full-run balance measurements.

Offline invulnerable fixtures check functionality, not full-run balance or live multiplayer latency.
