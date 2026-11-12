## Purpose

The sticker album is the game's collection and the only "goal": a page for every friend found and a count of starfish found in each zone, all readable without reading.

## ADDED Requirements

### Requirement: Opening and closing the album
Tapping the album button, clicking it, or pressing the B key SHALL open the album and pause play. (A is not used: it steers left.) A large close control, tapping outside the album, or pressing Escape SHALL close it and resume play exactly where it was.

#### Scenario: Open and close
- **WHEN** the player opens the album and then closes it
- **THEN** play resumes with the squid where it was

### Requirement: One page per friend
The album SHALL have one page per friend in the game. A found friend's page SHALL show its picture, its name and a sound button that plays the friend's sound. A not-yet-found friend's page SHALL show a dark silhouette only.

#### Scenario: Found friend
- **WHEN** the player opens dumbo's page after finding dumbo
- **THEN** dumbo's picture and name are shown and tapping the page plays dumbo's sound

#### Scenario: Not found yet
- **WHEN** the player opens the nautilus's page before meeting it
- **THEN** only a dark silhouette is shown

### Requirement: Starfish page
The album SHALL have a starfish page showing, for each zone, one starfish icon per starfish in that zone, lit for found ones and dark for the rest.

#### Scenario: Two found
- **WHEN** the player has found two of five starfish in home
- **THEN** home's row shows two lit and three dark starfish

### Requirement: Album navigation without reading
Pages SHALL be turned by swiping, by large arrow controls, or by the arrow keys, and SHALL use pictures and icons rather than text for everything except friend names.

#### Scenario: Keyboard navigation
- **WHEN** the player presses the right arrow in the album
- **THEN** the next page is shown

### Requirement: New sticker badge
The album button SHALL show a badge while there are found friends whose page has not been viewed yet, and the badge SHALL clear when those pages are viewed.

#### Scenario: Badge clears
- **WHEN** the player opens the album and views the page of a newly found friend
- **THEN** the badge on the album button disappears
