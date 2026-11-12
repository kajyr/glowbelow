## Why

The first version has four zones and five friends. The design keeps two more zones and five more friends for later, each waiting on something (a mechanic, a model or a zone) that now exists or can be added. This iteration builds them all so the world and the album are complete.

Depends on: `iteration-7-italian`.

## What Changes

- Five new friend models generated with the existing script workflow (`tools/make_*.py`): bobtail squid, coconut octopus, glass squid, mimic octopus, blanket octopus
- Vent garden: a warm, bubbly zone to the right of Midnight home, with bubble currents and tube worms
- Shipwreck: a sunken ship to the right of Twilight, with rooms to peek into
- Currents: visible streams of bubbles that carry the squid along, used in Vent garden and by the blanket octopus
- Bobtail squid in Vent garden: hides in the sand and digs up buried shells when glowed near
- Coconut octopus in the Shipwreck: collects the shells the squid brings and builds a shell house with them (shells are given, never spent or lost)
- Glass squid in Twilight: invisible except while lit by a glow, for a game of hide and seek
- Mimic octopus in the Sunlit reef: disguised as other things; find it three times
- Blanket octopus in open water above the Shipwreck: invites the squid to ride a long current with it
- Each new friend gets an album page, fun fact (both languages) and sticker; each new zone gets five starfish and a bubble-ring chain

## Capabilities

### New Capabilities

- `vent-garden`: the Vent garden zone
- `shipwreck`: the Shipwreck zone
- `currents`: bubble currents that carry the squid
- `bobtail-squid`: the sand-hiding friend that digs up shells
- `coconut-octopus`: the shell-house builder
- `glass-squid`: the hide-and-seek friend visible only in glow light
- `mimic-octopus`: the disguise friend found three times
- `blanket-octopus`: the friend that rides a long current with the squid

### Modified Capabilities

- `midnight-home`: a passage on the right side leading to Vent garden (new requirement)
- `twilight`: a side passage leading to the Shipwreck (new requirement)

## Impact

- Five new friend model scripts and `.glb` files, refined by rendering in `tools/viewer.html` as done for the first six
- New environment model scripts and `.glb` files: vents, tube worms, sand mound, shell, shell house, shipwreck and ship lantern
- Two new level files; zone graph extended to six zones
- Save format gains new zones, friends and shells
- New strings and fun facts in `en.json` and `it.json`; new files added to the offline precache
- The glass squid needs a transparent material, which is new to the renderer
