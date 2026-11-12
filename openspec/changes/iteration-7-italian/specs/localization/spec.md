## Purpose

Lets the game be played in English or Italian. Gameplay itself has no words, so this covers the few places with text: the title, album names, the parent corner and accessibility labels.

## ADDED Requirements

### Requirement: Two languages
The game SHALL be available in English and Italian, with every piece of text present in both.

#### Scenario: Italian album
- **WHEN** the language is Italian and the player opens the cuttlefish's page
- **THEN** the name shown is the Italian name

### Requirement: Language from the browser on first run
On first run the game SHALL choose Italian if the browser's preferred language is Italian, and English otherwise.

#### Scenario: Italian browser
- **WHEN** the game runs for the first time in a browser set to Italian
- **THEN** all text is in Italian

### Requirement: Language is remembered
The chosen language SHALL be saved with the progress and used on later runs, regardless of the browser setting.

#### Scenario: Chosen English on an Italian browser
- **WHEN** an adult switched to English and the game is reopened in an Italian browser
- **THEN** the text is in English

### Requirement: No missing strings
Every text key SHALL exist in both languages. A missing key SHALL be caught by the automated tests before release, and at run time SHALL fall back to English rather than showing a key name.

#### Scenario: Missing key at run time
- **WHEN** an Italian string is missing
- **THEN** the English string is shown

### Requirement: Accessibility labels translated
Labels used by screen readers for the buttons (glow, album, mute, parent corner) SHALL follow the chosen language.

#### Scenario: Screen reader in Italian
- **WHEN** the language is Italian
- **THEN** the mute button's accessible label is in Italian
