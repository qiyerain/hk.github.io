## Context

The `github` cron automation runs every Friday at 18:00 against the main blog checkout. Its current prompt describes the complete article pipeline but treats it mostly as one linear run. The 2026-09-19 run exposed four weak boundaries: an obsolete article directory, expensive work before channel readiness was known, no explicit create-versus-update decision for WeChat drafts, and local HTML validation that did not catch WeChat's inserted empty list items.

The workflow must preserve the user's authorization boundary: push the blog to `master`, create or update a WeChat draft, but never publish, mass-send, or send a preview message.

## Goals / Non-Goals

**Goals:**

- Make the weekly run resumable and idempotent from `state.json`.
- Complete and report the blog even when WeChat is blocked.
- Prevent duplicate WeChat drafts and duplicate list markers.
- Verify stored remote state after every WeChat mutation.
- Keep the current Friday schedule and existing visual/content requirements.

**Non-Goals:**

- Direct WeChat publication, mass-send, or preview delivery.
- Automatic album assignment when the platform only supports it after publication.
- Changing GitHub Trending data methodology, visual direction, schedule, model, or repository deployment mechanism.

## Decisions

### Use a staged state machine in the prompt

The automation will decide each stage from same-week state before doing work: `research`, `visuals`, `oss_upload`, `blog`, `wechat_render`, and `draft`. Each completed stage is reusable. This is preferred over restarting the full pipeline because research, rendering, OSS upload, and remote draft creation have different costs and side effects.

### Separate blog and WeChat terminal outcomes

Blog build/push and WeChat draft delivery are independent outcomes in the final report. A token or allowlist failure blocks only the WeChat branch. This is preferred over stopping the whole run because the blog has no dependency on WeChat credentials.

### Decide create versus update from persisted remote identity

If `state.json` has no `media_id`, the workflow may call `draft/add` once after a dry-run. If a `media_id` exists, the workflow must call `draft/get` and either skip an identical draft or use `draft/update`. This provides a stable idempotency key without inventing a second registry.

### Treat stored WeChat HTML as the source of truth for compatibility

GitHub weekly WeChat output will contain no `<ul>` or `<li>` anywhere. Hierarchy comes from numbered paragraphs and green bold labels. After `draft/add` or `draft/update`, `draft/get` must confirm whole-document counts of zero because the platform can normalize markup differently from the local preview.

### Front-load only cheap readiness checks

The first minute checks branch, same-week state, token reachability, configured fallback routes, and local tool readiness. A WeChat failure is recorded early but does not prevent blog work. This avoids repeated token retries and avoids uploading WeChat materials when `draft/add` cannot succeed.

### Preserve the existing automation object

Update automation ID `github` in place and preserve its name, RRULE, model, reasoning effort, execution environment, target project, working directory, and status. This avoids duplicate scheduled runs.

## Risks / Trade-offs

- **Prompt length remains substantial** → Keep the existing editorial requirements but add a short execution contract at the top so ordering and terminal behavior are unambiguous.
- **Token readiness can change later in the run** → Recheck once immediately before the WeChat mutation; do not loop on `40164`.
- **A stale `media_id` may reference a deleted draft** → `draft/get` determines whether to update or report a stale-state blocker; never silently create a replacement.
- **WeChat preview URLs may cache old content** → Use `draft/get` as the machine verification source and tell the user to reopen the draft or regenerate the preview link.
- **Zero-list markup is series-specific** → Apply it only to GitHub weekly WeChat HTML; do not globally remove lists from other articles or the Hexo Markdown.

## Migration Plan

1. Update the existing `github` automation prompt in place.
2. Read the automation back and verify schedule/model/environment fields are unchanged and the new execution gates are present.
3. Record the new contract in automation memory and this OpenSpec change.
4. Roll back by restoring the prior prompt from the pre-change `automation.toml`; no content or remote draft rollback is needed.

## Open Questions

None. Album assignment remains explicitly pending until the platform supports draft-stage assignment or the user publishes in the backend.
