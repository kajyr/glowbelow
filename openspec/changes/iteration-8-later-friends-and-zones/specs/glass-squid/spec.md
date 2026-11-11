## Purpose

The glass squid is a transparent, almost invisible friend in Twilight who plays hide and seek: it can only be seen while lit by the squid's glow.

## ADDED Requirements

### Requirement: Invisible in the dark
The glass squid SHALL be nearly invisible in Twilight, showing only a faint shimmer, until light from a pulse passes over it.

#### Scenario: Not lit
- **WHEN** the squid swims near the glass squid without glowing
- **THEN** only a faint shimmer is visible

### Requirement: Visible while lit
While a pulse's light is on it, the glass squid SHALL be clearly visible as a transparent shape with glowing outline and visible eyes, fading back to invisible as the light fades.

#### Scenario: Lit
- **WHEN** a pulse passes over the glass squid
- **THEN** it becomes clearly visible for a few seconds and then fades

### Requirement: Hide and seek, three times
The first time the glass squid is lit, it SHALL giggle and dart to a new hiding spot in Twilight. Lighting it in three hiding spots SHALL make it stay visible, play its sound and send a sticker to the album button.

#### Scenario: Third find
- **WHEN** the glass squid is lit in its third hiding spot
- **THEN** it stays visible and its sticker is added to the album

### Requirement: Hiding spots are close
Each hiding spot SHALL be within about one screen of the previous one, and the glass squid SHALL leave a faint trail of bubbles toward it.

#### Scenario: Following the trail
- **WHEN** the glass squid darts away
- **THEN** a faint bubble trail shows the direction it went
