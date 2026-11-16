# v16 — Visitor animation polish

## Scope
Continuation of the Zermatt tourist quality pass. The established course, difficulty, life count, stage duration and public URL are retained.

## Changes
- Group members now have different roles: selfie-taker with a waving friend, map reader with a walking companion, photographers with a posing friend, and a pedestrian carrying a takeaway coffee. Every encounter still has at least two people.
- Four hair colours and four trouser colours complement the existing five jacket colours. Four height scales, subtly different step tempos and a small body sway reduce identical-looking groups. Beanies have two colour variants; sunglasses now have temples.
- Added knee flexion and waving/coffee poses. Corrected geometric weighting so hand movement no longer distorts isolated vertices in the shoes, and pose adjustments preserve hand volume.
- Static, unrigged actors reuse their already-computed node transforms; animated/skinned actors still evaluate their animation and bone matrices each update. Shared colour arrays also avoid allocating colour palettes for every visitor draw. This is a bounded CPU cleanup, not a measured FPS claim.

## Verification
- Pure game contract check passed; 38 rule checks and 9 audio lifecycle checks passed.
- Browser render probe confirmed all six visitor poses compile and draw without browser errors; unrigged visitors use static cached transforms while Hornox retains dynamic skeleton updates.
- Inspected the final rendered visitor sheets after correcting the hand/foot weight regions. Stylized human model and existing textures are reused; no new rigged scans, external dependencies or 3D generation are claimed.
- Mobile/desktop encounter smoke checks verify minimum group size, distinct selfie poses, one visible flamingo, Horn Rush knockback, no dropped scenery instances and no asset or JavaScript errors.
- The environment/rules version is 16, with cache version updates for modified client modules. Metadata and branded launch cover remain populated.

The screenshot renderer runs on software WebGL; this does not establish smoothness or FPS on a physical phone.
