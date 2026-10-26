---
original_dir: 原生与非原生Agent区别及反思规划实现-zfbbizriskagent
---

## 目录

- [一、原生 vs 非原生的核心区别](#一原生-vs-非原生的核心区别)
  - [1.1 一句话总结](#11-一句话总结)
  - [1.2 调用方式对比](#12-调用方式对比)
  - [1.3 关键判断逻辑](#13-关键判断逻辑)
  - [1.4 对应的 Agent 类型一览](#14-对应的-agent-类型一览)
  - [1.5 执行流程对比](#15-执行流程对比)
  - [1.6 输出解析器对比](#16-输出解析器对比)
    - [StreamOutputConverter（非原生 ReAct）：](#streamoutputconverter非原生-react)
    - [ReactJsonConverter（非原生 JSON）：](#reactjsonconverter非原生-json)
  - [1.7 NativeToolCallsReactAgent 的独有特性：Memory 压缩](#17-nativetoolcallsreactagent-的独有特性memory-压缩)
- [二、ReflectToolAgent — 反思规划+原生的实现](#二reflecttoolagent--反思规划原生的实现)
  - [2.1 定位](#21-定位)
  - [2.2 状态机](#22-状态机)
  - [2.3 三条核心规则（System Prompt 中强制约束）](#23-三条核心规则system-prompt-中强制约束)
    - [R0 - DecisionGate（决策门） — 二元选择](#r0---decisiongate决策门--二元选择)
    - [R1 - NoStandaloneReflection（禁止单独反思）](#r1---nostandalonereflection禁止单独反思)
    - [R2 - ReflectionPayload（状态特定载荷）](#r2---reflectionpayload状态特定载荷)
  - [2.4 RecordReflection 工具实现](#24-recordreflection-工具实现)
    - [输入 Schema（RecordReflectionRequest）：](#输入-schemarecordreflectionrequest)
    - [PlanStep 类型：](#planstep-类型)
    - [执行逻辑：](#执行逻辑)
  - [2.5 计划步骤提醒机制（Planned Reminder）](#25-计划步骤提醒机制planned-reminder)
    - [Reminder 消息结构：](#reminder-消息结构)
    - [三种处理分支（在 `updatePromptByAction()` 中）：](#三种处理分支在-updatepromptbyaction-中)
    - [核心代码逻辑：](#核心代码逻辑)
  - [2.6 完整执行流程示例](#26-完整执行流程示例)
  - [2.7 与 NativeToolCallsReactAgent 的对比](#27-与-nativetoolcallsreactagent-的对比)
  - [2.8 为什么这个设计有效？](#28-为什么这个设计有效)
  - [2.9 关键源文件](#29-关键源文件)
- [引用](#引用)

---

> 自动生成：22 张图，由多模态模型 `doubao-seed-2.0-pro` 一次性识别转写。

![image-20260525112003001.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525112003001.png)
# 原生 vs 非原生 Agent 区别 & 反思规划+原生实现分析
---
## 一、原生 vs 非原生的核心区别
### 1.1 一句话总结

![image-20260525112003002.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525112003002.png)
- 原生 (Native Tool Call)：LLM 通过 function calling API 直接返回结构化的 `ToolCall` 对象，框架无需解析文本
- 非原生 (Prompt-Driven)：通过 Prompt 引导 LLM 在文本中输出工具调用指令，再用正则/JSON 解析提取

### 1.2 调用方式对比
| 维度 | 原生 (Native Tool Call) | 非原生 - ReAct | 非原生 - JSON ReAct |
| ---- | ------------------------ | -------------- | ------------------- |
| 调用机制 | LLM 原生 function calling API，模型直接返回结构化 `ToolCall` 对象 | Prompt 引导 LLM 输出文本，用正则解析 `Action: xxx / Action Input: xxx` | Prompt 引导 LLM 输出 JSON，解析 `{actions: [{action, actionInput}]}` |
| 解析方式 | 框架原生解析<br>`ChatResponse.hasToolCalls()` | `StreamOutputConverter` 正则匹配 | `ReactJsonConverter` JSON 反序列化 |
| 消息格式 | System → User → Assistant(ToolCall) → ToolResponse | System → User → Assistant(文本) → User(Observation) | System → User → Assistant(JSON) → User(Observation) |
| 模型要求 | 必须支持 function calling（如 Claude、GPT-4） | 任意 LLM 均可 | 任意 LLM 均可 |

![image-20260525112003003.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525112003003.png)
| 维度 | 原生 (Native Tool Call) | 非原生 - ReAct | 非原生 - JSON ReAct |
| ---- | ------------------------ | -------------- | ------------------- |
| 解析方式 | 框架原生解析<br>`ChatResponse.hasToolCalls()` | `StreamOutputConverter` 正则匹配 | `ReactJsonConverter` JSON 反序列化 |
| 消息格式 | System → User → Assistant(ToolCall) → ToolResponse | System → User → Assistant(文本) → User(Observation) | System → User → Assistant(JSON) → User(Observation) |
| 模型要求 | 必须支持 function calling（如 Claude、GPT-4） | 任意 LLM 均可 | 任意 LLM 均可 |
| 可靠性 | 高 — 模型原生支持，结构化输出 | 中 — 依赖正则鲁棒性 | 中高 — JSON 格式比正则更稳定 |
| 额外能力 | 支持 Memory 压缩（长对话优化） | 无 | 无 |

### 1.3 关键判断逻辑
代码中通过一个 if 分支决定走原生还是非原生路径：
```java
// 在 updatePromptByAction() 中的分支判断
if (toolUseAction.loadChatResponse().hasToolCalls() && useFunctionCallArgument(prompt)) {
    // ===== 原生路径 =====
    // 直接从 ChatResponse 提取结构化 ToolCall 对象
```

![image-20260525112003004.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525112003004.png)
```java
// 在 updatePromptByAction() 中的分支判断
if (toolUseAction.loadChatResponse().hasToolCalls() && useFunctionCallArgument(prompt)) {
    // ===== 原生路径 =====
    // 直接从 ChatResponse 提取结构化 ToolCall 对象
    AssistantMessage assistantMessage = toolUseAction.loadChatResponse().getResult().getOutput();
    List<ToolResponseMessage.ToolResponse> toolResponses = toolUseAction.getToolCalls().stream()
        .map(t -> new ToolResponseMessage.ToolResponse(t.getId(), t.getName(), t.getFunctionResult()))
        .toList();
    ToolResponseMessage toolResponseMessage = ToolResponseMessage.builder()
        .responses(toolResponses).build();
    // 消息格式: AssistantMessage(含ToolCall) + ToolResponseMessage
} else {
    // ===== 非原生路径 =====
    // 从文本中解析工具调用
    String assistantMessageValue = generateAssistantMessage(toolUseAction); // LLM 的文本输出
    String userMessageValue = generateObserverMessage(toolUseAction);      // Observation 结果
    // 消息格式: AssistantMessage(文本) + UserMessage(Observation)
}
```

### 1.4 对应的 Agent 类型一览
| Agent 类型 | 枚举值 | Creator | 自定义 Agent 类 | 调用方式 |
| ---------- | ------ | ------- | --------------- | -------- |
| REACT | REACT | ReActAgentCreator | SOFA ReActAgent（原生） | 非原生 Prompt |
| NATIVE_TOOL_CALL | NATIVE_TOOL_CALL | NativeToolCallAgentCreator | NativeToolCallsReactAgent | 原生 function calling |
| REFLECT_TOOL | REFLECT_TOOL | ReflectToolAgentCreator | ReflectToolAgent | 原生 + 反思 |
| JSON_REACT | JSON_REACT | JsonReactAgentCreator | JsonReactAgent | 非原生 JSON |

### 1.5 执行流程对比
原生工具调用流程：

![image-20260525112003005.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525112003005.png)
原生工具调用流程：
```
User Query
↓
NativeToolCallsReactAgent.initFirstPrompt()
↓ SystemMessage + UserMessage (含工具引导提示)
ChatModel (开启 tool calling)
↓ 返回结构化 ToolCall 对象
hasToolCalls() == true
↓
框架直接执行工具
↓
updatePromptByAction() 添加 ToolResponseMessage
↓ (可选: Memory 压缩)
循环直到 "Final Answer" 或无更多 action
```

非原生（Prompt 驱动）流程：

![image-20260525112003006.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525112003006.png)
非原生（Prompt 驱动）流程：
```
User Query
↓
ReActAgent / JsonReactAgent.initPrompt()
↓ SystemMessage + UserMessage (工具列表写在文本中)
ChatModel (纯文本生成)
↓ 返回纯文本
hasToolCalls() == false
↓
StreamOutputConverter / ReactJsonConverter 解析文本
↓ 正则匹配 "Action: xxx" 或 JSON 解析
提取工具名和参数
↓
执行工具
↓
updatePromptByAction() 添加 AssistantMessage + UserMessage
↓
循环直到 "Final Answer:" 或解析失败
```

### 1.6 输出解析器对比
#### StreamOutputConverter（非原生 ReAct）：
```java
// 正则模式
Pattern ACTION_PATTERN = Pattern.compile("Action\s*:\s*(.*?)\nAction\s*Input\s*:\s*(.*)", DOTALL);

// LLM 输出示例
"Thought: 需要查询用户风险画像
Action: queryUserRisk
Action Input: {\"userId\": \"123\"}"
```

#### ReactJsonConverter（非原生 JSON）：

![image-20260525112003007.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525112003007.png)
```java
// JSON 解析
ReactJsonResponse response = JsonUtil.jsonStringToObject(text, ReactJsonResponse.class);

// LLM 输出示例
{
    "thought": "需要查询用户风险画像",
    "actions": [{ "action": "queryUserRisk", "actionInput": {"userId": "123"} }],
    "finalAnswer": null
}
```

原生模式：无需自定义解析器，框架直接从 `ChatResponse.getResult().getOutput().getToolCalls()` 获取。

### 1.7 NativeToolCallsReactAgent 的独有特性：Memory 压缩
```java
// NativeToolCallAgentCreator.java
if (SystemConstants.TRUE.equalsIgnoreCase(
    meta.getConfigValue(AgentMetaConfigKeyEnum.AGENT_ENABLE_MEMORY.getCode()))) {
    functionCallbackNames.add("LoadCompressionInfoTool");
}
```

当开启 Memory 压缩时：
1. 收集最近 3 轮工具调用结果
2. 计算 token 总量
3. 超过阈值时，调用 LLM 压缩为摘要
4. 原始结果缓存，可通过 `LoadCompressionInfoTool` 按需加载
5. 有效控制长对话的 token 消耗

---
## 二、ReflectToolAgent — 反思规划+原生的实现
### 2.1 定位
```
ReflectToolAgent = NativeToolCallsReactAgent (原生工具调用)
                 + RecordReflection (反思记录工具)
                 + 计划步骤提醒机制 (Planned Reminder)
```

它在原生工具调用的基础上，增加了三层能力：
1. 状态机驱动的决策流程 — 让 Agent 知道自己处于什么阶段
2. RecordReflection 工具 — 记录每轮决策的状态、笔记、计划
3. planSteps 提醒机制 — 确保 LLM 不会"忘记"待执行的步骤

![image-20260525112003008.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525112003008.png)
```
ReflectToolAgent = NativeToolCallsReactAgent (原生工具调用)
                 + RecordReflection (反思记录工具)
                 + 计划步骤提醒机制 (Planned Reminder)
```

它在原生工具调用的基础上，增加了三层能力：
1. 状态机驱动的决策流程 — 让 Agent 知道自己处于什么阶段
2. RecordReflection 工具 — 记录每轮决策的状态、笔记、计划
3. planSteps 提醒机制 — 确保 LLM 不会"忘记"待执行的步骤

### 2.2 状态机
```
PLANNING → EXECUTING → (REFLECTING | EVOLVING)* → COMPLETED
```

| 状态 | 含义 | 必填字段 | 触发时机 |
| ---- | ---- | -------- | -------- |
| PLANNING | 首轮规划 | state + note + planSteps | 第一轮，分析需求制定计划 |
| EXECUTING | 正常执行 | state + note | 按计划执行工具调用 |
| REFLECTING | 反思 | state + note + planSteps + rca | 遇到错误/阻塞/卡住时 |
| EVOLVING | 演化 | state + note + planSteps | 获得新信息需调整策略时 |

状态转换规则：
- PLANNING 只出现在第一轮
- EXECUTING 是常态，每轮消费一个 planStep
- REFLECTING 在出错时触发，必须附带 RCA（根因分析），并重新规划
- EVOLVING 在获取新信息时触发，调整策略但不代表出错

![image-20260525112003009.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525112003009.png)
```
PLANNING → EXECUTING → (REFLECTING | EVOLVING)* → COMPLETED
```

| 状态 | 含义 | 必填字段 | 触发时机 |
| ---- | ---- | -------- | -------- |
| PLANNING | 首轮规划 | state + note + planSteps | 第一轮，分析需求制定计划 |
| EXECUTING | 正常执行 | state + note | 按计划执行工具调用 |
| REFLECTING | 反思 | state + note + planSteps + rca | 遇到错误/阻塞/卡住时 |
| EVOLVING | 演化 | state + note + planSteps | 获得新信息需调整策略时 |

状态转换规则：
- PLANNING 只出现在第一轮
- EXECUTING 是常态，每轮消费一个 planStep
- REFLECTING 在出错时触发，必须附带 RCA（根因分析），并重新规划
- EVOLVING 在获取新信息时触发，调整策略但不代表出错

### 2.3 三条核心规则（System Prompt 中强制约束）

![image-20260525112003010.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525112003010.png)
#### R0 - DecisionGate（决策门） — 二元选择
每一轮只有两种选择：
├─ 信息足够 → 禁止调任何工具，直接输出 "Final Answer:"
└─ 信息不足 → 必须同时调用 RecordReflection + 至少 1 个业务工具（并行）

这条规则防止 Agent 陷入无意义的循环（既不调工具也不给答案）。

#### R1 - NoStandaloneReflection（禁止单独反思）
RecordReflection 不是独立工具！
├─ 禁止：没有业务工具要调 → 单独调 RecordReflection
├─ 禁止：最后一轮总结 → 用 RecordReflection 记录总结
└─ 允许：RecordReflection + queryUserRisk 并行调用

这条规则防止 Agent "光想不做"——只反思不行动。

#### R2 - ReflectionPayload（状态特定载荷）
```
EXECUTING:   state + note (planSteps 可省略，表示计划不变)
PLANNING:    state + note + planSteps
REFLECTING:  state + note + planSteps + rca (根因分析)
```

![image-20260525112003011.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525112003011.png)
```
EXECUTING:   state + note (planSteps 可省略，表示计划不变)
PLANNING:    state + note + planSteps
REFLECTING:  state + note + planSteps + rca (根因分析)
EVOLVING:    state + note + planSteps
```

### 2.4 RecordReflection 工具实现
文件：`biz/service/manager/function/RecordReflectionTool.java`

#### 输入 Schema（RecordReflectionRequest）：
```json
{
    "state": "PLANNING",
    "note": "需要查询用户风险画像和交易历史来评估风险等级",
    "confidence": 7,
    "planSteps": [
        {
            "type": "TOOL_CALL",
            "intent": "查询用户风险画像",
            "toolName": "queryUserRisk"
        },
        {
            "type": "TOOL_CALL",
            "intent": "查询交易历史",
            "toolName": "queryTransactionHistory"
        },
        {
            "type": "DECISION",
            "intent": "综合评估风险等级"
        }
    ],
    "rca": {
        "symptom": "交易数据不完整",
        "cause": "API 限流导致数据截断",
        "fix": "换用全量数据源查询"
    }
}
```

#### PlanStep 类型：

![image-20260525112003012.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525112003012.png)
```json
{
    "state": "PLANNING",
    "note": "需要查询用户风险画像和交易历史来评估风险等级",
    "confidence": 7,
    "planSteps": [
        {
            "type": "TOOL_CALL",
            "intent": "查询用户风险画像",
            "toolName": "queryUserRisk"
        },
        {
            "type": "TOOL_CALL",
            "intent": "查询交易历史",
            "toolName": "queryTransactionHistory"
        },
        {
            "type": "DECISION",
            "intent": "综合评估风险等级"
        }
    ],
    "rca": {
        "symptom": "交易数据不完整",
        "cause": "API 限流导致数据截断",
        "fix": "换用全量数据源查询"
    }
}
```

| type | 含义 | toolName |
| ---- | ---- | -------- |
| TOOL_CALL | 需要调用工具 | 必填 |
| DECISION | 内部决策判断 | 不需要 |

#### 执行逻辑：
```java
@Override
public ToolExecuteResult<String> apply(RecordReflectionRequest request) {
    // 1. 从 AiInvokeContext 获取/初始化 taskList
    List<AgentTask> taskList = (List<AgentTask>) AiInvokeContext.current()
        .getOrDefault(AGENT_TASK_LIST, new ArrayList<>());
```

![image-20260525112003013.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525112003013.png)
| type | 含义 | toolName |
| ---- | ---- | -------- |
| TOOL_CALL | 需要调用工具 | 必填 |
| DECISION | 内部决策判断 | 不需要 |
| MILESTONE | 里程碑标记 | 不需要 |
| MESSAGE | 消息输出 | 不需要 |
| CHECKPOINT | 检查点 | 不需要 |
| WAIT | 等待外部 | 不需要 |

```java
@Override
public ToolExecuteResult<String> apply(RecordReflectionRequest request) {
    // 1. 从 AiInvokeContext 获取/初始化 taskList
    List<AgentTask> taskList = (List<AgentTask>) AiInvokeContext.current()
        .getOrDefault(AGENT_TASK_LIST, new ArrayList<>());

    // 2. 创建 AgentTask 记录
    AgentTask task = new AgentTask();
    if ("EXECUTING".equals(request.getState()) && CollectionUtils.isEmpty(request.getPlanSteps())) {
        // EXECUTING 且无新计划 → 简洁格式
        task.setContent("[" + request.getState() + "] " + request.getNote());
    } else {
        // 其他状态 → 完整 JSON
        task.setContent(JsonUtil.jacksonToJsonStringIgnoreNull(request));
    }

    // 3. 追加到 taskList
    taskList.add(task);
    AiInvokeContext.current().put(AGENT_TASK_LIST, taskList);

    // 4. 返回确认
    return ToolExecuteResult.success("已记录");
}
```

### 2.5 计划步骤提醒机制（Planned Reminder）
这是 ReflectToolAgent 最精巧的设计。

问题：LLM 在多轮对话中容易"忘记"之前制定的计划，尤其是上下文变长之后。

解决方案：在 Prompt 的消息列表中注入一条特殊的 `planned_reminder` 消息，包含待执行的步骤。每轮结束后更新这条消息（移除已执行的步骤），确保 LLM 始终能"看到"剩余计划。

![image-20260525112003014.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525112003014.png)
这是 ReflectToolAgent 最精巧的设计。

问题：LLM 在多轮对话中容易"忘记"之前制定的计划，尤其是上下文变长之后。

解决方案：在 Prompt 的消息列表中注入一条特殊的 `planned_reminder` 消息，包含待执行的步骤。每轮结束后更新这条消息（移除已执行的步骤），确保 LLM 始终能"看到"剩余计划。

#### Reminder 消息结构：
```json
{
    "description": "待执行的后续步骤",
    "steps": [
        { "type": "TOOL_CALL", "intent": "查询交易历史", "toolName": "queryTransactionHistory" },
        { "type": "DECISION", "intent": "综合评估风险等级" }
    ]
}
```

通过 message metadata `{ "planned_reminder": true }` 标识，方便查找和替换。

#### 三种处理分支（在 `updatePromptByAction()` 中）：
| 场景 | 条件 | 操作 |
| ---- | ---- | ---- |
| 新计划产生 | RecordReflection 返回了 planSteps<br>（PLANNING/REFLECTING/EVOLVING） | 删除所有旧 reminder → 创建新 reminder（移除已执行的步骤） |
| 消费已有计划 | 无新 planSteps，但存在旧 reminder（EXECUTING） | 从 reminder 中移除本轮已执行的工具 → 更新 reminder |
| 无操作 | 无 planSteps 且无 reminder | 跳过 |

#### 核心代码逻辑：
```java
// 解析 RecordReflection 返回的 planSteps
List<PlanStep> planSteps = parseNextStepsFromAction(toolUseAction);

if (planSteps != null && !planSteps.isEmpty()) {
    // Branch 1: 新计划 → 重置 reminder
    removePreviousPlannedReminder(messages); // 删除所有旧的
    Message reminder = createPlannedReminderMessage(planSteps, toolUseAction); // 创建新的
    if (reminder != null) messages.add(reminder);
} else {
    // Branch 2: 消费旧计划
    Message existingReminder = removePlannedReminder(messages); // 取出旧的
    if (existingReminder != null) {
        Message updatedReminder = consumePlannedSteps(existingReminder, toolUseAction); // 移除已执行步骤
        if (updatedReminder != null) messages.add(updatedReminder);
    }
}
```

![image-20260525112003015.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525112003015.png)
```json
{
    "description": "待执行的后续步骤",
    "steps": [
        { "type": "TOOL_CALL", "intent": "查询交易历史", "toolName": "queryTransactionHistory" },
        { "type": "DECISION", "intent": "综合评估风险等级" }
    ]
}
```

通过 message metadata `{ "planned_reminder": true }` 标识，方便查找和替换。

| 场景 | 条件 | 操作 |
| ---- | ---- | ---- |
| 新计划产生 | RecordReflection 返回了 planSteps<br>（PLANNING/REFLECTING/EVOLVING） | 删除所有旧 reminder → 创建新 reminder（移除已执行的步骤） |
| 消费已有计划 | 无新 planSteps，但存在旧 reminder（EXECUTING） | 从 reminder 中移除本轮已执行的工具 → 更新 reminder |
| 无操作 | 无 planSteps 且无 reminder | 跳过 |

```java
// 解析 RecordReflection 返回的 planSteps
List<PlanStep> planSteps = parseNextStepsFromAction(toolUseAction);

if (planSteps != null && !planSteps.isEmpty()) {
    // Branch 1: 新计划 → 重置 reminder
    removePreviousPlannedReminder(messages); // 删除所有旧的
    Message reminder = createPlannedReminderMessage(planSteps, toolUseAction); // 创建新的
    if (reminder != null) messages.add(reminder);
} else {
    // Branch 2: 消费旧计划
    Message existingReminder = removePlannedReminder(messages); // 取出旧的
    if (existingReminder != null) {
        Message updatedReminder = consumePlannedSteps(existingReminder, toolUseAction); // 移除已执行步骤
        if (updatedReminder != null) messages.add(updatedReminder);
    }
}
```

### 2.6 完整执行流程示例
```
──────────────────────────────────────────────────────
Round 1: PLANNING
──────────────────────────────────────────────────────

LLM 并行调用两个工具:
├─ RecordReflection({
│    state: "PLANNING",
│    note: "用户风险评估，需要查询画像和交易数据",
│    planSteps: [
│        { type: "TOOL_CALL", intent: "查询画像", toolName: "queryUserRisk" },
│        { type: "TOOL_CALL", intent: "查询交易", toolName: "queryTransactionHistory" },
│        { type: "DECISION", intent: "评估风险等级" }
│    ]
│  })
```

![image-20260525112003016.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525112003016.png)
```
──────────────────────────────────────────────────────
Round 1: PLANNING
──────────────────────────────────────────────────────

LLM 并行调用两个工具:
├─ RecordReflection({
│    state: "PLANNING",
│    note: "用户风险评估，需要查询画像和交易数据",
│    planSteps: [
│        { type: "TOOL_CALL", intent: "查询画像", toolName: "queryUserRisk" },
│        { type: "TOOL_CALL", intent: "查询交易", toolName: "queryTransactionHistory" },
│        { type: "DECISION", intent: "评估风险等级" }
│    ]
│  })
└─ queryUserRisk({ userId: "U001" })

Prompt 更新:
├─ 添加 AssistantMessage (LLM 的 ToolCall 结构)
├─ 添加 ToolResponseMessage (两个工具的执行结果)
└─ 创建 planned_reminder:
   { steps: [查询交易, 评估风险] } ← 查询画像已执行，自动移除

──────────────────────────────────────────────────────
Round 2: EXECUTING
──────────────────────────────────────────────────────

LLM 看到 planned_reminder 中"查询交易"在第一位，继续执行:
├─ RecordReflection({
│    state: "EXECUTING",
│    note: "画像已获取，风险分数中等，继续查询交易数据"
│  }) ← 无 planSteps，表示计划不变
└─ queryTransactionHistory({ userId: "U001", months: 12 })

Prompt 更新:
├─ 无新 planSteps → 消费旧 reminder
└─ 从 reminder 中移除 "queryTransactionHistory"
```

![image-20260525112003017.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525112003017.png)
```
──────────────────────────────────────────────────────
Round 1: PLANNING
──────────────────────────────────────────────────────

LLM 并行调用两个工具:
├─ RecordReflection({
│    state: "PLANNING",
│    note: "用户风险评估，需要查询画像和交易数据",
│    planSteps: [
│        { type: "TOOL_CALL", intent: "查询画像", toolName: "queryUserRisk" },
│        { type: "TOOL_CALL", intent: "查询交易", toolName: "queryTransactionHistory" },
│        { type: "DECISION", intent: "评估风险等级" }
│    ]
│  })
└─ queryUserRisk({ userId: "U001" })

Prompt 更新:
├─ 添加 AssistantMessage (LLM 的 ToolCall 结构)
├─ 添加 ToolResponseMessage (两个工具的执行结果)
└─ 创建 planned_reminder:
   { steps: [查询交易, 评估风险] } ← 查询画像已执行，自动移除

──────────────────────────────────────────────────────
Round 2: EXECUTING
──────────────────────────────────────────────────────

LLM 看到 planned_reminder 中"查询交易"在第一位，继续执行:
├─ RecordReflection({
│    state: "EXECUTING",
│    note: "画像已获取，风险分数中等，继续查询交易数据"
│  }) ← 无 planSteps，表示计划不变
└─ queryTransactionHistory({ userId: "U001", months: 12 })

Prompt 更新:
├─ 无新 planSteps → 消费旧 reminder
└─ 从 reminder 中移除 "queryTransactionHistory"
```

![image-20260525112003018.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525112003018.png)
```
──────────────────────────────────────────────────────
Round 1: PLANNING
──────────────────────────────────────────────────────

LLM 并行调用两个工具:
├─ RecordReflection({
│    state: "PLANNING",
│    note: "用户风险评估，需要查询画像和交易数据",
│    planSteps: [
│        { type: "TOOL_CALL", intent: "查询画像", toolName: "queryUserRisk" },
│        { type: "TOOL_CALL", intent: "查询交易", toolName: "queryTransactionHistory" },
│        { type: "DECISION", intent: "评估风险等级" }
│    ]
│  })
└─ queryUserRisk({ userId: "U001" })

Prompt 更新:
├─ 添加 AssistantMessage (LLM 的 ToolCall 结构)
├─ 添加 ToolResponseMessage (两个工具的执行结果)
└─ 创建 planned_reminder:
   { steps: [查询交易, 评估风险] } ← 查询画像已执行，自动移除

──────────────────────────────────────────────────────
Round 2: EXECUTING
──────────────────────────────────────────────────────

LLM 看到 planned_reminder 中"查询交易"在第一位，继续执行:
├─ RecordReflection({
│    state: "EXECUTING",
│    note: "画像已获取，风险分数中等，继续查询交易数据"
│  }) ← 无 planSteps，表示计划不变
└─ queryTransactionHistory({ userId: "U001", months: 12 })

Prompt 更新:
├─ 无新 planSteps → 消费旧 reminder
└─ 从 reminder 中移除 "queryTransactionHistory"
```

![image-20260525112003019.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525112003019.png)

```
        note: "画像已获取，风险分数中等，继续查询交易数据"
    }) ← 无 planSteps，表示计划不变
    queryTransactionHistory({ userId: "U001", months: 12 })

Prompt 更新：
├─ 无新 planSteps → 消费旧 reminder
├─ 从 reminder 中移除 "queryTransactionHistory"
└─ 更新 planned_reminder:
     { steps: [评估风险] }   ← 只剩最后一步

────────────────────────────────────────────
Round 3: REFLECTING（发现异常）
────────────────────────────────────────────

LLM 发现交易数据不完整（只有 6 个月）：
├─ RecordReflection({
│      state: "REFLECTING",
│      note: "交易数据只覆盖 6 个月，不足以评估",
│      rca: {
│          symptom: "交易记录仅返回 180 条",
│          cause: "API 默认分页限制，未翻页",
│          fix: "使用反欺诈全量查询接口"
│      },
│      planSteps: [
│          { type: "TOOL_CALL", intent: "查询反欺诈记录", toolName: "queryFraudHistory" },
│          { type: "DECISION", intent: "基于完整数据重新评估" }
│      ]
│  })
└─ queryFraudHistory({ userId: "U001" })

Prompt 更新：
├─ 有新 planSteps → 策略重置！
├─ 删除所有旧 planned_reminder
└─ 创建新 planned_reminder:
     { steps: [重新评估] }   ← queryFraudHistory 已执行，只剩评估

────────────────────────────────────────────
Round 4: COMPLETED
────────────────────────────────────────────
```

![image-20260525112003020.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525112003020.png)

```
Prompt 更新：
├─ 有新 planSteps → 策略重置！
├─ 删除所有旧 planned_reminder
└─ 创建新 planned_reminder:
     { steps: [重新评估] }   ← queryFraudHistory 已执行，只剩评估

────────────────────────────────────────────
Round 4: COMPLETED
────────────────────────────────────────────

LLM 收集到全部信息，满足 R0 的 "信息足够" 条件：
└─ Final Answer: {
       "riskScore": 7.5,
       "riskLevel": "HIGH",
       "recommendation": "建议限制大额交易",
       "evidence": ["近 12 月存在 3 笔可疑交易", "反欺诈评分 78"]
   }

Agent 执行结束。
```

### 2.7 与 NativeToolCallsReactAgent 的对比

| 维度 | NativeToolCallsReactAgent | ReflectToolAgent |
|------|---------------------------|------------------|
| 工具调用方式 | 原生 function calling | 原生 function calling |
| 反思能力 | 无 | RecordReflection 工具 |
| 计划管理 | 隐式（LLM 内部记忆） | 显式（planSteps + planned_reminder） |
| 错误恢复 | 有限（靠 LLM 自行判断） | REFLECTING 状态 + RCA 根因分析 |
| 策略调整 | 无 | EVOLVING 状态，重新规划 |
| 决策追溯 | 无 | taskList 完整记录每轮决策 |
| Memory 压缩 | 支持 | 不支持（侧重反思机制） |

![image-20260525112003021.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525112003021.png)

```
Agent 执行结束。
```

| 维度 | NativeToolCallsReactAgent | ReflectToolAgent |
|------|---------------------------|------------------|
| 工具调用方式 | 原生 function calling | 原生 function calling |
| 反思能力 | 无 | RecordReflection 工具 |
| 计划管理 | 隐式（LLM 内部记忆） | 显式（planSteps + planned_reminder） |
| 错误恢复 | 有限（靠 LLM 自行判断） | REFLECTING 状态 + RCA 根因分析 |
| 策略调整 | 无 | EVOLVING 状态，重新规划 |
| 决策追溯 | 无 | taskList 完整记录每轮决策 |
| Memory 压缩 | 支持 | 不支持（侧重反思机制） |
| 额外开销 | 低 | 每轮多 1 次 RecordReflection 调用 |
| 适用场景 | 简单/中等复杂度的工具调用 | 复杂多步风控决策、需要可追溯性 |

### 2.8 为什么这个设计有效？

1. **防止空转**：R0 规则强制"要么调工具，要么给答案"，不允许"想了但什么都没做"
2. **防止只想不做**：R1 规则禁止单独调 RecordReflection，必须带业务工具
3. **防止遗忘计划**：planned_reminder 注入到 Prompt 中，LLM 每轮都能看到剩余步骤
4. **支持策略调整**：REFLECTING/EVOLVING 状态允许推翻旧计划、制定新计划
5. **完整可追溯**：RecordReflection 的 taskList 记录了完整的决策链路

### 2.9 关键源文件

![image-20260525112003022.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525112003022.png)

```
1. 防止空转：R0 规则强制"要么调工具，要么给答案"，不允许"想了但什么都没做"
2. 防止只想不做：R1 规则禁止单独调 RecordReflection，必须带业务工具
3. 防止遗忘计划：planned_reminder 注入到 Prompt 中，LLM 每轮都能看到剩余步骤
4. 支持策略调整：REFLECTING/EVOLVING 状态允许推翻旧计划、制定新计划
5. 完整可追溯：RecordReflection 的 taskList 记录了完整的决策链路
```

| 文件 | 路径 | 作用 |
|------|------|------|
| ReflectToolAgent | biz/service/manager/agent/customeragent/ReflectToolAgent.java | 核心 Agent 实现 |
| ReflectToolAgentCreator | biz/service/manager/agent/creator/ReflectToolAgentCreator.java | Agent 创建器 |
| RecordReflectionTool | biz/service/manager/function/RecordReflectionTool.java | 反思记录工具 |
| RecordReflectionRequest | biz/service/manager/function/request/RecordReflectionRequest.java | 输入 Schema |
| NativeToolCallsReactAgent | biz/service/manager/agent/customeragent/NativeToolCallsReactAgent.java | 原生工具调用（对比） |
| StreamOutputConverter | biz/service/manager/agent/output/StreamOutputConverter.java | 非原生 ReAct 解析器 |
| ReactJsonConverter | biz/service/manager/agent/output/ReactJsonConverter.java | 非原生 JSON 解析器 |
| AgentTypeEnum | facade/enums/AgentTypeEnum.java | Agent 类型枚举定义 |

## 引用
