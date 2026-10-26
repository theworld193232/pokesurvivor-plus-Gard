# Mega integration — v21

Mega mechanics and obtainment now use the friend system. Beat Act 2, then play Act 3 or later. Hold the matching species/form Mega Stone in the normal held-item slot. Chest chance is 5%, big chest 10%, each level gained 1%; there is also the original once-per-run hidden map stone opportunity. The original item-free exceptions remain. No additional player-level-10/50 requirement is imposed by Gard. Normal evolution and wild level gates are unchanged.

Native Mega activation, stat calculation, duration and cooldown remain native (30 seconds at ordinary levels, 180-second cooldown). Gard's old permanent-transformation panel and 50% testing reward card no longer grant access.

On a successful native activation, Gard's rainbow/orb/shatter transformation, Mega symbol, cry and effects play. The transformed sprite appears when the orb breaks. Gard Mega music has priority over legendary, low-HP, event and battle music. Native one-shot burst presentation is suppressed during this sequence. Reversion clears Gard's presentation alias as well as native Mega state. Primal forms retain Gard's separate reversion scenes and ORAS music.

Only Mega obtainment changed. Z-Moves and Dynamax retain Gard progression; Totem trials remain disabled. Client testing controls remain owner-only. The co-op visual adapter preserves a base animator when native networking has already applied a timed Mega.

Validation: 97 regression checks passed. Offline browser tests verified stage/stone exclusions, a matching stone collected through native pickups, Space activation, exactly one Gard Mega scene, successful orb-shatter reveal, Mega music blocking another valid event theme, and native reversion with 180-second cooldown. Network co-op and every individual form were not exhaustively tested. Audio was muted during QA; track selection and priority were inspected.

Extract Mega-System-v21-Update.zip into your game root and replace matching files. The update includes the earlier cave restart and beach walking fixes. Upload the files, then hard-refresh; do not clear save data.
