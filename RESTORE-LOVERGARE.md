# Restore LoverGare account connection

The merged build now uses your original Gard Firebase project (pokesurvivor-e5802), matching the old game. The two engines use the same username-to-login conversion and saves/{authenticated uid} document layout. This reconnects to the existing account rather than copying account data into your friend's project.

For an already uploaded merged game, replace ONLY config.js at the same level as index.html using the file in this patch ZIP. Reload the normal index.html page (not .port-preview.html or .coop-preview.html: those intentionally disable accounts for testing). Sign in using the SAME method as before: LoverGare and your existing password, or the same Google account if that is what you used. Do not create a new account. On a new origin you may need to sign in again.

Use the same hosting address as your old game where possible. A Google sign-in unauthorized-domain message requires adding the new host to your OWN Firebase Auth authorized domains. No Firebase rules or permissions were changed. Do not deploy the friend's included rules over your existing backend for this fix.

Existing cloud progress should load after successful sign-in. Actual cloud save recovery is not verified until you sign in; this patch does not invent or reset progress. If the old progress was only saved locally in a different browser/site address, that browser save needs a separate transfer. Keep the old browser storage and old game intact.
