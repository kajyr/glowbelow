## Purpose

Instead of a tutorial, icon-only hints show how to move and glow. They fade once the player has used each control and come back if the player seems stuck.

## ADDED Requirements

### Requirement: Hints match the device
On touch devices the move hint SHALL be a finger-drag icon near the squid. On devices with a keyboard it SHALL be arrow-key icons. The glow hint SHALL be the glow button pulsing, plus a Space-key icon on keyboard devices. Hints SHALL use icons only, with no text.

#### Scenario: Tablet hints
- **WHEN** play starts on a tablet
- **THEN** a finger-drag icon appears near the squid

#### Scenario: Laptop hints
- **WHEN** play starts on a laptop and an arrow key has not been pressed yet
- **THEN** arrow-key icons appear

### Requirement: Hints appear at the start
When play starts, the move hint SHALL appear immediately. The glow hint SHALL appear when the glow meter first becomes full, or after about 30 seconds of play, whichever comes first.

#### Scenario: Glow hint timing
- **WHEN** the player has been swimming for 30 seconds without glowing
- **THEN** the glow hint appears

### Requirement: Hints fade after use
The move hint SHALL fade after the player's first sustained movement. The glow hint SHALL fade after the player's first glow.

#### Scenario: Move hint fades
- **WHEN** the player swims for about a second
- **THEN** the move hint fades out

#### Scenario: Glow hint fades
- **WHEN** the player glows
- **THEN** the glow hint fades out

### Requirement: Hints return when idle
If the player gives no input for about 20 seconds, the move hint SHALL appear again, and SHALL fade again on the next movement.

#### Scenario: Returning hint
- **WHEN** the player puts the tablet down for 20 seconds
- **THEN** the finger-drag icon reappears near the squid

### Requirement: Switching device
If the player switches input (for example presses an arrow key on a tablet with a keyboard), the hint icons SHALL switch to match the input last used.

#### Scenario: Keyboard on a tablet
- **WHEN** the player presses an arrow key on a tablet
- **THEN** any visible move hint shows arrow keys from then on
