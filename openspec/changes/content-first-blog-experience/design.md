## Context

The site is a Hexo 7.3 blog using a deeply customized AnZhiyu theme. The current homepage uses a full-viewport glass hero and hover-only cover previews, while the article template has a second, custom TOC implementation whose narrow IntersectionObserver band can leave the wrong section active. Image automation downloads directly into `source/img`, falls back to local URLs when PicGo fails, and has produced large and duplicate assets. The repository root also contains logs, one-off wrappers, screenshots, and generated Python caches.

The implementation must preserve existing posts, permalinks, RSS/search behavior, the separate GitHub trends channel, and unrelated dirty worktree changes.

## Goals / Non-Goals

**Goals:**

- Make useful content visible in the first desktop and mobile viewport.
- Use one consistent, readable editorial system and always-visible post covers.
- Keep the article TOC synchronized across scrolling, hash navigation, resize, image load, and PJAX transitions.
- Publish only image items that receive verified OSS URLs while allowing partial batches to succeed.
- Prevent temporary files and one-off scripts from accumulating in the repository root.
- Record major iteration intent, execution, and verification in OpenSpec.

**Non-Goals:**

- Adding paid products, membership, waitlists, or analytics.
- Rewriting Git history or deleting user image archives without a verified migration.
- Replacing Hexo or AnZhiyu, changing post URLs, or redesigning every secondary page.
- Making Pinterest or unverified Wallhaven imagery publishable.

## Decisions

### Content-first homepage

The homepage will use a compact image-backed masthead, four knowledge paths, and an 8/4 editorial grid. The main column contains a featured story and eight recent originals; the side rail contains author context, series, and WeChat. This borrows ITCharge's information density while retaining the blog's own typography and content model.

The main story selects the newest original with `featured: true`, then falls back to the newest original. Remaining stories are deduplicated. Automated GitHub trends stay outside the original feed.

### System typography and cover contract

The UI will use a system CJK sans-serif stack to avoid external font requests. All card covers render in a stable 16:9 frame with `object-fit: cover`; `cover_position` controls the focal point. New front matter supports `cover_alt`, `featured`, `series`, and `series_order` without changing existing post URLs.

### Deterministic TOC

The custom article TOC remains the only visible TOC. A requestAnimationFrame scroll task selects the last heading above a fixed activation line, with explicit top and bottom behavior. Cached heading offsets are recalculated after resize, font readiness, image load, hash navigation, and PJAX completion. Internal TOC scrolling uses the list container's `scrollTo`, avoiding page movement from `scrollIntoView`.

On screens below 900px the desktop rail becomes a bottom sheet opened by a fixed icon-and-progress button. Focus, Escape, backdrop click, `aria-expanded`, `aria-current`, and focus return are handled explicitly.

### Image publication transaction

`sharp` generates 1600x900 WebP covers and long-edge-1920 WebP album images in `.cache/image-pipeline`. The upload script validates MIME, dimensions, and returned HTTPS URLs. Each successful item can be committed to content independently; failed items remain in `.cache/image-upload-queue/queue.json` and never update Markdown or album data.

The daily fetch script will stop using local paths as publication fallbacks. Pinterest remains reference-only and Wallhaven candidates require verified reusable licensing; current automated publishing will use Wikimedia Commons unless a licensed provider is configured.

### Repository hygiene

Root files are validated against an explicit allowlist. Persistent tools belong in `scripts`, `scripts_py`, or `tools`; design evidence belongs in `docs/design`; temporary output belongs under ignored `.cache`. `audit:repo` reports actionable destinations and runs before the main build and deploy workflow.

OpenSpec is required for new capabilities, cross-page redesigns, workflow/data changes, dependencies, and other major iterations. Local behavior-preserving fixes are exempt. Every major change ends with an `execution-report.md` before archival.

## Risks / Trade-offs

- **Remote OSS is unavailable during implementation** -> Build the validated queue and upload gate without inventing URLs; report migration items as pending rather than publishing local fallbacks.
- **Existing covers use mixed dimensions** -> Apply stable runtime framing immediately and migrate source assets incrementally after successful OSS verification.
- **Theme JavaScript also contains TOC logic** -> Keep `GLOBAL_CONFIG_SITE.isToc` disabled for the custom post layout and scope the new controller to `.xa-reading-page`.
- **Large custom CSS has overlapping historical rules** -> Append one authoritative content-first section and remove only selectors made obsolete by this change.
- **Sharp adds a native dependency** -> Pin it in the lockfile and exercise image commands in local build verification.

## Migration Plan

1. Add the project convention, file placement audit, ignores, and move existing root artifacts.
2. Replace the homepage markup and authoritative styles while retaining the current content helpers.
3. Replace the custom TOC controller and add the mobile sheet markup/styles.
4. Add image processing and queue tools, then change daily publishing to update only successful OSS items.
5. Add front matter support and content audits without forcing inaccurate values into legacy posts.
6. Build and run automated/browser verification across target viewports.
7. Complete tasks and the execution report. Keep the change active until separately archived.

Rollback is a file-level revert of this change. Existing post permalinks and content remain unchanged, so no data rollback is required.

## Open Questions

None. Paid products, analytics, and Git history rewriting are explicitly deferred.
