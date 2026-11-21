## MODIFIED Requirements

### Requirement: Twilight layout
Twilight SHALL be a tall open zone about 3 screens wide and 10 screens tall, generated from the world's seed like Midnight home, with Midnight home below it and an open passage at the top joining the Sunlit reef. Rock ledges on the side walls SHALL break up the shaft without blocking it.

#### Scenario: Open shaft
- **WHEN** the squid swims from the bottom to the top of Twilight
- **THEN** there is always a clear path, and it takes about a minute or less

## REMOVED Requirements

### Requirement: Top passage is one-way
**Reason**: The reef should be reachable by swimming, like every other zone; the giant squid's arm is no longer the only way in.
**Migration**: Replaced by "Top passage is open both ways".

## ADDED Requirements

### Requirement: Top passage is open both ways
The passage at the top of Twilight SHALL let the squid swim up into the Sunlit reef and down out of it freely, like the passage between Midnight home and Twilight, with no soft wall in either direction. The reef's light SHALL shimmer down through the passage, so the way up can be spotted from Twilight.

#### Scenario: Swimming up
- **WHEN** the squid swims up through the top passage of Twilight
- **THEN** it continues into the Sunlit reef

#### Scenario: Even dashing
- **WHEN** the squid dashes up through the top passage
- **THEN** it continues into the Sunlit reef, and nothing pushes it back

#### Scenario: Swimming down
- **WHEN** the squid swims down out of the Sunlit reef
- **THEN** it continues into the top of Twilight

#### Scenario: Seeing the way up
- **WHEN** the squid is near the top of Twilight
- **THEN** the reef's light shimmers down through the passage above it
