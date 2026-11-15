## ADDED Requirements

### Requirement: Whale fall follows its recipe
Whale fall SHALL be generated from the world's seed and SHALL always contain: a seabed along the bottom, the whale skeleton lying along the seabed, the giant squid behind the skull, rocks, sparkle trails, small fish schools, five starfish and one bubble-ring chain. The skeleton and the giant squid SHALL be placed first and the rest kept clear of them. On top of the usual layout rules:
- the passage from Midnight home is free of rocks
- the gaps between ribs are at least about two squid widths
- the space above the skull is free, so the giant squid can rise
- every rib can be reached by a glow pulse from open water

#### Scenario: Nothing missing
- **WHEN** Whale fall is generated from any seed
- **THEN** it has one skeleton with all its ribs, one giant squid, five starfish and one bubble-ring chain

#### Scenario: Room to rise
- **WHEN** any generated Whale fall is checked
- **THEN** nothing blocks the space above the skull or the passage from home
