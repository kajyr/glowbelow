## Context

- The game is a Vite static build with no server code; models are `.glb` files and audio is synthesised, so the download is small
- Progress is in `localStorage`, which a service worker does not touch

## Goals / Non-Goals

**Goals:**
- Offline play and home-screen install with minimal custom code
- Voice recordings optional, so the feature works before any are made

**Non-Goals:**
- No app-store packaging
- No push notifications or background sync

## Decisions

### `vite-plugin-pwa` with precaching
- Generates the manifest and a Workbox service worker that precaches the whole build, including `.glb` and voice files
- `registerType: 'prompt'`-style flow handled silently: the new worker waits and activates on the next launch
- Alternative: a hand-written service worker (more code to get caching and updates right)

### No service worker in the itch.io build
- `npm run build:itch` (from `itch-io-release`) sets `VITE_TARGET=itch`, which skips service worker registration; offline install belongs to the game's own address
- Safety net at run time: no registration when the page is framed by an itch domain

### Static hosting on GitHub Pages
- Free HTTPS hosting from the repository with a build-and-publish workflow
- Alternative: Netlify (equally fine; choose whichever the user already uses)

### Fun facts: text in language files, audio optional
- Text keys `facts.<friend>` in `en.json` now, `it.json` from `iteration-7-italian`; recordings at `public/voice/<lang>/<friend>.mp3`
- At run time, check the precache manifest for the recording; fall back to `speechSynthesis` with the matching language voice

## Risks / Trade-offs

- [iOS speech voices vary in quality] → recordings take priority; the fallback is acceptable for missing ones
- [Precache too large with voice files] → short mono recordings, well under the 5 MB budget
- [A broken update cached on devices] → the service worker only activates on the next launch, and the previous version stays cached until then

## Migration Plan

Adding a service worker to an existing site: first visit after deploy installs it; nothing to migrate in saves.
