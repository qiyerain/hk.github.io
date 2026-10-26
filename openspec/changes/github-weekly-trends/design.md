## Context

The site already has a dedicated `/github-trends/` page and a helper-based trend collection. The public route is useful and should remain stable; the naming and category value are the inconsistent parts.

## Goals / Non-Goals

### Goals

- Make the channel read as a weekly editorial digest everywhere users encounter it.
- Keep old URLs valid and keep historical article body text factually unchanged.
- Ensure all code paths that exclude or collect trend posts use one category constant.
- Make the homepage search CTA invoke the same local search dialog as the navigation search control.

### Non-Goals

- Rewriting historical daily articles into weekly articles.
- Changing the source data collection cadence or adding a scheduler.
- Replacing the existing local-search implementation.

## Decisions

1. Use `GitHub周周趋势` as the canonical category and display label.
2. Keep `/github-trends/` and `/github-trends/rss.xml` unchanged to avoid breaking bookmarks and subscriptions.
3. Preserve historical post titles and body wording; only the category metadata and channel-level copy change.
4. Add the homepage search selector to the existing local-search event binding and guard each trigger against duplicate PJAX listeners.

## Risks / Trade-offs

- Existing external links to the old category archive path may no longer resolve if they target generated category URLs directly. The stable dedicated route remains unchanged; generated category redirects are outside this scoped change.
- Historical posts will still contain daily snapshot language, intentionally reflecting their original data collection date.

## Validation

- Build the site and inspect the generated trend page, category pages, and RSS title.
- Run content/repository audits.
- Browser-test the homepage search CTA and verify it opens `#local-search` without horizontal overflow.
