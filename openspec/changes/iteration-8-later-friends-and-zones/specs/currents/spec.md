## Purpose

Currents are visible streams of bubbles that carry the squid along like a water slide: free rides for fun, never puzzles.

## ADDED Requirements

### Requirement: Visible bubble streams
A current SHALL be shown as a stream of moving bubbles along its path, so its direction is always visible.

#### Scenario: Seeing direction
- **WHEN** the player looks at a current
- **THEN** bubbles flowing along it show which way it goes

### Requirement: Carried along
When the squid enters a current it SHALL be carried along the path faster than it can swim, with a whoosh sound. The player SHALL still be able to steer out of the current at any time.

#### Scenario: Riding
- **WHEN** the squid swims into a current
- **THEN** it is carried along with a whoosh

#### Scenario: Leaving early
- **WHEN** the player steers sideways while in a current
- **THEN** the squid leaves the current and swims normally

### Requirement: Never required
No place SHALL be reachable only through a current, and no current SHALL carry the squid into a dead end.

#### Scenario: End of a current
- **WHEN** a current ends
- **THEN** the squid is set free in open water
