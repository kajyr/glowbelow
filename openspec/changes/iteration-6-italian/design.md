## Context

- All strings already live in `src/i18n/en.json` since iteration 1, but may be read directly in places
- Only a few dozen strings exist; no plurals or formatting beyond names

## Goals / Non-Goals

**Goals:**
- One lookup function for every string, language switchable at run time

**Non-Goals:**
- No more languages yet, though adding one should be one new file
- No voice-over (iteration 7)

## Decisions

### Tiny in-house lookup instead of an i18n library
- `t(key)` reads from the active dictionary, falls back to English; UI elements re-render on a `languagechange` event
- Alternative: i18next (dependency far bigger than the problem)

### Flat keys grouped by screen
- Keys like `album.friend.cuttlefish`, `parent.reset.confirm`; easy to diff between files

### Completeness enforced by a test
- A Vitest test fails if the key sets differ or a value is empty

## Risks / Trade-offs

- [Italian strings longer than English break layouts] → buttons sized for the longer language; check every screen in both languages
- [Translation quality] → native-speaker review by the user before release

## Migration Plan

Save version bump adds `language`, filled from the browser setting on upgrade.
