## ADDED Requirements

### Requirement: Speaker icon on found stamps
Each found stamp with a fun fact SHALL show a large speaker icon (a hit area of at least 64 px) that plays its fun fact, as defined in `fun-facts`, instead of the stamp's own sound. Silhouettes of stamps not found yet SHALL NOT show it.

#### Scenario: Tapping the speaker
- **WHEN** the player taps the speaker icon on dumbo's stamp
- **THEN** dumbo's fun fact is spoken

#### Scenario: Unfound friend
- **WHEN** the player looks at a silhouette
- **THEN** no speaker icon is shown
