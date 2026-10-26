## ADDED Requirements

### Requirement: Verifiable weekly edition

The edition MUST identify the capture time, source and weekly metric; its text and all canvases MUST agree on the TOP 5 and year.

#### Scenario: Reader sees a project metric

- **WHEN** the project appears in an article or infographic
- **THEN** its weekly Star increment matches the captured GitHub Trending weekly page.

### Requirement: Separate publication states

The edition MUST distinguish a live blog page from a WeChat draft and record a draft media ID only after draft creation succeeds.

#### Scenario: WeChat access is blocked

- **WHEN** token retrieval fails with an IP allowlist error
- **THEN** no draft creation is claimed and the exact blocker is recorded for retry.
