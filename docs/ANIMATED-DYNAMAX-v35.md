# Animated Dynamax — v35

Supersedes v34's two incomplete Gigantamax additions. G-Max Charizard and Alcremie have been removed from the game because their source sheets only provide directional idle poses. Regular Dynamax remains available through the existing Den/Band rules and G key, using each Pokémon's complete normal/shiny animation set. Duration, cooldown, HP and combat rules are unchanged. Hoopa Unbound headshots, Kyurem headshots and all other v34 form fixes remain.

Apply Remove-GMax-v35.zip over v34, preserving folder paths and replacing matching files. The patch disconnects all G-Max scripts and removes their HUD hooks, so any old unreferenced files left by an overlay are harmless. The full game ZIP excludes the removed assets entirely. No save reset or migration is needed; G-Max was a transient run visual, not a stored unlock. Historical v34 audit documents describe the previous release only.

Validation: 19 targeted automated regressions passed, covering removal, portrait routing, native forms, team switches and Mega rules. Offline browser checks verified Dynamax normal/shiny Charizard and Alcremie switch cleanup restores HP and scale. Walking frame advancement was tested in the live engine. Online co-op was not tested in this pass.
