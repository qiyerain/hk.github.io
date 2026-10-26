## ADDED Requirements

### Requirement: Content-first homepage
The homepage SHALL expose the brand, four knowledge paths, and original article discovery without requiring a full viewport of decorative content.

#### Scenario: Desktop first viewport
- **WHEN** the homepage is rendered at 1440x900
- **THEN** the masthead, all four knowledge paths, and the beginning of the featured article are visible

#### Scenario: Mobile first viewport
- **WHEN** the homepage is rendered at 390x844
- **THEN** the title of the featured article is visible without horizontal scrolling

### Requirement: Original content hierarchy
The homepage SHALL prioritize original posts and SHALL keep the automated GitHub trends feed outside the original article list.

#### Scenario: Homepage post selection
- **WHEN** original and daily trend posts both exist
- **THEN** the featured and recent article sections contain only original posts and the trend channel appears as a separate link

### Requirement: Stable visible covers
Every homepage article card SHALL render an always-visible 16:9 cover with an accessible description and a stable layout box.

#### Scenario: Mixed source dimensions
- **WHEN** source covers include portrait, landscape, and ultrawide images
- **THEN** card geometry remains stable and each image is cropped using its configured focal position

### Requirement: Responsive editorial layout
The desktop homepage SHALL use a main content column and contextual side rail, while mobile SHALL present the same content in one reading order.

#### Scenario: Small viewport
- **WHEN** viewport width is below 900px
- **THEN** side-rail content follows recent articles and no desktop-only hover interaction is required

### Requirement: Readable typography
The site SHALL use a system CJK sans-serif stack for headings and body text and SHALL NOT require an external font request.

#### Scenario: Font fallback
- **WHEN** the preferred platform font is unavailable
- **THEN** the next local CJK sans-serif font renders without layout-blocking downloads
