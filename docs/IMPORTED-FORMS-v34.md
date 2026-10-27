# Imported forms and animation validation — v34

Apply Imported-Forms-v34.zip over v33, preserving folder paths and replacing matching files. The full ZIP is a complete game copy. Offline diagnostics and test grants are excluded. No save migration or progress reset is required.

Charizard and Alcremie now use credited normal/shiny Gigantamax art during the existing Dynamax mechanic (clear a Dynamax Den, press G). Existing duration, cooldown and bonuses remain unchanged. These particular source sheets contain only eight-direction idle poses: no Walk/Run/Attack clips are supplied. Movement uses those poses and normal move effects. No missing animation was invented. Mega and Dynamax cannot stack; switching ends Dynamax and restores the member's base HP and sprite scale.

Native alternate forms are retained through bench switches, including Zygarde Complete and Deoxys forms. Added normal/shiny form headshots for Hoopa Unbound, Black/White Kyurem, Crowned Zacian/Zamazenta, Zygarde 10%/Complete and the two Gigantamax forms. Hoopa Unbound now shows its own portrait in the active HUD and uses the existing team portrait renderer. Collection details explain the existing form item routes for Crowned forms, Kyurem fusions and Hoopa Unbound. Existing Act 3 unlock, item obtainment and friend transformation rules remain in place.

Offline browser validation: 18 normal/shiny transformation-and-bench-return cases passed (Deoxys Attack/Defense/Speed, Crowned Zamazenta, Black/White Kyurem, Hoopa Unbound, Zygarde Complete, ordinary Keldeo). Checked all seven animation clips in all eight directions across 26 sprite variants: no blank frames or invalid draw rectangles. Four G-Max switch/cleanup cases restored base HP, size and sprites without leaving Dynamax on the incoming member. Inspected Hoopa and Deoxys moving/attacking in the muted visible showcase. 151 automated regressions passed. Online co-op was not tested. Diagnostic grants and native-form test overrides exist only in the unshipped fixture.

Keldeo Resolute remains unavailable; ordinary Keldeo has a full animation set. Mega Mewtwo X and Mega Metagross were not added: no compatible complete directional sprite set was verified. 3D models and battle-only sprites were not represented as working overworld animation sheets.

Research: public Reddit port announcements led to JayElDragon/poke-survivor and ovolee37/pokesurvivor-ayn-thor repository tree audits. The missing full Mega sets were not found in these sources. New G-Max sheets and form portraits come directly from PMDCollab/SpriteCollab with artist credits under SOURCE_LICENSES. Sprite sheets were copied unchanged; metadata was derived from their original animation XML.

Sources:
- https://github.com/PMDCollab/SpriteCollab
- https://github.com/JayElDragon/poke-survivor
- https://github.com/ovolee37/pokesurvivor-ayn-thor
- https://www.reddit.com/r/AndroidNativePorts/comments/1xbeeow/poke_survivors_50_is_out_android_port_of/
- https://www.reddit.com/r/AynThor/comments/1x3kt29/made_a_thor_version_of_pok%C3%A9survivor_with_proper/
