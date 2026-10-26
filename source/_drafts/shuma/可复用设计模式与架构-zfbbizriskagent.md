---
layout: false
---

# zfbbizriskagent 可复用设计模式与架构总结

本项目是基于 SOFA AI 的 Agent 平台，以 SOFA Serverless 模块运行在 bizriskaibase 基座上。以下按类别整理可在新系统中借鉴复用的设计。

---

## 目录

- [一、核心设计模式](#一核心设计模式)
  - [1.1 Creator-Registry-Factory 三层可插拔模式](#11-creator-registry-factory-三层可插拔模式)
  - [1.2 MessageSender 策略模式（输出通道解耦）](#12-messagesender-策略模式输出通道解耦)
  - [1.3 模板方法 + Skill 注入](#13-模板方法--skill-注入)
  - [1.4 DAG 工作流引擎](#14-dag-工作流引擎)
  - [1.5 动态工具注册（Tool-as-Data）](#15-动态工具注册tool-as-data)
  - [1.6 多租户上下文传播](#16-多租户上下文传播)
  - [1.7 Result 包装 + 枚举驱动类型](#17-result-包装--枚举驱动类型)
  - [1.8 DO-Model 分离 + MapStruct 转换](#18-do-model-分离--mapstruct-转换)
  - [1.9 DRM 动态配置（运行时热更新）](#19-drm-动态配置运行时热更新)
  - [1.10 任务状态机 + 容错调度](#110-任务状态机--容错调度)
  - [1.11 黑板模式（RuntimeVariables）](#111-黑板模式runtimevariables)
  - [1.12 输出转换器策略](#112-输出转换器策略)
- [二、架构决策与基础设施模式](#二架构决策与基础设施模式)
  - [2.1 模块分层架构](#21-模块分层架构)
  - [2.2 SOFA Serverless 模块化约束](#22-sofa-serverless-模块化约束)
  - [2.3 线程池配置策略](#23-线程池配置策略)
  - [2.4 双数据源 + 事务管理](#24-双数据源--事务管理)
  - [2.5 Lindorm 向量数据库集成](#25-lindorm-向量数据库集成)
  - [2.6 缓存策略](#26-缓存策略)
  - [2.7 RPC Facade 模式](#27-rpc-facade-模式)
  - [2.8 SSE 流式输出配置](#28-sse-流式输出配置)
- [三、踩坑经验与设计决策](#三踩坑经验与设计决策)
  - [3.1 SOFA Ark 模块化避坑](#31-sofa-ark-模块化避坑)
  - [3.2 Agent 创建中的容错](#32-agent-创建中的容错)
  - [3.3 DAG 执行中的快速失败](#33-dag-执行中的快速失败)
  - [3.4 多租户上下文丢失](#34-多租户上下文丢失)
  - [3.5 工具名去重](#35-工具名去重)
  - [3.6 Skill 缓存驱逐差异](#36-skill-缓存驱逐差异)
  - [3.7 并发控制](#37-并发控制)

---

## 一、核心设计模式

### 1.1 Creator-Registry-Factory 三层可插拔模式

**核心思想**：接口 + Spring 事件自动发现注册表 + 工厂路由，实现零配置扩展。

**结构**：
- `AgentCreator<T>` 接口：`create(meta)` + `getAgentType()`
- `AgentCreatorRegistry`：监听 `ContextRefreshedEvent`，自动收集所有 `@Component` Creator 到 `ConcurrentHashMap`
- `AgentFactory`：按 type 查注册表，委托给对应 Creator

**项目内三处实例**：
1. **AgentCreator / AgentCreatorRegistry / AgentFactory**（11 种 Agent：REACT、SINGLE、MULTI、NATIVE_TOOL_CALL、REFLECT_TOOL、JSON_REACT、REFLECTIVE_PLAN、COMPLEX_PLAN、DAG、ANT_LLM、SOFA_AI）
2. **RoleProcessor / RoleProcessorRegistry / RoleProcessorFactory**（8 种角色：Planner、Reasoner、Supervisor、Decider、Observer、Experts、RiskTool 等）
3. **NodeExecutor / DefaultNodeExecutorRegistry**（DAG 节点执行器）

**扩展方式**：只需新增一个 `@Component` 实现接口，无需修改注册表或工厂代码。

**复用场景**：任何需要"按类型码动态实例化"的扩展点。

---

### 1.2 MessageSender 策略模式（输出通道解耦）

**核心思想**：执行逻辑与输出通道完全解耦，同一 `StreamData` 可通过不同通道传输。

```java
public interface MessageSender {
    void sendMessage(StreamData message) throws IOException;
    void sendHeartBeatMessage(StreamData message) throws IOException;
    void complete();
}
```

**四种实现**：
| 实现 | 通道 | 场景 |
|------|------|------|
| `SseEmitterSender` | HTTP SSE | 前端流式展示 |
| `SofaStreamSender` | SOFA RPC 流式 | 服务间流式调用 |
| `EventSinkMessageSender` | 事件驱动 | 异步事件通知 |
| `SyncMessageSender` | 同步 RPC | 需要同步响应的场景 |

`AgentManagerV2` 接受 `MessageSender` 参数，添加新通道只需新增一个实现类。

**复用场景**：聊天机器人、实时推送、多协议网关。

---

### 1.3 模板方法 + Skill 注入

**核心思想**：基类 `AbstractSkillAwareAgentCreator` 处理横切关注点（MCP Server 构建、Skill 注入、后处理器挂载），子类只需实现 `doCreate()`。

**关键设计**：
- **双源 Skill 注入**：Skill Center + OSS，按 source 分区处理
- **缓存驱逐策略差异**：Skill Center `uninstall()` 清内存+磁盘；OSS `evictCache()` 仅清内存
- **`ScopedSkillsClient`**：限制 `getAllSkills()` 只返回当前 Agent 的 Skills
- **`ToolNameDedupCallbackHandler`**：所有 Skill handler 添加后去重工具名

**复用场景**：插件系统、中间件注入等需要统一预处理 + 个性化创建的工厂模式。

---

### 1.4 DAG 工作流引擎

**核心思想**：自包含的 DAG 执行引擎，支持拓扑排序并行执行、增强器链、脚本化边条件。

**分层设计**：
```
模型层    DagDefinition / DagBuilder / EdgeDefinition / BaseNodeDefinition
          ├── AgentNode         -- 执行子 Agent
          ├── ScriptNode        -- 执行脚本
          ├── LocalFunctionNode -- 执行本地函数
          ├── SubDag            -- 嵌套子 DAG
          └── End               -- 终止节点

执行层    DagExecutor → DefaultDagExecutor
          ├── CompletableFuture 并行执行
          ├── 快速失败级联跳过（下游节点标记 SKIPPED）
          └── 输出策略：LAST_NODE / SINGLE_NODE / CONTEXT_KEY / CUSTOM_MAPPER

增强层    NodePreEnhancer / NodePostEnhancer → NodeEnhancerChain
          ├── 类似 Servlet Filter 的拦截链
          └── PreEnhancerResult 可短路节点执行

边条件    EdgeCondition 接口
          ├── GroovyEdgeCondition  -- Groovy 脚本路由
          └── ScriptEdgeCondition  -- 通用脚本路由
```

**复用场景**：审批流、数据处理管线、多 Agent 协作编排。

---

### 1.5 动态工具注册（Tool-as-Data）

**核心思想**：工具定义存储在数据库中，启动时动态注册为 Spring Bean + FunctionCallback，无需代码部署即可新增工具。

**实现流程**：
```
DB ToolSchema 记录
  ↓ @PostConstruct 读取
DynamicToolLoad
  ├── AGENT 类型 → BeanDefinitionBuilder 创建 AgentExecuteTool Bean
  └── LINDORM 类型 → 创建 LindormCommonQueryTool Bean（含表名+输入输出 Schema）
  ↓
FunctionCallbackManager 注册
```

**复用场景**：低代码平台、插件市场、运行时可扩展的工具系统。

---

### 1.6 多租户上下文传播

**核心思想**：通过 ThreadLocal + TaskDecorator 实现跨线程池的租户上下文传播。

**实现链路**：
```
BizContext（tntInstId + operatorId + operatorType）
  ↓ ThreadLocal
BusinessThreadContext
  ↓ TaskDecorator
AgentContextDecorator（装饰 Runnable/Callable）
  ↓ 传播到
SofaThreadPoolTaskExecutor 提交的异步任务
  + SofaTracerTransmit 传播分布式追踪
```

**复用场景**：任何 SaaS 多租户系统，尤其是使用异步线程池的场景。

---

### 1.7 Result 包装 + 枚举驱动类型

**Result 统一响应**：
```java
Result<T> {
    T data;
    String resultCode;
    String resultMsg;
    boolean isSuccess;
    String customResultMsg;
}
PageResult<T> extends Result<T>  // 扩展分页
```

**枚举驱动**：所有枚举实现 `EnumInterface`（`getCode()` + `getDesc()`），`AgentTypeEnum` 携带 `AgentModeEnum`（LOCAL / REMOTE）作为字段，实现模式感知路由。

**复用场景**：任何 RPC/REST API 层。

---

### 1.8 DO-Model 分离 + MapStruct 转换

**核心思想**：DO（数据库对象）与 Model（领域模型）严格分离，MapStruct 编译期生成转换代码。

**约定**：
- `dal/mybatis/model/`：20 个 DO 类
- `model/convertor/`：22 个 Convertor，`@Mapper` 接口 + `INSTANCE` 单例
- 转换零运行时开销（编译期生成实现类）

**复用场景**：任何需要领域模型与持久化模型解耦的项目。

---

### 1.9 DRM 动态配置（运行时热更新）

**核心思想**：通过 DRM（Dynamic Resource Management）实现配置运行时热更新，无需重启。

| 配置分组 | 内容 |
|----------|------|
| `ZbAgentCommonDrm` | ODPS 凭证、缓存开关、Maya URL 前缀、过滤字符串 |
| `AgentDrm` | AntLLM 发布码、超时设置、重试码、API v2 开关、渠道映射 |
| `PromptDrm` | Prompt 模板覆盖（临时推送） |
| `NotifyDrm` | 邮件通知配置 |
| `ToolByInterfaceDrm` | 接口触发工具操作 |

**复用场景**：LLM 参数调优、限流阈值、功能开关等需要运行时调参的系统。

---

### 1.10 任务状态机 + 容错调度

**状态流转**：
```
INIT → PROCESSING → END
                  → FAILED
                  → CLOSED
```

**容错调度器矩阵**：

| 调度器 | 职责 | DRM 控制 |
|--------|------|----------|
| `AgentInitTaskExecutor` | 扫描卡在 INIT 的 Task，重新触发 | `initTaskLoadNum` |
| `TimeOutTaskExecutor` | 超时标记为 FAILED | `timeoutMinute` |
| `AgentInitChatExecutor` | Chat 级别卡 INIT 重触发 | 同上 |
| `AgentTimeOutChatExecutor` | Chat 级别超时标记 FAILED | 同上 |
| `AgentManagerV2.retryDecision()` | Task 级别重试 | `reTryAgentCodes` |

**复用场景**：批处理、异步工作流等长任务执行系统。

---

### 1.11 黑板模式（RuntimeVariables）

**核心思想**：`BizRiskAgentContext.runtimeVariables`（ConcurrentHashMap）作为黑板，多个 Agent/Role 通过读写共享变量实现数据流。

**流转**：
```
Agent A 执行 → AbstractRoleProcessor.postProcess() 解析输出 → 写入 runtimeVariables
                                                          ↓
Agent B 执行 → AbstractRoleProcessor.preProcess() 从 runtimeVariables 读取输入
```

**复用场景**：多 Agent 管线、多步骤数据处理中的中间结果传递。

---

### 1.12 输出转换器策略

不同 Agent 类型产出不同格式，通过转换器统一：

| 转换器 | 输入格式 | 场景 |
|--------|----------|------|
| `StreamOutputConverter` | 流式文本 | ReAct Agent |
| `JsonOutputConverter` | JSON | JSON React Agent |
| `XmlOutputConverter` | XML | XML 输出 Agent |
| `YamlOutputConverter` | YAML | YAML 输出 Agent |
| `ReactJsonConverter` | React JSON | Native Tool Call Agent |

**复用场景**：多格式输出归一化。

---

## 二、架构决策与基础设施模式

### 2.1 模块分层架构

```
facade（接口契约：RPC 接口 + DTO + 枚举 + Result 包装）
  ↑
model（领域模型 + MapStruct Convertor）    dal（MyBatis Mapper + ZDAL 数据源）
  ↑                                         ↑
integration（外部服务客户端 18 个）←──────── facade
  ↑
service（核心业务：Agent 编排 + Controller + Manager + Tool + DAG + 调度）
  ↑
bootstrap（SOFA Ark 打包入口）
```

**核心原则**：
- facade 是叶子模块（零内部依赖），可独立发布给消费方
- service 是枢纽（依赖所有模块），聚合所有逻辑
- bootstrap 仅依赖 service，负责 Ark 打包

**复用价值**：接口契约独立发布，领域模型与持久化模型各自演进。

---

### 2.2 SOFA Serverless 模块化约束

**关键约束**：
| 约束 | 说明 |
|------|------|
| 日志限制 | 只能用 `org.slf4j.Logger`，不能直接依赖 Logback/Log4j |
| 基座依赖 scope | 必须标记 `<scope>provided</scope>`，否则打包冲突 |
| 资源生命周期 | 线程池和 DataSource 必须声明 `@Bean(destroyMethod = "shutdown")` |
| 类冲突管理 | `conf/ark/bootstrap.properties` 管理排除/包含的 artifact |

**复用场景**：任何 SOFA Ark 模块化项目。

---

### 2.3 线程池配置策略

| Bean | 类型 | 配置 | 用途 |
|------|------|------|------|
| `agentTaskExecutor` | SofaThreadPoolTaskExecutor | core=32, max=64, queue=1000 | 通用异步任务 |
| `taskScheduler` | SofaThreadPoolTaskScheduler | pool=10 | 定时调度 |
| `agentExecutor` | VirtualThreadPerTaskExecutor | Java 21 虚拟线程 | 每请求一虚拟线程 |
| `schedulerTaskExecutor` | SofaScheduledThreadPoolExecutor | core=16 | 调度器执行 |

**关键设计**：
- 所有线程池使用 `SofaTracerTransmit` 传播分布式追踪
- `agentExecutor` 由 `ShutdownExecutorServicesOnUninstallEventHandler` 管理，确保 Ark 模块卸载时清理
- **虚拟线程用于 Agent 请求**，避免平台线程在 LLM 调用时阻塞

**复用价值**：Java 21 虚拟线程 + 平台线程池混合使用的最佳实践。

---

### 2.4 双数据源 + 事务管理

- `zfbBizRiskAgentDataSource`（主库）+ `explorerDataSource`（分析库）
- 各自独立的 `PlatformTransactionManager`
- `DsTransactionTemplate` 编程式事务管理

**复用价值**：多数据源场景下的事务隔离模式。

---

### 2.5 Lindorm 向量数据库集成

用于 RAG 向量存储和检索：
- `LindormClient` / `LindormClientImpl` + `LindormConfig`（Client 抽象 + 配置外置）
- `CompareParam`、`LindormTable` 等查询参数模型
- `TaskVector`、`ToolVector`、`UserVector` 领域向量模型 + 对应 Convertor

**复用价值**：向量数据库的标准集成模式——Client 抽象 + 配置外置 + 领域向量模型。

---

### 2.6 缓存策略

| 层级 | 实现 | 用途 |
|------|------|------|
| 本地内存 | `WorkingMemoryService`（ConcurrentHashMap） | 聊天历史缓存 |
| 本地缓存 | Caffeine | 工具结果缓存 |
| DRM 开关 | `chatModelCacheSwitch`、`promptTemplateSwitch` | 运行时控制缓存启用 |

**复用价值**：多级缓存 + DRM 开关控制的模式。

---

### 2.7 RPC Facade 模式

19 个 Facade 接口，每个有对应 service 实现：
- 接口定义在 `facade/rpc/` 模块
- 实现在 `service/biz/service/impl/rpc/`
- Request/Response DTO 分离
- `BizContext` 携带多租户上下文 + `@RequestCheck` / `@EnumCheck` 校验注解

**复用价值**：接口与实现分离的标准 SOFA 实践，确保消费方只依赖接口模块。

---

### 2.8 SSE 流式输出配置

```java
SseEmitter emitter = new SseEmitter(timeout);
response.setHeader("X-Accel-Buffering", "no");    // 禁止 Nginx 缓冲
response.setHeader("Cache-Control", "no-cache");   // 禁止浏览器缓存
```

**复用价值**：SSE 流式输出的标准 HTTP 头配置，防止 Nginx/代理层缓冲导致消息延迟。

---
## 三、踩坑经验与设计决策

### 3.1 SOFA Ark 模块化避坑

| 坑 | 解决方案 |
|----|----------|
| 日志框架冲突 | 只用 `org.slf4j.Logger`，不直接依赖 Logback/Log4j |
| 基座类重复加载 | 基座依赖标记 `<scope>provided</scope>` |
| 模块卸载资源泄漏 | 线程池/DataSource 声明 `@Bean(destroyMethod = "shutdown")` |
| 类冲突 | `bootstrap.properties` 精细管理排除/包含 artifact |

---

### 3.2 Agent 创建中的容错

**问题**：横切关注点（Skill、MCP）失败时是否应阻断 Agent 创建？

**决策**：降级优于中断。
- `injectSkills()` 用 try-catch 包裹，Skill 注入失败不阻塞 Agent 创建
- `buildMcpServers()` 同理，MCP 构建失败返回空列表

**教训**：横切关注点的失败不应阻断主流程，Agent 可在降级模式下继续运行。

---

### 3.3 DAG 执行中的快速失败

**问题**：DAG 中某节点失败后，下游节点是否继续执行？

**决策**：级联跳过。
- 节点失败后，下游所有节点标记 SKIPPED，避免无效执行和资源浪费
- `PreEnhancerResult` 可短路节点执行（前置增强器拦截）

**教训**：工作流引擎必须支持快速失败和级联跳过。

---

### 3.4 多租户上下文丢失

**问题**：异步线程池中 `BizContext` 丢失导致租户隔离失效。

**解决**：`AgentContextDecorator` 实现 `TaskDecorator`，在任务提交时装饰 Runnable/Callable，传播 `BusinessThreadContext`。

**教训**：所有线程池提交点都必须处理上下文传播，不能遗漏。

---

### 3.5 工具名去重

**问题**：多个 Skill 可能注册同名工具，导致 LLM 调用时工具冲突。

**解决**：`ToolNameDedupCallbackHandler` 在所有 Skill handler 添加后执行去重。

**教训**：插件/工具系统中，命名冲突是必然问题，需在注册层面处理而非依赖命名规范。

---

### 3.6 Skill 缓存驱逐差异

**问题**：Skill Center 和 OSS 两种来源的缓存驱逐策略不同，不能一刀切。

**解决**：
- Skill Center：`uninstall()` 清内存 + 磁盘
- OSS：`evictCache()` 仅清内存

**教训**：多来源系统中，缓存策略需按来源区分，否则导致缓存不一致或资源泄漏。

---

### 3.7 并发控制

**问题**：多线程并发修改同一 Task/Chat 状态。

**解决**：
- `TaskDOMapper.lockByTaskId()` / `lockByChatId()` 提供悲观锁
- 更新操作包含状态前置条件检查（如 `WHERE status = 'INIT'`）

**教训**：任务状态变更必须有数据库层并发保护，应用层锁不够可靠。
