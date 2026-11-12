## Context

- Builds on the `WorldState` object introduced in iteration 2. It is already serialisable (`toJSON`/`fromJSON`, `version: 1`) and holds the seed, lit ids (plants and lanterns), found friends, joined firefly groups and the dash unlock
- Zones are generated from a world seed (`procedural-home`): the save stores the seed, and things are stored by their generated ids (`plant-3`, `lantern-12`, `firefly-2`). Those ids come from generation order, so they are stable for a seed only while the generator is unchanged
- The game is re-published on itch.io after every iteration, and later iterations change world generation, so saves must outlive generator changes
- The mute choice is already remembered on its own (`glowbelow.muted`, from iteration 2)
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
- One key, `glowbelow.save`, holding `{ version, layout, state }`; upgrade functions per version
- Writes are debounced (about 1 s) and forced on `visibilitychange` to hidden
- Alternative: IndexedDB (more complex, nothing gained for a few kilobytes)

### Settings live apart from progress
- Mute (already `glowbelow.muted`) and the two volumes (`glowbelow.volume`) are settings, not progress: reset erases `glowbelow.save` only

### Generated ids, plus a layout version
- Plants, lanterns, firefly groups and starfish keep the ids the generator gives them; a test checks they are unique and identical across two generations from the same seed
- `layout` is a number in the code, bumped whenever a change alters what the generator produces for a seed
- On load with an older `layout`: keep found friends, joined groups, found starfish and the dash unlock (they do not depend on positions); drop lit ids, so zones glow again as they are relit
- Alternative: ids from positions (break on any nudge), or freezing the generator (blocks every later iteration)

### Album as a DOM overlay with pre-rendered friend pictures
- Friend pictures are the existing concept-art SVGs in `artwork/friends/`, imported as URLs
- Silhouettes are the same SVG with a dark fill filter
- Alternative: render live 3D models in the album (costly and unnecessary)

### Pause by stopping the logic step
- Opening the album or parent corner stops logic updates and audio ambience fades down; rendering continues so the background stays visible behind a dimmed layer

### Bubble ring and starfish are `.glb` models
- Both come from the Python model pipeline with animated parts (each bubble, each starfish arm); the pop's spray of tiny bubbles stays a code effect

### Collectibles come from the zone generator
- Bubble-ring chains and starfish are added to the Midnight home and Twilight recipes and placed from the seed, like lanterns and firefly groups
- The generator's rules check that every ring and starfish is reachable, over many seeds
- Adding them changes what a seed produces, so this iteration bumps `layout` to 2 (no saves exist yet, so nothing is lost)

### Storage detection for the itch.io frame
- The game is already published on itch.io (`itch-io-release`), where it runs in a frame on another domain and Safari may treat `localStorage` as third-party
- On start, a test write/read to `localStorage` inside try/catch; failure in a framed context sets `saveUnavailable`
- "Open full page" opens the game's own frame URL in a new tab, which is first-party there

### Long press with a visible fill
- The parent-corner control shows a ring filling during the 3-second hold, which reassures adults and means nothing to a child

## Risks / Trade-offs

- [Safari clears storage for sites not visited for weeks] → acceptable for a small home game; iteration 7's installable app keeps storage longer
- [Safari clears the itch.io frame's storage when quit] → the full-page option and the game's own address are the reliable way to keep progress
- [Child finds the long press] → 3 seconds plus a confirmation step for reset
- [Save written mid-change corrupts state] → write the whole blob at once; validate on load and fall back to a new game
- [A game update lays out the world differently] → the `layout` version: friends and starfish are kept, lit things are relit
- [Keyboard shortcuts clash with play] → album on B (A steers left), parent corner by holding P (Shift dashes)

## Migration Plan

First version of the save format is `1` with `layout: 2`; there are no earlier saves to upgrade. Later iterations that change generation bump `layout`.
