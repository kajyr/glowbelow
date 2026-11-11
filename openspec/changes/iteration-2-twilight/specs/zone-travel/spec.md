## Purpose

Joins separate zones into one connected world the squid can swim through freely, with no loading screens and nothing locked.

## ADDED Requirements

### Requirement: Zones are connected by open passages
Zones SHALL be joined by wide, obvious passages. Swimming through a passage SHALL move the squid into the next zone without a loading screen, fade or loss of control.

#### Scenario: Swimming up from home
- **WHEN** the squid swims up through Midnight home's shaft
- **THEN** it arrives in Twilight while the player keeps control the whole time

### Requirement: Camera works across zones
The camera SHALL follow the squid across a zone border smoothly and SHALL never show empty space outside the world: where zones do not fill the view, rock fills it.

#### Scenario: At a border
- **WHEN** the squid hovers in the passage between two zones
- **THEN** parts of both zones are visible and the camera does not jump

#### Scenario: Beside a narrow zone
- **WHEN** the squid is at the bottom corner of Twilight, above Midnight home's ceiling
- **THEN** the view beside Twilight shows rock, not empty water

### Requirement: Zones keep their state
Lit plants, lanterns and found friends SHALL stay as they were when the squid leaves a zone and comes back during the same session.

#### Scenario: Coming back home
- **WHEN** the squid lights plants in home, swims to Twilight, and returns
- **THEN** the plants are still lit

### Requirement: Friends travel with the squid
Dumbo and the firefly swarm SHALL follow the squid from zone to zone.

#### Scenario: Dumbo comes along
- **WHEN** the squid swims from home into Twilight with dumbo found
- **THEN** dumbo arrives in Twilight shortly after the squid

### Requirement: Mood changes between zones
Each zone SHALL have its own background colour, fog and ambient sound, blending smoothly across passages.

#### Scenario: Colour blend
- **WHEN** the squid swims from home up into Twilight
- **THEN** the water colour shifts gradually from navy to blue-lavender

### Requirement: Light stays smooth across zones
Lit plants, lit lanterns and pulses near the border SHALL all keep lighting their surroundings when both zones are in view, with no light flickering on or off as the camera moves.

#### Scenario: Looking down from Twilight
- **WHEN** the squid is at the bottom of Twilight with many home plants lit below
- **THEN** both the lit plants below and the lit lanterns nearby light their surroundings
