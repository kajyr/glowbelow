# Design

## Context

- The assembled world has one `shaft` (Twilight's top passage): a soft push from `softFrom` up, and a `lid` at the reef's seabed that holds the squid from below; a `Gate` in `main.ts` remembers a squid coming down from the reef
- `Effects` places the light rays, the warm pool of light and the top of the bubbles' rise from that same shaft (its `lid`, else the world's top)
- Home's shaft into Twilight is already open: no push, nothing closed, just a gap between zones
- The giant squid's ride and its stops (`giant-squid-first-unexplored`) search open water from the colliders only; the push and lid never mattered to them

## Goals / Non-Goals

**Goals:**
- Twilight's top passage behaves exactly like the open passage from home to Twilight
- The reef's light still shows from Twilight, in the same place

**Non-Goals:**
- Any change to the giant squid's stops, waking, dumbo's pointing or the reef's layout
- Making the passage wider or moving it (it is already 7.2 wide, as wide as home's shaft)

## Decisions

### Remove the closing, not the passage data
- The assembled world's shaft gets no lid and no soft push (`softFrom: Infinity`), like Whale fall's "no way up" shaft; the passage itself is just the gap in the blocks, as now
- The lid and the `Gate` go from `src/game/shaft.ts` and `main.ts`; `shaftPush` stays for any closed shaft, and `surfacePush` (the reef's surface) is unchanged
- Alternative: keep the lid with an "open" flag (rejected: dead code for a rule the game no longer has)

### The reef's light gets its own place
- `Effects` takes the passage's top (x range and height) directly for the rays, the warm pool of light and the bubbles' ceiling, instead of reading them from the shaft's lid
- The assembled world already knows that point (Twilight's passage, at the reef's seabed); it is passed alongside the shaft

### Tests swap one-way for both ways
- The lid tests (dash held below the lid; through from above only) become: swimming and dashing up Twilight's top passage arrive in the reef; swimming down arrives in Twilight
- The ride tests stay as they are

## Risks / Trade-offs

- [The reef found before Whale fall, so the cuttlefish and ending come before the giant squid] → fine: the game has no required order, and the ride is still there as a treat; dumbo still points at the sleeping giant squid
- [Twilight's top was a quiet "something is up there" moment] → the light rays and warm pool of light stay, now as an invitation instead of a tease
