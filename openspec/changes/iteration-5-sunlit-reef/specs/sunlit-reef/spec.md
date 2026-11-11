## Purpose

The Sunlit reef is the bright, colourful party zone at the top of the world, where the dark-loving squid wears sunglasses and everything plays with colour.

## ADDED Requirements

### Requirement: Reef layout
The Sunlit reef SHALL be about 4 screens wide and 2 screens tall, directly above Twilight, with a coral garden on the bottom and a shimmering water surface at the top that the squid cannot leave through.

#### Scenario: Surface
- **WHEN** the squid swims up to the surface
- **THEN** it is gently eased back down with no penalty

### Requirement: Bright party mood
The reef SHALL be the brightest zone, using the full pastel palette, with light patterns dancing on the seabed and a cheerful ambient layer.

#### Scenario: Arriving
- **WHEN** the squid enters the reef from Twilight
- **THEN** the water becomes bright and colourful and the music becomes more cheerful

### Requirement: Corals change colour when touched
The reef SHALL contain coral clusters that switch to the next colour in a fixed cycle, with a soft chime, when the squid touches them or a pulse reaches them.

#### Scenario: Touching coral
- **WHEN** the squid swims into a coral cluster
- **THEN** the coral changes to the next colour and chimes

### Requirement: Sunglasses in the bright reef
When the squid enters the reef it SHALL put on a pair of sunglasses with a little flourish, and SHALL take them off when it leaves.

#### Scenario: Sunglasses on and off
- **WHEN** the squid swims from Twilight into the reef and back
- **THEN** sunglasses appear on entering and disappear on leaving

### Requirement: Reef extras
The reef SHALL contain five starfish and one bubble-ring chain, behaving as defined in `starfish` and `bubble-rings`.

#### Scenario: Album row
- **WHEN** the album's starfish page is opened
- **THEN** it shows a row for the Sunlit reef with five starfish
