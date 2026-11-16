# Hornox Run — Bahnhofstrasse, illuminated brands and hearts

## References and scope

The five user-supplied Bahnhofstrasse photos guide the architecture: close dark timber frontages, mixed heights and render, deep slatted balconies, flowers, blue/red shutters, large warm shop windows, split awnings, projecting business signs and an asphalt centre with narrow paved margins. The watermarked photo was used only for visual reference; no supplied photograph is embedded as a game backdrop or texture.

Official collection/business pages checked on 2026-10-29:
- https://aufdenblatten.swiss/unsere-betriebe
- https://www.hornox.ch/
- https://www.peak-fine.ch/

Seven confirmed Zermatt businesses appear: Alpen Resort, Hornox, The Dude, Peakfine, The Phoenix, La Perle and Residence Patricia. Original negative logo artwork was downloaded from the collection's own asset URLs and self-hosted. Businesses in Täsch are excluded. Signs are promotional placements in a game-scale street, not assertions that every business physically fronts Bahnhofstrasse.

## Changes

- Seven facade variants with different heights, dark timber and rendered walls, deep open-slat balconies, blue or red shutters, flower boxes, rafters, gutters, recessed retail doors, display windows and awnings. Staggered left/right lots create closer, varied frontages.
- Seven official brand marks on illuminated front signs and double-sided projecting lightboxes. Atlas sampling contains each original aspect ratio; letterforms are not stretched to fit the sign.
- Continuous sidewalk geometry joins the road corners without overlapping slab ends. Centre asphalt and grey paving margins follow the references.
- Fixed scenery visibility decisions to absolute object positions, cached per route; removed moving near/far detail switches. Fixed procedural facade detail to absolute world coordinates and filtered fine texture frequencies. Removed overlapping hotel roof faces and separated sign surfaces. Anchored the shadow texel grid to world space.
- Increased bounded instance capacity after the denser street exposed dropped geometry during QA. Small flower geometry reduces street triangle count from roughly 730k to 361k in the tested scene without removing the flower boxes.
- Three lives in both modes, displayed as three heart icons. A hit empties a heart. Occasional red 3D heart pickups restore one life, capped at three; pickups at full health award 50 points. Feedback includes a heart-to-HUD animation, particles and sound. First spawn is around 40 seconds, then roughly 52–73 seconds apart, in an open lane away from corners.
- Five localized heart instructions and feedback strings. Existing six-stage 900-second journey, equipment, controls and audio recovery remain.
- Rules/environment/cache version 11. Scores use a new namespace because life balance changed. Zero-life runs cannot be revived by a pickup or biome transition in the same tick.

## Validation before publication

- 25 rule checks passed, including deterministic state, safe hazard rows, six biomes, all language keys, three-life start in both modes, one-time pickup, life cap, full-life points, wrong-lane/magnet behavior, safe spawn placement, zero-life finish and a complete 900-second journey.
- 9 audio lifecycle checks passed, including app switching, Safari-style interrupted contexts, delayed promises, mute/pause and gesture recovery.
- Actual Chromium/WebGL2 tests at 430×900 and 1440×900: all six environments, six consecutive corner positions, unchanged common-range building eligibility, zero dropped instances, no context loss, no page errors and no failed asset requests. All seven brand assets loaded. Heart pickup updates HUD from 2 to 3, full-life pickup gives the correct feedback, and the summit result wins at exactly 900 seconds.
- Rendered street, pickup and desktop screenshots visually inspected. Screenshot scenes deliberately remove hazards for scenery inspection; normal play continues to spawn the biome-specific challenges.
- Maximum tested scenery: 15,090 instances, 360,612 environment triangles. Small scene counts: meadow 373, mountain 82, glacier 71, summit 208. This is browser viewport testing, not physical iPhone testing or a hardware frame-rate certification.
- JavaScript syntax and whitespace checks passed. Bun/project dependencies are unavailable locally; platform compilation is verified through the normal deployment service.
