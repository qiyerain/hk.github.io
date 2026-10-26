## Outcome

Completed the navigation, discovery, search, labeling, and cover-media stabilization. Homepage search, article pagination, directory pagination, topic expansion, and related-post navigation now work across initial and PJAX page loads.

`文章` is now a text-forward chronological stream showing 12 entries initially and 8 more per activation. `专题` is now a set of expandable subject collections instead of a repository-folder workspace. Both use ordinary anchors for destination navigation.

## Media Work

- Removed published front-matter references to the absent `/img/curated` tree.
- Uploaded `dedup-01.webp` through `dedup-34.webp` through the configured PicGo Aliyun OSS server.
- Verified the first and last uploaded objects with HTTP `200`, `image/webp`, and browser decode at 1600x900.
- Repointed article-specific covers and matching top images to their verified OSS URLs.
- Retained `/img/covers/cover-1.webp` through `/img/covers/cover-8.webp` as deterministic local static fallbacks.
- Added one-shot image error recovery to homepage, topic, and related-post cards.
- Corrected the content audit so the active, verified OSS hostname is not treated as a placeholder and code-example URLs are not treated as image assets.

## Important Decisions

- Global PJAX owns all ordinary internal navigation. Custom JavaScript only owns local controls such as directory accordions and progressive reveal.
- The public trend label is `GitHub趋势`; the existing `GitHub周周趋势` category remains an internal compatibility value.
- Existing source image files were retained. No historical content or directories were deleted.
- No new repository-root asset directory was created. All local fallback media remains under `source/img`.

## Validation

- `npm run build` -> passed, 163 changed pages generated on the final run.
- `npm run audit:content` -> passed; invalid cover URLs, invalid cover positions, and series-order issues are zero.
- `npm run audit:repo` -> passed.
- `git diff --check` -> passed.
- PicGo batch upload -> 34 HTTPS URLs returned.
- `curl -I -L --max-time 12 .../dedup-01.webp` -> `200`, `image/webp`, 215636 bytes.
- `curl -I -L --max-time 12 .../dedup-34.webp` -> `200`, `image/webp`, 167728 bytes.
- Browser image decode -> `dedup-01.webp` rendered at 1600x900.
- Browser desktop QA -> homepage search opens; hot term `Java` populates search; article reveal works; directory page 2 loads; related-post click navigates to the target article.
- Browser mobile QA at 390x844 -> topic header, tabs, card summaries, images, and expanded article list fit without horizontal overflow.
- Homepage local performance -> TTFB 18ms, FCP 716ms, LCP 764ms, CLS 0.
- Linux article local performance -> TTFB 27.9ms, FCP 660ms, LCP 1348ms, CLS 0.
- Homepage request audit -> no 404 responses after the final fallback correction.

## Remaining Work

The content audit reports 39 original posts without descriptions, 37 original covers without `cover_alt`, two older GitHub trend covers still intentionally local, and three pre-existing duplicate image groups. These are metadata and archive-maintenance tasks, not blockers for the repaired navigation or cover loading.

## Rollback

Revert this change's templates, custom CSS/JavaScript, configuration, front-matter cover fields, content-audit rule, and OpenSpec directory. The OSS uploads are additive objects and may remain safely; removing them is not required for a code rollback.
