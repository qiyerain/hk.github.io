## Why

The weekly GitHub automation can currently finish expensive research and visual work without producing a visible blog result, treat a WeChat allowlist failure as an ambiguous whole-run failure, and generate list markup that WeChat normalizes into duplicate bullets. The 2026-09-19 recovery showed that the workflow needs explicit idempotence, independent blog and WeChat outcomes, and verification against the stored WeChat draft rather than only local HTML.

## What Changes

- Add a first-minute preflight that resolves the Beijing date/run ID, reads memory and state, checks the current branch, and determines whether blog creation, draft creation, or draft update is required.
- Treat blog publication and WeChat draft delivery as independent stages so a WeChat token or allowlist failure does not prevent a verified blog push.
- Use the canonical `source/_posts/每周GitHub趋势/` path and reuse same-week artifacts instead of the obsolete `每日GitHub趋势` path.
- Require `draft/update` when `state.json` already contains a `media_id`; permit `draft/add` only when no existing draft is recorded.
- Render GitHub weekly WeChat HTML without any `<ul>` or `<li>` elements and use numbered or green-labeled paragraphs for hierarchy.
- Require `draft/get` verification after creation or update, including title, cover, image count, source URL, and whole-document list-tag counts.
- Persist stage results immediately and always produce a final Chinese execution summary, including partial success and exact blockers.

## Capabilities

### New Capabilities

- `github-weekly-automation-reliability`: Defines the resumable, independently verified blog and WeChat workflow for the weekly GitHub trend automation.

### Modified Capabilities

None.

## Impact

- Codex automation `github` prompt and its execution behavior.
- Weekly state packages under `drafts/wechat/<run-id>/state.json`.
- GitHub weekly WeChat rendering and remote draft verification.
- No schedule, model, notification, publishing authorization, dependency, or public route changes.
