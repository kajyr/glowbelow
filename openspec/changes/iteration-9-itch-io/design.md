## Context

- itch.io hosts HTML5 games as an uploaded zip with `index.html` at the top level, served inside an iframe on a separate domain; filenames are case-sensitive
- Iteration 1 already builds with relative paths, sizes to its container and takes focus on the first tap, so the game runs in a frame
- Browsers, Safari in particular, may treat storage inside that frame as third-party: it can be blocked or cleared, and IndexedDB may be unavailable
- Saving (iteration 3) already falls back to playing without saving when storage fails

## Goals / Non-Goals

**Goals:**
- One command to build and one to publish
- The itch.io version never breaks; at worst it does not save

**Non-Goals:**
- No itch.io API integration (accounts, achievements)
- No paid version or downloads; browser play only

## Decisions

### Separate itch build mode
- `npm run build:itch` runs the normal build with `VITE_TARGET=itch`, which skips service worker registration, then zips `dist/` contents (not the folder) into `release/vampire-squid-itch.zip`
- Alternative: detect itch.io at run time only (still done as a safety net by checking whether the page is framed by an itch domain)

### Publishing with `butler`
- `butler push release/vampire-squid-itch.zip <user>/<game>:html5` uploads only what changed and keeps version history
- Credentials stay on the user's machine (`butler login`); nothing is committed
- Alternative: manual upload in the itch.io dashboard (fine for the first release, tedious after)

### Embed settings on the itch.io page
- Viewport 960×600 (landscape), "mobile friendly" on with landscape orientation, fullscreen button on, "click to launch" on so audio starts from a user gesture

### Storage detection for the parent-corner note
- On start, a test write/read to `localStorage` inside try/catch; failure in a framed context sets `saveUnavailable`
- "Open full page" opens the game's own frame URL in a new tab, which is first-party there

## Risks / Trade-offs

- [Safari clears frame storage when quit] → documented on the itch page; the full-page option and the game's own address are the reliable way to keep progress
- [itch.io changes its embed behaviour] → the game already tolerates missing storage and needs no itch-specific code to run
- [Upload limits] → the build is a few megabytes, far below itch.io's limits

## Migration Plan

None: the itch.io page is new. The game's own address is unaffected.

## Open Questions

- Final itch.io project name and URL: chosen when the user creates the page; only the `butler` target string depends on it
