## Context

The site currently combines global PJAX, inline `pjax.loadUrl` calls, and a custom directory `fetch` implementation. The archive also renders image-heavy month decks, while the topic page exposes repository folders and repeats article discovery. Several templates and front-matter records reference an absent `/img/curated` tree or a placeholder OSS domain.

## Goals / Non-Goals

**Goals:**

- One predictable internal navigation path on initial load and after PJAX transitions.
- Clearly different purposes for `文章` and `专题`.
- Progressive content disclosure without month accordions or eager cover loading.
- No black cards when a remote or legacy cover fails.
- Static fallbacks remain in the existing `source/img/covers` directory.

**Non-Goals:**

- Renaming the existing trend category or changing historical permalinks.
- Migrating draft-body images or the album dataset in this interaction-focused change.
- Adding a new frontend framework or image service.

## Decisions

### Navigation ownership

Global PJAX owns ordinary internal anchors. Directory links will no longer be excluded from PJAX or intercepted by a second fetch pipeline. Local scripts may control accordions, load-more buttons, and modal state, but may not replace page navigation.

### Distinct discovery models

`文章` becomes a chronological, text-forward stream grouped only by year. An initial subset is visible and a button reveals more items in place. `专题` becomes a topic grid derived from configured subject definitions and content source/category signals. Each topic progressively reveals a short article list and provides a normal link to its full collection.

### Cover policy

Card templates use a deterministic file from the existing `/img/covers/cover-1.webp` through `/img/covers/cover-8.webp` set when no cover is supplied. Images use lazy loading and async decoding outside the lead image. A shared error handler replaces failed remote, placeholder, or removed legacy paths with that same local fallback without retry loops.

The local fallback set is static UI media and remains under `source/img/covers`. New content-specific media must be uploaded to OSS before being referenced by a published article.

### Trend naming

Public navigation and page copy use `GitHub趋势`. The internal `GitHub周周趋势` category value remains intact so feeds, filters, and historical content require no migration.

## Risks / Trade-offs

- Topic membership is based on current source/category signals, so uncategorized posts may appear only in the article stream.
- Local fallbacks improve reliability but are intentionally generic; content-specific imagery still requires a successful OSS upload.
- Removing custom directory fetch means directory changes perform a standard PJAX navigation rather than preserving exact scroll position.

## Rollback

Revert the templates, CSS, JavaScript, and display-copy changes. No content URLs or persisted data are migrated.
