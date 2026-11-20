## Purpose

Publishes the game on Google Play as a paid app for young children, with a repeatable way to build, sign and upload new versions that stay in step with the web release.

## ADDED Requirements

### Requirement: Signed app bundle from one command
A single command SHALL run the tests, build the game for the app and produce a signed Android App Bundle ready for upload to Google Play. Signing keys and passwords SHALL be read from outside the repository and SHALL never be committed.

#### Scenario: Building a release
- **WHEN** the release command is run on a machine with the signing key set up
- **THEN** a signed `.aab` file is produced

#### Scenario: Missing key
- **WHEN** the release command is run without the signing key
- **THEN** it stops with a message naming what is missing and produces no bundle

### Requirement: Version follows the game
The app's visible version SHALL equal the version in `package.json`, and its internal build number SHALL increase with every release so Google Play accepts each upload.

#### Scenario: After a minor bump
- **WHEN** `package.json` goes from 0.5.0 to 0.6.0 and the bundle is built
- **THEN** the app shows version 0.6.0 and its build number is higher than 0.5.0's

### Requirement: Runs on current Android devices
The app SHALL target the Android API level Google Play currently requires for new uploads, SHALL install on phones and tablets running Android 8 or newer with WebGL 2, and SHALL keep the 60 fps goal of `game-shell` on a mid-range Android tablet.

#### Scenario: Mid-range tablet
- **WHEN** the app runs on a mid-range Android tablet during a big glow pulse with dumbo following
- **THEN** the frame rate stays at or near 60 fps

### Requirement: Paid with nothing to buy inside
The Play listing SHALL be a one-time paid download. The app SHALL contain no ads, no in-app purchases, no subscriptions, no account or sign-in, and no analytics or tracking.

#### Scenario: Playing after purchase
- **WHEN** a family buys and installs the app
- **THEN** the whole game is available with nothing more to buy and nothing to sign in to

### Requirement: Listed for families
The app SHALL be enrolled in Google Play's Families program with a target age group that includes 6-year-olds, and SHALL meet that program's rules. Its content rating SHALL be suitable for everyone.

#### Scenario: Store check
- **WHEN** the Play listing is viewed
- **THEN** it shows an "Everyone" rating and is eligible for the kids' section

### Requirement: Privacy declared honestly
The listing SHALL link to a public privacy policy page stating that the game collects no personal data and sends nothing off the device. The Play Data safety form SHALL declare no data collected and no data shared.

#### Scenario: Reading the privacy policy
- **WHEN** a parent follows the privacy policy link on the Play listing
- **THEN** a page opens stating that no data is collected or shared

### Requirement: Store page
The Play listing SHALL have the game's title, icon, a feature graphic, at least four landscape screenshots from the game, and a short and a full description stating it is a peaceful game for young children with no text needed to play. The listing text SHALL live in the repository.

#### Scenario: Listing check
- **WHEN** the Play listing is viewed on a phone and on a tablet
- **THEN** title, icon, feature graphic, screenshots and descriptions are shown

### Requirement: Store media made from the game
A single command SHALL produce every store screenshot, the feature graphic and a 20–30 second promo video with the game's own sound, at the sizes Google Play requires, from fixed worlds so the same command gives the same scenes. The video SHALL show only real gameplay and no text beyond the title.

#### Scenario: Refreshing the media
- **WHEN** the capture command is run after an iteration
- **THEN** new screenshots, feature graphic and video of the current game are written to `docs/play/`, at Play's sizes

### Requirement: Store forms filled from the repository
All listing text and every answer to the Play Console forms SHALL be kept in `docs/play/`, and the agent SHALL enter them in the Play Console through the browser. The user SHALL only sign in, verify identity, set up payments and accept legal agreements. Nothing SHALL be sent for review or rolled out without the user's go-ahead.

#### Scenario: Publishing an update
- **WHEN** a new version is ready for Play
- **THEN** the agent uploads it, fills the release and listing changes, and asks the user before sending it for review

#### Scenario: A step needs the user
- **WHEN** the console asks for a sign-in, identity check, payment detail or agreement
- **THEN** the agent stops and asks the user to do that step, then carries on

### Requirement: Tested before release
Each new version SHALL be uploaded to a Play testing track and installed on at least one Android tablet before it is promoted to production.

#### Scenario: New version
- **WHEN** a new bundle is uploaded
- **THEN** it reaches testers first, and production only after it has been played on a real tablet

### Requirement: Kept in step with the game
After each iteration is archived and released on itch.io, a Play update with the same version SHALL be built and submitted, and the listing text and screenshots SHALL be updated to match the game.

#### Scenario: After an iteration
- **WHEN** an iteration is archived and released
- **THEN** a Play update with the same version number is submitted
