## Approach

Use GitHub Trending weekly as the sole source for weekly Star increments, captured on 2026-09-19 15:38 Beijing time. Use repository README files for descriptions and limitations. Rank the editorial TOP 5 by weekly Star increment.

Render six canvases in the series' warm-paper, ink, green and orange visual family. Generate text-free structured bases first and overlay exact copy in SVG before PNG export; upload final PNGs through PicGo to OSS. The Markdown is the common source for Hexo and an inline-style WeChat rendering.

## Publication Boundary

The blog is published by an explicit `master` push after build and audit. WeChat is draft-only. A failed WeChat token request must leave `draft_media_id` absent and explain the blocker in state, without retrying `draft/add` blindly. Collection assignment is deferred because the current publisher cannot archive a draft to the album.
