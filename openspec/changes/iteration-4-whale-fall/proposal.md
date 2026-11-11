## Why

The giant squid is the game's big "wow" friend, and Whale fall gives the world a second zone at the bottom, beside home, with a musical landmark. Building it before the reef lets the giant squid's lift be built first and then simply connected once the reef exists.

Depends on: `iteration-3-save-and-album`.

## What Changes

- Whale fall zone to the left of Midnight home: a whale skeleton to swim through, bone-white and soft blue
- The skeleton's ribs play a note each when reached by a glow, like a xylophone, and stay softly lit
- Giant squid asleep behind the whale skull; a big (full-meter) glow wakes it, and it gets an album page
- Once awake, the giant squid offers an arm to ride as an express lift; until the reef exists it lifts the squid to the top of Twilight
- Starfish (five) and one bubble-ring chain in Whale fall, following iteration 3's rules

## Capabilities

### New Capabilities

- `whale-fall`: the Whale fall zone, the skeleton and its musical ribs
- `giant-squid`: the sleeping giant squid, waking it, and riding its arm

### Modified Capabilities

- `midnight-home`: a passage on the left side leading to Whale fall (new requirement)

## Impact

- New level file and zone-graph entry for Whale fall
- Uses `models/giant-squid.glb` (parts tagged for animation) at several times the squid's size
- New model scripts and `.glb` files for the whale skeleton (ribs as named parts) and a small set-dressing fish
- New album page and saved state for the giant squid, ribs and Whale fall starfish
