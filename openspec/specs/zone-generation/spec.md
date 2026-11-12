# zone-generation Specification

## Purpose

Builds each zone's layout from a seed and a fixed recipe, so every new game has a differently arranged world that still always follows the game's no-frustration rules.

## Requirements

### Requirement: Layouts come from a seed
Each zone's layout SHALL be generated from the world's seed. The same seed SHALL always produce the same layout, on any device.

#### Scenario: Same seed, same home
- **WHEN** the game is started twice with the same seed
- **THEN** Midnight home has the same terrain, landmarks, rocks, plants and trails both times

#### Scenario: Different seeds, different homes
- **WHEN** the game is started with two different seeds
- **THEN** the landmarks (cave, arch, shaft) are in visibly different places and the terrain differs

### Requirement: Every zone follows its recipe
A generated zone SHALL always contain everything its recipe lists, whatever the seed. For Midnight home this is: a start spot, a seabed along the bottom, a cave with dumbo hiding in it, a rock arch, an open shaft in the ceiling, rocks on the seabed, floating rocks in open water, glow plants and sparkle trails.

#### Scenario: Nothing missing
- **WHEN** Midnight home is generated from any seed
- **THEN** it has exactly one cave with dumbo, at least one arch, one shaft, and the recipe's number of plants

### Requirement: Layouts follow the no-frustration rules
Every generated layout SHALL satisfy all of these:
- every open part of the zone, every plant and the inside of the cave can be reached by simple swimming from the start spot
- every gap the squid can swim through is at least about two squid widths wide
- there are no dead-end pockets the squid can enter but has trouble leaving
- the cave entrance, the arch opening and the shaft are free of rocks
- no plant is inside a rock and no two landmarks overlap
- the cave is between about 2 and 4 screens from the start spot

#### Scenario: Reachable plants
- **WHEN** any generated home is checked
- **THEN** every plant can be reached from the start spot through gaps at least two squid widths wide

#### Scenario: Clear cave
- **WHEN** any generated home is checked
- **THEN** nothing blocks the cave entrance

### Requirement: A bad layout never reaches the player
If a generated layout breaks a rule, the game SHALL silently try another seed until a layout passes. The player SHALL never see a broken layout, a message, or a noticeable delay.

#### Scenario: Rejected seed
- **WHEN** the first seed tried produces a layout with a blocked cave entrance
- **THEN** the game uses the next seed whose layout passes, and the player just sees a normal home

### Requirement: Generation is quick
Generating every zone SHALL take only a small part of the loading time, so the game still loads in under 5 seconds on a mid-range tablet.

#### Scenario: Loading
- **WHEN** the game loads on a mid-range tablet
- **THEN** the title screen appears within the normal loading time, with the generated home behind it

### Requirement: The world changes only with a new game
A new seed SHALL be chosen only when a new game starts. While a game continues, the same seed SHALL be kept so the world stays the same and lit plants stay where they are.

#### Scenario: Within a session
- **WHEN** the player plays for a while, with plants lit and dumbo found
- **THEN** the layout never changes during that session

#### Scenario: New game
- **WHEN** a new game is started
- **THEN** a new seed is chosen and the layout is different

### Requirement: A chosen seed for testing
For testing and for sharing a favourite world, a seed SHALL be selectable through the page address. Players never need to see or type it.

#### Scenario: Seed in the address
- **WHEN** the game is opened with a seed in the address
- **THEN** it generates the world from that seed
