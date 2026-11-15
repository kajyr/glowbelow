## MODIFIED Requirements

### Requirement: Twilight layout
Twilight SHALL be a tall open zone about 3 screens wide and 10 screens tall, generated from the world's seed like Midnight home, with Midnight home below it and a one-way passage at the top joining the Sunlit reef. Rock ledges on the side walls SHALL break up the shaft without blocking it.

#### Scenario: Open shaft
- **WHEN** the squid swims from the bottom to the top of Twilight
- **THEN** there is always a clear path, and it takes about a minute or less

## REMOVED Requirements

### Requirement: Top passage closed until the reef exists
**Reason**: The Sunlit reef now exists; the passage becomes one-way instead.
**Migration**: Replaced by "Top passage is one-way".

## ADDED Requirements

### Requirement: Top passage is one-way
The passage at the top of Twilight SHALL gently turn the squid back with a soft wall when it swims up, and SHALL let it through when it swims down from the Sunlit reef. The reef's light SHALL shimmer through the passage from below. The only way up into the reef SHALL be the giant squid's arm, as defined in `giant-squid`.

#### Scenario: Swimming up
- **WHEN** the squid swims up into the top passage
- **THEN** it is gently eased back down with no penalty, and the reef's light shimmers above

#### Scenario: Swimming down
- **WHEN** the squid swims down out of the Sunlit reef
- **THEN** it continues into the top of Twilight
