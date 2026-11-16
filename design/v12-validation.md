# V12 — Alpen Resort entrance cinematic and Horn Rush

## User request and visual reference

Reference: user attachment IMG_5156.jpeg, showing the Alpen Resort entrance and terrace. The Instagram chrome and caption are not included in the game. This is authored game-scale 3D scenery based on the photo, not a photogrammetric scan.

Rebuilt the start hotel with a dark timber gable, three long pale-glass balcony bands, projecting flower baskets, attic balcony/windows, stone ground-floor framing, a real entrance gap with moving glass door panels, low entrance canopy, hotel branding, noticeboard, menu stand, lamps and shrubs. Added the terrace with cream square parasols, wooden poles/ribs, tables, framed upholstered chairs, lounge seating, flags, planted edges and trees. Existing brand artwork remains self-hosted.

## Start sequence

- 5.4-second 3D intro: doors open, Hornox exits the real opening and approaches the starting position.
- Camera makes a 180-degree orbit and rises over the parasols so the character stays in view. Ends at the exact normal follow-camera position and target; no switch to a photographic backdrop.
- Then a numeric three-second countdown: 3, 2, 1, with bell cues. No game ticks, distance, hazards or score advance during intro/countdown.
- Pause/backgrounding freezes the intro and countdown. Gameplay controls are blocked until the countdown ends. Reduced motion uses a cut between stable views instead of the orbit.

## Horn Rush

- Collect 30 coins, then activate explicitly with the lightning button or the displayed keyboard shortcut (E by default; selects an unused key if movement keys are remapped).
- Six active seconds: protects from contacted hazards, attracts coins across lanes and handles corners. Contacted hazards are cleared once with a 25-point reward and particles; no graphic violence.
- Golden orbit rings, particle trail, activation headline, sound cue and visible duration/charge indicator. After expiry there is a one-second safe handover.
- Charge cannot accumulate during the active ability; cannot retrigger while active. Pausing freezes duration. Five-language instructions and accessibility labels.
- Three-life system, heart pickups, green branded backpack/mug, street signs, controls and the 900-second summit route remain.
- Rules, renderer, module cache and score namespace version 12.

## Validation before publication

- 30 rule/choreography checks passed. Includes the previous full 900-second run and new charging, activation validation, exact 120-tick duration, every biome hazard, automatic coins/corners, no self-recharging, and exact camera handoff/180-degree orbit checks.
- 9 audio lifecycle checks passed, covering background/foreground recovery, interrupted contexts, mute/pause and gesture retry.
- Chromium/WebGL2 at 430×900 and 1440×900: actual entrance, exit, orbit and power-state screenshots visually inspected. No JavaScript errors, failed asset requests, lost context or dropped geometry in the tested scenes.
- Actual input checks: movement blocked during intro; pause freezes intro; 3/2/1 each appears while game tick remains zero; tick 1 begins afterwards; touch button and keyboard activate Rush; collision is protected; pause freezes its timer; it expires; exact 900-second result still wins.
- No physical iPhone/Safari hardware testing or frame-rate certification. Local project Bun/dependencies are absent; the platform deployment performs the application build.
