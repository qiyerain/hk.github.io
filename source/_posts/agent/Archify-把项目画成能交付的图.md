---
title: 用 Archify 把项目画成能交付的图：安装、用法与一次真实产出
date: 2026-10-24 14:10:00
article_id: cde0f994-8883-54b8-a07e-efa29bd964fe
categories:
  - agent
tags:
  - Archify
  - Skill
  - 架构图
  - 可视化
  - 开源
cover: https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/blog/archify-cover-v2-1600x900.png
top_img: https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/blog/archify-cover-v2-1600x900.png
cover_alt: Archify 十种原生图类型与四道交付门禁的概览图
description: Archify 是一个把想法或仓库变成可交互 HTML 图的 Agent Skill：十种原生图、类型化 JSON 源文件、交付前四道检查。这篇讲清它是什么、怎么装、怎么用，以及我拿 DeepSeek Harness 跑出的一张真实架构图。
---

> **画图最难的不是画，是画完之前发现自己画错了。**

我这周要给 DeepSeek Harness 画一张架构图。试过手写 SVG，也试过 Mermaid，前者改一次要重排一次坐标，后者能出图但读起来像流程清单，不像系统。

后来用了 Archify。它做的事有点不一样：图不是画出来的，是**生成、检查、再交付**的。源文件是一份带类型的 JSON，交付前要过四道门，最后的产物是一个能点、能筛、能导出的单文件 HTML。

这篇文章讲清三件事：它是什么、怎么装怎么用、以及我用它给 dsh 做的那张图。

> **一句话看懂：Archify 把图当成有源文件和验收标准的交付物，而不是一次性的截图。**

## 目录

- [一、这个项目是什么](#一、这个项目是什么)
- [二、它和 Mermaid、画图工具的区别](#二、它和-Mermaid、画图工具的区别)
- [三、安装](#三、安装)
- [四、先选对图类型](#四、先选对图类型)
- [五、一条流水线走完交付](#五、一条流水线走完交付)
- [六、真实产出：DeepSeek Harness 架构图](#六、真实产出：DeepSeek-Harness-架构图)
- [七、图上还能做什么](#七、图上还能做什么)
- [八、我踩的坑](#八、我踩的坑)
- [清单](#清单)

---

## 一、这个项目是什么

Archify 是 [tt-a1i](https://github.com/tt-a1i) 做的一个 Agent Skill，仓库在 [github.com/tt-a1i/archify](https://github.com/tt-a1i/archify)，MIT 许可，当前稳定版 3.2.0（2026-10-18 发布）。

它的定位一句话就能说完：**把你想说清楚的东西，变成一张可以探索的图。**

具体支持十种原生图类型：

| 类型 | 回答什么问题 |
| --- | --- |
| `architecture` | 系统由什么组成，边界在哪 |
| `workflow` | 几步做完，哪一步要人批 |
| `sequence` | 一次请求经过了谁 |
| `dataflow` | 数据从哪来，到哪去 |
| `lifecycle` | 现在处于什么状态 |
| `erd` | 表和表之间怎么关联 |
| `class` | 类型与继承怎么组织 |
| `tree` | 层级与从属 |
| `timeline` | 什么时候发生了什么 |
| `waterfall` | 时间花在哪一段 |

另外还有一个 `explainer` 模式：不是画图，是把一个问题的答案做成一页，结论在前，每块配图。

项目的热度不低：GitHub 上 8.8 万星，skills.sh 上 13 万+ 安装，作者说它上过 GitHub Trending 的周榜第一。这些数字我只是转述，没去核验。

对我来说更有说服力的是它解决了一个真实痛点：**图和事实会脱节。**

Mermaid 里的方框是纯文本，没人知道它对应哪个文件。Archify 的 architecture 类型可以给每个节点挂 `sources`，写清楚文件名和行号，还要锁定一个 40 位的提交哈希。图上的每个断言都能点回源码。

## 二、它和 Mermaid、画图工具的区别

三个区别，决定了它适合什么场景。

**第一，源文件是带类型的 JSON，不是文本 DSL。**

每种图类型都有自己的 schema，字段有约束。这意味着写错了会在校验阶段报错，而不是渲染出一张看着还行、实际有歧义的图。

**第二，布局是"作者判断 + 机器校验"，不是全自动。**

坐标由写源文件的人（或者你的 agent）按真实连线来排。工具会检查：标签有没有压到线、框有没有越界、两条关系有没有交叉。Archify 自己在文档里写得很清楚：它不是通用自动布局工具，也不是 Mermaid 主题。

**第三，交付前要过门。**

最后一步不是"渲染出一个 HTML"，而是"通过 schema、布局、HTML/SVG、路由和标签避让检查之后，原子替换目标文件"。失败会返回稳定的规则码和可修复项，而不是一段 Node 报错栈。

第三条是它跟"画图工具"最大的分界：**它认失败。**

## 三、安装

一条命令，装在全局：

```bash
npx skills add tt-a1i/archify -g
```

`skills` 是一个跨宿主的 skill 安装器。装完之后，Claude Code、Codex CLI、OpenCode、Cursor 都能用，区别只是目录：

| 宿主 | 安装位置 |
| --- | --- |
| Claude Code | `~/.claude/skills/` 或 `.claude/skills/` |
| Codex CLI | `~/.agents/skills/` 或 `.agents/skills/` |
| OpenCode | `~/.config/opencode/skills/`、`.opencode/skills/` 或 `.agents/skills/` |

我的机器上它落在 `~/.agents/skills/archify/`，Codex 和 OpenCode 共用这一份。

不想装也可以先试：

```bash
npx skills use tt-a1i/archify@archify --agent codex
```

如果你在用 DeepSeek Harness，作者还提供了一个社区集成（不是官方插件）：

```bash
dsh plugin --profile web add @tt-a1i/archify-dsh@1.0.0
```

装完先跑一次自检，确认 Node 环境和渲染依赖都在：

```bash
node ~/.agents/skills/archify/bin/archify.mjs doctor
```

`doctor` 会告诉你 Chrome 在不在、模板齐不齐。Chrome 是后面 `browser-check` 和 `visual-check` 用的——它们不是模拟渲染，是真的开一次浏览器截图。

## 四、先选对图类型

选错类型，画得再漂亮也没人看得懂。这张表是我动手前的第一道判断。

![先问要回答什么，再挑图类型](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/blog/archify-type-router-1200x675.png)

拿不准的时候别猜，直接问 CLI：

```bash
node ~/.agents/skills/archify/bin/archify.mjs guide "API 请求经过 Redis 缓存，miss 之后查 PostgreSQL"
```

它会给出建议的类型和理由，`--json` 还能拿到结构化结果。

有个经验：**"谁调用谁"用 architecture，"先做什么后做什么"用 workflow，"一次请求的时间顺序"用 sequence。** 这三个最容易混，也最容易选错。

## 五、一条流水线走完交付

Archify 的目录约定很省心：每个新需求一个文件夹。

```
.archify/architecture-dsh-20261024-113112/
├── candidate.json      # 源文件，事实源
├── dsh-architecture.html  # 交付物
└── review-5/           # 每轮检查的证据
```

改图只改 `candidate.json`，不碰 HTML。这一点很重要，后面会讲为什么。

![六步走完，图才叫交付](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/blog/archify-pipeline-v2-1200x675.png)

命令不多，常用的就这几个：

| 命令 | 干什么 |
| --- | --- |
| `validate` | 只校验源文件，最快的一步 |
| `preview` | 起一个本地预览，只在通过校验时刷新 |
| `finalize` | 校验 + 渲染 + 浏览器检查，一条龙 |
| `browser-check` | 单独开浏览器验证渲染 |
| `visual-check` | 检查遮挡、越界、可读性，出截图 |
| `deliver` | 交付并可选打开 |
| `check` | 检查一个已有 HTML 是否可溯源 |
| `compare` | 两个 architecture 源做差异对比 |

最小的一条命令长这样：

```bash
node ~/.agents/skills/archify/bin/archify.mjs finalize architecture \
  .archify/architecture-dsh-20261024-113112/candidate.json \
  .archify/architecture-dsh-20261024-113112/dsh-architecture.html \
  --repo-root . --browser-check --json
```

注意 `--repo-root`：源码引用的行号要相对仓库根目录去校验，不给这个参数，`sources` 就只是装饰。

还有一条纪律：**非零退出码永远不算成功。** 失败了就读 `diagnostics`，按它给的修复项改，然后重跑整条命令。不要手改 HTML——那会让回执失效。

## 六、真实产出：DeepSeek Harness 架构图

这是我这次生成的图。

![DeepSeek Harness 架构总览：从用户到 Web 客户端、Host、Agent Loop、模型 API，以及工具与会话分支](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/blog/archify-dsh-result-1600x922.png)

图里能看出来的信息：左边是用户与 Web 客户端，中间是 Host 服务，右侧是 Agent Loop 调 LLM 运行时再打模型 API；Agent Loop 往下分出 System Prompt、工具管线、会话日志三条支路；工具管线再落到能力接缝，最后 spawn 到本机或远程执行环境。橙色的框是 `dsh 进程 · Cordis 插件树` 这个边界，外部系统和执行环境被明确地放在框外。

截图看不到的部分才是有用的部分——这张图能点、能搜、能导出。我把它一起放进了博客，点开就是完整版本：

<div class="btns wide">
<a class="button no-text-decoration" href="/demos/dsh-architecture/" target="_blank" rel="noopener"><i class="anzhiyufont anzhiyu-icon-arrow-circle-right"></i>打开这张架构图（可交互）</a>
</div>

这份源文件里的数字：

- 12 个组件，12 条关系，4 张说明卡片，1 个边界
- 26 处源码引用，每条都带文件路径和行号
- 锁定提交 `22ddee3`，产物 838,423 字节
- 12 条关系每一条都有语义（`RPC`、`SSE`、`append`、`provider`、`spawn`），没有一条是随手连的

过程比结果值得说。第一次 `finalize` 就失败了，规则码是 `composition/desktop-readability`——桌面可读性不过。简单说就是图太挤，1440 宽的视口里读不清。

我改了两处：把 `Profiles / Bundles` 移到 Agent Loop 正上方，让"装配插件树"这条线变成一条直线；把边界框收紧，让它只包住真正的进程内组件。重跑之后 `finalize` 通过，`browser-check` 和 `visual-check` 分别在 1440×900 和 2048×1320 两个视口、深色和浅色两个主题下都过了。

前前后后留下 5 份检查记录（`review-1` 到 `review-5`）。失败的那份没有删，留在目录里——下次改图时，它就是"哪里容易出错"的说明书。

这也是我觉得它比截图可靠的地方：**图的状态是可验证的。** 回执绑定了产物的 sha256，改一个字节就对不上。

如果要做图给不看代码的人，这张图可以直接发；如果要给同事讲某条链路，它能按路径高亮。

图里这些组件对应的事实，我整理在[DeepSeek Harness 学习手册](/2026/10/24/agent/DeepSeek-Harness-学习手册/)那篇里。

## 七、图上还能做什么

产物是单文件 HTML，双击就能开，不依赖 Archify。

几个我常用的操作：

- `?` 打开图例与说明
- `/` 搜节点，回车聚焦
- `R` 追一条有向路径，能看完整旅程
- `L` 对比两类角色
- `M` 打开总览雷达
- `F` 进演示模式，适合投屏
- `S` 换视觉风格，`T` 切深浅色，`E` 打开导出

导出支持 PNG、WebP、JPG 长图，也能打印成 PDF。动效可以导出成 WebM，但默认不会进静态导出——这点做得克制。

还有一个我没想到的用法：路线分享卡。选中一条路径导出 1200×630 的 PNG，整张图保留作上下文，只高亮那一条链路。发群里比截全图清楚。

## 八、我踩的坑

**坑一：以为说一句话就能出终稿。**

能出，但要改。第一版通常语义没错、布局不行。真正的活儿在"看检查结果 → 改源文件 → 重跑"这个循环里。

**坑二：手改 HTML。**

改完很好看，但回执失效，`check --require-provenance` 直接报错。而且下次重跑就覆盖了。所有修改都要落到 `candidate.json`。

**坑三：把失败当警告。**

`finalize` 返回非零退出码时，产物不会替换目标文件。这时候磁盘上那个 HTML 还是上一个通过检查的版本——看着"没变化"，其实是没交付。

**坑四：源码引用乱挂。**

`source` 要指向真正支撑这条断言的位置。挂一个文件开头当"出处"，校验能过，但图就失去了可追溯的意义。Archify 的文档里写得很直白：每个引用只证明那个位置上可见的事实。

**坑五：想拿它当画图软件。**

它不是 WYSIWYG 编辑器，也不做通用自动布局。想随手拖一个框，用别的工具更快。它的价值在"可验证的系统图"。

## 清单

- [ ] 装完先跑 `doctor`，确认 Chrome 可用
- [ ] 用 `guide` 确认图类型，别凭感觉选
- [ ] 每个需求一个 `.archify/` 子目录，源文件叫 `candidate.json`
- [ ] 真实仓库的图，每个关键节点挂 `sources`（文件 + 行号）
- [ ] 锁定提交哈希，别用 `main`
- [ ] 改图只改源文件，不碰 HTML
- [ ] 非零退出码当失败处理，读 `diagnostics` 再改
- [ ] 交付前确认 1440 宽视口能读清
- [ ] 保留失败记录，它是下次的避坑指南

## 引用

- 项目主页：`https://github.com/tt-a1i/archify`（MIT，v3.2.0）
- 在线示例：`https://archify.si/gallery.html`
- 技能说明：`~/.agents/skills/archify/SKILL.md`
- 交付契约：`~/.agents/skills/archify/references/delivery-contract.md`
- 本次产物：`.archify/architecture-dsh-20261024-113112/dsh-architecture.html`
- 在线交互版：[blog.pengfanao.top/demos/dsh-architecture/](/demos/dsh-architecture/)
