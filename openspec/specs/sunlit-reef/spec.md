# sunlit-reef Specification

## Purpose

The Sunlit reef is the bright, colourful party zone at the top of the world, where the dark-loving squid wears sunglasses and everything plays with colour.

## Requirements

### Requirement: Reef layout
The Sunlit reef SHALL be about 4 screens wide and 2 screens tall, directly above Twilight, generated from the world's seed, with a coral garden on the bottom and a shimmering water surface at the top that the squid cannot leave through. The squid SHALL arrive only on the giant squid's arm, and SHALL be able to leave by swimming down into Twilight.

#### Scenario: Leaving
- **WHEN** the squid swims down through the bottom passage of the reef
- **THEN** it continues into the top of Twilight

#### Scenario: Surface
- **WHEN** the squid swims up to the surface
- **THEN** it is gently eased back down with no penalty (inside the sunbeam, the ending plays first: see "Ending in the sunbeam")

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

### Requirement: Ending in the sunbeam
One sunbeam SHALL pour down through a gap in the reef's surface, the top of the world, well away from the cuttlefish's hiding place, shown by a warm column of light with sparkles rising up it. Swimming up into it SHALL complete the journey: the sticker album opens and a completed stamp, like one from a real rubber stamp, thumps down onto its page, as defined in `sticker-album`. Closing the album SHALL let the squid sink back into the reef and play go on. Nothing SHALL be reset or lost.

#### Scenario: Into the sunbeam
- **WHEN** the squid swims up into the sunbeam
- **THEN** the album opens and the completed stamp thumps onto the page

#### Scenario: Bumping the surface elsewhere
- **WHEN** the squid swims up to the surface anywhere but the sunbeam
- **THEN** it is only eased back down; the album does not open

#### Scenario: Swimming up again right away
- **WHEN** the squid swims back up into the sunbeam right after closing the album
- **THEN** it is only eased back down; it opens the album again only after the squid has swum well away and come back
