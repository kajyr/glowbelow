## ADDED Requirements

### Requirement: Dumbo points in Whale fall
In Whale fall, when the squid stops for about 2 seconds, dumbo SHALL point at the nearest unlit rib. When every rib is lit and the giant squid is still asleep, dumbo SHALL point at the giant squid instead. When the giant squid is awake, dumbo SHALL do a happy spin. Gathering sparkles afterwards works as described in "Dumbo gathers sparkles".

#### Scenario: Unlit ribs
- **WHEN** the squid hovers still in Whale fall and some ribs are unlit
- **THEN** dumbo points at the nearest unlit rib

#### Scenario: Sleeping giant
- **WHEN** the squid hovers still in Whale fall, every rib is lit and the giant squid is asleep
- **THEN** dumbo points at the giant squid

#### Scenario: All done
- **WHEN** the squid hovers still in Whale fall and the giant squid is awake
- **THEN** dumbo does a happy spin
