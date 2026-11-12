## Why

After the demo, the game needs a second place to go so it becomes a world rather than a room. Twilight is the zone directly above home, and its two friends (the firefly swarm and the nautilus) are the simplest to build after dumbo. This iteration also opens the shaft that the demo keeps closed.

Depends on: `iteration-1-playable-demo` (archived).

## What Changes

- Connected world: Midnight home's shaft opens into Twilight; the camera, lighting and mood work across zones with no loading
- Twilight zone: a tall open blue-to-lavender shaft (about 3 screens wide, 10 tall, sized like the bigger generated home) with about 30 jellyfish lanterns that light up, stay lit and brighten the zone like home's plants, with an all-lit celebration
- Sparkles drift in Twilight too, so the glow meter can be filled there
- Firefly squid: five small groups scattered in Twilight; glowing near a group adds it to a swarm that trails the squid and forms bigger shapes as it grows
- Nautilus: cruises slowly up and down the shaft shedding a trail of sparkles behind its shell; found by touching it, comes toward the squid when it glows. It is not ridden: Twilight is short enough to swim, and riding would take control away from the player
- Dash: an optional burst of speed from a dash button (tablet) or Shift (keyboard)
- Friends that point at unlit things (dumbo, the firefly arrow) also point at unlit lanterns
- Each new friend's discovery sends its own sticker to the album button, like dumbo

## Capabilities

### New Capabilities

- `zone-travel`: a connected world of several zones, moving between them by swimming, camera, lighting and mood across zone borders
- `twilight`: the Twilight zone layout, sparkles, jellyfish lanterns, mood and celebration
- `firefly-squid`: firefly groups, joining the swarm, swarm shapes
- `nautilus`: the cruising nautilus, its sparkle trail, finding it and calling it

### Modified Capabilities

- `squid-swimming`: adds the optional dash and its button (new requirements only)
- `midnight-home`: the demo's closed shaft is removed and replaced by an open passage into Twilight

## Impact

- A Twilight recipe for the zone generator from `procedural-home`, new world/zone data and a `WorldState` object (saved in iteration 3)
- The phantom jelly stays in Midnight home only
- Uses `models/firefly-squid.glb` and `models/nautilus.glb` (parts tagged for animation, as done for the squid in iteration 1)
- Swarm rendered with instancing (about 30 fireflies)
- New model scripts and `.glb` files for the jellyfish lantern and wall ledges
- Sticker art for the firefly and the nautilus; a dash button in the HUD
- No new dependencies expected
- Note for `iteration-4-whale-fall`: it plans to have the squid ride the giant squid's arm. The same objections to riding apply there, so that plan should be revisited before iteration 4 is built
