## Context

- After `android-app`: a Tauri 2 shell in `src-tauri/`, the `app` build target (no service worker, no links out), an `isApp()` helper, and a local keep-awake plugin with an Android side
- This Mac has Xcode and Rust; no Apple Developer Program membership yet
- The game already targets iPad Safari first: WebGL 2, Web Audio unlock on first tap, safe-area CSS for the home-screen PWA
- WKWebView is the same engine as Safari, so rendering and performance should match the PWA

## Goals / Non-Goals

**Goals:**
- Reuse the Android shell unchanged; iOS-only bits stay in `src-tauri/gen/apple`
- One command from `package.json` version to a build in App Store Connect

**Non-Goals:**
- No Mac Catalyst or visionOS build
- No CI build or fastlane: built and uploaded from this Mac; console work goes through the browser (see below)
- No Game Center, iCloud saves or haptics
- No change to the web, PWA, itch.io or Android builds
- Italian listing comes with or after `iteration-7-italian`

## Decisions

### iOS target in the same Tauri shell
- `tauri ios init` adds `src-tauri/gen/apple` (Xcode project, committed like `gen/android`)
- Same identifier as Android (`com.kajyr.glowbelow`, confirmed in `android-app`)
- Universal app (iPad + iPhone): the game already works on phones in landscape; iPad-only would give up iPhone families for no saving

### Orientation, status bar, home indicator
- `Info.plist`: landscape left/right only for iPhone and iPad, `UIStatusBarHidden`, `UIViewControllerBasedStatusBarAppearance` false, `UIRequiresFullScreen` (no split view, so the game always has the whole screen)
- Home indicator auto-hide and deferring the bottom-edge gesture need the root view controller to override `prefersHomeIndicatorAutoHidden` and `preferredScreenEdgesDeferringSystemGestures`
  - Tauri creates the root view controller itself, so these go in the local plugin's iOS side (Swift) at start-up
  - Fallback if they cannot be set: the indicator stays visible (allowed, slightly less tidy), noted in the listing check
- Notch / island: the page already uses `viewport-fit=cover` and `env(safe-area-inset-*)`; check the HUD on an iPhone with an island

### Keep-awake on iOS
- The local plugin's Swift side sets `UIApplication.shared.isIdleTimerDisabled`, called by the same JS hooks as Android
- No back button on iOS: the back hook is a no-op there

### Audio
- Set the audio session to `.ambient` so the game respects the silent switch and mixes with nothing else playing loud; matches how the PWA behaves in Safari
- Sound stops on background through the existing `visibilitychange` handling (WKWebView fires it)

### Version and build number
- Visible version (`CFBundleShortVersionString`) from `package.json` through `tauri.conf.json`
- Build number (`CFBundleVersion`) from `git rev-list --count HEAD`, passed with `--build-number`; it always grows, so a re-upload of the same version after a rejection is accepted
- Alternative: derive it from the version like Android: breaks when the same version needs a second upload

### Signing and upload
- Automatic signing in Xcode with the team ID set in `tauri.conf.json` (`bundle.iOS.developmentTeam`)
- App Store Connect API key (`.p8`) kept in `~/.config/glowbelow/`, key ID and issuer in environment variables; `.gitignore` covers `*.p8`
- `just release-ios`: `npm test`, credential check with a clear message, `tauri ios build --export-method app-store-connect --build-number …`, then `xcrun altool --upload-app` with the API key
- Fallback for upload: Apple's Transporter app with the same `.ipa`

### Privacy and Kids category
- `PrivacyInfo.xcprivacy` in the app: no tracking, no collected data types; declare required-reason APIs used by the shell (e.g. `UserDefaults`, file timestamps) after checking the built app
- Kids category rules met by the `native-app` spec: no links out, no data, no ads; nothing needs a parental gate
- Privacy policy: the same `privacy.html` page published with the web build by `android-app`

### Store paperwork in the repo
- `docs/appstore/listing.md`: name, subtitle, promotional text, description, keywords, age band, review notes (explains the long-press parent corner and that no account is needed), and every form answer (age rating, Kids category, privacy label, pricing, countries) as a checklist

### Store media: the same `npm run capture:store`
- `tools/capture_store.mjs` from `android-app` gains an App Store set: landscape screenshots at the required iPad 13" and iPhone 6.9" sizes, same staged scenes and seeds
- App previews: the same in-page recording (canvas + game audio), cut to 15–30 s and converted by `ffmpeg` to the preview specs (H.264, 30 fps, required resolution per device, stereo AAC)
- Uploaded straight to App Store Connect: no YouTube needed for iOS
- Spot-check one screenshot against a simulator capture (`xcrun simctl io booted screenshot`) to confirm it matches the app

### App Store Connect work: done by Claude in Chrome
- Claude drives the user's signed-in Chrome with the Claude in Chrome extension, working from the checklist in `docs/appstore/listing.md`
- Covers: app record, listing text, screenshots and previews, age rating, Kids category 6–8, privacy label and policy link, pricing and countries, TestFlight internal testers, choosing the build, review notes
- Creates the App Store Connect API key in the browser after asking the user, and moves the `.p8` straight into `~/.config/glowbelow/`
- Hand-offs to the user: Apple ID sign-in and two-factor codes, Developer Program enrolment and payment, Paid Apps agreement, tax and banking
- Every "submit for review" and "release" waits for the user's go-ahead in chat
- New or changed answers are written back to `docs/appstore/listing.md` after each session
- Alternative: App Store Connect API / fastlane `deliver` for metadata and media (scriptable, but the age rating, privacy label and agreements still need the web UI); can be added later

## Risks / Trade-offs

- [App Review guideline 4.2 "minimum functionality" for web-based apps] → The game is fully bundled, offline, full screen and native-feeling; review notes say so. If rejected, add the native touches Apple asks for
- [Kids category review is strict and slow] → No links, no data, no third-party SDKs; review notes explain the parent corner
- [Root view controller overrides are hard to reach from Tauri] → Fallback keeps the indicator visible; does not block release
- [Tauri iOS tooling breaks on an Xcode update] → Pin the Tauri CLI version; update Xcode and Tauri together, deliberately
- [App Store Connect layout changes or a field resists automation] → The checklist names fields by label; Claude names any stuck field and asks the user to set it
- [Preview video rejected for format] → `ffmpeg` settings follow Apple's app preview specs; App Store Connect reports the problem on upload, and Claude fixes it and uploads again
- [Annual 99 USD fee lapses] → The app is removed from sale; calendar reminder for renewal
- [WKWebView storage cleared] → App storage is not subject to Safari's 7-day clean-up; verified across updates in task group 3

## Migration Plan

- Nothing to migrate: web saves stay in Safari; the app starts a fresh save
- Rollback: remove the version from sale or pause phased release in App Store Connect; other builds are untouched

## Open Questions

- Price tier: set in App Store Connect at launch; does not change the build
- When to submit for review: with the Android production launch, or with the last iteration
