# Execution Report

## Outcome

The 2026-10-23 article now uses the canonical `GitHub周周趋势` category, Style Pack A, a cache-busted reading stylesheet, and a scoped white reading-page background. The article appears as the latest issue on `/github-trends/`. Content and visuals were upgraded to evidence-based analysis with native platform ratios.

The WeChat-compatible HTML was regenerated and passed all local checks. The remote draft was not created because the required token preflight returned `40164` for egress IP `175.0.200.132`; no WeChat material upload or draft mutation occurred.

## Decisions And Process

- Fixed the actual blue-background source at `#content-inner.layout`, not the body or image layer.
- Pinned the weekly post to Style Pack A and invalidated the stale stylesheet cache through the injected version string.
- Corrected the category contract so the existing collection generator includes the issue.
- Added `--no-cover` to the reusable Style Pack renderer so platform covers cannot enter WeChat body HTML.
- Updated the existing `github` automation in place and recorded the same rules in project guidance and automation memory.

## Validation

- `python3 -m py_compile .codex/skills/wechat-article-generator/scripts/render_style_pack.py` passed.
- `npm run build` passed after temporarily moving the pre-existing ignored root `stderr.log` to `.cache`; the file was restored automatically.
- `npm run audit:repo` passed.
- WeChat experience validation passed with `ul=0`, `li=0`, three body images, inline styles only, and no platform cover in the body.
- Browser mobile metrics: body/layout `rgb(255,255,255)`, text `rgb(15,15,15)`, Style Pack A, viewport `489x650@2x`.
- Body images: `1080x1350 -> 417x521`; both `1080x720 -> 417x279`; maximum aspect-ratio delta `0.0036`.
- Desktop screenshot at `1440x900` confirmed the same white reading surface, readable hierarchy, and natural portrait-poster geometry.
- `/github-trends/` showed the issue as `LATEST SNAPSHOT 2026 / 10 / 23` and in the October archive.

## Deviations And Remaining Work

- The requested WeChat draft remains blocked by the Official Account IP allowlist. Add `175.0.200.132`, then resume from the same state and perform at most one `draft/add`, followed by mandatory `draft/get` verification.
- No commit, push, publication, mass-send, or preview-send was performed in this correction task.

## Rollback

Revert the current article Front Matter, the scoped reading-page background and stylesheet query version, the renderer `--no-cover` option, project guidance, and the automation prompt. The WeChat platform requires no rollback because no remote mutation occurred.

## 2026-10-25 Follow-up: Reader Value And Links

### Outcome

The opening overview now routes readers by engineering goal instead of spending the lead on the number of visible Trending projects or a long ranking-method disclaimer. The TOP 5 renderer now preserves links nested inside bold text, and the fifth row no longer develops a false indentation from a wrapped raw URL.

The existing WeChat draft was updated in place. Its `media_id` remained unchanged. `draft/get` verified the title, digest, new cover material, three body images, reading-original URL, and zero `ul`/`li` tags.

### Implementation And Validation

- Changed Style Pack inline parsing from `code -> bold -> link` to `code -> link -> bold` and added a `--snippet` output option so final WeChat HTML contains no document wrapper.
- Added four renderer regression tests: bold-nested link, plain link, code protection, and wrapper-free snippet output.
- Local final HTML contains 23 clickable anchors, no visible Markdown link syntax, no visible raw URLs, five TOP entries beginning at paragraph start, three images, and zero list tags.
- `validate_article_experience.py` passed all checks.
- `npm run build` and `npm run audit:repo` passed after the content and renderer changes.
- `md2wechat inspect` passed. Its API preview remained degraded because the configured key has an invalid prefix; the deterministic Style Pack C output was used instead.
- WeChat `draft/get` returned `anchor_count=0`: the platform stripped external GitHub anchors while retaining clean project labels. The verified `content_source_url` remains the supported clickable path to the blog, where project links are available.
- Updated `AGENTS.md`, the active `github` automation prompt, and automation memory with the new editorial and link gates.

### Rollback

Revert the current article copy, renderer and test changes, project guidance, and automation prompt. The remote draft can be updated again through the saved `media_id`; do not create a replacement draft.
