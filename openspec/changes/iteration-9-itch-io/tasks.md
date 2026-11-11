## 1. Build

- [ ] 1.1 Add `VITE_TARGET=itch` handling that skips service worker registration, plus a framed-on-itch run-time check; verify no service worker is registered in the itch build
- [ ] 1.2 Add `npm run build:itch` that zips the contents of `dist/` into `release/vampire-squid-itch.zip`; verify `index.html` is at the top level and no path is absolute
- [ ] 1.3 Add `release/` to `.gitignore`; verify the zip is not tracked

## 2. Saving in a frame

- [ ] 2.1 Detect unavailable storage in a framed context; verify a Vitest test with a throwing storage stub
- [ ] 2.2 Show the "saving unavailable here" note with "open full page" in the parent corner only; verify it appears with blocked storage and not otherwise

## 3. itch.io page

- [ ] 3.1 Capture a cover image and at least three screenshots from the game; verify they meet itch.io's image sizes
- [ ] 3.2 Write the short page description (peaceful, for young children, touch and keyboard); verify it with the user
- [ ] 3.3 The user creates the itch.io project as an HTML game with the embed settings from the design (960×600, mobile friendly in landscape, fullscreen button, click to launch); verify the settings on the dashboard

## 4. Publishing

- [ ] 4.1 Install `butler`; the user runs `butler login`; verify `butler status` works
- [ ] 4.2 Add `npm run release:itch` that builds and runs `butler push` to the project's `html5` channel; verify the first push appears on the dashboard and is marked playable in the browser
- [ ] 4.3 Play the published page on a laptop and on a tablet, including fullscreen; verify keyboard and touch control, and that nothing scrolls the outer page

## 5. Verification

- [ ] 5.1 Play on itch.io in Safari on an iPad, close Safari, reopen; verify the game still works and, if progress was lost, that the parent-corner note appears
- [ ] 5.2 Run `npm test` and `npm run build`; verify both pass and the game's own address is unaffected
