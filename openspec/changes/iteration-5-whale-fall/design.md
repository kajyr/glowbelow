## Context

- The zone graph, follower behaviour, riding (from the nautilus) and saving already exist from iterations 2 and 3
- The giant squid model is built in profile, facing right, at its own size; the game scales it up

## Goals / Non-Goals

**Goals:**
- Reuse the nautilus riding code for the arm ride
- Keep a model several times the squid's size cheap to animate

**Non-Goals:**
- No new mechanics beyond waking and riding

## Decisions

### Ride as a shared "carrier" behaviour
- The nautilus seat and the giant squid arm both become carriers: a path, a seat point, hop-off on input
- The giant squid's path targets "top of the world", resolved from the zone graph, so it reaches the reef automatically in iteration 6

### Giant squid animation by parts
- Body sways slowly; arms are separate nodes with a gentle wave; the offering arm is one tentacle node rotated toward the squid
- Eye open/closed by scaling the eye node

### Skeleton and fish are `.glb` models
- `tools/make_whale_skeleton.py` builds skull, spine and ribs in one model, each rib a named part; the game finds rib parts by name to light them and use them as note targets, with rib colliders in `src/levels/pieces.ts`
- `tools/make_small_fish.py` builds one tiny fish, instanced in small schools here and reused in later zones

### Rib notes on a fixed scale
- Ribs map to a pentatonic scale rising toward the head, reusing the sparkle note synth

## Risks / Trade-offs

- [The giant squid fills the screen] → keep it partly behind the skull and camera-aware scale; tune in playtest
- [A full meter is needed to wake it and the child doesn't know] → the giant squid stirs on small pulses, and dumbo points at it until it is awake

## Migration Plan

Save format bumps a version to add Whale fall ids and the giant squid state; the upgrade fills them with "not found".
