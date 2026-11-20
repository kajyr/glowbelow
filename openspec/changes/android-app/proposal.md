## Why

Many parents look for kids' games in the app stores, not on itch.io or through a "add to home screen" link. A Google Play release puts Glow Below where they look, installs like any app, and plays offline from the first launch. The Play Console account already exists, so Android goes first. The app shell built here is reused by `ios-app`.

## What Changes

- A Tauri 2 app shell around the existing web build, in `src-tauri/`, shared by Android and (later) iOS
- The web build is bundled inside the app: no network needed, ever, not even for the first launch
- A new `app` build target: no service worker, no links out, saving always on
- Android app: landscape only, full screen (system bars hidden), keeps the screen awake while playing, back button never quits by accident
- Signed Android App Bundle built by one command (`just release-android`); version follows `package.json`
- Google Play listing: paid upfront, no ads, no in-app purchases, in the "Designed for Families" program (ages 5–8)
- Store paperwork: privacy policy page (no data collected), Data safety form, content rating, store text in `docs/play/`
- Store media made by one command from fixed worlds: screenshots, feature graphic and a short promo video with game sound (uploaded unlisted to the user's YouTube channel, as Play requires)
- Claude does the Play Console work in the user's signed-in Chrome (Claude in Chrome): app creation, listing, questionnaires, uploads, releases. The user only signs in, sets up payments and legal agreements, and approves anything that goes public
- Closed test on Play before the first production release
- `AGENTS.md`, `GAME_DESIGN.md` and the release steps updated so every iteration can also ship to Play

## Capabilities

### New Capabilities

- `native-app`: how the game behaves when installed from an app store: bundled files, offline from the first launch, no service worker, no links out, saving on the device, landscape full screen, updates through the store. Platform-neutral; Android scenarios here, iOS added by `ios-app`
- `android-release`: building, signing and publishing the Android app on Google Play, the store listing, and keeping it in step with the game

### Modified Capabilities

None. Web, PWA and itch.io behaviour stay as they are.

## Impact

- New `src-tauri/` (Rust crate, `tauri.conf.json`, generated Android project under `gen/android`, committed)
- New dev dependencies: `@tauri-apps/cli`; build machine needs Rust, Android SDK + NDK, Java 17
- `src/pwa.ts`: `app` target skips the service worker; `src/env.d.ts`: new `VITE_TARGET` value
- `package.json`: `build:app` script; `justfile`: `release-android` recipe
- Secrets kept out of git: upload keystore and its passwords
- New `docs/play/` (listing text, form answers, generated media), new privacy policy page (served with the web build)
- New dev dependency: Playwright (store capture script); a capture helper available only with `?debug`; `ffmpeg` on the build machine
- Needs the Claude in Chrome extension signed in to the user's Google account (Play Console, YouTube)
- Costs: Play payments profile for paid apps; store fees on each sale
- Depends on nothing in flight; `ios-app` depends on this change
