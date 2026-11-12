## Purpose

Twilight is the dreamy open shaft above Midnight home, where light starts to arrive from above and the firefly squid and nautilus live.

## ADDED Requirements

### Requirement: Twilight layout
Twilight SHALL be a tall open zone about 3 screens wide and 10 screens tall, generated from the world's seed like Midnight home, with Midnight home below it and a closed-for-now passage at the top leading to the Sunlit reef. Rock ledges on the side walls SHALL break up the shaft without blocking it.

#### Scenario: Open shaft
- **WHEN** the squid swims from the bottom to the top of Twilight
- **THEN** there is always a clear path, and it takes about a minute or less

### Requirement: Gradient mood
Twilight SHALL be darker blue at the bottom and lighter lavender toward the top, with faint light rays coming from above.

#### Scenario: Getting lighter
- **WHEN** the squid swims upward through Twilight
- **THEN** the water becomes gradually lighter

### Requirement: Sparkles in Twilight
Sparkles SHALL drift in Twilight as they do in Midnight home, few at a time, with the same pickup and refilling rules, so the glow meter can be filled without going back home.

#### Scenario: Filling up in Twilight
- **WHEN** the squid explores Twilight for a minute
- **THEN** it can collect enough sparkles to fill the glow meter

### Requirement: Jellyfish lanterns
Twilight SHALL contain about 30 jellyfish lanterns floating at different heights, spread so that every part of the zone has some. A lantern reached by a glow pulse SHALL light up, play a note and then stay lit for the rest of the session, slowly bobbing with its tentacles swaying. A lit lantern reached again SHALL give a small happy wiggle.

#### Scenario: Lighting a lantern
- **WHEN** a pulse reaches an unlit jellyfish lantern
- **THEN** it lights up, plays a note and stays lit

### Requirement: Twilight gets brighter
Each lit lantern SHALL add soft light around it, so Twilight becomes visibly brighter as more lanterns are lit.

#### Scenario: Half lit
- **WHEN** half of the lanterns are lit
- **THEN** Twilight is visibly brighter than at the start

### Requirement: All lanterns lit celebration
When the last lantern in Twilight is lit, the zone SHALL play a short celebration (a wave of light across all lanterns and a chord) and remain fully lit.

#### Scenario: Last lantern
- **WHEN** the final unlit lantern lights up
- **THEN** a wave of light runs across the lanterns and a celebratory chord plays

### Requirement: Lanterns count as unlit things for friends
Friends that point toward the nearest unlit thing (dumbo, the firefly arrow) SHALL consider unlit lanterns as well as unlit plants, choosing whichever is nearest to the squid.

#### Scenario: Dumbo in Twilight
- **WHEN** the squid hovers still in Twilight with dumbo following and unlit lanterns nearby
- **THEN** dumbo points toward the nearest unlit lantern, not a plant back home

### Requirement: Top passage closed until the reef exists
Until the Sunlit reef is built, the passage at the top of Twilight SHALL gently turn the squid back with a soft wall.

#### Scenario: Top of Twilight
- **WHEN** the squid swims into the top passage
- **THEN** it is gently eased back down with no penalty
