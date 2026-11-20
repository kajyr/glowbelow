## Context

- `src/audio/facts.ts` finds recordings at build time with `import.meta.glob('../../voice/*/*.mp3')`. A recording wins over the device voice.
- Facts are one `facts.<stamp>` key per animal in `src/i18n/en.json`; `it.json` arrives with `iteration-7-italian`.
- `src/ui/album.ts`: tapping a found stamp plays its sound; a separate speaker icon for the fact sits behind `FACT_SPEAKER = false`.
- `tools/` holds plain-Python generators (models, icons); generated files are committed.
- Gemini's API has text-to-speech models with prebuilt multilingual voices; a text prompt steers the reading style. It returns raw 24 kHz mono PCM.

## Goals / Non-Goals

**Goals:**
- Each animal has a few facts, so repeated taps keep teaching something new
- One command turns the language files into narrated facts that sound good on a tablet
- Mistakes (wrong name, huge file, stale recording) are caught by `npm test`, not on the tablet
- Editing or adding a fact never needs an API key just to pass the tests

**Non-Goals:**
- No recording inside the game (no microphone, no upload)
- No hand-made recordings: Gemini is the only source
- No AI at play time: files are made once and shipped
- No subtitles or transcripts on screen (the game stays text-free)
- No "heard every fact" tracking or reward

## Decisions

### Facts as numbered keys: `facts.<stamp>.<n>`
- Flat keys, like every other string in `en.json`; `n` runs from 1 with no gaps
- `facts.ts` lists an animal's facts by counting keys up from 1
- Recording file `<stamp>.<n>.mp3` maps one-to-one to the key. Alternative: arrays in the JSON (the i18n layer only holds strings)

### Fact picker in `src/game/`
- Pure function: `pickFact(count, last, random)` returns a number from 1 to `count`, never `last` when `count > 1`
- Last fact per animal kept in memory only (not saved); a reload may repeat once, which is fine
- `random` injected, so the tests are deterministic

### Stamp tap: sound, then fact
- Tapping a found stamp plays its sound; the fact starts when the sound ends
- A new tap stops the current fact and starts over with a new pick
- The speaker icon and `FACT_SPEAKER` are removed: one big target is easier for a 6-year-old

### Generator `tools/make_voice.py`
- Plain Python with `urllib` against the Gemini REST API: no SDK to install, like the other generators. Alternative: the `google-genai` package (a pip dependency for one call)
- Constants at the top: model id, voice name, style prompt (e.g. "Read slowly and warmly, for a 6-year-old"). The current TTS model id is checked when building it, not fixed here
- Reads `GEMINI_API_KEY` from the environment; stops with a clear message when it or `ffmpeg` is missing
- Remakes a fact only when its text, the voice or the style differs from the manifest; `--only <stamp>.<n>` remakes one on demand (for a bad take)
- Removes recordings and manifest entries for facts that no longer exist

### Manifest `voice/manifest.json`
- One entry per file: `{ "en/dumbo.1": { "text": …, "voice": …, "style": … } }`
- Stores the full text, not a hash, so a diff shows what changed
- Gemini's output differs from run to run, so the manifest is also what stops reruns from churning committed files

### Conversion with `ffmpeg`
- PCM → mono 48 kbps `.mp3`, leading and trailing silence trimmed, loudness normalised to sit with the game's sounds
- 48 kbps is plenty for one speaking voice
- A dev-machine tool only, like `butler`; not an npm or runtime dependency

### Checks in a Vitest test next to `facts.ts`
- Lists `voice/**` with Node `fs` (not the glob), so a misnamed or wrong-type file is caught too
- Validates `<lang>/<stamp>.<n>.mp3` against the language files and their `facts.<stamp>.<n>` keys
- Staleness: each recording needs a manifest entry whose `text` equals the current fact; the message names `python3 tools/make_voice.py`
- A fact without a recording is fine (device voice), so adding a fact without a key still passes
- A test that every findable animal has 3–4 facts in each language
- Size limits: 200 KB per file, 2 MB per language
  - A 10 s fact at 48 kbps mono is about 60 KB; 28 facts ≈ 1.7 MB
  - Two languages keep the recordings around 3.5 MB of the precache
- Alternative: checking in the Vite build (would only fail at build, not in `npm test`)

### Format: `.mp3` only
- Plays on iOS Safari, Chrome and Firefox; one extension keeps the rules simple

### Voice pick
- Generate one dumbo fact with 3–4 voices into a scratch folder; the user picks by ear on the tablet
- Same voice for every language: the prebuilt voices are multilingual, and one familiar voice suits the game

## Risks / Trade-offs

- [A fact is wrong] → Facts are written from well-known sources and the user reviews every one before generating; no "record" claims that may go stale.
- [Creature names mispronounced] → Listen to every file once; fix with `--only` reruns or by tweaking the style prompt. Rewording the fact is the last resort.
- [Output changes between runs] → The manifest skips facts that haven't changed, so committed files stay put.
- [Offline download grows] → 48 kbps and the per-language limit keep it near 1.7 MB per language.
- [API key leak] → Env var only, never written to a file; the script never logs it.
- [AI-generated audio not disclosed] → The itch.io AI statement and "Audio" flag are updated in the same iteration.
- [Model or voice retired] → Existing files keep working; only new facts would need a new voice, and changing the constant remakes them all in one run.

## Migration Plan

- `facts.<stamp>` becomes `facts.<stamp>.1`; the old keys go away in the same commit
- No saved state changes: the last-played fact is not saved
