## Why

GitHub issue #1 asks for a deep-sea jellyfish that drifts very slowly around the level, with the squid losing stars when it touches it, modelled on *Stygiomedusa gigantea* (the giant phantom jelly). It adds something to steer around in the bigger home and a real midnight-zone animal to look at. The game's rules say a child can never fail and nothing is ever lost, so the touch is softened: stars spill out and float nearby, ready to be caught again. Touching the jelly has a small cost, but nothing is lost for good.

Comes before `iteration-2-twilight`.

## What Changes

- A giant phantom jelly lives in Midnight home: a pink, slightly see-through bell a little bigger than the squid and four long ribbon arms, roaming the whole zone very slowly: it drifts toward far-off spots in open water, curving around rocks, with its wandering following from the world's seed
- New model `models/phantom-jelly.glb` from a new `tools/make_phantom_jelly.py`, with the bell and the arms as separate parts so the bell can pulse and the arms sway in code
- Touching the jelly (bell or arms) gives a soft boing and spills up to 5 stars out of the glow meter; with an empty meter nothing spills. The spilled stars float out around the jelly as ordinary drifting sparkles that can be collected again
- After a touch there is a short grace period, so one touch spills only once
- The jelly can never trap the squid: the bell gives a soft push, the arms only count as a touch and do not block
- The jelly is part of the home recipe. It only moves through comfortably wide water and keeps out of the areas around the start spot, the cave entrance and the shaft; the layout validator only checks that home has enough open water for it to roam
- **BREAKING (design rule)**: "nothing is ever lost or spent" becomes "stars can spill, but can always be caught again"; `GAME_DESIGN.md` is updated to match

## Capabilities

### New Capabilities

- `phantom-jelly`: the jelly, its slow route, what touching it does, and the rule that it never traps the squid

### Modified Capabilities

- `zone-generation`: "Every zone follows its recipe" adds the phantom jelly and its route to Midnight home's recipe
- `game-audio`: a new requirement for the jelly's touch and spill sounds

## Impact

- **New model:** `tools/make_phantom_jelly.py` → `models/phantom-jelly.glb`
- **Generation:** the home recipe, the jelly's starting spot and a validator rule for enough open water
- **New game logic:** a pure jelly module in `src/game/` (free roaming, touch detection, grace period, spill amount)
- **Sparkle field:** a way to drop spilled sparkles as drifting ones
- **Rendering:** a jelly view (bell pulse, arm sway)
- **Wiring:** `main.ts` connects the jelly, the meter, the sparkle field and audio
- **Audio:** `Synth` gets the jelly's sounds
- **Docs:** `GAME_DESIGN.md` gets the softened rule
- No new dependencies
