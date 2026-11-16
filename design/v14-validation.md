# v14 — Winter opening, walking visitors, manholes and double jump

## Changes

- All six stages last 150 active seconds: resort 0–150, village 150–300, meadow 300–450, mountain 450–600, glacier 600–750, summit 750–900. Pure rules, rendered biome boundaries, terrain blends, HUD and five translated route descriptions agree. The full journey still ends at 900 seconds; pause does not advance it.
- First stage retains the existing real 3D resort/street architecture, now with snowy road, pavements, roof/awning/balcony tops, winter mountains and falling snow. Snow fades over the final six seconds of the opening stage. Snowfall is capped at 150 instanced, soft-edged billboards, or 35 in reduced-motion mode; flakes do not cast square shadows.
- Pedestrians, hikers and photography groups approach at 2.4 distance units/second (relaxed mode applies its normal 0.75 factor). Authored articulated people have alternating thigh/knee/foot movement, body bounce and arm swing. Photo groups keep their cameras while walking. Their collision positions move with their rendered positions and normal row-lead compensation retains the open lane.
- Open manholes occur only in the resort and village. An upright hinged iron lid, rim, dark shaft and real road/terrain cutout identify the opening. Jump or dodge to pass. An unprotected fall removes one life and plays a one-second downward/recovery motion; ordinary hit invulnerability prevents repeat life loss. Horn Rush protects against the opening. Hole cutouts are capped at eight shader uniforms and move with the route origin.
- Dark-green superhero cape uses the original `collection-mark.png` image mark, mapped in cloth coordinates so it follows the animated folds. Cream/gold mark, gold hem, existing lightning and six-second rush retained.
- A second up-swipe, jump button press or jump key while airborne restarts the upward impulse from the current height. It does not snap Hornox to ground. A third jump is rejected until landing, then the count resets. Double jump has distinct sound/particle/text feedback. Jump height used by collisions and rendering comes from the same deterministic state.
- Cache version and score namespace are v14. Existing branding, original embossed coins, three lives/hearts, intro/camera/countdown, electric traffic, all languages and audio recovery retained. No dependencies or lockfiles changed.

## Validation

- Node game contract check passed.
- 35 game-rule checks passed: full 900-second simulation; exact new stage boundaries; biome-local obstacle sets; bounded/fair rows; hearts/lives; rush duration/speed; moving visitors; height-continuous double jump, third-jump rejection and landing reset; manhole fall, jump, dodge and rush protection.
- Nine audio lifecycle tests passed, including foreground recovery, mute and pause persistence.
- Playwright WebGL Chromium: mobile touch viewport 430x900 and desktop 1360x850. Real touch-button presses and desktop arrow keys successfully triggered double jumps; pause froze height; landing reset the counter. Open-hole cutout present, winter present only in stage one, all five stage transitions, life loss and 900-second finish checked. No page errors, failed asset requests, dropped instances or lost WebGL context.
- Visual review: actual winter street, open shaft/lid, green logo cape and desktop framing. Screenshots in `design/v14/`. Initial screenshots also reviewed at native renderer resolution. Software-renderer screenshots use the application's existing lower-resolution fallback, not a physical-phone performance measurement.
- An initial test's second Playwright locator tap arrived after the first jump had landed: locator stability waits were too slow with CPU WebGL. The final touch test uses direct touchscreen coordinates, avoiding those artificial waits, and passed. No game rule was weakened to satisfy that check.
- The existing source-only edit sandbox has no Bun/project dependencies. No local Bun build is claimed; the normal publish service performs the full build.
