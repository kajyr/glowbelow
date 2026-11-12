## Why

The Sunlit reef is the reward zone at the top of the world: bright, colourful and full of colour play. It completes the first version's four zones and five friends, and the cuttlefish's colour game is the natural place to add the first cosmetics.

Depends on: `iteration-5-whale-fall`.

## What Changes

- Sunlit reef at the top of Twilight: a bright pastel coral garden under a shimmering surface; Twilight's top passage opens
- Corals that change colour when touched
- Silly sunglasses that the squid puts on automatically in the bright reef (a vampire squid lives in the dark)
- Cuttlefish disguised as a coral that flickers the wrong colour; glowing reveals it, then a three-round colour-matching game that cannot be failed
- Glow colours as the first cosmetic: each finished colour game unlocks the colour shown and paints the squid's glow; colours can be switched by visiting the cuttlefish again
- The giant squid's arm ride now reaches the reef
- Five starfish and one bubble-ring chain in the reef

## Capabilities

### New Capabilities

- `sunlit-reef`: the reef zone, colour-changing corals and sunglasses
- `cuttlefish`: the disguised cuttlefish and its colour game
- `cosmetics`: unlockable looks for the squid, starting with glow colours

### Modified Capabilities

- `twilight`: the top passage opens to the Sunlit reef (new requirement)
- `glow-pulse`: the pulse and glow tips use the chosen glow colour (new requirement)

## Impact

- New level file and zone-graph entry above Twilight
- Uses `models/cuttlefish.glb` with colour shifting done in a shader, since the model's patches are fixed vertex colours
- New `tools/make_corals.py` and coral `.glb` models (five types, two sizes each), recoloured in the game by the same hue shift
- Squid materials gain a tint for the glow colour; a new `sunglasses.glb` attaches to the squid head
- Save format gains reef ids, unlocked colours and the selected colour
