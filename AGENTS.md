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
- Versioning: every feature release (each iteration) bumps a minor; `just release` does it, then commit `package.json` + lockfile

## Code layout

- `src/game/`, `src/levels/` — pure logic, no Three.js; tests sit next to the code as `*.test.ts` — add one for new logic
- `src/render/` — Three.js views that only read game state
- `src/main.ts` — wiring: fixed 60 Hz logic step, render every frame
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
- Friends never gate progress

## Conventions

- Conventional commits with a scope: `feat(jelly): …`, `docs(openspec): …`
- Docs and specs: short bullets and tables, plain words
- Match the surrounding code's style and comment density
