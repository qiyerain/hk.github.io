# LangChain Agent 系列文章 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 产出三篇 LangChain Agent 系列技术文章（概念篇、架构篇、实战篇），面向 AI 新手。

**Architecture:** 三篇 Hexo 博客文章，存放在 `source/_posts/agent/` 目录，跟现有文章格式一致。架构图从 visual companion mockup HTML 截图后存入 `source/img/agent/`，文中以相对路径引用。

**Tech Stack:** Hexo + Markdown (frontmatter: title/date/categories/tags)

---

### Task 0: 准备图片资源

**Files:**
- Create: `source/img/agent/reat-cycle.png`
- Create: `source/img/agent/llm-vs-agent.png`
- Create: `source/img/agent/self-correct.png`
- Create: `source/img/agent/arch-three-layers.png`
- Create: `source/img/agent/arch-components.png`
- Create: `source/img/agent/arch-execution-chain.png`
- Create: `source/img/agent/arch-agent-types.png`

- [ ] **Step 1: 截图第一篇插图 (reat-cycle mockup)**

在浏览器打开 visual companion 后截取以下区域（或等文章撰写时直接从 visual companion 导出）：
- 普通 LLM vs Agent 对比区块 → `source/img/agent/llm-vs-agent.png`
- ReAct 循环示意图 → `source/img/agent/reat-cycle.png`
- Agent 自我纠错示例 → `source/img/agent/self-correct.png`

- [ ] **Step 2: 截图第二篇插图 (agent-architecture-v2 mockup)**

- 三层包结构图 → `source/img/agent/arch-three-layers.png`
- 核心组件关系图 → `source/img/agent/arch-components.png`
- 完整执行链路图 → `source/img/agent/arch-execution-chain.png`
- Agent 类型对比表 → `source/img/agent/arch-agent-types.png`

- [ ] **Step 3: 提交图片**

```bash
git add source/img/agent/
git commit -m "feat: 添加 LangChain Agent 系列文章配图"
```

---

### Task 1: 第一篇 — 概念篇

**Files:**
- Create: `source/_posts/agent/LangChain-Agent-01-概念篇-Agent是什么.md`

- [ ] **Step 1: 写作 frontmatter + 引言 + LLM 局限**

```markdown
---
title: LangChain Agent 系列(一)：Agent 是什么？
date: 2026-06-17 08:00:00
categories:
- AI
- Agent
tags:
- LangChain
- Agent
- LLM
- AI教程
---

## 你让 ChatGPT 帮你统计项目代码行数，它说"抱歉，我做不到"

这是普通 LLM 最尴尬的时刻——它很聪明，但被困在训练数据的牢笼里。

本文是 LangChain Agent 系列的第一篇。我们先用大白话讲清楚 Agent 到底是什么、为什么需要它，不写一行代码。

篇幅：约 2000 字
```

- [ ] **Step 2: 写作"普通 LLM 的局限"章节**

三个具体痛点 + 配图 `llm-vs-agent.png`：
1. 无法触及真实世界（查文件、调 API、看天气）
2. 复杂任务一步到位出错率高
3. 无法自我修正——错了就错了

引用示例：让 ChatGPT 统计目录下 .py 文件行数 → "我无法读取你的文件系统"

- [ ] **Step 3: 写作"Agent 的核心思想"章节**

核心论点：Agent = LLM + 工具 + 决策循环

配图 `reat-cycle.png`（ReAct 循环示意图）

解释三点：
- **工具**：Agent 的"手和眼睛"——能搜网页、读文件、执行代码、调 API
- **决策循环**：Think（思考下一步）→ Act（执行动作）→ Observe（观察结果），循环直到任务完成
- **实习生类比**：就像你给实习生一个任务，他会查资料→给你看草稿→你反馈→他继续改

- [ ] **Step 4: 写作"ReAct 循环详解"**

用"帮我统计目录下 .py 文件行数"完整走一遍：

| 步骤 | 角色 | 内容 |
|------|------|------|
| Think | Agent | 我需要先知道目录下有哪些文件 |
| Act | Agent | 执行 `ls *.py` |
| Observe | 环境 | a.py, b.py, utils.py |
| Think | Agent | 现在统计每个文件行数 |
| Act | Agent | 执行 `wc -l *.py` |
| Observe | 环境 | a.py 45行, b.py 102行, utils.py 67行 |
| Think | Agent | 信息够了，整理答案 |
| Answer | Agent | "共3个文件，合计214行" |

- [ ] **Step 5: 写作"Agent 的自我纠错"章节**

配图 `self-correct.png`：

展示 Agent 最大的优势——犯错后能自己发现并修复：
1. 用户让 Agent 连数据库查数据
2. Agent 写代码执行 → 报错 Connection refused
3. Agent 思考："连接被拒绝，可能是端口不对？"
4. Agent 读配置文件 → 发现端口写错了 → 修正 → 重新执行 → 成功

- [ ] **Step 6: 写作"Agent 能做什么 + 下篇预告"**

能力对比表（LLM vs Agent：获取实时信息/执行代码/读写文件/调用API/自我纠错/多步推理/生成文本）

下篇预告：LangChain 如何实现这套机制？下一篇拆解架构。

- [ ] **Step 7: 提交**

```bash
git add source/_posts/agent/LangChain-Agent-01-概念篇-Agent是什么.md
git commit -m "feat: LangChain Agent 系列(一) 概念篇"
```

---

### Task 2: 第二篇 — 架构篇

**Files:**
- Create: `source/_posts/agent/LangChain-Agent-02-架构篇-LangChain内部怎么转的.md`

- [ ] **Step 1: 写作 frontmatter + 引言**

```markdown
---
title: LangChain Agent 系列(二)：LangChain Agent 内部怎么转的？
date: 2026-06-19 08:00:00
categories:
- AI
- Agent
tags:
- LangChain
- Agent
- 架构
- AI教程
---

## 上一篇我们讲了 Agent 的"道"——Think → Act → Observe 循环。这一篇讲"术"——LangChain 是怎么把这套机制实现出来的。

本文拆解 LangChain 的三层包结构和 Agent 核心组件。读完你能看懂 Agent 的每一行代码在做什么。

篇幅：约 3000 字
```

- [ ] **Step 2: 写作"三层包结构概览"**

配图 `arch-three-layers.png`：

| 层 | 包名 | 职责 |
|---|---|---|
| 基础抽象层 | langchain-core | Runnable 协议、BaseTool、Messages、Callbacks |
| 经典集成层 | langchain-classic | Chains、100+ 工具集成、Agent 实现、Document Loaders |
| 新版 API | langchain v1 | 精简设计，Agent 优先 |

解释为什么要拆三层：解耦——core 只定义抽象，不依赖任何模型提供商；classic 是历史包袱但集成最全；v1 是未来方向。

- [ ] **Step 3: 写作"核心组件拆解"**

配图 `arch-components.png`：

逐个讲解，每个组件一小段：
1. **Runnable 协议**：一切皆 Runnable，`invoke()` / `stream()` / `pipe()` 是统一入口
2. **BaseTool**：`name`（工具名）、`description`（LLM 要读的描述）、`args_schema`（参数定义）、`_run()`（执行逻辑）。用 `read_file` 工具为例
3. **Prompt 模板**：Agent 的 prompt 长什么样——System prompt 定义角色 + Tool descriptions 列出可用工具 + User input + Scratchpad 积累历史
4. **AgentAction / AgentFinish**：Agent 每一步的输出只有两种可能——再调用一个工具，或者给出最终答案
5. **Callbacks**：横向贯穿的钩子——`on_llm_start`、`on_tool_end`、`on_agent_action`，用于日志、流式输出、监控

- [ ] **Step 4: 写作"Agent 类型一览"**

配图 `arch-agent-types.png`：

| 类型 | 特点 | 适用场景 |
|------|------|----------|
| ReAct | 经典推理+行动循环 | 不支持 tool calling 的模型 |
| Tool Calling | 通用接口，跨模型 | 🌟 推荐首选 |
| OpenAI Tools | OpenAI 原生 function calling | 仅 OpenAI 模型 |
| Structured Chat | 支持多参数复杂工具 | 参数结构复杂时 |
| JSON / XML | 强制结构化输出 | 需要严格格式时 |

选型建议：模型支持 tool calling → 用 Tool Calling Agent；否则降级到 ReAct。

- [ ] **Step 5: 写作"完整链路走一遍"**

配图 `arch-execution-chain.png`：

用第一篇的同一个例子"统计 .py 文件行数"，但这次标注每步对应的 LangChain 类：

| 步骤 | LangChain 层面 |
|------|----------------|
| 用户输入 | Runnable.invoke(input) |
| Prompt 组装 | ChatPromptTemplate + MessagesPlaceholder |
| LLM 推理 | ChatOpenAI / ChatAnthropic |
| 输出解析 | OutputParser → AgentAction(tool="run_shell", ...) |
| 工具执行 | BaseTool._run() |
| 观察回填 | AgentStep → scratchpad |
| 循环判断 | AgentFinish? 继续循环? |

- [ ] **Step 6: 写作"总结 + 下篇预告"**

回顾核心概念映射：Runnable→外壳、BaseTool→能力、AgentAction/AgentFinish→决策输出、Callbacks→贯穿。下篇预告：上手写代码，从零搭建代码助手 Agent。

- [ ] **Step 7: 提交**

```bash
git add source/_posts/agent/LangChain-Agent-02-架构篇-LangChain内部怎么转的.md
git commit -m "feat: LangChain Agent 系列(二) 架构篇"
```

---

### Task 3: 第三篇 — 实战篇

**Files:**
- Create: `source/_posts/agent/LangChain-Agent-03-实战篇-从零搭建代码助手Agent.md`

- [ ] **Step 1: 写作 frontmatter + 环境准备**

```markdown
---
title: LangChain Agent 系列(三)：从零搭建代码助手 Agent
date: 2026-06-22 08:00:00
categories:
- AI
- Agent
tags:
- LangChain
- Agent
- Python
- 实战
- AI教程
---

## 终于到动手环节了。

前两篇讲了 Agent 的概念和架构，这一篇我们从头写一个能读文件、写代码、执行 Shell 的代码助手 Agent。跟着一步步来，大约 20 分钟能跑通。

篇幅：约 3500 字
```

环境准备部分：

```bash
pip install langchain langchain-core langchain-openai
```

配置 API Key：
```python
import os
os.environ["OPENAI_API_KEY"] = "sk-..."  # 或从 .env 读取
```

- [ ] **Step 2: 写作"定义三个工具"**

```python
from langchain_core.tools import tool

@tool
def read_file(path: str) -> str:
    """读取指定路径的文件内容。参数 path: 文件的绝对或相对路径"""
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

@tool
def write_file(path: str, content: str) -> str:
    """写入内容到指定路径的文件。参数 path: 目标文件路径, content: 要写入的内容"""
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    return f"已写入 {path}"

@tool
def run_shell(command: str) -> str:
    """执行 shell 命令并返回输出。参数 command: 要执行的 shell 命令。⚠️ 仅用于本地开发环境"""
    import subprocess
    result = subprocess.run(command, shell=True, capture_output=True, text=True)
    return result.stdout or result.stderr

tools = [read_file, write_file, run_shell]
```

逐行解释：
- `@tool` 装饰器：把普通函数包装成 LangChain Tool。函数名自动成为 `name`，docstring 成为 `description`，参数类型注解自动生成 `args_schema`
- `read_file`：读文件，name="read_file"，description="读取指定路径的文件内容..."
- `run_shell` 的安全提醒：仅用于本地开发环境，生产环境需要沙箱

- [ ] **Step 3: 写作"创建 Agent"**

```python
from langchain_openai import ChatOpenAI
from langchain.agents import create_tool_calling_agent, AgentExecutor

llm = ChatOpenAI(model="gpt-4o", temperature=0)

system_prompt = (
    "你是一个 Python 代码助手。你可以读取文件、写入文件、执行 Shell 命令。"
    "遇到需要操作文件或执行命令的任务时，使用提供的工具。"
    "如果执行命令出错，分析错误并尝试修复。"
    "完成任务后给出清晰的总结。"
)

agent = create_tool_calling_agent(llm, tools, system_prompt)
executor = AgentExecutor(agent=agent, tools=tools, verbose=True)
```

逐行解释：
- `create_tool_calling_agent`：为什么选 Tool Calling 而不是 ReAct——因为 GPT-4o 原生支持 tool calling，更稳定可靠
- `system_prompt`：告诉 Agent 它的角色、可用工具、遇到错误怎么办
- `AgentExecutor`：执行循环的引擎，负责 Think→Act→Observe 循环，直到 Agent 返回 AgentFinish

- [ ] **Step 4: 写作"跑起来 — 第一个示例"**

```python
result = executor.invoke({
    "input": "统计当前目录 /Users/pengfanao/code/wwrtpfa.github.io 下所有 .py 文件的行数"
})
print(result["output"])
```

展示 verbose 输出日志（简化版），标注每一部分对应 Think/Act/Observe：

```
> Entering new AgentExecutor chain...
Thought: 我需要先列出当前目录下的 .py 文件
Action: run_shell
Action Input: {"command": "ls /Users/.../ *.py"}

Observation: a.py b.py utils.py

Thought: 现在统计每个文件的行数
Action: run_shell  
Action Input: {"command": "wc -l a.py b.py utils.py"}

Observation: 45 a.py, 102 b.py, 67 utils.py, 214 total

Thought: 信息够了
Final Answer: 共3个 .py文件，合计214行
```

- [ ] **Step 5: 写作"观察 Agent 自主纠错"**

故意制造错误场景：让 Agent 创建一个有 bug 的脚本并执行：

```python
result = executor.invoke({
    "input": "写一个 Python 脚本 hello.py，打印'Hello World'，然后执行它。但请你在脚本里故意把 print 拼错成 pritn。"
})
```

展示 Agent 的自我修复过程：
1. write_file → 写入 hello.py（含有 `print("Hello World")`——Agent 纠正了拼写，说明它在推理时发现了问题）
2. 或者：写入含 `pritn` 的版本 → run_shell → 报错 NameError → Agent 读取文件 → 修复 → 重新执行 → 成功

- [ ] **Step 6: 写作"总结 + 架构回顾"**

把代码映射回架构篇的概念：
- `@tool` 装饰器 → `BaseTool`
- `create_tool_calling_agent()` → `Runnable`
- `executor.invoke()` 每一步 → `AgentAction` / `AgentFinish`
- `verbose=True` 的日志 → `Callbacks`

三篇回顾 + 后续学习建议链接。

- [ ] **Step 7: 提交**

```bash
git add source/_posts/agent/LangChain-Agent-03-实战篇-从零搭建代码助手Agent.md
git commit -m "feat: LangChain Agent 系列(三) 实战篇"
```

---

### Task 4: 系列文章互链

**Files:**
- Modify: `source/_posts/agent/LangChain-Agent-01-概念篇-Agent是什么.md`
- Modify: `source/_posts/agent/LangChain-Agent-02-架构篇-LangChain内部怎么转的.md`
- Modify: `source/_posts/agent/LangChain-Agent-03-实战篇-从零搭建代码助手Agent.md`

- [ ] **Step 1: 给三篇文章添加系列导航**

在每篇末尾添加：

```markdown
---

> 📖 **LangChain Agent 系列：**
> - 第一篇：[Agent 是什么？](./LangChain-Agent-01-概念篇-Agent是什么.md)
> - 第二篇：[LangChain Agent 内部怎么转的？](./LangChain-Agent-02-架构篇-LangChain内部怎么转的.md)
> - 第三篇：[从零搭建代码助手 Agent](./LangChain-Agent-03-实战篇-从零搭建代码助手Agent.md)
```

每篇高亮当前篇（用 `**` 加粗）。

- [ ] **Step 2: 提交**

```bash
git add source/_posts/agent/
git commit -m "feat: 添加 LangChain Agent 系列文章互链导航"
```

---

### Task 5: 验证

- [ ] **Step 1: 本地预览**

```bash
npx hexo server
```

打开 `http://localhost:4000`，检查：
- 三篇文章是否在博客列表中正常显示
- 每篇文章的排版、配图显示是否正常
- 系列导航链接是否正确跳转

- [ ] **Step 2: 修正问题（如有）**

根据预览效果调整排版、修复链接。

- [ ] **Step 3: 最终提交（如有修正）**

```bash
git add -A
git commit -m "fix: 文章排版和链接修正"
```
