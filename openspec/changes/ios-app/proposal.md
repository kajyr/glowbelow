## Why

iPads are the game's first target, and many families only install from the App Store. The web version on iPad works but needs "add to home screen", which few parents know about. An App Store release reaches them, plays offline from the first launch, and keeps progress safe from Safari's storage clean-up.

Depends on: `android-app` (reuses its Tauri app shell and the `native-app` capability; archive it first).

## What Changes

- iOS target added to the existing Tauri 2 shell (`src-tauri/gen/apple`, committed)
- Universal app: iPad first, iPhone also supported in landscape
- Landscape only, status bar hidden, home indicator auto-hidden, no accidental system gestures during play
- Signed build and upload to App Store Connect with one command (`just release-ios`), version following `package.json`
- TestFlight build checked on a real iPad before the first App Store release
- App Store listing: paid upfront, no ads, no in-app purchases, Kids category (ages 6–8), privacy label "Data Not Collected"
- Apple Developer Program enrolment, Paid Apps agreement, tax and banking set up
- Store text and form answers in `docs/appstore/`; reuses the privacy policy page from `android-app`
- Store media from the `android-app` capture command, extended to App Store sizes: iPad and iPhone screenshots and app preview videos with game sound
- Claude does the App Store Connect work in the user's signed-in Chrome (Claude in Chrome): app record, listing, questionnaires, privacy label, media, TestFlight, build selection. The user only signs in, enrols, signs agreements, sets up tax and banking, and approves anything that goes public
- `AGENTS.md` release steps updated so every iteration can also ship to the App Store

## Capabilities

### New Capabilities

- `ios-release`: building, signing and publishing the iOS app on the App Store, the listing, Kids category rules, and keeping it in step with the game

### Modified Capabilities

- `native-app`: iOS scenarios added to full screen and landscape (status bar, home indicator, notch)

## Impact

- New `src-tauri/gen/apple/` (Xcode project), small Info.plist / Swift tweaks there
- Build machine needs Xcode, Rust and the Rust iOS targets (Xcode and Rust already on this Mac)
- `justfile`: `release-ios` recipe; App Store Connect API key kept out of git
- New `docs/appstore/` (listing text, form answers, generated media)
- `tools/capture_store.mjs` (from `android-app`) gains App Store sizes and preview videos
- Needs the Claude in Chrome extension signed in to the user's Apple ID (App Store Connect)
- Costs: Apple Developer Program, 99 USD a year; store fees on each sale
- No change to web, PWA or itch.io behaviour
