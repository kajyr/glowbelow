## Why

A tablet game for a child should start instantly, work without Wi-Fi (car, holiday) and be launchable from the home screen like an app. The album pages also need their spoken fun facts, since the player cannot read them. Both arrive once all content and both languages exist.

Depends on: `iteration-6-italian`.

## What Changes

- The game is published as a static site and can be installed to the home screen
- After the first visit, the game works fully offline, including all models and sounds
- Updates are picked up on the next launch without interrupting play
- The itch.io build registers no service worker; offline install stays on the game's own address
- Each friend's album page gains a spoken fun fact, played by tapping a speaker icon, in the chosen language
- Fun facts use recorded voice files where provided (for example recorded by a parent), and the device's speech voice otherwise

## Capabilities

### New Capabilities

- `offline-play`: installable app, offline caching and safe updates
- `fun-facts`: one spoken fun fact per friend in each language

### Modified Capabilities

- `sticker-album`: friend pages get a speaker icon for the fun fact (new requirement)

## Impact

- Web app manifest, icons and a service worker (via `vite-plugin-pwa`)
- Static hosting setup (for example GitHub Pages or Netlify) with HTTPS
- `src/i18n/*.json` gain fun-fact texts; optional voice files under `public/voice/<lang>/`
- New dependency: `vite-plugin-pwa`
