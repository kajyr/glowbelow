## MODIFIED Requirements

### Requirement: What is saved
The save SHALL include the world's seed, lit plants and lanterns, lit ribs in Whale fall, whether the whale song has played, found friends, the firefly groups that joined the swarm, found starfish, whether dash is unlocked, whether the giant squid is awake, the colour of each coral in the Sunlit reef, the unlocked glow colours and the chosen one, and the zone the squid was in. It SHALL NOT include the squid's exact position, the glow meter, a colour game in progress or whether the ending has played. Mute and volume are settings, remembered separately, and are not part of the save.

#### Scenario: Starting position after load
- **WHEN** the player continues a saved game
- **THEN** the squid starts at the entry point of the zone it was last in

#### Scenario: Upgrading an older save
- **WHEN** a save from before Whale fall existed is continued
- **THEN** everything in it is kept, Whale fall's ribs are unlit and the giant squid is asleep

#### Scenario: Upgrading a save from before the reef
- **WHEN** a save from before the Sunlit reef existed is continued
- **THEN** everything in it is kept, the reef's corals start in their first colours, and only teal is unlocked and chosen

### Requirement: Saves survive game updates
The save SHALL record which version of the world layout it was made with. When a newer version of the game lays the world out differently, continuing SHALL keep found friends, the joined firefly groups, found starfish, the dash unlock and the unlocked and chosen glow colours, so the album never loses anything; lit plants and lanterns and the reef's coral colours from the old layout SHALL be dropped, so those zones glow again as the player lights them.

#### Scenario: After an update
- **WHEN** a save made before a game update that changed world generation is continued
- **THEN** every friend, starfish and glow colour found is still there, and plants start unlit
