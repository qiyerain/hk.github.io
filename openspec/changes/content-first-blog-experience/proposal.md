## Why

The blog currently prioritizes a full-screen brand presentation over content discovery, hides post covers behind desktop hover interactions, and uses a table of contents that can lose synchronization during long sections or reverse scrolling. Repository-level scripts, logs, screenshots, and caches also lack consistent placement rules, while the image automation can publish local fallback paths when OSS upload fails.

## What Changes

- Rebuild the homepage as a compact, content-first editorial experience inspired by ITCharge's information density, without copying its visual identity.
- Standardize visible 16:9 post covers and add optional focal-point, accessibility, featured-post, and series metadata.
- Replace the article TOC observer with deterministic scroll tracking and add an accessible mobile TOC sheet.
- Make OSS upload success a publication gate while allowing successful items in a partial batch to publish independently.
- Establish repository file-placement rules, clean current root-level debris, and add an automated repository hygiene audit.
- Require OpenSpec and an execution report for future major iterations while exempting local, behavior-preserving fixes.

## Capabilities

### New Capabilities

- `blog-reading-experience`: Content-first homepage, navigation, visible post covers, typography, and responsive behavior.
- `article-toc-navigation`: Synchronized desktop and mobile article navigation with accessible state management.
- `blog-image-pipeline`: Validated image transformation, OSS upload gating, partial-batch publication, and retry queue behavior.
- `repository-hygiene`: File placement, temporary artifact cleanup, automated auditing, and major-change documentation rules.

### Modified Capabilities

- None. The project has no canonical capability specs yet.

## Impact

- Homepage and post Pug templates, custom CSS, and site interaction JavaScript.
- Hexo helpers and post front matter conventions.
- Image automation scripts, PicGo integration, package dependencies, build scripts, and deployment checks.
- Root project guidance, ignore rules, documentation placement, and OpenSpec artifacts.
- Existing post permalinks, RSS feeds, search URLs, and the separate GitHub trends channel remain compatible.
