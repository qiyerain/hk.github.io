---
layout: false
---

# zfbbizriskagent 核心技术挑战 — STDR 面试素材

> 项目：支付宝业务风险智能体平台 | Java 21 / SOFABoot 4.6.0 / SOFA AI 1.16.0 | 1468 个 Java 文件 | 11 种 Agent 类型 | 18 个外部集成

---

## 1. 多通道流式输出统一

**Situation**: 系统需要同时支持 HTTP SSE、SOFARPC Triple 流、消息推送（Postmen）、响应式流（EventSink）四种输出通道。Agent 执行逻辑产出的是流式 ChatData，但不同通道的发送机制完全不同（SseEmitter.send / SofaStreamObserver.onNext / Postmen 推送 / Sinks.Many.emit），如果每种通道各写一套执行逻辑，代码会大量重复且难以维护。

**Task**: 设计一种机制，让 Agent 核心执行逻辑与输出通道解耦，新增通道时零改动执行层。

**Decision**: 采用策略模式，抽象出 `MessageSender` 接口（sendMessage / sendHeartBeatMessage / complete），四个实现类分别包装各通道。`AgentManagerV2Impl` 的 `streamChat()` 创建 `SseEmitterSender`，`serveStream()` 创建 `SofaStreamSender`，`agentManagerChat()` 创建 `SyncMessageSender`。核心方法 `executeAgent(context, messageSender)` 只依赖接口，不感知具体通道。SSE 通道额外用 `SseNotificationService` 维护 `CopyOnWriteArrayList<SseEmitter>` + 15 秒心跳保活，防止网关超时断连。

**Result**: 新增输出通道只需实现 `MessageSender`，执行层零改动。SSE 心跳机制解决了 Nginx 60 秒超时断连问题。四种通道共享同一套 Agent 执行逻辑，代码复用率高。

**面试话术**: "我们系统有四种流式输出通道——SSE、RPC 流、消息推送、响应式流。我把它们抽象成 MessageSender 策略接口，Agent 执行层只依赖这个接口，完全不知道数据走的是哪个通道。新增通道只要写一个实现类，核心逻辑一行不改。SSE 还有个心跳保活的设计，每 15 秒发 SSE 注释，网关看到有数据流动就不会超时断连。"

---

## 2. 四种 ReAct Agent 变体的状态管理

**Situation**: 不同业务场景对 Agent 的"思考能力"要求不同——简单查询只需原生工具调用，复杂任务需要 DAG 任务图和反思能力。如果用一种 Agent 适配所有场景，要么简单场景 token 浪费严重（带反思工具），要么复杂场景能力不足（无规划）。

**Task**: 为不同复杂度的场景提供合适的 Agent 类型，同时复用 ReAct 循环框架。

**Decision**: 基于 `ReActAgent` 派生四种变体，核心差异在 `updatePromptByAction()`（每轮工具执行后如何更新 prompt）：
- **NativeToolCallsReactAgent**：直接用 LLM 原生 function calling，无额外思考工具。加工具结果压缩（Caffeine 缓存 + LLM 摘要），解决长对话 token 超限。
- **ReflectToolAgent**：注入 `RecordReflection` 工具，LLM 调业务工具时同步记录决策。维护 `planned_reminder` UserMessage 注入 prompt，有新计划就替换，正常执行就逐步消耗。状态机：PLANNING→EXECUTING→(REFLECTING|EVOLVING)*→COMPLETED。
- **ComplexTaskReactAgent**：LLM 每轮输出完整 JSON（thought/taskList/pendingTasks），框架解析后执行 pendingTasks。任务状态全量替换，适合需要 DAG 依赖的复杂场景。
- **ReflectivePlanningAgent**：LLM 输出增量更新（taskUpdates/newTasks/cancelledTaskIds），框架维护可变 taskList。加 `Nothing` 工具让 LLM 在无工具调用时也能完成决策节点。

**Result**: 11 种 Agent 类型覆盖从简单到复杂的全场景。ReflectToolAgent 比原生多一次工具调用开销，但换来了可审计的决策记录。ComplexTaskReactAgent 执行时间久但效果 OK，适合复杂规划。

**面试话术**: "我们有四种 Agent 变体，核心区别是每轮工具调用后怎么更新 prompt。最简单的直接用原生 function calling；中等复杂度的加了 RecordReflection 工具让 LLM 同步记录决策，用 planned reminder 机制把计划回显给它；最复杂的让 LLM 输出完整任务 DAG，框架解析执行。这样简单场景不浪费 token，复杂场景有规划能力。"

---
## 3. 多租户上下文跨线程传播

**Situation**: `BizContext`（含 tntInstId/operatorId）通过 `AgentContextHolder`（ThreadLocal）传递。但 Agent 请求会经过多个线程池：`agentTaskExecutor`（平台线程池 32-64）处理异步任务，`agentExecutor`（虚拟线程）执行 Agent，`taskScheduler`（10 线程）处理定时任务。ThreadLocal 在线程池提交时默认丢失。

**Task**: 确保 `BizRiskAgentContext` 在所有异步线程切换中不丢失，且不影响 SOFA Tracer 的链路追踪。

**Decision**: 实现 `AgentContextDecorator`（Spring `TaskDecorator`），在 `agentTaskExecutor` 提交任务时自动捕获父线程的 `BizRiskAgentContext` 并在子线程中恢复。同时用 `SceneRunnable.wrap()` 包装 Runnable 以传播 SOFA Tracer。虚拟线程执行器因 JDK 不支持 TaskDecorator，在提交点手动包装上下文。租户校验在 `AgentManagerV2Impl` 入口处做 tntInstId 匹配。

**Result**: 平台线程池的上下文传播完全自动化（TaskDecorator）。虚拟线程需手动包装但已覆盖所有提交点。RAG 的 `AntLLMRAGClientImpl` 为每个租户维护独立的 `RetrieveEngine` 实例（Map<tenantId, RetrieveEngine>），通过 DRM 热更新租户配置。

**面试话术**: "多租户上下文传播是个经典问题。我们用 ThreadLocal 存 BizContext，但请求会跨三个线程池——平台线程池、虚拟线程、定时任务线程池。平台线程池用 Spring TaskDecorator 自动传播；虚拟线程因为 JDK 不支持 TaskDecorator，所以在提交点手动包装。同时还要传播 SOFA Tracer，用 SceneRunnable 包装。另外 RAG 层面每个租户有独立的 RetrieveEngine 实例，通过 DRM 热更新配置。"

---

## 4. 运行时动态工具注册

**Situation**: 工具（Tool/Function）不是编译时确定的，而是运营在数据库中配置（ToolSchema 表），Agent 创建时按绑定关系动态加载。工具分两类：Lindorm 查询工具（基于表结构自动生成 schema）和 Agent 调用工具（调用另一个 Agent）。新增/修改工具不应重启应用。

**Task**: 实现工具的运行时注册/注销，包括 Spring Bean 生命周期管理和 JSON Schema 自动生成。

**Decision**: `DynamicToolLoad` 在 `@PostConstruct` 时查询所有 `status=REGISTERED` 的 ToolSchema，为每个工具动态创建 Spring Bean（`DefaultListableBeanFactory.registerBeanDefinition`），并通过 `JsonFunctionCallback.builder()` 构建带 JSON Schema 的 `FunctionCallback` 注册到 `FunctionCallbackManager`。Lindorm 工具用 `ToolInputParam` 自动生成 schema；Agent 工具手动构建 schema。注销时同时移除 FunctionCallback 和销毁 Spring Bean。重注册 = 注销 + 注册。

**Result**: 工具热加载无需重启。Lindorm 工具从表结构自动生成输入输出 schema，运营只需配表名和参数映射。Agent 工具支持跨 Agent 调用。`AbstractSkillAwareAgentCreator.resolveToolCallbacks()` 对找不到的工具做容错（log error + skip），不阻塞 Agent 创建。

**面试话术**: "工具不是写死在代码里的，是运营在数据库配的。启动时 DynamicToolLoad 查所有已注册的工具，动态创建 Spring Bean 注册到 FunctionCallbackManager。Lindorm 工具的 JSON Schema 是从表结构自动生成的，运营只配表名和参数映射就行。注销时要同时移除 FunctionCallback 和销毁 Spring Bean，重注册就是注销再注册。这样加工具不用重启应用。"

---

## 5. 流式输出解析（StreamOutputConverter）

**Situation**: LLM 流式返回的 token 是任意切分的 chunk，`<thought>` 标签和 `Final Answer:` 标记可能被拆分到多个 chunk 中。ReAct Agent 需要在流式输出中实时识别：思考内容（给前端展示 CoT）、工具调用（触发 function calling）、最终答案（结束流）。

**Task**: 在流式 chunk 中准确识别状态切换点，同时支持 SSE 实时推送和工具调用拦截。

**Decision**: `StreamOutputConverter` 继承 `ReActAgentOutputConverter`，实现 `parse(Flux<ChatResponse>, Consumer<String>)`。核心机制：
1. **状态机**：维护 `isInThoughtTag` 布尔值，跟踪 `<thought>` 标签开关。chunk 可能将 `<thought>` 拆成 `<tho` + `ught>`，用前缀匹配缓冲区处理。
2. **Final Answer 检测**：维护 `pendingFinalAnswerBuffer`，逐 chunk 累积匹配 `FINAL_ANSWER_FLAG`。匹配成功后切换到 `Sinks.Many<String> finalAnswerSink`，将最终答案通过独立 Flux 推送。
3. **工具调用短接**：检测到 `hasToolCalls` 时直接构造 `FunctionUseAction` 返回，不走流式解析。
4. **CountDownLatch 同步**：Flux 完成时 countdown，让调用线程能同步等待流结束。

**Result**: 实现了 chunk 边界安全的状态切换，前端能实时看到 CoT 思考过程和最终答案的流式输出。工具调用在流中被准确拦截。`pendingFinalAnswerBuffer` 解决了 `Final Answer:` 被拆分到多个 chunk 时的误判问题。

**面试话术**: "流式输出解析最头疼的是 chunk 边界问题。LLM 返回的 token 是任意切分的，`<thought>` 标签可能被拆成两个 chunk，`Final Answer:` 也可能跨 chunk。我用状态机跟踪标签开关，用前缀匹配缓冲区处理跨 chunk 的标签。Final Answer 的检测用 pendingFinalAnswerBuffer 逐 chunk 累积匹配，匹配成功后切到独立的 Flux 推送最终答案。工具调用在流中直接短接，不走文本解析。"

---

## 6. DAG 工作流引擎

**Situation**: 复杂风控场景需要多步骤编排，步骤间有依赖关系和条件分支。例如：先查处罚单→根据结果判断是否查关联风险→并行查多个数据源→汇总输出。需要支持并行执行、条件路由、快速失败。

**Task**: 在 Agent 平台内实现一个轻量 DAG 引擎，支持节点并行、边条件路由、失败级联跳过、增强器链。

**Decision**: 自建 DAG 引擎（`biz/dag/` 包），四层设计：
1. **Model 层**：`DagDefinition`（节点+边）、`BaseNodeDefinition`（Agent/Script/LocalFunction/SubDag/End 五种节点类型）、`EdgeDefinition`（含 Groovy/Script 条件表达式）。
2. **Builder 层**：`DagBuilder` 校验 DAG 合法性（环检测、入度计算），构建拓扑排序。
3. **Executor 层**：`DefaultDagExecutor` 用 `CompletableFuture` 实现拓扑并行——入度为 0 的节点同时启动，节点完成后触发下游节点。失败时级联跳过所有下游（fast-fail cascade skip）。
4. **Enhancer 层**：`NodeEnhancerChain`（Servlet Filter 模式），支持 pre/post 增强器，`PreEnhancerResult` 可短路节点执行。

**Result**: DAG Agent 类型支持复杂编排场景。CompletableFuture 并行执行显著提升多数据源查询场景的响应时间。Groovy 边条件支持运行时动态路由。快速失败机制避免了一个节点失败后下游节点空转浪费 token。

**面试话术**: "我们自建了一个轻量 DAG 引擎。四层设计：Model 定义节点和边，Builder 做环检测和拓扑排序，Executor 用 CompletableFuture 实现拓扑并行——入度为 0 的节点同时启动，一个完成就触发下游。失败时级联跳过所有下游节点，不浪费 token。边条件用 Groovy 脚本，支持运行时动态路由。还有个 Enhancer 层类似 Servlet Filter，preEnhancer 可以短路节点执行。"

---
## 7. Agent 创建与 Skill 注入的容错

**Situation**: Agent 创建过程涉及多个外部依赖：Skill Center（远程服务）获取 Skill 定义、OSS 下载 Skill 包、MCP Server 连接、FunctionCallbackManager 注册工具。任何一个外部依赖失败都会导致 Agent 创建失败，进而导致整个请求失败。

**Task**: Agent 创建必须对外部依赖故障有容错能力，核心功能不能因非关键依赖失败而中断。

**Decision**: `AbstractSkillAwareAgentCreator` 采用模板方法模式，将创建流程分为：①构建 MCP Servers → ②子类 doCreate() 创建 Agent → ③注入 Skills → ④工具名去重 → ⑤解析工具绑定。其中 ① 和 ③ 包裹在 try-catch 中，失败时 log error 但不抛异常，Agent 以降级模式创建（缺少部分 Skill/工具）。`ToolNameDedupCallbackHandler` 在所有 Skill handler 注入后执行，按最后注册优先规则去重同名工具。`ScopedSkillsClient` 限制 `getAllSkills()` 只返回当前 Agent 绑定的 Skill，从源头减少冲突。

**Result**: Skill Center 不可用时 Agent 仍能创建（降级模式），不影响核心功能。OSS Skill 加载失败只影响该 Skill 对应的工具，不阻塞其他工具。工具名冲突通过 `ToolNameDedupCallbackHandler` 在注册层面解决，不会导致运行时错误。

**面试话术**: "Agent 创建依赖 Skill Center、OSS、MCP Server 等外部服务，任何一个挂了整条链路就断了。我用模板方法把创建流程拆成五步，MCP 和 Skill 注入两步包了 try-catch，失败不抛异常，Agent 以降级模式创建——缺几个工具但核心功能能用。工具名去重用回调处理器在所有 Skill 注入完后执行，最后注册的优先。还用 ScopedSkillsClient 限制只获取当前 Agent 绑定的 Skill，从源头减少冲突。"

---

## 8. 工具名冲突与去重

**Situation**: 多个 Skill 可能注册同名工具（如两个 Skill 都提供 "queryTool"），或 Skill 工具与本地 `@SofaAiFunction` 工具重名。LLM function calling 对工具名唯一性有要求，重名会导致调用歧义。

**Task**: 在工具注册阶段解决命名冲突，保证运行时无歧义。

**Decision**: 三层防护：
1. **源头限制**：`ScopedSkillsClient` 只获取当前 Agent 绑定的 Skill，减少跨 Agent 工具名冲突。
2. **注册时去重**：`ToolNameDedupCallbackHandler`（`BaseCallbackHandler` 子类）在所有 Skill handler 注入完成后触发 `onFunctionEnd()`，遍历 `functionCallbacks` 按名称去重，保留最后注册的版本。
3. **解析时容错**：`resolveToolCallbacks()` 中 `findFunctionCallbackByName()` 返回 null 时 log error 但 skip，不阻塞 Agent 创建。

**Result**: 多 Skill 场景下不再出现工具名冲突导致的运行时错误。去重策略"最后注册优先"确保后加载的 Skill 能覆盖先加载的同名工具，符合热更新预期。

**面试话术**: "工具名冲突是插件系统的经典问题。我们做了三层防护：第一层 ScopedSkillsClient 只获取当前 Agent 绑定的 Skill，从源头减少冲突；第二层 ToolNameDedupCallbackHandler 在所有 Skill 注入完后做名称去重，最后注册的优先；第三层解析时 findFunctionCallbackByName 返回 null 就 skip，不阻塞创建。三层下来，运行时基本不会出现工具名冲突了。"

---

## 9. SOFA Ark 模块化部署约束

**Situation**: 应用以 SOFA Ark 模块运行在 bizriskaibase 基座上，模块和基座之间有类加载器隔离。基座提供的依赖（SOFABoot、SOFA AI 等）必须声明为 `<scope>provided</scope>`，否则会类冲突。线程池和数据源需要在模块卸载时正确销毁。

**Task**: 在 Ark 模块约束下保证应用正常运行，且模块热部署/卸载时不泄漏资源。

**Decision**:
1. **依赖 scope**：所有基座已提供的依赖声明为 `provided`，避免类冲突。
2. **日志限制**：只使用 `org.slf4j.Logger`（基座提供），不引入其他日志框架。
3. **资源销毁**：线程池 Bean 声明 `@Bean(destroyMethod="shutdown")`，数据源 Bean 声明 `@Bean(destroyMethod="close")`。
4. **类冲突管理**：`bootstrap.properties` 配置 `ark.plugin` 优先加载策略，解决基座和模块的类版本冲突。

**Result**: 模块在 bizriskaibase 基座上稳定运行，热部署不泄漏线程池和数据源连接。类冲突通过 bootstrap.properties 配置解决。踩坑经验：未声明 provided 的依赖会在运行时抛 ClassNotFoundException 或 ClassCastException，排查困难。

**面试话术**: "我们跑在 SOFA Ark 模块化基座上，最大的坑是类加载器隔离。基座提供的依赖必须声明 provided，否则运行时类冲突——ClassNotFoundException 和 ClassCastException 交替出现，排查很痛苦。另外线程池和数据源必须在 Bean 上声明 destroyMethod，否则热部署卸载模块时会泄漏资源。日志也只能用基座提供的 SLF4J，不能自己引日志框架。"

---

## 10. SSE 长连接保活与网关超时

**Situation**: Agent 一次对话可能持续数十秒到数分钟（LLM 推理 + 多轮工具调用），但 Nginx/网关默认 60 秒无数据就断开连接。SSE 连接断开后前端收不到后续数据，用户看到对话卡住。

**Task**: 保证 SSE 长连接在长时间 Agent 执行期间不断开。

**Decision**: 三层保活机制：
1. **SseEmitter 超时**：设为 10 分钟（`SseEmitter(600_000L)`），远超一般对话时长。
2. **心跳机制**：`SseNotificationService` 每 15 秒给所有活跃连接发送 SSE 注释（`SseEmitter.event().comment("heartbeat")`），输出为 `: heartbeat\n\n`。浏览器 EventSource API 自动忽略注释行，但网关看到有数据流动不会超时。
3. **响应头**：`X-Accel-Buffering: no` 告诉 Nginx 禁用代理缓冲，`Cache-Control: no-cache` 防止中间层缓存。

**Result**: Agent 对话即使在工具调用耗时较长时也能保持连接。心跳发送失败的 Emitter 自动从列表移除，不泄漏。`CopyOnWriteArrayList` 保证心跳遍历时的线程安全。

**面试话术**: "SSE 长连接保活是生产环境的经典问题。Agent 一次对话可能几分钟，Nginx 60 秒没数据就断。我们做了三层：SseEmitter 超时设 10 分钟；每 15 秒发 SSE 注释心跳——浏览器自动忽略注释但网关看到有流量不会超时；响应头设 X-Accel-Buffering: no 禁用 Nginx 缓冲。心跳发不出去的连接自动清理，不泄漏。"

---

## 速查表：面试高频追问准备

| 追问方向 | 要点 |
|---------|------|
| "为什么不用 WebSocket？" | SSE 是单向推送，满足 LLM 流式输出场景；实现简单，原生 HTTP；WebSocket 是双向通道，这里不需要客户端推送 |
| "ReflectToolAgent 和 ComplexTaskAgent 怎么选？" | 简单场景用 NativeToolCall（最快），需要可审计决策记录用 ReflectTool，需要 DAG 依赖编排用 ComplexTask |
| "虚拟线程上下文传播有什么坑？" | JDK 的 VirtualThread 不支持 TaskDecorator，必须在提交点手动包装；ThreadLocal 在虚拟线程间传播需要显式处理 |
| "StreamOutputConverter 的 chunk 边界问题具体怎么解？" | 前缀匹配缓冲区：逐 chunk 累积到 buffer，每次检查 buffer 是否包含完整标签或标记；匹配成功后清空 buffer，不成功继续累积 |
| "DAG 引擎为什么不用现成的？" | 现成引擎（如 Airflow、Camunda）太重，需要独立部署；我们的 DAG 是 Agent 内编排，需要和 SOFA AI 的 ReAct 循环深度集成；自建引擎 4 层设计，代码量可控 |
| "工具热加载有没有一致性问题？" | 有。注册瞬间如果有请求正在用旧工具，可能调用到已销毁的 Bean。实际影响很小因为 FunctionCallbackManager 是内存引用，注册是原子替换 |
| "心跳 15 秒的间隔怎么定的？" | Nginx 默认 proxy_read_timeout 是 60 秒，15 秒间隔留了 4 倍余量。太频繁浪费带宽，太稀疏可能被中间层超时。生产环境可根据网关配置调整 |
