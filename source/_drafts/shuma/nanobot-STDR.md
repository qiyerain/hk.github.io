---
layout: false
---

# nanobot 项目挑战与 STAR 面试回答稿

> 面向岗位：全栈 AI + 后端
> 项目规模：43K 行 Python、19 个 ADR、17 个 Skill、12+ 通信渠道
> 技术栈：Python 3.12 / FastAPI / SOFAPY / LiteLLM / Playwright / TBase / ZCache(Redis)

## 目录

- [一、"说说你做过最有挑战的系统设计"](#一说说你做过最有挑战的系统设计)
    - [Situation](#situation)
    - [Task](#task)
    - [Action](#action)
    - [Result](#result)
    - [追问准备](#追问准备)
- [二、"遇到过最难的技术问题"](#二遇到过最难的技术问题)
    - [Situation-1](#situation-1)
    - [Task-1](#task-1)
    - [Action-1](#action-1)
    - [Result-1](#result-1)
    - [追问准备-1](#追问准备-1)
- [三、"如何做架构演进"](#三如何做架构演进)
    - [Situation-2](#situation-2)
    - [Task-2](#task-2)
    - [Action-2](#action-2)
    - [Result-2](#result-2)
    - [追问准备-2](#追问准备-2)
- [四、"AI 应用落地的难点"](#四ai-应用落地的难点)
    - [Situation-3](#situation-3)
    - [Task-3](#task-3)
    - [Action-3](#action-3)
    - [Result-3](#result-3)
    - [追问准备-3](#追问准备-3)
- [附录：项目技术亮点速查表](#附录项目技术亮点速查表)

---

## 一、"说说你做过最有挑战的系统设计"

### Situation

nanobot 是企业级 AI Agent 框架，支持钉钉、飞书、Telegram 等 12+ 通信渠道。用户在群聊中与 Agent 长期交互，需要跨会话记忆——比如记住"我是产品经理"、"我每天关注案件数据"这类信息。

原有记忆系统三个问题：
1. **提取时机太晚**——只在对话压缩时批量提取，用户刚说的关键信息要到下一次压缩才生效
2. **输入内容冗余**——把工具调用的中间过程也喂给提取 prompt，白白消耗 token
3. **类型定义混乱**——Skill 类型被定义为"可复用方法"，和"经验教训"语义完全不同，导致检索时类型边界模糊

### Task

重新设计记忆提取系统，要求：
- Fact（事实）即时生效，用户不需要重复告知
- 降低 token 消耗
- 三种记忆类型（Fact/Profile/Experience）边界清晰，各有独立的提取时机和 prompt

### Action

**方案选型**（这是面试重点）：

| 方案 | 思路 | 优点 | 缺点 | 结论 |
|------|------|------|------|------|
| 方案 A | 保持架构，只改 prompt | 改动最小 | 无法解决即时性问题，单 prompt 负担重 | ❌ |
| 方案 B | 三个 PowerMem 实例 | 封装清晰 | 三套连接池，资源开销大 | ❌ |
| 方案 C | 单实例 + 运行时传 prompt | 资源省，灵活 | 每次调用需传 prompt | ✅ |

选方案 C 因为 PowerMem 的 `add(prompt=...)` 参数已验证支持，单实例避免多连接池开销，运行时传参灵活度高。

**具体实现**：

1. **Fact 即时提取**：每轮对话后异步调用 `_extract_fact_async()`，只传入"用户消息 + 最终回复"，排除工具调用中间过程。用 `asyncio.to_thread()` 避免阻塞事件循环。

2. **Profile 压缩时推断**：在 `MemoryConsolidator` 中，多轮对话压缩时用 `PROFILE_INFERENCE_PROMPT` 推断用户偏好习惯。

3. **Experience 每天归总**：Cron 定时任务在凌晨 2:00 归纳当天经验教训，格式为"条件→行动→结果"。

4. **移除 monkey patch**：旧架构用 monkey patch 处理"一个 prompt 返回多种 category"的问题，新设计预先确定 category，运行时传入不同 prompt，彻底消除 monkey patch。

5. **记忆作用域隔离**：通过 `encode_user_id()` 实现——私聊记忆归属个人，群聊记忆区分"个人记忆"和"群共享记忆"，两轮检测（关键词 → LLM 分析）自动判断作用域。

### Result

- Fact 即时生效，用户不再需要重复告知相同信息
- 输入精简后 token 消耗显著降低（排除了工具调用中间内容）
- 三种类型边界清晰，检索精度提升
- 架构简化，移除了 monkey patch 维护负担

**学到的教训**：记忆系统的核心矛盾是"即时性 vs 成本"。Fact 每轮提取可能产生低价值记忆，我们通过 prompt 规则缓解（只提取客观事实，不提取寒暄和确认），而不是牺牲即时性。

### 追问准备

**Q: 为什么不把三种记忆都用即时提取？**
A: Profile 需要多轮对话才能推断出偏好，单轮提取容易误判；Experience 需要完整的一天操作记录才能归纳出"条件→行动→结果"模式，单次操作信息不够。不同提取时机是对记忆类型本质特征的尊重。

**Q: 即时提取会不会产生大量低价值记忆？**
A: 会，这是 trade-off。我们通过两层防线缓解：一是 prompt 规则严格只提取客观事实（身份、事件、状态、结果），二是 PowerMem 内置的遗忘曲线机制——长期不被检索的记忆权重自然衰减。

**Q: 如果重新设计会怎么改？**
A: 会考虑给 Fact 提取加一个置信度阈值——LLM 返回的 fact 带置信度分值，低于阈值的不存储，减少噪音。另外会把 Experience 的归总频率从"每天"改为"按会话结束触发"，减少延迟。

---

## 二、"遇到过最难的技术问题"

### Situation

nanobot 的 Agent Loop 最多迭代 20 轮处理一条用户消息。每轮会 append assistant 响应 + tool_calls + tool_results 到 messages 列表。Browser 工具的 AX tree 输出单次可达 30KB（约 7500 tokens），多轮累积后轻松超出 LLM 的 128K context window，导致 provider 报错截断，整个任务失败。

已有的 ADR-011 压缩机制只在**跨用户消息**之间触发（`build_context()` 阶段），轮内迭代期间完全没有压缩。

更棘手的是，另一个并发问题也同时暴露：多个用户同时触发 Browser 工具时，所有操作在同一个 `BrowserSession` 实例上执行，页面状态互相覆盖。

### Task

1. 在轮内迭代期间实现 context 压缩，防止 overflow
2. 按会话隔离浏览器实例，解决并发状态串扰

### Action

**问题一：轮内压缩**

方案对比：

| 方案 | 思路 | 优点 | 缺点 |
|------|------|------|------|
| 逐条截断 tool result | 超长就截 | 简单，零额外成本 | 截断位置不可控，丢失关键信息 |
| LLM 摘要压缩早期轮次 | 超阈值时用 LLM 摘要 | 保留关键信息 | 额外一次 LLM 调用 |
| 滑动窗口丢弃早期轮次 | 只保留最近 N 轮 | 零额外成本 | 完全丢失上下文，agent 可能重复操作 |

选方案 2（LLM 摘要压缩），原因：Browser 场景中 agent 必须知道之前操作了什么元素，纯截断/丢弃会导致重复点击或决策不一致。

实现要点：
- 每轮迭代后检查 `count_tokens(messages)`，超过模型 context window 的 70% 时触发
- 识别迭代边界：遇到 `role=assistant` 且有 `tool_calls` 就是一轮开始
- 保留最近 3 轮完整，早期轮次用 LLM 生成中文摘要
- 摘要以 `role=user` 插入（标记为"系统摘要"）
- LLM 调用失败时返回原始 messages，不影响正常执行

**问题二：浏览器会话隔离**

方案对比：

| 方案 | 思路 | 优点 | 缺点 |
|------|------|------|------|
| 扩展 `_set_tool_context` | 实例属性 `self._current_session_key` | 与已有模式一致 | **并发不安全**：协程 A `await` 时，协程 B 可覆盖属性 |
| `contextvars.ContextVar` | 协程级变量隔离 | 并发安全，零侵入 | 隐式传参，调用链不可见 |

选方案 2（contextvars），这是关键决策点：

**并发不安全的根本原因**：系统存在两条并发消息处理路径——`AgentLoop.run()` 和 `DistributedQueue._poll_loop()`，共享同一个 ToolRegistry 实例。当协程 A 在 `await provider.chat()` 让出 CPU 时，协程 B 可以覆盖 `self._current_session_key`，协程 A 恢复后拿到的是 B 的值。

而 `contextvars` 在 Python asyncio 中，每个协程有独立的变量副本，`await` 恢复后仍拿到自己设置的值。`asyncio.create_task()` 自动复制 context，无需额外处理。

### Result

- Browser 多轮操作不再因 context overflow 中断
- 多用户并发使用浏览器不再互相干扰
- 轮内压缩是有损压缩，细节可能丢失，但在实际场景中摘要保留了"做了什么操作、成功还是失败、关键数据是什么"这些核心信息
- contextvars 方案零侵入，已有的 `_set_tool_context` 不需要任何改动

**学到的教训**：在 asyncio 环境中，实例属性模式在并发场景下不安全，但这个不安全是隐性的——单机串行时完全正常，引入分布式队列后才暴露。设计时就要考虑并发安全，而不是等出 bug 再修。

### 追问准备

**Q: 轮内压缩的 70% 阈值怎么定的？**
A: 经验值。留 30% 余量是因为 LLM 生成的内容 + tool results 还会继续增长。实际场景中 Browser 工具输出最大，一次 7500 tokens，3 轮就 22K，所以 70% 给压缩留了足够的触发窗口。配置化设计（`intra_turn_compression_threshold`）允许按场景调整。

**Q: contextvars 和 threading.local 的区别？**
A: `threading.local` 按线程隔离，但 asyncio 多个协程在同一线程上运行，`threading.local` 无法隔离协程。`contextvars` 是 Python 3.7 引入的，专门为 asyncio 设计，`asyncio.create_task()` 自动复制 context，协程切换时变量隔离。如果未来引入多线程，`contextvars` 在线程间也是隔离的，仍然安全。

**Q: 线上出过什么问题？**
A: 早期没有轮内压缩时，用户在浏览器场景中连续操作 7-8 轮后 agent 直接报错退出。排查发现是 Browser AX tree 输出过大导致的 context overflow。最初想用截断方案，但测试发现截断后 agent 会重复点击同一个按钮——因为它不知道之前已经点过了。最终选择了摘要压缩方案，虽然多一次 LLM 调用，但保留了操作语义。

---

## 三、"如何做架构演进"

### Situation

nanobot 最初是单机部署架构：渠道消息通过本地 `asyncio.Queue`（MessageBus）传递给 AgentLoop，Cron 定时任务用数据库悲观锁防止重复执行，Heartbeat 甚至没有分布式锁。

这个架构在单机运行时没有问题，但当业务需要多机部署时暴露了三个致命问题：
1. **会话上下文无法共享**——每台机器各自维护 MessageBus，同一用户的消息落到不同机器时，历史对话丢失
2. **并发处理破坏串行保证**——同一 session 的消息可能被不同机器同时处理
3. **数据库锁竞态**——ZDAS 数据库的 `COALESCE` 条件更新在高并发下存在竞态条件

### Task

将单机架构演进为分布式架构，要求：
- 支持多机水平扩展
- 同一 session 内消息严格串行处理
- 零停机迁移，可灰度上线
- 不引入过重的中间件
### Action

**第一步：消息队列 — MessageBus → ZCache**

方案对比：

| 方案 | 优点 | 缺点 |
|------|------|------|
| Kafka/RabbitMQ | 成熟的消息队列 | 重量级，部署维护成本高，session 粒度串行需额外分区设计 |
| 标准 Redis + Redlock | 开源通用 | Redlock 实现复杂，容易出锁竞争/超时问题 |
| ZCache（蚂蚁 Cache Mesh） | 已有基础设施，`lpop` 原子性天然解决竞争，本地 meshboot 即可开发 | 依赖公司内网，开源场景需换标准 Redis |

选 ZCache，核心设计是三层 Redis 数据结构：

```
active_sessions (List)     → 待处理 session 的 FIFO 队列
active_sessions_set (Set)  → session 去重索引，防止重复入队
session_tasks:{key} (List) → 某 session 下待处理的消息队列，严格串行
```

关键设计点：
- `lpop` 原子操作保证同一 session 只被一台机器持有，**无需显式分布式锁**
- `config.zcache.enabled` 开关控制，默认 `false`，关闭时行为与改动前完全一致
- 消息处理异常时自动重新入队，保证不丢失

**第二步：分布式锁 — 数据库悲观锁 → Redis SET NX EX**

方案对比：

| 方案 | 优点 | 缺点 |
|------|------|------|
| 继续用数据库锁 | 无变更 | ZDAS 竞态风险 |
| Redis SET NX EX | 原子操作，高性能 | 需 Redis（已有 ZCache） |
| Redlock | 更强一致性 | 复杂，需多实例，过度设计 |

选 Redis SET NX EX，配合 Lua 脚本原子释放：

```lua
if redis.call("GET", KEYS[1]) == ARGV[1] then
    return redis.call("DEL", KEYS[1])
else
    return 0
end
```

只有持锁节点才能释放，防止误删。统一 Cron 和 Heartbeat 共用同一套工具函数。

**迁移策略**：
- 特性开关控制，默认关闭
- 先在测试环境验证 ZCache 连接池稳定性
- 灰度上线：先开一台机器验证，观察 1 周，再全量
- 回滚方案：关闭 `zcache.enabled` 即可恢复单机模式

### Result

- 支持多机水平扩展，同一 session 严格串行
- 机器无状态化，故障自动迁移（session 会被其他机器重新消费）
- 消除了数据库锁竞态风险
- Heartbeat 间隔从 30 分钟缩短为 5 分钟（有了分布式锁才敢缩短）
- 整个迁移过程零停机

**学到的教训**：架构演进最关键的不是技术方案，而是**可回滚的迁移策略**。特性开关 + 灰度上线让我们在发现 ZCache 连接池偶发超时时能立即回滚，而不是紧急修 bug。另外，`lpop` 原子性让我们避免了引入显式分布式锁的复杂性——选对基础设施能大幅降低方案复杂度。

### 追问准备

**Q: 消息处理异常时"自动重新入队"会不会导致重复处理？**
A: 会的，这是当前已知的问题（ADR-017 明确记录）。目前没有做幂等设计，因为我们的消息处理大多数是只读查询 + 发送消息，重复处理的影响有限。后续计划通过 message_id 去重来实现幂等。

**Q: 1 秒轮询间隔会不会有延迟问题？**
A: 低负载场景下最多 1 秒延迟，对于我们的场景（企业内部工具，非实时聊天）可以接受。如果需要更低延迟，可以用 Redis BLPOP 替代轮询，但当前收益不值得引入额外复杂度。

**Q: 为什么不选 Kafka？**
A: 三个原因：一是我们的消息量不大（企业内部工具），Kafka 是杀鸡用牛刀；二是 Kafka 的分区策略和 session 串行需求不天然匹配，需要额外设计；三是公司内部已有 ZCache 基础设施，接入成本最低。如果未来消息量增长到需要 Kafka 的程度，架构上可以替换，因为消息队列的抽象层已经建好了。

---

## 四、"AI 应用落地的难点"

### Situation

nanobot 作为 AI Agent 框架，在实际落地中面临三个核心难点：

1. **LLM 输出不确定性**——记忆提取依赖 LLM 理解对话内容，但 LLM 可能提取出低价值信息（如"用户说了你好"），或者错误分类记忆类型
2. **安全边界模糊**——Agent 可以执行 Shell 命令、浏览网页、读写文件，用户可能通过对话诱导 Agent 泄露敏感信息
3. **Skill 工程复杂度**——17 个 Skill 对接内部 API，每个 Skill 的 prompt 工程和 API 调用链都不同，维护成本高

### Task

在 LLM 不确定性的前提下，构建可靠、安全、可维护的 AI 应用。

### Action

**难点一：记忆提取的不确定性**

核心问题是 LLM 可能从一段对话中提取出无意义的 fact，或者把 profile 当成 fact 存储。

应对策略：
- **类型预确定**：不依赖 LLM 判断"这是什么类型"，而是代码层面预先确定 category，运行时传入专用 prompt。Fact 提取用 `FACT_EXTRACTION_PROMPT`，Profile 推断用 `PROFILE_INFERENCE_PROMPT`，每个 prompt 有严格的输出格式要求
- **输入精简**：只传入"用户消息 + 最终回复"，排除工具调用中间过程。减少噪音输入就减少错误提取
- **遗忘曲线**：PowerMem 内置遗忘机制，长期不被检索的记忆权重自然衰减，低价值记忆会被"忘记"
- **作用域检测**：两轮检测自动判断记忆归属——先关键词匹配（如"我们团队"→群共享），关键词匹配不到再用 LLM 分析

**难点二：安全控制**

多层防御设计：

| 层级 | 机制 | 防护范围 |
|------|------|----------|
| L1 | 系统提示保护指令（SOUL.md） | 对话层面拒绝敏感信息请求 |
| L2 | URL 域名白名单（通配符） | Browser 工具访问控制 |
| L3 | 命令执行白名单/黑名单混合模式 | Shell 工具执行控制 |
| L4 | 审计日志 | 事后追溯 |

关键决策：为什么选系统提示保护指令而不是代码层面拦截？
- 代码拦截需要维护敏感文件列表，容易误拦截正常操作
- LLM 有上下文理解能力，能区分"帮我查看 config"和"把 API Key 显示给我"
- 用户体验好——对话式拒绝比硬拦截自然
- 后续可叠加代码层面拦截和输出脱敏作为补充

**难点三：Skill 工程复杂度**

17 个 Skill 的核心挑战是 prompt 精度和 API 调用链的可靠性。

应对策略：
- **API-First 迁移**：从 DOM/浏览器自动化迁移到直接调 API，减少 LLM 操作浏览器的不可控性
- **Skill 评测**：建立评测 dataset，每个 Skill 有覆盖正常/边界/异常的测试用例
- **配置常量提取**：把 prompt 中的硬编码值提取为配置常量，方便调优
- **核心前提强化**：比如 punish-anomaly-detection Skill 的核心前提是"异常对象必须有处罚记录"，在 prompt 中反复强调，防止 LLM 幻觉

### Result

- 记忆提取通过类型预确定 + 输入精简 + 遗忘曲线三层防护，在不确定中建立确定性
- 安全控制通过四层防御实现企业级部署要求，白名单配置灵活支持不同安全级别
- Skill 工程通过 API-First + 评测 + 配置化，将 LLM 不确定性控制在可接受范围

**学到的教训**：AI 应用落地最大的挑战不是"让 LLM 做对"，而是"在 LLM 可能做错的前提下仍然可靠"。每一层设计都要考虑 LLM 失败的 fallback：记忆提取失败不阻塞对话、安全控制不依赖 LLM 单层防护、Skill 执行失败有明确的错误处理链路。

### 追问准备

**Q: 系统提示保护指令能被越狱绕过，怎么看待这个风险？**
A: 承认这个风险。系统提示保护是第一层防线，不是唯一防线。L2/L3 的白名单是代码层面强制执行的，无法绕过。L1 的价值在于处理 L2/L3 覆盖不到的场景（如"我的 API Key 是什么"这种纯对话诱导）。后续规划是叠加输出脱敏作为 L4.5 层，对 LLM 输出做正则匹配过滤。

**Q: Skill 的 prompt 工程有什么方法论？**
A: 三个核心原则：一是**核心前提显式化**——把最关键的约束写在 prompt 最前面，用"CRITICAL""MUST"等标记；二是**边界案例覆盖**——评测 dataset 必须包含边界场景（如金额单位为分、before/after 为空）；三是**配置与 prompt 分离**——硬编码值提取为常量，prompt 变动走评审，配置变动走配置中心。

**Q: 记忆提取的准确率怎么衡量？**
A: 目前主要靠人工抽检 + 用户反馈。长期目标是建立自动化的记忆质量评测——给定一段对话，验证提取的 fact 是否准确、profile 是否合理、experience 是否可操作。这是 AI 应用落地的普遍难题：很多输出质量没有自动化的客观衡量标准。

---

## 附录：项目技术亮点速查表

面试中可能被追问到的技术点，快速定位：

| 技术点 | ADR | 一句话总结 |
|--------|-----|-----------|
| 三层记忆架构 | ADR-002, ADR-014 | Fact/Profile/Experience 独立提取时机，单实例运行时 prompt |
| 轮内 Context 压缩 | ADR-015 | LLM 摘要压缩早期轮次，保留最近 3 轮完整 |
| 跨轮 Context 压缩 | ADR-011 | 累积摘要压缩历史对话，持久化到 sessions 表 |
| 分布式消息队列 | ADR-017 | ZCache 三层 Redis 结构，`lpop` 原子性保证 session 串行 |
| 分布式锁迁移 | ADR-018 | Redis SET NX EX + Lua 原子释放，统一 Cron/Heartbeat |
| 浏览器会话隔离 | ADR-019 | contextvars 协程级传参，替代实例属性模式 |
| 安全控制增强 | ADR-009 | 四层防御：SOUL.md + URL 白名单 + 命令白名单 + 审计日志 |
| 会话管理重构 | ADR-016 | SessionManager 架构简化 |
| TBase 向量存储 | ADR-007, ADR-013 | 向量检索 + 字段设计 |
| 服务器模式存储迁移 | ADR-006 | 从文件存储迁移到数据库 |
| OpenAI 兼容 Provider | ADR-003 | 统一处理模式 |
| 记忆工具拆分 | ADR-005 | search_memory / manage_memory 隔离 |
| 结构化日志 | ADR-008 | get_logger(module) + LogContext |
