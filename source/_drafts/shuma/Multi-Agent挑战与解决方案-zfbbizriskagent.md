---
original_dir: Multi-Agent挑战与解决方案-zfbbizriskagent
---

## 目录

- [挑战 1：DAG 动态编排与条件路由](#挑战-1dag-动态编排与条件路由)
- [挑战 2：子 Agent 上下文隔离与传递](#挑战-2子-agent-上下文隔离与传递)
- [挑战 3：防止循环引用 & 执行超时](#挑战-3防止循环引用--执行超时)
- [挑战 4：多角色 Agent 的输出格式统一](#挑战-4多角色-agent-的输出格式统一)
- [总结](#总结)
- [引用](#引用)

---

> 自动生成：5 张图，由多模态模型 `doubao-seed-2.0-pro` 一次性识别转写。

![image-20260525104900001.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525104900001.png)

# Multi-Agent 实践中的挑战与解决方案 - zfbbizriskagent

支付宝业务风险智能体平台中 Multi-Agent 编排的实际挑战与解决手段。结合代码分析。

## 挑战 1：DAG 动态编排与条件路由

**问题**：Multi-Agent 不是简单的顺序调用。前端配置的 DAG 图有节点（Nodes）和边（Edges），每条边可能带条件脚本——子 Agent 执行完后，需要根据输出动态决定下一步路由到谁。

**解决方案**：

- **Groovy 脚本引擎** 做条件路由，支持业务方自定义路由逻辑（`MultiAgentCreator.java L135-156`）
- **Caffeine** 缓存 编译后的 Groovy Class（MD5 做 key，最大 1000 条，1 天过期），避免重复编译
- **defaultNode 兜底**——脚本执行异常时走默认路由，保证流程不卡死
- **编译优化**：启用 `invokedynamic` + 禁用 `groovydoc`，提升脚本执行性能

```java
// 条件路由核心逻辑
multiAgentBuilder.addConditionalEdge(edge.getStartNode(), output -> {
    Script groovyScript = (Script) scriptClass.newInstance();
    groovyScript.setBinding(binding);
    Object result = groovyScript.run();
    return result != null ? List.of(result.toString()) : List.of(edge.getDefaultNode());
```

![image-20260525104900002.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525104900002.png)

```java
- **Groovy 脚本引擎** 做条件路由，支持业务方自定义路由逻辑（`MultiAgentCreator.java L135-156`）
- **Caffeine** 缓存 编译后的 Groovy Class（MD5 做 key，最大 1000 条，1 天过期），避免重复编译
- **defaultNode 兜底**——脚本执行异常时走默认路由，保证流程不卡死
- **编译优化**：启用 `invokedynamic` + 禁用 `groovydoc`，提升脚本执行性能
```

```java
// 条件路由核心逻辑
multiAgentBuilder.addConditionalEdge(edge.getStartNode(), output -> {
    Script groovyScript = (Script) scriptClass.newInstance();
    groovyScript.setBinding(binding);
    Object result = groovyScript.run();
    return result != null ? List.of(result.toString()) : List.of(edge.getDefaultNode());
}, targetNodes);
```

## 挑战 2：子 Agent 上下文隔离与传递

**问题**：Multi-Agent 中父 Agent 调用子 Agent，两者共享同一个大模型调用。但子 Agent 需要独立的 Task 记录、prompt、执行上下文。直接复用父的 `BizRiskAgentContext` 会导致：

- 子 Agent 的输出污染父 Agent 的 `runtimeVariables`
- Task 状态串（父子共用同一个 taskId）
- Prompt 模板覆盖（子的 prompt 替换了父的）

**解决方案**：

- 深拷贝上下文（`BeanUtil.copyBean`），父子各自持有独立的 `BizRiskAgentContext`
- `parentTaskId` 链 保留调用层级，方便问题追踪
- `taskId = null` 让子 Agent 走独立 Task 生命周期
- 通过 `AbstractRoleProcessor.updatePromptVariables()` 统一管理 prompt 变量的跨 Agent 传递

```java
// ExpertsTool.java L74-79
BizRiskAgentContext context = BeanUtil.copyBean(bizRiskAgentContext, BizRiskAgentContext.class);
```

![image-20260525104900003.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525104900003.png)

- 深拷贝上下文（`BeanUtil.copyBean`），父子各自持有独立的 `BizRiskAgentContext`
- `parentTaskId` 链 保留调用层级，方便问题追踪
- `taskId = null` 让子 Agent 走独立 Task 生命周期
- 通过 `AbstractRoleProcessor.updatePromptVariables()` 统一管理 prompt 变量的跨 Agent 传递

```java
// ExpertsTool.java L74-79
BizRiskAgentContext context = BeanUtil.copyBean(bizRiskAgentContext, BizRiskAgentContext.class);
context.setAgentMeta(agentMeta);
context.setParentTaskId(context.getTaskId()); // 保留父子关系
context.setTaskId(null);                       // 子 Agent 创建新 Task
```

## 挑战 3：防止循环引用 & 执行超时

**问题**：在 DAG 图中，用户可能误配置——子节点的 `agentCode` 等于父 Agent 的 `agentCode`，形成循环调用，导致无限递归。

**解决方案**：

- **创建时校验**：`MultiAgentCreator.create()` 中检测循环引用，直接抛 `BizException` 阻断
- **超时兜底**：子 Agent 提交到线程池后，`Future.get(maxExecutorTime, SECONDS)` 硬限时，单个子 Agent 卡死不会拖垮整个父 Agent

```java
// MultiAgentCreator.java L98-101
if (item.getAgentCode().equals(meta.getAgentCode())){
    throw new BizException(ErrorCodeEnum.BIZ_ERROR,
        "agentMeta not found,agentCode=" + item.getAgentCode());
}
```

## 挑战 4：多角色 Agent 的输出格式统一

![image-20260525104900004.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525104900004.png)

**问题**：Multi-Agent 场景有 **Planner**（规划）、**Reasoner**（推理）、**Supervisor**（监督）三种角色，输出格式各不相同。父 Agent 需要从任意子 Agent 的输出中提取结构化数据注入后续的 `runtimeVariables`。

**解决方案**：

- **OutputTemplate + JSON 解析**：每个 Agent 配置 `outputTemplate`，定义输出字段的 JSON Schema
- `AbstractRoleProcessor.postProcess()` 统一解析：子 Agent 输出 → `JSON.parseObject` → 按 `outputTemplate.properties` 提取字段 → 注入 `runtimeVariables`
- **Reasoner 特殊处理**：`ReasonerRoleProcessor` 覆盖 `postProcess` 为空，推理角色不需要格式化提取

```java
// AbstractRoleProcessor.java L96-131 — 输出格式统一
JSONObject agentOutputJson = JSON.parseObject(agentOutput);
for (Map.Entry<String, OutputTemplate> entry : properties.entrySet()) {
    Object value = agentOutputJson.getOrDefault(key, fieldTemplate.getDefaultValue());
    runtimeVariables.put(key, value);
}
```

## 总结

| 挑战 | 核心手段 |
|------|---------|
| DAG 动态路由 | Groovy 脚本 + Caffeine 缓存 + defaultNode 兜底 |
| 上下文隔离 | `BeanUtil.copyBean` 深拷贝 + parentTaskId 链 |
| 循环引用 | 创建时校验 + Future 超时限时 |
| 输出统一 | OutputTemplate + JSON 解析 + RoleProcessor 差异化 |

面试时选 1-2 个讲透即可，建议重点讲 DAG 动态路由 和 上下文隔离，最能体现分布式 Agent 编排的复杂度。

![image-20260525104900005.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525104900005.png)

**问题**：Multi-Agent 场景有 **Planner**（规划）、**Reasoner**（推理）、**Supervisor**（监督）三种角色，输出格式各不相同。父 Agent 需要从任意子 Agent 的输出中提取结构化数据注入后续的 `runtimeVariables`。

**解决方案**：

- **OutputTemplate + JSON 解析**：每个 Agent 配置 `outputTemplate`，定义输出字段的 JSON Schema
- `AbstractRoleProcessor.postProcess()` 统一解析：子 Agent 输出 → `JSON.parseObject` → 按 `outputTemplate.properties` 提取字段 → 注入 `runtimeVariables`
- **Reasoner 特殊处理**：`ReasonerRoleProcessor` 覆盖 `postProcess` 为空，推理角色不需要格式化提取

```java
// AbstractRoleProcessor.java L96-131 — 输出格式统一
JSONObject agentOutputJson = JSON.parseObject(agentOutput);
for (Map.Entry<String, OutputTemplate> entry : properties.entrySet()) {
    Object value = agentOutputJson.getOrDefault(key, fieldTemplate.getDefaultValue());
    runtimeVariables.put(key, value);
}
```

| 挑战 | 核心手段 |
|------|---------|
| DAG 动态路由 | Groovy 脚本 + Caffeine 缓存 + defaultNode 兜底 |
| 上下文隔离 | `BeanUtil.copyBean` 深拷贝 + parentTaskId 链 |
| 循环引用 | 创建时校验 + Future 超时限时 |
| 输出统一 | OutputTemplate + JSON 解析 + RoleProcessor 差异化 |

> 面试时选 1-2 个讲透即可，建议重点讲 DAG 动态路由 和 上下文隔离，最能体现分布式 Agent 编排的复杂度。

## 引用
