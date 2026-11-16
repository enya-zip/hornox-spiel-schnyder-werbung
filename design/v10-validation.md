# V10 — one 3D world, no photographic background wall

Requested change: reconstruct the Alpen Resort / Bahnhofstrasse environment in 3D using actual visual references, and remove the mismatched photo background and white fog seam.

## Reference review

Viewed, not used as scenery textures:
- Alpen Resort official About page: https://www.alpenresort.com/ueber-uns
- Official street/Hornox entrance image: https://cdn.prod.website-files.com/69b17de8c2858e42270f3954/69ca7577bab6c76d551c72e2_AlpenResort_DSC09316_%C2%A9marcoschnyder_web_XL.webp
- Official terrace / main hotel wing image: https://cdn.prod.website-files.com/69b2630b40e67afaa1221602/6a4ca0949cea945ab7580e08_alpenresort_dsc07302_marcoschnyder-L.webp
- Bahnhofstrasse toward St. Mauritius, Tiia Monto, 2019: https://commons.wikimedia.org/wiki/File:Bahnhofstrasse_in_Zermatt.jpg

Hotel cues: dark timber sign-bearing Hornox wing, light rendered wall infill, stone ground floor, broad light balcony panels with dark rails, gabled roof, terrace umbrellas and planters. Street cues: compact four/five-storey facades, red shutters, timber balconies, flowers, shop glazing and awnings, small grey paving, church tower and Swiss flags.

This is a reference-led, game-scale reconstruction. It is not a surveyed replica or an exact street map. Six stages and the 15-minute route remain the same.

## Implementation

- Removed all three panorama DOM layers, CSS photo backgrounds and the glacier preload. No village, meadow, glacier, facade or fir image downloads during play.
- All buildings, balconies, window frames, shutters, flower boxes, shop windows, roofs, lamps, umbrellas, flags, church and trees are authored 3D geometry. Official hotel wordmark is rendered on physical sign surfaces. Other signs are authored text, not facade photographs.
- Single camera/depth space for sky, smooth terrain, mountain ranges, Matterhorn, buildings and actors. Extended solid horizon, no 55–100 m alpha fade or nearby white haze. Small colour-only atmospheric attenuation starts beyond 650 m; geometry remains opaque.
- Heightfield and road share the same height function, including lane edges; slope changes ease over 25 seconds. Terrain covers the full surrounding ground, replacing finite raised ribbons with visible end/side cuts.
- Procedural asphalt, antialiased small paving, stone, timber, render and glass materials. Kept existing alpine trail/ice surface textures and hero/NPC models. Three-dimensional conifers replace tree billboards.
- Building footprints avoid the running path at corners. Nearby full geometry / distant simplified geometry keeps instance counts bounded. Per-mesh capacities avoid silently missing objects. 64×64 mountain meshes use smooth normals and rock/snow colouring.
- V10 cache keys invalidate browser modules/CSS. Game rules remain version 9 because this change does not alter difficulty, timing, scores, controls, equipment, translations or audio recovery.

## Validation

- 19 existing rule checks passed: all six biomes, deterministic simulation, safe lanes, incoming hazards, corners and exactly 900 active seconds to win.
- 9 audio lifecycle checks passed, including interrupted/suspended/closed contexts, foreground return and mute persistence.
- JavaScript syntax and git whitespace checks passed.
- Browser checks in Chromium with WebGL2: hotel, both sides of first corner, street, meadow, mountain, glacier and summit; 430×900 and 1440×900 viewports. No page errors, failed assets, lost context or dropped geometry instances. Hero backpack and mug still present. 900-second result still wins. Confirmed no photo-backdrop asset requests.
- Visual inspection of actual rendered screenshots, not source-only assertions. This was browser viewport testing, not physical iPhone/Safari testing or a hardware frame-rate certification.
- Bun and project dependencies are not installed in the editing sandbox, so local platform typecheck/build were not run. Normal platform deployment performs the build.
