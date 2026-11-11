## Purpose

Vent garden is a warm, bubbly zone beside Midnight home, full of tube worms and bubble currents, and home to the bobtail squid.

## ADDED Requirements

### Requirement: Vent garden layout
Vent garden SHALL be about 3 screens wide and 2 screens tall, joined to the right side of Midnight home by a wide passage, with a sandy bottom, warm vents and clusters of tube worms.

#### Scenario: Entering
- **WHEN** the squid swims through the right edge of Midnight home
- **THEN** it continues into Vent garden

### Requirement: Warm bubbly mood
Vent garden SHALL use dark teal with orange glow, rising bubble columns from the vents and a warm ambient layer.

#### Scenario: Mood
- **WHEN** the squid enters Vent garden
- **THEN** the water shifts to dark teal with warm orange light

### Requirement: Tube worms
Tube worms SHALL duck into their tubes when the squid swims close and pop back out after a moment; a glow pulse SHALL make them light up their tips and stay lit.

#### Scenario: Ducking
- **WHEN** the squid swims close to a tube worm cluster
- **THEN** the worms duck in and pop back out after the squid passes

### Requirement: Currents and extras
Vent garden SHALL contain at least two bubble currents as defined in `currents`, five starfish and one bubble-ring chain.

#### Scenario: Album row
- **WHEN** the album's starfish page is opened
- **THEN** it shows a row for Vent garden with five starfish
