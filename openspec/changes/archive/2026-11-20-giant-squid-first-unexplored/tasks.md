# Tasks

## 1. Ride path per stop

- [x] 1.1 In `src/levels/assembleWorld.ts`, add `RideStop = 'twilight' | 'reef'` and make `ridePath(w, stop)` search to `w.entries.twilight` or `w.landing`; verify `npm run build` passes
- [x] 1.2 In `assembleWorld.test.ts`, extend the ride test: for seeds 18–20 the `'twilight'` path starts at the arm, ends within 1.5 of `entries.twilight`, ends in zone `twilight`, and stays in open water; the `'reef'` case keeps today's checks; verify `npm test` passes

## 2. Giant squid picks the stop at boarding

- [x] 2.1 Add a pure helper `rideStop(twilightReached: boolean): RideStop` and test both cases; verify `npm test` passes
- [x] 2.2 In `src/game/giantSquid.ts`, take `nextStop: () => RideStop` and `ridePath: (stop) => Vec2[]`; on boarding, rebuild the carrier only when the stop changed; never swap it mid-ride or on the way home; update the class comment
- [x] 2.3 In `giantSquid.test.ts`: first ride ends at the twilight path's end; after the stop flips, the next ride ends at the reef path's end; the return trip retraces the ride it just made; the path is still asked for only when first needed (once per stop); verify `npm test` passes

## 3. Wiring

- [x] 3.1 In `src/main.ts`, cache one path per stop, pass `() => rideStop(worldState.dashUnlocked)` to the giant squid, and comment that "Twilight reached" is the dash flag; verify `npm run build` passes
- [x] 3.2 Warm up the path for the current stop on wake and restore, and the reef path when dash unlocks; verify in `npm run dev?debug` that no frame hitch shows on the first ride
- [x] 3.3 Play check (`npm run dev`, fresh game): wake the giant squid without visiting Twilight → set down just inside Twilight, dash unlocks; ride again → set down in the Sunlit reef; reload a save that has dash → ride goes to the reef

## 4. Docs

- [x] 4.1 Update `GAME_DESIGN.md` giant squid lines ("lifts you all the way up to the reef", "Ride the arm up to the top of the world") to say it takes you to the next place you haven't been: Twilight first, then the reef; verify the gates rule line still holds
- [x] 4.2 Check `docs/itch/description.md` for the same claim and update it if present

## Workflow follow-up

- Archive the change with the `opsx` archive skill, which syncs the `giant-squid` delta into `openspec/specs/`
- Release per `AGENTS.md` (`just release`, devlog, itch page) if this ships on its own
