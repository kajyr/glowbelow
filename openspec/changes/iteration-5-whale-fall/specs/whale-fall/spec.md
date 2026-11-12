## Purpose

Whale fall is a mysterious but friendly zone beside Midnight home, built around a whale skeleton that the squid can swim through and play like a xylophone.

## ADDED Requirements

### Requirement: Whale fall layout
Whale fall SHALL be about 3 screens wide and 2 screens tall, joined to the left side of Midnight home by a wide passage, with a whale skeleton lying along the seabed that the squid can swim over, under and through between the ribs.

#### Scenario: Swimming through the ribs
- **WHEN** the squid swims along the skeleton between the ribs
- **THEN** it can pass through without getting stuck

### Requirement: Friendly mood
Whale fall SHALL use bone white and soft blue tones and SHALL look gentle rather than spooky: rounded bones, soft light, small fish and drifting particles.

#### Scenario: First visit
- **WHEN** the squid enters Whale fall
- **THEN** the zone is calm and softly lit with nothing scary

### Requirement: Musical ribs
Each rib SHALL play its own note when reached by a glow pulse, with the notes rising from tail to head. A rib that has been played SHALL stay softly lit. A pulse that reaches several ribs SHALL play them in order from nearest to farthest.

#### Scenario: Playing several ribs
- **WHEN** a big pulse reaches five ribs
- **THEN** five notes play in a quick run and the ribs stay softly lit

### Requirement: Whale fall extras
Whale fall SHALL contain five starfish and one bubble-ring chain, behaving as defined in `starfish` and `bubble-rings`.

#### Scenario: Starfish count
- **WHEN** the album's starfish page is opened
- **THEN** it shows a row for Whale fall with five starfish
