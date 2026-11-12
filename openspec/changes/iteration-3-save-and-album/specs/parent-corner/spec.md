## Purpose

A small settings panel for adults, hidden from the child behind a long press, holding the few controls that should not be changed by accident.

## ADDED Requirements

### Requirement: Hidden behind a long press
The parent corner SHALL open only after pressing and holding a small control in a top corner for about 3 seconds, or after pressing Shift+P on a keyboard. A short tap SHALL do nothing.

#### Scenario: Short tap
- **WHEN** the child taps the corner control briefly
- **THEN** nothing happens

#### Scenario: Long press
- **WHEN** an adult holds the corner control for 3 seconds
- **THEN** the parent corner opens and play pauses

### Requirement: Volume
The parent corner SHALL offer separate volume controls for music and for sound effects, saved with the progress.

#### Scenario: Quieter music
- **WHEN** the adult lowers the music volume
- **THEN** the ambient pad gets quieter while sparkle notes stay the same

### Requirement: Reset progress with confirmation
The parent corner SHALL offer a reset that erases all saved progress after a second confirmation step, and then returns to the title screen.

#### Scenario: Reset
- **WHEN** the adult chooses reset and confirms
- **THEN** all progress is erased and the title screen is shown

#### Scenario: Cancel
- **WHEN** the adult chooses reset and then cancels
- **THEN** nothing is erased

### Requirement: Readable text
The parent corner SHALL use short text labels, since it is for adults, taken from the language files.

#### Scenario: Labels
- **WHEN** the parent corner is open
- **THEN** its labels come from `en.json`

### Requirement: Open full page when saving is unavailable
When the game runs embedded in another site's frame and the browser blocks saving there, the parent corner SHALL say that progress cannot be saved in this frame and SHALL offer to open the game as a full page, where saving works. This option SHALL appear only in the parent corner, never to the child.

#### Scenario: Safari blocks storage in the frame
- **WHEN** the game runs inside the itch.io frame on a browser that blocks its storage, and an adult opens the parent corner
- **THEN** a note explains saving is unavailable here, with an option to open the game full page

#### Scenario: Saving works
- **WHEN** saving works normally
- **THEN** the parent corner shows no such note
