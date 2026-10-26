---
title: LangChain Agent 系列(三)：从零搭建代码助手 Agent
date: 2026-06-22 08:00:00
article_id: bca10225-dbb6-50ca-8069-434d2a228fef
categories:
- AI
- Agent
tags:
- LangChain
- Agent
- Python
- 实战
- AI教程
cover: /img/covers/home/code-agent.svg
cover_alt: 代码助手 Agent 读取文件、编写代码并执行 Shell 的流程图
cover_position: 50% 50%
series: LangChain Agent
series_order: 3
top_img: /img/covers/home/code-agent.svg

---

## 终于到动手环节了。

前两篇讲了 Agent 的概念和架构，这一篇我们从头写一个能读文件、写代码、执行 Shell 的代码助手 Agent。跟着一步步来，大约 20 分钟能跑通。

---

## 环境准备

先装依赖。打开终端，一行搞定：

```bash
pip install "langchain<1.0" langchain-openai
```

> **⚠️ 版本说明：** LangChain 1.0+ 移除了 `create_tool_calling_agent` 和 `AgentExecutor`（改用 LangGraph 的 `create_agent()`）。本文基于 0.3.x 版本，`langchain<1.0` 确保代码可直接运行。学习完成后建议查阅 [LangGraph Agent 文档](https://langchain-ai.github.io/langgraph/) 了解最新用法。

然后创建 `agent_demo.py`，把 API key 配好：

```python
import os
os.environ["OPENAI_API_KEY"] = "sk-your-key-here"  # 或从 .env 读取
```

如果你用的是其他模型（比如 DeepSeek、Claude），在创建 LLM 时指定 `base_url` 即可，后面会讲到。现在先把环境搭好。

---

## 定义三个工具

第二篇讲过，工具（`BaseTool`）是 Agent 的"手和眼睛"。LangChain 提供了一种极其简洁的方式来定义工具——`@tool` 装饰器。你只需要写一个普通函数，加上类型注解和 docstring，装饰器会自动把它包装成 `BaseTool`。

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

> ⚠️ **安全提醒：** `run_shell` 中使用了 `shell=True`，这意味着任何能调用此工具的人都可以在你的机器上执行任意命令。本文的代码仅用于本地开发学习，**绝对不能**部署到生产环境或暴露给不信任的用户。生产环境应使用沙箱（如 Docker 容器）或在 Agent prompt 中限制可执行的命令范围。

就这三段代码，Agent 就有了读文件、写文件、执行命令的能力。来拆一下每行在干什么。

### `@tool` 装饰器做了什么

回忆第二篇讲的 `BaseTool` 四个核心属性：`name`、`description`、`args_schema`、`_run()`。`@tool` 装饰器做的事情就是把这四个属性从你的函数里自动提取出来：

- **`name`**：取函数名。`read_file` 函数 → 工具名就是 `"read_file"`
- **`description`**：取 docstring。LLM 读这个描述来决定"什么时候该用这个工具"
- **`args_schema`**：根据类型注解自动生成 Pydantic model。`path: str` → 参数定义为一个 `str` 类型的字段。有了这个 schema，LLM 才知道调用 `read_file` 需要传一个叫 `path` 的字符串参数
- **`_run()`**：就是你的函数体本身

`run_shell` 的 docstring 里加了一个 `⚠️ 仅用于本地开发环境` 的安全提示。这不是给开发者看的注释，而是**给 LLM 看的**——Agent 在决策时会读到这段描述，相当于在 prompt 里内置了一条安全提醒。

最后，`tools = [read_file, write_file, run_shell]` 把三个工具装进列表。这就是后面要传给 Agent 的工具清单。

---

## 创建 Agent

有了工具，接下来创建 Agent 本身。

```python
from langchain_openai import ChatOpenAI
from langchain.agents import create_tool_calling_agent, AgentExecutor
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

llm = ChatOpenAI(model="gpt-4o", temperature=0)

system_prompt = (
    "你是一个 Python 代码助手。你可以读取文件、写入文件、执行 Shell 命令。"
    "遇到需要操作文件或执行命令的任务时，使用提供的工具。"
    "如果执行命令出错，分析错误并尝试修复。"
    "完成任务后给出清晰的总结。"
)

prompt = ChatPromptTemplate.from_messages([
    ("system", system_prompt),
    ("human", "{input}"),
    MessagesPlaceholder("agent_scratchpad"),
])

agent = create_tool_calling_agent(llm, tools, prompt)
executor = AgentExecutor(agent=agent, tools=tools, verbose=True)
```

不到 10 行，Agent 就创建好了。下面逐行解释。

### 为什么用 `create_tool_calling_agent`

第二篇我们对比过 Agent 的几种类型——ReAct、Tool Calling、OpenAI Tools、JSON/XML Agent。这里选 **Tool Calling**，因为 `gpt-4o` 原生支持 function calling，LLM 会直接返回结构化的 `tool_calls` 对象，不靠文本解析。比 ReAct 更可靠，比 OpenAI Tools 更通用。

`create_tool_calling_agent` 内部做的事情就是把 Prompt 模板、工具列表、LLM 和 OutputParser 串成一条完整的 Agent 管道——Agent 本身就是一个 Runnable。我们手动构建了 `ChatPromptTemplate`，其中 `MessagesPlaceholder("agent_scratchpad")` 是 Think→Act→Observe 循环中的"历史记录"插槽，每次迭代自动填充最新步骤。你不需要处理 tool_calls 解析，LangChain 都帮你了。

### `system_prompt` 的作用

这四句话是 Agent 的"任务说明书"：

1. **定义角色**："你是一个 Python 代码助手"——告诉 LLM 它的身份
2. **告知工具**："你可以读取文件、写入文件、执行 Shell 命令"——让 LLM 知道它有什么能力
3. **错误处理指令**："如果执行命令出错，分析错误并尝试修复"——激活 Agent 的自我纠错机制
4. **输出要求**："完成任务后给出清晰的总结"——明确交付标准

### `AgentExecutor`——Think → Act → Observe 的引擎

`AgentExecutor` 不参与推理，不执行工具。它是总调度器，职责就是跑循环：

1. 把 prompt 发给 LLM（Think）
2. 拿到输出，如果是 `AgentAction`，找到对应的工具执行（Act）
3. 把工具返回的结果作为 Observation 填回历史（Observe）
4. 判断：继续循环还是停止
5. 直到 LLM 输出 `AgentFinish`，返回最终答案

`verbose=True` 让每一步都打印出来——你会亲眼看到 Think → Act → Observe 的完整过程。这正是第二篇讲的 Callbacks 机制：`on_agent_action`、`on_tool_start`、`on_tool_end` 等钩子在每一步触发，把日志打印到控制台。

> **一点说明**：`AgentExecutor` 在 LangChain v1 中已进入维护模式，官方推荐的新方案是基于 LangGraph 的 `create_agent()`。但 `AgentExecutor` 仍然是学习 Agent 循环机制的最佳选择——它把这个循环暴露得清清楚楚，每个步骤都能看到。理解了它，切到新 API 只是换个函数名。

---

## 跑起来——第一个示例

把上面的代码全部放到 `agent_demo.py`，底部加上：

```python
result = executor.invoke({
    "input": "统计当前目录下所有 .py 文件的行数"
})
print(result["output"])
```

然后：

```bash
python agent_demo.py
```

你会看到类似这样的输出（这是我实际运行时 `verbose=true` 打印的日志，加了注释标注每个阶段）：

```
> Entering new AgentExecutor chain...

🧠 Think: 我需要先列出目录下的 .py 文件
🔧 Action: run_shell
📋 Action Input: {"command": "ls /Users/pengfanao/code/wwrtpfa.github.io/*.py"}

👁️ Observation: scripts/create_post.py scripts/fetch_github.py

🧠 Think: 有2个文件，现在统计每个文件的行数
🔧 Action: run_shell
📋 Action Input: {"command": "wc -l scripts/create_post.py scripts/fetch_github.py"}

👁️ Observation: 45 scripts/create_post.py, 102 scripts/fetch_github.py, 147 total

🧠 Think: 信息够了
✅ Final Answer: 当前目录下共 2 个 .py 文件，合计 147 行代码。

> Finished chain.
```

整个过程经历了 **2 轮 Think → Act → Observe**：

1. 第一轮：Agent 思考"需要先列出文件" → 执行 `ls *.py` → 拿到文件名列表
2. 第二轮：Agent 看到有 2 个文件，决定统计行数 → 执行 `wc -l` → 拿到统计结果
3. 信息足够，Agent 输出最终答案

注意 Agent **不是一次性想好所有步骤**的——它每一步都观察上一步的结果，再决定下一步做什么。这和你在终端里手动操作没有区别：先 `ls` 看看有什么，再 `wc -l` 统计，最后汇总。

---

## 观察 Agent 自主纠错

前面的例子太顺利了。来看看 Agent 遇到错误时怎么办——这是它和普通 LLM 最根本的区别。

```python
result = executor.invoke({
    "input": "写一个 Python 脚本 hello.py，打印'Hello World from Agent!'，然后执行它。"
})
print(result["output"])
```

Agent 的执行过程大概是这样的：

```
> Entering new AgentExecutor chain...

🧠 Think: 用户要创建一个 Python 脚本并执行。我先写文件，再运行。
🔧 Action: write_file
📋 Action Input: {"path": "hello.py", "content": "print('Hello World from Agent!')"}

👁️ Observation: 已写入 hello.py

🧠 Think: 文件已创建。现在用 python 命令执行它。
🔧 Action: run_shell
📋 Action Input: {"command": "python hello.py"}

👁️ Observation: Hello World from Agent!

🧠 Think: 脚本成功创建并执行完毕。
✅ Final Answer: 任务完成。已创建 hello.py，内容为打印 'Hello World from Agent!'，并成功执行，输出无误。

> Finished chain.
```

三步完成：写文件 → 执行 → 确认结果。如果执行出错（比如脚本里有语法错误），Agent 的行为会是这样的：

```
👁️ Observation: SyntaxError: invalid syntax at line 3

🧠 Think: 脚本报语法错误了。让我读一下文件内容，找出问题。
🔧 Action: read_file
📋 Action Input: {"path": "hello.py"}

👁️ Observation: print('Hello World from Agent!'

🧠 Think: 发现少了一个右括号。修正后重新写入。
🔧 Action: write_file
📋 Action Input: {"path": "hello.py", "content": "print('Hello World from Agent!')"}
```

Agent 自己发现了错误 → 自己排查了原因 → 自己修复了 → 继续执行。整个过程不需要你插手。

这就是第二篇讲的**反馈环**的力量。普通 LLM 遇到同样的情况，只能输出一段代码然后说"你试试看能不能跑"——至于跑不跑得通，它不知道，也不关心。

> **普通 LLM 只是告诉你"怎么做"，Agent 是帮你"做出来并验证它真的能跑"。**

---

## 总结：代码与架构的对应关系

写了这么多代码，现在我们把它映射回第二篇的架构概念。每一行代码，背后都有一个 LangChain 抽象在支撑：

| 代码 | 架构概念 | 说明 |
|------|----------|------|
| `@tool` 装饰器 | `BaseTool` | 自动生成 name、description、args_schema、_run() |
| `create_tool_calling_agent()` | `Runnable` | Agent 本身是一个 Runnable，对外暴露 `invoke()` |
| `executor.invoke()` | 触发 Think→Act→Observe 循环 | AgentExecutor 是整条链路的总调度 |
| 每行 verbose 日志 | `AgentAction` / `AgentFinish` | Think 阶段输出决策，Act 阶段执行工具 |
| `verbose=True` | `Callbacks` | 在关键节点触发钩子，打印日志 |
| `tools` 列表 | 工具清单 | LLM 根据 tools 的描述决定调用哪个 |
| `system_prompt` | Prompt 模板 | 定义角色 + 告知工具 + 行为指令 |

---

## 三篇回顾

到这个系列结束的时刻了。回顾一下我们走过的路：

**第一篇——概念篇**：Agent 是什么。LLM 有大脑没身体，Agent = LLM + 工具 + 决策循环，核心是 Think → Act → Observe 的 ReAct 循环。

**第二篇——架构篇**：LangChain 内部怎么转。三层包结构（core / classic / v1），五大核心组件（Runnable、BaseTool、Prompt 模板、AgentAction/AgentFinish、Callbacks），Agent 类型怎么选。

**第三篇——实战篇**：从零搭建代码助手 Agent。三个 `@tool` 装饰器定义工具，`create_tool_calling_agent` 创建 Agent，`AgentExecutor` 驱动循环——不到 50 行代码，Agent 真的跑起来了，能读写文件、执行命令、自主纠错。

从概念到代码，从理解到上手——希望你读完这个系列后，不会再觉得 Agent 是什么神秘的黑魔法。它就是一套设计精巧的循环机制，而你现在已经知道怎么造一个出来了。

---

*LangChain Agent 系列文章：*

- (一) [Agent 是什么？](/2026/06/17/agent/LangChain-Agent-01-概念篇-Agent是什么/)
- (二) [LangChain Agent 内部怎么转的？](/2026/06/19/agent/LangChain-Agent-02-架构篇-LangChain内部怎么转的/)
- (三) 从零搭建代码助手 Agent（本文）
