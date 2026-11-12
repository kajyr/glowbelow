## Purpose

Starfish are a gentle hide-and-seek: shy starfish tucked on rocks and the seabed in every zone that light up and wave when the squid glows near them, counted in the album.

## ADDED Requirements

### Requirement: Starfish in every zone
Each zone SHALL contain about five starfish placed on rocks and the seabed, dim and partly tucked away but findable without leaving the main swimming area.

#### Scenario: Placement
- **WHEN** the player explores Midnight home
- **THEN** five starfish can be found by looking along rocks and the seabed

### Requirement: Found by glowing
A starfish reached by a glow pulse SHALL light up, wave an arm, play a small sound and count as found. Found starfish SHALL stay lit and are never taken away.

#### Scenario: Finding one
- **WHEN** a pulse reaches an unfound starfish
- **THEN** it lights up, waves, and is counted as found

#### Scenario: Already found
- **WHEN** a pulse reaches a found starfish
- **THEN** it waves again but is not counted twice

### Requirement: Zone complete
Finding the last starfish in a zone SHALL play a small celebration.

#### Scenario: Fifth starfish
- **WHEN** the last starfish in a zone is found
- **THEN** a short celebration plays
