## ADDED Requirements

### Requirement: Title screen continues saved progress
When a saved game exists, starting play from the title screen SHALL continue it. When no save exists, it SHALL start a new game. The title screen SHALL NOT ask the child to choose between new game and continue; starting over is done from the parent corner.

#### Scenario: Continue
- **WHEN** a saved game exists and the player taps play
- **THEN** play continues with the saved progress

#### Scenario: First time
- **WHEN** no saved game exists and the player taps play
- **THEN** a new game starts as in the demo
