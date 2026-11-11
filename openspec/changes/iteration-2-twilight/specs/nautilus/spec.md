## Purpose

The nautilus is an old, slow, wise friend that cruises up and down Twilight and gives the squid free rides between the bottom and the top of the shaft.

## ADDED Requirements

### Requirement: Nautilus cruises the shaft
The nautilus SHALL cruise slowly up and down Twilight, turning to face its direction of travel, pausing for a few seconds at the top and bottom.

#### Scenario: Cruising
- **WHEN** the player watches Twilight for a minute
- **THEN** the nautilus travels from the bottom to the top and back

### Requirement: First touch is a discovery
The first time the squid touches the nautilus, it SHALL stop, look at the squid, play its deep slow sound and send a nautilus sticker to the album button.

#### Scenario: Meeting the nautilus
- **WHEN** the squid touches the nautilus for the first time
- **THEN** it stops, plays its sound, and a sticker flies to the album button

### Requirement: Riding the nautilus
Touching the nautilus's shell SHALL make the squid sit on it and ride along. While riding, moving away or glowing SHALL hop the squid off. Riding SHALL never be required to reach anywhere.

#### Scenario: Hop on
- **WHEN** the squid touches the shell
- **THEN** the squid settles on the shell and travels with the nautilus

#### Scenario: Hop off
- **WHEN** the player steers away while riding
- **THEN** the squid leaves the shell and swims normally

### Requirement: The nautilus comes when called
When the squid glows at the bottom or top of Twilight, the nautilus SHALL head toward that end.

#### Scenario: Calling from the bottom
- **WHEN** the squid glows at the bottom of Twilight while the nautilus is near the top
- **THEN** the nautilus turns and heads down
