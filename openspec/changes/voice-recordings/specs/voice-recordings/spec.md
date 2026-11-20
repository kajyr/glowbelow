## Purpose

Gives every fun fact a natural, AI-generated narration, and keeps those recordings matched to the facts the game actually has.

## ADDED Requirements

### Requirement: Generated recordings
The project SHALL include one command that, for each language file, makes a recording of every fun fact that has none or whose recording is out of date, using one shared voice and style prompt. It SHALL leave up-to-date recordings untouched, and SHALL record in `voice/manifest.json` the text, voice and style each file was made from.

#### Scenario: New fact added
- **WHEN** `facts.dumbo.4` is added to `en.json` and the command is run
- **THEN** only `voice/en/dumbo.4.mp3` is made, and the manifest gains its entry

#### Scenario: Nothing changed
- **WHEN** the command is run twice in a row
- **THEN** the second run makes no files and leaves the manifest unchanged

### Requirement: Recordings stay in sync
Every recording SHALL have a manifest entry, and its text SHALL equal the fact's current text in that language. The tests SHALL fail otherwise, naming the file and the command to run. A fact with no recording SHALL NOT fail the tests.

#### Scenario: Fact reworded
- **WHEN** `facts.dumbo.1` in `en.json` is reworded and the command is not run
- **THEN** the tests fail and name `voice/en/dumbo.1.mp3`

#### Scenario: Fact added, not generated
- **WHEN** a fun fact is added and has no recording
- **THEN** the tests pass and the device voice reads it

### Requirement: Recordings are optional and partial
Any subset of the fun facts MAY have a recording. Facts without one SHALL still be read by the device voice, and the game SHALL build and play with an empty `voice/` folder.

#### Scenario: Only one fact recorded
- **WHEN** only `voice/en/dumbo.1.mp3` exists
- **THEN** that fact plays the recording and every other fact uses the device voice

### Requirement: Recordings match a fact
Every `.mp3` in `voice/` SHALL be named `<lang>/<stamp>.<n>.mp3`, where `<lang>` has a language file and `facts.<stamp>.<n>` is a fun fact in that language. The tests SHALL fail otherwise, naming the file.

#### Scenario: Misspelled file
- **WHEN** a recording is saved as `voice/en/dumbo-octopus.1.mp3`
- **THEN** the tests fail and name that file

#### Scenario: Fact that does not exist
- **WHEN** a recording is saved as `voice/en/dumbo.7.mp3` and dumbo has four facts
- **THEN** the tests fail and name that file

#### Scenario: Unknown language
- **WHEN** a recording is saved under `voice/fr/`
- **THEN** the tests fail, as there is no French language file

### Requirement: Recordings stay small
Each recording SHALL be at most 200 KB, and the recordings of one language together SHALL be at most 2 MB, so the offline download stays small. The tests SHALL fail when either limit is passed.

#### Scenario: Uncompressed file
- **WHEN** a 2 MB recording is added
- **THEN** the tests fail and name the file and its size
