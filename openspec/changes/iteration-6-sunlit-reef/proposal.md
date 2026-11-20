## Why

The Sunlit reef is the reward zone at the top of the world: bright, colourful and full of colour play. It completes the first version's four zones and five friends, and the cuttlefish's colour game is the natural place to add the first cosmetics. As the top of the world, its surface is where the journey ends (issue #2).

Depends on: `iteration-5-whale-fall` (archived).

## What Changes

- Sunlit reef at the top of Twilight: a bright pastel coral garden under a shimmering surface, generated from the seed like the other zones
- The giant squid's arm is the only way into the reef; Twilight's top passage becomes one-way, so the squid can swim down out of the reef but not up into it
- From the top of Twilight, the reef's light shimmers through the passage, so the child knows something is up there
- Corals that change colour when touched
- Silly sunglasses that the squid puts on automatically in the bright reef (a vampire squid lives in the dark)
- Cuttlefish disguised as a coral that flickers the wrong colour; glowing reveals it, then a three-round colour-matching game that cannot be failed
- Glow colours as the first cosmetic: each finished colour game unlocks the colour shown and paints the squid's glow; colours can be switched by visiting the cuttlefish again
- Five starfish and one bubble-ring chain in the reef
- A game ending at the reef's surface: a win card in the centre with shooting stars and the starfish found, then play goes on (issue #2)

## Capabilities

### New Capabilities

- `sunlit-reef`: the reef zone, colour-changing corals, sunglasses and the ending at the surface
- `cuttlefish`: the disguised cuttlefish and its colour game
- `cosmetics`: unlockable looks for the squid, starting with glow colours

### Modified Capabilities

- `twilight`: the top passage becomes one-way, down from the reef only (replaces "Top passage closed until the reef exists"; layout wording updated)
- `giant-squid`: the ride ends in the reef, the only way in (modified "The way up")
- `glow-pulse`: the pulse and glow tips use the chosen glow colour (new requirement)
- `sticker-album`: a glow-colour row at the bottom of the one album page
- `save-progress`: the save also holds the coral colours, unlocked glow colours and the chosen one

## Impact

- New reef recipe and generator in `src/levels/` and a zone-graph entry above Twilight
- One-way passage: open going down, a soft wall going up
- Uses `models/cuttlefish.glb` with colour shifting done in a shader, since the model's patches are fixed vertex colours
- New `tools/make_corals.py` and coral `.glb` models (five types, two sizes each), recoloured in the game by the same hue shift
- Squid materials gain a tint for the glow colour; a new `sunglasses.glb` attaches to the squid head
- An ending overlay (shooting stars, starfish icons) in the HUD layer, no text
- Save format version 1 → 2 gains coral colours, unlocked colours and the selected colour (the cuttlefish uses the existing found-friends list)
