## Context

PFA 目前有分散在文章、周报和视觉脚本中的图片约定。已有 `wechat-article-generator` 提供内容分类和视觉模板目录，但它面向文章编排，不能独立承接“只生成一张封面/架构图/知识卡片”的请求，也没有统一的项目特性 icon 和 `pfa` 品牌签名。新技能需要在仓库内可调用、可离线生成 SVG/HTML-SVG、可选用图像模型生成无文字基底，并把精确文字、数字、项目名、icon 和来源签名后置渲染。

本次首个真实验证输入是 2026-10-16 GitHub 周报，包含 TOP 5 项目、语言、用途和本周新增 Star。当前环境有 `rsvg-convert`，但不保证 Pillow 或 PicGo 可用，因此验证必须能在最小工具集下完成，并把上传失败作为明确状态。

## Goals / Non-Goals

**Goals:**

- 提供一个触发名为 `pfa-content-generate-image` 的技能，展示品牌为小写 `pfa`。
- 根据标题、摘要、类别、意图、画幅和目标渠道自动选择模板，支持显式模板覆盖。
- 初始模板覆盖高对比大字报、杂志编辑部、数据终端、轻贴纸卡片，并可继续扩展。
- 为项目/知识主题提供确定性 inline SVG icon，支持 `icon_key` 覆盖和未知主题回退。
- 对封面、知识卡片、架构图、榜单和博客插图统一输出 SVG 源、PNG、manifest 和检查结果。
- 固定安全边距、文字槽、来源签名和移动端可读性规则，并用真实周报跑通一条链路。

**Non-Goals:**

- 本次不发布博客、微信或抖音，不调用微信 draft/add、draft/update 或群发接口。
- 不把图像模型当作长中文、项目名、数字或 icon 的最终渲染器。
- 不新增重量级运行时依赖，也不重写现有周报生成器。
- 不承诺“最受欢迎”或真实平台转化率；模板选择是内容语义路由，效果仍需后续内容实验验证。

## Decisions

### 1. Skill layout and local scope

技能放在 `.codex/skills/pfa-content-generate-image/`，包含 `SKILL.md`、`scripts/`、`references/`、`assets/icons/` 和 `evals/`。这样遵循现有仓库技能约定，且不把本地个人技能未经确认写入全局目录。技能 frontmatter 使用小写短横线名，中文与品牌名放在 description 和 body。

### 2. Content routing

技能先建立 `ContentBrief`：`title`、`summary`、`category`、`intent`、`channel`、`aspect`、`items` 和 `source_urls`。路由优先级为显式 `template_id` → 类别轨道 → 内容意图 → 标题/摘要关键词 → 默认模板。模板目录使用 JSON，记录适用场景、画幅、配色、信息密度、icon family、safe margin 和文字槽，避免把路由规则硬编码进 SKILL.md。

### 3. Rendering channel

默认使用 `html-svg` 生成确定性信息图，适合项目名、Star、架构节点和中文科普文字；需要插画质感时才走 `image`，并要求图像模型只生成无文字基底，之后由 HTML/SVG 叠加所有精确内容。两条通道共享 brief、template、icon、brand 和 manifest 合约。

### 4. Icon system

icon 采用可组合的内联 SVG path/primitive，不使用 Unicode 字符或依赖字体字形。初始 icon key 包括 `agent-radar`、`migration-gamepad`、`engineering-toolbox`、`video-html`、`diagram-nodes`、`reverse-engineering-chip`、`context-compress`、`cad-cube`、`ui-window`、`fitness-dumbbell` 和 `plugin-cursor`。未知 key 使用 `generic-spark` 并在 manifest 记录 `icon_fallback: true`。

### 5. Brand and output contract

每张图底部或右下固定出现小写 `pfa`，使用统一字号、颜色和安全边距；渠道 CTA 可以另外存在。输出目录按 run id 隔离，至少包含 `source.svg`、`image.png`、`manifest.json`，manifest 记录输入摘要、路由原因、模板、icon 映射、尺寸、哈希、检查和上传状态。上传由现有 `scripts_py/picgo_upload.py` 单独执行，失败时写入错误和重试步骤，不生成假 URL。

### 6. Validation

脚本验证 SVG/PNG 尺寸、必需文本、`pfa` 签名、icon key、safe margin 以及 JSON 合法性；`rsvg-convert` 输出由 `file` 检查头信息。视觉检查仍保留人工步骤，因为乱码、重叠和裁切不能只靠字符串断言发现。仓库级完成前运行 `npm run audit:repo`。

## Risks / Trade-offs

- [模板选择可能误判] → 在 manifest 中记录路由原因，支持显式 `--template` 覆盖，并保留模板目录供迭代。
- [icon 语义过于抽象] → icon key 与 category 同时记录；未知主题回退并显式标记，不伪装成精确识别。
- [中文字体跨机器差异] → 关键文本使用可配置字体栈，SVG 保留源文件；检查以实际 PNG 渲染为准。
- [图像模型生成乱码或品牌] → 强制无文字基底和后置叠加；发现可读伪文字或水印则拒绝该基底。
- [平台视觉效果无法仅凭调研证明] → 只把研究输出当作设计假设，后续通过同题 A/B 图文和收藏/停留数据验证。

## Migration Plan

1. 创建技能目录、模板/路由/icon 参考和确定性 renderer。
2. 添加技能测试提示与本周 GitHub 周报验证 fixture。
3. 生成 2026-10-16 周报的验证图片，检查 manifest、PNG/SVG 和视觉结果。
4. 若结果不合适，优先修改模板目录或 icon 映射；旧周报脚本和文章内容无需回滚。

## Open Questions

- `pfa` 签名最终采用纯文字还是一个小型固定图章；本次先采用纯文字，避免新增品牌图像依赖。
- 后续是否把四套模板扩展成封面、正文插图、架构图分别维护的子模板；本次先通过 aspect 和 intent 留出扩展点。
