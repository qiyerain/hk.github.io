---
title: LangChain Agent 系列(二)：LangChain Agent 内部怎么转的？
date: 2026-06-19 08:00:00
article_id: 1b2d664d-99f0-5db7-a190-84ac30746bdd
categories:
- AI
- Agent
tags:
- LangChain
- Agent
- 架构
- AI教程
cover: /img/covers/home/langchain-loop.svg
cover_alt: LangChain Agent 架构篇封面
cover_position: 50% 50%
series: LangChain Agent
series_order: 2
top_img: /img/covers/home/langchain-loop.svg

---

## 上一篇我们讲了 Agent 的"道"——Think → Act → Observe 循环。这一篇讲"术"——LangChain 是怎么把这套机制实现出来的。

如果你读完了第一篇，你已经知道 Agent 的核心思想了：LLM 是大脑，工具是手和眼睛，决策循环让 Agent 不断思考、执行、观察、调整，直到任务完成。

但概念是概念，代码是代码。LangChain 到底用了哪些类、哪些抽象、哪些设计模式，把这些概念变成了能跑的代码？

本文拆解 LangChain 的三层包结构和 Agent 核心组件。读完你能看懂 Agent 的每一行代码在做什么。

---

## 三层包结构概览

先把 LangChain 的整体包结构看清楚。很多人一上来就对着几百个类头大，但其实 LangChain 的包结构有清晰的层次逻辑：

![](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/blog/arch-three-layers.png)

| 层 | 包 / 定位 | 职责 |
|---|---|---|
| 基础抽象层 | `langchain-core` | Runnable 协议、BaseTool、Messages、Callbacks |
| 经典集成层 | `langchain-classic` | Chains、100+ 工具集成、Agent 实现、Document Loaders |
| 新版 API | `langchain` (v1) | 精简设计，Agent 优先 |

这三层是 LangChain 的核心架构，每一层有各自的定位：

**基础抽象层（`langchain-core`）** 是整个 LangChain 生态的地基。它只定义抽象接口和协议——Runnable 该怎么跑、BaseTool 长什么样、Message 有哪几种类型——但不绑定任何具体的模型提供商。这意味着你可以换模型、换工具实现、换拼接方式，只要接口对得上，别的代码不用动。

**经典集成层（`langchain-classic`）** 是 LangChain 历史最悠久的包，包含了 Chains 编排、100 多个第三方工具集成、各类 Agent 的具体实现、Document Loaders、Vector Stores 等等。注意，在 v1.0 发布后，`langchain-classic` 已进入维护模式（只修 bug，不添加新功能），活跃的集成开发已迁移到 `langchain-openai`、`langchain-anthropic` 等合作包和 `langchain-community` 中。但作为抽象概念的"经典层"仍然是最好的学习起点——它的代码量和覆盖面能让你看清一个完整的 Agent 生态长什么样。

**新版 API（`langchain` v1）** 是 LangChain 团队近年推行的新方向。"Agent 优先"意味着 Agent 不再是用 Chain 拼出来的"高级功能"，而是一等公民。v1 版本的 API 设计更精简——创建 Agent 更直观，配置项更集中，对工具和模型的绑定也更清晰。如果你是新项目，官方推荐优先考虑 v1。

为什么要拆三层？一句话：**解耦**。`langchain-core` 不依赖任何模型提供商，核心抽象极其稳定；`langchain-classic` 可以有大量的具体实现和集成，变更频繁也不影响核心抽象；`langchain` v1 作为"新家"，可以吸取经典层的教训，用更现代的 API 重新出发。

---

## 核心组件拆解

理清了包结构，我们来看 LangChain Agent 的核心组件。这些组件串在一起，就构成了 Agent 的执行引擎。

![](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/blog/arch-components.png)

### 1. Runnable 协议——一切皆 Runnable

Runnable 是 LangChain 最底层的抽象。它的核心思想很简单：**一切组件都是 Runnable，统一对外暴露 `invoke()`（同步执行）和 `stream()`（流式执行）两个执行入口。**

除此之外，Runnable 还提供了 `pipe()` 方法（即 `|` 运算符），用于将多个 Runnable 串联成一个管道——这不是执行入口，而是**组合手段**。

在 LangChain 里，以下这些东西全都是 Runnable：

- **LLM**（比如 `ChatOpenAI`）是一个 Runnable——调用 `invoke()` 就发一次请求
- **Prompt 模板**（`ChatPromptTemplate`）是一个 Runnable——调用 `invoke()` 就填充变量生成最终 prompt
- **Tool**（`BaseTool`）是一个 Runnable——调用 `invoke()` 就执行工具逻辑
- **Agent 本身** 也是一个 Runnable——调用 `invoke()` 就跑完整条 ReAct 循环

这意味着你可以用 `|` 管道符把 Runnable 串起来，像 Unix 管道一样：

```
prompt | llm | output_parser
```

Agent 内部就是靠这种管道把 Prompt、LLM、OutputParser 串联起来的。你不需要在代码里手动编排每一步——LangChain 帮你把组件之间的数据流转处理好了。

### 2. BaseTool——工具的统一接口

第一篇我们说了"工具是 Agent 的手和眼睛"，在 LangChain 里，工具都被抽象成 `BaseTool`。每个 BaseTool 有四个核心属性：

- **`name`**：工具的唯一标识名。LLM 用这个名字来引用工具，比如 `"read_file"`。
- **`description`**：工具的功能描述。LLM 读这个描述来决策"当前应该用哪个工具"。描述写得越准确，LLM 选工具越不容易出错。
- **`args_schema`**：工具参数的 Pydantic 类型定义。有了它，LLM 就知道调用 `read_file` 需要传一个 `file_path: str`，类型不对 LangChain 会自动拦截。
- **`_run()`**：工具的实际执行逻辑。你写的业务代码就放在这里。

以 `read_file` 工具为例，它的结构大概是这样的：

```python
from langchain_core.tools import BaseTool
from pydantic import BaseModel, Field

class ReadFileInput(BaseModel):
    file_path: str = Field(description="要读取的文件路径")

class ReadFileTool(BaseTool):
    name: str = "read_file"
    description: str = "读取指定路径的文件内容"
    args_schema: type[BaseModel] = ReadFileInput

    def _run(self, file_path: str) -> str:
        with open(file_path, "r") as f:
            return f.read()
```

LLM 看到这个工具的 `name` 和 `description`，就知道"当用户要我读文件时，调用 `read_file` 工具，传一个 `file_path`"。`args_schema` 里的 Field 描述（`"要读取的文件路径"`）会一并发给 LLM，帮助它生成正确的参数值。

### 3. Prompt 模板——Agent 的"任务说明书"

Agent 的 prompt 跟普通 LLM 的 prompt 不一样。普通 prompt 就是一段话，Agent 的 prompt 是一个**组装出来的复合结构**，包含四个部分：

1. **System prompt**：定义角色。比如 "你是一个代码助手，可以用 Shell、文件操作等工具完成任务。遇到问题时先分析，再选择工具执行。"
2. **Tool descriptions**：可用工具的列表——每个工具的 `name` + `description` + `args_schema`。LLM 靠这段文本来决定"现在应该用哪个工具，传什么参数"。
3. **User input**：用户的原始输入，比如 "统计 .py 文件行数"。
4. **Scratchpad**：一个占位符（`MessagesPlaceholder`），用来存放历史步骤。每完成一轮 Think→Act→Observe，Agent 会把最新的 AgentAction 和 Observation 填进去，让 LLM 知道"到目前为止发生了什么"。

`MessagesPlaceholder` 是 Agent prompt 的核心机关。它不是写死的文本，而是一个**每轮循环都会被更新的空位**。第一轮它可能是空的；第二轮它就包含了"上一轮我调用了什么工具、返回了什么结果"。LLM 基于这个不断更新的上下文来决定下一轮该做什么。

### 4. AgentAction 与 AgentFinish——每步只有两种可能

Agent 每一步的输出，经过 OutputParser 解析后，只有两种结构化结果：

- **`AgentAction`**：Agent 决定再调用一个工具。包含两个字段：
  - `tool`：要调用的工具名，比如 `"run_shell"`
  - `tool_input`：传给工具的参数，比如 `{"command": "ls *.py"}`
- **`AgentFinish`**：Agent 认为任务已完成，返回最终答案。包含：
  - `return_values`：一个字典，通常键是 `"output"`，值就是给用户的回答

OutputParser 的职责就是把 LLM 原始文本输出解析成这两种结构之一。LLM 的输出可能是这样的文本：

```
Action: run_shell
Action Input: {"command": "ls *.py"}
```

OutputParser 需要把它解析成 `AgentAction(tool="run_shell", tool_input={"command": "ls *.py"})`。

或者 LLM 认为任务完成了，输出：

```
Final Answer: 共 3 个 Python 文件，合计 214 行代码
```

OutputParser 就解析成 `AgentFinish(return_values={"output": "共 3 个 Python 文件，合计 214 行代码"})`。

这个二选一的设计非常简洁——Agent 每步要么再动手，要么收工。AgentExecutor 拿到结果后判断类型：如果是 `AgentAction`，就执行对应的工具；如果是 `AgentFinish`，就停止循环返回答案。

### 5. Callbacks——横向贯穿的钩子机制

Callback 不属于"纵向串行"的组件，而是一个**横向贯穿**的钩子系统：它在 Agent 执行过程的各个节点插入钩子，让你能拦截和观察每一步。

核心的 callback 钩子包括：

- **LLM 相关**：`on_llm_start`、`on_llm_end`、`on_llm_error`——在 LLM 调用前后触发
- **Tool 相关**：`on_tool_start`、`on_tool_end`、`on_tool_error`——在工具执行前后触发
- **Agent 相关**：`on_agent_action`、`on_agent_finish`——在 Agent 决策点和结束点触发

这些钩子的用途很广：

- **打印日志**：AgentExecutor 的 `verbose=True` 就是靠 Callback 实现的——每一步的 Think、Act、Observe 都能看到完整输出。
- **流式输出 token**：`on_llm_new_token` 钩子让你逐 token 推送内容，实现打字机效果。
- **写入监控**：记录每次 LLM 调用的耗时、工具执行的成功率，方便后期分析。

有了 Callback，你不需要修改 Agent 的核心逻辑，就能在关键节点插入自己的业务代码——这是一个典型的观察者模式。

---

## Agent 类型一览

LangChain 提供了多种 Agent 类型，它们的主要区别在于**如何让 LLM 表达"我要用哪个工具"**。

![](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/blog/arch-agent-types.png)

| 类型 | 特点 | 适用场景 |
|------|------|----------|
| ReAct | 经典推理+行动循环，文本解析 tool 调用 | 模型不支持原生 tool calling 时 |
| Tool Calling | 通用 tool-calling 接口，跨模型 | 推荐首选，大多数场景 |
| OpenAI Tools | 用 OpenAI 原生 function calling | 仅 OpenAI 模型 |
| Structured Chat | 支持多参数复杂工具的聊天 Agent | 工具参数结构复杂时 |
| JSON / XML | 用 JSON/XML 格式强制结构化输出 | 需要严格输出格式时 |

这些类型的本质差异在于：**LLM 如何输出"我要调用什么工具、传什么参数"这个决策。**

**ReAct** 是最早的实现方式——它在 prompt 里告诉 LLM："如果你要用工具，请严格按以下格式输出：`Action: 工具名\nAction Input: 参数`"。然后 OutputParser 用正则从文本里提取。这种方式最灵活，不依赖模型能力，但解析可能出错——LLM 要是没严格按格式来，正则就匹配不上。

**Tool Calling / OpenAI Tools** 则是利用模型的原生 function calling 能力。LLM 不再用文本表达工具调用，而是直接返回结构化的 `tool_calls` 对象——工具名、参数全部是结构化的，不靠文本解析。这种方式更可靠，也是当前推荐的主流做法。Tool Calling Agent 的优点在于它是跨模型的统一接口——ChatAnthropic、ChatVertexAI 等非 OpenAI 模型也可以用。

**JSON / XML Agent** 让 LLM 按严格的 JSON 或 XML Schema 输出决策。相比于 ReAct 的正则解析，结构化输出更鲁棒，但 prompt 更长，token 消耗更高。

**Structured Chat Agent** 则是在聊天场景中支持多参数复杂工具的调用，适合工具函数签名比较复杂的场景。

**选型建议**：如果你的模型支持原生 tool calling（目前大部分主流模型都支持），直接用 **Tool Calling Agent**。如果模型不支持或你用的是本地小模型，降级到 **ReAct**。

---

## 完整链路走一遍

现在我们把所有组件串起来，用第一篇的同一个例子——"统计目录下 `.py` 文件的行数"——完整走一遍 LangChain 的执行链路。

![](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/blog/arch-execution-chain.png)

| 步骤 | 发生的事 | LangChain 层面 |
|------|----------|----------------|
| 用户输入 | "统计当前目录下所有 .py 文件行数" | `executor.invoke({"input": "统计当前目录下所有 .py 文件行数"})` |
| Prompt 组装 | System prompt + 工具列表 + 用户输入 + scratchpad（本轮为空） | `ChatPromptTemplate` 把四部分拼好，`MessagesPlaceholder` 占着 scratchpad 的位置 |
| LLM 推理 | LLM 读取完整 prompt，判断需要先列出所有 .py 文件 | `ChatOpenAI(model="gpt-4o")` 执行推理，输出结构化 tool_calls |
| 输出解析 | LLM 输出的是 tool_calls，解析成 AgentAction（如果是 ReAct 则解析文本格式） | `OutputParser` 解析输出 → `AgentAction(tool="run_shell", tool_input={"command": "ls *.py"})` |
| Tool 执行 | 实际执行 shell 命令 | `run_shell._run(command="ls *.py")` → 返回 `"a.py\nb.py\nutils.py"` |
| 历史回填 | 把本轮的 Action 和 Observation 写入 scratchpad | 创建 `AgentStep(action=..., observation=...)`，填入 `MessagesPlaceholder` |
| 进入下一轮 | LLM 看到本轮结果 + 历史，决定下一步：统计行数 | LLM 推理 → OutputParser 输出新 AgentAction |
| Tool 执行 | 执行 wc -l 命令 | `run_shell._run(command="wc -l *.py")` → 返回统计结果 |
| 历史回填 | 再次写入 scratchpad | 又一个 AgentStep 追加到 MessagesPlaceholder |
| 下一轮 | LLM 判定信息已足够，任务完成 | OutputParser → `AgentFinish(return_values={"output": "共 3 个 Python 文件，合计 214 行代码"})` |
| 返回答案 | AgentExecutor 检测到 AgentFinish，停止循环 | `executor.invoke()` 返回最终结果给用户 |

注意这套流程里几个关键的设计：

- **Prompt 的 scratchpad 是动态增长的**。每轮 Think→Act→Observe 后，新的 AgentStep 追加上去，LLM 始终能看到"从开始到现在发生了什么"，这就是 ReAct 循环的"记忆"。
- **OutputParser 决定了循环的走向**。它解析出来是 AgentAction 就继续执行工具，解析出来是 AgentFinish 就停止。这相当于循环的"交通指挥灯"。
- **AgentExecutor 是整条链路的总调度**。它不参与推理，不执行工具——它的职责就是：组装 prompt → 调 LLM → 解析输出 → 调工具 → 回填历史 → 判断继续还是停止 → 循环。

> **一点说明**：`AgentExecutor` 在 LangChain v1.0 中已进入维护模式，官方推荐的新方案是基于 LangGraph 的 `create_agent()`。但 `AgentExecutor` 的概念模型——调度器 + 循环 + 组件管道——完全适用于新方案。理解了这个模型，你自然就理解了新 API 在做什么。

---

## 用一段话串联所有组件

我们把这些概念串起来的视角再回顾一遍：

> **Runnable** 是最外层协议，保证每个组件都有统一的 `invoke()` 入口。AgentExecutor 这个总调度器，内部用管道把 **Prompt 模板** → **LLM** → **OutputParser** 串联起来。每次循环，Prompt 模板组装 System prompt + Tool descriptions（来自 **BaseTool** 的 name/description/args_schema）+ User input + Scratchpad（通过 **MessagesPlaceholder** 动态填充历史步骤）。LLM 推理后，**OutputParser** 把结果解析成两种之一：**AgentAction**（继续调工具，包含 tool 名和参数）或 **AgentFinish**（任务完成，返回最终答案）。如果拿到 AgentAction，AgentExecutor 就找到对应的 **BaseTool** 执行 `_run()`，把结果作为 Observation 回填到 Scratchpad，然后进入下一轮。**Callbacks** 在整个流程中横向贯穿，在每个关键节点触发钩子——你不需要改核心代码就能插入日志、流式输出、监控逻辑。循环直到 OutputParser 吐出 AgentFinish，最终答案返回给用户。

---

## 下篇预告

本文拆解了 LangChain Agent 的内部实现：

1. **三层包结构**——`langchain-core` 定义抽象，`langchain-classic` 提供实现，`langchain v1` 是未来方向
2. **五大核心组件**——Runnable 协议、BaseTool、Prompt 模板、AgentAction/AgentFinish、Callbacks——分别承担了协议、工具、记忆、决策、监控的职责
3. **Agent 类型选择**——优先 Tool Calling，降级 ReAct
4. **完整执行链路**——从 `executor.invoke()` 到最终答案，每一步对应的 LangChain 概念

但读完一篇可能还不够过瘾。下一篇文章，我们**直接上手写代码**——从零搭建一个可以读写文件、执行命令的代码助手 Agent。你会看到不到 50 行代码，Agent 就真的跑起来了。

---

*LangChain Agent 系列文章：*

- (一) [Agent 是什么？](/2026/06/17/agent/LangChain-Agent-01-概念篇-Agent是什么/)
- (二) LangChain Agent 内部怎么转的？（本文）
- (三) [从零搭建代码助手 Agent](/2026/06/22/agent/LangChain-Agent-03-实战篇-从零搭建代码助手Agent/)
