## Context

- Six zones' worth of infrastructure exists: zone graph, carriers, followers, pulses, saving, album, i18n, offline precache
- Concept sketches for all five friends exist in `artwork/friends-later/`; no models yet
- The model workflow is: Python script → `.glb` → render in `tools/viewer.html` → refine until it matches the sketch

## Goals / Non-Goals

**Goals:**
- Add content without new core systems, except currents and a transparent material
- Keep each new friend's behaviour a small state machine like the existing ones

**Non-Goals:**
- No mild challenges (shadows, grumpy fish); they stay deferred
- No further zones beyond these two

## Decisions

### World layout
- Vent garden right of Midnight home; Shipwreck right of Twilight, halfway up; blanket octopus in open water inside the Shipwreck zone's upper part
- Keeps the stack readable: deep zones along the bottom row, Twilight and the Shipwreck in the middle, the reef on top

### Currents as carriers along a spline
- Reuse the carrier behaviour (path + release on input) with a spline path and no seat; bubbles are instanced particles moving along the spline

### Glass squid: transparent material lit by the pulse
- A transparent, depth-write-off material whose opacity is driven by the pulse light at its position; eyes stay opaque
- Rendered after opaque objects; only one instance, so sorting cost is negligible

### New environment pieces are `.glb` models
- Vents, tube-worm cluster, sand mound, shell, shell house (each shell slot a part), shipwreck (rooms as parts) and ship lantern come from the Python model pipeline; bubble columns and current bubbles stay code effects

### Mimic disguises reuse existing models
- The three disguises are `rock-1.glb`, `starfish.glb` and `small-fish.glb` with googly-eye parts added at run time; the mimic's own model is shown only when revealed
- Disguise starfish is not registered as a starfish id

### Shells as saved inventory
- `shells: { dug: string[], carried: number, given: number }`; ids per mound so digging is saved

### Coconut octopus departs from "trades shells for stickers"
- `GAME_DESIGN.md` says it trades; trading conflicts with "nothing is ever lost or spent", so shells are given to build a house instead

## Risks / Trade-offs

- [Five models is the biggest modelling job so far] → one model per session using the render-and-refine loop
- [Transparency artefacts on tablets] → single transparent object, no overlapping transparent layers
- [Too many friends crowding the screen as followers] → only dumbo and the swarm follow everywhere; the bobtail squid follows only inside Vent garden

## Migration Plan

Save version bump adds the two zones, five friends and shells, all as not found.
