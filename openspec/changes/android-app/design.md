## Context

- The game is a static Vite build (`dist/`, relative paths, `base: './'`); Three.js on WebGL, Web Audio, `localStorage` saves
- Build targets today: plain web (GitHub Pages, with a service worker from `vite-plugin-pwa`) and `itch` (`VITE_TARGET=itch`, no service worker)
- `src/pwa.ts` decides when the service worker registers (`offlineAllowed`)
- The parent corner's "open full page" button (`src/ui/parentCorner.ts`) is the only `window.open` in the game; it shows only when storage is blocked
- This Mac has Rust and Xcode; no Android SDK yet
- Wrapper chosen with the user: Tauri 2, same shell for Android and iOS (alternatives below)

## Goals / Non-Goals

**Goals:**
- One shell, shared with `ios-app`; Android-only bits stay in `gen/android`
- The web code stays the same game: app differences go through one build flag, not forks
- A release takes one command plus the Play Console upload

**Non-Goals:**
- No Play Developer API / fastlane: console work goes through the browser (see below)
- No CI build of the app: built on this Mac
- No native features beyond full screen, keep-awake and back button (no haptics, no cloud saves, no Play Games)
- No change to the web, PWA or itch.io builds
- Italian store listing comes with or after `iteration-7-italian`

## Decisions

### Tauri 2 as the shell
- Bundles `dist/` into the app and serves it from a local scheme; uses the system WebView (Chromium-based on Android, WKWebView on iOS)
- Small app (no bundled browser), one `tauri.conf.json` for both platforms
- Alternatives:
  - Capacitor: same idea, larger plugin ecosystem, no Rust; the user chose Tauri
  - TWA / PWABuilder: needs the hosted site and a network on first run; breaks "offline from the first launch"
  - Hand-written Kotlin + Swift shells: no framework, but two codebases with no shared config
- Rust stays minimal: the generated `lib.rs` plus the keep-awake plugin registration

### Layout: `src-tauri/` at the repo root, generated projects committed
- `src-tauri/tauri.conf.json`: `frontendDist: ../dist`, `beforeBuildCommand: npm run build:app`, identifier, version from `../package.json`
- `src-tauri/gen/android/` committed, as Tauri recommends, so manifest and activity tweaks are reviewed in git
- Identifier: `com.kajyr.glowbelow` (permanent once published; confirm in task 1.1)

### New build target `VITE_TARGET=app`
- `build:app` script: `VITE_TARGET=app npm run build`
- `vite.config.ts`: PWA plugin disabled for `app`, like `itch`
- `offlineAllowed` returns false for `app` (tested in `src/pwa.test.ts`)
- One helper, `isApp()`, for the few UI differences: hide "open full page"; back-button and keep-awake hooks
- Alternative: detect Tauri at run time (`window.__TAURI__`): works, but a build flag keeps the web bundle free of app code paths

### Keep-awake: a tiny local Tauri plugin
- Android: `FLAG_KEEP_SCREEN_ON` on the activity window; iOS (later): `isIdleTimerDisabled`
- The game calls it on play start / resume and clears it on the parent corner and the title screen
- Alternatives: the Screen Wake Lock API (not reliable in Android WebView); always-on in the activity (drains battery if left on the title)

### Back button: handled in the activity
- `MainActivity` (Kotlin, in `gen/android`) intercepts back, asks the page via a small JS hook whether it closed something (album / parent corner)
- If nothing was closed: `moveTaskToBack(true)`, never `finish()`, so the app stays where it was
- The JS hook lives in `src/ui/` behind `isApp()`, with a unit-testable "what does back close?" function in `src/game/`

### Full screen and orientation
- Manifest: `screenOrientation="sensorLandscape"`
- Activity: `WindowInsetsControllerCompat` hides system bars with `BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE`; draw edge to edge
- Safe areas: the HUD already sits in from the edges; check camera cut-outs on a phone

### Sound and lifecycle
- The game already stops sound on `visibilitychange`; Android WebView fires it on background in recent versions
- If it does not on a test device: the activity's `onPause`/`onResume` dispatch the same event to the page

### Version and build number
- `version` in `tauri.conf.json` points at `package.json`; Tauri derives `versionCode` from it (major·1,000,000 + minor·1,000 + patch), so every minor bump increases it
- `just release` keeps bumping the version; `just release-android` only builds from the current version

### Signing and release
- Play App Signing on; we hold only the upload key
- Upload keystore and passwords live outside the repo (`~/.config/glowbelow/` and environment variables), read by the Gradle signing config; `.gitignore` covers `*.jks`, `keystore.properties`
- `just release-android`: `npm test`, `tauri android build --aab` (runs `build:app`), checks the key first and fails with a clear message
- Output: `src-tauri/gen/android/app/build/outputs/bundle/universalRelease/*.aab`; uploaded by Claude to the testing track, then promoted after the user's go-ahead

### Store paperwork in the repo
- `docs/play/listing.md`: title, short and full description, tags, and every console form answer (Families, content rating, Data safety, ads, app access, pricing, countries) as a checklist
- Privacy policy: `public/privacy.html`, published by the existing GitHub Pages workflow; plain words, no data collected

### Store media: `npm run capture:store`
- Playwright script (`tools/capture_store.mjs`) opens the built game (`npm run preview`) with `?seed=N&debug` in headed Chromium, so the GPU renders WebGL
- Scenes staged through `window.game` (zone, lit plants, friends following, squid position), then screenshots at Play's sizes (landscape 16:9, e.g. 1920×1080; phone and 10" tablet sets)
- Feature graphic: `tools/feature_graphic.html` (a staged render plus the title) captured at 1024×500
- Promo video: a debug-only capture helper records the canvas (`captureStream`) and the game's audio output (a `MediaStreamDestination` on the master gain) into one webm via `MediaRecorder`, while the script plays a scripted swim
  - `ffmpeg` trims and converts it to a 1080p mp4 in `docs/play/` (git-ignored if large; regenerated on demand)
  - Alternatives: `adb screenrecord` on the emulator (real app, but no internal audio); screen recording of the browser window (needs an audio loopback driver)
- The HUD is DOM, so the video shows the clean game; screenshots include the HUD since they are page screenshots
- Media are of the web build, which is the same game as the app (`native-app`: same game as the web)

### Play Console work: done by Claude in Chrome
- Claude drives the user's signed-in Chrome with the Claude in Chrome extension, working from the checklist in `docs/play/listing.md`
- Uploads (bundle, screenshots, feature graphic, icon) through the extension's file upload
- Video: uploaded unlisted to the user's YouTube channel through the same browser; its link goes in the listing
- Hand-offs to the user: sign-in and 2-step verification, identity verification, payments profile (bank and tax), accepting agreements, tester email addresses
- Every "send for review" / "start rollout" waits for the user's go-ahead in chat
- After each session, any new or changed answer is written back to `docs/play/listing.md`, so the next update starts from the repo
- Alternative: Play Developer API / fastlane `supply` for listing and uploads (scriptable, but cannot fill the questionnaires, and needs a service account); can be added later

## Risks / Trade-offs

- [WebGL performance in Android WebView lower than in Chrome] → Measure on a mid-range tablet early (task group 2); `game-shell` already has a 60 fps budget and light culling
- [Tauri 2 mobile is younger than Capacitor] → Keep native code tiny and in committed `gen/` files; fall back to editing Kotlin directly
- [New personal Play accounts must run a closed test with 12 testers for 14 days before production] → Start the closed test as soon as a first build works; if the account is older or an organisation, skip
- [Families program review rejects something (e.g. a link out)] → No links out by spec; privacy page and Data safety form say "no data"
- [Lost upload key] → Play App Signing allows an upload key reset; keep a backup of the keystore in the password manager
- [Paid app on Play, free on itch.io and the web] → The user's choice; the listing does not mention the free web version
- [Play Console layout changes break the browser routine] → The checklist names fields by their label, not position; Claude reads the page each time
- [A console field resists automation (custom pickers, drag-and-drop)] → Claude names the field and asks the user to set it, then records it in the checklist
- [Headed Chromium screenshots differ from the Android WebView] → Same game code and assets; spot-check one screenshot against an `adb screencap` from the tablet
- [Gen projects drift from Tauri's templates on upgrades] → Upgrade Tauri deliberately, regenerate in a scratch folder and diff

## Migration Plan

- Nothing to migrate for existing players: web saves stay in the browser; the app starts a fresh save
- Rollback: halt the rollout in the Play Console; the web and itch.io versions are untouched

## Open Questions

- Price point: set in the Play Console at launch; does not change the build
- When to go to production: after the closed test, or wait for the last iteration (the listing can say "new zones coming")
