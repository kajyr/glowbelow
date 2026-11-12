## 1. Build

- [x] 1.1 Add `npm run build:itch` that zips the contents of `dist/` into `release/glowbelow-itch.zip`; verify `index.html` is at the top level and no path is absolute
- [x] 1.2 Add `release/` to `.gitignore`; verify the zip is not tracked

## 2. itch.io page

- [x] 2.1 Capture a cover image and at least three screenshots from the game; verify they meet itch.io's image sizes
- [x] 2.2 Write the short page description (peaceful, for young children, touch and keyboard, early version with more zones coming); verify it with the user
- [x] 2.3 The user creates the itch.io project as an HTML game, marked "In development", with the embed settings from the design (960×600, mobile friendly in landscape, fullscreen button, click to launch); verify the settings on the dashboard

## 3. Publishing

- [x] 3.1 The user runs `butler login` (`butler` and `just` are already installed); verify `butler status` works once the project exists
- [x] 3.2 Add a `justfile` with a `release` recipe (tests, `npm run build:itch`, `butler push` to the project's `html5` channel, target in one variable); verify `just --list` shows it, and the first `just release` appears on the dashboard and is marked playable in the browser
- [x] 3.3 Play the published page on a laptop and on a tablet, including fullscreen; verify keyboard and touch control, and that nothing scrolls the outer page
- [x] 3.4 Note `just release` in `AGENTS.md` and the README commands, to run after each archived iteration; verify both notes are there

## 4. Verification

- [x] 4.1 Run `npm test` and `npm run build`; verify both pass and the game's own address is unaffected
