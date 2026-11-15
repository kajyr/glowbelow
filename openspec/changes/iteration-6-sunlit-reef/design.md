## Context

- Zone graph, zone generation, the carrier behaviour (giant squid arm), album pages and saving exist from earlier iterations
- The giant squid's ride already targets "top of the world" from the zone graph
- The cuttlefish model's colour patches are fixed vertex colours, so colour change must happen at render time
- The album gains a squid page in this iteration to hold the colour picker

## Goals / Non-Goals

**Goals:**
- Colour change for the cuttlefish and corals without new models per colour
- A cosmetics system that can later hold hats and fin shapes without redesign

**Non-Goals:**
- No hats or fin shapes yet; only glow colours and the automatic sunglasses

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

### Sunglasses as an attachable node
- `sunglasses.glb` from `tools/make_sunglasses.py`, parented to the squid head node, toggled by the current zone with a scale-in flourish

## Risks / Trade-offs

- [Too bright for the dark-zone palette and bloom settings] → per-zone exposure and bloom threshold
- [Colour names unknown to the child] → the game never uses colour names; it shows the colour itself

## Migration Plan

Save format version 2 → 3 adds reef ids and `cosmetics` with teal unlocked and equipped.
