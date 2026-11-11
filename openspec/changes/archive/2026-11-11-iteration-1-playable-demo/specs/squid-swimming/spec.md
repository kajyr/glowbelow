## Purpose

How the player moves the vampire squid: touch and keyboard input, the floaty forgiving movement, soft collisions and the animation that gives the squid its personality.

## ADDED Requirements

### Requirement: Touch steering
On touch screens the squid SHALL swim toward the point where the player's finger is held, and SHALL slow to a gentle hover when it reaches that point. Lifting the finger SHALL let the squid drift to a stop.

#### Scenario: Hold to swim
- **WHEN** the player holds a finger above and to the right of the squid
- **THEN** the squid swims toward the finger and hovers there

#### Scenario: Release
- **WHEN** the player lifts the finger while the squid is moving
- **THEN** the squid glides to a stop within about 1 second, without stopping dead

### Requirement: Keyboard steering
On a keyboard the arrow keys and WASD SHALL move the squid in 8 directions, with the same acceleration and drift as touch steering.

#### Scenario: Diagonal
- **WHEN** the player holds the up and right arrows together
- **THEN** the squid swims diagonally up-right at the same top speed as a straight swim

### Requirement: Mouse steering
With a mouse, holding the button SHALL steer the squid toward the pointer, the same as touch.

#### Scenario: Click and hold
- **WHEN** the player holds the mouse button to the left of the squid
- **THEN** the squid swims left toward the pointer

### Requirement: Floaty, forgiving movement
The squid SHALL accelerate and decelerate smoothly, SHALL never stop instantly, and SHALL never get stuck on walls, corners or other objects.

#### Scenario: Corner
- **WHEN** the player steers the squid into a corner of the cave
- **THEN** the squid slides along the walls and can always swim back out

### Requirement: Soft walls
Rocks, the seabed, the cave and the zone edges SHALL gently push the squid away instead of stopping it hard.

#### Scenario: Seabed
- **WHEN** the squid swims down into the seabed
- **THEN** it is eased back up to just above the seabed

### Requirement: Bump reaction
Hitting a wall at more than half of top speed SHALL make the squid do a short silly spin and leave a small sparkle cloud. A bump SHALL cost nothing and SHALL NOT interrupt control for more than half a second.

#### Scenario: Fast bump
- **WHEN** the squid swims at full speed into a rock
- **THEN** it spins once, a sparkle cloud appears, and control returns within 0.5 seconds

#### Scenario: Slow touch
- **WHEN** the squid drifts slowly into a rock
- **THEN** no spin happens; it is only pushed gently away

### Requirement: The squid faces where it swims
The squid SHALL turn to face its direction of travel, head leading and cape trailing, and SHALL turn toward the camera when hovering still.

#### Scenario: Turning around
- **WHEN** the squid is swimming right and the player steers left
- **THEN** the squid turns smoothly to face left within about half a second

### Requirement: Squid animation
The squid SHALL be animated without hand-made rigs: the cape pulses with each stroke while swimming, the ear fins flap, the eyes blink every few seconds, and after about 4 seconds without input the squid curls into the "pineapple pose" (cape wrapped up into a spiky ball) and pops back when the player moves.

#### Scenario: Idle
- **WHEN** the player gives no input for 4 seconds
- **THEN** the squid curls into the pineapple pose

#### Scenario: Waking from idle
- **WHEN** the player moves while the squid is in the pineapple pose
- **THEN** the squid pops open and swims immediately
