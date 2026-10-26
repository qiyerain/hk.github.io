---
title: Comet Skill——串起 OpenSpec 与 Superpowers，把 Spec Coding 变成稳定工作流
date: 2026-06-10 18:00:00
article_id: a427bed1-3c78-5a7b-9c96-74163a5594a8
categories:
- AI
- 工具
tags:
- Claude Code
- Skill
- Spec Coding
- OpenSpec
- Superpowers
- AI Agent
cover: /img/covers/cover-3.webp
top_img: /img/covers/cover-3.webp

---

## 目录

- [一、Comet Skill 是什么](#一comet-skill-是什么)
- [二、从 Superpowers 到 OpenSpec：Spec Coding 的探索之路](#二从-superpowers-到-openspecspec-coding-的探索之路)
  - [Superpowers 的痛点](#superpowers-的痛点)
  - [OpenSpec 的特点](#openspec-的特点)
  - [经典组合的摩擦](#经典组合的摩擦)
- [三、Comet Skill 的核心设计](#三comet-skill-的核心设计)
  - [3.1 稳定的状态扭转：引入状态机思想](#31-稳定的状态扭转引入状态机思想)
  - [3.2 意图识别：跨设备断点恢复](#32-意图识别跨设备断点恢复)
  - [3.3 人机确认机制：关键节点人工把控](#33-人机确认机制关键节点人工把控)
  - [3.4 重叠 Spec 的交接：建立单向事实链](#34-重叠-spec-的交接建立单向事实链)
- [四、Harness Engineering：Skill 侧的工程化](#四harness-engineeringskill-侧的工程化)
- [五、总结](#五总结)

---

## 一、Comet Skill 是什么

在 AI 驱动开发的浪潮下，**Spec Coding**（规格驱动编码）成为了许多开发者探索的新范式。它的核心理念是：先写清楚"要做什么"（Spec），再让 AI Agent 按照规格执行。

Comet Skill 正是在这个背景下诞生的——它将 **OpenSpec** 和 **Superpowers** 最精华的部分串联起来，打造出更易用、更稳定的 Spec Coding 工作流。

几个关键数据：
- GitHub 400+ Star
- 120+ 分钟阅读量
- 4.5k+ 次下载
- 经过生产环境验证

---

## 二、从 Superpowers 到 OpenSpec：Spec Coding 的探索之路

Spec Coding 领域有许多优秀工具：Superpowers、Everything Claude Code、OpenSpec、GStack、Spec-kit 等，开发者或多或少都用过其中一两个。但它们各有优劣。

### Superpowers 的痛点

Superpowers 作为老牌高星 Skill，核心能力在于**优秀的头脑风暴和执行力**，但在 Spec 文档管理方面存在明显短板：

**1. 上下文压缩问题**

当 Spec 文档内容过多时，会触发上下文压缩，导致 Agent 忘记回写文档。在多轮头脑风暴和文档生成过程中，大量 Token 消耗在"恢复现场"上，而实际的文档推进工作却未完成。

**2. 文档管理混乱**

同一天多次使用 Superpowers 会产生大量文档，这些文档没有明显的完成状态标识，打勾信息散落在文档细节中。开发者需要**人肉扫描文档**来识别完成情况。当存在多个同日期的 Spec 时，识别成本极高，甚至需要借助工具逐行阅读文档才能判断。

### OpenSpec 的特点

OpenSpec 则是一条更轻量的路径。它在完成提案设计后，不采用 worktree 也不强制 TDD，而是更相信 Agent 的能力，让 Agent 根据 Task 一步一步执行。

相比 Superpowers，OpenSpec 的优势在于：
- **优秀的 Spec 资产管理**：拥有非常好的归档能力
- **丰富的 CLI 命令**：方便 Agent 获取信息

但在细节的头脑风暴体验上，它不如 Superpowers 强烈。

### 经典组合的摩擦

既然两者各有优劣，经典的使用方法是将它们的强项衔接起来：**用 OpenSpec 做规划和 Spec 归档，用 Superpowers 做深度执行**。

但这种组合也带来了新的摩擦：

| 问题 | 表现 |
| ---- | ---- |
| 命令记忆负担 | 两套工具的命令需要分别记忆，操作变得繁琐 |
| 自动化断点缺失 | 执行完 OpenSpec 提案后，需要手动输入 Superpowers 命令执行下一步 |
| Spec 管理复杂度 | 引入 OpenSpec 又增加一套 Spec 管理，而 Superpowers 本身 Agent 写完代码忘记文档的问题依然存在 |

---

## 三、Comet Skill 的核心设计

基于上述问题，Comet Skill 围绕四个核心设计展开。

### 3.1 稳定的状态扭转：引入状态机思想

Agent 状态管理和文档更新是 Spec Coding 最脆弱的一环。Comet 的解法是**引入状态机思想**。

具体做法：通过 CLI 实现和 bash 脚本，将校验状态和核心文件识别程序化。Agent 不需要知道文件状态的细节，只需按规则执行核心脚本。当需要退出某个阶段时，通过程序判断是否达到条件，而不是依赖 Agent 的"感觉"。

带来的收益：
- Skill 变得更轻量，需要描述的 Prompt 更少
- 稳定性大幅提升——程序判断代替模型判断

### 3.2 意图识别：跨设备断点恢复

Comet 支持跨设备的断点恢复，核心原理是"关键文件检测 + 意图识别"。

意图识别是一个**四层漏斗**，从粗到细收敛用户意图：

```
preset 探测 → 活跃 change 发现 → 状态快照读取 → 阶段判定链
```

设计约束很清晰：**无歧义时自动推进，有歧义时等待用户确认**。

这意味着当开发者重新回到工作区时，无论是否在同一台电脑、窗口是否包含上下文，都不需要重新解释背景。只需执行 `comet 继续` 命令，就能从核心文件恢复当前状态，继续推进需求。

### 3.3 人机确认机制：关键节点人工把控

Comet 并非"一跑到底"的全自动流程。在五阶段流程自动触发的过程中，以下关键节点仍需要人工确认：
- 分支选择
- 执行方式选择
- Spec 调整

Comet 的做法是提供默认推荐项，同时依赖 Agent 自主识别选项。这满足了开发者在**生产级工作中对关键节点把控**的需求，避免了"一跑到底"与 Vibe Coding 无差别的问题，确保代码的完整可靠性。

### 3.4 重叠 Spec 的交接：建立单向事实链

这是 Comet 最精妙的设计。OpenSpec 和 Superpowers 都会产生 Spec，为了消除两者功能重叠带来的歧义，Comet 在它们之间建立了**单向事实链**：

| 层级 | 工具 | 职责 |
| ---- | ---- | ---- |
| 需求侧唯一事实源 | OpenSpec | 定义验收场景、能力边界、行为契约 |
| 实现侧 | Superpowers design doc | 负责数据流、实现方案等 |

关键约束：**Superpowers 的 design doc 不得自行补写需求**。

两者的衔接通过 `comet-handoff.sh` 脚本实现。该脚本从 OpenSpec 产物中生成结构化的交接包，包含：
- 源文件路径
- 行范围
- SHA256 哈希
- 确定性摘录（而非 Agent 临场手写的 Summary）

并且明确声明 `canonical_spec: openspec`，表明需求定义权归属上游。

如果 Superpowers 在深度设计中发现 OpenSpec 遗漏了验收场景，不允许在 design doc 中自行补写，只能提出 Spec patch 回写到 OpenSpec 的 Delta Spec 中，最终覆盖到主 Spec，完成整个 Spec 生命周期的闭环。

```
OpenSpec（需求定义）
    ↓ comet-handoff.sh 交接包
Superpowers design doc（实现方案）
    ↓ 发现遗漏 → Spec patch
Delta Spec → 回写 → OpenSpec 主 Spec
```

---

## 四、Harness Engineering：Skill 侧的工程化

Comet 本质上做的是 **Harness Engineering**（Skill 侧的工程化），而非 SDK 代码层面的工作。

这也是为什么去年爆火的 deep research 应用都转化为了 deep research 的 skill——因为 skill 让写 prompt 的过程从 SDK 中跳了出来，变成了人人可写的工具。

在 Skill 编排方面，以 OpenSpec 为例，它允许一定的 Skill 编排能力。用户可以创建一个路由 Skill，在里面写上"先调用 A skill 再调用 B skill"，最简单的编排就完成了，甚至只需要一句话。随着数据积累，模型能够内化选择组合哪些 Skill、自行迭代哪些 Skill 的能力，而这些是可以通过 Benchmark 训练的。

**真正的核心能力是让 Skill 变得更稳定，而这一过程就是在走 Harness Engineering 的路。**

---

## 五、总结

Comet Skill 解决的核心问题是：**把 Spec Coding 从"能用"变成"稳定可用"**。

| 设计要点 | 解决的问题 |
| ---- | ---- |
| 状态机思想 | Agent 状态管理脆弱、文档回写丢失 |
| 意图识别 + 断点恢复 | 多设备、多场景下需要重复解释背景 |
| 人机确认机制 | 全自动流程缺乏关键节点把控 |
| 单向事实链 | OpenSpec 与 Superpowers 的 Spec 重叠和歧义 |

Comet Skill 的出现，为开发者在 AI 时代的 Spec Coding 提供了新的可能。它帮助开发者管理 Spec、专注执行，让大家能够在 AI 时代 Vibe Coding 出自己的创意。
