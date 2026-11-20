## Purpose

Publishes the game on the App Store as a paid app in the Kids category, with a repeatable way to build, sign and upload new versions that stay in step with the web release.

## ADDED Requirements

### Requirement: Signed build uploaded from one command
A single command SHALL run the tests, build the game for the app, produce a signed iOS build and upload it to App Store Connect. Certificates, keys and passwords SHALL be read from outside the repository and SHALL never be committed.

#### Scenario: Building a release
- **WHEN** the release command is run on a Mac with signing set up
- **THEN** a signed build appears in App Store Connect, ready for TestFlight

#### Scenario: Missing credentials
- **WHEN** the release command is run without the upload key
- **THEN** it stops with a message naming what is missing and uploads nothing

### Requirement: Version follows the game
The app's visible version SHALL equal the version in `package.json`, and its build number SHALL increase with every upload so App Store Connect accepts it.

#### Scenario: After a minor bump
- **WHEN** `package.json` goes from 0.5.0 to 0.6.0 and the app is uploaded
- **THEN** App Store Connect shows version 0.6.0 with a higher build number than 0.5.0

### Requirement: Runs on iPad and iPhone
The app SHALL install on iPads and iPhones running a supported iOS version with WebGL 2, SHALL be playable by touch on both, and SHALL keep the 60 fps goal of `game-shell` on a recent base-model iPad.

#### Scenario: Base-model iPad
- **WHEN** the app runs on a recent base-model iPad during a big glow pulse with dumbo following
- **THEN** the frame rate stays at or near 60 fps

#### Scenario: iPhone
- **WHEN** the app runs on an iPhone in landscape
- **THEN** the game is playable by touch with every control at least 64 px

### Requirement: Paid with nothing to buy inside
The App Store listing SHALL be a one-time paid download. The app SHALL contain no ads, no in-app purchases, no subscriptions, no account or sign-in, and no analytics, tracking or third-party code that collects data.

#### Scenario: Playing after purchase
- **WHEN** a family buys and installs the app
- **THEN** the whole game is available with nothing more to buy and nothing to sign in to

### Requirement: Kids category
The app SHALL be listed in the App Store Kids category for ages 6–8 and SHALL meet Apple's rules for it: no links out of the app, no requests for personal data, no advertising, and nothing outside the app reachable without a parental gate.

#### Scenario: Store check
- **WHEN** the App Store listing is viewed
- **THEN** it shows the Kids category with the 6–8 age band

### Requirement: Privacy declared honestly
The listing SHALL link to the public privacy policy page shared with the Android release, and the App Store privacy label SHALL be "Data Not Collected". The app SHALL ship a privacy manifest consistent with that label.

#### Scenario: Reading the label
- **WHEN** a parent opens the app's privacy section on the App Store
- **THEN** it says "Data Not Collected" and links to the privacy policy page

### Requirement: Store page
The App Store listing SHALL have the game's title, subtitle, icon, landscape screenshots for the iPad and iPhone sizes the store requires, and a description stating it is a peaceful game for young children with no text needed to play. The listing text SHALL live in the repository.

#### Scenario: Listing check
- **WHEN** the App Store listing is viewed on an iPad and on an iPhone
- **THEN** title, icon, screenshots and description are shown

### Requirement: Store media made from the game
The store capture command SHALL also produce the App Store screenshots and 15–30 second app preview videos with the game's own sound, at the iPad and iPhone sizes App Store Connect requires, from the same fixed worlds. Previews SHALL show only real gameplay.

#### Scenario: Refreshing the media
- **WHEN** the capture command is run after an iteration
- **THEN** new App Store screenshots and previews of the current game are written to `docs/appstore/`, at the required sizes

### Requirement: Store forms filled from the repository
All listing text and every answer to the App Store Connect forms SHALL be kept in `docs/appstore/`, and the agent SHALL enter them in App Store Connect through the browser. The user SHALL only sign in, enrol, accept agreements and set up tax and banking. Nothing SHALL be submitted for review or released without the user's go-ahead.

#### Scenario: Publishing an update
- **WHEN** a new build has been uploaded and tested
- **THEN** the agent fills the new version's page, selects the build, and asks the user before submitting it for review

#### Scenario: A step needs the user
- **WHEN** App Store Connect asks for a sign-in, two-factor code, agreement, tax or banking detail
- **THEN** the agent stops and asks the user to do that step, then carries on

### Requirement: Tested before release
Each new version SHALL be installed through TestFlight on at least one real iPad and played before it is submitted for App Store review.

#### Scenario: New version
- **WHEN** a new build is uploaded
- **THEN** it is played on an iPad from TestFlight before it is submitted for review

### Requirement: Kept in step with the game
After each iteration is archived and released on itch.io, an App Store update with the same version SHALL be uploaded and submitted, and the listing text and screenshots SHALL be updated to match the game.

#### Scenario: After an iteration
- **WHEN** an iteration is archived and released
- **THEN** an App Store update with the same version number is submitted for review
