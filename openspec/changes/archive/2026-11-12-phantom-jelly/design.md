## Context

- **Home generation:**
  - `generateValidZone` (`src/levels/generateValid.ts`) builds the layout, then the clearance `Fields`, then the trails, then checks the rules
  - The fields know where the squid can comfortably swim (`wideReach`, at least 1.3 units from anything)
  - `Level` is the data every system reads
- **Collision:**
  - `collide` (`src/game/collision.ts`) pushes the squid out of static circles, floor and ceiling a share of the overlap per second, and removes most of the speed into the wall
  - A bump is a contact faster than half the top speed
- **Sparkles:**
  - `GlowMeter` counts in steps of 1/15
  - `SparkleField` holds a fixed list of sparkles; collected ones wait (`respawnIn`) and come back from the top of the view
  - The squid's magnet pulls sparkles within 1.9 units
  - `SparklesView` sizes its instanced mesh once from the field's length, so the number of sparkles cannot grow at runtime
- **Models:** come from Python scripts through `tools/lowpoly.py`, with named parts pivoted for animation in code

## Goals / Non-Goals

**Goals:**
- Jelly logic (route following, touch, grace, spill amount, push) is pure and tested like the rest of `src/game/`
- The route is generated and validated with the layout, so a bad route rejects the seed like any other rule
- Spilled stars are real sparkles: same pickup, same meter, same respawn

**Non-Goals:**
- No reaction to the glow pulse (it could be added later)
- No jelly in Twilight (later if wanted)
- The design document's other "deferred challenges" stay deferred

## Decisions

### The model
- `tools/make_phantom_jelly.py`:
  - **bell:** a wide, low pink dome with a glowing rim; part `bell`, pivoted at its centre
  - **arms:** four long, flat, wavy pink ribbons hanging from under the bell; parts `arm-1` … `arm-4`, pivoted where they join the bell
- Built at twice the game size and drawn at 0.5: in the game the bell is about 1.6 units across and the arms about 2.75 long (halved after the first look in the game, which was too big)
- Low-poly and flat-shaded like everything else. The body uses the environment material (dark like the rocks, lit by pulses and plants), drawn a little see-through (opacity 0.72) and front faces only (the ribbons' front and back faces flicker otherwise); the rim glows on its own

### The jelly roams freely instead of following a route
- First version: a loop of 4–6 waypoints generated with the layout. It kept to one area of home, and long loops failed validation. Replaced by free roaming, so the jelly wanders the whole zone and never constrains level design
- **Free area:** after the clearance fields, every cell where the jelly fits is marked:
  - its whole box (bell above and to the sides, arms below; about x ± 0.9, y − 3.2 … y + 1.2) is in `wideReach`
  - it is at least 10 units from the start spot and 8 from the cave
  - it is outside the shaft column
- **Validator:** the rule `jelly-space` only checks that home has enough free area (at least about 150 square units) and a starting spot in it, at least a screen from the start. `Level` gains `jelly: { start: Vec2 }`; the free area is recomputed from the fields at load
- **Free area:** only the largest connected stretch is kept, so the jelly can never start in, or reach, a small pocket with no way out
- **Movement (pure, in `Jelly`):**
  - it picks a random free spot at least 20 units away and asks the area for a path: a search over free cells, straightened wherever a clear line allows (checked cell by cell, so a line cannot clip a blocked corner)
  - it drifts along the path at constant speed; on arrival it picks the next spot
  - a path always exists inside one connected area and every point on it is free, so it never touches rock and never stops
  - its drawn heading eases toward the direction it moves
- First tried steering (look ahead, turn toward free directions, escape when stuck): it kept stalling in narrow corners of the free area, so it was replaced by the path-based roaming above
- **Seed:** its random stream is derived from the world seed, so the same seed gives the same wandering, and adding it does not change the rest of the layout

### Jelly logic in `src/game/jelly.ts`
- **Speed:** 0.6 units/s (the squid swims at 4.5)
- **Shape:** the bell is a circle (radius about 0.8); each arm is a short chain of small circles hanging below the bell. Logic uses a fixed shape; the sway is only visual
- **Touch:** the squid's circle overlaps the bell or an arm circle. A touch starts a 2 s grace period and returns a `touch` event with the touch point
- **Spill:** `min(5, sparkles in the meter)`; `GlowMeter.spill(n)` removes whole steps and returns how many it removed
- **Push:**
  - the bell pushes the squid out like a soft wall, along the line from the bell's centre
  - if the squid is already touching a static wall or rock this step, the bell does not push it further into it, so a slow bell can never squeeze the squid
  - the arms never push
- **Bounce:** on a touch the squid's velocity is set to 5 units/s away from the bell (or from the arm it touched) and steering pauses for the wall bump's 0.35 s, so the bounce shows even when the player keeps steering into the jelly; about half a squid width while steering, a full width without input (added after the first play: the squid used to just stop against the bell)
- Alternative: make the jelly a static collider in the collision world (it moves, so it would need rebuilding every frame, and walls do not yield)

### Spilled stars reuse sparkles waiting to respawn
- `SparkleField.spill(at, n)` takes sparkles that are waiting to respawn (or, if none, the drifting ones farthest from the view) and places them at the touch point
- Each one gets an outward drift that slows down, so they float out about 2.5–4 units around the jelly (raised from 1.5–3 after playing)
- Each gets a short pickup delay (about 1 s), so the squid's magnet does not pull them straight back. After that they are ordinary drifting sparkles
- Keeps the total number of sparkles constant, so the instanced mesh never overflows

### Feedback
- `JellyView`:
  - draws the model at the jelly's position
  - pulses the bell (scale)
  - sways the arms with phase-shifted rotations
  - brightens the bell's rim for a moment on a touch
- `Synth.jellyBoing()`: a low, soft sine boing (lower and slower than the bump boing)
- `Synth.spill()`: 3 short soft notes going down the pentatonic scale
- `GAME_DESIGN.md`: "Nothing is ever lost or spent" becomes "Nothing is ever lost for good: stars can spill, but can always be caught again". The phantom jelly is added to the world section

## Risks / Trade-offs

- [Touching feels like punishment for a 6-year-old] → soft sounds, stars stay right there to catch again, a grace period, a very slow jelly; tuned in playtest
- [The jelly blocks a narrow way] → it only moves through wide water, the bell yields when the squid is against a wall, and the arms never block
- [The jelly gets stuck in a corner] → it only moves to free points, turns toward free directions, and heads for a far free spot if it stops making progress; tested over ten minutes on many seeds
- [Spilled stars vanish if no sparkle is waiting] → falls back to moving the farthest drifting sparkles; there are always ~100
- [Homes without room for the jelly] → the `jelly-space` rule is loose; measured in the 500-seed test

## Migration Plan

- No saved data yet. Existing seeds keep their layout, because the jelly has its own random stream; homes simply gain a jelly
- Rollback: remove the jelly from the recipe

## Open Questions

- The jelly's speed and spill count: 0.6 units/s and 5 stars (raised from 3 after playing); tune further after playing
