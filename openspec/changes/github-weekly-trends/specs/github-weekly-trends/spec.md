## ADDED Requirements

### Requirement: Weekly trend channel identity
The site MUST present the dedicated GitHub trend channel as `GitHub周周趋势` in navigation, page headings, archive links, subscription copy, and the dedicated RSS title.

#### Scenario: User opens the trend channel
- **WHEN** a user opens `/github-trends/`
- **THEN** the page identifies itself as `GitHub周周趋势`
- **AND** the page does not describe the channel as a daily report or `日报`.

### Requirement: Canonical trend category
Trend posts MUST use `GitHub周周趋势` as their category value, and all trend collection, homepage exclusion, audit, and RSS filtering logic MUST use that same value.

#### Scenario: Site builds with trend posts
- **WHEN** Hexo processes the posts
- **THEN** trend posts are collected by the weekly trend helper
- **AND** they remain excluded from the main homepage feed
- **AND** they remain included in the dedicated trend RSS feed.

### Requirement: Stable public route
The dedicated trend route MUST remain `/github-trends/`, including `/github-trends/rss.xml`.

#### Scenario: Existing subscriber follows the feed
- **WHEN** a subscriber requests `/github-trends/rss.xml`
- **THEN** the feed remains available at that path
- **AND** its title identifies the channel as `GitHub周周趋势`.

### Requirement: Homepage search entry
The homepage knowledge-base search control MUST open the existing local-search dialog.

#### Scenario: User clicks homepage search
- **WHEN** the user clicks the `搜索知识库` control
- **THEN** the local search mask and dialog become visible
- **AND** focus moves to the local search input.
