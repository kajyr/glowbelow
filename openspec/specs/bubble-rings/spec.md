# bubble-rings Specification

## Purpose

Bubble rings are a small swim-through toy: rings of bubbles hanging in the water that give a burst of speed and a rising run of notes, arranged in chains like a gentle race line.

## Requirements

### Requirement: Rings to swim through
Midnight home and Twilight SHALL each contain at least one chain of 4 to 6 bubble rings. Swimming through a ring SHALL give the squid a short push of speed in its direction of travel and play a note.

#### Scenario: Through a ring
- **WHEN** the squid swims through a bubble ring
- **THEN** it speeds up briefly and a note plays

### Requirement: Chains play a rising scale
Each ring in a chain SHALL play the next note up a scale, so swimming through a whole chain plays a rising run. Finishing a chain SHALL play a small flourish.

#### Scenario: Whole chain
- **WHEN** the squid swims through all rings of a chain in order
- **THEN** a rising run of notes plays, ending with a flourish

### Requirement: Rings are never used up
A ring SHALL pop into bubbles when swum through and re-form after a few seconds. Rings SHALL NOT count toward anything and SHALL never be required.

#### Scenario: Re-forming
- **WHEN** a ring has been swum through
- **THEN** it re-forms within about 5 seconds
