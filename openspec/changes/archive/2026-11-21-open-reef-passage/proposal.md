## Why

The Sunlit reef is the only zone a child cannot swim to: Twilight's top passage turns the squid back, and only the giant squid's arm goes up. A child who never wakes the giant squid never sees the reef, the cuttlefish or the ending. Opening the passage removes the game's one gate, so every zone is open by swimming, as the rest of the game already is.

Depends on: `iteration-6-sunlit-reef` (archive it first: its delta specs add the reef and the one-way passage this change opens).

## What Changes

- Twilight's top passage into the Sunlit reef is open both ways, like home's shaft into Twilight: no soft push turning the squid back, no lid holding it below the reef
- The reef's light still shines down through the passage, so the way up is easy to spot from Twilight
- The giant squid's arm stays as an express lift (Twilight first, then the reef), but it is no longer the only way into the reef
- Friends never gate progress, with no exception: the project rules (`AGENTS.md`) and `GAME_DESIGN.md` drop the giant squid exception
- Dumbo keeps pointing at the sleeping giant squid in Whale fall (a ride is still a treat); nothing else changes

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `twilight`: the top passage is open both ways (replaces "Top passage is one-way" from `iteration-6-sunlit-reef`; layout wording updated)
- `sunlit-reef`: the squid arrives by swimming up from Twilight or on the giant squid's arm (modified "Reef layout")
- `giant-squid`: the ride is an express lift, no longer the only way into the reef (modified "The way up")

## Impact

- `src/game/shaft.ts`: the lid and the gate go; the shaft push no longer applies to Twilight's top passage
- `src/levels/assembleWorld.ts`: the assembled world's shaft no longer closes Twilight's top (no lid, no soft wall)
- `src/main.ts`: the gate state goes
- `src/render/effects.ts`: the light rays and the warm pool of light keep their place at Twilight's top passage without relying on the lid
- Tests: the one-way tests in `src/game/shaft.test.ts` and `src/levels/assembleWorld.test.ts` become "swims up into the reef and back down"
- Docs: `AGENTS.md` design rules, `GAME_DESIGN.md` (structure, friends, zones), `docs/itch/description.md` if it mentions the gate
- No save change: nothing about the passage is saved
- Dev blog: a short post (or a section in the day's post) saying the reef can now be reached by swimming up Twilight
