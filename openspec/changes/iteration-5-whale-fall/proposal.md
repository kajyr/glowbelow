## Why

The giant squid is the game's big "wow" friend, and Whale fall gives the world a second zone at the bottom, beside home, with a musical landmark. The giant squid is also the way up: its arm carries the squid to the next zone, and once the Sunlit reef exists (iteration 6) it is the only way into the reef.

Depends on: `iteration-3-save-and-album`.

## What Changes

- Whale fall zone to the left of Midnight home, at home's seabed level: a whale skeleton to swim through, bone-white and soft blue
- Whale fall is generated from the seed like home and Twilight; the skeleton and the giant squid are fixed anchors the generator places around
- About 4 screens wide and 3 tall: a side room, shorter than home
- The skeleton's ribs play a note each when reached by a glow, like a xylophone, and stay softly lit
- Whale song: lighting every rib plays a soft whale song, the whole skeleton glows, sparkles burst out and the glow meter fills (just what is needed to wake the giant squid)
- Giant squid asleep behind the whale skull; a big (full-meter) glow wakes it, and it gets an album page and a fun fact (text only; the speaker icon stays hidden until `voice-recordings`)
- Once awake, the giant squid offers an arm and carries the squid up to the top of the world: the top of Twilight for now, the Sunlit reef from iteration 6
- The arm ride is the game's first ride, built as a shared carrier behaviour
- Starfish (five) and one bubble-ring chain in Whale fall, following iteration 3's rules
- Save format version 1 → 2

### The reef gate (agreed exception)

- "Friends never gate progress" gets one exception: the giant squid is the only way up into the Sunlit reef
- Nobody gets stuck: waking needs only a full glow meter, which cannot be failed; the whale song fills the meter; dumbo points at the sleeping giant squid

### Not in this change

- The game ending (issue #2)

## Capabilities

### New Capabilities

- `whale-fall`: the Whale fall zone, the skeleton, its musical ribs and the whale song
- `giant-squid`: the sleeping giant squid, waking it, and riding its arm up

### Modified Capabilities

- `midnight-home`: a passage on the left side, near the seabed, leading to Whale fall (new requirement)
- `zone-generation`: a Whale fall recipe and its rules (new requirement)
- `dumbo-octopus`: in Whale fall, dumbo points at unlit ribs, then at the sleeping giant squid (new requirement)
- `save-progress`: lit ribs, the whale song and the giant squid's awake state are saved (modified "What is saved")

## Impact

- New Whale fall recipe and generator in `src/levels/`, and a zone-graph entry left of home
- New `src/game/carrier.ts`: a path, a seat point, hop-off on input
- Uses `models/giant-squid.glb` (parts tagged for animation) at several times the squid's size
- New model scripts and `.glb` files for the whale skeleton (ribs as named parts) and a small set-dressing fish
- New album page and saved state for the giant squid, ribs and Whale fall starfish
- `AGENTS.md` and `GAME_DESIGN.md` record the giant squid exception
