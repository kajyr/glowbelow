## Purpose

Whale fall is a mysterious but friendly zone beside Midnight home, built around a whale skeleton that the squid can swim through and play like a xylophone.

## ADDED Requirements

### Requirement: Whale fall layout
Whale fall SHALL be about 4 screens wide and 3 screens tall, shorter than Midnight home, joined to the left side of Midnight home near the seabed by a wide passage. It SHALL be generated from the world's seed as defined in `zone-generation`, with a whale skeleton lying along the seabed that the squid can swim over, under and through between the ribs.

#### Scenario: Swimming through the ribs
- **WHEN** the squid swims along the skeleton between the ribs
- **THEN** it can pass through without getting stuck

#### Scenario: Different worlds
- **WHEN** two games are started with different seeds
- **THEN** both have the skeleton and the giant squid, with rocks, trails and starfish placed differently

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

### Requirement: Whale song
The first time every rib is lit, in any order, a soft whale song SHALL play, the whole skeleton SHALL glow brighter for a few seconds, sparkles SHALL burst out of it, and the squid's glow meter SHALL fill. After that, swimming along the lit ribs from tail to head SHALL play the whale song again with the same reward.

#### Scenario: Last rib
- **WHEN** a pulse lights the last unlit rib
- **THEN** the whale song plays, the skeleton glows, sparkles burst out and the glow meter is full

#### Scenario: Playing it again
- **WHEN** every rib is lit and the squid swims along the skeleton from the tail to the head
- **THEN** the whale song plays again and the glow meter fills

### Requirement: Whale fall extras
Whale fall SHALL contain five starfish and one bubble-ring chain, behaving as defined in `starfish` and `bubble-rings`.

#### Scenario: Starfish count
- **WHEN** the album's starfish page is opened
- **THEN** it shows a row for Whale fall with five starfish
