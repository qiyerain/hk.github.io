## Why

The supplied cache analysis is a set of screenshots. Its architecture and tradeoffs are hard to scan on a phone, and a static image cannot show how stale data moves through two cache levels.

## What Changes

- Publish a Chinese backend article explaining cache goals, key and expiry choices, the supplied project's cache layers, consistency boundaries, and memory risks.
- Include three source diagrams hosted on the blog's image service.
- Add an article-scoped interactive L1/L2/DB read and invalidation example.

## Impact

One new post in `source/_posts/后端/`, one stylesheet in `source/css/`, and one script in `source/js/`. No existing article or site-wide behavior changes.
