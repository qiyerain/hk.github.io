## ADDED Requirements

### Requirement: Display article statistics without blocking content
The homepage SHALL batch-fetch article summaries by each card's slug and SHALL continue rendering static title, cover and link when the API is unavailable.

#### Scenario: Populate cards
- **WHEN** the homepage receives summaries for several slugs
- **THEN** each card displays only the count belonging to its own slug

#### Scenario: Analytics API unavailable
- **WHEN** the statistics request fails or times out
- **THEN** cards hide the count or show a neutral placeholder and remain usable
