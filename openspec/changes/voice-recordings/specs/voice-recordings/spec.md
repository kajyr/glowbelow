## Purpose

Lets a grown-up record the fun facts in their own voice, and keeps those recordings matched to the facts the game actually has.

## ADDED Requirements

### Requirement: Recording script
The project SHALL include a recording script listing, for each language, every fun fact's text next to the exact file name to save its recording as, plus short recording tips. The script SHALL be generated from the language files, and the tests SHALL fail when a fact is missing from the script or its text differs.

#### Scenario: New fact added
- **WHEN** a fun fact is added to `en.json` and the script is not regenerated
- **THEN** the tests fail and name the missing fact

#### Scenario: Reading the script
- **WHEN** a grown-up opens the script
- **THEN** each line shows the stamp, the text to read and a file name such as `voice/en/dumbo.mp3`

### Requirement: Recordings are optional and partial
Any subset of the fun facts MAY have a recording. Facts without one SHALL still be read by the device voice, and the game SHALL build and play with an empty `voice/` folder.

#### Scenario: Only dumbo recorded
- **WHEN** only `voice/en/dumbo.mp3` exists
- **THEN** dumbo's fact plays the recording and every other fact uses the device voice

### Requirement: Recordings match a fact
Every file in `voice/` SHALL be named `<lang>/<stamp>.mp3`, where `<lang>` has a language file and `<stamp>` has a fun fact in that language. The tests SHALL fail otherwise, naming the file.

#### Scenario: Misspelled file
- **WHEN** a recording is saved as `voice/en/dumbo-octopus.mp3`
- **THEN** the tests fail and name that file

#### Scenario: Unknown language
- **WHEN** a recording is saved under `voice/fr/`
- **THEN** the tests fail, as there is no French language file

### Requirement: Recordings stay small
Each recording SHALL be at most 250 KB, and all recordings together SHALL be at most 3 MB, so the offline download stays small. The tests SHALL fail when either limit is passed.

#### Scenario: Uncompressed upload
- **WHEN** a 2 MB recording is added
- **THEN** the tests fail and name the file and its size
