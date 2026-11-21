# sticker-album Specification

## Purpose

The sticker album is the game's collection and the only "goal": one page with a stamp for every friend and sea creature, and the starfish found in each zone, all readable without reading.

## Requirements

### Requirement: Opening and closing the album
Tapping the album button, clicking it, or pressing the B key SHALL open the album and pause play. (A is not used: it steers left.) A large close control, tapping outside the album, or pressing Escape SHALL close it and resume play exactly where it was.

#### Scenario: Open and close
- **WHEN** the player opens the album and then closes it
- **THEN** play resumes with the squid where it was

### Requirement: One page of stamps
The album SHALL be a single page with nothing to turn: a grid of stamps at least three wide and two tall; past six stamps it SHALL be four wide, with one more row for every four more. There SHALL be one stamp for every planned friend (dumbo, firefly squid, nautilus, cuttlefish, giant squid), including friends whose zone is not in the game yet, and one for each sea creature (starfish, phantom jelly, jellyfish lantern), in zone order. A found stamp SHALL show its picture and its name, and tapping it SHALL play its sound. A stamp not found yet SHALL show a dark silhouette of the creature only. The whole page SHALL fit the screen, from a phone in landscape to a laptop.

#### Scenario: Found friend
- **WHEN** the player opens the album after finding dumbo
- **THEN** dumbo's stamp shows its picture and name, and tapping it plays dumbo's sound

#### Scenario: Not found yet
- **WHEN** the player opens the album before meeting the nautilus
- **THEN** the nautilus's stamp shows only a dark silhouette

#### Scenario: Eight stamps
- **WHEN** the album is opened with five planned friends and three sea creatures
- **THEN** the stamps fill a four by two grid

### Requirement: Sea creature stamps
A sea creature's stamp SHALL be found the first time the squid meets it: the first starfish found, the first bounce off the phantom jelly, the first jellyfish lantern lit. That first meeting SHALL send the stamp flying to the album button, like a friend's sticker.

#### Scenario: First lantern
- **WHEN** the squid lights its first jellyfish lantern
- **THEN** the lantern jelly stamp flies to the album button and the badge shows

#### Scenario: Only once
- **WHEN** the squid bounces off the phantom jelly again
- **THEN** no stamp flies

### Requirement: Starfish under the stamps
Under the stamp grid, the page SHALL show one strip per zone, tinted like the zone's water, with one starfish icon per starfish in that zone, lit for found ones and dark for the rest.

#### Scenario: Two found
- **WHEN** the player has found two of five starfish in home
- **THEN** home's strip shows two lit and three dark starfish

### Requirement: Album without reading
The album SHALL use pictures and icons rather than text for everything except the names on found stamps.

#### Scenario: Nothing to read
- **WHEN** a child who cannot read opens the album
- **THEN** every stamp, silhouette and starfish is a picture, and the only words are the names on found stamps

### Requirement: New sticker badge
The album button SHALL show a badge while there are found stamps not seen yet. Opening the album shows every stamp, so it SHALL clear the badge; a stamp seen for the first time SHALL pop in.

#### Scenario: Badge clears
- **WHEN** the player opens the album after finding a new friend
- **THEN** the new friend's stamp pops in and the badge on the album button disappears

### Requirement: Glow colour row
Beside the starfish strips, the album page SHALL show the glow-colour dots, in rows of three: unlocked colours in their colour, the rest as dark dots, and a ring around the chosen one. Tapping an unlocked dot, or moving to it with the arrows and pressing Space, SHALL switch the squid's glow, as defined in `cosmetics`. Tapping a dark dot SHALL do nothing but a soft wiggle. Each dot SHALL be at least 64 px to touch, and the whole page SHALL still fit the screen.

#### Scenario: New game
- **WHEN** the player opens the album in a new game
- **THEN** the colour row shows teal with a ring around it and five dark dots

#### Scenario: Choosing a colour
- **WHEN** pink is unlocked and the player taps the pink dot
- **THEN** the ring moves to pink and the squid's glow turns pink

#### Scenario: Locked colour
- **WHEN** the player taps a dark dot
- **THEN** the dot wiggles and nothing else changes

### Requirement: Completed stamp
When the journey is completed (the sunbeam in the Sunlit reef, as defined in `sunlit-reef`), the album SHALL open and a completed stamp SHALL thump onto its page: red ink in a double ring, a star in the middle and the word round the top, at an angle, with rough edges and patchy ink like a real rubber stamp. It SHALL be stamped over the left of the starfish strips, on top of them, so it covers no creature stamp. The stamp SHALL stay on the page every time the album is opened afterwards. The word is decoration: nothing needs reading.

#### Scenario: Completing the journey
- **WHEN** the squid swims up into the sunbeam
- **THEN** the album opens and, a moment later, the stamp thumps down with a soft knock

#### Scenario: Later
- **WHEN** the player opens the album after completing the journey
- **THEN** the completed stamp is on the page
