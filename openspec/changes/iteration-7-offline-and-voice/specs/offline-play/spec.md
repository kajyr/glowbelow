## Purpose

Makes the game behave like an installed app on a tablet: launchable from the home screen, playable without a network connection, and updated safely.

## ADDED Requirements

### Requirement: Installable
The game SHALL be installable to a tablet's home screen with its own name and icon, and SHALL open full screen in landscape without browser bars when launched from there.

#### Scenario: Home screen launch
- **WHEN** the game is added to an iPad's home screen and launched from the icon
- **THEN** it opens full screen with no browser address bar

### Requirement: Works offline after the first visit
After one complete load with a connection, every file the game needs (code, models, sounds, voice files) SHALL be stored on the device, and the game SHALL start and play fully with no connection.

#### Scenario: Airplane mode
- **WHEN** the tablet is in airplane mode and the game is launched from the home screen
- **THEN** the title screen appears and the whole game is playable

### Requirement: Safe updates
When a new version is published, the game SHALL download it in the background and use it on the next launch. An update SHALL never interrupt a session in progress or lose saved progress.

#### Scenario: Update during play
- **WHEN** a new version is published while the child is playing
- **THEN** play continues unchanged, and the next launch uses the new version with progress intact

### Requirement: Published over HTTPS
The game SHALL be served from a static HTTPS address with no server-side code.

#### Scenario: Opening the link
- **WHEN** an adult opens the published link on a tablet
- **THEN** the game loads over HTTPS

### Requirement: No service worker when embedded on itch.io
When the game runs inside an itch.io frame, it SHALL NOT register a service worker, and SHALL play normally online. Offline play and home-screen install SHALL remain available from the game's own address.

#### Scenario: Played on itch.io
- **WHEN** the game is opened from its itch.io page
- **THEN** no service worker is registered and the game plays normally

#### Scenario: Own address unchanged
- **WHEN** the game is opened from its own address
- **THEN** offline play and install work as before
