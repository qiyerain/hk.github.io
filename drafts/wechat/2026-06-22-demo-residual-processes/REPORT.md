# Demo Run · 2026-06-22 · Pack A–F

Source article: `source/_posts/agent/Claude-Code-Codex-agent-browser-残留进程排查.md`
("Mac 发热？AI 可能忘了关浏览器")

## Rendered outputs

| Pack | File | Size | Forbidden grep |
|---|---|---|---|
| A · 灰阶玻璃 | `wechat-pack-A.html` | 42 KB | 0 hits ✅ |
| B · 报刊编辑部 | `wechat-pack-B.html` | 51 KB | 0 hits ✅ |
| C · 光感卡片 | `wechat-pack-C.html` | 42 KB | 0 hits ✅ |
| D · 暗夜终端 | `wechat-pack-D.html` | 43 KB | 0 hits ✅ |
| E · 莫兰迪生活 | `wechat-pack-E.html` | 43 KB | 0 hits ✅ |
| F · 冲击标题 | `wechat-pack-F.html` | 44 KB | 0 hits ✅ |

All 6 outputs pass the WeChat HTML compatibility grep:
`grep -E '<style|class=|<head|<body|<!doctype'` returns 0 matches.

## Visual gate (validate_article_experience.py)

```
$ python3 .codex/skills/.../validate_article_experience.py \
    --markdown source/_posts/agent/Claude-Code-Codex-agent-browser-残留进程排查.md \
    --html drafts/wechat/2026-06-22-demo-residual-processes/wechat-pack-A.html
```

Result: **FAIL** — and that's correct behavior. Two real blockers:

1. `cover_or_poster_remote` ❌ — front matter `cover` is a local Hexo path `/2026/06/22/agent/.../01-infographic-ai-browser-heat.png`; must be OSS URL per CLAUDE.md §5.
2. `in_article_images_remote` ❌ — 3 inline images are all local paths (`02-framework-process-tree.png`, `03-flowchart-cleanup.png`, `04-comparison-prevention.png`).

Pass:
- section_hierarchy (24 headings)
- visual_rhythm_per_600chars (0/13 windows starved, after fix)
- mobile_paragraph_length
- html_inline_style_only
- html_color_hierarchy (8 distinct colors + inline heading color)
- html_images (4 imgs rendered)
- html_callout_or_quote
- html_image_alt_or_caption

## Next steps to ship this article

1. Run `python3 scripts_py/picgo_upload.py source/_posts/agent/2026-06-22-Claude-Code-Codex-agent-browser-残留进程排查/`
   to upload the 4 PNGs (cover + 3 inline) to OSS.
2. Rewrite the Hexo Markdown image paths to OSS URLs.
3. Re-run the renderer; visual gate will go green.
4. Run `md2wechat_bridge.py --theme ink-minimal --fallback-package --draft`
   only when ready to push the WeChat draft.

## Bug fixed during demo

`validate_article_experience.py::visual_rhythm_per_600chars` used to give
false positives. The old impl ran regex `^...` against a whitespace-stripped
window, so `^` never matched. Rewrote to:

- compute non-whitespace offsets of every break (H2+, blockquote, list,
  code fence, image line, hr) in the source body,
- bucket those offsets into 600-char windows,
- mark a window starved only if no break starts in it AND the closest
  previous break is >200 chars away (anchors carry over).

This is why `visual_rhythm_per_600chars` now passes on this article.
