# v19 — Cover entry and app-style main menu

## Scope
Apply the user's persistent mobile-game presentation preference to Hornox Run: a dedicated cover entry followed by a functional app-style menu. The existing personal skill `mobile-games-aaa-interface` already stores this preference for future work; no other game is changed by this release.

## Interface
- Full-screen cover with Hornox artwork, authored HTML title, hotel branding, entry button and a short reduced-motion-aware entrance transition.
- Main menu with a prominent run button, Classic/Relaxed choice synced with settings, instructions, three navigation destinations (Play/Journey/Records), language, sound and settings.
- Journey view shows the actual ten stages and their 90-second start times, as information rather than a fake unlocked-level selector.
- Records display only the two existing locally saved best scores. Their v17 storage keys are preserved. A fresh device shows a dash rather than invented scores.
- New copy in English, German, French, Japanese and Chinese; English remains the default.
- Consistent colours and panels across HUD, pause and results. Pause/result panels fit narrow displays.
- Opening the cover does not start audio. Entering the menu explicitly unlocks music; the existing 210-second track and game recovery logic are retained.
- Static menu artwork replaces unnecessary WebGL rendering while on the home screen. Gameplay still uses the existing renderer, models, rules, intro and controls.
- Return from a run goes to the menu, without requiring the cover to be dismissed again.

## Artwork constraint
An attempted new portrait image generation returned out-of-credits. Balance was 0.11 credits; no new image job was submitted. Reused the existing original Hornox key art at `/home/user/hornox-art/0.png`, converted to a 355 KB WebP for the interface. Existing published cover/OG metadata remain populated. This release does not claim newly generated art or AAA engine/production quality.

## Verification
- Browser journey through cover, menu, route, records, settings, all five languages, mode choice, game start, pause, home return, restart and result saving passed without JS/HTTP errors.
- Responsive bounds checked at 320×568, 390×844, 844×390 and 1280×800. Reviewed rendered cover, menu, route, desktop, gameplay HUD, pause and result views. Corrected duplicate active-tab styling and narrow-screen panel overflow found during QA.
- Actual CDP touch gesture scrolls the route panel by 165 px while the document remains fixed at scrollY=0. Exactly one navigation tab has aria-current.
- Confirmed new menu retains decoded 210-second v18 music. All 13 audio lifecycle checks pass.
- Pure game contract, JavaScript syntax and whitespace checks pass. Gameplay rules are not modified.
- Local Bun/project dependencies remain absent; use normal platform build. No packages or lockfiles changed.

Testing uses Chromium software WebGL and viewport emulation, not a physical iPhone. Source measurements do not establish hardware FPS.
