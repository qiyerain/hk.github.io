# LangChain Agent 系列文章设计

> 三篇逐步深入的实战教程，面向 AI 新手，从概念到架构再到动手实战。

## 目标

产出三篇关于 LangChain Agent 的技术文章，面向对 LLM 有基本了解但未接触过 Agent 概念的读者。文章发布在 Hexo 博客。

## 读者画像

- 对 LLM 有基本认知（知道 ChatGPT、Prompt）
- 没接触过 LangChain 或 Agent 概念
- 有 Python 编程基础
- 想知道"Agent 到底是怎么回事"并能够自己动手做一个

## 文章结构

### 第一篇：概念篇 — "Agent 是什么？"

**定位**：建立心理模型，知道 Agent 的核心工作机制。不出现架构术语，不写代码。

**核心插图**（已设计 visual companion mockup `reat-cycle.html`）：
1. 普通 LLM vs Agent 对比（痛点切入）
2. ReAct 循环核心示意图（Think → Act → Observe）
3. 实习生类比理解
4. Agent 自我纠错示例
5. LLM vs Agent 能力对比表

**大纲**：
1. 普通 LLM 的局限（无法获取实时信息、无法执行操作、复杂任务容易出错）
2. Agent 的核心思想：给 LLM 配"手和眼睛"——工具；Think → Act → Observe 循环
3. ReAct 循环详解：用"帮我统计目录下 .py 文件行数"走一遍完整流程
4. Agent 能做什么：搜索问答、代码助手、数据分析、自动化操作
5. 下篇预告

---

### 第二篇：架构篇 — "LangChain Agent 内部怎么转的？"

**定位**：用"组装视角"拆解 Agent，读者读完能看懂 Agent 的代码结构。

**核心插图**（已设计 visual companion mockup `agent-architecture-v2.html`）：
1. LangChain 三层包结构（langchain-core / langchain-classic / langchain v1）
2. Agent 核心组件关系图（Runnable → Prompt → LLM → OutputParser → AgentAction/AgentFinish，以及 BaseTool 和 Callbacks）
3. 5 种 Agent 实现对比表

**大纲**：
1. LangChain 三层包结构概览：为什么拆三层？解耦与演进
2. 核心组件逐层拆解：
   - Runnable 协议：invoke() / stream() / batch() / pipe()
   - BaseTool：name、description、_run()、args_schema
   - Prompt 模板：System prompt + tool descriptions + scratchpad
   - AgentAction / AgentFinish：Agent 每一步的输出
   - Callbacks 机制：贯穿全流程的钩子
3. Agent 类型一览：ReAct / Tool Calling / OpenAI Tools / Structured Chat 的区别和选型
4. 一条完整链路走一遍（用户输入 → Prompt 组装 → LLM 推理 → Output Parser → Tool 执行 → Observation 回填）
5. 下篇预告

---

### 第三篇：实战篇 — "从零搭建代码助手 Agent"

**定位**：跟着代码一步步写出一个能读文件、写代码、执行 shell 的 Agent。

**大纲**：
1. 环境准备：安装 langchain langchain-core langchain-openai，配置 API Key
2. 定义三个工具：
   - read_file：读文件内容
   - write_file：写入文件
   - run_shell：执行 shell 命令（附安全提醒）
   - 每个工具解释 name / description / args_schema 的作用，呼应架构篇
3. 创建 Agent：选型解释（为什么用 Tool Calling Agent）+ 完整创建代码
4. 跑起来：第一个示例——统计目录文件行数（呼应第一篇的示例）；展示执行日志
5. 观察 Agent 自主纠错：故意给一个会出错的场景，展示 Agent 自己发现问题 + 修复
6. 总结 & 架构回顾：代码映射——Tool Creation ← BaseTool、Agent ← Runnable、每一步 ← AgentAction/AgentFinish

---

## 文章与架构图分工

| 内容 | 第一篇 | 第二篇 | 第三篇 |
|------|--------|--------|--------|
| ReAct 循环概念图 | ✅ 简化版 | - | - |
| LLM vs Agent 对比表 | ✅ | - | - |
| 三层包结构图 | - | ✅ | - |
| 核心组件关系图 | - | ✅ | - |
| Agent 类型对比表 | - | ✅ | - |
| 完整执行链路 | - | ✅ | - |
| 代码示例 | - | - | ✅ 完整代码 |
| Agent 纠错演示 | ✅ 概念级别 | - | ✅ 代码级别 |

---

## 发布形式

- 三篇文章独立发布，每篇末尾有前后篇链接
- 发布时间可间隔 2-3 天，形成连载效应

## 架构图来源

- 第一篇插图：`reat-cycle.html` (visual companion mockup)
- 第二篇插图：`agent-architecture-v2.html` (visual companion mockup)
- 图片格式：截图后嵌入文章（png）

## 不受此设计覆盖

- 博客 AI 聊天窗口功能（后续独立设计）
