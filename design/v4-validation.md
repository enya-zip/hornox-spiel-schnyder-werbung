# Hornox Run — Version 4
The primitive-built character has been replaced with a 23,195-triangle textured GLB. The running rig has 24 joints. RunFast and Regular_Jump clips were generated from a forward-aligned source mesh. Sliding uses a crouched skeleton pose plus root lean and lowering. The home screen uses the full detailed standing mesh.

Native WebGL2 renders smooth geometry, normal-mapped character surfaces, filtered textures and shadow mapping. Software rasterizers receive reduced resolution and no shadow map. Performance on physical iOS/Android hardware is not measured in this environment.

Controls: swipe up/down for jump/slide; swipe left/right to steer on straights and turn in the corner window. Optional motion permission enables continuous lateral tilt steering. A denied permission or unavailable sensor leaves swipe steering usable. Desktop uses arrows/WASD, Space and Escape. All four bindings can be changed.

Validation:
- 14 deterministic gameplay/path checks: immutable rules, hostile actions, collision timing, shield, magnet, twenty successful route seeds, endless beyond 2800 m, corner direction/window and continuous world geometry.
- Chromium/Playwright: keyboard jump/slide, all four pointer swipes, a completed corner, pause, simulated granted motion sensor input, denied sensor fallback.
- Responsive layouts checked at 320×568, 390×844, 844×390 and 1440×900.
- No browser exceptions or missing asset responses in the browser checks.
- Native shading and shadow path rendered separately for visual inspection.
- The sandbox lacks Bun and installed project build dependencies. Platform CI runs the normal logic validation, TypeScript check and bundle build during deployment.

This is a custom browser runner inspired by the control conventions of Temple Run. It does not use Temple Run art, code or branding.
