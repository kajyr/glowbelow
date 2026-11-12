## Why

The game is English first, but the family also speaks Italian. Gameplay has no text, so translating is small: the title, the album names, the fun facts, the parent corner and accessibility labels. Doing it after the four zones and five friends exist means every string is known.

Depends on: `iteration-6-sunlit-reef`.

## What Changes

- Italian translation of every string (`it.json`)
- The language is picked from the browser on first run and can be changed in the parent corner
- Friend names in both languages (for example dumbo octopus / polpo Dumbo, cuttlefish / seppia)
- A check that fails the build if a string is missing in either language

## Capabilities

### New Capabilities

- `localization`: language files, choosing the language, and completeness checks

### Modified Capabilities

- `parent-corner`: adds the language switch (new requirement)

## Impact

- New `src/i18n/it.json`; all UI reads strings through one lookup
- Language choice added to the save
- A Vitest test comparing the keys of `en.json` and `it.json`
