# Proposal

## Why

- The giant squid's arm always lifts the squid to the very top of the world (the Sunlit reef landing)
- A child who wakes it early skips Twilight entirely: the firefly swarm, the nautilus and the dash unlock are all flown past
- The lift should open the world one step at a time: take the squid to the next place it hasn't been, not straight to the end

## What Changes

- The ride sets the squid down at the **first unexplored zone on the way up**:
  - Twilight not reached yet → set down just inside Twilight's bottom entry
  - Twilight already reached → set down at the Sunlit reef landing (as today)
- "Reached Twilight" reuses the saved flag that already records it (dash unlocks the first time the squid reaches Twilight), so old saves behave right with no migration
- Hopping off, sinking back home and riding again stay as they are
- The Sunlit reef is still reachable only on the arm; Twilight is only ever an extra first stop, never a new gate

## Capabilities

### New Capabilities

- none

### Modified Capabilities

- `giant-squid`: "The way up" sets the squid down at the first unexplored zone (Twilight, then the Sunlit reef) instead of always at the top of the world

## Impact

- `src/levels/assembleWorld.ts`: `ridePath` takes a destination; world exposes a Twilight drop-off point
- `src/game/giantSquid.ts`: picks the destination at boarding and rebuilds its carrier when the destination changes
- `src/main.ts`: passes the destination choice (from `worldState.dashUnlocked`) and pre-computes the path that will be needed
- Tests: `giantSquid.test.ts`, `assembleWorld.test.ts`
- Docs: `GAME_DESIGN.md` giant squid lines ("all the way up to the reef")
