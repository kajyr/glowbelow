## Why

GitHub issue #3 ("Il polpo dumbo: quale è il suo potere?") asks what dumbo's power is. Today dumbo follows the squid and points an ear at the nearest unlit plant: a hint, but nothing it does for the player. Sparkles are now few on purpose, so a friend who gathers them while the squid rests gives dumbo a real job and makes resting feel rewarding. The issue proposes exactly that: follow the squid, and when it stops, move around to collect the stars.

Comes before `iteration-2-twilight`, which builds on dumbo's behaviour.

## What Changes

- After being found, when the squid has been still for about 2 seconds, dumbo still points at the nearest unlit plant first (or does its happy spin when everything is lit), and then starts gathering
- Gathering: dumbo swims to the nearest drifting sparkle within about one screen of the squid, collects it with a little bounce and a soft flute note, and a small spark flies from dumbo to the squid. Each sparkle fills the squid's glow meter exactly like one the squid caught
- Dumbo never takes breadcrumb trail sparkles, so the guidance to the cave and plants stays intact
- Dumbo is slower than the squid (about one sparkle every 2–3 seconds), so resting never beats playing
- As soon as the squid moves, dumbo stops gathering and goes back to following
- Gathering happens only while the squid is still (including the pineapple pose), not while it swims slowly
- Dumbo still ignores walls and keeps above the seabed, so it can never get stuck

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `dumbo-octopus`: "Dumbo points toward unlit plants" becomes "points first, then gathers"; new requirement "Dumbo gathers sparkles"
- `game-audio`: "Dumbo has a signature sound" also covers a soft note when dumbo gathers a sparkle

## Impact

- `src/game/dumboBrain.ts`: a gathering state after pointing, with target choice, range and speed
- `src/game/sparkleField.ts`: a way to list drifting (non-trail) sparkles and to collect one on dumbo's behalf
- `src/render/sparklesView.ts` or a small effect: the spark that flies from dumbo to the squid
- `src/main.ts`: dumbo's collected sparkles fill the meter and play the note
- `src/audio/synth.ts`: dumbo's pickup note
- No new models or dependencies
