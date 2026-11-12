## 1. Lookup

- [ ] 1.1 Add `src/i18n/index.ts` with `t(key)`, English fallback and a `languagechange` event; verify Vitest tests for lookup and fallback
- [ ] 1.2 Replace every direct string use in the UI with `t(key)`; verify a search finds no hard-coded user-facing text outside the language files

## 2. Italian

- [ ] 2.1 Write `src/i18n/it.json` with every key, including friend names; verify the key-completeness test passes
- [ ] 2.2 Translate every `facts.<friend>` into `it.json`; verify the device's Italian voice reads each one
- [ ] 2.3 Add the user's review of the Italian text; verify corrections are applied

## 3. Choosing the language

- [ ] 3.1 Pick the language from the browser on first run; verify in an Italian and an English browser
- [ ] 3.2 Add `language` to the save with an upgrade; verify a Vitest test upgrading an iteration 6 save
- [ ] 3.3 Add the language switch to the parent corner, applying immediately; verify text changes without losing progress
- [ ] 3.4 Translate accessible labels; verify with a screen reader or the accessibility inspector

## 4. Verification

- [ ] 4.1 Visit every screen in both languages on a tablet; verify no text overflows
- [ ] 4.2 Run `npm test` and `npm run build`; verify both pass
