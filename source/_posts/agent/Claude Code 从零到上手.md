---
title: Claude Code 从零到上手——安装、模型配置、Skill 与效率工具全指南
date: 2026-06-10 12:00:00
article_id: 3065c637-eaeb-58b1-8c66-85bebf77f262
categories:
- 工具
- AI
tags:
- Claude Code
- AI Agent
- Skill
- MCP
- 开发工具
cover: /img/covers/cover-1.webp
top_img: /img/covers/cover-1.webp

---

## 目录

- [一、为什么选 Claude Code](#一为什么选-claude-code)
- [二、快速安装](#二快速安装)
  - [2.1 安装 Node.js](#21-安装-nodejs)
  - [2.2 安装 Claude Code](#22-安装-claude-code)
- [三、模型厂商与 Coding Plan 对比](#三模型厂商与-coding-plan-对比)
  - [3.1 阿里百炼](#31-阿里百炼)
  - [3.2 腾讯云混元](#32-腾讯云混元)
  - [3.3 百度千帆](#33-百度千帆)
  - [3.4 DeepSeek](#34-deepseek)
  - [3.5 火山引擎（字节）](#35-火山引擎字节)
  - [3.6 MiniMax](#36-minimax)
  - [3.7 智谱 GLM](#37-智谱-glm)
  - [3.8 月之暗面 Kimi](#38-月之暗面-kimi)
- [四、模型厂商切换：CC Switch](#四模型厂商切换cc-switch)
- [五、Skill：Claude Code 的核心扩展机制](#五skillclaude-code-的核心扩展机制)
  - [5.1 什么是 Skill](#51-什么是-skill)
  - [5.2 常用 Skill 安装](#52-常用-skill-安装)
  - [5.3 Skill 路径](#53-skill-路径)
  - [5.4 Skill 仓库与超市](#54-skill-仓库与超市)
- [六、辅助工具推荐](#六辅助工具推荐)
  - [6.1 Starship：终端美化](#61-starship终端美化)
  - [6.2 gstack：工程团队工具集](#62-gstack工程团队工具集)
  - [6.3 Claude HUD：可视化监控面板](#63-claude-hud可视化监控面板)
  - [6.4 跳过权限确认](#64-跳过权限确认)
- [七、2026 年值得关注的新工具](#七2026-年值得关注的新工具)
- [八、总结](#八总结)
- [引用](#引用)

---

## 一、为什么选 Claude Code

Claude Code 是 Anthropic 推出的终端原生 AI 编程助手。相比 IDE 插件，它有几点核心优势：

1. **终端原生**：直接在你的 shell 里运行，能操作文件系统、执行命令、管理 git，不需要 IDE 作为中间层。
2. **Skill 机制**：通过 Skill 文件扩展 Agent 能力，类似"给 Agent 写操作手册"，比传统插件更灵活。
3. **MCP 协议**：通过 MCP (Model Context Protocol) 连接外部工具和数据源，生态开放。
4. **多模型后端**：官方使用 Claude 系列模型，但通过 CC Switch 等工具可以切换到国内模型厂商。

下面从安装开始，一步步配好你的 Claude Code 开发环境。

---

## 二、快速安装

### 2.1 安装 Node.js

Claude Code 是一个 npm 包，需要 Node.js 环境。推荐用 nvm 管理 Node 版本：

```bash
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.4/install.sh | bash

# 加载 nvm
\. "$HOME/.nvm/nvm.sh"

# 安装 Node 24
nvm install 24

# 验证
node -v   # 应输出 v24.16.0
npm -v    # 应输出 11.13.0
```

### 2.2 安装 Claude Code

```bash
# 安装
npm install -g @anthropic-ai/claude-code

# 查看版本
claude --version

# 后续升级
claude update
```

安装完成后在终端输入 `claude` 即可启动交互式会话。官方文档：[設定 Claude Code](https://code.claude.com/docs/zh-TW/setup)

---

## 三、模型厂商与 Coding Plan 对比

Claude Code 原生使用 Anthropic 的 Claude 系列模型，但国内用户可以通过第三方工具切换到国产模型。以下是主流模型厂商的 Coding Plan 概览：

### 3.1 阿里百炼

阿里云百炼平台提供 Qwen 系列等模型，支持 Coding Plan 订阅。

- 控制台：[阿里云百炼](https://common-buy.aliyun.com/coding-plan?spm=5176.44390736.0.0.7c8233a6anLRPn)

### 3.2 腾讯云混元

腾讯混元大模型提供 Coding Plan，适合腾讯云生态用户。

- 购买页：[腾讯云混元](https://buy.cloud.tencent.com/hunyuan)

### 3.3 百度千帆

百度智能云千帆大模型平台，提供文心系列模型。

- 控制台：[百度千帆](https://console.bce.baidu.com/qianfan/resource/subscribe)

### 3.4 DeepSeek

DeepSeek 独立平台，以高性价比和强代码能力著称。

- 用量页：[DeepSeek Platform](https://platform.deepseek.com/usage)

### 3.5 火山引擎（字节）

火山方舟 Coding Plan 支持的模型最丰富：DeepSeek-V4 系列、GLM-5.1、Doubao-Seed-2.0 系列、Kimi-K2.6、MiniMax-M2.7 等。订阅叠加 9.5 折，低至 38 元。

- 订阅链接：[https://volcengine.com/L/ooEqNrnaXdU/](https://volcengine.com/L/ooEqNrnaXdU/)
- 邀请码：`KGRNLDMJ`

### 3.6 MiniMax

MiniMax 提供 M2 系列模型，也有 Coding Plan 可供选择。

- 订阅方式同上（火山方舟渠道也支持 MiniMax 模型）

### 3.7 智谱 GLM

智谱 GLM Coding Plan 适配 20+ 主流工具，性价比突出。

- 拼好模活动：[https://www.bigmodel.cn/glm-coding?ic=FVAXRFATIM](https://www.bigmodel.cn/glm-coding?ic=FVAXRFATIM)

### 3.8 月之暗面 Kimi

Kimi 提供会员订阅模式，可在 Kimi 首页侧边栏进入。

- 定价页：[Kimi 会员](https://www.kimi.com/membership/pricing?from=kimi_homepage_sidebar&track_id=d5e22b46-2f5e-43a5-b1c7-b60f3b54c011)

---

## 四、模型厂商切换：CC Switch

Claude Code 默认对接 Anthropic API，要使用国内模型，需要借助 **CC Switch** 做 API 代理和模型映射。

- 项目地址：[CC Switch Releases](https://github.com/farion1231/cc-switch/releases)（当前最新 v3.16.2，2026-06-08 发布）

CC Switch 的核心原理是在本地启动一个代理服务，将 Claude Code 发往 Anthropic API 的请求拦截并转发到你配置的国内模型厂商 API，同时做请求/响应格式的兼容转换。目前 CC Switch 已不限于 Claude Code，同时支持 Codex、OpenCode、Gemini CLI 等工具。

基本使用流程：

1. 从 Release 页下载对应平台的二进制文件
2. 配置目标模型厂商的 API Key 和 Endpoint
3. 启动 CC Switch 代理
4. 设置环境变量让 Claude Code 走代理

这样 Claude Code 实际调用的就是国产模型，但交互体验保持一致。

---

## 五、Skill：Claude Code 的核心扩展机制

### 5.1 什么是 Skill

Skill 是 Claude Code 的扩展机制——本质上是给 Agent 注入一段专业领域的 System Prompt，告诉它"遇到某类任务时应该怎么做"。一个 Skill 就是一个 Markdown 文件，放在特定目录下即可被 Claude Code 自动发现和加载。

相比传统插件的优势：
- **声明式**：不需要写代码，写清楚流程和规则即可
- **可组合**：多个 Skill 可以同时生效
- **用户可控**：Skill 优先级低于用户指令，用户始终拥有最终控制权

更多原理参考：
- [Claude Code Skills 详解（一）](https://zhuanlan.zhihu.com/p/2039014962991984938)
- [Claude Code Skills 详解（二）](https://zhuanlan.zhihu.com/p/2035095579022337273)

### 5.2 常用 Skill 安装

```bash
# 前端设计
/plugin install frontend-design@claude-plugins-official

# 代码审查
/plugin install code-review@claude-plugins-official

# 代码简化
/plugin install code-simplifier@claude-plugins-official

# UI/UX 设计
claude plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill
claude plugin install ui-ux-pro-max@ui-ux-pro-max-skill

# SDD (Superpowers Driven Development)
claude plugin install superpowers@claude-plugins-official

# agent-browser（浏览器自动化）
npx skills add https://github.com/vercel-labs/agent-browser --skill agent-browser

# skill-creator（创建自定义 Skill）
npx skills add https://github.com/anthropics/skills --skill skill-creator

# Brave Search（搜索集成）
cp -r brave-search-skills/skills/* ~/.agents/skills/    # 用户级
cp -r brave-search-skills/skills/* .agents/skills/       # 项目级
```

### 5.3 Skill 路径

Skill 文件存放在以下位置：

| 平台 | 路径 |
| ---- | ---- |
| macOS | `~/.claude/skills` |
| Windows | `E:\Users\<用户名>\.claude\skills` |

用户级 Skill 对所有项目生效，项目级 Skill（`.claude/skills/`）只对当前项目生效。

### 5.4 Skill 仓库与超市

如果你不想自己写 Skill，可以从社区仓库找现成的：

- **Awesome Claude Skills**：[GitHub](https://github.com/ComposioHQ/awesome-claude-skills) — 精选 Skill 列表，涵盖开发、设计、运维等场景
- **SkillsMP**：[skillsmp.com](https://skillsmp.com/zh) — Skill 超市，可直接浏览和下载

---

## 六、辅助工具推荐

### 6.1 Starship：终端美化

Starship 是一个跨 shell 的轻量级提示符，能让终端显示 git 分支、Node 版本、命令耗时等信息，Claude Code 场景下特别实用——一眼就能看到当前项目状态。

```bash
# 先安装 Homebrew（如已安装可跳过）
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"

# 安装 Starship
brew install starship

# 配置 ~/.zshrc，在文件末尾追加
echo 'eval "$(starship init zsh)"' >> ~/.zshrc

# 生效
source ~/.zshrc
```

### 6.2 gstack：工程团队工具集

gstack 是一套面向工程团队的 Claude Code Skill 集合，提供 CEO 审查、设计评审、QA 测试、安全审计、部署等 23+ 个 Skill，远不止搜索功能。

**前置要求：** 需要安装 Bun v1.0+。

```bash
# 安装 Bun（如未安装）
curl -fsSL https://bun.sh/install | bash

# 克隆 gstack 并自动安装
git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack
cd ~/.claude/skills/gstack && ./setup
```

详细使用参考：[gstack 使用指南](https://zhuanlan.zhihu.com/p/2016572095337869346)

### 6.3 Claude HUD：可视化监控面板

Claude HUD 是一个在终端内嵌的 HUD（抬头显示）面板，可以实时显示上下文用量、活跃工具、运行中的 Agent 和 Todo 进度，让你对 Claude Code 的运行状态一目了然。

```bash
# Claude Code 内执行
/plugin marketplace add jarrodwatts/claude-hud

# 安装插件
/plugin install claude-hud

# 初始化
/claude-hud:setup
```

详细使用参考：[Claude HUD 介绍](https://zhuanlan.zhihu.com/p/2003956311793103024)

### 6.4 跳过权限确认

Claude Code 在执行文件操作、运行命令时会弹出权限确认。如果你在安全环境下希望减少打断，可以：

```bash
claude --dangerously-skip-permissions
```

> ⚠️ 这个参数会跳过所有权限确认，只在完全信任的环境中（如个人开发机）使用。Claude Code 还提供了更温和的 `--allow-dangerously-skip-permissions` 参数，仅允许跳过权限但不默认开启，安全性更高。

---

## 七、2026 年值得关注的新工具

2026 年 Claude Code 生态涌现了不少新工具，这里推荐几个实用的：

| 工具 | 用途 | Stars |
| ---- | ---- | ---- |
| [skillshare](https://github.com/obra/skillshare) | 跨工具同步 Skill（Claude Code、Codex、OpenClaw 等） | 2,190 |
| [skills-manager](https://github.com/obra/skills-manager) | 桌面端 Skill 管理器，支持 15+ 编程工具 | 2,053 |
| [awesome-claude-code-toolkit](https://github.com/obra/awesome-claude-code-toolkit) | 135 Agents + 35 Skills + 42 Commands + 176+ Plugins 合集 | 2,002 |
| [open-cowork](https://github.com/obra/open-cowork) | 开源桌面应用，一键启动 Claude Code + MCP + Skills | 1,543 |

---

## 八、总结

| 环节 | 推荐方案 |
| ---- | ---- |
| 运行时 | Node 24 + Claude Code 最新版 |
| 模型 | 海外用 Anthropic 官方，国内用火山方舟（模型最全）或智谱 GLM Coding Plan（性价比高） |
| 模型切换 | CC Switch |
| 扩展 | Skill（前端设计、代码审查、浏览器自动化、搜索等） |
| 辅助 | Starship（终端美化）+ gstack（工程工具集）+ Claude HUD（监控） |

Claude Code 的核心理念是"终端即 IDE"——不是替代 VS Code，而是提供一种更轻量、更脚本化、更 Agent 友好的编程方式。配合 Skill 和 MCP，它能做的不只是补全代码，而是真正帮你完成多步骤的工程任务。

---

## 引用

- [Claude Code 官方文档](https://code.claude.com/docs/zh-TW/setup)
- [CC Switch](https://github.com/farion1231/cc-switch/releases)
- [Awesome Claude Skills](https://github.com/ComposioHQ/awesome-claude-skills)
- [SkillsMP](https://skillsmp.com/zh)
- [gstack 使用指南](https://zhuanlan.zhihu.com/p/2016572095337869346)
- [Claude HUD 介绍](https://zhuanlan.zhihu.com/p/2003956311793103024)
- [Claude Code Skills 详解](https://zhuanlan.zhihu.com/p/2039014962991984938)
