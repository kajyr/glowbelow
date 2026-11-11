## Purpose

The mimic octopus is the reef's joker: it pretends to be other things, and the player finds it by spotting the thing that looks slightly wrong.

## ADDED Requirements

### Requirement: Disguised as other things
The mimic octopus SHALL hide in the Sunlit reef disguised as one of three things in turn: a rock, a starfish and a small fish. Each disguise SHALL have a giveaway (googly eyes or a wiggle every few seconds).

#### Scenario: Spotting the giveaway
- **WHEN** the player watches the disguised mimic octopus for a few seconds
- **THEN** its disguise wiggles or its eyes blink

### Requirement: Found three times
A pulse reaching the disguised mimic octopus SHALL make it drop the disguise with a laugh and move to its next disguise somewhere else in the reef. The third time, it SHALL stay as itself, play its sound and send a sticker to the album button.

#### Scenario: First find
- **WHEN** a pulse reaches the first disguise
- **THEN** the mimic octopus laughs and moves to its next disguise

#### Scenario: Third find
- **WHEN** a pulse reaches the third disguise
- **THEN** it stays as itself and its sticker is added to the album

### Requirement: Not confused with real starfish
While disguised as a starfish, the mimic octopus SHALL NOT count as a starfish in the album.

#### Scenario: Starfish count
- **WHEN** the mimic's starfish disguise is lit
- **THEN** the album's starfish count does not change
