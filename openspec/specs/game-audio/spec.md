# game-audio Specification

## Purpose

Sound carries much of the meaning for a child who does not read: collecting makes melodies, glowing has a satisfying whoom, friends have their own voices, and a soft ambient pad sets the cozy mood.

## Requirements

### Requirement: Sound starts with the first interaction
No sound SHALL play before the player's first tap, click or key press, and sound SHALL start on that interaction (the play control on the title screen).

#### Scenario: Silent title
- **WHEN** the title screen first appears
- **THEN** no sound plays until the player interacts

### Requirement: Sparkles play a melody
Each collected sparkle SHALL play a short soft note from a pentatonic scale, so that collecting several in a row sounds like a melody and never sounds wrong.

#### Scenario: Collecting in a row
- **WHEN** the squid collects five sparkles in quick succession
- **THEN** five different pleasant notes play in sequence

### Requirement: Glow sounds
A small pulse SHALL play a gentle "whoom" with a light sparkle. A big pulse SHALL play a fuller, deeper version.

#### Scenario: Big pulse
- **WHEN** the player glows with a full meter
- **THEN** the big pulse sound plays, clearly bigger than the small one

### Requirement: Plants, bumps and celebrations have sounds
A plant blooming SHALL play a soft chime, a bump SHALL play a soft comic boing, and lighting the last plant SHALL play a celebratory chord.

#### Scenario: Bloom chime
- **WHEN** a plant blooms
- **THEN** a soft chime plays

### Requirement: Dumbo has a signature sound
Dumbo SHALL have its own soft flute-like call, played when it is found and when it points.

#### Scenario: Dumbo found
- **WHEN** dumbo pops out of the cave
- **THEN** its flute-like call plays

### Requirement: Ambient pad
A soft, low, warm ambient pad SHALL play during play. As more plants are lit, the pad SHALL gain a gentle extra layer.

#### Scenario: Brighter zone, fuller sound
- **WHEN** half of the plants are lit
- **THEN** the ambient pad has an added layer compared to the start

### Requirement: Nothing loud or harsh
No sound SHALL be sudden, loud or harsh. All sounds SHALL respect the mute control.

#### Scenario: Muted
- **WHEN** the game is muted and the squid collects a sparkle
- **THEN** no sound plays
