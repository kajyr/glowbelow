## Purpose

Gives each friend one short, true, spoken fun fact, so a child who cannot read learns something about the real animal from the album.

## ADDED Requirements

### Requirement: One fun fact per friend per language
Every friend SHALL have one short fun fact (one or two sentences, true about the real animal) in each supported language.

#### Scenario: Nautilus fact
- **WHEN** the nautilus's fun fact is played in English
- **THEN** a short true fact about the real nautilus is spoken

### Requirement: Recorded voice preferred
If a recorded voice file exists for a friend's fun fact in the chosen language, it SHALL be played. Otherwise the device's built-in speech voice for that language SHALL read the fact text.

#### Scenario: Recording present
- **WHEN** a recording of dumbo's fact in Italian exists and the language is Italian
- **THEN** the recording plays

#### Scenario: Recording missing
- **WHEN** no recording exists for the cuttlefish's fact in English
- **THEN** the device's English speech voice reads the fact

### Requirement: Facts respect sound settings
Fun facts SHALL be silent when the game is muted, and SHALL stop when the album is closed or the page is turned.

#### Scenario: Closing mid-fact
- **WHEN** the player closes the album while a fact is playing
- **THEN** the fact stops
