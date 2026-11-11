## Purpose

The coconut octopus is a collector living in the Shipwreck who builds a shell house from the shells the squid brings.

## ADDED Requirements

### Requirement: Found in the Shipwreck
The coconut octopus SHALL live in one of the Shipwreck's rooms, hiding between two coconut shell halves. A pulse reaching it SHALL make it peek out, play its sound and send a sticker to the album button.

#### Scenario: Finding it
- **WHEN** a pulse reaches the coconut octopus for the first time
- **THEN** it peeks out of its shells and its sticker is added to the album

### Requirement: Takes shells to build a house
When the squid carries shells to the coconut octopus, it SHALL take all of them, one at a time with a happy sound, and add each to a shell house that visibly grows in its room.

#### Scenario: Bringing two shells
- **WHEN** the squid carrying two shells touches the coconut octopus
- **THEN** both shells are added to the house and the squid carries none

### Requirement: Finished house
When all buried shells have been added, the house SHALL be finished, the coconut octopus SHALL move in with a celebration, and a bonus shell-house sticker SHALL be added to the album.

#### Scenario: Last shell
- **WHEN** the last shell is added
- **THEN** the house is finished, a celebration plays, and a bonus sticker is added

### Requirement: Progress is kept
The shells added to the house SHALL be saved, so the house keeps its size between sessions.

#### Scenario: Next session
- **WHEN** three shells were added and the player continues later
- **THEN** the house still has three shells
