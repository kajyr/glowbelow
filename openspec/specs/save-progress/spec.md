# save-progress Specification

## Purpose

Keeps the player's progress between sessions without accounts or any action from the child: lit things, found friends and found starfish are remembered in the browser.

## Requirements

### Requirement: Progress saves automatically
The game SHALL save progress in the browser automatically whenever the world state changes (something is lit, a friend or starfish is found, a firefly group joins, dash unlocks), when the squid crosses into another zone, and when the page is hidden. There SHALL be no save button.

#### Scenario: Closing the tab
- **WHEN** the player lights three plants and closes the browser tab
- **THEN** reopening the game shows those three plants still lit

### Requirement: What is saved
The save SHALL include the world's seed, lit plants and lanterns, found friends, the firefly groups that joined the swarm, found starfish, whether dash is unlocked, and the zone the squid was in. It SHALL NOT include the squid's exact position or the glow meter. Mute and volume are settings, remembered separately, and are not part of the save.

#### Scenario: Starting position after load
- **WHEN** the player continues a saved game
- **THEN** the squid starts at the entry point of the zone it was last in

### Requirement: Saving never gets in the way
If the browser's storage is unavailable or full, the game SHALL keep working for the session without saving and without showing an error to the child.

#### Scenario: Private browsing
- **WHEN** the game runs where storage is blocked
- **THEN** play works normally and nothing is saved

### Requirement: Old saves keep working
The save SHALL carry a version number. A save from an older version SHALL be upgraded on load; a save that cannot be read SHALL be ignored and a new game started.

#### Scenario: Corrupted save
- **WHEN** the stored save is unreadable
- **THEN** the game starts fresh without errors

### Requirement: Saves survive game updates
The save SHALL record which version of the world layout it was made with. When a newer version of the game lays the world out differently, continuing SHALL keep found friends, the joined firefly groups, found starfish and the dash unlock, so the album never loses anything; lit plants and lanterns from the old layout SHALL be dropped, so those zones glow again as the player lights them.

#### Scenario: After an update
- **WHEN** a save made before a game update that changed world generation is continued
- **THEN** every friend and starfish found is still in the album, and plants start unlit

### Requirement: Data stays on the device
Saved data SHALL be stored only in the browser on the device and SHALL never be sent anywhere.

#### Scenario: No network
- **WHEN** progress is saved
- **THEN** no network request is made
