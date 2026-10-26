---
layout: false
---

# zfbbizriskagent 项目架构深度分析

> 面试视角：为什么能支撑 10w TPS、风控决策亮点、可优化方向

## 目录

- [一、为什么能支撑 10w TPS？](#一为什么能支撑-10w-tps)
  - [1. Java 21 虚拟线程](#1-java-21-虚拟线程--核心并发引擎)
  - [2. SOFA Serverless 模块化部署](#2-sofa-serverless-模块化部署)
  - [3. 多层缓存策略](#3-多层缓存策略)
  - [4. 异步 + 流式架构](#4-异步--流式架构)
  - [5. DAG 并行执行引擎](#5-dag-并行执行引擎)
  - [6. OceanBase + ZDAL 分布式数据库](#6-oceanbase--zdal-分布式数据库)
- [二、风控决策上的亮点](#二风控决策上的亮点)
  - [1. ReflectToolAgent — 带反思的决策状态机](#1-reflecttoolagent--带反思的决策状态机)
  - [2. ReflectivePlanningAgent — 动态任务规划](#2-reflectiveplanningagent--动态任务规划)
  - [3. Multi-Agent 角色编排](#3-multi-agent-角色编排)
  - [4. 11 种 Agent 类型 + 工厂模式](#4-11-种-agent-类型--工厂模式)
  - [5. RAG 增强决策 + 多租户知识隔离](#5-rag-增强决策--多租户知识隔离)
  - [6. DRM 动态配置](#6-drm-动态配置--运行时调整决策参数)
  - [7. MessageSender 抽象 — 输出通道解耦](#7-messagesender-抽象--输出通道解耦)
- [三、可以优化的地方](#三可以优化的地方)
  - [1. WorkingMemory 本地缓存风险](#1-workingmemory-使用-concurrenthashmap-本地缓存--单点和内存风险)
  - [2. 线程池配置偏静态](#2-线程池配置偏静态)
  - [3. 错误处理粒度不够](#3-错误处理粒度不够)
  - [4. DAG 执行缺少熔断和限流](#4-dag-执行缺少熔断和限流)
  - [5. 多租户隔离不够彻底](#5-多租户隔离不够彻底)
  - [6. Agent 执行缺少可观测性](#6-agent-执行缺少可观测性)
  - [7. Groovy 脚本编译缓存的安全风险](#7-groovy-脚本编译缓存的安全风险)
- [四、总结](#四总结)
  - [核心竞争力](#核心竞争力)
  - [最大隐患](#最大隐患)
  - [架构全景](#架构全景)

---

## 一、为什么能支撑 10w TPS？

### 1. Java 21 虚拟线程 — 核心并发引擎

```java
agentExecutor = Executors.newVirtualThreadPerTaskExecutor()
```

每个 Agent 请求独占一个虚拟线程，不受传统线程池大小限制。虚拟线程在 I/O 阻塞时自动挂起、释放载体线程，一台机器可以轻松支撑数十万并发 Agent 执行。这是支撑高 TPS 的**最关键因素**。

### 2. SOFA Serverless 模块化部署

项目以 SOFA Ark 模块运行在 `bizriskaibase` 基座上：

- **共享基座资源**：不独占 JVM，多个模块共享同一进程的线程、内存、连接池
- **热部署**：模块可独立升级，不影响基座和其他模块
- **水平扩展**：基座实例可按需横向扩容，模块自动跟随

### 3. 多层缓存策略

| 缓存             | 实现                | TTL      | 用途                     |
| ---------------- | ------------------- | -------- | ------------------------ |
| toolCache        | Caffeine 1000       | 24h      | 工具 Schema 缓存         |
| punishOrderCache | Caffeine 1000       | 24h      | 处罚订单缓存             |
| commonCache      | Caffeine 1000       | 10min    | 通用热数据               |
| WorkingMemory    | ConcurrentHashMap   | 会话级   | 对话历史本地缓存         |
| PromptTemplate   | 内存                | DRM 刷新 | Prompt 模板              |
| Groovy Script    | Caffeine 1000 (MD5) | 1day     | Multi-Agent 脚本编译缓存 |

大量**计算密集型结果被缓存**，避免重复的数据库查询和远程 RPC 调用。

### 4. 异步 + 流式架构

三种执行模式解耦了请求接收和处理：

- **同步**：`descision()` — 简单场景，直接返回
- **异步**：`asyncDescision()` — 立即返回 PROCESSING，虚拟线程后台执行
- **流式**：`streamChat()` — SSE/SOFA Stream 逐条推送，不阻塞连接

流式模式下客户端无需等待完整结果，**首字节响应时间极低**。

### 5. DAG 并行执行引擎

```java
ParallelExecutionStrategy:
  - ExecutorType: VIRTUAL_THREADS
  - MaxParallelism: 100 (可配)
  - CompletableFuture 编排
```

拓扑排序后，**无依赖的节点并行执行**，最大化利用并发能力。一个复杂的风控决策 DAG 可以将串行耗时压缩到关键路径长度。

### 6. OceanBase + ZDAL 分布式数据库

- OceanBase 本身支持**线性扩展**
- ZDAL 提供**分库分表、读写分离**
- 按租户路由，天然分片

---

## 二、风控决策上的亮点

### 1. ReflectToolAgent — 带反思的决策状态机

```
PLANNING → EXECUTING → REFLECTING → EVOLVING → COMPLETED
```

**核心规则设计精巧**：

- **R0 (DecisionGate)**：信息够了就直接输出 Final Answer，不够就调用工具 + 记录反思。二元决策门，避免 Agent 陷入无意义循环
- **R1 (NoStandaloneReflection)**：反思必须伴随业务工具调用，防止"光想不做"
- **R2 (ReflectionPayload)**：强制记录状态 + 笔记，确保推理过程可追溯

这比简单的 ReAct 循环更高级，**Agent 能自我评估决策质量**。

### 2. ReflectivePlanningAgent — 动态任务规划

- 维护一个**跨轮次演化的 DAG 任务列表**
- 区分"决策节点"（立即完成，结果存入 coreResult）和"工具节点"（等依赖满足后执行）
- **严格的死锁预防**：每轮必须要么执行工具、要么给出最终答案，不允许空转
- 这实际上实现了一个**动态规划引擎**，Agent 可以根据中间结果调整后续步骤

### 3. Multi-Agent 角色编排

```
Planner → Reasoner → Observer → Supervisor → Decider
```

通过 `RoleProcessorFactory` 注册不同角色处理器，`DeciderRoleProcessor` 负责最终决策输出。这种**角色分工模式**让复杂风控场景可以拆解为多个专业 Agent 协作。

### 4. 11 种 Agent 类型 + 工厂模式

Creator + Registry + Factory 三层模式：

- 新增 Agent 类型只需一个 `@Component` 类
- Spring 容器刷新时自动注册
- 从简单的 SINGLE 到复杂的 COMPLEX_PLAN，**覆盖不同复杂度的风控场景**

| 类型             | 模式                  | 适用场景           |
| ---------------- | --------------------- | ------------------ |
| SINGLE           | 单轮对话              | 简单查询           |
| REACT            | ReAct 循环            | 需要工具调用的推理 |
| NATIVE_TOOL_CALL | 原生 function calling | 高效工具调用       |
| REFLECT_TOOL     | 反思状态机            | 需要自我评估的决策 |
| REFLECTIVE_PLAN  | 动态规划              | 复杂多步骤任务     |
| COMPLEX_PLAN     | 复杂任务规划          | 长链路复杂决策     |
| JSON_REACT       | JSON 输出 ReAct       | 结构化输出需求     |
| MULTI            | 多 Agent 协同         | 角色分工场景       |
| DAG              | DAG 编排              | 固定流程编排       |
| ANT_LLM          | 远程委托              | AntLLM 平台执行    |
| SOFA_AI          | 远程委托              | SOFA AI 平台执行   |

### 5. RAG 增强决策 + 多租户知识隔离

- 百灵知识库集成（QA / 文档 / 表格三种知识类型）
- 每个租户独立的 `RetrieveEngine` 实例
- 基于分数的文档排序，确保检索质量
- **风控决策不仅依赖规则，还能利用知识库中的历史案例和经验**

### 6. DRM 动态配置 — 运行时调整决策参数

- Prompt 模板可热更新，无需重启
- 工具配置可动态增删
- 租户配置实时生效
- **风控策略可以分钟级调整**，应对突发风险

### 7. MessageSender 抽象 — 输出通道解耦

```
MessageSender (interface)
  ├── SseEmitterSender       HTTP SSE 流式
  ├── SofaStreamSender       SOFA RPC 流式
  ├── EventSinkMessageSender 事件池
  └── SyncMessageSender      同步返回
```

Agent 执行逻辑与输出通道完全解耦，新增输出方式只需实现接口，**不改动任何 Agent 代码**。

---

## 三、可以优化的地方

### 1. WorkingMemory 使用 ConcurrentHashMap 本地缓存 — 单点和内存风险

**问题**：对话历史存在本地 JVM 内存中，多实例部署时：

- 同一用户的请求如果打到不同实例，历史丢失
- 长会话可能导致内存膨胀，无 LRU 淘汰策略（不是 Caffeine）
- 实例重启后全部丢失

**建议**：引入 Redis/Tair 做分布式缓存，或至少用 Caffeine 替代 ConcurrentHashMap 加上容量限制和过期策略。

### 2. 线程池配置偏静态

```java
agentTaskExecutor: core=32, max=64, queue=1000
```

**问题**：固定配置无法应对流量波动。高峰期队列满了直接 AbortPolicy 拒绝；低谷期资源浪费。

**建议**：
- 将线程池参数接入 DRM，支持运行时调整
- 考虑自适应线程池（如根据排队延迟动态调整核心线程数）
- AbortPolicy 改为 CallerRunsPolicy 或自定义降级策略，避免直接拒绝

### 3. 错误处理粒度不够

超时任务处理器采用 fail-silent 模式：

```java
try {
    taskManager.initTimeOutTask(taskId);
} catch (Exception ex) {
    log.error(...); // 吞掉异常
}
```

**问题**：异常被吞后无告警、无重试、无降级，超时任务可能永久卡住。

**建议**：区分可重试异常和不可重试异常，加入告警机制，超时任务增加最大重试次数后转人工。

### 4. DAG 执行缺少熔断和限流

`ParallelExecutionStrategy` 最大并行度 100，但：

- 没有看到单个 DAG 节点的**超时隔离**（一个慢节点可能拖住整个 DAG）
- 没有对下游 RPC 的**熔断机制**
- 没有**全局并发度限流**，高并发时可能打爆下游服务

**建议**：

- 每个节点加独立超时（NodeEnhancer 已有 timeout 类型但需验证是否完善）
- 引入 Sentinel/Hystrix 对关键 RPC 做熔断
- 全局 Semaphore 限制同时执行的 DAG 数量

### 5. 多租户隔离不够彻底

RAG 降级逻辑：

```java
// 租户配置缺失时 fallback 到 ZFB_PUNISH_CENTER
```

**问题**：一个租户查到了另一个租户（默认租户）的知识库数据，存在**数据泄露风险**。

**建议**：缺失租户配置时应该直接拒绝而不是降级到默认租户。多租户场景下，安全性优先于可用性。

### 6. Agent 执行缺少可观测性

**问题**：

- 没有看到 Agent 决策链路的**完整 Trace**（从请求进来到每一步 ReAct 循环到最终决策）
- 工具调用有 `ToolInvocation` 表记录，但 Agent 推理过程（Thought / Action / Observation）的结构化日志不够
- 缺少**决策质量的量化指标**（如平均 ReAct 循环次数、工具调用成功率、决策耗时分布）

**建议**：建立端到端的 Agent Trace，每个 Thought / Action / Observation 作为 Span，接入 SofaTracer 或 OpenTelemetry。

### 7. Groovy 脚本编译缓存的安全风险

Multi-Agent 编排使用 Groovy 动态脚本：

```java
// MD5-based cache key, 1000 max, 1-day expiry
```

**问题**：动态执行 Groovy 脚本存在**代码注入风险**，脚本来源如果不可信（如用户可配置），可能被注入恶意代码。

**建议**：对 Groovy 脚本做沙箱化（SecureASTCustomizer），限制可用 API；脚本变更需审批。

---

## 四、总结

### 核心竞争力

Java 21 虚拟线程 + SOFA Serverless + 异步流式架构构成了**高性能底座**；11 种 Agent 类型 + ReflectToolAgent 反思机制 + DAG 并行编排 + RAG 知识增强构成了**业界领先的 AI 风控决策能力**。

### 最大隐患

本地内存缓存的单点问题、多租户隔离不彻底、以及 Agent 执行链路的可观测性不足。这些在当前规模可能没暴露，但随着租户数和流量增长，会成为瓶颈。

### 架构全景

```
                        ┌─────────────────────────────┐
                        │      Client (HTTP/RPC)       │
                        └──────┬──────────────┬────────┘
                               │              │
                    ┌──────────▼──┐    ┌──────▼────────┐
                    │ AgentController│  │ AgentFacadeImpl│
                    │   (SSE)     │    │   (RPC)       │
                    └──────┬──────┘    └──────┬────────┘
                           │                  │
                    ┌──────▼──────────────────▼────────┐
                    │        AgentManagerV2             │
                    │  (编排核心: 同步/异步/流式)         │
                    └──────┬───────────────────────────┘
                           │
              ┌────────────▼────────────┐
              │    AgentFactory          │
              │  (11 种 Agent 类型)       │
              └────────────┬────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    ┌────▼────┐     ┌──────▼──────┐   ┌──────▼──────┐
    │ ReAct   │     │ Reflect     │   │ DAG         │
    │ Agent   │     │ Tool Agent  │   │ Executor    │
    └────┬────┘     └──────┬──────┘   └──────┬──────┘
         │                 │                 │
    ┌────▼─────────────────▼─────────────────▼──────┐
    │              Tool / Knowledge / RAG            │
    │  (18 个外部集成 + 百灵知识库 + AntLLM RAG)      │
    └───────────────────────┬───────────────────────┘
                            │
    ┌───────────────────────▼───────────────────────┐
    │     OceanBase + Lindorm + MongoDB + DRM       │
    └───────────────────────────────────────────────┘
```
