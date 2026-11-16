# v13 — Superhero rush, village traffic and Collection coins

Request: strengthen Horn Rush with a cape, lightning, speed and visible knockback; add oncoming Zermatt electric shuttles and stationary photography groups; emboss the original Collection image mark on small gold coins; improve rendering efficiency.

## Implemented behaviour

- Thirty coins charge the existing power button. Touch or the displayed desktop key activates six active seconds of invulnerability, automatic coin attraction and safe route turns.
- Speed ramps up over seven simulation ticks to 155% of normal speed, then eases down over the last twelve ticks. The 900-second destination timer remains based on active time, not distance. The existing one-second safe handover remains.
- The shockwave resolves nearby hazards across all three lanes once. Events include object ID, kind, lane and route distance. Visible movable objects arc sideways, rotate and settle out of view over 1.1 seconds. At most twelve throw animations are retained. Ground gaps are safely cleared without floating terrain chunks.
- A 672-triangle red cloth cape has animated folds, a gold hem and shoulder clasps. Four continuous cyan-white lightning arcs, smaller branches, a ground aura and speed streaks accompany the power. Reduced-motion mode keeps the cape/lightning static and removes streaks and the FOV expansion. Pause freezes the run, power timer, cape and knockback clock.
- Compact, oncoming hotel-style electric taxis have upright glazed cabins, headlights, rotating wheels, roof luggage and an E-TAXI roof sign. They approach at seven distance units/second in classic mode and occur only in the resort/village profiles.
- Three stationary photographers per group hold cameras or a phone at their faces; groups do not walk out of the way. Both new hazards need a lane dodge when power is inactive. Hazard rows retain an open lane.
- Small gold coins have two bevelled faces, reeded edges and a gold relief shader using the existing original `assets/collection-mark.png` alpha. No replacement logo was invented. The same image mark appears upright on both sides.
- Existing green branded backpack/mug, hotel entrance and camera intro, 3/2/1 countdown, three lives, heart pickups, 15-minute route, five languages, music controls and foreground audio recovery remain.

## Rendering work

- Cached local instance transforms for facade variants and shuttle bodywork avoid rebuilding their matrix trigonometry every frame; parent transform stacks are restored after cache construction.
- Background mountains use a smooth-normal 40x40 grid instead of 64x64 (60.9% fewer triangles per background mountain). The main Matterhorn remains 64x64.
- Flat village terrain uses two triangles rather than a large, coplanar grid. Sloping terrain remains analytical with a 120 m grid.
- Cloth uses a reused typed buffer; the renderer uploads typed arrays directly. HUD updates at the existing 20 Hz simulation cadence rather than every display frame.
- No dependencies or lockfiles changed. The authored WebGL2 renderer remains in place; this is not Unreal Engine.

## Verification on 2026-10-29

- `node app/scripts/check-logic.mjs`: passed six-function deterministic game contract.
- `node app/scripts/test-game.mjs`: 33 checks passed, including a full 900-second simulated journey, all biome profiles, fair row patterns, life caps, exact power duration, speed ramp, all-lane clearing, event origins and new obstacle collision rules.
- `node app/scripts/test-audio.mjs`: all 9 foreground/background, mute/pause and interrupted-context checks passed.
- Playwright Chromium with WebGL software backend, 430x900 touch viewport and 1360x850 desktop viewport: intro/input gate/countdown, touch activation, keyboard activation, cape geometry, simultaneous taxi/group knockback, pause/expiry, heart recovery, all six environments and 900-second win passed. No page/console errors, failed asset requests, dropped instances or lost WebGL contexts.
- Native-resolution visual inspection of the actual game: mobile cape/lightning and gold relief close-up. `design/v13/` stores those inspected screenshots plus the mid-knockback frame. Desktop framing was also inspected in the initial visual run.
- These are browser-emulation checks, not a physical-iPhone frame-rate measurement. No 60 FPS claim is made.
- Full platform build runs on the normal publish service; Bun and the project dependencies are not installed in the edit sandbox, so no local Bun build is claimed.

Reference verification: Zermatt municipality describes the village as car-free but served by electric vehicles: https://gemeinde.zermatt.ch/unser-dorf . The game uses authored, stylized compact taxis rather than a claimed exact vehicle replica.
