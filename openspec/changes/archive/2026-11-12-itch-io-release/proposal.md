## Why

The game should be published on itch.io so others can find and play it. Rather than wait for the finished game, the playable Midnight home demo goes up now as an early version, and each later iteration is pushed as an update once it is archived.

No dependencies: iteration 1 already makes the build embeddable (relative paths, container sizing, iframe keyboard focus), which is all the demo needs to run inside itch.io's frame.

## What Changes

- A build command that produces an itch.io-ready zip with `index.html` at the top level
- A `justfile` with a `release` recipe that builds the zip and uploads it with itch.io's `butler` tool, so updates are one command
- The itch.io game page: title, cover, screenshots, short description, tags, embed size, mobile-friendly and fullscreen settings, marked as in development
- A release step after each later iteration, so the published version follows the game

Handled by the iterations that add the features they adjust:

- Saving inside the itch.io frame (Safari may block it; the parent corner offers "open full page"): `iteration-3-save-and-album`
- No service worker when embedded on itch.io: `iteration-7-offline-and-voice`

## Capabilities

### New Capabilities

- `itch-io-release`: the itch.io build, upload, page setup and re-release after each iteration

### Modified Capabilities

None.

## Impact

- New `npm run build:itch` script and a `justfile` with a `release` recipe; uses `just` and `butler`, both installed on the user's machine
- An itch.io account and project page, created by the user
- Screenshots and a cover image made from the game
- No change to game content
