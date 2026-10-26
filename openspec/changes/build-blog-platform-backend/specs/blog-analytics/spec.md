## ADDED Requirements

### Requirement: Record page analytics
The service SHALL accept idempotent page-view and reading-heartbeat events without blocking the static blog.

#### Scenario: Accept a page view
- **WHEN** a client posts a valid `page_view` event with page path, visitor ID, session ID and timestamp
- **THEN** the service stores only a hashed visitor identifier and returns an event ID

#### Scenario: Deduplicate a repeated event
- **WHEN** the same client retries an event within the configured idempotency window
- **THEN** the service returns `deduplicated=true` and does not increment the aggregate twice

### Requirement: Calculate valid reads
The service SHALL count a valid read only when the configured duration and scroll-depth thresholds are met.

#### Scenario: Short visit
- **WHEN** a session ends before the duration or scroll threshold
- **THEN** `validReads` remains unchanged

#### Scenario: Completed reading
- **WHEN** a session meets both thresholds
- **THEN** the service records one valid read and its accumulated reading seconds

### Requirement: Provide article and site summaries
The service SHALL provide per-article, site-wide and batch article summaries.

#### Scenario: Batch home-card summary
- **WHEN** the homepage requests multiple slugs
- **THEN** the service returns one summary per slug in a single response

#### Scenario: Unknown slug
- **WHEN** a batch includes a slug without data
- **THEN** the response includes no fabricated count for that slug and the request remains successful
