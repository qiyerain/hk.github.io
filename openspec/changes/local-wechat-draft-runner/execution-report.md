## Outcome

Added `scripts/wechat_draft_local.sh` as the repository-owned WeChat draft entry point. The script resolves an existing run, maps local credentials for baoyu, validates the weekly HTML contract, prevents duplicate draft creation, records a successful `media_id` immediately, and verifies the remote draft with `draft/get`.

The project instructions and article orchestrator now prefer this wrapper whenever a compatible run state exists. No draft, publish, mass-send, or preview action was performed during implementation.

## Decisions

- Reuse the already-rendered `wechat.html`; do not render Markdown again during draft submission.
- Resolve title and digest from `inspect.json`, and cover/source URL from `state.json`.
- Treat any existing `media_id` as a hard stop for `draft/add`.
- Persist successful creation before verification, preventing a verification failure from causing duplicate creation.
- Use `jsdom` for local and remote HTML element counts.

## Validation

- `bash -n scripts/wechat_draft_local.sh` passed.
- `scripts/wechat_draft_local.sh 2026-10-09-github-weekly --dry-run` passed and resolved the expected title, digest, HTML, cover, and source URL without remote side effects.
- `bun test ./.codex/skills/baoyu-post-to-wechat/scripts/wechat-extend-config.test.ts ./.codex/skills/baoyu-post-to-wechat/scripts/wechat-http.test.ts` passed: 14 tests, 0 failures.
- `git diff --check` passed.
- `npm run audit:repo` passed.

## Deviation And Remaining State

The user reported that the prior manual command created a draft, but the command output containing its `media_id` was not available to this run. A read-only `draft/batchget` request returned `total_count: 0`, so the implementation did not invent or backfill an identifier. The current 2026-10-09 state remains blocked until the successful command's real `media_id` is supplied or the remote draft becomes queryable.

## Rollback

Remove `scripts/wechat_draft_local.sh` and revert the added workflow guidance in `CLAUDE.md` and `.codex/skills/wechat-article-generator/SKILL.md`. No data migration is required.
