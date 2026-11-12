## Purpose

The firefly squid are a giggly group of tiny glowing friends: found in small groups around Twilight, they join the vampire squid as a swarm that grows and makes shapes.

## ADDED Requirements

### Requirement: Firefly groups in Twilight
Twilight SHALL contain five groups of about six firefly squid each, hovering in place and twinkling.

#### Scenario: Groups visible
- **WHEN** the squid explores Twilight
- **THEN** small twinkling groups of fireflies can be seen at different heights

### Requirement: Glowing near a group adds it to the swarm
When a glow pulse reaches a group, the group SHALL giggle, swirl, and join the squid's swarm. The first group found SHALL send a firefly sticker to the album button.

#### Scenario: First group
- **WHEN** a pulse reaches a firefly group for the first time
- **THEN** the group joins the swarm and a sticker flies to the album button

#### Scenario: Later groups
- **WHEN** a pulse reaches another group
- **THEN** that group joins the swarm, with no extra sticker

### Requirement: Swarm follows the squid
The swarm SHALL trail behind the squid in a loose, lively cloud that never blocks the view of the squid.

#### Scenario: Trailing
- **WHEN** the squid swims with fireflies in its swarm
- **THEN** the fireflies follow behind in a loose cloud

### Requirement: Bigger swarms make shapes
When the squid hovers still for about 2 seconds, the swarm SHALL arrange itself into a shape that depends on how many groups have joined: an arrow pointing at the nearest unlit thing with 1–2 groups, a star with 3–4, and a heart with all 5.

#### Scenario: Full swarm
- **WHEN** all five groups have joined and the squid hovers still
- **THEN** the swarm forms a heart around the squid

#### Scenario: Pointing arrow
- **WHEN** one group has joined and the squid hovers still with unlit lanterns nearby
- **THEN** the swarm forms an arrow pointing at the nearest unlit lantern
