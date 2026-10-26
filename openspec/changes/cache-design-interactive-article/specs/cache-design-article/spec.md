## ADDED Requirements

### Requirement: Explain the supplied cache architecture
The article SHALL distinguish general cache design principles from the project's concrete cache implementations and SHALL explain expiry, invalidation, memory, and multi-node consistency risks.

#### Scenario: Reader studies the article
- **WHEN** the reader opens the post
- **THEN** the post provides diagrams, explanatory text, and a comparison of the project's cache layers

### Requirement: Demonstrate stale reads interactively
The article SHALL provide keyboard-accessible controls for reading, updating the DB, invalidating caches, and advancing time. Its visual state and event log SHALL reflect each action.

#### Scenario: DB update leaves stale cached data
- **WHEN** a reader fills L1 and L2, updates the DB, and reads again
- **THEN** the simulator shows the stale L1 result until invalidation, and can show the stale L2 result after only L1 is invalidated
