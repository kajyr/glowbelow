## Purpose

The glow pulse is the squid's one action: an expanding ring of light that lights up the dark, wakes glow plants and reveals hidden friends. The glow meter decides how big the pulse is.

## ADDED Requirements

### Requirement: Glow meter
The game SHALL show a glow meter that fills as sparkles are collected and empties when a big pulse is used. The meter SHALL be shown as a picture (for example the glow button filling with light), not as numbers or text.

#### Scenario: Meter display
- **WHEN** the squid collects sparkles
- **THEN** the glow button visibly fills with light

### Requirement: Glow input
The player SHALL be able to glow by tapping the glow button (bottom-right, at least 64 px), by tapping the squid itself, by pressing Space, or by clicking the squid.

#### Scenario: Tablet glow
- **WHEN** the player taps the glow button
- **THEN** the squid glows

#### Scenario: Keyboard glow
- **WHEN** the player presses Space during play
- **THEN** the squid glows

### Requirement: Small pulse is always free
When the meter is not full, a glow SHALL produce a small pulse that costs nothing and can be repeated after a short pause of about 1 second.

#### Scenario: Empty meter
- **WHEN** the player glows with an empty meter
- **THEN** a small ring of light spreads around the squid and the meter is unchanged

#### Scenario: Repeated tapping
- **WHEN** the player taps glow five times in one second
- **THEN** only one small pulse happens in that second

### Requirement: Big pulse when the meter is full
When the meter is full, a glow SHALL produce a big pulse with about three times the reach of a small pulse, with a stronger flash and sound, and SHALL empty the meter. When the meter first becomes full, the glow button SHALL pulse to invite a glow.

#### Scenario: Full meter
- **WHEN** the player glows with a full meter
- **THEN** a big ring of light spreads, and the meter empties

#### Scenario: Invitation
- **WHEN** the meter becomes full
- **THEN** the glow button starts gently pulsing until the player glows

### Requirement: A pulse lights the surroundings
A pulse SHALL briefly light up everything it passes for a few seconds, then the light fades back to the zone's current brightness.

#### Scenario: Temporary light
- **WHEN** a pulse passes over a dark rock
- **THEN** the rock is lit for a few seconds and then fades back to dark

### Requirement: A pulse wakes what it reaches
Every glow plant, hidden friend or other glow-reactive thing inside the pulse's reach SHALL react. The reaction of each thing is defined by its own capability.

#### Scenario: Plant in reach
- **WHEN** a small pulse reaches an unlit glow plant
- **THEN** the plant reacts as defined in `midnight-home`

### Requirement: The squid's glow tips show the meter
The squid's glowing arm tips SHALL get brighter as the meter fills, so the meter can also be read from the squid itself.

#### Scenario: Full meter on the squid
- **WHEN** the meter is full
- **THEN** the squid's arm tips glow noticeably brighter than when the meter is empty
