# game-shell Specification

## Purpose

The frame every play session runs inside: starting the game, the title screen, the side-on camera, lighting, the mute control and keeping the browser out of the way on a tablet.

## Requirements

### Requirement: Game starts from a title screen
The game SHALL open on a title screen showing the vampire squid bobbing in dark water, the game's name and one large play control. Starting play SHALL require a single tap anywhere, a click, or the Space or Enter key.

#### Scenario: Tablet start
- **WHEN** the player taps anywhere on the title screen
- **THEN** the title fades out and the squid becomes controllable within 1 second

#### Scenario: Keyboard start
- **WHEN** the player presses Space or Enter on the title screen
- **THEN** play starts exactly as with a tap

### Requirement: Side-on camera follows the squid
The game SHALL show the world from the side, with the squid moving on a vertical plane. The camera SHALL follow the squid smoothly, never letting it leave the visible screen, and SHALL stop at the edges of the zone so no empty space beyond the zone is shown.

#### Scenario: Following
- **WHEN** the squid swims toward the right edge of the screen
- **THEN** the camera pans right so the squid stays on screen

#### Scenario: Zone edge
- **WHEN** the squid is at the far left edge of the zone
- **THEN** the camera does not pan further left than the zone boundary

### Requirement: Lighting matches the model viewer
The scene SHALL light models with soft light from above and below, a white key light from the upper front-left and a warm fill light from below-front, so models look as they do in `tools/viewer.html`. Glowing parts SHALL appear to glow (bloom or equivalent) against the dark water.

#### Scenario: Cape lining visible
- **WHEN** the squid faces the camera
- **THEN** the coral cape lining is visibly lit, not black

### Requirement: Landscape layout on tablets
The game SHALL fill the screen in landscape orientation. In portrait orientation it SHALL show an icon asking to rotate the device instead of the game.

#### Scenario: Portrait tablet
- **WHEN** the tablet is held in portrait
- **THEN** a rotate-device icon is shown and play is paused

### Requirement: Browser gestures do not interfere
During play, pinch-zoom, double-tap zoom, pull-to-refresh, text selection, the long-press menu and page scrolling by arrow keys or Space SHALL be prevented.

#### Scenario: Arrow keys do not scroll
- **WHEN** the player holds the down arrow on a laptop
- **THEN** the squid swims down and the page does not scroll

#### Scenario: Pinch does not zoom
- **WHEN** the player pinches on the tablet during play
- **THEN** the page does not zoom

### Requirement: Mute control is always visible
A mute control SHALL be visible on every screen, SHALL toggle all game sound on and off, and SHALL be operable by tap, click or the M key.

#### Scenario: Muting
- **WHEN** the player taps the mute control
- **THEN** all sound stops and the control shows the muted state

### Requirement: Runs smoothly on a mid-range tablet
The demo SHALL run at a steady 60 frames per second on a mid-range tablet (for example a recent base-model iPad) and SHALL load in under 5 seconds on a home connection.

#### Scenario: Frame rate during a big glow
- **WHEN** the squid performs a big glow pulse with dumbo following
- **THEN** the frame rate stays at or near 60 fps

### Requirement: Works when embedded in another page
The game SHALL work the same when loaded inside a frame on another site (as itch.io does) as when opened directly: it SHALL size itself to its frame rather than the device screen, load every file by a relative path so it works from any folder, and take keyboard focus on the first tap or click so arrow keys move the squid instead of scrolling the outer page.

#### Scenario: Embedded frame
- **WHEN** the built game is opened inside a 960×600 frame on a test page
- **THEN** it fills the frame, loads all models, and arrow keys move the squid without scrolling the outer page after the first click

#### Scenario: Served from a subfolder
- **WHEN** the built game is served from a subfolder instead of the site root
- **THEN** all files load

### Requirement: No network use beyond loading
The game SHALL make no network requests after its files have loaded, and SHALL contain no ads, links out, accounts or analytics.

#### Scenario: Offline after load
- **WHEN** the network is disconnected after the game has loaded
- **THEN** play continues without errors
