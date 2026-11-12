## Why

Fun facts are read by the device's speech voice, which sounds flat on many tablets. A familiar voice (a parent) is warmer and easier for a 6-year-old to follow. The player already picks a recording when one exists. What's missing is an easy way to make the recordings and a guard that keeps them correct.

Depends on: `iteration-4-offline-and-voice` (takes over its task 3.4).

## What Changes

- A recording script for grown-ups: every fun fact, per language, with the file name to save it as, plus short recording tips
- The script is generated from the language files, and a test fails when it is out of date
- Recording tips: quiet room, a phone is fine, a short mono `.mp3`, silence trimmed, one take per fact
- Recordings live at `voice/<lang>/<stamp>.mp3`; any subset is fine, and missing facts still use the device voice
- A check that fails when a recording does not match a language and a stamp with a fact, or is too big
- The first recordings the user provides are added and checked on a tablet

## Capabilities

### New Capabilities

- `voice-recordings`: the recording script, the file rules, and the checks that keep recordings in sync with the facts

### Modified Capabilities

- None. The fun-facts playback rule ("a recording wins") is unchanged.

## Impact

- New `tools/make_voice_script.py`, writes `docs/voice/README.md`
- New Vitest checks for the script and the `voice/` folder
- Optional `.mp3` files under `voice/<lang>/` (they're precached, so they count toward the offline download)
- `iteration-4-offline-and-voice`: task 3.4 moves here
- No new runtime dependency
