## Context

- Zone graph, zone generation, the carrier behaviour (giant squid arm), album pages and saving exist from earlier iterations
- The giant squid's ride already targets "top of the world" from the zone graph
- The cuttlefish model's colour patches are fixed vertex colours, so colour change must happen at render time
- The album is one page with nothing to turn; the colour picker is a row at its bottom, under the starfish strips

## Goals / Non-Goals

**Goals:**
- Colour change for the cuttlefish and corals without new models per colour
- A cosmetics system that can later hold hats and fin shapes without redesign

**Non-Goals:**
- No hats or fin shapes yet; only glow colours and the automatic sunglasses
- No credits, score or "the end" screen that stops play; the ending is a celebration and play goes on

## Decisions

### The reef is reached only on the giant squid's arm
- Agreed exception to "friends never gate progress" (recorded in iteration 5)
- Twilight's top passage is one-way: a soft wall going up, open going down, so the squid can always leave the reef by swimming
- The giant squid's ride passes through the passage and sets the squid down in the reef
- The reef's light and shimmer show through the passage from below, as a hint

### The reef is a generated zone
- A recipe like Twilight's and Whale fall's: coral garden along the bottom, surface soft wall, five starfish, one bubble-ring chain, the cuttlefish's spot among the corals
- Extra rule: a clear landing spot where the ride sets the squid down, and a clear way down to the passage

### Hue shift in a material patch
- The cuttlefish and coral materials get a small `onBeforeCompile` patch that rotates vertex-colour hue by a uniform; the cuttlefish disguise and cycling animate that uniform
- Alternative: swap whole vertex-colour arrays per colour (more memory, abrupt switches)

### Corals are `.glb` models from the Python pipeline
- `tools/make_corals.py` writes 5 coral types: branching, fan, brain, tube cluster and soft mushroom, each in 2 sizes
- Each coral is built in a neutral base colour so the hue-shift patch can turn it into any colour in the cycle; the cuttlefish's disguise uses the same coral shapes
- Placed by the reef generator with `InstancedMesh`, with per-instance hue so one model gives many colours
- Colliders per coral type in `src/levels/pieces.ts`, like the other environment pieces

### Glow colour as one shared uniform
- The squid's glow-tip material, the pulse ring and the HUD read one `glowColor` value from state

### Cosmetics as a list of unlockable items
- `cosmetics: { unlocked: string[], equipped: { glow: string } }` in the save; future slots (hat, fins) are new keys under `equipped`

### Colour game as a small state machine
- States: idle → showing(colour, round) → cheering → done; wrong touches stay in showing; no timers
- A touched coral is judged by its colour before the touch: a right coral flashes and keeps its colour; a wrong one steps to its next colour, so tapping it again always reaches the right one
- The colour shown is always one on a coral near the cuttlefish, preferring colours not unlocked yet

### The ending at the reef's surface
- Reaching the surface soft wall triggers the ending, instead of only easing the squid back
- A centre overlay: shooting stars across the screen, then a row of starfish icons per zone (lit for found), the same strips as the album, so the count needs no reading
- Pauses play like the album; tap, Space or Escape closes it, and the squid is eased back down into the reef
- It can trigger again (the count may have grown), but only after the squid has swum well away from the surface, so bumping the surface does not repeat it
- Alternative: a one-time ending saved in the save (rejected: the child would miss it if a grown-up was watching the first time)

### Sunglasses as an attachable node
- `sunglasses.glb` from `tools/make_sunglasses.py`, parented to the squid head node, toggled by the current zone with a scale-in flourish

## Risks / Trade-offs

- [Too bright for the dark-zone palette and bloom settings] → per-zone exposure and bloom threshold
- [Colour names unknown to the child] → the game never uses colour names; it shows the colour itself

## Migration Plan

Save format version 1 → 2 adds the reef's coral colours and `cosmetics` with teal unlocked and equipped. The cuttlefish being found uses the existing found-friends list.
