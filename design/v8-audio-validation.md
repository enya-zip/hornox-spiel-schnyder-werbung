# Audio recovery after browser/app interruptions

- Resume AudioContext from both suspended and interrupted states, with statechange, visibility, focus and page lifecycle recovery.
- Explicitly release the audio device on departure. The existing game auto-pause remains; Continue reacquires audio synchronously in the user gesture.
- A fresh touch/key/pointer gesture retries even if an earlier automatic resume is pending behind autoplay policy. Closed contexts are recreated with cached decoded buffers.
- Save the looping track offset on pause/interruption; resume at that position. Disconnect stopped nodes and maintain one music source. Ignore stale context events and late resume promises after departure. Muted/manual-paused games stay silent.
- Client and audio module URL cache keys bumped to v8; gameplay rules, scores, assets, music and branding unchanged.

Validation: nine deterministic audio lifecycle tests passed, including Safari-style interrupted state, pending autoplay retry, closed-context recovery, repeated foreground events, late resume, mute and playback offset. Chromium with real Web Audio: three simulated app-switch cycles paused game time, resumed exactly one loop and produced nonzero PCM output each time. PCM peaks 0.152 / 0.124 / 0.111. Manual pause, mute/unmute and actual AudioContext.suspend recovery passed; no page errors or failed assets. Browser test used visibility/page/focus events, not a physical iPhone or another native app. No real Safari hardware claim.

Local syntax and whitespace checks passed. Bun, project node_modules and local typecheck/build unavailable; platform CI deploy is authoritative. Dependencies and lockfile unchanged.
