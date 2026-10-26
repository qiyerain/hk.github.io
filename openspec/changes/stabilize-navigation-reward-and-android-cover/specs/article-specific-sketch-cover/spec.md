## ADDED Requirements

### Requirement: Content-derived Android mirroring cover
The Android-to-Mac article SHALL use a hand-drawn cover derived from its scrcpy setup rather than an unrelated anime fallback.

#### Scenario: Article listing and header
- **WHEN** the `安卓投屏mac` article is rendered in a listing or article header
- **THEN** its cover depicts an Android phone connected to a Mac with a mirrored screen in a hand-drawn editorial style

### Requirement: Accessible cover metadata
The article SHALL provide descriptive alternative text for its generated cover.

#### Scenario: Cover cannot be seen
- **WHEN** assistive technology reads the article cover
- **THEN** it receives concise text describing the Android-to-Mac mirroring workflow
