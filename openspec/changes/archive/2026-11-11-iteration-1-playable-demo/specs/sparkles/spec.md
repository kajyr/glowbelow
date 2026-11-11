## Purpose

Sparkles are the main collectible: star-shaped marine snow drifting through the water that the squid eats to fill its glow meter, and that leads the player toward interesting places.

## ADDED Requirements

### Requirement: Sparkles drift in the water
Small glowing star-shaped sparkles SHALL drift slowly downward through the zone, gently swaying. There SHALL always be sparkles visible on screen during play.

#### Scenario: Always something to collect
- **WHEN** the player looks at any part of Midnight home during play
- **THEN** at least a few sparkles are visible on screen

### Requirement: Generous pickup
A sparkle SHALL be pulled toward the squid when the squid is close, and SHALL be collected on touch. The pickup radius SHALL be large enough that a 6-year-old steering roughly still collects sparkles they aim at.

#### Scenario: Near miss still collects
- **WHEN** the squid swims past a sparkle at about one squid-width away
- **THEN** the sparkle is pulled in and collected

### Requirement: Collecting fills the glow meter
Each collected sparkle SHALL add to the glow meter. About 15 sparkles SHALL fill the meter from empty.

#### Scenario: Filling
- **WHEN** the squid collects 15 sparkles starting from an empty meter
- **THEN** the glow meter is full

#### Scenario: Meter already full
- **WHEN** the squid collects a sparkle while the meter is full
- **THEN** the sparkle is still collected and plays its note; nothing is lost

### Requirement: Sparkles never run out
Collected sparkles SHALL be replaced over time by new ones drifting in from above, so the zone never runs dry.

#### Scenario: Refilling
- **WHEN** the player has collected every sparkle on screen
- **THEN** new sparkles drift in within about 10 seconds

### Requirement: Sparkle trails lead somewhere
Some sparkles SHALL be placed as loose trails that lead from the starting spot toward the cave where dumbo hides, and toward groups of unlit plants.

#### Scenario: First trail
- **WHEN** play starts
- **THEN** a trail of sparkles leads away from the squid toward the cave
