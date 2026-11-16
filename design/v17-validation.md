# v17 — Ten levels, alpine route and collectible powers

## Player-facing change
The first departure from winter Zermatt now happens at exactly 90 seconds. Every subsequent stage lasts 90 seconds; the Matterhorn finish remains at 15 minutes. The launch screen and app/feed metadata use Hornox Run, with an authored ox favicon. The public address stays unchanged.

| Time | Stage | Environment |
| --- | --- | --- |
| 0:00–1:30 | Alpen Resort / Zermatt | Winter streets, people, electric vehicles and bikes |
| 1:30–3:00 | Blatten | Wood and stone chalets, chapel, fields |
| 3:00–4:30 | Zum See | Alpine hamlet and grazing animals |
| 4:30–6:00 | Furi | Forest, wood bridge and mountain bikers |
| 6:00–7:30 | Alpine meadows | Sheep, marmots and bikes |
| 7:30–9:00 | Schwarzsee | Rock, lake and hiking obstacles |
| 9:00–10:30 | Hörnliweg | Mountain path and rockfall |
| 10:30–12:00 | Glacier | Ice hazards and crevasses |
| 12:00–13:30 | Hörnligrat | Snow and rock ridge |
| 13:30–15:00 | Matterhorn | Final snowy ascent |

This is a creative game itinerary, not a walking/navigation map. Official Zermatt references informed the village sequence and environmental motifs:
- https://zermatt.swiss/p/zermatt-furi-via-blatten-nr-118-01tVj000005EvuwIAC
- https://zermatt.swiss/p/weiler-furi-01tVj000005DmVSIA0

## Difficulty and rewards
Classic speed starts at 19 rather than 18, with a 27 cap rather than 26. Classic obstacle spacing drops from the previous 25–28 range to 23–26 as the run progresses. Relaxed mode keeps its slower baseline and spacing. Bikes are more common in town, hamlets, forest and meadow stages, including offset pairs that retain a free lane. Alpine rock/ice stages retain appropriate hazards.

Four collectible power-ups appear cyclically in safe lanes: an 8-second coin magnet, a one-hit Alpine Shield, 10 seconds of double coins, and Horn Spark (+15 of 30 Horn Rush energy). Pickups are not knocked away by Horn Rush. A shield does not stack; a duplicate gives points. Horn Rush, three lives, occasional hearts, double jump, intro and audio recovery remain. The unique flamingo is moved into the shorter first-stage window.

## Rendering work
- Added movement interpolation for approaching obstacles between 20 Hz simulation ticks.
- Reduced sloped terrain geometry from 5,400 to 864 vertices and made the ground/track height planes agree. Cached path-clearance checks with a bounded cache.
- Reduced distant balcony/flower detail while retaining nearby detail; reused chalet prefabs.
- Added adaptive resolution bounded between 0.85 and 1.5, with sustained frame-rate thresholds and cooldowns rather than rapid oscillation.
- Distant surface textures blend to stable averages to avoid texture-atlas bleed and shimmering at a grazing angle.
- Lake placement checks route clearance and conforms to the terrain incline.

## Validation
- Pure game contract passes; 44 rule checks pass, including all nine exact 90-second transitions, 900-second finish, safe obstacle rows, life limits, all four pickup effects and one flamingo per run.
- Deterministic full-duration runner reaches the finish; four seeded full runs retain the one-flamingo rule. Increased lower-altitude bike density is verified independently.
- 9 audio lifecycle checks pass, including pause/resume, returning to the browser and persisted mute.
- Browser checks cover mobile and desktop layout, all ten environment states, pickup rendering/collection, HUD 2/10 at 1:30, and the final win. No JavaScript errors, missing assets or dropped instance batches.
- Keyboard double jump, lane changes and pause/resume pass. Controlled 16.667 ms render timestamps verify nonzero obstacle interpolation between fixed steps, and zero interpolation while paused.
- All five language dictionaries have stage and power-up copy; winning copy says ten stages.
- Final mobile launch, Blatten/power-up view and desktop scene were visually inspected. The distant blue/white texture striping seen during QA was corrected before release.

The browser screenshots use software WebGL. They verify rendering and function, not measured FPS on a physical iPhone or Android device. Actual device smoothness is not guaranteed by these checks.
