---
title: Claude 使用技巧
date: 2026-05-19 10:00:00
article_id: 1aa92d4f-6136-56ca-b4fb-7a433ad76dea
categories:
- 面试
tags:
- Claude
- AI
- 提示工程
cover: /img/covers/cover-2.webp
top_img: /img/covers/cover-2.webp

---

# Claude 使用技巧

## 目录

- [一、Claude Code CLI 实用技巧](#一claude-code-cli-实用技巧)
- [二、对话与提示工程技巧](#二对话与提示工程技巧)
- [三、Claude API 高级用法](#三claude-api-高级用法)
- [四、MCP 服务器与工具集成](#四mcp-服务器与工具集成)
- [五、常见误区与避坑指南](#五常见误区与避坑指南)

---

## 一、Claude Code CLI 实用技巧

### 1.1 CLAUDE.md 项目指令文件

在项目根目录放置 `CLAUDE.md`，Claude Code 每次启动都会自动加载，等效于项目级的 system prompt：

```markdown
# CLAUDE.md
- 本项目使用 pnpm，不要用 npm
- 代码风格：2 空格缩进，单引号
- 测试命令：pnpm test
- 提交信息格式：conventional commits
```

**技巧**：可分层放置 —— `~/.claude/CLAUDE.md`（全局）、项目根目录（项目级）、子目录（模块级），越深层级优先级越高。

### 1.2 权限与自动批准

减少权限弹窗的两种方式：

- **命令行参数**：`claude --dangerously-skip-permissions`（不推荐日常使用）
- **settings.json 配置**：在 `.claude/settings.json` 中添加允许列表

```json
{
  "permissions": {
    "allow": [
      "Bash(git log*)",
      "Bash(npm test*)",
      "Bash(npx hexo *)"
    ]
  }
}
```

### 1.3 Hooks 自动化

Hooks 可在特定事件前后自动执行脚本：

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "command": "npx eslint --fix $FILE_PATH"
      }
    ],
    "PreCommit": [
      {
        "command": "npm run lint"
      }
    ]
  }
}
```

**可用事件**：`PreToolUse`、`PostToolUse`、`Notification`、`PreCommit`、`Stop`

### 1.4 上下文管理

- `/compact` — 手动压缩上下文，防止上下文溢出
- `/clear` — 清空对话历史，从头开始
- `/cost` — 查看当前会话 token 用量
- 上下文过长时 Claude 会自动压缩，但主动 `/compact` 更可控

### 1.5 常用斜杠命令

| 命令 | 作用 |
|------|------|
| `/help` | 查看所有命令 |
| `/init` | 生成 CLAUDE.md |
| `/review` | 代码审查 |
| `/memory` | 查看持久记忆 |
| `/fast` | 切换快速模式（Opus 加速输出） |
| `/model` | 切换模型 |

### 1.6 管道输入与非交互模式

```bash
# 管道输入
echo "解释这段代码" | claude

# 非交互模式，适合脚本
claude -p "给这个项目写单元测试"

# 结合 git
git diff | claude -p "审查这些变更"
```

### 1.7 Worktree 隔离开发

用 worktree 在隔离环境中工作，不影响主分支：

```
> 请在 worktree 中实现这个功能
```

或手动：`git worktree add .claude/worktrees/feature-x`

---

## 二、对话与提示工程技巧

### 2.1 结构化提示：角色 + 任务 + 约束

```
你是一位资深 Rust 工程师。
请为以下 HTTP handler 编写集成测试：
- 必须覆盖 200、400、500 三种状态码
- 使用 tokio::test 宏
- 不要 mock 数据库，用 test container
```

**要点**：明确角色设定让输出更专业；约束条件用列表形式比自然语言更不易遗漏。

### 2.2 XML 标签分隔内容

Claude 对 XML 标签的解析非常准确，适合在 prompt 中分隔不同类型的内容：

```xml
<rules>
- 响应必须为 JSON 格式
- 不包含任何解释性文字
</rules>

<example>
{"name": "foo", "type": "bar"}
</example>

<input_data>
[实际数据]
</input_data>
```

### 2.3 少样本示例（Few-shot）

给出 2-3 个示例比长篇描述更有效：

```
将自然语言转为 SQL：

示例1: "找年龄大于30的用户" → SELECT * FROM users WHERE age > 30;
示例2: "统计每个部门的平均工资" → SELECT dept, AVG(salary) FROM employees GROUP BY dept;

现在转换: "查出最近7天注册的用户数量"
```

### 2.4 思维链（Chain of Thought）

让 Claude 先思考再回答，显著提升推理质量：

```
请一步步分析以下代码的性能瓶颈，然后给出优化方案。
不要直接给答案，先列出你的推理过程。
```

或使用 `<thinking>` 标签触发扩展思考（API 中启用 `thinking` 参数）。

### 2.5 迭代式对话

不要试图一次得到完美结果，而是分轮迭代：

1. **第一轮**：给出需求和约束，获取初版
2. **第二轮**：指出问题，要求修改（"代码可以工作，但错误处理不够，请加强"）
3. **第三轮**：聚焦细节（"第 42 行的锁粒度太粗，请优化"）

### 2.6 让 Claude 自我审查

```
请审查你刚才写的代码，检查以下方面：
1. 是否有边界条件遗漏
2. 是否有线程安全问题
3. 是否符合项目的编码规范
列出发现的问题并修复。
```

### 2.7 预填充助手回复（API）

通过预填充 `assistant` 消息的开头，强制 Claude 以特定格式输出：

```python
message = client.messages.create(
    model="claude-sonnet-4-6",
    messages=[
        {"role": "user", "content": "列出三种排序算法"},
        {"role": "assistant", "content": "```json\n{"}  # 强制 JSON 输出
    ]
)
```

---

## 三、Claude API 高级用法

### 3.1 Prompt Caching 省钱提速

对重复使用的长 system prompt 和上下文启用缓存，可降低 90% 的输入 token 费用：

```python
message = client.messages.create(
    model="claude-sonnet-4-6",
    system=[
        {
            "type": "text",
            "text": very_long_system_prompt,  # 超过 1024 token 才会缓存
            "cache_control": {"type": "ephemeral"}  # 标记缓存点
        }
    ],
    messages=[...]
)
```

**要点**：
- 缓存 TTL 为 5 分钟，命中时输入价格降至 1/10
- 适合长 system prompt、知识库注入、工具定义等场景
- 缓存断点用 `cache_control` 标记，最多 4 个

### 3.2 Extended Thinking 模式

对于复杂推理任务，启用扩展思考获得更深入的分析：

```python
message = client.messages.create(
    model="claude-sonnet-4-6",
    thinking={
        "type": "enabled",
        "budget_tokens": 10000  # 分配给思考的 token 预算
    },
    messages=[...]
)
```

**适用场景**：数学推理、代码架构设计、复杂逻辑判断。**不适用**：简单问答、格式转换。

### 3.3 Tool Use（函数调用）

```python
tools = [
    {
        "name": "get_weather",
        "description": "获取指定城市的天气",
        "input_schema": {
            "type": "object",
            "properties": {
                "city": {"type": "string", "description": "城市名"}
            },
            "required": ["city"]
        }
    }
]

response = client.messages.create(
    model="claude-sonnet-4-6",
    tools=tools,
    messages=[{"role": "user", "content": "北京今天天气怎么样"}]
)

# Claude 返回 tool_use block，你执行后把结果返回
if response.stop_reason == "tool_use":
    tool_result = get_weather("北京")
    # 继续对话...
```

### 3.4 Batch API 批量处理

适合大规模异步任务（如批量分类、翻译），价格降低 50%：

```python
batch = client.messages.batches.create(
    requests=[
        {
            "custom_id": "req-1",
            "params": {
                "model": "claude-sonnet-4-6",
                "max_tokens": 1024,
                "messages": [{"role": "user", "content": "..."}]
            }
        }
    ]
)
```

### 3.5 流式输出

```python
with client.messages.stream(
    model="claude-sonnet-4-6",
    messages=[{"role": "user", "content": "讲个故事"}]
) as stream:
    for text in stream.text_stream:
        print(text, end="", flush=True)
```

---

## 四、MCP 服务器与工具集成

### 4.1 什么是 MCP

Model Context Protocol（MCP）是 Anthropic 推出的开放协议，让 AI 模型通过标准化接口连接外部工具和数据源。类似 USB-C 之于外设——统一接口，即插即用。

### 4.2 配置 MCP 服务器

在 `.claude/settings.json` 中添加：

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstreamapi/context7-mcp"]
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-filesystem", "/path/to/dir"]
    }
  }
}
```

### 4.3 常用 MCP 服务器

| 服务器 | 用途 |
|--------|------|
| `@anthropic/mcp-filesystem` | 文件系统读写 |
| `@upstreamapi/context7-mcp` | 查询最新库文档 |
| `@modelcontextprotocol/server-github` | GitHub 操作 |
| `@anthropic/mcp-sqlite` | SQLite 数据库交互 |

### 4.4 自定义 MCP 服务器

用 TypeScript 快速搭建：

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const server = new McpServer({ name: "my-tool", version: "1.0.0" });

server.tool("search_docs", { query: z.string() }, async ({ query }) => {
  const results = await searchDocumentation(query);
  return { content: [{ type: "text", text: JSON.stringify(results) }] };
});
```

---

## 五、常见误区与避坑指南

### 5.1 误区：一次性写完美提示

**正确做法**：先给基本需求，看输出后迭代调整。对话式优化 > 一次性完美提示。

### 5.2 误区：忽略上下文窗口限制

Claude Code 上下文窗口约 200K token，但实际有效工作上下文远小于此。**每过一段时间执行 `/compact`**，或在长对话中主动总结。

### 5.3 误区：不使用 Tool Use 而用正则解析输出

**正确做法**：API 调用时始终使用 `tools` 参数，而非让 Claude 输出特定格式后自己解析。Tool Use 的结构化输出比文本解析可靠得多。

### 5.4 误区：System Prompt 里写太多规则

System prompt 越长，Claude 遵循每条规则的概率越低。**保持在 10 条以内**，最关键的规则放最前面。

### 5.5 误区：在 API 中频繁开启新对话

**正确做法**：利用 Prompt Caching + 多轮对话，复用缓存上下文，减少 token 消耗和延迟。

### 5.6 误区：忽略 Claude Code 的记忆系统

**正确做法**：用 `/memory` 或让 Claude 自动保存关键信息（项目架构、用户偏好、踩过的坑），下次对话自动加载。

---

> **面试加分点**：回答 AI 工具使用问题时，除了罗列技巧，更要讲**为什么这样有效**——例如 Prompt Caching 背后是 KV Cache 复用，Extended Thinking 对应 Chain-of-Thought 的显式化，Tool Use 本质是结构化输出约束。
