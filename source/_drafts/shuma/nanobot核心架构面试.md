---
original_dir: nanobot核心架构面试
---

## 目录

- [1. 项目概述](#1-项目概述)
- [2. PowerMem 智能记忆系统](#2-powermem-智能记忆系统)
  - [原始记忆系统的问题](#原始记忆系统的问题)
  - [PowerMem 三层架构](#powermem-三层架构)
  - [三类记忆](#三类记忆)
  - [记忆作用域](#记忆作用域)
  - [艾宾浩斯遗忘曲线](#艾宾浩斯遗忘曲线)
  - [嵌入模型](#嵌入模型)
- [3. 每轮对话的上下文构建](#3-每轮对话的上下文构建)
  - [System Prompt 组成：](#system-prompt-组成)
- [4. MCP 与 Skill 加载机制](#4-mcp-与-skill-加载机制)
  - [MCP → 注册为 Tool](#mcp--注册为-tool)
  - [Skill → 注入 System Prompt](#skill--注入-system-prompt)
- [5. 心跳与定时任务](#5-心跳与定时任务)
  - [Heartbeat（心跳巡查）](#heartbeat心跳巡查)
  - [CronService（精确调度）](#cronservice精确调度)
- [6. Browser V1 vs V4](#6-browser-v1-vs-v4)
  - [架构变化](#架构变化)
  - [关键改进](#关键改进)
- [7. 会话管理与最大轮次](#7-会话管理与最大轮次)
  - [最大轮次](#最大轮次)
  - [session_key 判断同一 chat](#session_key-判断同一-chat)
- [8. 跨会话知识保持](#8-跨会话知识保持)
  - [三层协作](#三层协作)
  - [压缩触发条件](#压缩触发条件)
  - [每轮对话后的异步任务](#每轮对话后的异步任务)
  - [ContextVars 会话隔离](#contextvars-会话隔离)
- [引用](#引用)

---

> 自动生成：9 张图，由多模态模型 `doubao-seed-2.0-pro` 一次性识别转写。

![image-20260525111827001.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525111827001.png)
# Nanobot 核心架构面试题
---

## 1. 项目概述
Nanobot 是企业级 AI Agent 框架，支持多渠道通信（钉钉/WhatsApp/CLI）和智能记忆管理。

技术栈：Python 3.12、FastAPI、SOFA、Pydantic、LiteLLM、Playwright、PowerMem

核心模块：
- `nanobot/agent/loop.py` — Agent 主循环
- `nanobot/agent/context.py` — 上下文构建
- `nanobot/agent/tools/` — 工具注册与执行
- `nanobot/agent/skills.py` — Skill 加载
- `nanobot/memory/` — PowerMem 记忆系统
- `nanobot/heartbeat/` — 心跳服务
- `nanobot/cron/` — 定时任务服务

![image-20260525111827002.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525111827002.png)
## 2. PowerMem 智能记忆系统
### 原始记忆系统的问题
旧系统基于两个 Markdown 文件（`MEMORY.md` + `HISTORY.md`），存在四大痛点：

| 问题       | 细节                                                         |
| ---------- | ------------------------------------------------------------ |
| 上下文膨胀 | 每轮加载完整 MEMORY.md，无过滤无筛选                         |
| 无智能提取 | LLM 被动重写整个文件，无去重无分类                           |
| 无语义检索 | 搜索 = grep HISTORY.md，换种说法就搜不到                     |
| 无遗忘机制 | 文件无限增长，无重要性评分、无时间衰减                       |

---

### PowerMem 三层架构
| 层       | 存储                  | 内容                             | 检索方式                                 |
| -------- | --------------------- | -------------------------------- | ---------------------------------------- |
| 对话历史 | SQLite/OceanBase/Redis | 原始 user/assistant/tool 消息   | 按 session_key + id 范围查询             |
| 每日摘要 | rcs_daily_summaries 表 | LLM 压缩的对话摘要              | 按 session_key + date 查询               |
| 语义事实 | 向量数据库            | fact/profile/experience 三类记忆 | 语义向量搜索 + Reranking                 |

---

### 三类记忆
| 类型   | 说明                                   | 提取时机                                       |
| ------ | -------------------------------------- | ---------------------------------------------- |
| fact   | 客观事实（用户身份、事件、状态、结果） | 每轮对话后立即异步提取                         |
| profile | 用户偏好和属性                         | 压缩时由 MemoryConsolidator 推断               |

![image-20260525111827003.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525111827003.png)
| 类型   | 说明                                   | 提取时机                                       |
| ------ | -------------------------------------- | ---------------------------------------------- |
| fact   | 客观事实（用户身份、事件、状态、结果） | 每轮对话后立即异步提取                         |
| profile | 用户偏好和属性                         | 压缩时由 MemoryConsolidator 推断               |
| experience | 经验教训 | 跨天检测时触发（发现昨天摘要未提取经验） |

---

### 记忆作用域
| 作用域        | 说明                     |
| ------------- | ------------------------ |
| private       | 仅当前用户可见           |
| group-personal | 群聊中个人可见          |
| group-shared  | 群聊中所有成员可见       |

---

### 艾宾浩斯遗忘曲线
- 每次被检索到 → 强化（reinforcement）
- 长期不被检索 → 衰减（decay）
- 低于 `short_term_threshold` → 归档
- 高于 `long_term_threshold` → 长期记忆

---

### 嵌入模型
默认使用通义千问 `text-embedding-v4`（provider=qwen），维度 1536。支持切换到 openai/ollama/siliconflow/huggingface。

![image-20260525111827004.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525111827004.png)
默认使用通义千问 `text-embedding-v4`（provider=qwen），维度 1536。支持切换到 openai/ollama/siliconflow/huggingface。

---

## 3. 每轮对话的上下文构建
`build_context()` 每次收到用户消息时组装，messages 列表按顺序：
1.  `system prompt` ← 身份 + bootstrap + skills（静态）
2.  `user profile` ← PowerMem profile 记忆（动态，≤10条）
3.  昨日摘要 ← 昨天对话的 LLM 压缩摘要
4.  今日摘要 ← 今天对话的 LLM 压缩摘要
5.  历史消息 ← 未压缩的对话轮次（id > `compressed_up_to_id`）
6.  当前消息 ← 本轮用户输入

---

### System Prompt 组成：
- Identity：Agent 名字、角色、当前时间、运行环境
- Bootstrap 文件：`AGENTS.md` / `SOUL.md` / `USER.md` / `TOOLS.md` / `IDENTITY.md`（从 DB 按 `agent_code` 优先级加载）
- Always Skills：frontmatter `always: true` 的 skill 全文注入
- Available Skills：其他 skill 只注入摘要 XML

历史消息的 `llm_context` 展开：最近 2 轮 assistant 消息展开完整 `tool_call` 链（token 预算 8000），更早的只保留精简 `{role, content}` 格式。

为什么 profile 和摘要用 user 角色而非 system 角色？避免 system prompt 过长导致注意力衰减。静态指令放 system，动态上下文放 user。

---

## 4. MCP 与 Skill 加载机制

![image-20260525111827005.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525111827005.png)
核心区别：MCP 是函数调用，Skill 是文本指令。

---

### MCP → 注册为 Tool
1.  配置在 `config.tools.mcp_servers`（支持 stdio 和 HTTP 两种模式）
2.  首次消息时懒连接 `_connect_mcp()`：stdio 模式启子进程，HTTP 模式连远程
3.  `session.list_tools()` 拿到工具列表，包装成 `MCPToolWrapper`（名字加前缀 `mcp_{server}_{tool}`）
4.  注册进 `ToolRegistry`
5.  每轮对话 `tools.get_definitions()` 收集所有 tool schema → `litellm.acompletion(tools=..., tool_choice="auto")` 传给大模型

stdio 模式：nanobot 自己启动子进程（如 `npx -y @some/mcp-server`），通过 stdin/stdout 交换 JSON-RPC 消息。

---

### Skill → 注入 System Prompt
- Always skill（`always: true`）：完整内容写进 system prompt 的「# Active Skills」段
- 普通 skill：只写摘要 XML（name + description + 路径），大模型需要时用 `read_file` 按需读取

Skill 不是 Tool，是教大模型“怎么用现有工具完成特定任务”的指令文本。

---

## 5. 心跳与定时任务
### Heartbeat（心跳巡查）

![image-20260525111827006.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525111827006.png)
- 间隔：5 分钟，对齐整点（:00/:05/:10...）
- 实现：`asyncio.create_task` + `asyncio.sleep` 取模对齐
- 分布式锁：Redis `SET NX EX`，多节点只有拿到锁的执行
- 任务来源：DB 中的 `HEARTBEAT.md`（支持 agent 私有 → 全局 → 模板三级回退）
- 空内容跳过，有内容构建 prompt 唤醒 Agent 判断是否执行
- Agent 回复 `HEARTBEAT_OK` = 无事可做

---

### CronService（精确调度）
- 间隔：1 分钟，对齐整分钟
- 三种调度类型：
  - `at`：一次性定时（执行后删除或禁用）
  - `every`：固定间隔（传 `last_expected_run_ms` 防漂移）
  - `cron`：cron 表达式（支持时区）
- 每个 job 独立 Redis 分布式锁
- 抢锁后二次校验 DB 状态，防重复执行
- Agent 通过 `cron` 工具创建/查看/删除任务

---

|          | Heartbeat                  | CronService                            |
| -------- | -------------------------- | -------------------------------------- |
| 间隔     | 5 分钟                     | 1 分钟                                 |
| 任务定义 | 自由文本（HEARTBEAT.md）   | 结构化（schedule + payload）           |
| 执行方式 | Agent 看清单后自主判断     | 直接发 payload.message 给 Agent        |
| 分布式锁 | 整个 tick 一把锁          | 每个 job 一把锁                        |

![image-20260525111827007.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525111827007.png)
## 6. Browser V1 vs V4
### 架构变化
| 维度     | V1                                      | V4                                                         |
| -------- | --------------------------------------- | ---------------------------------------------------------- |
| 底层驱动 | 直接 Playwright API                     | browser-use SDK 事件系统                                   |
| 页面状态 | `aria_snapshot()` → 自解析 YAML + ref_map | SDK `get_browser_state_summary()` → `dom_state.llm_representation()` |
| 元素定位 | ref（e1,e2...）+ 5 层回退策略           | index（[3],[7]...） + SDK `get_element_by_index()` 精确定位 |
| 交互执行 | `locator.click()` / `locator.fill()`    | `event_bus.dispatch(ClickElementEvent)`                    |
| 会话管理 | 单页 `self._page`，无隔离               | `BrowserSessionPool`，多会话隔离 + idle 超时回收           |

---

### 关键改进
1.  元素定位：V1 的 ref 定位在 Ant Design 组件经常失败（name 为空），V4 的 index 直接映射 SDK selector_map，一步到位
2.  下拉选择：V1 写了 120 行十几层 CSS 选择器回退，V4 委托 SDK + 新增 `search-select` 专门处理 Ant Design 搜索下拉
3.  overlay 优先：V4 新增 `_extract_topmost_overlay()`，按 z-index 把弹窗内容放状态文本最前面，截断时不丢
4.  SSO 增强：V4 增加 BUC API 登录、cookie 检查、DOM 稳定等待、SPA 重定向检测
5.  降级容错：V4 有三层降级（SDK → JS fallback → URL 提示）

V4 基于 browser-use 开源项目改良，但只用了它的浏览器控制层，决策仍由 nanobot AgentLoop 负责。

![image-20260525111827008.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525111827008.png)
## 7. 会话管理与最大轮次
### 最大轮次
默认 20 轮（`max_tool_iterations: 20`），每轮 = 一次 LLM 调用 + 可能的工具执行。达到上限时返回提示让用户继续。

---

### session_key 判断同一 chat
格式：`{agent_code}:{channel}:{chat_id}`

| 来源       | session_key 格式                  |
| ---------- | --------------------------------- |
| 钉钉群聊   | `{agent_code}:antding:{chat_id}`  |
| 心跳       | `{agent_code}:heartbeat:direct`   |
| 定时任务   | `{agent_code}:cron:{job_id}`      |
| CLI        | `{agent_code}:direct:direct`      |

同一 session_key = 同一个 chat 会话，体现在：
- SessionManager 按 key 缓存 Session 对象
- ConversationStore 按 key 存取消息
- 工具上下文按 key 路由
- 分布式队列按 key 去重串行执行

---

## 8. 跨会话知识保持
用户今天聊了 20 轮，明天再开新会话，Agent 怎么还记得？

![image-20260525111827009.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525111827009.png)
用户今天聊了 20 轮，明天再开新会话，Agent 怎么还记得？

---

### 三层协作
Layer 1：对话历史（ConversationStore）
→ 同 session_key 的消息永久在 DB，下次自动加载

Layer 2：每日摘要（Daily Summary）
→ 旧消息超阈值 → LLM 压缩成摘要 → 新会话自动注入「昨日摘要」+「今日摘要」

Layer 3：语义事实（PowerMem）
→ fact 每轮提取 / profile 压缩时推断 / experience 跨天检测
→ 新会话自动注入用户 profile，需要时 `search_memory` 语义检索

---

### 压缩触发条件
- 未压缩消息数 ≥ `compression_round_threshold`（默认 20）
- 或未压缩消息 token 数 > `compression_token_threshold`（默认 4000）
- 压缩后保留最近 `compression_keep_rounds`（默认 5）轮

---

### 每轮对话后的异步任务
1.  `_check_and_trigger_compression` — 检查是否需要压缩
2.  `_extract_fact_async` — 立即提取事实写入 PowerMem
3.  `_extract_skill_experiences` — 提取 skill 使用经验

---

### ContextVars 会话隔离
每个异步协程有独立的 ContextVar，存储 session_key、channel、chat_id。多会话并发时工具不会串到别的会话。这是协程级隔离，不是进程级。

## 引用
