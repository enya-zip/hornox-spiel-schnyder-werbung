# Hornox: reference backpack and 15-minute summit journey

## Reference equipment
- Based on the user's 2026-10-29 backpack photo: dark olive fabric, mont-bell wordmark, original Aufdenblatten Collection picturemark and wordmark, white enamel Zermatt mug on a steel carabiner.
- Official Collection artwork reused from the existing source at aufdenblatten.swiss; raster logo print placed as a transparent torso-bound surface for clear lettering. Mug motif follows the mountain/fir/Zermatt design visible in the photograph.
- Smooth procedural mug, handle and carabiner geometry; cup follows the torso with small run/slide/jump-dependent swing. Backpack weights stabilized to the torso to prevent arm-induced distortion. No character model regeneration or new package dependencies.
- Visual inspection: home, start, running, jumping and sliding, plus a close diagnostic camera (removed from final code). Print legible in close view; mug remains attached through the poses.

## Route
Active game time only:
- 0:00–1:30 Alpen Resort courtyard / covered exit
- 1:30–4:00 Bahnhofstrasse
- 4:00–7:00 alpine meadows
- 7:00–10:00 mountain trails
- 10:00–13:00 glacier
- 13:00–15:00 Matterhorn approach

At exactly 900 seconds a surviving player wins, receives 2,000 bonus points and sees the localized summit result. Further step actions are rejected. Replaces the previous endless / 30-second rotation. Game pause and app-background time do not advance the journey. HUD shows active time / 15:00 and stage / 6. Transitions add 250 points and restore one missing life, capped at maximum. Existing periodic shields retained.

Mountain hazards add low rocks, gaps, ropes, hikers and incoming rolling stones. Other biomes retain their matching hazards. Final seven seconds have no new hazards and final eight seconds suppress turns, allowing an unobstructed summit cross / Swiss flag arrival. Uphill ground and road use continuous terrain geometry, with scenery/obstacles placed at the same elevation. Branding and sound recovery retained.

## Validation
- 19 deterministic game rule checks: six exports, validation, immutability, collision actions, all six biome profiles, exact transition times, bounded state, open-lane patterns and 900-second win.
- Full simulated 15-minute relaxed journey won: 17,190 distance units, 1,693 coins, 25 correct turns. No hotel-arrival loop remains.
- 9 audio lifecycle regression checks still pass.
- Chromium WebGL2: all six stage renderers, branded pack + three mug parts, five localized victory screens, exact 15:00 / 100% finish, no page errors or failed assets. Mobile 390×844 and desktop 1440×900 captures; all environments visually inspected.
- Final hotel canopy camera clearance and all gear animation poses inspected after adjustment.
- Local syntax, pure-rule and whitespace checks passed. Bun and project node_modules unavailable; normal platform CI is authoritative. No dependency/lockfile changes.
- Headless Chromium/software WebGL only. No physical iPhone/Safari or native-device frame-rate claim. The route is a stylized game, not a geographic hiking simulation.
