# v6 — environment-specific challenges and Swiss folk audio

Each generated obstacle carries its biome. Glacier: crevasses, ice blocks, natural ice arches. Meadows: marmots, sheep, stationary hikers, fallen logs and low branches. Bahnhofstrasse: cyclists, stationary pedestrians, café tables, roadwork barriers and awnings. Hotel approach: luggage, trolleys, flower pots and stationary pedestrians. No mixed generic barriers or animals on the glacier. Obstacle-free buffers around biome transitions and turns improve readability.

Hikers now use a separate standing mesh, have zero approach speed and no running animation. Animals have lightweight hopping/swaying motion and approach the player; cyclists approach only in the village. Glacier crevasses use jagged dark-blue geometry with broken ice rims. All non-collectible obstacles remain visible until behind the runner.

The random selection now uses upper PRNG bits; low-bit parity previously suppressed half the random pattern choices for a given seed. Determinism remains intact.

New Swiss Ländler soundtrack: Schwyzerörgeli, clarinet, bass, cowbells and alphorn, with a crossfaded loop. New jump, cowbell pickup and comical stumble sounds replace previous files. Music normalized to -19 LUFS and effects to -16 LUFS, true peak target -3 dBFS; master compressor and original sound toggle retained. No autoplay before user interaction.

World-space effects: coin sparkles, snow/dust footsteps, takeoff/landing puffs, landing ring, brief character compression, gentle stumble wobble, jump/duck success, close-call and combo feedback, hotel confetti. Particles capped at 96. Effects freeze on pause and respect reduced-motion preference. New help and celebration labels translated into all five languages.

Validation:
- 15 deterministic rule tests pass, including exhaustive biome membership/variant coverage across seeds, standing versus moving NPCs, every new obstacle collision type, combo events and a full simulated 21-minute run (2 hotel arrivals, 2,001 coins, still playing).
- Pure-logic contract and JS syntax checks pass.
- Browser functional tests pass: real CDP touch gestures, no scrolling, five languages, audio decode/mute/unmute, pause, mobile/landscape/desktop layouts, no errors or failed assets.
- Native-render screenshots reviewed for all four biome obstacle sets and particle/combo feedback. Particle pool and combo label observed in the coin-combo case.
- No physical iPhone/Safari or native GPU performance testing available. Local Bun/TypeScript prerequisites remain absent; platform build is required before release.

Standing hiker source: https://d8j0ntlcm91z4.cloudfront.net/user_3JjDpOAFtnbtpW0lE7YJ0GDDCcc/hf_20261029_055738_b790ecc0-a3f2-4697-a9e0-4d36359ad1d1.glb
Audio generation provenance: v6-audio.json.
