# itch-io-release Specification

## Purpose

Publishes the game on itch.io as a free, browser-playable game, with a repeatable way to upload new versions.

## Requirements

### Requirement: itch.io-ready zip
A single build command SHALL produce a zip with `index.html` at its top level, all files referenced by relative paths with exact filename casing, and within itch.io's upload limits.

#### Scenario: Checking the zip
- **WHEN** the itch build is run and the zip is opened
- **THEN** `index.html` is at the top level and no path is absolute

### Requirement: Playable in the itch.io page
The uploaded game SHALL be marked as playable in the browser and SHALL play fully inside the itch.io page on a laptop and on a tablet, including keyboard control after the first click and touch control on the tablet.

#### Scenario: Laptop on itch.io
- **WHEN** someone opens the itch.io page on a laptop and clicks play
- **THEN** the game runs in the page and arrow keys move the squid without scrolling the page

#### Scenario: Tablet on itch.io
- **WHEN** someone opens the itch.io page on a tablet in landscape
- **THEN** the game is playable by touch, with a fullscreen option available

### Requirement: Repeatable updates
New versions SHALL be uploadable with one command that pushes the zip to the itch.io project's web channel.

#### Scenario: Publishing an update
- **WHEN** the release command is run with valid itch.io credentials
- **THEN** the new version replaces the old one on the itch.io page

### Requirement: Kept in step with the game
The itch.io version SHALL be updated after each iteration is archived, at the same page address, so it always matches the latest finished iteration.

#### Scenario: After an iteration
- **WHEN** an iteration is archived and the release command is run
- **THEN** the itch.io page plays the new version at the same address

### Requirement: Game page
The itch.io page SHALL have the game's title, a cover image, at least three screenshots, a short description stating it is a peaceful game for young children, SHALL be marked as in development until the last planned iteration ships, and SHALL be free to play with no in-game links out that a child can reach; the parent corner's "open full page" option is the only exception.

#### Scenario: Page check
- **WHEN** the itch.io page is viewed logged out
- **THEN** title, cover, screenshots and description are shown and the game is free to play
