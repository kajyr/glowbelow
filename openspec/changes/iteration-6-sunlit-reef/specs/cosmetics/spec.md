## Purpose

Cosmetics let the player change how the squid looks, unlocked by playing rather than bought. The first cosmetic is the colour of the squid's glow.

## ADDED Requirements

### Requirement: Glow colours
The squid SHALL start with its teal glow colour. Up to five more glow colours (pink, amber, lavender, coral, sky blue) SHALL be unlockable through the cuttlefish's colour game.

#### Scenario: Default
- **WHEN** a new game starts
- **THEN** the squid's glow is teal

### Requirement: Switching glow colour
The player SHALL be able to switch to any unlocked glow colour from a colour row on the album's squid page, by tapping a colour or using arrows and Space.

#### Scenario: Switching back to teal
- **WHEN** the player taps teal on the squid page
- **THEN** the squid's glow becomes teal again

### Requirement: Nothing is bought or lost
Cosmetics SHALL never cost sparkles or anything else, and unlocked cosmetics SHALL never be taken away.

#### Scenario: Unlock is permanent
- **WHEN** a colour has been unlocked and the player continues a later session
- **THEN** the colour is still available

### Requirement: Saved choice
Unlocked colours and the chosen colour SHALL be saved.

#### Scenario: Next session
- **WHEN** the player chose pink and continues later
- **THEN** the squid's glow is pink
