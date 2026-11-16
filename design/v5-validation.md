# Hornox Run · Zermatt — v5

The public route is always endless. Active game time drives glacier (0–3 min), alpine meadows (3–6:30), Bahnhofstrasse (6:30–9:30), and Alpen Resort (9:30–10 min). At 10 minutes the hotel awards a bonus and a life, then the route continues. Pauses do not count. Lives and collisions still apply.

## Implementation

- Original Aufdenblatten Collection fir symbol extracted from the official transparent logo and placed into the backpack's actual UV texture. Backpack teal is recoloured green in the character material. Official Alpen Resort wordmark remains visible during play.
- Four new textured 3D obstacle models: marmot, Valais Blacknose sheep, hiker and bicycle/rider. Hiker has a skeletal running clip; other wildlife moves towards the player with lightweight whole-model movement. These are generated game interpretations, not scans.
- Hotel model references the official exterior: broad pitched roof, pale balcony fronts and dark timber framing. The hotel is beside the open route, rather than a solid wall at the finish.
- Continuous ribbon road replaces overlapping road blocks, mipmapped anisotropic textures replace high-frequency noise, soft shadow filtering, atmosphere/far-distance alpha fades, soft biome texture transitions. No large hillside geometry intersects the route.
- Real Touch Events use capture and passive:false over the entire active game surface. Pointer input handles mouse/pen. CSS fixes the document and disables touch scrolling/overscroll. One directional action per swipe; on-screen controls and keyboard remain available. Browser/host-level dismissal gestures outside this document cannot be overridden by the child game.
- English default with persistent EN/DE/FR/JA/ZH choice. New score namespace prevents old towel scores from mixing with coin scores.
- Generated alpine music, a crossfaded loop boundary, and jump/slide/land/coin/collision effects. Web Audio starts after a user gesture; pause/home stops music; the mute switch gates all audio.
- No new dependencies, no runtime CDN JavaScript, unchanged package manifests and lockfiles. Existing dependency-free WebGL2 renderer; not Unreal Engine. Unreal browser delivery would require a separate GPU streaming infrastructure.

## Validation

- Node syntax checks for changed JavaScript modules and platform pure-logic contract check pass.
- 11 rule tests pass: action validation, deterministic immutable state, coins, incoming collisions, jump/duck semantics, buffered input, landing event, matching road/turn schedule, 10-minute arrival, all locale keys, identical server/browser rules.
- A deterministic bot simulates 21 minutes: 22,750 m, 1,951 coins, 34 turns, two hotel arrivals; still playing. Object count remains bounded.
- Headless Chromium with real CDP touch events: swipe down triggers duck, up triggers jump, left changes lane. Every touchmove is prevented and scrollY remains zero.
- Music buffer decodes, jump sound plays, mute suppresses effects, unmute restores audio. Pause freezes simulation and stops music.
- Five language selections and settings dialogs pass; 320×568, 390×844, 844×390 and 1440×900 layouts checked. Native-render screenshots inspected for all four stages, plus a corner.
- No browser errors or failed asset requests in the checked flows.
- No physical iPhone/Safari available; WebKit not installed. No claim of device-level 60 fps or parity with a professionally produced Temple Run game. Headless software-renderer frame rate is not representative of phone GPU performance.
- Bun and project node_modules absent in editing sandbox; local tsc/build cannot run. Platform CI build/deploy is the authoritative remaining build check.

## Brand/reference sources

- https://www.alpenresort.com/ — identity and exterior.
- https://aufdenblatten.swiss/ — original Collection picturemark.
- https://zermatt.swiss/entdecken-erleben/doerfer/zermatt — Bahnhofstrasse context.
- https://cdn.prod.website-files.com/6989cd8b8745b76bc750b534/6989ce8c180a658873160627_relume-686582.png — official Collection transparent logo.
- https://cdn.prod.website-files.com/69b2630b40e67afaa1221602/6a4ca0949cea945ab7580e08_alpenresort_dsc07302_marcoschnyder-L.webp — hotel exterior reference.

Generation provenance is recorded in v5-assets.json. Extra hotel GLB: b3133569-cbef-4bbf-bb3b-2c925c029950; animated hiker: 86045e0a-dd8e-4354-87b8-d0b0f061be1b.
