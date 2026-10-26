## ADDED Requirements

### Requirement: Preflight and resumable state
The automation SHALL resolve the current Beijing edition, read automation memory and same-week `state.json`, confirm the branch, and determine required stages before expensive research or rendering. It SHALL reuse completed same-week artifacts whose recorded hashes still match.

#### Scenario: Same-week run resumes
- **WHEN** a same-week state file records completed research, images, or blog publication
- **THEN** the automation reuses matching artifacts and runs only incomplete or invalidated stages

### Requirement: Independent channel outcomes
The automation SHALL treat Hexo blog publication and WeChat draft delivery as independent outcomes. A WeChat configuration, token, allowlist, or album blocker MUST NOT prevent a verified blog build and push.

#### Scenario: WeChat is blocked but blog is ready
- **WHEN** WeChat token acquisition fails before any draft mutation
- **THEN** the automation records the WeChat blocker, completes the blog path, and reports both outcomes separately

### Requirement: Canonical weekly article location
The automation SHALL create or reuse the edition under `source/_posts/每周GitHub趋势/YYYY-MM-DD-GitHub趋势.md` and SHALL NOT create a duplicate under the obsolete `每日GitHub趋势` directory.

#### Scenario: New weekly edition
- **WHEN** no same-week canonical article exists
- **THEN** exactly one article is created under `source/_posts/每周GitHub趋势/`

### Requirement: Idempotent WeChat mutation
The automation SHALL use `draft/add` only when the same-week state has no `media_id`. When a `media_id` exists, it SHALL call `draft/get` and either skip unchanged content or use `draft/update`; it MUST NOT create a replacement draft silently.

#### Scenario: Existing draft content changed
- **WHEN** `state.json` contains a valid `media_id` and the rendered HTML hash has changed
- **THEN** the existing draft is updated in place and retains its `media_id`

#### Scenario: Existing draft state is stale
- **WHEN** `state.json` contains a `media_id` that `draft/get` cannot resolve
- **THEN** the automation reports a stale-state blocker and does not call `draft/add` without explicit recovery authority

### Requirement: GitHub weekly WeChat list compatibility
The automation SHALL render GitHub weekly WeChat HTML with zero `<ul>` and zero `<li>` elements across the entire document. Rankings SHALL use numbered paragraphs, and project facts, other projects, trend observations, and sources SHALL use separate paragraphs with green bold labels.

#### Scenario: WeChat HTML is ready for mutation
- **WHEN** the final GitHub weekly WeChat HTML has been rendered
- **THEN** a pre-mutation gate confirms whole-document `<ul>` and `<li>` counts are both zero

### Requirement: Remote draft verification
After every `draft/add` or `draft/update`, the automation SHALL call `draft/get` and verify title, cover media ID, body image count, source URL, and whole-document list-tag counts before marking the draft stage complete.

#### Scenario: Draft verification passes
- **WHEN** the remote draft matches all required metadata and contains zero list tags
- **THEN** the automation persists the `media_id`, verification values, hashes, and timestamp in `state.json`

#### Scenario: Draft verification fails
- **WHEN** the remote draft differs from required metadata or contains any `<ul>` or `<li>`
- **THEN** the automation does not mark the draft stage complete and reports the exact mismatch

### Requirement: Deterministic completion report
The automation SHALL always finish with a Chinese execution summary and persist current stage outcomes, even when one channel is blocked. The summary SHALL distinguish live blog status, WeChat draft status, `media_id`, and album archival status.

#### Scenario: Partial completion
- **WHEN** at least one required stage cannot complete
- **THEN** the final summary identifies completed stages, the exact blocker, reusable artifacts, and the next safe retry action
