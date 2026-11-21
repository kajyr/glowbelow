# AGENTS.md

Glow Below: a peaceful low-poly 3D browser game (TypeScript, Vite, Three.js) for a 6-year-old.

## Source of truth

- `GAME_DESIGN.md` — what the game is; read the relevant section before any feature work
- `openspec/specs/` — current behaviour, one spec per capability
- `openspec/changes/` — planned and in-progress work; use the `opsx` skills to propose / apply / archive

## Commands

- Node 24 (`.nvmrc`)
- `npm test` — Vitest; run after every logic change
- `npm run build` — type-check + build; must pass before committing
- `npm run dev` — play at `localhost:5173`; `?seed=N` fixes the world, `?debug` exposes `window.game`
- `just release` — publish to itch.io; run after each archived iteration (needs `butler login`)
- itch.io page: text lives in `docs/itch/description.md`; after each release, update it to match the game, then apply it to the live page: paste description, AI statement and tags into the itch.io editor (the user does this by hand unless a browser tool is connected; the Claude in Chrome extension must be signed in to the same account)
- Dev blog: every iteration ends with a devlog post for itch.io in `docs/itch/devlog/YYYY-MM-DD-<slug>.md` (title, short what's-new, a screenshot or two, what's next); the user posts it by hand unless a browser tool is connected
- Versioning: every feature release (each iteration) bumps a minor; `just release` does it, then commit `package.json` + lockfile

### Android app (Google Play)

- Store app: Tauri 2 shell in `src-tauri/` around the `app` build (`npm run build:app`: no service worker, no links out); native bits in `src-tauri/gen/android/.../MainActivity.kt`
- Toolchain: Java 17, Android SDK + NDK (`~/Library/Android/sdk`), Rust Android targets; the `justfile` sets `JAVA_HOME`, `ANDROID_HOME`, `NDK_HOME` if the shell does not
- Try it: `npx tauri android build --apk --debug --target aarch64`, install with `adb install -r`; emulator `glow_tablet`
- `just release-android` — tests, then a signed App Bundle from the current version (run after `just release`)
- Upload key: `~/.config/glowbelow/upload.jks` + `keystore.properties` (or `GLOWBELOW_KEYSTORE`); never in git; the user keeps a copy in the password manager
- `npm run capture:store` — Play screenshots and feature graphic into `docs/play/`; add `-- --video` for the promo video (needs `ffmpeg`)
- Play listing and every console form answer: `docs/play/listing.md`
- After each iteration's release: refresh the media, upload the bundle to internal testing, update the listing, then ask the user before sending it for review (Claude does the console work in Chrome; the user only signs in, handles payments and agreements, and gives the go-ahead)

## Code layout

- `src/game/`, `src/levels/` — pure logic, no Three.js; tests sit next to the code as `*.test.ts` — add one for new logic
- `src/render/` — Three.js views that only read game state
- `src/main.ts` — wiring: fixed 60 Hz logic step, render every frame
- `src/target.ts` — which build this is (`isApp()`); `src/ui/appBridge.ts` — back button and keep-awake in the store app
- Tuning numbers live in `src/game/tuning.ts`, not inline
- UI strings go in `src/i18n/en.json` (Italian comes later)

## Models

- Every `.glb` in `models/` is generated: `python3 tools/make_<name>.py` (plain Python, no Blender)
- Never edit `.glb` files by hand; change the script and regenerate
- Shared helpers: `tools/lowpoly.py`; Midnight palette: `tools/midnight.py`
- Flat shading, vertex colours, no textures; keep triangle counts low (~500–800 per creature)
- Check a model in `tools/viewer.html?model=<name>` (serve the repo root, e.g. `python3 -m http.server 8765`)

## Design rules that must not break

- No game over, no timers, nothing lost for good, nothing scary
- No text needed to play: icons, sound and animation only
- Touch first (hit areas ≥ 64 px), arrow keys + Space fully supported
- Friends never gate progress: every zone can be reached by swimming (the giant squid's arm is an express lift, not a gate)

## Conventions

- Conventional commits with a scope: `feat(jelly): …`, `docs(openspec): …`
- Docs and specs: short bullets and tables, plain words
- Match the surrounding code's style and comment density
