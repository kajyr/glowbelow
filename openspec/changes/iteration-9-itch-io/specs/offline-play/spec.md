## ADDED Requirements

### Requirement: No service worker when embedded on itch.io
When the game runs inside an itch.io frame, it SHALL NOT register a service worker, and SHALL play normally online. Offline play and home-screen install SHALL remain available from the game's own address.

#### Scenario: Played on itch.io
- **WHEN** the game is opened from its itch.io page
- **THEN** no service worker is registered and the game plays normally

#### Scenario: Own address unchanged
- **WHEN** the game is opened from its own address
- **THEN** offline play and install work as before
