## 1. Saving

- [ ] 1.1 Give every plant, lantern and friend a stable id in the level files; verify a Vitest test that ids are unique
- [ ] 1.2 Implement `src/game/save.ts` (serialise `WorldState` with a version, debounce, upgrade, validate, fall back to new game); verify Vitest tests for round trip, corrupted data and blocked storage
- [ ] 1.3 Trigger saves on lighting, finding, zone crossing and page hide; verify progress survives closing and reopening the tab
- [ ] 1.4 Make the title screen continue a save or start new; verify both cases

## 2. Album

- [ ] 2.1 Build the album overlay with open/close by tap, A key and Escape, pausing logic; verify play resumes where it was
- [ ] 2.2 Add friend pages with picture, name from `en.json`, sound on tap, and silhouettes for unfound friends; verify with a fresh and a full save
- [ ] 2.3 Add the starfish page per zone; verify counts match found starfish
- [ ] 2.4 Add swipe, arrow controls and arrow-key page turning; verify on a tablet and a laptop
- [ ] 2.5 Show the badge for unviewed friend pages and clear it when viewed; verify

## 3. Parent corner

- [ ] 3.1 Add the 3-second long-press control with a filling ring and Shift+P; verify a short tap does nothing
- [ ] 3.2 Add music and effects volume, saved with progress; verify each slider affects only its sounds
- [ ] 3.3 Add reset with confirmation returning to the title; verify reset and cancel

## 4. Bubble rings

- [ ] 4.1 Write `tools/make_bubble_ring.py` (a ring of about 12 bubbles, each a separate part so they can pop one by one); verify in the viewer
- [ ] 4.2 Add the pop/re-form animation by scaling the bubble parts; verify it re-forms within 5 s
- [ ] 4.3 Add speed push and rising notes per chain with a finishing flourish; verify Vitest tests for chain order and by listening
- [ ] 4.4 Place one chain in Midnight home and one in Twilight; verify both are reachable

## 5. Starfish

- [ ] 5.1 Write `tools/make_starfish.py` (chunky five-arm star with each arm a part, small eyes, emissive tips for the lit state); verify dim and lit looks in the viewer
- [ ] 5.2 Add dim, lit and wave states by animating the arm parts; verify by observation
- [ ] 5.3 Place five starfish per zone with ids and connect them to pulses and saving; verify finding, no double count, and the zone celebration

## 6. Verification

- [ ] 6.1 Play a full session on a tablet, close the tab, reopen and continue; verify everything found is still there and the album matches
- [ ] 6.2 Run `npm test` and `npm run build`; verify both pass
