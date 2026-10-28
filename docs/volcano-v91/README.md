# Act 4: Cinderwake Caldera (v91)

Built on the supplied `pokesurvivor-plus-Gard-main (5).zip`, gard-v90-portrait-crop.

Act 4's existing progression slot (map ID 5, `psLevel: 4`, formerly Crystal Abyss) becomes Cinderwake Caldera. Area Zero remains the separate endless mode. Unlocks, rewards and Act 4's native combat multipliers are retained.

The landscape is planned before decorations: a primary volcanic landform, wider branching crater-fed channels, multiple irregular molten basin shapes and cooled peninsulas, narrow cooled crossings, basalt banks, sulfur vents, quiet ash woodland and open ash clearings. The seeded generator extends beyond the initial region without a hard outer border. Large volcanoes reserve their own footprint; smaller models follow woodland, bank and open-ground habitats rather than being spread uniformly everywhere.

The three new transparent sprite atlases contain 22 original environment models. Each uses a measured opaque source rectangle, a ground anchor and a separate solid footprint. New tree silhouettes sway and respond to contact; canopies fade when they hide the player. Rocks, pillars, ridges and ruined arch supports use shared collision/projectile geometry. Swept movement stops at the last clear position instead of pushing the actor across a large object. The main volcano has a stepped multi-part footprint.

Lava shows moving hot ribbons, surface bubbles that inflate and burst, droplets and fading ripples. Lava damages vulnerable player Pokémon through the existing hurt pipeline once per second (2.5% max HP, minimum 1). Fire types, Groudon and hovering/flight mechanics retain their environmental affinity. Large erupting vents are distinct from small steaming vents: first approach starts a short local cycle (warning after about two seconds, first burst after about five), their mouths brighten, and a three-second warning precedes three volleys of arcing magma, and landing areas are shown before impact. Impacts deal 4.5% max HP, minimum 1, once per rock. They use the normal damage/invulnerability pipeline. Camera tremors use the ordinary shake setting.

Ground cover includes irregular, wind-animated red, ash-grey and blackened grass patches, soil tinting and player brushing reactions, with clear routes and dry placement. Activity includes drifting ash and embers, changing ash intensity, tree reactions, footprints that fade, warm camps, occasional Fire-type basking, and local wildlife reacting to eruption noise through the friend's perception/behavior system. Emergency escape and occasional basking are contextual behaviors, not a replacement AI controller. Quiet camps reuse the existing six-second, once-per-camp rest mechanic and its nearby-hostile/recent-hit restrictions.

World, props and terrain caches are bounded, as are magma rocks, scorch marks, footprints and vent state. Static terrain is cached; only flow, bubbles, steam and local particles animate. Starting areas and connecting routes are reserved and tested across seeds.

Install the update by merging its contents beside your current `index.html`, replacing matching files, then hard refreshing. The patch includes new art and modules plus small changes to levels, Groudon's water-to-land adapter, camp rest and script cache versions. It does not replace native app.min.js, accounts, saves, AI source, portraits, music or Acts 1–3.

Validation is recorded in PLAYTEST.json / VALIDATION.json. The automated tests and native playtest cover solo behavior. Live multi-device co-op has not been validated in this update.
