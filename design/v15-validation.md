# v15 — Zermatt encounters

## Change
- Replaced primitive pedestrian models with the existing detailed 11,884-triangle textured hiker mesh, reused without new downloads. Five jacket colours, two scales, accessories, procedural leg/arm gait and holding poses. These are stylized authored animations, not new rigged scans or photorealistic people.
- Every pedestrian/hiker encounter renders at least two visitors, alternating single-file and adjacent formations. Photographers have three; map-reading couples and selfie-stick pairs add distinct situations. Two scooter riders share a lane in a staggered formation.
- Authored a two-horse forest-green carriage with burgundy seats, brass trim, lamps, reins, animated horses and spoked wheels. It reserves two lanes and leaves one safe lane. Contact uses the horses' leading edge; approach lead preserves row timing.
- Retained approaching electric taxis, added approaching scooters, winter-only snowmen and a pink flamingo with a green scarf.
- Flamingo spawns at the first eligible street/resort row after 110 seconds. The deterministic state flag prevents another spawn for the remainder of that run and resets on a new run. A player who loses before the appearance will not see it.
- New hazards support Horn Rush knockback. Environment-specific spawning, existing coins/hearts, 150-second stages, double jump, multilingual help and audio lifecycle are retained.

## Validation
- `node app/scripts/check-logic.mjs`: passed; exact six-function pure rules contract.
- `node app/scripts/test-game.mjs`: 38 checks passed. Includes complete 900-second bot journey, four full simulated runs with exactly one flamingo each, carriage front-edge/two-lane collision, new hazards and safe-lane/heart placement checks over 50 seeds.
- `node app/scripts/test-audio.mjs`: 9 audio lifecycle checks passed.
- Playwright desktop/mobile encounter smoke: all six visitor categories rendered groups of at least two; representative scene had seven visitors, one flamingo, no dropped scenery instances, no JS errors or failed requests. Horn Rush throws both carriage and visitors.
- Existing-feature Playwright regression passed: mobile and desktop double jump, pause/landing, winter and manhole damage, all five timed world transitions, 900-second finish, no browser errors or dropped instances.
- Native-resolution mobile render was also visually inspected.
- Inspected actual rendered screenshots: winter mobile/desktop scene and isolated authored props. Refined camera/map holding poses and accessory alignment following the first visual inspection.
- Screenshots from software WebGL have an intentional resolution fallback; they do not establish FPS on physical phones. No device-performance or AAA/Unreal claim is made. No dependencies or lockfile changes.

Assets and original brand marks remain project-owned files. Existing populated cover/feed metadata remains in place for this update.
