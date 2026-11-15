## MODIFIED Requirements

### Requirement: What is saved
The save SHALL include the world's seed, lit plants and lanterns, lit ribs in Whale fall, whether the whale song has played, found friends, the firefly groups that joined the swarm, found starfish, whether dash is unlocked, whether the giant squid is awake, and the zone the squid was in. It SHALL NOT include the squid's exact position or the glow meter. Mute and volume are settings, remembered separately, and are not part of the save.

#### Scenario: Starting position after load
- **WHEN** the player continues a saved game
- **THEN** the squid starts at the entry point of the zone it was last in

#### Scenario: Upgrading an older save
- **WHEN** a save from before Whale fall existed is continued
- **THEN** everything in it is kept, Whale fall's ribs are unlit and the giant squid is asleep
