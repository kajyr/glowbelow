# nautilus Specification

## Purpose

The nautilus is an old, slow, wise friend that cruises up and down Twilight, leaving a trail of sparkles behind its shell. It is a friend to meet and a moving source of sparkles, not something to ride.

## Requirements

### Requirement: Nautilus cruises the shaft
The nautilus SHALL cruise slowly up and down Twilight, turning to face its direction of travel and pausing for a few seconds at the top and bottom. It SHALL never block or trap the squid.

#### Scenario: Cruising
- **WHEN** the player watches Twilight for a minute
- **THEN** the nautilus travels from the bottom to the top and back

#### Scenario: Swimming past
- **WHEN** the squid swims into the nautilus's path
- **THEN** the squid passes it without being pushed or stopped

### Requirement: Sparkle trail
While cruising, the nautilus SHALL shed sparkles from its shell that drift behind it and can be collected like any other sparkle. There SHALL never be so many that they crowd the screen.

#### Scenario: Following the nautilus
- **WHEN** the squid swims behind the nautilus for a few seconds
- **THEN** it can collect sparkles from the nautilus's trail

### Requirement: First touch is a discovery
The first time the squid touches the nautilus, it SHALL stop, look at the squid, play its deep slow sound and send a nautilus sticker to the album button. This SHALL happen only once per session.

#### Scenario: Meeting the nautilus
- **WHEN** the squid touches the nautilus for the first time
- **THEN** it stops, plays its sound, and a sticker flies to the album button

### Requirement: The nautilus comes when called
After it has been found, when the squid glows in Twilight the nautilus SHALL turn and head toward the squid's height, bringing its sparkle trail along.

#### Scenario: Calling it down
- **WHEN** the squid glows near the bottom of Twilight while the nautilus is near the top
- **THEN** the nautilus turns and heads down toward the squid
