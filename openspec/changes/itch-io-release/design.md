## Context

- itch.io hosts HTML5 games as an uploaded zip with `index.html` at the top level, served inside an iframe on a separate domain; filenames are case-sensitive
- Iteration 1 already builds with relative paths, sizes to its container and takes focus on the first tap, so the game runs in a frame
- The current demo has no saving and no service worker, so the itch.io frame's storage rules do not matter yet; iterations 3 and 7 handle them when they add those features

## Goals / Non-Goals

**Goals:**
- One command to build and one to publish
- Publish the demo early and keep the itch.io version in step with each archived iteration
- The itch.io version never breaks

**Non-Goals:**
- No itch.io API integration (accounts, achievements)
- No paid version or downloads; browser play only

## Decisions

### Itch build is the normal build, zipped
- `npm run build:itch` runs the normal build, then zips the contents of `dist/` (not the folder) into `release/glowbelow-itch.zip`
- Iteration 7 adds a `VITE_TARGET=itch` flag to this script to skip the service worker

### Publishing with `butler`
- `butler push release/glowbelow-itch.zip <user>/<game>:html5` uploads only what changed and keeps version history
- Credentials stay on the user's machine (`butler login`); nothing is committed
- Alternative: manual upload in the itch.io dashboard (fine for the first release, tedious after)

### `just release` as the one release command
- A `justfile` at the repo root with a `release` recipe: runs `npm test`, then `npm run build:itch`, then the `butler push`
- The `butler` target is a variable at the top of the `justfile`, the only place it appears
- `npm` scripts stay for building and testing; `just` holds release steps, which are shell commands rather than Node
- Alternative: an `npm run release:itch` script (works, but chains shell commands awkwardly)

### Release after each iteration
- After an iteration is archived, `just release` pushes the new version; the same channel is updated, so the page link never changes
- The page stays marked "In development" until the last planned iteration ships

### Embed settings on the itch.io page
- Viewport 960×600 (landscape), "mobile friendly" on with landscape orientation, fullscreen button on, "click to launch" on so audio starts from a user gesture

## Risks / Trade-offs

- [Players expect more than one zone] → the page says it is an early version with more zones coming
- [itch.io changes its embed behaviour] → the game needs no itch-specific code to run
- [Upload limits] → the build is a few megabytes, far below itch.io's limits

## Migration Plan

None: the itch.io page is new. The game's own address is unaffected.

## Open Questions

- itch.io project URL: the title is "Glow Below"; the URL is chosen when the user creates the page, and only the `butler` target variable in the `justfile` depends on it
