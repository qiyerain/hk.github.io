## ADDED Requirements

### Requirement: Deterministic section synchronization
The article TOC SHALL identify the last h2 or h3 heading that has crossed the activation line and SHALL keep exactly one entry active.

#### Scenario: Forward and reverse scrolling
- **WHEN** the reader scrolls through long and short sections in either direction
- **THEN** the entry matching the current section has active styling and `aria-current="location"`

#### Scenario: Article boundaries
- **WHEN** the reader is above the first heading or reaches the article bottom
- **THEN** the first or last entry respectively is active

### Requirement: Recalculated heading positions
The TOC SHALL recalculate heading offsets after layout-changing events.

#### Scenario: Dynamic layout change
- **WHEN** fonts, images, resize, PJAX, or hash navigation changes heading positions
- **THEN** subsequent scroll tracking uses the new positions

### Requirement: Offset-aware navigation
TOC links SHALL scroll headings below the fixed navigation and update the URL hash without an incorrect visual offset.

#### Scenario: TOC link activation
- **WHEN** the reader selects a TOC entry
- **THEN** the matching heading is visible below the navigation and the URL contains its encoded hash

### Requirement: Self-scrolling TOC
An overflowing TOC SHALL keep the active entry visible without scrolling the document.

#### Scenario: Active entry leaves TOC viewport
- **WHEN** synchronization activates an entry outside the TOC panel viewport
- **THEN** only the TOC list scroll position changes

### Requirement: Accessible mobile sheet
Below 900px the TOC SHALL be available through a fixed progress button and an accessible bottom sheet rather than inline above the article.

#### Scenario: Open and close mobile TOC
- **WHEN** the reader opens the sheet and then selects a section, presses Escape, or selects the backdrop
- **THEN** the sheet closes, state attributes update, and focus returns to the trigger when appropriate
