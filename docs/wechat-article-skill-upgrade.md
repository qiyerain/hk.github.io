# 微信文章 Skill 升级文档

## 背景

原 `wechat-article-generator` skill 已经能表达“调研、写作、生成 Markdown/HTML、发布博客、准备公众号草稿”的目标，但实现上仍偏自研脚本：

- 微信 HTML 由 `package_article.py` 简单转换，排版确定性和视觉丰富度有限。
- 草稿前检查不够系统，无法像成熟工具一样明确指出配置、封面、主题、微信凭证等阻塞项。
- 获取 `thumb_media_id`、上传封面、创建草稿等能力分散在兜底脚本里。
- 对开源 `geekjourneyx/md2wechat-skill` 的成熟能力还没有纳入主链路。
- 用户明确要求公众号文章不能只重内容，必须有海报、图文结合、参考高流量文章的层次排版、颜色区分和移动端阅读体验。

对比 `md2wechat-skill` 后，结论是：它更适合作为“公众号排版、预览、检查、上传、草稿”的底层工具；本项目的 skill 应继续负责“联网调研、理解续写、博客目录规范、Hexo 发布、本地归档”的总控流程。

## 目标

升级后的 skill 目标是形成一条更稳定的端到端链路：

1. 联网调研或读取用户给定材料。
2. 理解内容，形成文章角度和信息层级。
3. 写出适合 Hexo 博客沉淀的 Markdown。
4. 优先调用 `md2wechat` 生成公众号预览 HTML 和最终 HTML。
5. 保留本地兜底脚本，避免外部 CLI 不可用时完全阻塞。
6. 支持本地博客发布。
7. 支持公众号草稿上传，但默认不产生远程副作用。
8. 直接发布必须经过用户明确确认。
9. 输出必须满足阅读体验硬门槛：封面/海报、正文配图、视觉节奏、颜色层次、移动端可读性。

## 改动点

### 1. 重写主 SOP

更新：

```text
.codex/skills/wechat-article-generator/SKILL.md
```

核心变化：

- 明确 `wechat-article-generator` 是总控 workflow。
- 默认优先使用 `md2wechat` 做微信排版、预览、检查和草稿。
- 保留 `package_article.py`、`wechat_mp.py` 作为 fallback。
- 明确副作用边界：默认只生成本地包；只有用户要求时才上传草稿；只有明确确认时才发布。

### 2. 新增 md2wechat 桥接脚本

新增：

```text
.codex/skills/wechat-article-generator/scripts/md2wechat_bridge.py
```

能力：

- 运行 `md2wechat doctor --json`。
- 运行 `md2wechat inspect --json`。
- 输出 `preview.html`。
- 输出 `wechat.html`。
- 可选 `--draft` 创建公众号草稿。
- 可选 `--upload` 上传文章图片。
- 支持 `--theme`、`--mode`、`--cover`、`--cover-media-id`、`--wechat-account` 等参数。
- 支持 `--fallback-package`，当 `md2wechat convert` 失败或未产出 `wechat.html` 时用本地 HTML 渲染兜底，并保留 `convert.error.txt`。

默认无远程副作用。

### 3. 新增 md2wechat 集成参考

新增：

```text
.codex/skills/wechat-article-generator/references/md2wechat-integration.md
```

内容包括：

- 发现命令。
- 推荐主题。
- 高级排版模块使用纪律。
- 哪些命令无副作用，哪些命令会上传或创建草稿。
- readiness/doctor 的使用边界。

### 4. 更新 UI 元信息

更新：

```text
.codex/skills/wechat-article-generator/agents/openai.yaml
```

让 skill 在列表里更准确表达“调研写作、博客发布、md2wechat 排版与公众号草稿”。

### 5. 新增阅读体验标准

新增：

```text
.codex/skills/wechat-article-generator/references/visual-experience.md
```

核心要求：

- 每篇文章必须有封面/海报。
- 正文必须图文结合，长文按 500-800 中文字符补充一处视觉锚点。
- 参考高流量公众号排版：强开头、短段落、分层标题、重点块、截图/图解、总结卡、CTA。
- 颜色层次必须清晰，标题、引用、重点、CTA 不应像普通正文一样平。

### 6. 新增阅读体验验证脚本

新增：

```text
.codex/skills/wechat-article-generator/scripts/validate_article_experience.py
```

验证项：

- front matter 是否有 `cover` 或 `poster`。
- Markdown 是否至少有一张正文图。
- 是否有多级标题。
- 是否有引用/列表等视觉断点。
- 是否存在过长段落。
- HTML 是否包含图片、callout/quote 和足够的颜色层级。

### 7. 增强 fallback HTML 排版

更新：

```text
.codex/skills/wechat-article-generator/scripts/package_article.py
```

改进：

- 渲染 front matter 中的 `cover`/`poster` 作为文章顶部海报。
- 增强标题、导语、引用、图片、列表、分割线的颜色层次。
- 增加移动端适配和更强的图文阅读节奏。

## 验证过程

验证项：

1. 检查本机是否已安装 `md2wechat`。
2. 检查 `md2wechat version --json`。
3. 检查 `md2wechat doctor --json`。
4. 运行新增桥接脚本的语法检查。
5. 运行新增桥接脚本的 `--help`。
6. 运行 skill 基础校验。
7. 使用测试 Markdown 运行桥接脚本的本地预览/转换链路。
8. 当 API 转换失败时，验证 fallback 是否能生成本地 `wechat.html`。
9. 使用含封面和正文图的测试 Markdown 验证阅读体验脚本。

## 执行结果

已完成：

- `md2wechat` 已安装，版本为 `2.6.0`。
- `md2wechat doctor --json` 可运行，本地配置检查返回 ready。
- `github-readme` 主题可被 `md2wechat themes show github-readme --json` 识别，且为 selectable API 主题。
- `md2wechat_bridge.py --help` 正常。
- `md2wechat_bridge.py --check-only` 正常，能输出 `doctor.json`。
- skill 通过 `quick_validate.py` 校验。
- 测试 Markdown 通过桥接脚本生成：
  - `doctor.json`
  - `inspect.json`
  - `preview.html`
  - `wechat.html`
- 已新增并验证阅读体验脚本，确保文章必须包含封面/海报、正文图片、视觉断点和 HTML 颜色层次。
- 使用 `/tmp/wechat-visual-smoke.md` 进行图文排版验证，产物位于 `/private/tmp/wechat-visual-smoke/`，`validate_article_experience.py` 返回 pass。
- 已按用户要求改为当前配置下优先走免费/本地路线：当付费排版接口不可用或人工智能模式只产生提示文本时，自动用本地中文排版覆盖 `preview.html` 和 `wechat.html`。
- 阅读体验标准已从“至少一张正文图”提升为“至少两张正文图”。
- 使用主题“本次创建的这个 skill 的背景和核心流程、原理，解决了什么问题，最终可以做的效果”重新生成测试稿，预览页可见英文数量为 0，阅读体验验证通过，并已上传到公众号草稿。
- 根据公众号草稿实测问题，新增微信草稿兼容规范：最终上传 HTML 不再依赖 `<style>`、class、`<head>`、`<body>`，改为全内联样式；生成图片先转 PNG，再上传到微信图文图片接口替换本地地址。
- 新版内联样式草稿已上传成功，返回草稿 `media_id`: `zdr76s0MQZwqyFoO5jodPLWt4063t6wh4hb5L_mAKiewmKifcFUyfeFftGpMivZ5`。
- 公众号实测发现旧图片由 Quick Look 生成为 1200×1200 方形缩略图，导致横版海报在草稿里出现大块空白、右侧裁切感和图文割裂。
- 图片生成流程已改为使用 Chrome 按原始画布尺寸导出：封面 1080×460，正文图 1000×560、1000×620；图片 HTML 使用 `width:100%;max-width:100%;height:auto`，不再使用裁剪型样式。
- 修复后的新版草稿已上传成功，返回草稿 `media_id`: `zdr76s0MQZwqyFoO5jodPAcT1Fv3YXA5dJ0PXIwCiaJWaI2WWyWdwBsGHJp-GUbo`。

验证中发现：

- 当前 `md2wechat doctor` 显示配置 ready，但真实 API 转换返回 `401 Invalid API Key format`。
- 因此桥接脚本已增强：当 API 转换失败或 AI 模式只生成 prompt、未产出 `wechat.html` 时，使用 `--fallback-package` 会调用本地 HTML 渲染兜底，并保留 `convert.error.txt`。
- 本次没有创建微信公众号草稿，也没有直接发布，因为该类远程副作用需要用户明确要求。

最终状态：

- `wechat-article-generator` 已升级为总控 workflow。
- `md2wechat` 已接入为优先渲染/检查/草稿工具。
- 本地 fallback 仍可保证没有可用 md2wechat API 时也能生成 `wechat.html`。
- fallback HTML 已增强，支持海报、图文结合和分层颜色排版。
- 公众号发布安全边界保留：默认本地输出，草稿需显式请求，发布需明确确认。
