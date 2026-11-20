# giant-squid Specification

## Purpose

The giant squid is the enormous, gentle friend asleep in Whale fall: woken by a big glow, it carries the squid on its arm up to the top of the world, and it is the only way into the Sunlit reef.

## Requirements

### Requirement: Asleep behind the skull
Before it is woken, the giant squid SHALL lie asleep behind the whale skull, mostly hidden, breathing slowly with its huge eye closed. Small pulses SHALL make it stir in its sleep but not wake.

#### Scenario: Small pulse
- **WHEN** a small pulse reaches the sleeping giant squid
- **THEN** it stirs and settles back to sleep

### Requirement: Woken by a big glow
A big (full-meter) pulse reaching the giant squid SHALL wake it: it opens its eye, rises slowly, plays its deep gentle sound, and a sticker flies to the album button. Its album page SHALL show its fun fact as text.

#### Scenario: Waking
- **WHEN** a big pulse reaches the sleeping giant squid
- **THEN** it wakes, rises, plays its sound, and its sticker is added to the album

### Requirement: Gentle presence
The awake giant squid SHALL move slowly, keep its eye looking at the vampire squid, and never block the squid's path.

#### Scenario: Watching
- **WHEN** the vampire squid swims around the awake giant squid
- **THEN** the giant squid's eye follows it

### Requirement: The way up
Touching the awake giant squid's offered arm SHALL let the squid ride it up and set it down at the first zone on the way up it has not reached yet: just inside the bottom of Twilight until the squid has reached Twilight once, then the Sunlit reef. Steering away during the ride SHALL hop off. After setting the squid down, the giant squid SHALL sink back to its spot in Whale fall, and the squid swims back down by itself. The ride SHALL be the only way into the Sunlit reef; this is the one place where a friend gates progress.

#### Scenario: Express lift
- **WHEN** the squid touches the offered arm
- **THEN** the arm carries the squid up and sets it down at the first zone on the way up it has not reached yet

#### Scenario: First stop is Twilight
- **WHEN** the squid has never reached Twilight and touches the offered arm
- **THEN** the arm sets it down just inside the bottom of Twilight, and Twilight counts as reached (dash unlocks)

#### Scenario: Then the reef
- **WHEN** the squid has reached Twilight before (this session or a saved game) and touches the offered arm
- **THEN** the arm carries it past Twilight and sets it down in the Sunlit reef

#### Scenario: Reef already visited
- **WHEN** the squid has already been to the Sunlit reef and touches the offered arm
- **THEN** the arm sets it down in the Sunlit reef again

#### Scenario: Hopping off
- **WHEN** the player steers away during the ride
- **THEN** the squid hops off where it is and swims on

#### Scenario: Going home
- **WHEN** the giant squid has set the squid down
- **THEN** it sinks back to Whale fall, where it can be ridden again

### Requirement: Never stuck behind the gate
The way to the giant squid SHALL always be findable: dumbo SHALL point at it while it sleeps (as defined in `dumbo-octopus`), and the whale song SHALL fill the glow meter needed to wake it.

#### Scenario: Dumbo shows the way
- **WHEN** every rib is lit, the giant squid is asleep and the squid hovers still
- **THEN** dumbo points at the giant squid

### Requirement: Saved
The giant squid's awake state SHALL be saved, so it stays awake in later sessions.

#### Scenario: Next session
- **WHEN** the player continues a game where the giant squid was woken
- **THEN** the giant squid is awake
