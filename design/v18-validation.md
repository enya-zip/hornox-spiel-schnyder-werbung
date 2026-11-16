# v18 — Longer joyful alpine soundtrack

Replaced the short Swiss music loop with a newly generated 210-second instrumental composition. Brief: fast 148 BPM energy, Schwyzeroergeli, clarinet/fiddle, playful alphorn calls, cowbells, plucked bass and crisp acoustic percussion; developing melodies and variations rather than concatenated short loops. Generation provenance and encoding measurements are in v18-audio.json.

The complete new track plays before looping, exceeding the requested three-minute minimum. Stage transitions do not restart it. Existing music gain, effect sounds, mute, playback-position recovery and browser interruption handling are retained. Audio/client cache keys changed to v18 so returning browsers load the new music. No gameplay, graphics or dependency changes.

## Audio file
- Source: 210.002 seconds, generated as one continuous track; no short-clip concatenation or time stretching.
- Delivered MP3: 210.050612 seconds including container padding; 44.1 kHz stereo, 128 kbps, 3,361,404 bytes.
- Browser-decoded content: 210.00127 seconds.
- Measured integrated loudness -19.43 LUFS; true peak -6.38 dBFS. The existing game mixer further reduces music volume under effects.
- No silence of 2 seconds or longer below -42 dBFS detected.
- Generated/normalized asset also uploaded and confirmed in Higgsfield storage.

## Checks
- 13 deterministic audio lifecycle checks passed. Includes interrupted/suspended/closed contexts, blur and Continue, mute, no stacked music, playback past 180 seconds, continued playback at 90/180-second stage boundaries, and loop wrap only at the complete 210-second duration.
- Actual Chromium/Web Audio browser check passed: full decoded duration, nonzero PCM RMS 0.0601, no restart on the Blatten transition, saved position after blur/Continue, mute/unmute recovery, no JavaScript errors or missing assets.
- Pure game contract, JS syntax and git whitespace checks passed. The gameplay logic is unchanged.
- Existing populated cover and metadata are retained.

Browser interruption checks simulate page events; this is not a physical iPhone/Safari hardware test. Local Bun and project dependencies are not installed; the normal platform build is used rather than installing dependencies.
