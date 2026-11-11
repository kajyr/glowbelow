## ADDED Requirements

### Requirement: Optional dash
The player SHALL be able to dash: a short burst of extra speed in the current direction, triggered by double-tapping, swiping, or pressing Shift. Dash SHALL be optional, never needed to reach anything, and usable again after about 1 second.

#### Scenario: Keyboard dash
- **WHEN** the player holds the up arrow and presses Shift
- **THEN** the squid shoots upward quickly, then eases back to normal speed

#### Scenario: Swipe dash
- **WHEN** the player swipes quickly on the tablet
- **THEN** the squid dashes in the swipe direction

### Requirement: Dash bumps are still harmless
A dash into a wall SHALL produce the normal bump reaction and nothing worse.

#### Scenario: Dash into a rock
- **WHEN** the squid dashes into a rock
- **THEN** it does the silly spin and sparkle cloud, and control returns within 0.5 seconds
