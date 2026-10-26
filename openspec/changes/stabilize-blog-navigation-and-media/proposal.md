## Why

Core discovery links intermittently fail because multiple scripts compete to own navigation, while archive and directory pages duplicate each other and eagerly request broken cover URLs. Search hot terms are visually merged and the public GitHub trend label is unnecessarily verbose.

## What Changes

- Make PJAX the single owner of internal link navigation and keep custom JavaScript limited to local UI state.
- Turn the article archive into a lightweight chronological stream with progressive reveal.
- Turn the topic page into meaningful subject collections instead of a physical source-folder browser.
- Add stable local cover fallbacks from `source/img/covers` and lazy image failure recovery.
- Render search hot terms as distinct interactive tags.
- Change the public label from `GitHub周周趋势` to `GitHub趋势` while preserving the existing route and category contract.
- Keep static and fallback media under `source/img`; content media remains OSS-hosted.

## Capabilities

### New Capabilities

- `reliable-content-discovery`: Stable navigation, differentiated article/topic views, progressive rendering, and media fallback behavior.

### Modified Capabilities

- `blog-reading-experience`: Homepage search and article recommendation navigation remain usable across initial and PJAX page loads.

## Impact

- Homepage, archive, topic, search, related-post, and shared layout templates.
- Custom site JavaScript and final custom CSS.
- Theme display configuration and GitHub trends page copy.
- Existing post URLs, category values, and the `/github-trends/` route remain unchanged.
