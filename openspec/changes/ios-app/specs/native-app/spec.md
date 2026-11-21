## MODIFIED Requirements

### Requirement: Landscape full screen
The app SHALL ask for landscape only, turning with the device between the two landscape sides, and SHALL fill the whole screen with the system bars hidden during play. Where the system overrides that request (Android 16+ on large screens), a device held in portrait SHALL get the game's rotate-device icon with play paused, as on the web.

#### Scenario: Android tablet
- **WHEN** the app is opened on an Android tablet held in landscape
- **THEN** the game fills the screen with no status bar or navigation bar visible

#### Scenario: Turning the tablet over
- **WHEN** the Android tablet is turned from one landscape side to the other
- **THEN** the game turns with it and keeps playing

#### Scenario: Large tablet held in portrait
- **WHEN** a large Android tablet that ignores the landscape request is held in portrait
- **THEN** the rotate-device icon is shown and play pauses until it is turned back

#### Scenario: Bars swiped in
- **WHEN** the child swipes from the screen edge and the system bars appear
- **THEN** they hide again by themselves after a moment

#### Scenario: iPad
- **WHEN** the app is opened on an iPad held in landscape
- **THEN** the game fills the screen with no status bar, and the home indicator fades out during play

#### Scenario: iPhone with a notch or island
- **WHEN** the app is opened on an iPhone with a camera cut-out
- **THEN** the water fills the whole screen and no control sits under the cut-out or the home indicator

#### Scenario: Swipe from the bottom edge
- **WHEN** the child swipes up from the bottom edge once during play
- **THEN** the app does not leave; a second swipe is needed to go home

### Requirement: Screen stays awake while playing
The device screen SHALL NOT dim or lock while the game is being played. When the game is paused in the parent corner or left untouched on the title screen, normal screen timeouts SHALL apply.

#### Scenario: Long swim
- **WHEN** the child plays for longer than the device's screen timeout
- **THEN** the screen stays on

#### Scenario: Long swim on iPad
- **WHEN** the child plays on an iPad for longer than its auto-lock time
- **THEN** the screen stays on
