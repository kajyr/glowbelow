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
After being found, when the squid stops for about 2 seconds, dumbo SHALL turn toward the nearest unlit glow plant and point at it with a wiggle of an ear. When every plant is lit, dumbo SHALL instead do a happy spin. Right after pointing or spinning, dumbo SHALL start gathering sparkles as described in "Dumbo gathers sparkles".

#### Scenario: Pointing
- **WHEN** the squid hovers still for 2 seconds and unlit plants remain
- **THEN** dumbo turns and wiggles an ear toward the nearest unlit plant

#### Scenario: Everything lit
- **WHEN** the squid hovers still and every plant is lit
- **THEN** dumbo does a happy spin instead of pointing

#### Scenario: Pointing, then gathering
- **WHEN** dumbo has pointed and the squid stays still
- **THEN** dumbo starts swimming to nearby sparkles

### Requirement: Dumbo reacts to glows
After being found, dumbo SHALL react to each glow pulse with a small bounce.

#### Scenario: Bounce
- **WHEN** the squid glows with dumbo nearby
- **THEN** dumbo bounces

### Requirement: Dumbo gathers sparkles
While the squid stays still after dumbo has pointed (or spun), dumbo SHALL swim to the nearest drifting sparkle within about one screen of the squid and collect it, then move on to the next. Each sparkle dumbo collects SHALL fill the squid's glow meter exactly as if the squid had collected it, with a little bounce and a small spark flying from dumbo to the squid. Dumbo SHALL never collect sparkles that are part of a trail. Dumbo SHALL gather more slowly than the squid can collect (about one sparkle every 2 to 3 seconds). As soon as the squid moves, dumbo SHALL stop gathering and return to following. While gathering, dumbo SHALL still never get stuck and SHALL stay above the seabed.

#### Scenario: Resting while dumbo gathers
- **WHEN** the squid stays still for 10 seconds with drifting sparkles nearby
- **THEN** dumbo collects several of them one after another and the glow meter rises with each

#### Scenario: Spark to the squid
- **WHEN** dumbo collects a sparkle
- **THEN** a small spark flies from dumbo to the squid as the meter fills

#### Scenario: Trails stay
- **WHEN** dumbo gathers next to a sparkle trail
- **THEN** the trail's sparkles are left in place

#### Scenario: Only nearby
- **WHEN** the only drifting sparkles are more than a screen away from the squid
- **THEN** dumbo stays near the squid and does not go after them

#### Scenario: Moving again
- **WHEN** the squid starts swimming while dumbo is gathering
- **THEN** dumbo stops and follows the squid again

#### Scenario: Pineapple pose
- **WHEN** the squid curls into the pineapple pose
- **THEN** dumbo keeps gathering

#### Scenario: Before being found
- **WHEN** dumbo has not been found yet
- **THEN** no sparkles are gathered for the squid
