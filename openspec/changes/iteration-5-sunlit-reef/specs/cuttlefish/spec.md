## Purpose

The cuttlefish is the reef's colour-changing show-off: hidden as a coral, revealed by glowing, and host of a gentle colour-matching game that paints the squid's glow.

## ADDED Requirements

### Requirement: Disguised as coral
Before it is found, the cuttlefish SHALL sit among the corals disguised as one, flickering a colour that does not match its neighbours every few seconds.

#### Scenario: Odd one out
- **WHEN** the player watches the coral garden
- **THEN** one "coral" now and then flickers a colour that doesn't match

### Requirement: Revealed by glowing
A glow pulse reaching the disguised cuttlefish SHALL reveal it: it changes back to its own colours, swims out with a flourish, plays its sound and sends a sticker to the album button.

#### Scenario: Reveal
- **WHEN** a pulse reaches the disguised cuttlefish for the first time
- **THEN** it swims out, plays its sound, and its sticker is added to the album

### Requirement: Colour game that cannot be failed
After being revealed, and each time the squid touches it afterwards, the cuttlefish SHALL play a three-round game: it shows a colour, and the player touches a coral of that colour. Touching a wrong coral SHALL only make the cuttlefish wiggle and keep showing the colour; there SHALL be no failure, timer or score.

#### Scenario: Right coral
- **WHEN** the cuttlefish shows pink and the squid touches a pink coral
- **THEN** the cuttlefish cheers and shows the next colour

#### Scenario: Wrong coral
- **WHEN** the cuttlefish shows pink and the squid touches a blue coral
- **THEN** the cuttlefish wiggles and keeps showing pink

### Requirement: The game paints the glow
Finishing the three rounds SHALL unlock the last colour shown as a glow colour and switch the squid's glow to it, as defined in `cosmetics`.

#### Scenario: Finishing
- **WHEN** the player finishes the third round on pink
- **THEN** pink is unlocked and the squid's glow turns pink

### Requirement: Changing colour
The cuttlefish SHALL visibly cycle through its colours while swimming, as a show-off.

#### Scenario: Show-off
- **WHEN** the player watches the revealed cuttlefish
- **THEN** its colours shift smoothly over time
