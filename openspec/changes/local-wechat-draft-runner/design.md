## Design

`scripts/wechat_draft_local.sh <run-id>` resolves all inputs from `drafts/wechat/<run-id>/state.json` and the adjacent `inspect.json`. It validates credentials, files, list-tag counts, and draft idempotence before invoking the existing baoyu API publisher.

The wrapper maps the project's credential names to the publisher's expected names in process memory. It captures the publisher JSON, writes `media_id` to state immediately, then obtains a fresh access token and calls `draft/get`. Remote title, digest, cover, source URL, image count, and list-tag counts are stored as verification evidence.

`--dry-run` performs resolution and invokes the publisher's dry run without remote side effects or state mutation.

## Safety

- Existing `media_id` stops execution before any remote request.
- The HTML must contain zero `ul` and `li` elements.
- Only `draft/add` and `draft/get` are used. No publish, mass-send, or preview endpoint is present.
- A successful add is recorded before verification so a failed verification cannot cause a duplicate retry.

## Rollback

Remove the wrapper and revert the orchestrator documentation. Existing state remains compatible.
