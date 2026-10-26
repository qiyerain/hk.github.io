## ADDED Requirements

### Requirement: Guest comments
The service SHALL allow a guest to submit a Markdown comment using a browser token without public account registration.

#### Scenario: Submit a comment
- **WHEN** a guest submits valid nickname, article slug and Markdown content
- **THEN** the service stores a pending comment and returns its status and author token

#### Scenario: Unsafe content
- **WHEN** submitted Markdown contains disallowed HTML or exceeds limits
- **THEN** the service rejects or sanitizes it before storage and rendering

### Requirement: Sort and moderate comments
The service SHALL support oldest, newest and hot ordering and administrator status moderation.

#### Scenario: Hot sorting
- **WHEN** a reader requests comments with `sort=hot`
- **THEN** approved root comments are ordered by the documented score and replies remain chronological

#### Scenario: Approve a pending comment
- **WHEN** an authenticated administrator changes a comment to approved
- **THEN** it becomes visible in the public list without changing its creation time

### Requirement: Prevent duplicate reactions
The service SHALL enforce one reaction of a given type per anonymous visitor and comment.

#### Scenario: Repeat like
- **WHEN** the same visitor likes the same comment twice
- **THEN** the second request is idempotent and the count increases only once
