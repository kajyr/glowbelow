## RENAMED Requirements

- FROM: `### Requirement: One fun fact per friend per language`
- TO: `### Requirement: Three or four fun facts per friend per language`

## MODIFIED Requirements

### Requirement: Three or four fun facts per friend per language
Every friend and sea creature that can be found in the game SHALL have three or four short fun facts (one or two sentences each, true about the real animal, simple enough for a 6-year-old) in each supported language. A stamp that cannot be found yet MAY have none.

#### Scenario: Nautilus fact
- **WHEN** the nautilus's facts are listed in English
- **THEN** there are three or four, each a short true fact about the real nautilus

### Requirement: Recorded voice preferred
If a recorded voice file exists for the chosen fun fact in the chosen language, it SHALL be played. Otherwise the device's built-in speech voice for that language SHALL read the fact text.

#### Scenario: Recording present
- **WHEN** dumbo's second fact is chosen, the language is English and `voice/en/dumbo.2.mp3` exists
- **THEN** the recording plays

#### Scenario: Recording missing
- **WHEN** the firefly squid's first fact is chosen and has no English recording
- **THEN** the device's English speech voice reads the fact

## ADDED Requirements

### Requirement: Random fact
Each time a fact is played for an animal, one of its facts SHALL be picked at random, never the one played last for that animal. Facts SHALL only play for found animals.

#### Scenario: Tapping twice
- **WHEN** the player taps dumbo's stamp twice
- **THEN** two different dumbo facts play

#### Scenario: Not found
- **WHEN** the nautilus has not been found
- **THEN** none of its facts can be played
