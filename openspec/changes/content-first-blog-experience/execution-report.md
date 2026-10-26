# Execution Report

Date: 2026-09-03

## Outcome

The content-first blog experience is implemented and verified. The homepage now exposes knowledge paths and original writing before secondary content, article cards use stable 16:9 covers, the article TOC has deterministic desktop/mobile navigation, and the image workflow publishes only validated OSS uploads. Repository governance, hygiene checks, missing internal routes, and a self-hosted icon font are also in place.

The change is complete but intentionally remains in `openspec/changes/content-first-blog-experience/`. Archival is a separate action.

## Process

1. Created the OpenSpec proposal, design, four capability specs, task list, and report skeleton.
2. Added project rules and repository-file ownership conventions, then moved or quarantined existing root artifacts.
3. Audited ITCharge's useful information hierarchy and replaced the experimental full-screen homepage with a compact editorial layout.
4. Replaced the heading `IntersectionObserver` with cached positions and a requestAnimationFrame ScrollSpy, then iterated on mobile focus, theme anchor conflicts, navigation animation offsets, and hash restoration.
5. Added Sharp derivatives, a persistent ignored upload queue, OSS response validation, and repeatable image pipeline tests.
6. Ran static, browser, content, XML, link, performance, and responsive checks. Browser sessions were closed after evidence collection.

## Implemented Changes

- Homepage and navigation: compact 390px desktop / 260px mobile Hero, six primary destinations, four knowledge paths, one featured original, eight recent originals, desktop 8/4 author-series-WeChat rail, and linear mobile order.
- Covers and typography: system Chinese sans-serif stack, always-visible 16:9 cards, `cover_alt`, `cover_position`, `featured`, `series`, and `series_order` support. The LangChain Agent trilogy seeds the series contract.
- Article TOC: one custom h2/h3 tree, 232px sticky desktop rail, mobile progress trigger and bottom sheet, rAF scroll tracking, `aria-current`, focus containment/return, internal list scrolling, fixed-header offsets, bottom boundary handling, PJAX cleanup, direct-hash restoration, and image/font/resize recalculation.
- Image workflow: `sharp@0.34.5`, 1600x900 cover WebP output below 250 KB, max-1920 album output, decode/MIME validation, SHA-256 dedupe, PicGo upload, HTTPS image verification, retry queue, and partial-batch publication. Pinterest is reference-only; unverified Wallhaven licensing is not publishable.
- Repository hygiene: root allowlist and generated-output audit, `.cache/` and temporary artifact ignores, deploy/build audit integration, design evidence under `docs/design/`, and OpenSpec rules in `AGENTS.md` and `CLAUDE.md`.
- Infrastructure: local icon CSS/font removes external font requests; monthly archive, `/album/other/`, and `/privacy/` routes close all generated internal-link gaps.

Key implementation files include:

- `themes/anzhiyu/layout/includes/header/index.pug`
- `themes/anzhiyu/layout/includes/xiaoao/home.pug`
- `themes/anzhiyu/layout/post.pug`
- `source/custom/xiaoao-redesign.css`
- `source/js/xiaoao-site.js`
- `tools/image-pipeline.js`
- `tools/image-pipeline.test.js`
- `tools/content-audit.js`
- `tools/repo-hygiene.js`
- `scripts_py/fetch_daily_images.py`

## Verification

All commands below completed successfully unless explicitly identified as an availability check.

```bash
npm run audit:repo
npm run audit:content
npm run test:image-pipeline
npm run build
node --check source/js/xiaoao-site.js
node --check tools/image-pipeline.js
node --check tools/image-pipeline.test.js
PYTHONDONTWRITEBYTECODE=1 python3 -m py_compile scripts_py/fetch_daily_images.py scripts_py/picgo_upload.py
xmllint --noout public/rss.xml public/github-trends/rss.xml public/search.xml public/sitemap.xml
```

Results:

- The final Hexo build generated 100 files without warning or error.
- Repository hygiene passed; no backup, log, PID, reject, or temporary file exists in `public/`.
- XML validation passed for both RSS feeds, search XML, and sitemap.
- Internal link audit checked 177 HTML files and found 0 unresolved internal routes.
- Image pipeline tests passed transform, illegal MIME rejection, dedupe, partial failure, complete failure retention, retry, and full success.
- Content audit passed its enforced contract checks. It reports historical migration debt separately: 40 original posts lack descriptions, 19 posts contain placeholder body-image URLs, 52 covers remain local, 38 original covers lack `cover_alt`, 89 images exceed 2 MB, and 29 duplicate hash groups exist.
- Cover fixture output was 1600x900 WebP and 2,668 bytes; album fixture output was 1920x1120 WebP.
- Browser viewports verified: 1440x900, 1280x800, 1024x768, 390x844, and 414x896. No horizontal overflow occurred. The first story appears in the 1440px viewport, and its title appears at y=727 in 390x844.
- Homepage cards measured at 1.778 aspect ratio. GitHub Trends did not appear in the original feed.
- TOC automated forward and reverse checks matched all 12 headings; top, long/short sections, continuous headings, and article bottom passed. Direct hash and clicked navigation landed at 80px, exactly 16px below the 64px navigation.
- Mobile TOC passed expanded state, focus into the sheet, Escape/backdrop closing, focus return, selection closing, progress display, and active-item synchronization.
- PJAX navigation rebuilt 12 links for 12 headings with exactly one `aria-current="location"`.
- Local performance profile: TTFB 20.4ms, FCP 768ms, LCP 1,472ms, CLS 0. External font requests: 0.

Screenshots:

- `docs/design/content-first-home-1440.png`
- `docs/design/content-first-home-1280.png`
- `docs/design/content-first-home-1024.png`
- `docs/design/content-first-home-390.png`
- `docs/design/content-first-home-414.png`
- `docs/design/content-first-toc-desktop.png`
- `docs/design/content-first-toc-mobile.png`

## Plan Deviations

- Existing local cover migration was not executed because PicGo was unavailable at `http://127.0.0.1:36677` during implementation. The availability check returned connection failure. No local path was replaced with an invented URL and no existing image archive was deleted.
- Root disposable artifacts were moved into ignored `.cache/legacy-root/` rather than permanently deleted, making cleanup recoverable.
- The plan's dead-link gate revealed eight pre-existing route gaps. Monthly archive generation, `/album/other/`, and `/privacy/` were added so the final generated-site link audit could pass without changing existing permanent links.
- The theme icon font was self-hosted after performance verification found one external font request.

## Remaining Work

- Start PicGo with the configured Aliyun OSS uploader, run the cover migration in controlled batches, verify every HTTP response, replace front matter only after success, then delete only proven-unreferenced local copies.
- Resolve the content debt reported by `npm run audit:content`: write descriptions and cover alternative text, replace historical placeholder body images, and curate oversized/duplicate image archives. Git history is intentionally unchanged.
- npm reports 12 transitive dependency advisories (5 moderate, 7 high). Dependency remediation was not mixed into this UI/workflow change because it may require theme-compatible upgrades.

## Preview And Rollback

Preview: `http://127.0.0.1:4012/`

Rollback is file-scoped: revert the homepage/header/TOC template, `xiaoao-site.js`, and the content-first CSS additions for UI behavior; remove the Sharp dependency and image pipeline tools for workflow rollback; revert governance/audit files for repository policy rollback. Restore `.cache/legacy-root/` only if one of those obsolete artifacts is explicitly needed. Do not restore the user-deleted `article-flowable.png`.

## Follow-up Refinement: 2026-09-03

### Conclusion

The screenshot-driven refinement is complete. The homepage now uses a compact full-width visual masthead with a single-line brand heading, the article page has a clean 76ch reading surface and a properly aligned TOC rail, and album categories provide newest-first pagination. Historical album duplication was removed without rewriting Git history or deleting any file still referenced by content.

### Diagnosis And Decisions

- The old Hero combined an oversized 12em-constrained heading with the sentence `把复杂技术，讲成能用的知识。`, forcing the final character and punctuation onto an orphan line. It was replaced by the brand-first heading `小遨的技术笔记` and a short supporting sentence without trailing punctuation.
- Album duplication came from repeated scheduled runs of the legacy fetcher: it always allocated a new numbered filename, never checked prior source identifiers or file hashes, and published local fallbacks after PicGo failures. Repeated Wallhaven/Pinterest results therefore became both repeated YAML entries and repeated files.
- The TOC indicator used `active.offsetTop + list.offsetTop` while being positioned in a different coordinate space. The indicator now lives inside the scrollable list and uses the active row's direct offset. Direct-hash alignment also observes delayed image mutations for up to 10 seconds and stops when the user initiates scrolling.
- Pinterest remains reference-only. New album items require a reusable license, a valid decoded image, a unique source/hash, successful PicGo upload, and a verified HTTPS image response before publication.

### Actual Changes

- Added a full-width, image-led 400px desktop / 270-280px mobile Hero and kept the first article cover visible at 1440x900.
- Restored the full six-item desktop navigation even when the theme's width heuristic adds `hide-menu`; smaller viewports continue to use the menu button.
- Increased desktop prose width from 70ch to 76ch, removed the decorative page background on article pages, tightened the lead title scale, and standardized h2-h4 on the Chinese sans-serif stack.
- Increased the desktop TOC to 252px and fixed its active indicator geometry. The measured top/height difference is below 0.6px.
- Added client-side category pagination driven by the existing `limit` field, URL state through `?page=N`, browser history support, disabled boundary states, and an `aria-live` page counter.
- Added `tools/album-maintenance.js`, `npm run album:audit`, and `npm run album:dedupe`. The build now fails when album duplicates or unreferenced duplicate files return.
- Added historical source-page and SHA-256 checks to `scripts_py/fetch_daily_images.py`; new entries persist `date` and `sha256` only after verified OSS publication.

### Cleanup Result

- Album records: 118 before, 45 after; 73 repeated records removed.
- Curated files: 196 before, 90 after; 106 unreferenced automated-fetch files removed.
- `source/img`: 665 MB before, 251 MB after.
- Reclaimed size: 433,709,917 bytes (about 414 MB).
- Post-cleanup album audit: 0 repeated entries, 0 exact-hash groups, 0 unreferenced duplicate files.

### Verification

```bash
npm run album:audit
npm run audit:repo
npm run audit:content
npm run test:image-pipeline
npm run build
node --check source/js/xiaoao-site.js
node --check tools/album-maintenance.js
PYTHONDONTWRITEBYTECODE=1 python3 -m py_compile scripts_py/fetch_daily_images.py scripts_py/picgo_upload.py
xmllint --noout public/rss.xml public/github-trends/rss.xml public/search.xml public/sitemap.xml
```

Results:

- Final build generated 101 files; repository audit, album audit, image pipeline tests, JS/Python syntax checks, XML validation, and build pollution checks passed.
- Internal route audit checked 177 HTML files and found 0 unresolved routes.
- Homepage passed 1440x900, 1280x800, 1024x768, 390x844, and 414x896 without horizontal overflow. The featured article title begins at y=737 on 390x844.
- Desktop navigation exposes 首页、专题、文章、趋势、相册、关于 at 1440px. Mobile retains the compact menu.
- TOC forward, reverse, article-bottom, direct-hash, mobile open/Escape/focus-return checks passed. The direct hash remained aligned after delayed images loaded.
- Anime pagination renders 12 items on page 1 and 7 on page 2, restores `?page=2`, and exposes 19 unique rendered image URLs.
- Browser resource inspection found 0 external font requests.

Screenshots:

- `docs/design/home-refinement-1440.png`
- `docs/design/home-refinement-390.png`
- `docs/design/article-refinement-1440.png`
- `docs/design/album-pagination-1280.png`

### Deviations And Remaining Work

- PicGo is still unavailable at `http://127.0.0.1:36677`, so the existing 45 local album entries and 52 local post covers were not replaced with invented OSS URLs. The corrected pipeline prevents any new local fallback from being published.
- The content audit still reports 40 original articles without descriptions, 38 without `cover_alt`, 19 historical placeholder body-image sets, 28 files over 2 MB, and 3 duplicate groups under the GitHub Trends asset directory. These are retained content-migration tasks, not album duplicates.

### Follow-up Rollback

Revert the final refinement block in `source/custom/xiaoao-redesign.css`, the Hero copy/style binding in `themes/anzhiyu/layout/includes/header/index.pug`, TOC/pagination changes in `source/js/xiaoao-site.js` and the two Pug templates, and remove the album maintenance scripts from `package.json`/`tools/build.js`. To restore removed generated album files, recover them from Git where tracked or from the original external source; untracked scheduled-run files are not recoverable from Git. Do not restore the user-deleted `article-flowable.png`.
