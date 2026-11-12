## MODIFIED Requirements

### Requirement: Every zone follows its recipe
A generated zone SHALL always contain everything its recipe lists, whatever the seed. For Midnight home this is: a start spot, a seabed along the bottom, a cave with dumbo hiding in it, a rock arch, an open shaft in the ceiling, rocks on the seabed, floating rocks in open water, glow plants, sparkle trails, and a giant phantom jelly with enough open water to roam.

#### Scenario: Nothing missing
- **WHEN** Midnight home is generated from any seed
- **THEN** it has exactly one cave with dumbo, at least one arch, one shaft, the recipe's number of plants, and one phantom jelly with a starting spot in open water
