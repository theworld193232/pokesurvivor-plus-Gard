# Islands, Regis, form artifacts and Gardevoir expressions — v36

Apply the update ZIP over v35, preserving paths and replacing matching files. The full ZIP contains the complete game. Offline fixture controls and tests are excluded. Existing save keys and progress remain in place; Regi progress uses the upstream `psxRegi` account field.

## Act 3 events

The Tropical Ocean includes:

- Tapu Koko, Tapu Lele and Tapu Bulu island challenges. Winning befriends them.
- Tapu Fini's Summit of Two Orbs challenge, awarding the Red and Blue Orb key items. Fini remains the guardian.
- Birth Island: a rare seeded island with the moving triangle puzzle and a Deoxys battle. Winning now also drops a Meteor Shard.
- Rare daytime Manaphy/Phione sightings. Manaphy can leave the Strong Silver Feather. Carrying it to the low-tide shrine triggers Lugia's appearance/dialogue; that event does not award Lugia.
- The Sealed Chamber: Relicanth in the first team slot, Wailord last, then R-E-G-I on the Braille stones. Solving it permanently opens the Regi encounters.
- Whale shadows/spouts, leaping Magikarp, fish schools, readable ancient tablets, island discoveries, tides and storm/fog zones.
- The Gard den/pink-rift scheduler continues to apply its shared rare roll during ordinary solo play. Kyogre's trench glow is an atmospheric event, not a new scripted capture encounter.

## Island and collision changes

Gull Rock radius 170→260, Slowpoke Cay 250→380, Seel Rocks 320→440, Tide-Pool Flats 210→300, and the new Sealed Chamber 280→350. Seeded coastlines, habitats, terrain depth, tides and island-specific art use those actual shapes.

Generated ocean rocks now derive their grounded collision radius from their drawn sprite base and scale. Ruined walls/shrines use wider rectangular footprints. Solid decor is spaced with a walkable gap; land objects are rejected when their footprint crosses into water or solid terrain. Water props retain their intended water placement. The collision query includes large nearby footprints, and local ground movement is swept in 8px steps to prevent tunneling through scenery. Existing flying behavior for Kyogre/Rayquaza is preserved.

## Regi integration

Imported from the friend's development branch at fa6969548cf0d36233a15bb6a352185b0ed2ff19, two commits newer than main 51d69. Main did not yet contain this update. The Sealed Chamber reads the actual run team in its original slot order; switching the active member does not change the first/last requirement. Team cards now have earlier/later ordering controls.

After the chamber is solved, Registeel's cave can appear in Act 1 and Regirock's in the Act 2 cave after 45 seconds. They wake and battle when approached, join on victory, and can be challenged once per run. The Regirock entrance is explicitly drawn and solid in the custom Act 2 renderer. These caves do not appear on the mountain or inside sacred rooms. A cutscene ends safely on player death; an enemy removal without HP depletion does not award victory.

The existing separate snowy Regigigas temple and three-Regi ownership gate remain. The upstream duplicate Regigigas entrance on the main cave is disabled. **Regice's dedicated encounter is still unfinished upstream.** Its existing collection/gacha availability is unchanged.

## Held form artifacts

- **Meteor Shard / Deoxys:** after Act 3 is beaten, hold the shard and press Space to cycle Normal → Attack → Defense → Speed → Normal. Dropped after the Birth Island victory; Deoxys can also find it through the existing form-item level/chest/world-drop rules. A short input cooldown prevents repeated key events from racing through forms. Boat controls retain priority. Moves and HP ratio are preserved.
- **DNA Splicers / Kyurem:** hold the matching Zekrom or Reshiram splicers and press Space for Black or White Kyurem, using existing native transformation rules.
- **Rusted Sword / Zacian, Rusted Shield / Zamazenta, Prison Bottle / Hoopa:** existing native held-item transformation rules. All remain gated by the account's Act 3 clear, then work on earlier maps too.

Each team member now retains its own held item. Outgoing item stat effects are removed before switching, and the incoming member's item is reapplied; items and their bonuses no longer follow the wrong Pokémon. Normal/base and alternate Deoxys forms both survive bench switches. Collection detail pages explain required items and show Act 3 readiness.

## The forgotten forest grove

A seeded, dry forest clearing is generated away from the start and mansion route. A new mossy pixel-art broken arch, circular dais and steps are inspired by the supplied reference. Its supports, altar and side/front pillars have grounded collision, while the steps remain passable. Tree/rock clutter is cleared from the platform and future terrain generation reserves its footprint.

Zacian and Zamazenta wait there. From player level 20, approaching the steps initiates their challenges one at a time. Winning befriends each and drops its Rusted Sword/Shield through the normal held-item selection flow. A retreat or defeat permits another attempt after a cooldown. The encounter and art do not replace the friend's forest map, weather or AI.

## Gardevoir gestures and portraits

Normal and shiny base Gardevoir occasionally perform Appeal or Pose after a quiet idle period. Mega and shiny Mega Gardevoir use their available Appeal animation. Source sheets are genuine animated clips: Appeal has eight frames in eight directions; the base Pose has three frames facing forward. The first gesture follows roughly 6–14 seconds of safe idling, later gestures roughly 12–28 seconds. Moving, attacking, danger, low HP and cutscenes interrupt or suppress gestures; they do not lock controls or alter moves/stats.

The manual pose uses **M**, with no extra on-screen button. It also runs automatically during safe idle periods. Gardevoir’s Mega form now lasts until the run ends, she faints, or it is manually ended; team switches preserve it. Other ordinary Mega durations retain their existing rules.

The active HUD and active team portrait use the appropriate normal/shiny and base/Mega palette:

- 25% HP or lower: Pain.
- 55% HP or lower: Worried.
- Nearby boss, seven or more hostile Pokémon nearby, or darkness with at least three nearby hostiles: Worried.
- Quiet moments: occasional brief Happy expression.
- Few enemies remaining: return to Normal, even at night (apart from a brief happy moment).

Threat scans are cached for 0.3 seconds. Friendly/harmless wildlife does not count as a threat. Source portrait PNGs and supplied sheets are preserved; expressions are selected by sprite rectangles at runtime.

## LoverGare’s Attract and species-specific item pages

Only LoverGare’s deployed Gardevoir (normal, shiny or Mega) has Attract. Every 20–30 seconds, eligible nearby wild Pokémon within 280px have a 10% chance each to show heart bubbles and enter the friend AI’s native follow-player behavior. At most two follow at once, for up to 12 seconds. Damage breaks the charm. Bosses, legends, temple guardians and scripted encounters are excluded. The effect is released on changing species or fainting, and temporary relationship changes are reversed. This does not change anyone else’s Gardevoir or Ralts.

The Codex item page now follows the selected/deployed Pokémon: shared items plus only its own species-specific form artifacts. Groudon shows its Red Orb, not Gardevoirite, the Meteor Shard or another Pokémon’s stones. Existing transformation eligibility already checks the matching species and item; initial obtainment rates remain unchanged.

## Validation

172 automated regressions passed. Offline browser checks passed the real stepped-on Braille puzzle, team switching/order, 91 generated island prop collision probes, Registeel/Regirock victories and grants, Regirock custom-map placement, both forest guardian victories/relic drops, and all four Meteor Shard forms through team switches. Normal/shiny and base/Mega Gardevoir showed all Appeal frames, all base Pose frames, and correct Normal/Worried/Pain/Happy portraits with no invalid draw rectangles. Online co-op was not tested.

## Other-game research

The public PokéHorde menu and existing Doofcraft/portrait audit were used as references for clear species/form headshots and item explanations. Reddit port research highlighted inspectable item descriptions and collection detail pages; this pass adds explicit transformation requirements and milestone readiness beside the relevant Pokémon. Broader balancing, weather and AI remain those already integrated in this project. No new Doofcraft-only mechanics are claimed as imported in this release.

Sources:
- https://github.com/DexterDamg/pokesurvivor-plus/tree/fa6969548cf0d36233a15bb6a352185b0ed2ff19
- https://github.com/PMDCollab/SpriteCollab
- https://pokehorde.com/
- https://www.reddit.com/r/AndroidNativePorts/comments/1xbeeow/poke_survivors_50_is_out_android_port_of/

Art source and exact generation prompt: FOREST-SANCTUARY-ART-v36.md. Sprite/portrait artist credits: SOURCE_LICENSES/gardevoir-expressions-v36/CREDITS.json.
