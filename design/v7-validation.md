# Hornox Run v7 — difficulty and 30-second worlds

- Active-time biome schedule: glacier 0–30 s, meadow 30–60 s, Bahnhofstrasse 60–90 s, resort 90–120 s, repeat indefinitely. Hotel reward at 90 s then every 120 s. Rendering, hazards, HUD and five languages share this schedule.
- Classic speed 18 rising to 26; row spacing 28 reducing to 25. Relaxed mode keeps slower speed and wider spacing. Opening and corner safety buffers remain, with a short 1.6-second biome-transition buffer.
- Most later rows contain two obstacles and one free lane. Full-width patterns require one consistent jump/slide action. Incoming bikes, wildlife, rolling luggage and trolleys have a relative-speed spawn lead, synchronizing encounters with the static row. Hikers/pedestrians stay still.
- Twenty seeds over 120 seconds averaged 122.1 hazards and 51.4 incoming threats versus 43.25 and 0 in v6, which remained on the glacier. Counts include ahead-spawned objects.
- World notices sit above the obstacle sightline. The hotel banner is 260×74 at y=160 on 390×844 and lasts two seconds, without a duplicate toast.
- v7 cache keys and local score namespace; preferences retained.

## Validation

- Pure logic contract, JS syntax, git whitespace checks and 18 rule checks passed.
- 21-minute relaxed bot run: 24,390 distance, 2,381 coins, ten hotel arrivals, 36 correct turns, still playing, bounded objects.
- Across 50 seeds and five times: 1,246 paired obstacle rows preserve an open lane; 926 incoming objects synchronize their encounter timing. Correct biome membership and collision rules passed.
- Chromium: boundaries at exactly 30/60/90/120/150 seconds, correct renderer zone, label and progress reset; paused clock remains fixed; five-language help updated; no page errors or failed assets.
- CDP touch up/down/left and no scrolling, keyboard controls, sound/mute, pause and layouts at 320×568, 844×390 and 1440×900 passed.
- Native-quality WebGL screenshots of all four environments and final compact hotel banner inspected.
- Local Bun/build/typecheck unavailable: sandbox has neither Bun nor project node_modules. Normal platform CI deploy is authoritative. Dependencies and lockfile unchanged.
- Chromium software WebGL testing only; no physical iPhone/Safari or device FPS claim.
