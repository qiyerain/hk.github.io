## Outcome

The header now exposes only `文章`, not a duplicate `专题` item. `/archives/` renders cover cards in newest-first order with 12 entries per page and four real archive pages for 41 original posts. Directory pages reuse the same card template; `/dirs/` is a compact directory index without giant imagery or long explanatory copy.

Cards retain existing cover URLs and use the existing `/img/covers/cover-1.webp` through `cover-8.webp` fallback set. No media files or asset directories were added.

## Decisions And Execution

- Reused Hexo archive generation and its paginator, filtering trend/hidden posts before pagination.
- Replaced the chronological text stream and topic accordion with cover cards and compact archive links.
- Reused the archive template for existing directory routes rather than introducing a new client-side filter/navigation system.
- Kept ordinary anchors and existing PJAX behavior for cards, directory labels, tags, and pagination.
- Applied the existing-project redesign skill to reduce oversized page framing and keep the content grid readable.

## Validation

- `npm run build`: passed; archive pages 1 through 4 generated.
- `npm run audit:content`: passed; invalid covers, placeholder assets, cover-position errors, and series-order errors are zero. Existing missing descriptions/alt text and duplicate-image warnings remain unchanged.
- `npm run audit:repo`: passed.
- `git diff --check`: passed.
- `agent-browser` at 1440x900: cover cards visible in three columns, 12 cards on the first archive page, dates verified descending.
- `agent-browser` at 390x844: single-column cover cards, no horizontal overflow.
- Actual page-number click: archive page 2 to page 3 succeeded; article subsets differ.
- Directory page QA: 10 backend cards rendered using the same template; a card title click successfully opened the Flowable detail page.
- Browser session closed after QA.

## Preview And Rollback

### Desktop Follow-up (2026-09-16)

- Fresh browser inspection did not reproduce the reported one-card-per-desktop-screen layout: 1440px already rendered three columns. The user's existing browser/cache state was not available to this isolated test.
- Hardened cover geometry with positioned images so portrait source images cannot expand the cover; reduced desktop titles to 18px/600 with two-line truncation, improved summary sizing and word wrapping, and scoped the archive outer container. Mobile stays single-column.
- Versioned the redesign stylesheet URL and restarted the local Hexo preview to pick up configuration changes.
- `npm run build`, `npm run audit:repo`, `npm run audit:content`, and `git diff --check`: passed. Existing content warnings remain.
- Browser: 1440x900 direct archive load rendered three 333px-wide cards, approximately 401px tall, with 18px titles; 390x844 rendered a single 354px-wide card. Neither viewport overflowed horizontally. At 1920x1080, clicking the actual header article link from home rendered three columns without overflow.
- Screenshots inspected at `/tmp/archive-desktop-after.png` and `/tmp/archive-mobile-after.png`; isolated browser closed after verification. No production deployment.

Preview: `http://localhost:4018/archives/`. No production deployment or commit was performed.

Rollback: revert this change's configuration, archive generator wrapper, templates, CSS, and OpenSpec files. Article permalinks and image files are unchanged. Completed change remains active pending explicit archival.
