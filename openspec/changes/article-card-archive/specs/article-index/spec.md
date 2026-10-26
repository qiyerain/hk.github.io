## ADDED Requirements

### Requirement: One article entry
The primary navigation SHALL expose one article entry and SHALL NOT expose a duplicate topic entry.

#### Scenario: Homepage navigation
- **WHEN** the header is rendered
- **THEN** it contains `文章` and no separate `专题` item

### Requirement: Cover card archive
The article archive SHALL show newest-first cover cards with working pagination and directory/tag archive links.

#### Scenario: Reader opens the archive
- **WHEN** `/archives/` is loaded
- **THEN** each article has a visible stable-ratio cover and the page has at most 12 article cards

#### Scenario: Reader changes page
- **WHEN** a pagination link is activated
- **THEN** a different newest-first subset is loaded through ordinary site navigation
