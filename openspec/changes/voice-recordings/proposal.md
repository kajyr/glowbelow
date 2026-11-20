## Why

Fun facts are read by the device's speech voice, which sounds poor on tablets. The album's speaker icon was taken out until the facts sound good. Gemini's text-to-speech voices sound natural and can be told how to read (slowly, warmly, for a 6-year-old). One fact per animal also runs out fast: a child taps the same stamp again and again, so each animal needs a few facts that come up at random.

Depends on: `iteration-4-offline-and-voice` (takes over its task 3.4).

## What Changes

- 3–4 short, true fun facts for every animal that can be found (7 today), written for a 6-year-old
- Tapping a found stamp plays its sound, then one of its facts at random, never the same one twice in a row; silhouettes stay silent
- The separate speaker icon is dropped: the stamp itself is the button
- Keys become `facts.<stamp>.<n>`; recordings become `voice/<lang>/<stamp>.<n>.mp3`
- `tools/make_voice.py` sends each fact, per language, to the Gemini text-to-speech API and saves its `.mp3`
- One voice and one style prompt for every language, picked by ear from a few samples
- `voice/manifest.json` records the text, voice and style behind each file; a rerun only remakes facts whose text (or voice, or style) changed
- Any subset of facts may have a recording; the rest still use the device voice
- A check that fails when a recording does not match a language and a fact, is too big, or was made from text that has since changed
- Recordings at 48 kbps mono; limits 200 KB per file and 2 MB per language
- Every English fact is generated, listened to, and checked on a tablet
- The itch.io AI disclosure says the fun-fact voice is AI-generated

## Capabilities

### New Capabilities

- `voice-recordings`: the generator, the file rules, and the checks that keep recordings in sync with the facts

### Modified Capabilities

- `fun-facts`: 3–4 facts per animal instead of one, played at random
- `sticker-album`: tapping a found stamp plays its sound, then a random fact

## Impact

- `src/i18n/en.json`: `facts.<stamp>` split into `facts.<stamp>.1` … `.4`
- New fact picker in `src/game/` (pure logic, tested); `src/audio/facts.ts` and `src/ui/album.ts` updated; `FACT_SPEAKER` removed
- New `tools/make_voice.py` and `voice/manifest.json`
- Generating needs a `GEMINI_API_KEY` env var (never committed) and `ffmpeg` on the dev machine; playing, testing and building need neither
- New Vitest checks for the `voice/` folder and the manifest
- `.mp3` files under `voice/<lang>/` (they're precached, so they count toward the offline download)
- `docs/itch/description.md`: AI disclosure updated; the itch.io "Audio" AI flag set
- `iteration-4-offline-and-voice`: task 3.4 moves here
- `iteration-7-italian`: about four times as many facts to translate
- No new runtime dependency
