## Context

- The repo has no game code yet: only `GAME_DESIGN.md`, concept art in `artwork/`, model scripts in `tools/` and six generated creature models in `models/*.glb`; environment models do not exist yet
- Models are single meshes with flat-shaded vertex colours and an emissive "Glow" material, written by `tools/lowpoly.py` (plain Python, no Blender)
- `tools/viewer.html` already loads the models with Three.js 0.160 and the lighting the game must match
- Target: tablet first (iPad Safari, Android Chrome) in landscape, laptop second; 60 fps on a mid-range tablet
- Behaviour is defined in this change's specs; this document only covers how

## Goals / Non-Goals

**Goals:**
- A codebase small enough to grow through 8 iterations without a rewrite
- Game logic (movement, meter, hints, pulse reach, dumbo behaviour) testable without a browser
- Reuse the existing model pipeline instead of introducing a second one

**Non-Goals:**
- No save system, no album screen, no settings screen (later iterations)
- No physics engine, no ECS framework, no UI framework
- No deployment pipeline; the demo is played from the dev server on the local network

## Decisions

### Stack: Vite + TypeScript + Three.js, no UI framework
- Matches `GAME_DESIGN.md` tech notes and the viewer, which already uses Three.js
- The HUD has three buttons and a few icons; plain DOM over the canvas is enough
- Alternatives: Babylon.js (heavier, nothing gained), a React HUD (dependency for three buttons)

### Models imported from `models/` with `?url`, not copied
- `vite.config.ts` adds `assetsInclude: ['**/*.glb']`; code imports `../models/squid.glb?url`
- Keeps `models/` as the single source the Python scripts write to
- Alternative: copy into `public/` (two copies that drift apart)

### Animated parts become separate nodes in the `.glb`
- The squid needs cape, ears and eyes to move independently; dumbo needs ears and skirt
- `tools/lowpoly.py` gains named parts: `Model.add(..., part="cape")`, and `write_glb` writes one node per part with its pivot at the attachment point
- Animation is then plain per-frame transforms in TypeScript (scale the cape for strokes and the pineapple pose, rotate ears, squash eyes to blink)
- Alternatives: skeletal rig (needs hand work or a rigging tool), vertex-shader deformation by region (harder to tune and debug)

### Environment pieces are `.glb` models too
- Rocks, seabed, arch, cave and glow plants are made with the same Python pipeline as the creatures (`tools/make_*.py` → `models/*.glb`, refined by rendering in `tools/viewer.html`), so the whole game shares one look and one workflow
- Pieces: 4 rock variants, 3 seabed segments that tile end to end, the arch, the cave, the glow plant with its petals as separate parts so the bloom can be animated, and the sparkle star
- Rule for every iteration: anything with a shape is a `.glb`; only effects stay in code (pulse ring, drifting particles, bubbles, light rays)
- The level file places pieces by name with position, scale, rotation and mirror; the game loads each `.glb` once and draws repeats with `InstancedMesh`
- Collision shapes are not read from the models: each piece has a collider (circles, or a height-line for seabed segments) defined in `src/levels/pieces.ts`, scaled with the placement
- Alternative: generating these at load time in TypeScript (faster layout iteration, but a second modelling style and no viewer preview)

### Plain modules with a fixed update order, logic separated from rendering
- `src/game/` holds pure logic with no Three.js imports: `steering.ts`, `glowMeter.ts`, `pulse.ts`, `hints.ts`, `dumboBrain.ts`, `sparkleField.ts`
- `src/render/` maps logic state to Three.js objects; `src/ui/` holds the DOM HUD; `src/audio/` the synth
- `main.ts` runs one loop: input → logic → render → audio, with a fixed 60 Hz logic step and an accumulator
- Alternatives: an ECS library (overkill for ~50 entities), logic inside Three.js objects (untestable)

### 2D collision on the play plane
- The squid moves in x/y; z is fixed. Obstacles are circles and a seabed height-line in a level data file
- Soft walls: penetration produces a push proportional to depth, not a hard stop; zone edges are the same soft push
- Alternative: a physics engine (not needed, and makes "never stuck" harder to guarantee)

### Level as data
- `src/levels/midnightHome.ts` lists rocks, arch, cave, plants, sparkle trails, the shaft and zone bounds in world units
- Later iterations add zones as more files of the same shape

### Bloom by brightness threshold
- `UnrealBloomPass` at half resolution with a high threshold; the scene is dark, so only emissive things (glow tips, sparkles, lit plants, pulses) bloom
- Alternative: true selective bloom with two render passes (costs too much on a tablet)
- Drop to no bloom automatically if the frame time stays above budget

### Input unified through Pointer Events plus keyboard
- One steering target: pointer position while held, or a direction from keys; the last used input decides hint icons
- `touch-action: none`, `user-select: none`, `overscroll-behavior: none`, and `preventDefault` on arrows/Space during play

### Audio synthesised with Web Audio, no sound files
- Notes, chimes, whoom and the pad are oscillators and filtered noise; dumbo's flute is a sine with vibrato
- Zero download size and easy tuning; real recordings can replace individual sounds later
- The `AudioContext` is created on the title-screen interaction

### Embeddable from the start (for itch.io later)
- `vite.config.ts` sets `base: './'` so the build works from any folder or zip, as itch.io requires
- The canvas sizes to its container with a `ResizeObserver`, not to `window.screen`; the portrait check uses the container's aspect ratio
- The title-screen tap focuses the game, so keyboard input works inside an iframe
- Cheap now, and avoids reworking paths and sizing when the game is published to itch.io in iteration 9

### Strings in `src/i18n/en.json` from day one
- Only the title and accessibility labels have text in this iteration; Italian arrives in iteration 6

### Testing
- Vitest for `src/game/**` (steering never stalls at corners, meter fill counts, pulse reach and cooldown, hint timers, dumbo pointing target)
- A manual playtest checklist in `tasks.md` run on a real tablet over the local network (`vite --host`) and a laptop

## Risks / Trade-offs

- [Bloom too slow on older tablets] → half-resolution pass, automatic fallback to no bloom, emissive colours still bright without it
- [Splitting models into parts changes `lowpoly.py` output] → keep the single-mesh output when no parts are named, re-run all six scripts, re-check them in `tools/viewer.html`
- [Touch steering feels twitchy for a 6-year-old] → dead zone around the squid and tuning constants in one file; the first real playtest decides
- [iOS Safari audio quirks] → create and resume the context only inside the first user gesture; mute state also suspends the context
- [Colliders drift from the model shapes] → the debug overlay draws colliders over the models; check each piece once when it is added
- [Seabed segments show seams] → segments share identical edge profiles and colours at their ends

## Migration Plan

Greenfield; nothing to migrate. Rollback is deleting the new files.

## Open Questions

- Game name for the title screen: keep a working title string in `en.json` until the name is decided; changing it is a one-line edit
- Exact tuning values (speeds, pickup radius, pulse reach, hint delays): start from the specs' numbers and adjust after the first playtest
