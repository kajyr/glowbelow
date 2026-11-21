## 1. Tooling and shell

- [x] 1.1 Confirm the app identifier with the user (`com.kajyr.glowbelow` proposed; permanent once published) and note it in `design.md`
- [x] 1.2 Install Android Studio, SDK, NDK and Java 17; add the Rust Android targets; verify `npx tauri info` reports no missing Android tools
- [x] 1.3 Add `@tauri-apps/cli` as a dev dependency and run `tauri init` into `src-tauri/` (`frontendDist: ../dist`, `beforeBuildCommand: npm run build:app`, version from `../package.json`); verify `npm run build` still passes
- [x] 1.4 Run `tauri android init`, commit `src-tauri/gen/android`, extend `.gitignore` (build outputs, `*.jks`, `keystore.properties`); verify `git status` shows no build output

## 2. App build target

- [x] 2.1 Add `build:app` (`VITE_TARGET=app`), disable the PWA plugin for `app` in `vite.config.ts`, add `app` to `src/env.d.ts`; verify `dist/` has no `sw.js` or manifest after `npm run build:app`
- [x] 2.2 Make `offlineAllowed` return false for `app`, with a test in `src/pwa.test.ts`; verify `npm test` passes
- [x] 2.3 Add an `isApp()` helper and hide the parent corner's "open full page" in the app; add a test that the option never shows for `app`
- [ ] 2.4 Run `tauri android dev` on an emulator and a real Android tablet; verify the game loads all models and sounds with networking off on the first launch
- [ ] 2.5 Measure frame rate on a mid-range Android tablet during a big glow pulse with dumbo following; verify at or near 60 fps, or record what to tune

## 3. Android behaviour

- [ ] 3.1 Lock to `sensorLandscape` and hide system bars (transient by swipe) in the generated activity; verify on the tablet: no bars, turns between landscape sides, bars hide again after a swipe
- [x] 3.2 Check safe areas on a phone with a camera cut-out; verify no HUD control is covered and hit areas stay ≥ 64 px
- [x] 3.3 Add a pure "what does back close?" function in `src/game/` with tests (album open → close album; parent corner open → close it; otherwise → nothing)
- [x] 3.4 Wire back in `MainActivity`: ask the page, else `moveTaskToBack(true)`; verify back closes the album, and back during play resumes in place with progress saved
- [x] 3.5 Add the local keep-awake Tauri plugin (Android: `FLAG_KEEP_SCREEN_ON`) and call it on play, clearing it in the parent corner and on the title screen; verify the screen stays on past the timeout during play and dims on the title screen
- [x] 3.6 Check sound on background and screen lock; if `visibilitychange` does not fire, dispatch it from `onPause`/`onResume`; verify silence in the background and sound back on return, with mute respected
- [x] 3.7 Verify saves: progress survives closing the app, a device restart, and installing a newer build over the old one

## 4. Signing and release command

- [ ] 4.1 Create the upload keystore outside the repo, back it up in the password manager, and wire the Gradle signing config to read it from `~/.config/glowbelow/` and environment variables
- [x] 4.2 Add `just release-android`: `npm test`, key check with a clear message, `tauri android build --aab`; verify a signed `.aab` is produced, and that without the key it stops before building
- [x] 4.3 Verify the version: after a test bump, the bundle's `versionName` matches `package.json` and `versionCode` is higher; revert the bump

## 5. Store listing and paperwork

- [ ] 5.1 Write `public/privacy.html` (no data collected, nothing leaves the device, contact address chosen by the user); verify it is published on GitHub Pages and reachable from a phone
- [ ] 5.2 Write `docs/play/listing.md`: title, short and full description, category, tags (in the plain voice of `docs/itch/description.md`), plus the form-answer checklist (Families ages 5–8, content rating, Data safety: nothing collected or shared, no ads, no login, paid, countries)
- [x] 5.3 Add Playwright and `tools/capture_store.mjs` (`npm run capture:store`): staged scenes from fixed seeds via `window.game`, at least four landscape screenshots per required device set; verify two runs give the same scenes and sizes pass Play's limits
- [x] 5.4 Capture the 1024×500 feature graphic in the same script; verify size and that the title reads at phone size
- [x] 5.5 Add the debug-only capture helper (canvas + game audio into one recording) with a scripted 20–30 s swim, and an `ffmpeg` step to a 1080p mp4; verify the video has sound, no HUD, and plays in QuickTime
- [ ] 5.6 Upload the video unlisted to the user's YouTube channel through Claude in Chrome; verify the link plays logged out
- [ ] 5.7 User sets up the Play payments profile (bank, tax) and accepts any agreements; Claude then creates the app as paid and fills listing, media, Families, content rating, Data safety, ads, app access, pricing and countries from the checklist; verify the console's dashboard shows no missing setup items, and write any new answer back to `docs/play/listing.md`
- [ ] 5.8 Claude uploads the first bundle to internal testing with release notes; the user installs it from Play on the tablet and plays from title to album; verify everything works offline
- [ ] 5.9 If the account needs a closed test before production (12 testers, 14 days): the user gives tester emails, Claude sets up the track and asks before starting it; note the dates in `docs/play/listing.md`

## 6. Docs and release steps

- [x] 6.1 Update `AGENTS.md`: Android commands, `just release-android`, `npm run capture:store`, where keys live, and the "Play update after each iteration" step (Claude refreshes media, uploads, fills the release, asks before sending for review)
- [x] 6.2 Update `GAME_DESIGN.md` tech notes (targets and hosting) and `README.md` (how to build the Android app)
- [x] 6.3 Run `npm test`, `npm run build` and `npm run build:itch`; verify web and itch.io builds are unchanged (service worker present on web, absent on itch)

## Workflow follow-up

- Promote to production when the user decides (after the closed test, or with the last iteration): Claude prepares the production release and sends it for review only after the user's go-ahead
- Archive this change before applying `ios-app`, so `native-app` exists in `openspec/specs/`
- Devlog post announcing the Android app, per `AGENTS.md`
