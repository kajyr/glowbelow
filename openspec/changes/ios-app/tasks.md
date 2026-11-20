## 1. Accounts and tooling

- [ ] 1.1 User enrols in the Apple Developer Program, signs the Paid Apps agreement, and fills in tax and banking in App Store Connect (Claude navigates there and points at each step); verify the agreement shows as active
- [ ] 1.2 Add the Rust iOS targets and run `tauri ios init`; commit `src-tauri/gen/apple`, extend `.gitignore` (build outputs, `*.p8`); verify `npx tauri info` reports no missing iOS tools
- [ ] 1.3 Set the team ID in `tauri.conf.json` and run `tauri ios dev` on the simulator and a real iPad; verify the game loads all models and sounds with networking off on the first launch

## 2. iOS behaviour

- [ ] 2.1 Set landscape-only, hidden status bar and full-screen-required in `Info.plist`; verify on iPad and iPhone: no status bar, turns between landscape sides, no split view
- [ ] 2.2 Add the iOS side of the local plugin: home indicator auto-hide and deferred bottom-edge gesture; verify the indicator fades during play and one swipe up does not leave the app (or record the fallback)
- [ ] 2.3 Add keep-awake on iOS (`isIdleTimerDisabled`) behind the existing JS hooks; verify the iPad stays on past auto-lock during play and locks normally on the title screen
- [ ] 2.4 Set the audio session to ambient; verify the silent switch mutes the game, sound stops in the background and returns on resume with mute respected
- [ ] 2.5 Check the HUD on an iPhone with a Dynamic Island in both landscape sides; verify no control is under the island or the home indicator and hit areas stay ≥ 64 px
- [ ] 2.6 Measure frame rate on a base-model iPad during a big glow pulse with dumbo following; verify at or near 60 fps

## 3. Saves

- [ ] 3.1 Verify progress survives closing the app, a device restart, and installing a newer build over the old one (Xcode install, then TestFlight)

## 4. Signing and release command

- [ ] 4.1 After asking the user, Claude creates an App Store Connect API key in the browser, moves the `.p8` into `~/.config/glowbelow/` and sets key ID / issuer in environment variables; the user backs it up in the password manager; verify `ls ~/.config/glowbelow/` shows the key and the repo does not
- [ ] 4.2 Add `just release-ios`: `npm test`, credential check with a clear message, `tauri ios build --export-method app-store-connect --build-number $(git rev-list --count HEAD)`, upload with `xcrun altool`; verify the build appears in App Store Connect, and that without the key it stops before building
- [ ] 4.3 Verify the version: App Store Connect shows the `package.json` version and a build number higher than the previous upload
- [ ] 4.4 Add `PrivacyInfo.xcprivacy` (no tracking, no data collected, required-reason APIs found in the built app); verify App Store Connect reports no privacy manifest warnings on upload

## 5. Store listing

- [ ] 5.1 Write `docs/appstore/listing.md`: name, subtitle, promotional text, description, keywords, review notes about the parent corner and no account (in the voice of `docs/itch/description.md`), plus the form-answer checklist (age rating, Kids category 6–8, privacy label "Data Not Collected", policy link, paid, countries)
- [ ] 5.2 Extend `npm run capture:store` with the App Store set: landscape screenshots at the required iPad 13" and iPhone 6.9" sizes into `docs/appstore/`; verify sizes against Apple's list and one shot against a simulator capture
- [ ] 5.3 Add App Store preview videos to the capture (15–30 s, game sound, `ffmpeg` to Apple's preview specs, iPad and iPhone); verify they play in QuickTime with sound
- [ ] 5.4 Claude creates the app record in App Store Connect and fills listing, screenshots, previews, age rating, Kids category, privacy label, policy link, pricing and countries from the checklist; verify App Store Connect accepts the media and shows no missing items, and write any new answer back to `docs/appstore/listing.md`
- [ ] 5.5 Claude adds the user as a TestFlight internal tester for the first build; the user installs it on the iPad and plays from title to album offline; verify everything works
- [ ] 5.6 Claude fills the version page, selects the build and prepares the submission, then asks the user before submitting for review

## 6. Docs and release steps

- [ ] 6.1 Update `AGENTS.md`: iOS commands, `just release-ios`, App Store media in `npm run capture:store`, where keys live, and the "App Store update after each iteration" step (Claude refreshes media, uploads, fills the version page, asks before submitting)
- [ ] 6.2 Update `README.md` (how to build the iOS app) and `GAME_DESIGN.md` targets
- [ ] 6.3 Run `npm test`, `npm run build`, `npm run build:itch` and `just release-android` (dry run up to the bundle); verify web, itch.io and Android builds still work

## Workflow follow-up

- Release when the user decides (with the Android production launch or the last iteration): Claude releases the approved version only after the user's go-ahead
- Devlog post announcing the iOS app, per `AGENTS.md`
- Archive the change after release
