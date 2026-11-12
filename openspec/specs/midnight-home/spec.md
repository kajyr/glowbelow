# midnight-home Specification

## Purpose

Midnight home is the squid's home zone and the only zone in the playable demo: a dark, cozy seabed that the player gradually lights up by glowing at its plants.

## Requirements

### Requirement: Zone layout
Midnight home SHALL be about 8 screens wide and 4 screens tall, generated from the world's seed as described in `zone-generation`, with a seabed along the bottom, a rock arch, a small cave, rocks to swim around, floating rocks in the open water, and an open shaft in the ceiling that leads upward. Every part of the zone SHALL be reachable by simple swimming, with no maze and nothing locked.

#### Scenario: Crossing the zone
- **WHEN** the player swims from the far left to the far right of the zone
- **THEN** it takes about a minute or less with no dead ends

#### Scenario: Finding the cave
- **WHEN** the player follows the first sparkle trail from the start
- **THEN** it reaches the cave within about 2 minutes

### Requirement: Darkness that is cozy, not empty
At the start, the zone SHALL be dark but never black: the outlines of rocks and the seabed SHALL stay faintly visible, and the squid's glow tips, the sparkles and soft drifting particles SHALL provide points of light.

#### Scenario: First look
- **WHEN** play starts
- **THEN** the player can make out the seabed and nearby rocks, and the squid is clearly visible

### Requirement: Glow plants that stay lit
The zone SHALL contain about 45 glow plants on the seabed, rocks and floating rocks, spread so that there are some in every part of the zone. An unlit plant reached by any glow pulse SHALL bloom with a short animation and a note, and SHALL then stay lit for the rest of the session, gently swaying.

#### Scenario: Blooming
- **WHEN** a pulse reaches an unlit plant
- **THEN** the plant opens, lights up, plays a note, and stays lit

#### Scenario: Already lit
- **WHEN** a pulse reaches a plant that is already lit
- **THEN** the plant gives a small happy wiggle and stays lit

#### Scenario: Plants everywhere
- **WHEN** the player swims into any screen-sized part of the zone
- **THEN** there is a glow plant within about one screen

### Requirement: The zone gets brighter
Each lit plant SHALL add soft light to its surroundings, so the zone becomes visibly brighter as more plants are lit.

#### Scenario: Half lit
- **WHEN** half of the plants are lit
- **THEN** the zone is visibly brighter than at the start

### Requirement: All plants lit celebration
When the last plant in the zone is lit, the zone SHALL play a short celebration (a wave of light across all plants and a chord) and remain fully lit.

#### Scenario: Last plant
- **WHEN** the final unlit plant blooms
- **THEN** a wave of light runs across the zone and a celebratory chord plays

### Requirement: The shaft leads to Twilight
The shaft at the top of Midnight home SHALL be an open passage into Twilight, with light from above showing the way.

#### Scenario: Swimming up
- **WHEN** the squid swims up into the shaft
- **THEN** it continues into Twilight without being turned back

#### Scenario: Swimming back down
- **WHEN** the squid swims down from Twilight into the shaft
- **THEN** it arrives back in Midnight home

### Requirement: Constant slow motion
The zone SHALL always have something gently moving: drifting particles, swaying plants and rising bubbles.

#### Scenario: Idle scene
- **WHEN** the player does nothing for 10 seconds
- **THEN** the scene is still visibly alive with slow movement
