## Purpose

The Sunlit reef is the bright, colourful party zone at the top of the world, where the dark-loving squid wears sunglasses and everything plays with colour.

## ADDED Requirements

### Requirement: Reef layout
The Sunlit reef SHALL be about 4 screens wide and 2 screens tall, directly above Twilight, generated from the world's seed, with a coral garden on the bottom and a shimmering water surface at the top that the squid cannot leave through. The squid SHALL arrive only on the giant squid's arm, and SHALL be able to leave by swimming down into Twilight.

#### Scenario: Leaving
- **WHEN** the squid swims down through the bottom passage of the reef
- **THEN** it continues into the top of Twilight

#### Scenario: Surface
- **WHEN** the squid swims up to the surface
- **THEN** the ending plays (see "Ending at the surface"), then the squid is gently eased back down with no penalty

### Requirement: Bright party mood
The reef SHALL be the brightest zone, using the full pastel palette, with light patterns dancing on the seabed and a cheerful ambient layer.

#### Scenario: Arriving
- **WHEN** the giant squid sets the squid down in the reef
- **THEN** the water becomes bright and colourful and the music becomes more cheerful

### Requirement: Corals change colour when touched
The reef SHALL contain coral clusters that switch to the next colour in a fixed cycle, with a soft chime, when the squid touches them or a pulse reaches them.

#### Scenario: Touching coral
- **WHEN** the squid swims into a coral cluster
- **THEN** the coral changes to the next colour and chimes

### Requirement: Sunglasses in the bright reef
When the squid enters the reef it SHALL put on a pair of sunglasses with a little flourish, and SHALL take them off when it leaves.

#### Scenario: Sunglasses on and off
- **WHEN** the squid arrives in the reef and later swims down into Twilight
- **THEN** sunglasses appear on entering and disappear on leaving

### Requirement: Reef extras
The reef SHALL contain five starfish and one bubble-ring chain, behaving as defined in `starfish` and `bubble-rings`.

#### Scenario: Album strip
- **WHEN** the album is opened
- **THEN** it shows a Sunlit reef strip with five starfish icons

### Requirement: Ending at the surface
Reaching the reef's surface, the top of the world, SHALL play the ending: shooting stars cross the screen and a win card in the centre shows the starfish found, as one strip of starfish icons per zone, lit for found ones, like the album. It SHALL use no text, pause play like the album, and close on tap, Space or Escape, after which the squid is eased back down into the reef and play goes on. Nothing SHALL be reset or lost. It SHALL play again on a later visit to the surface, but not until the squid has swum well away from it.

#### Scenario: First time at the surface
- **WHEN** the squid swims up to the reef's surface
- **THEN** shooting stars fly, the win card shows each zone's starfish, lit for found ones, and play pauses

#### Scenario: Closing the ending
- **WHEN** the player taps the screen while the ending shows
- **THEN** the card closes, the squid is back in the reef just below the surface, and everything found is kept

#### Scenario: Bumping the surface again
- **WHEN** the squid touches the surface again right after the ending closed
- **THEN** it is only eased back down; the ending plays again only after the squid has swum well away and come back
