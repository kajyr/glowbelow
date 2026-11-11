## Purpose

The bobtail squid is a tiny friend hiding in the sand of Vent garden that, once found, digs up buried shells for the coconut octopus.

## ADDED Requirements

### Requirement: Hiding in the sand
Before it is found, the bobtail squid SHALL be buried in the sand of Vent garden with only its eyes showing, blinking.

#### Scenario: Eyes in the sand
- **WHEN** the squid swims along the sand in Vent garden
- **THEN** a pair of blinking eyes can be spotted

### Requirement: Found by glowing
A pulse reaching the bobtail squid SHALL make it pop out of the sand with a puff, play its sound and send a sticker to the album button.

#### Scenario: Popping out
- **WHEN** a pulse reaches the buried bobtail squid for the first time
- **THEN** it pops out and its sticker is added to the album

### Requirement: Digs up shells
After being found, the bobtail squid SHALL follow the squid while in Vent garden, and when the squid glows near a sandy mound, it SHALL dig up a shell there. There SHALL be at least six shells buried across Vent garden.

#### Scenario: Digging
- **WHEN** the squid glows near a mound with the bobtail squid following
- **THEN** the bobtail squid digs and a shell appears

### Requirement: Shells are carried, not counted down
A dug-up shell SHALL be picked up by touching it and carried by the squid until given to the coconut octopus. Shells SHALL never be lost; a carried shell stays carried across zones and sessions.

#### Scenario: Carrying a shell
- **WHEN** the squid touches a dug-up shell
- **THEN** a small shell icon appears with the squid and stays until it is given away
