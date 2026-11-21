# Tasks

## 1. Open the passage

- [x] 1.1 In `src/levels/assembleWorld.ts`, give the assembled world no closed way up (no lid, no soft push) and expose Twilight's top passage (x range and the reef's seabed height) for the reef's light; update the doc comment; verify `npm test`
- [x] 1.2 Remove the lid and `Gate` from `src/game/shaft.ts` (keep `shaftPush` for closed shafts and `surfacePush`) and the gate state from `src/main.ts`; verify type-check
- [x] 1.3 Replace the lid tests in `src/game/shaft.test.ts` and `src/levels/assembleWorld.test.ts` with: swimming up Twilight's top passage arrives in the reef, dashing up too, swimming down arrives in Twilight; verify over several seeds

## 2. Keep the reef's light at the passage

- [x] 2.1 Make `src/render/effects.ts` place the light rays, the warm pool of light and the bubbles' ceiling from the passage's top passed in, not from the shaft's lid; verify by looking up from the top of Twilight in the game

## 3. Docs

- [x] 3.1 Drop the giant squid exception from the design rules in `AGENTS.md` ("Friends never gate progress")
- [x] 3.2 Update `GAME_DESIGN.md`: structure (no gates), the giant squid as an express lift, Twilight's way up to the reef
- [x] 3.3 Check `docs/itch/description.md` for the gate and fix it if it mentions one

## 4. Verification

- [x] 4.1 In a new game, swim from home up through Twilight into the reef without waking the giant squid; swim back down; verify no push back and nothing stuck
- [x] 4.2 Run `npm test` and `npm run build`; verify both pass

## 5. Dev blog

- [x] 5.1 Write `docs/itch/devlog/YYYY-MM-DD-open-reef.md` (or a section in that day's post): the reef can now be reached by swimming up Twilight, the giant squid is an express lift; a screenshot of the squid swimming up through the passage into the reef; what's next

## Workflow follow-up

- Archive `iteration-6-sunlit-reef` before archiving this change (its deltas add the one-way passage this change removes)
- Release with `just release`, then publish the dev blog post
