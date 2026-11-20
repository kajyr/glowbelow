# Design

## Context

- `ridePath(w)` searches open water from the giant squid's arm to `w.landing` (Sunlit reef) and is the only destination
- `GiantSquid` builds one `Carrier` lazily from a `() => Vec2[]` callback and keeps it forever; the return trip runs the same carrier backwards
- `main.ts` caches the path (`ride ??= ridePath(...)`) and warms it up with `setTimeout` on wake / restore, since the search covers the whole world
- `worldState.dashUnlocked` is set (and saved) the first time the squid is in the `twilight` zone
- `gameWorld.entries.twilight` already exists: centre of home's shaft passage, 3 units above Twilight's floor, inside Twilight's zone rect

## Goals / Non-Goals

**Goals:**
- Pick the drop-off at boarding time, so a squid that swam to Twilight on its own gets the reef on its next ride
- Keep the ride search lazy and cached, one path per destination

**Non-Goals:**
- A general "visited zones" record in the save
- Stops at Midnight home or Whale fall (always already explored on the way to the arm)
- Any change to hopping off, the return trip, waking or dumbo's pointing

## Decisions

### Two stops: `'twilight' | 'reef'`
- A small pure helper picks the stop: `twilightReached ? 'reef' : 'twilight'`
- Reef is the last stop, so whether the reef was visited never matters
- Alternative: compute "first unexplored" over the zone graph — rejected, only two candidates exist on the way up

### "Twilight reached" = `worldState.dashUnlocked`
- It already means exactly "the squid has reached Twilight once", and it is saved
- Old saves work with no migration
- Alternative: new `visited` zone list in the save (version 3) — rejected for one bit that already exists; revisit if more stops appear

### Twilight drop-off = `entries.twilight`
- Already the "start of Twilight" spot used for continued games; inside the zone rect, so arriving there unlocks dash through the existing zone check
- Expose it as `GameWorld.twilightLanding` (alias of the entry) only if it reads clearer; otherwise use `entries.twilight`

### `ridePath(w, stop)` with a separate search per stop
- Same search as today, target chosen by stop; results cached per stop in `main.ts`
- Alternative: cut the reef path where it enters Twilight — rejected, the cut point would land wherever the route crosses, not at a known safe spot

### `GiantSquid` asks for the stop at boarding
- Constructor gets `nextStop: () => RideStop` and `ridePath: (stop) => Vec2[]`
- On board: if the stop differs from the current carrier's, build a new carrier; otherwise reuse it
- The carrier is never swapped mid-ride or mid-return, so the trip home still retraces the ride
- Warm-up in `main.ts` precomputes the path for the stop that would be chosen now

## Risks / Trade-offs

- [Second world search when the stop flips to the reef] → it happens at the next boarding after Twilight is reached; warm it up when dash unlocks (a calm moment) as well as on wake
- [Drop-off near the nautilus in Twilight's shaft] → nothing collides with the giant squid or blocks the squid; the squid simply swims off
- [Tying the ride to the dash flag] → if dash unlocking ever moves, the ride must get its own flag; note it in a code comment
