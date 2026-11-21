## ADDED Requirements

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

