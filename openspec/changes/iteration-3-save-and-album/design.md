## Context

- Builds on the `WorldState` object introduced in iteration 2, which already holds lit plants, found friends and swarm size
- The HUD is plain DOM over the canvas; the album and parent corner follow the same approach

## Goals / Non-Goals

**Goals:**
- Saving that the child never notices and that cannot break play
- Album and parent corner usable by touch and by keyboard only

**Non-Goals:**
- No cloud saves, no multiple save slots
- No fun-fact voice-over on album pages (iteration 7)
- No cosmetics yet (iteration 5)

## Decisions

### `localStorage` with a versioned JSON blob
- One key, `vampire-squid-save`, holding `{ version, state }`; upgrade functions per version
- Writes are debounced (about 1 s) and forced on `visibilitychange` to hidden
- Alternative: IndexedDB (more complex, nothing gained for a few kilobytes)

### Stable ids for everything that is saved
- Plants, lanterns, starfish and friends get string ids in the level files, so reordering level data does not corrupt saves

### Album as a DOM overlay with pre-rendered friend pictures
- Friend pictures are the existing concept-art SVGs in `artwork/friends/`, imported as URLs
- Silhouettes are the same SVG with a dark fill filter
- Alternative: render live 3D models in the album (costly and unnecessary)

### Pause by stopping the logic step
- Opening the album or parent corner stops logic updates and audio ambience fades down; rendering continues so the background stays visible behind a dimmed layer

### Bubble ring and starfish are `.glb` models
- Both come from the Python model pipeline with animated parts (each bubble, each starfish arm); the pop's spray of tiny bubbles stays a code effect

### Long press with a visible fill
- The parent-corner control shows a ring filling during the 3-second hold, which reassures adults and means nothing to a child

## Risks / Trade-offs

- [Safari clears storage for sites not visited for weeks] → acceptable for a small home game; iteration 7's installable app keeps storage longer
- [Child finds the long press] → 3 seconds plus a confirmation step for reset
- [Save written mid-change corrupts state] → write the whole blob at once; validate on load and fall back to a new game

## Migration Plan

First version of the save format is `1`; there are no earlier saves to upgrade.
