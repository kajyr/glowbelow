## MODIFIED Requirements

### Requirement: Zone layout
Midnight home SHALL be about 8 screens wide and 4 screens tall, generated from the world's seed as described in `zone-generation`, with a seabed along the bottom, a rock arch, a small cave, rocks to swim around, floating rocks in the open water, and an open shaft in the ceiling that leads upward. Every part of the zone SHALL be reachable by simple swimming, with no maze and nothing locked.

#### Scenario: Crossing the zone
- **WHEN** the player swims from the far left to the far right of the zone
- **THEN** it takes about a minute or less with no dead ends

#### Scenario: Finding the cave
- **WHEN** the player follows the first sparkle trail from the start
- **THEN** it reaches the cave within about 2 minutes

### Requirement: Glow plants that stay lit
The zone SHALL contain about 45 glow plants on the seabed, rocks and floating rocks, spread so that there are some in every part of the zone. An unlit plant reached by any glow pulse SHALL bloom with a short animation and a note, and SHALL then stay lit for the rest of the session, gently swaying.

#### Scenario: Blooming
- **WHEN** a pulse reaches an unlit plant
- **THEN** the plant opens, lights up, plays a note, and stays lit

#### Scenario: Already lit
- **WHEN** a pulse reaches a plant that is already lit
- **THEN** the plant gives a small happy wiggle and stays lit

#### Scenario: Plants everywhere
- **WHEN** the player swims into any screen-sized part of the zone
- **THEN** there is a glow plant within about one screen
