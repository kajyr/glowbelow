## 1. More facts

- [ ] 1.1 Write 3–4 short, true facts for each findable animal (dumbo, starfish, phantom jelly, firefly squid, lantern jelly, nautilus, giant squid) as `facts.<stamp>.<n>` in `en.json`, replacing `facts.<stamp>`; the user reviews every fact
- [ ] 1.2 Add a Vitest test that every findable animal has 3–4 facts with no gaps in each language file; verify it fails with a gap or only two facts

## 2. Random fact on stamp tap

- [ ] 2.1 Add `pickFact` in `src/game/` with tests: always in range, never the last one when there are two or more, works with one fact
- [ ] 2.2 Update `src/audio/facts.ts`: list an animal's facts, pick one, find `voice/<lang>/<stamp>.<n>.mp3` or fall back to the device voice; update its tests
- [ ] 2.3 In `src/ui/album.ts`, tapping a found stamp plays its sound, then a random fact; a new tap stops the current fact; remove `FACT_SPEAKER` and the speaker icon; verify silhouettes stay silent and closing or muting stops the fact

## 3. Generator

- [ ] 3.1 Add `tools/make_voice.py`: Gemini TTS over `urllib` (`GEMINI_API_KEY`), model id / voice / style as constants, PCM → mono 48 kbps `.mp3` via `ffmpeg` (silence trimmed, loudness normalised), writes `voice/<lang>/<stamp>.<n>.mp3`; verify it stops with a clear message without the key or `ffmpeg`
- [ ] 3.2 Write `voice/manifest.json` (text, voice, style per file), skip facts that match it, remove files for facts that are gone; add `--only <stamp>.<n>`; verify a second run makes no files
- [ ] 3.3 Generate one dumbo fact with 3–4 voices into the scratch folder; the user picks the voice and style by ear on a tablet; set the constants

## 4. Checks

- [ ] 4.1 Add a Vitest test over `voice/` (Node `fs`): only `<lang>/<stamp>.<n>.mp3` with a language file and a `facts.<stamp>.<n>` in it; verify it names a misspelled file, a fact number that doesn't exist, and an unknown language
- [ ] 4.2 Add the size limits (200 KB per file, 2 MB per language) to that test; verify it names an oversized file and its size
- [ ] 4.3 Add the staleness check: each recording has a manifest entry whose text equals the current fact; verify it fails after rewording a fact and names the file and `python3 tools/make_voice.py`, and that a fact with no recording passes
- [ ] 4.4 Keep `voice/` in the repo while it is empty (`.gitkeep`), and confirm the glob and tests accept an empty folder; verify `npm test` and `npm run build` pass with no recordings

## 5. First recordings

- [ ] 5.1 Generate every English fact; listen to each and remake bad takes with `--only`; verify the checks pass and English stays under 2 MB
- [ ] 5.2 On a tablet, offline, tap a found stamp several times; verify the sound plays, then a different recorded fact each time, at a level that sits with the game's sounds
- [ ] 5.3 Decide with the user whether facts without a recording use the device voice or stay silent, based on how it sounds on the tablet

## 6. AI disclosure

- [ ] 6.1 Update the AI disclosure in `docs/itch/description.md`: the fun-fact voice is generated with Gemini, made once and shipped, no AI at play time (replace "There are no audio files")
- [ ] 6.2 On the live itch.io page, paste the new statement and tick the "Audio" AI flag (by hand unless a browser tool is connected)

## 7. Verification

- [ ] 7.1 Run `npm test` and `npm run build`; verify both pass
