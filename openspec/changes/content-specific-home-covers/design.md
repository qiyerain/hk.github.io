## Approach

Use a consistent dark technical drawing system with a distinct, factual diagram for each article. The homepage hero maps the site's three main topics. Each card visually identifies the article's key mechanism: tool use, Agent loop, code assistant tools, deploy pipeline, content publishing pipeline, browser process cleanup, mobile mirroring, Codex theme conversion, or career resilience.

The source generator in `tools/` records the diagrams as structured data and produces self-contained 1200 x 675 SVG files. SVG keeps the assets small and sharp at both desktop and mobile card sizes. The fixed assets are served from the same origin as the static site. No runtime image service is involved.

Article front matter supplies a single cover URL across home, archive, and post views. The header uses a separate site-topic diagram. The home template sets explicit intrinsic dimensions, high fetch priority for the lead, and lazy loading for the eight recent cards.

## Verification

Check generated SVG sizes and references, build the Hexo site, inspect rendered home and article URLs, verify desktop/mobile crops and loading behavior, then run the repository hygiene audit.

## Rollback

Revert the front matter URLs, `index_img`, template attributes, and generated assets together.
