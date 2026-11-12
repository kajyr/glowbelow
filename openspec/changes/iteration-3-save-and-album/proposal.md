## Why

With two zones and three friends, a session's progress is worth keeping, and the album button that has collected stickers since the demo needs to open. This iteration adds saving, the sticker album, the parent corner and the two extra collectibles (bubble rings and starfish) whose rewards live in the album.

Depends on: `iteration-2-twilight`.

## What Changes

- Progress is saved automatically in the browser; the title screen continues where the player left off
- The album opens from the album button: one page per friend found (picture, name, the friend's sound on tap) and a starfish counter per zone
- A parent corner behind a long-press: reset progress, volume, (language arrives in iteration 6), and "open full page" when the itch.io frame blocks saving
- Bubble rings: chains of bubble rings in Midnight home and Twilight to swim through for a whoosh of speed and a rising run of notes
- Starfish: about five shy starfish per zone that light up and wave when glowed near; found ones are counted in the album

## Capabilities

### New Capabilities

- `save-progress`: automatic saving and loading of world state in the browser
- `sticker-album`: the album screen and its pages
- `parent-corner`: the hidden adult settings panel
- `bubble-rings`: swim-through rings and chains
- `starfish`: hidden starfish found by glowing

### Modified Capabilities

- `game-shell`: the title screen continues saved progress (new requirement)
- `dumbo-octopus`: tapping the album button opens the album instead of only wiggling (new requirement)

## Impact

- `WorldState` from iteration 2 gains a version number and is written to `localStorage`
- The world seed (from `procedural-home`) is saved with it; "continue" regenerates the same world from that seed, and only a new game draws a new seed
- New DOM screens (album, parent corner) navigable by touch and by arrows + Space/Enter
- Two new model scripts and `.glb` files (bubble ring, starfish)
- No new dependencies expected
