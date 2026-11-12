## Context

- `DumboBrain` (`src/game/dumboBrain.ts`) is pure logic: states `hidden` → `popping` → `following`. While following, `watchStillness` counts how long the squid's speed stays under `stillSpeed`; after `pointAfter` (2 s) it points once (or returns a `spin` event when every plant is lit) and then does nothing until the squid moves again
- `SparkleField` (`src/game/sparkleField.ts`) holds every sparkle with a `kind` (`trail` or `drift`), `alive`, `pulled` (being pulled by the squid's magnet) and handles collection and respawn. Collected trail sparkles come back as drifting ones
- `main.ts` turns collected sparkles into `meter.add()`, `synth.sparkle()` and `sparkles.pop()`; `SparklesView` already draws short-lived effect sparkles
- The squid's pineapple pose starts after 4 s without input; the squid is then still, so it counts as still for dumbo

## Goals / Non-Goals

**Goals:**
- Gathering is decided in `DumboBrain` and tested without a browser, like the rest of dumbo's behaviour
- Dumbo's sparkles go through the same path as the squid's (meter, respawn), so nothing is counted twice or lost

**Non-Goals:**
- No new model or animation rig; the bounce and ear flaps already exist
- Gathering does not change Twilight plans; lanterns come with `iteration-2-twilight`

## Decisions

### Gathering is an activity inside `following`
- `following` gains an activity: `follow` (as today) or `gather`. Pointing stays the trigger: after the point or spin, the activity becomes `gather` until the squid moves
- Alternative: a separate top-level state (more transitions to keep right for `popping`/`hidden`, no gain)

### The brain gets candidates, the field does the collecting
- Each step `main.ts` passes the brain the drifting sparkles that are alive and not being pulled by the squid: a list of `{ index, x, y }` from a new `SparkleField.drifting()`
- The brain picks the candidate nearest to dumbo among those in a box around the squid that stays inside the visible screen (7 units left and right, 4.5 up and down; a 16-unit circle let dumbo gather off screen, found in the browser), swims to it at `gatherSpeed`, and returns a `gather` event with the index when within reach
- `main.ts` calls `SparkleField.collect(index)`, which collects it like a squid pickup (respawn rules unchanged) and returns its position, or null if it was already gone; only then does the meter fill
- Trail sparkles are never in the list, so dumbo cannot take them by construction
- Alternative: let the brain mutate the field (mixes two modules and makes tests harder)

### Pace
- `gatherSpeed` about 2.4 units/s (squid top speed is 4.5) and a pause of about 1 s after each pickup (the bounce), with a minimum of 2 s between pickups
- Targets are re-chosen every step, so a sparkle the squid's magnet takes or one that drifts out of range is simply dropped

### Movement while gathering
- Same easing as following, toward the target instead of the follow point; walls are still ignored and the seabed clamp still applies, so dumbo cannot get stuck
- With no candidate in range, dumbo hovers at its follow point

### Feedback
- `SparklesView.fly(from, to)`: a single effect sparkle that travels from dumbo to the squid in about 0.5 s and ends in the existing pop
- Dumbo does its hop (`DumboView.hop`) on each pickup
- `Synth.dumboNote()`: one short sine with a little vibrato from the pentatonic scale, quieter than the sparkle notes; respects mute like every sound

## Risks / Trade-offs

- [Resting becomes the best way to fill the meter] → slower than swimming (one sparkle per 2–3 s at best) and only drifting sparkles within one screen
- [Dumbo leaves the screen chasing a sparkle] → targets must be within one screen of the squid, and the follow-camera keeps the squid central
- [Gathering competes with the squid's magnet] → sparkles being pulled by the squid are excluded from the candidates
- [Pointing and gathering feel like one long sequence] → pointing still plays first with its flute call, and gathering starts after the point
