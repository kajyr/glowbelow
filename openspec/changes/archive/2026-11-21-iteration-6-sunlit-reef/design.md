## Context

- Zone graph, zone generation, the carrier behaviour (giant squid arm), album pages and saving exist from earlier iterations
- The giant squid's ride already targets "top of the world" from the zone graph
- The cuttlefish model's colour patches are fixed vertex colours, so colour change must happen at render time
- The album is one page with nothing to turn; the colour picker sits at its bottom, beside the starfish strips, in two rows of three dots (under the strips, a 64 px row leaves no room for the stamps on a phone in landscape)

## Goals / Non-Goals

**Goals:**
- Colour change for the cuttlefish and corals without new models per colour
- A cosmetics system that can later hold hats and fin shapes without redesign

**Non-Goals:**
- No hats or fin shapes yet; only glow colours and the automatic sunglasses
- No credits, score or "the end" screen that stops play; the ending is a stamp in the album and play goes on

## Decisions

### The reef is reached only on the giant squid's arm
- Agreed exception to "friends never gate progress" (recorded in iteration 5)
- Twilight's top passage is one-way: a soft wall going up, open going down, so the squid can always leave the reef by swimming
- The giant squid's ride passes through the passage and sets the squid down in the reef
- The reef's light and shimmer show through the passage from below, as a hint

### One-way passage as a lid
- Twilight's top passage keeps its soft push, and gets a lid at the reef's seabed height
- The lid holds the squid from below (no dash gets through); a squid that came down from the reef passes it, until it is well below
- The reef's surface is a soft push too, like a closed shaft

### The reef is a generated zone
- A recipe like Twilight's and Whale fall's: coral garden along the bottom, surface soft wall, five starfish, one bubble-ring chain, the cuttlefish's spot among the corals
- Extra rule: a clear landing spot where the ride sets the squid down, and a clear way down to the passage

### Coral colours as a tint; the cuttlefish's as a hue shift
- Corals are built pale and neutral; each instance gets its colour as the instance colour, which multiplies the vertex colours, so every coral shows the exact colour of the cycle
- The cuttlefish keeps its own patterned vertex colours; a small `onBeforeCompile` patch rotates their hue by a uniform for its colour cycling
- Alternative: rotate every coral's hue from one base colour (rejected: hues land near, not on, the cycle's colours)

### Corals are `.glb` models from the Python pipeline
- `tools/make_corals.py` writes 5 coral types: branching, fan, brain, tube cluster and soft mushroom, each in 2 sizes
- Each coral is built in a neutral base colour so its tint can be any colour in the cycle; the cuttlefish's disguise uses the same coral shapes
- Placed by the reef generator with `InstancedMesh`, packed edge to edge across the seabed
- Circles per coral type in `src/levels/pieces.ts`, like the other environment pieces, but as touch areas: corals are not solid, the squid brushes past in front of them
- Why not solid: a packed solid garden leaves slots the squid can squeeze into but not leave comfortably (the generator's pocket rule), and the colour game asks for many touches

### Glow colour as one shared uniform
- The squid's glow-tip material, the pulse ring and the HUD read one `glowColor` value from state

### Cosmetics as a list of unlockable items
- `cosmetics: { unlocked: string[], equipped: { glow: string } }` in the save; future slots (hat, fins) are new keys under `equipped`

### Colour game as a small state machine
- States: idle → showing(colour, round) → cheering → done; wrong touches stay in showing; no timers
- A touched coral is judged by its colour before the touch: a right coral flashes and keeps its colour; a wrong one steps to its next colour, so tapping it again always reaches the right one
- The colour shown is always one on a coral near the cuttlefish, preferring colours not unlocked yet

### The ending in the sunbeam
- One sunbeam pours through a gap in the surface, placed by the generator well away from the cuttlefish and the landing spot; swimming up into it completes the journey
- The rest of the surface is only a soft wall: looking for the cuttlefish near the top never ends the game by accident (the first version used the whole surface and was too easy to bump into)
- Drawn with normal blending (warm column, a glowing gap, rising sparkles): added light vanishes in the bright water
- Completing opens the album, where a completed stamp thumps onto the page and stays (the first version had its own win card with shooting stars; the album is the game's one goal, so the end belongs there)
- The stamp is an inline SVG: double ring, star, the word on an arc, roughened with an SVG noise filter for a rubber-stamp look; it is stamped over the left of the starfish strips, covering no creature
- Saved as `completed` in the world state; the sunbeam opens the album again only after the squid has swum well away

### Sunglasses as an attachable node
- `sunglasses.glb` from `tools/make_sunglasses.py`, parented to the squid head node, toggled by the current zone with a scale-in flourish

## Risks / Trade-offs

- [Too bright for the dark-zone palette and bloom settings] → per-zone exposure and bloom threshold
- [Colour names unknown to the child] → the game never uses colour names; it shows the colour itself

## Migration Plan

Save format version 1 → 2 adds the reef's coral colours and `cosmetics` with teal unlocked and equipped. The cuttlefish being found uses the existing found-friends list.
