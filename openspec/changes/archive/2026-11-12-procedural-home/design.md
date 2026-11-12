## Context

- `src/levels/level.ts` defines `Level` (bounds, camera bounds, ceilings, shaft, start, piece placements, plant spots, trails, cave, bubble vents) and `buildLevel`, which turns it into the collision world. `src/levels/midnightHome.ts` is a hand-written `Level`
- Colliders come from `src/levels/pieces.ts` (circles per piece, seabed height lines), scaled, mirrored and turned with each placement
- Seabed segments are 12 units wide and tile only end to end at height 0. The rock ceiling is seabed segments turned upside down, and the shaft is a gap between them
- A screen is about 11 units tall and 15–20 units wide (tablet 4:3 to laptop 16:9). The squid's radius is 0.55 and its width about 1.3; top speed is 4.5 units/s
- The cave model's side entrance is only about 1.9 units tall at its default scale
- `makeRng` (mulberry32) already exists in `src/game/rng.ts`
- `LocalLights` has 32 slots and today takes lights first come, first served

## Goals / Non-Goals

**Goals:**
- One generator that later zones reuse with their own recipe (Twilight next)
- Generation and validation are pure functions with no Three.js or DOM, tested over hundreds of seeds
- Same seed → identical `Level` on every device

**Non-Goals:**
- No saving of the seed (iteration 3); this change only keeps it for the session
- No new environment models unless layouts look repetitive in review
- No in-game way to pick or show a seed (only `?seed=`)

## Decisions

### Generate the existing `Level` shape
- `generateZone(recipe, seed): Level` returns the same data `buildLevel` already consumes, so collision, rendering, plants, sparkles, dumbo and the debug overlay need no changes
- Alternative: a new runtime level format (would touch every system for no gain)

### Recipe + constructive placement, then validate
- A recipe is plain data per zone: size, the landmarks and how many, counts and spacing for rocks, floating rocks and plants, which trails to lay, and the zone's mood
- Placement runs in a fixed order, each step avoiding what earlier steps reserved:
  1. Seabed: pick a segment variant and mirror for each 12-unit slot
  2. Ceiling: place it with the shaft gap at a random x in the middle 60% of the width
  3. Start spot: in the left or right quarter, mid-height
  4. Cave: 2–4 screens from the start (32–64 units), on the seabed, entrance facing the start
  5. Arch: on the seabed, not overlapping the cave or the start, with clearance to both
  6. Seabed rocks and floating rocks: Poisson-disc sampling, with minimum spacing and keep-out areas around landmarks, the shaft column and the start
  7. Decor rocks behind the play plane, with no colliders
  8. Plants: one per screen-sized cell first, so every part of the zone has some, then the rest on rock tops, arch, cave roof and floating rocks
  9. Trails
- Alternatives: noise-based terrain carving (needs new terrain models and much harder guarantees); wave function collapse (overkill for a side-on zone)

### Validate on a clearance grid
- Rasterise colliders, floor and ceiling onto a grid of 0.5-unit cells
- Two reachability fields, flood-filled from the start:
  - **wide**: obstacles grown by 1.3 units, so a free cell means a gap of at least two squid widths
  - **narrow**: obstacles grown by the squid's radius
- The rules become checks:
  - every plant's pulse point, the cave interior point and the top of the shaft are in **wide**
  - no **narrow** cell is more than 1.3 units from a **wide** cell (no pocket the squid can squeeze into that the wide corridors don't reach)
  - keep-out areas are empty
  - the cave distance is in range
- The same grid gives A* paths for trails and for the crossing-time and trail-length tests
- On a 0.5-unit grid a gap is only detected reliably from about 3.1 units (the middle of the gap can fall up to 0.25 off a cell centre), so rocks keep 3.4 units between their colliders and the cave is scaled 1.5×; the "two squid widths" rule is therefore checked with a margin
- Alternative: physics-based test swims (slow and flaky)

### Bigger cave in the recipe
- The recipe places the cave at a scale of 1.5 (tuned up from 1.35 to leave room for the grid margin), so its entrance (about 3.2 units) meets the two-squid-width rule. Its colliders scale with the placement, as for every piece
- Alternative: rebuild the cave model with a taller entrance (a model change, can come later)

### Trails from A* paths
- The trail to the cave runs from beside the start to just outside the cave entrance
- More trails run from the nearest point of an existing trail to the centre of each group of plants (plants grouped by screen columns) and to the bottom of the shaft
- Paths are smoothed and get a sparkle every 2.2 units, the same spacing as today

### Rejecting bad seeds
- `generateValidZone(recipe, seed)` tries `seed`, then seeds derived from it, up to 50 attempts, and returns the first layout that passes plus the seed used
- Tests require every one of 500 seeds to produce a valid layout within the attempts, and most on the first try
- Alternative: repairing a failed layout in place (harder to keep deterministic)

### Seed lifecycle
- At load, `main.ts` takes `?seed=` if present, otherwise a random 32-bit seed, and keeps it in one world object for the session
- `iteration-2-twilight`'s `WorldState` and `iteration-3-save-and-album`'s save will hold this seed. "Continue" regenerates the same world from it

### Local lights culled to the view
- Lights are collected as candidates each frame. `end()` keeps those within a margin of the camera view, with the squid and active pulses first and then the rest nearest to the view centre, up to 32 slots
- A light leaving the slots is always outside the view margin, so nothing visibly flickers

### Scaling
- About 128 × 44 units. The sparkle field already scales with area at the current density
- Pieces are instanced. Plants, rocks and sparkles grow in instance count only, and draw calls stay about the same

## Risks / Trade-offs

- [Layouts feel samey with only 3 seabed and 4 rock variants at 8 screens] → mirroring, scaling and turning pieces, decor rocks for depth; review a set of seeds and add variants if needed
- [A child gets lost in a bigger zone] → trails within two screens everywhere, dumbo pointing, plants in every screen-sized cell, the shaft's light visible from afar
- [Validator rules too strict, so many seeds fail] → measure the first-try pass rate in tests; loosen spacing in the recipe before loosening rules
- [Grid resolution misses thin gaps] → 0.5-unit cells against a 2.6-unit rule leaves margin; tests compare grid results with sampled collision checks
- [Floating-point differences across devices change layouts] → integer RNG and placement on a fixed grid of 0.05 units

## Migration Plan

- Replace the hand-written home with the recipe. Keep the old file's numbers (palette, plant scale, cave eye offset) in the recipe
- Nothing is saved yet, so there is no player data to migrate. Rollback is restoring the hand-written `MIDNIGHT_HOME`

## Open Questions

- Exact counts (seabed rocks, floating rocks), spacing and trail density: tune after looking at a dozen seeds

## Review notes (after implementation)

- Tuned: 6 seabed rocks (9 did not fit with 3.4-unit gaps), 20 seabed plants (45 in total), cave scale 1.5, upper floating band raised to 24–32
- Floating rocks are stratified into columns so every part of the water has a plant within a screen; the top band stays centred, lower bands zig-zag so the rocks do not form a grid
- Rocks keep the full rock gap from the side walls too: a 2-unit strip between a rock and a wall was the main source of "pocket" rejections
- Straight trail routes get a gentle wave where the water stays wide, so they look like drifting snow rather than ruler lines
- About 97% of seeds pass on the first try; rejections are rare pockets and no room for a hanging rock. Generation takes about 7 ms in tests and 16 ms in the browser
- Repetition seen across a dozen seeds: the seabed is nearly flat at this size (all three segments are low). Variety comes from rock placement; taller seabed variants or terrain steps would help later
- Found while reviewing: mirrored pieces rendered dark (an iteration 1 bug in instancing); fixed by giving mirrored placements their own mirrored mesh
