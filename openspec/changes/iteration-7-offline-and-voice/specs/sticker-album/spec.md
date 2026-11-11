## ADDED Requirements

### Requirement: Speaker icon on friend pages
Each found friend's album page SHALL show a large speaker icon that plays the friend's fun fact, as defined in `fun-facts`. Pages of friends not found yet SHALL NOT show it.

#### Scenario: Tapping the speaker
- **WHEN** the player taps the speaker icon on dumbo's page
- **THEN** dumbo's fun fact is spoken

#### Scenario: Unfound friend
- **WHEN** the player views a silhouette page
- **THEN** no speaker icon is shown
