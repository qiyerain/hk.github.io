# Design

## Decisions

### Pin the series to a readable style

Each weekly post declares Style Pack A. The browser gate checks computed background and text colors, because a successful Hexo build does not prove readable rendering or protect against browser-state/style-pack regressions.

### Verify collection membership through rendered output

The collection generator recognizes `GitHub周周趋势`. The workflow checks both Front Matter and the built `/github-trends/` page so taxonomy drift cannot silently omit an issue.

### Validate images by responsibility and geometry

Blog cover, WeChat cover, and portrait summary are separate native canvases. Browser verification compares natural and rendered aspect ratios so CSS or source reuse cannot squash an image. Body diagrams remain only when they carry a distinct conclusion.

### Keep verification compact

The browser pass is limited to one screenshot and one compact metrics query per viewport. It records only colors, key image dimensions, and collection-title presence instead of dumping the full accessibility tree.

### Preserve WeChat safety boundaries

The existing token preflight, 40164 stop rule, zero-list HTML contract, create-versus-update decision, and `draft/get` verification remain unchanged.

### Lead with reader decisions

Project counts and ranking-method caveats remain provenance details, not the editorial hook. The overview states the week's practical shift and routes readers to projects by goal; compact captions and sources retain the methodology needed for auditability.

### Parse links before bold emphasis

The Style Pack inline renderer tokenizes code first, links second, and bold emphasis third. This preserves links nested inside `**...**` as anchors within strong elements while keeping Markdown-looking text inside inline code untouched. A regression test protects this ordering.

## Rollback

Restore the prior automation prompt, remove the added project guidance, and revert only the current article's style/category fields. No remote draft or publication rollback is required.
