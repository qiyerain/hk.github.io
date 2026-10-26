## ADDED Requirements

### Requirement: Single-owner internal navigation

Ordinary internal content links SHALL be handled by the site's global PJAX navigation without competing fetch or click interception.

#### Scenario: Directory or related article link
- **WHEN** a visitor activates a directory, topic, archive, or related-post link
- **THEN** the destination loads once and remains usable after subsequent PJAX transitions

### Requirement: Distinct article and topic views

The article page SHALL provide chronological discovery, while the topic page SHALL provide subject-oriented discovery.

#### Scenario: Visitor compares both pages
- **WHEN** a visitor opens `文章` and `专题`
- **THEN** the article page presents a progressive time stream and the topic page presents expandable subject collections

### Requirement: Progressive rendering

Long discovery pages SHALL initially expose a useful subset and SHALL reveal additional content without a full reload.

#### Scenario: Reveal more content
- **WHEN** a visitor activates a reveal control
- **THEN** the next content group becomes visible, focus and layout remain stable, and article links remain ordinary anchors

### Requirement: Resilient cover media

Content cards SHALL preserve their layout and show an existing local fallback when a configured cover cannot load.

#### Scenario: Missing or failed cover
- **WHEN** a cover URL is absent, removed, or fails during loading
- **THEN** the card uses a deterministic image under `/img/covers/` without repeated failed requests

### Requirement: Governed image placement

Static UI and fallback images SHALL live below `source/img`, while published content-specific media SHALL use a verified OSS URL.

#### Scenario: New media is introduced
- **WHEN** the media is a reusable fallback or static site asset
- **THEN** it is stored under `source/img`
- **AND WHEN** it is content-specific article media
- **THEN** it is uploaded to OSS before publication

### Requirement: Search tag separation

Popular search terms SHALL render as separate keyboard-focusable tag controls with wrapping on narrow screens.

#### Scenario: Search opens on mobile
- **WHEN** the hot terms exceed one row
- **THEN** each term retains its own visible boundary and wraps without overlap

### Requirement: Concise trend label

Public interface copy SHALL call the trend channel `GitHub趋势` while retaining existing URLs and internal category data.

#### Scenario: Trend navigation is rendered
- **WHEN** a trend link or page heading appears
- **THEN** its visible label is `GitHub趋势`
