# dumbo-octopus Specification

## Purpose

The dumbo octopus is the squid's best friend and the demo's first discovery: hidden in the cave of Midnight home, found by glowing, and then a companion that follows the squid and helps find unlit plants.

## Requirements

### Requirement: Dumbo hides in the cave
Before it is found, dumbo SHALL be hidden in the cave of Midnight home, shown only as two eyes that blink in the dark every few seconds.

#### Scenario: Before discovery
- **WHEN** the squid swims near the cave without glowing
- **THEN** only two blinking eyes are visible in the cave

### Requirement: Found by glowing
When any glow pulse reaches the cave, dumbo SHALL pop out, do a happy spin and play its signature sound. This SHALL happen only once per session.

#### Scenario: Discovery
- **WHEN** a small or big pulse reaches the cave for the first time
- **THEN** dumbo pops out, spins, and plays its sound

#### Scenario: Cannot be missed
- **WHEN** the player glows anywhere inside the cave
- **THEN** dumbo is found

### Requirement: Sticker fly-in
When dumbo is found, a dumbo sticker SHALL fly from dumbo to the album button in the corner of the screen, which then shows a small badge. In this iteration tapping the album button SHALL only make it wiggle; the album opens in a later iteration.

#### Scenario: Sticker
- **WHEN** dumbo is found
- **THEN** a sticker flies to the album button and the button shows a badge

### Requirement: Dumbo follows the squid
After being found, dumbo SHALL follow the squid at a short distance, floating with its ears flapping and skirt pulsing, never blocking the squid and never getting stuck. If it falls far behind it SHALL catch up.

#### Scenario: Following
- **WHEN** the squid swims across the zone
- **THEN** dumbo follows behind at a short distance

#### Scenario: Left behind
- **WHEN** the squid swims quickly far away from dumbo
- **THEN** dumbo catches up within a few seconds

### Requirement: Dumbo points toward unlit plants
After being found, when the squid stops for about 2 seconds, dumbo SHALL turn toward the nearest unlit glow plant and point at it with a wiggle of an ear. When every plant is lit, dumbo SHALL instead do a happy spin.

#### Scenario: Pointing
- **WHEN** the squid hovers still for 2 seconds and unlit plants remain
- **THEN** dumbo turns and wiggles an ear toward the nearest unlit plant

#### Scenario: Everything lit
- **WHEN** the squid hovers still and every plant is lit
- **THEN** dumbo does a happy spin instead of pointing

### Requirement: Dumbo reacts to glows
After being found, dumbo SHALL react to each glow pulse with a small bounce.

#### Scenario: Bounce
- **WHEN** the squid glows with dumbo nearby
- **THEN** dumbo bounces
