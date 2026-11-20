## ADDED Requirements

### Requirement: Tapping a stamp plays a fun fact
Tapping a found stamp SHALL play its sound followed by one of its fun facts at random, as defined in `fun-facts`. A new tap SHALL stop the fact playing and start over. Tapping a silhouette SHALL play nothing.

#### Scenario: Found friend
- **WHEN** the player taps dumbo's stamp after finding dumbo
- **THEN** dumbo's sound plays, then one of dumbo's fun facts

#### Scenario: Tapping again mid-fact
- **WHEN** the player taps dumbo's stamp while a dumbo fact is playing
- **THEN** that fact stops, and dumbo's sound plays, then a different dumbo fact

#### Scenario: Not found yet
- **WHEN** the player taps the nautilus's silhouette
- **THEN** nothing plays
