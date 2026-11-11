## Why

After the demo, the game needs a second place to go so it becomes a world rather than a room. Twilight is the zone directly above home, and its two friends (the firefly swarm and the nautilus) are the simplest to build after dumbo. This iteration also opens the shaft that the demo keeps closed.

Depends on: `iteration-1-playable-demo`.

## What Changes

- Connected world: Midnight home's shaft opens into Twilight; the camera and zone loading work across zones
- Twilight zone: a tall open blue-to-lavender shaft (about 2 screens wide, 4 tall) with jellyfish lanterns to light
- Firefly squid: five small groups scattered in Twilight; glowing near a group adds it to a swarm that trails the squid and forms bigger shapes as it grows
- Nautilus: cruises slowly up and down the shaft; touching its shell makes the squid ride it as a lift
- Dash: an optional burst of speed (double-tap, swipe or Shift), useful in the tall shaft
- Each new friend's discovery sends a sticker to the album button, like dumbo

## Capabilities

### New Capabilities

- `zone-travel`: a connected world of several zones, moving between them by swimming, camera and loading across zone borders
- `twilight`: the Twilight zone layout, jellyfish lanterns and mood
- `firefly-squid`: firefly groups, joining the swarm, swarm shapes
- `nautilus`: the cruising nautilus and riding it

### Modified Capabilities

- `squid-swimming`: adds the optional dash (new requirement only)
- `midnight-home`: the shaft opens to Twilight instead of turning the squid back (new requirement replacing the demo's closed shaft)

## Impact

- New level file for Twilight, new zone-graph data
- Uses `models/firefly-squid.glb` and `models/nautilus.glb` (parts tagged for animation, as done for the squid in iteration 1)
- Swarm rendered with instancing (about 30 fireflies)
- New model scripts and `.glb` files for the jellyfish lantern and wall ledges
- No new dependencies expected
