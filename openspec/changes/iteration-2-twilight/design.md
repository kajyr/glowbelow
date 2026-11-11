## Context

- Builds on the iteration 1 codebase: fixed-step loop, pure logic in `src/game/`, level data files in `src/levels/`, models split into animated parts

## Goals / Non-Goals

**Goals:**
- Move from one zone to a world of zones without rewriting the camera, level or friend code
- Keep 60 fps with about 30 instanced fireflies on screen

**Non-Goals:**
- No saving of world state between sessions (iteration 3)
- No streaming of distant zones; the whole world is small enough to keep in memory

## Decisions

### World = zone list + passages in one coordinate space
- Each zone keeps its own level file but is placed at an offset in one shared world space; passages are rectangles shared by two zones
- Camera clamps to the union of the zones overlapping the view
- Alternative: separate scenes with transitions (would break the "no loading screen" rule)

### Zone state lives in one world-state object
- Lit plants, lit lanterns, found friends and swarm size go into a single serialisable `WorldState`
- Iteration 3 saves this object as it is, so it is designed for that now

### Followers share one behaviour
- Dumbo's follow-and-catch-up logic is generalised into a follower behaviour used by dumbo and the swarm centre
- Swarm members are boids around the swarm centre; shapes are target points the boids steer to

### Nautilus as a path follower
- A vertical path with pause points; riding parents the squid to a seat point on the shell
- Input during a ride is read as "hop off" rather than steering

### Twilight pieces are `.glb` models
- Jellyfish lantern and 3 wall-ledge variants come from the Python model pipeline, like iteration 1's environment; light rays stay a code effect

### Dash as an impulse on the existing steering
- Adds a velocity impulse and a temporary higher top speed; swipe detection is a fast pointer move under ~150 ms

## Risks / Trade-offs

- [Swarm hides the squid] → swarm stays behind the squid's travel direction and renders smaller and dimmer than the squid
- [Riding feels like losing control] → any input hops off instantly
- [Swipe dash triggers by accident while steering] → require a fast, short swipe; tune in playtest

## Migration Plan

`midnight-home`'s closed shaft becomes an open passage; no saved data exists yet, so nothing else migrates.

## Open Questions

- Exact zone sizes and lantern count: tune in playtest
