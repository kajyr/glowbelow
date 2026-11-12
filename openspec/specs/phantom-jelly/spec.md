# phantom-jelly Specification

## Purpose

The giant phantom jelly is a slow, beautiful deep-sea animal drifting through Midnight home. It gives the player something to steer around: touching it spills a few stars, which can always be caught again.

## Requirements

### Requirement: The phantom jelly roams slowly through home
Midnight home SHALL contain one giant phantom jelly, modelled on *Stygiomedusa gigantea*: a pink, slightly see-through bell about 1.6 units across (a little bigger than the squid) and four long ribbon arms trailing below it. It SHALL roam the whole zone freely and very slowly, much slower than the squid: it drifts toward a far-off spot in its open water, curving around rocks on the way, and then sets off for the next one, with its bell gently pulsing and its arms swaying. Its wandering SHALL follow from the world's seed, so the same seed gives the same wandering.

#### Scenario: Watching it
- **WHEN** the player watches the jelly for a minute
- **THEN** it has drifted a short way, pulsing and swaying the whole time, going around anything in its way

#### Scenario: Roaming
- **WHEN** the game runs for ten minutes
- **THEN** the jelly has wandered across a large part of the zone, not just one area

#### Scenario: Easy to avoid
- **WHEN** the squid swims toward the jelly at normal speed
- **THEN** the squid can easily swim around it

### Requirement: The jelly keeps to open water and never gets stuck
The jelly SHALL only move through comfortably wide water (at least about two squid widths from rocks, seabed and ceiling, allowing for its own size), SHALL keep out of the area around the squid's start spot, the cave entrance and the shaft, and SHALL never get stuck: it always keeps moving. Every generated home SHALL have enough open water for the jelly to roam.

#### Scenario: Any seed
- **WHEN** the jelly roams any generated home for ten minutes
- **THEN** it never enters a rock, the seabed, the start area, the cave entrance or the shaft, and it never stays in one place

### Requirement: Touching the jelly spills stars
When the squid touches the jelly's bell or arms, a soft boing SHALL play, the squid SHALL bounce away from the jelly (a short pause in steering lets the bounce show, as with a wall bump), and up to 5 sparkles SHALL leave the glow meter. When the meter is empty, nothing SHALL spill. The spilled sparkles SHALL float out around the point of the touch as ordinary drifting sparkles that can be collected again in the usual way.

#### Scenario: Bouncing off
- **WHEN** the squid swims into the jelly, even with the player still steering toward it
- **THEN** it visibly bounces back away from the jelly before steering takes over again

#### Scenario: Touch with stars in the meter
- **WHEN** the squid touches the jelly with 10 sparkles in the meter
- **THEN** the meter drops by 5 sparkles and 5 sparkles float out nearby

#### Scenario: Touch with an empty meter
- **WHEN** the squid touches the jelly with an empty meter
- **THEN** a boing plays and nothing spills

#### Scenario: Catching them again
- **WHEN** the squid collects the spilled sparkles
- **THEN** each one fills the meter again like any other sparkle

### Requirement: One touch spills once
After a touch, there SHALL be a short grace period of about 2 seconds during which touching the jelly again spills nothing.

#### Scenario: Staying in contact
- **WHEN** the squid stays against the jelly for one second
- **THEN** only one spill happens

### Requirement: The jelly never traps the squid
The jelly's bell SHALL gently push the squid away, like a soft moving wall. The arms SHALL count as a touch but SHALL NOT block the squid. The squid SHALL always be able to swim away from the jelly, even when the jelly drifts over it near a wall.

#### Scenario: Squeezed against a rock
- **WHEN** the jelly drifts toward the squid while the squid is next to a rock
- **THEN** the squid can still swim out, and is never held in place

#### Scenario: Through the arms
- **WHEN** the squid swims through the jelly's arms
- **THEN** it passes through them (after the touch), without being stopped
