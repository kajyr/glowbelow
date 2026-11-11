## ADDED Requirements

### Requirement: Optional dash
The player SHALL be able to dash: a short burst of extra speed in the current steering direction (or the facing direction when not steering), triggered by a dash button on screen or the Shift key. Dash SHALL be optional, never needed to reach anything, and usable again after about 1 second.

#### Scenario: Keyboard dash
- **WHEN** the player holds the up arrow and presses Shift
- **THEN** the squid shoots upward quickly, then eases back to normal speed

#### Scenario: Dash button
- **WHEN** the player holds a finger to steer and taps the dash button with another finger
- **THEN** the squid dashes toward the finger

#### Scenario: Repeated presses
- **WHEN** the player presses dash three times in one second
- **THEN** only one dash happens

### Requirement: Dash button
On every device a round dash button SHALL sit above the glow button, at least 64 px, showing an icon only. It SHALL show when dash is ready again.

#### Scenario: Ready again
- **WHEN** a second has passed since the last dash
- **THEN** the dash button looks ready

### Requirement: Dash bumps are still harmless
A dash into a wall SHALL produce the normal bump reaction and nothing worse.

#### Scenario: Dash into a rock
- **WHEN** the squid dashes into a rock
- **THEN** it does the silly spin and sparkle cloud, and control returns within 0.5 seconds
