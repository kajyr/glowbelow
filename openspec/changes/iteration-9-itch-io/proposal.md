## Why

Besides its own address, the game should be published on itch.io so others can find and play it. itch.io runs HTML5 games from an uploaded zip inside an iframe on its own domain, which affects saving and offline play, so publishing there needs a few adjustments on top of the finished game.

Depends on: `iteration-8-later-friends-and-zones`. Iteration 1 already makes the build embeddable (relative paths, container sizing, iframe keyboard focus), so nothing earlier needs to wait for this.

## What Changes

- A build command that produces an itch.io-ready zip with `index.html` at the top level
- An upload pipeline using itch.io's `butler` tool, so updates are one command
- The itch.io game page: title, cover, screenshots, short description, tags, embed size, mobile-friendly and fullscreen settings
- Embedded-mode behaviour: no service worker when running inside itch.io, since offline install belongs to the game's own address
- Saving inside the itch.io frame: Safari may block or clear storage there, so the game keeps playing without saving, and the parent corner offers to open the game full page, where saving works reliably

## Capabilities

### New Capabilities

- `itch-io-release`: the itch.io build, upload and page setup

### Modified Capabilities

- `offline-play`: the service worker is not registered when the game runs embedded on itch.io (new requirement)
- `parent-corner`: offers "open full page" when saving is unavailable in an embedded frame (new requirement)

## Impact

- New `npm run build:itch` script and a `butler` push step (manual or CI)
- An itch.io account and project page, created by the user
- Screenshots and a cover image made from the game
- No change to game content
