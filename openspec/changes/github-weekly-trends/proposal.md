## Why

The trend channel is presented as a daily feed even though the site is intended to offer a calmer, curated weekly digest. The daily label creates an unnecessary publishing expectation and makes the channel feel more like an automated firehose than a durable knowledge archive.

## What Changes

- Rename the visible trend channel to `GitHub周周趋势` across navigation, archive copy, home links, subscription copy, page metadata, and RSS titles.
- Rename the internal trend category contract from `每日GitHub趋势` to `GitHub周周趋势` while keeping the `/github-trends/` URL stable.
- Update trend filtering, content audits, and RSS generation to use the new category contract.
- Keep historical article URLs and historical daily snapshot wording intact; this change does not rewrite past research claims.
- Connect the homepage knowledge-base search button to the existing local-search dialog.

## Capabilities

### New Capabilities

- `github-weekly-trends`: Consistent weekly trend-channel naming and category filtering while preserving the existing public route.

### Modified Capabilities

## Impact

- Hexo configuration, trend helper and RSS generator scripts, trend page templates, homepage/archive/subscription copy, and trend post front matter.
- Generated pages and feeds will use the new channel name after the next build.
- No new dependency or external service is introduced.
