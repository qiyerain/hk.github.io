## Why

The current header exposes both `专题` and `文章` even though they lead to overlapping discovery experiences. The article page is a text-only stream, while the topic page opens with oversized imagery and verbose cards. Readers need one clear article entry with cover cards, pagination, and directory/tag archive paths.

## What Changes

- Remove the duplicate top-level `专题` navigation item.
- Make `/archives/` the canonical article entry, ordered newest first and rendered as cover cards.
- Enable archive pagination with 12 posts per page.
- Keep directory and tag links as compact archive controls rather than a second card experience.
- Replace the oversized topic page with a lightweight directory index.

## Impact

Header configuration, archive and directory templates, archive pagination configuration, and the existing custom discovery CSS. Article URLs and internal category values remain unchanged.
