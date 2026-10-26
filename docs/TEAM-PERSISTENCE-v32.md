# Team forms and selection — v32

Apply the update ZIP over an existing v31 game folder, replacing matching files and keeping their paths. The full ZIP is a complete game copy. Test controls and local offline previews are excluded. Existing account/save storage keys are unchanged.

- Mega and Primal forms are now stored per team member when switched to the bench. Switching back restores the same form, signature moves and HP proportion, without replaying the transformation cutscene or requiring another stone drop. Normal Mega time pauses while benched; Primals retain their run-long form. Fainting/reversion/run-end still clears the active form as appropriate.
- Benched transformed members keep their transformation headshots. Each member keeps its own transformation cooldown.
- Team selection now has a Normal/Shiny selector beneath each Pokémon. Shiny requires ownership and a working shiny gameplay sprite. Portraits and run sprites use that choice; ordinary ownership no longer automatically selects shiny.
- Main-menu and Team variant choices agree. Lead selection runs through the same partner rules so evolved leads do not later split into contradictory team entries. Existing level-based evolution rules and the owner exception remain.
- Added six normal/shiny headshots for Deoxys Attack/Defense/Speed; the HUD follows the active form skin.

Sprite inspection: the supplied SpriteCollab folder has Mega Gardevoir animation sheets. Direct checks also verified Mega Mewtwo Y and Deoxys Attack/Defense/Speed animation sheets, which are already installed in the game. Mega Mewtwo X and Mega Metagross returned HTTP 404 for AnimData.xml, Idle-Anim.png and Attack-Anim.png at their standard form paths. Their portraits exist, but no incomplete gameplay form was enabled. Full evidence: FORM-SPRITE-AUDIT-v32.json. Per-image credits are under SOURCE_LICENSES/site-import-v31.

Validation: 137 automated checks, including a 1000-switch simulation; an offline browser run of 48 rapid native-engine switches between Mega Gardevoir, Mega Rayquaza, Primal Kyogre and Primal Groudon completed with no test failures. Verified normal/shiny Team selectors and both resulting portrait image sources. Multiplayer/co-op was not stress-tested.
