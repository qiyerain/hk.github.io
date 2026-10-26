## Requirements

### Requirement: Local draft command

The repository SHALL provide a single command that creates a WeChat draft from an existing run directory using the local `.env.local` credentials and existing rendered HTML.

#### Scenario: New draft

- GIVEN a valid run state without `media_id`
- WHEN the local draft command succeeds
- THEN it records the returned `media_id` immediately and verifies the draft using `draft/get`

#### Scenario: Existing draft

- GIVEN a run state with `media_id`
- WHEN the local draft command is invoked
- THEN it exits before calling `draft/add`

#### Scenario: Invalid weekly HTML

- GIVEN rendered HTML containing `ul` or `li`
- WHEN the local draft command is invoked
- THEN it exits before uploading material or creating a draft
