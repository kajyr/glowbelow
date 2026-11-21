## MODIFIED Requirements

### Requirement: The way up
Touching the awake giant squid's offered arm SHALL let the squid ride it up and set it down at the first zone on the way up it has not reached yet: just inside the bottom of Twilight until the squid has reached Twilight once, then the Sunlit reef. Steering away during the ride SHALL hop off. After setting the squid down, the giant squid SHALL sink back to its spot in Whale fall, and the squid swims back down by itself. The ride is an express lift: every zone it goes to can also be reached by swimming, so no friend gates progress.

#### Scenario: Express lift
- **WHEN** the squid touches the offered arm
- **THEN** the arm carries the squid up and sets it down at the first zone on the way up it has not reached yet

#### Scenario: First stop is Twilight
- **WHEN** the squid has never reached Twilight and touches the offered arm
- **THEN** the arm sets it down just inside the bottom of Twilight, and Twilight counts as reached (dash unlocks)

#### Scenario: Then the reef
- **WHEN** the squid has reached Twilight before (this session or a saved game) and touches the offered arm
- **THEN** the arm carries it past Twilight and sets it down in the Sunlit reef

#### Scenario: Reef already visited
- **WHEN** the squid has already been to the Sunlit reef and touches the offered arm
- **THEN** the arm sets it down in the Sunlit reef again

#### Scenario: Reef without the ride
- **WHEN** the giant squid has never been woken
- **THEN** the squid can still reach the Sunlit reef by swimming up Twilight

#### Scenario: Hopping off
- **WHEN** the player steers away during the ride
- **THEN** the squid hops off where it is and swims on

#### Scenario: Going home
- **WHEN** the giant squid has set the squid down
- **THEN** it sinks back to Whale fall, where it can be ridden again
