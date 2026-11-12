## 1. Recording script

- [ ] 1.1 Add `tools/make_voice_script.py` writing `docs/voice/README.md`: tips (quiet room, phone is fine, mono `.mp3`, trim silence, re-record when a line changes, recordings are public), an optional `ffmpeg` convert line, then one table per language with stamp, text and file name; verify the generated file reads well
- [ ] 1.2 Add a Vitest test that every `facts.*` text in each language file appears in the README next to its file name; verify it fails after editing a fact without regenerating

## 2. Recording checks

- [ ] 2.1 Add a Vitest test over `voice/` (Node `fs`): only `<lang>/<stamp>.mp3` with a language file and a `facts.<stamp>` in it; verify it names a misspelled file and an unknown language
- [ ] 2.2 Add the size limits (250 KB per file, 3 MB in all) to that test; verify it names an oversized file and its size
- [ ] 2.3 Keep `voice/` in the repo while it is empty (`.gitkeep`), and confirm the glob and tests accept an empty folder; verify `npm test` and `npm run build` pass with no recordings

## 3. First recordings

- [ ] 3.1 Add the recordings the user provides under `voice/<lang>/`; verify the checks pass
- [ ] 3.2 On a tablet, play a recorded and an unrecorded fact; verify the recording plays for one and the device voice for the other, both offline

## 4. Verification

- [ ] 4.1 Run `npm test` and `npm run build`; verify both pass
