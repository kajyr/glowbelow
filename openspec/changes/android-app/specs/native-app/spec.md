## Purpose

How the game behaves when installed from an app store: everything bundled in the app, offline from the first launch, saving on the device, landscape full screen, and updates through the store.

## ADDED Requirements

### Requirement: Same game as the web
The installed app SHALL play the same game as the web version of the same release: same zones, friends, controls, sounds, album and parent corner. No feature SHALL be added or removed for the app, other than those named in this spec.

#### Scenario: Comparing versions
- **WHEN** the app and the web version of the same release are played side by side
- **THEN** the same friends, zones and controls are present in both

### Requirement: Offline from the first launch
Every file the game needs SHALL be inside the installed app. The app SHALL start and play fully without any network connection, including on its very first launch.

#### Scenario: First launch in airplane mode
- **WHEN** the app is installed, the device is put in airplane mode, and the app is opened for the first time
- **THEN** the title screen appears and the whole game is playable

### Requirement: No service worker in the app
The app SHALL NOT register a service worker or download game files at run time. New versions SHALL arrive only as store updates.

#### Scenario: Running the app
- **WHEN** the app is running
- **THEN** no service worker is registered and no network request is made

### Requirement: No links out
The app SHALL contain nothing that opens a web page, another app or a store page. The parent corner's "open full page" option SHALL never appear in the app, since saving always works there.

#### Scenario: Parent corner in the app
- **WHEN** an adult opens the parent corner in the app
- **THEN** no option to open the game elsewhere is shown

### Requirement: Progress kept on the device
Progress and settings SHALL be saved on the device as in `save-progress`, SHALL survive closing the app, restarting the device and installing a store update, and SHALL never be sent anywhere. Uninstalling the app MAY erase them.

#### Scenario: After a store update
- **WHEN** a child has found two friends and the app is updated from the store
- **THEN** the album still shows both friends after the update

#### Scenario: App closed by the system
- **WHEN** the system closes the app in the background and the child opens it again
- **THEN** play continues from the zone the squid was last in

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

### Requirement: Screen stays awake while playing
The device screen SHALL NOT dim or lock while the game is being played. When the game is paused in the parent corner or left untouched on the title screen, normal screen timeouts SHALL apply.

#### Scenario: Long swim
- **WHEN** the child plays for longer than the device's screen timeout
- **THEN** the screen stays on

### Requirement: Back button never quits by accident
On Android, the system back gesture or button SHALL close the album or the parent corner when one is open. During play or on the title screen it SHALL leave the app to the background only, with progress saved, and the app SHALL resume where it was.

#### Scenario: Back from the album
- **WHEN** the album is open and the child presses back
- **THEN** the album closes and play continues

#### Scenario: Back during play
- **WHEN** the child presses back during play and then opens the app again
- **THEN** the game is where it was, with progress saved

### Requirement: Sound pauses with the app
All game sound SHALL stop when the app goes to the background or the screen locks, and SHALL resume when the app comes back, respecting the mute and volume settings.

#### Scenario: Switching apps
- **WHEN** the app goes to the background during play
- **THEN** no game sound can be heard until the app is opened again
