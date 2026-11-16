# v20 — Winter street encounters

- Added approaching pairs of ski carriers (shoulder skis, bindings, poles, helmet and goggles) and snowboard carriers (board under arm with bindings).
- New encounters spawn only in the winter resort street biome. Existing street hazards still occur; no sports traffic added to glaciers.
- Existing scooter pairs gain helmets, goggles, a one-leg push pose and rotating wheel details.
- Reuses existing visitor GLB, instancing and GPU pose system. No additional downloads or dependencies.
- Extended existing tests for spawn coverage, biome restriction, collision/dodge and Rush interaction. All 44 game checks and pure-rule contract passed.
- Headless Chromium WebGL checks at 390×844 and 1280×800: all three encounter pairs rendered with expected poses, six visitor instances in the test scene, zero dropped instances, no JS/asset errors. Inspected screenshots in this directory.
- These are emulated viewport checks, not physical device performance measurements. Desktop screenshot deliberately stages all three groups together for visual inspection; normal spawning preserves a free lane.
- Existing cover, main menu, route schedule, localisation and audio unchanged.
