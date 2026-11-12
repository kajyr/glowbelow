## 1. Installable and offline

- [x] 1.1 Add `vite-plugin-pwa` with the manifest (name, landscape, full screen, icons drawn from the squid art); verify the manifest is valid in browser dev tools
- [x] 1.2 Precache the whole build including `.glb` and voice files; verify the game loads with the network disabled after one visit
- [x] 1.3 Make new versions activate only on the next launch; verify by publishing two builds in a row and checking play is not interrupted
- [ ] 1.4 Add `VITE_TARGET=itch` to `build:itch` to skip service worker registration, plus a framed-on-itch run-time check; verify no service worker is registered in the itch build or on the itch.io page

## 2. Publishing

- [ ] 2.1 Add a build-and-publish workflow for GitHub Pages (or the user's chosen static host); verify the site loads over HTTPS
- [ ] 2.2 Install to an iPad home screen and launch in airplane mode; verify full-screen offline play

## 3. Fun facts

- [x] 3.1 Write one true fun fact in `en.json` for each friend that can be found today; verify every found-able friend has a `facts.<friend>` key
- [ ] 3.2 Implement fact playback: recording if present, else `speechSynthesis` in the chosen language, stopped on close, page turn and mute; verify each case
- [ ] 3.3 Add the speaker icon to found friends' album pages; verify it plays the fact and is absent on silhouette pages

## 4. Verification

- [x] 4.1 Run `npm test` and `npm run build`; verify both pass
