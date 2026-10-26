---
layout: false
---

# 统一接入检测与统一咨询 — 架构与业务挑战 + STDR面试宝典

> 项目: appxrisk (支付宝小程序风控平台)
> 负责模块: 统一接入检测 (UnifyAccess Check) + 统一咨询 (UnifyAccess Consult)
> 日期: 2026-05-22

---

## 一、模块全景

### 1.1 统一接入检测 (UnifyAccess Check)

**定位**: 小程序/商户准入的统一检测入口，覆盖入驻审核、商品审核、服务审核、广告审核等场景，是风控决策引擎的前置编排层。

**核心流程**:
```
提交检测 → 幂等校验 → 免审判断 → 决策引擎调用 → 结果回调 → 消息通知
                                    ↓
                              同步返回(直接完结)
                              异步返回CC(审核中) → 人工审核 → 催审 → 结果回调
```

**关键接口** (UnifyAccessCheckFacade):
| 接口 | 功能 |
|------|------|
| `unifyAccessCheck` | 提交检测 |
| `cancelCheck` | 撤销检测 |
| `urgeCheck` | 催审 |
| `queryCheckPriority` | 查询优先级 |
| `pageQueryTaskInfo` | 分页查询(千鲟+DB) |
| `queryResultByEventCodeAndOutBizNo` | 查询检测结果 |

**数据表**:
- `unify_access_check_task` — 核心检测任务表
- `unify_access_urge_record` — 催审记录表
- `unify_access_appeal_task` — 申诉任务表

**状态机**:
```
INIT → AUDIT_PROCESSING → AUDIT_PASS / AUDIT_REJECT / CLOSE
                    ↘ CANCELED (撤销)
```

### 1.2 统一咨询 (UnifyAccess Consult)

**定位**: 多租户、可配置的风险咨询框架，实时查询"主体能否做某事"，不产生工单，是检测能力的聚合查询层。

**核心流程**:
```
咨询请求 → 渠道+场景查DRM配置 → 并行执行前置处理器 → 并行执行咨询处理器 → 聚合结果 → 拼接申诉URL
```

**关键接口** (UnifyAccessConsultFacade):
| 接口 | 功能 |
|------|------|
| `unifyAccessConsult` | 单场景咨询 |
| `unifyAccessBatchConsult` | 批量场景咨询 |
| `unifyAccessRuleConsult` | 单规则咨询 |

**结果码体系**:
| 码 | 含义 | 层级 |
|----|------|------|
| PASS | 全部通过 | 主结果 |
| REJECT | 任一不通过 | 主结果 |
| FAILED | RPC失败且无驳回 | 主结果 |
| INVALID | 未生效 | 规则级 |
| AUDITING | 审核中 | 规则级 |
| AUDIT_REJECT | 审核驳回 | 规则级 |
| AUDIT_PASS | 审核通过(待生效) | 规则级 |
| VALID | 已生效 | 规则级 |
| UNKNOWN | 未知/RPC失败 | 规则级 |

### 1.3 Check vs Consult 对比

| 维度 | 检测(Check) | 咨询(Consult) |
|------|------------|---------------|
| 目的 | 提交审核，产生工单 | 实时查询，不产生工单 |
| 是否落库 | 是 | 否(可选缓存) |
| 是否调决策引擎 | 是 | 部分是(UnifySyncCheckProcessor) |
| 结果返回 | 同步/异步(CC) | 实时 |
| 处理模式 | 单一主流程 | 策略模式: 多处理器并行编排 |
| 消息通知 | 是(3种事件) | 否 |
| 催审/撤销 | 支持 | 不支持 |
| 申诉 | 支持 | 仅拼接申诉URL |

---

## 二、架构维度挑战

### 挑战1: God-Class膨胀 — UnifyAccessTaskServiceImpl 2408行

**现状**: 123个方法，混合8+种职责: 任务提交、手动处理、催审、消息推送、查询、校验、模型转换、规则执行。12个SofaReference注入。

**根因**:
- 检测流程本身生命周期长(提交→决策→回调→催审→申诉)，每个阶段的方法自然聚集
- 催审逻辑包含新旧两套路径(Groovy脚本 vs uniaccessmng服务)，双轨并存增加复杂度
- 消息发送3种事件码+条件分支+超长兜底逻辑，难以独立抽取

**影响**:
- 新人理解成本极高，修改一处需理解整个2400行上下文
- 测试困难，无法对单个职责单元做独立测试
- 合并冲突频繁

**改进方向**:
| 拆分组件 | 职责 | 方法数(估) |
|----------|------|-----------|
| UnifyAccessSubmitComponent | 任务提交+免审判断+决策引擎调用 | ~15 |
| UnifyAccessManualComponent | 人工处理+关闭+重新提交 | ~8 |
| UnifyAccessUrgeComponent | 催审逻辑(新旧双轨) | ~12 |
| UnifyAccessMessageComponent | 消息发送(3种事件+appxrisk广播) | ~6 |
| UnifyAccessQueryComponent | 查询方法(千鲟+DB) | ~8 |
| UnifyAccessValidateComponent | 校验+规则计算+Groovy脚本 | ~10 |

---

### 挑战2: 外部服务强耦合 — 25+ RPC客户端无熔断

**现状**: biz/unify模块直接注入25+个外部RPC客户端，每个ConsultProcessor本质是一个RPC调用的包装器。检测流程同步调用决策引擎，咨询流程并行调用多个下游。

**根因**:
- SOFA RPC框架内置超时/重试，团队依赖框架级保护
- 咨询处理器2秒超时是唯一的"弱熔断"，但只是跳过失败处理器，不是真正的熔断
- 检测流程对决策引擎的调用是完全同步的，下游慢直接阻塞

**影响**:
- 任一下游服务抖动影响整个咨询/检测链路
- 2秒超时内，一个慢处理器会拖慢整个咨询请求
- 无降级策略: 咨询失败返回FAILED，但检测失败直接影响商户入驻

**改进方向**:
- 引入Sentinel对关键下游(决策引擎、类目服务、签约产品)加熔断降级
- 咨询处理器增加单个处理器超时(当前是allFuture整体2秒超时)
- 检测流程增加决策引擎降级: 超时后返回CC(审核中)而非直接失败

---

### 挑战3: DRM配置驱动 — 运维灵活性与复杂度的双刃剑

**现状**: 3个DRM类控制统一接入行为:
- `UnifyCheckDrm`(639行): 催审配置(Groovy脚本)、免审名单、消息开关、事件码映射
- `UnifyConsultDrm`: 场景→处理器映射(19个场景×12个渠道)、申诉URL映射
- `UnifyRuleDrm`(844行): 场景→解决方案/产品/插件映射

**根因**:
- DRM是Ant体系标准动态配置方式，支持运行时变更不重启
- 业务场景快速扩展(从7个到19个)，每个新场景只需加DRM配置而无需改代码

**影响**:
- 催审规则用Groovy脚本执行，DRM配置错误可能导致脚本执行异常
- 场景→处理器映射完全在DRM中，代码中看不到完整路由逻辑
- 三个DRM类之间有隐含依赖(如催审旧路径引用UnifyCheckDrm的Groovy脚本，新路径引用UrgeSceneFacadeClient)

**改进方向**:
- 催审Groovy脚本迁移到LogicComputeUtil表达式引擎(新路径已在做)
- 场景→处理器映射可视化(管理后台配置+代码生成)
- DRM配置变更增加灰度+回滚机制

---

### 挑战4: 咨询处理器编排 — 并发模型与结果聚合

**现状**: `ConsultServiceImpl.executeProcessor()`使用CompletableFuture并行执行所有处理器，2秒整体超时。

**具体问题**:
1. **超时粒度粗**: 2秒是所有处理器的总超时，一个慢处理器(如签约产品查询800ms)会压缩其他处理器的执行时间
2. **取消不彻底**: `Future.cancel(true)`只是设置中断标志，如果处理器内部不响应中断，线程不会真正停止
3. **结果聚合语义模糊**: "全部RPC成功+全部通过=PASS" vs "有RPC失败+任一不通过=REJECT"，FAILED和REJECT的优先级关系不直观
4. **缓存穿透风险**: `AbstractConsultProcessor`的缓存查DB，高并发下可能穿透

**改进方向**:
- 每个处理器独立超时(如500ms/800ms/1000ms按下游SLA分级)
- 结果聚合语义用枚举明确: PASS > REJECT > FAILED > UNKNOWN
- 缓存增加空值标记防止穿透

---

### 挑战5: 催审双轨逻辑 — 新旧路径并存

**现状**: 催审存在两套逻辑:
- **旧路径**: DRM配置Groovy脚本规则，本地执行`executeRule()`校验催审次数+时间+自定义规则
- **新路径**: `urgeSwitchConfigStr=on`时，调uniaccessmng服务获取催审场景配置，用`LogicComputeUtil`计算规则

**根因**: 逐步迁移到统一催审管理服务，但旧路径尚未完全下线

**影响**:
- 同一功能两套实现，维护成本翻倍
- Groovy脚本在DRM中动态执行，调试困难
- 切流开关`urgeSwitchConfigStr`只有on/off，缺乏灰度能力

**改进方向**:
- 加速旧路径下线，催审规则统一到uniaccessmng
- 切流改为灰度比例(如10%→50%→100%)

---
## 三、业务维度挑战

### 挑战6: 多场景适配 — 19个业务场景×12个渠道

**现状**: 咨询系统通过`channelCode + "__" + bizScene`组合驱动处理器路由，当前支持19个场景和12个渠道。

**典型场景映射**:
| 场景 | 处理器组合 |
|------|-----------|
| ENTRY__ECOMMERCE | oidRegisterCheck + categoryContainsPassedAuditItem + signUpRequiredProductsOpenCheck + paymentCollectionFeatureOpenCheck |
| ENTRY__LOCAL_LIFE | 上面的 + containsValidStore |
| BIZ_MAP__LOCAL_LIFE | oidToPidPreProcessor + jsApiCheck + huitweebaoCheck + paydepositCheck |
| PAYMENT__PAYMENT | mccCategoryCheck + signUpRequiredProductsOpenCheck |

**业务挑战**:
1. **场景膨胀**: 每新增一个场景，需要: (1)加DRM配置 (2)可能开发新处理器 (3)测试所有组合路径
2. **处理器复用vs专用的权衡**: 通用处理器(如oidRegisterCheck)被多个场景共用，修改一处影响所有场景
3. **场景交叉**: 同一商户可能同时触发多个场景(如入驻+开通支付)，批量咨询`batchConsult`需去重处理器避免重复调用

**改进方向**:
- 处理器增加版本号，新场景用新版本，旧场景不升级
- 批量咨询去重逻辑已实现(batchConsultCommon)，但可进一步优化为处理器级去重

---

### 挑战7: 检测全生命周期管理 — 从提交到申诉的闭环

**现状**: 检测流程覆盖完整生命周期，但各环节的异常处理不统一:

| 环节 | 异常处理 |
|------|---------|
| 提交 | 幂等校验+事件码校验+特征值数量限制 |
| 决策引擎调用 | 不可重试异常→自动关单`autoCloseUnRetryableTask()` |
| 异步回调 | 悲观锁+幂等+事务内发消息(失败回滚) |
| 催审 | 新旧双轨+Groovy脚本+次数限制 |
| 撤销 | 状态校验+appName匹配+调决策引擎cancelCheck |
| 申诉 | 幂等校验+提交决策引擎+结果回调+消息通知 |
| 消息发送 | 超长兜底(IS_REVERSE_CHECK_RESULT标记)+条件性发appxrisk消息 |

**关键风险**:
1. **异步回调并发**: `updateTaskResultByBizRiskIde()`使用悲观锁+二次校验，但锁粒度是taskId，如果决策引擎重复回调，可能造成数据不一致
2. **消息发送与事务**: 消息发送在事务内，失败回滚整个结果更新 — 如果消息中间件抖动，会导致决策结果无法持久化
3. **子任务机制**: 决策引擎可返回子事件检测结果，创建子任务(parentTaskId关联)，但子任务的状态流转与主任务的关联逻辑分散在多处

---

### 挑战8: 免审与灰度 — 运营灵活性带来的代码复杂度

**现状**:
- **免审逻辑**: `isItemSkip()`检查3个Caffeine缓存(appId免审/高优先/source免审，1分钟过期，最大10000条)，命中后直接PASS
- **灰度路由**: `UnifyCheckDrm.GrayConfig`支持3种模式(ONLINE/WHITE_LIST/GRAY)，按比例切流到新引擎
- **降级开关**: `IS_DEMOTION`配置为true时直接PASS跳过所有检查

**风险**:
1. Caffeine缓存1分钟过期，名单变更最多延迟1分钟生效
2. 灰度比例计算在内存中，多实例部署时各实例比例可能不均
3. 降级开关一刀切，无法按场景/事件码精细化降级

---

## 四、STDR面试宝典

> STDR法则: **S**ituation(背景) → **T**ask(任务) → **D**ifficulty(难点) → **R**esult(成果/行动)

---

### STDR-1: 统一接入检测 — 全生命周期编排

**Situation**: 支付宝小程序生态有数十种准入场景(入驻、商品、服务、广告等)，每种场景有不同的审核流程、催审规则、消息通知需求。此前各场景各自对接决策引擎，代码分散，重复逻辑多，运营配置不灵活。

**Task**: 设计统一接入检测系统，作为所有准入场景的统一入口，覆盖从提交到完结的完整生命周期，支持免审、催审、撤销、申诉等运营操作。

**Difficulty**:
1. 生命周期长(提交→决策→回调→催审→申诉)，状态机有6种状态，转换条件复杂
2. 决策引擎回调可能乱序到达，需要幂等+悲观锁保证数据一致
3. 消息发送3种事件码+条件分支+超长兜底，与事务耦合
4. 催审存在新旧双轨(Groovy脚本 vs uniaccessmng服务)，需平滑迁移
5. 免审/灰度/降级开关散落在流程各处，修改风险高

**Result**:
- 统一了12个渠道、19个场景的准入检测入口，消除了各场景的重复代码
- 异步回调用悲观锁+二次校验+事务保证数据一致性，线上零数据不一致
- 催审切流开关实现新旧路径灰度切换，逐步迁移到统一催审服务
- 免审Caffeine缓存(1分钟过期)实现毫秒级免审判断，每天拦截X%的无效送审
- **面试话术**: "我设计了统一接入检测系统，覆盖6种状态、支持免审/催审/撤销/申诉全生命周期，通过悲观锁+幂等保证异步回调一致性，支撑了12个渠道19个场景的准入检测"

---

### STDR-2: 统一咨询 — 多处理器并行编排框架

**Situation**: 商户在入驻、场景开通、经营地图等环节需要实时查询准入条件是否满足，此前各业务线各自调用不同的检查服务，没有统一的查询入口，调用方需要了解每个检查服务的接口和结果格式。

**Task**: 设计统一咨询框架，支持按渠道+场景动态编排多个检查处理器，实时返回每条规则的通过/拒绝/审核中状态，并为驳回结果自动拼接申诉URL。

**Difficulty**:
1. 不同检查处理器调用不同下游服务(OID状态、类目审核、签约产品、门店查询等)，响应时间差异大
2. 需要支持单场景咨询、批量场景咨询、单规则咨询三种模式，批量模式需去重处理器避免重复调用
3. 结果聚合语义复杂: 全部通过=PASS，任一拒绝=REJECT，RPC失败+无拒绝=FAILED，RPC失败+有拒绝=REJECT
4. 驳回时需要自动拼接申诉URL，申诉参数来自不同处理器的结果，链路长

**Result**:
- 设计了Processor + PreProcessor两层抽象，新增检查能力只需实现一个类+DRM配置
- CompletableFuture并行执行+2秒超时，单个处理器失败不影响整体结果
- `batchConsultCommon()`去重逻辑: 收集所有场景的处理器集合，只执行一次，结果按场景维度组装
- 驳回自动拼接申诉URL: 从`ConsultResult`→`CheckItemResult`→`AppealDetails`三级提取参数
- **面试话术**: "我设计了统一咨询的多处理器并行编排框架，CompletableFuture并发执行+超时隔离，支持3种咨询模式，新增检查能力只需1个类+DRM配置，支撑了19个业务场景的实时准入查询"

---

### STDR-3: 咨询与检测的桥接 — UnifySyncCheckProcessor

**Situation**: 咨询框架需要聚合多种检查能力，其中风险检查(决策引擎)是最核心的检查能力。但决策引擎的接口是检测模式(提交检测+异步回调)，不是查询模式(实时返回结果)。需要桥接两种模式。

**Task**: 在咨询处理器框架中桥接决策引擎，使咨询可以调用检测能力，同时不破坏咨询的实时性要求。
**Difficulty**:
1. 决策引擎是异步回调模式，咨询需要实时返回结果
2. 咨询处理器有2秒超时限制，决策引擎可能无法在2秒内完成
3. 风险检查结果需要映射到咨询结果码体系(PASS/REJECT/AUDITING等)

**Result**:
- `UnifySyncCheckProcessor`使用`riskCheckFacadeClient.submitCheck()`的**同步模式**调用决策引擎
- 决策引擎返回CC(审核中)时，映射为`AUDITING`; 返回PASS映射为`VALID`; 返回REJECT映射为`AUDIT_REJECT`
- 当RISK_CONSULT渠道没有配置处理器时，默认fallback到`unifySyncCheck`
- **面试话术**: "我设计了咨询与检测的桥接处理器，将决策引擎的异步回调模式适配为咨询的同步查询模式，通过结果码映射统一了两种体系，实现了咨询可以编排检测能力"

---

### STDR-4: 催审系统 — 新旧双轨平滑迁移

**Situation**: 催审功能原有实现使用Groovy脚本动态执行催审规则，规则存储在DRM配置中，调试困难、无法灰度、脚本异常影响线上。需要迁移到统一的催审管理服务(uniaccessmng)，但不能影响现有催审功能。

**Task**: 设计催审双轨方案，支持新旧路径并行运行，通过DRM开关灰度切换，最终完成旧路径下线。

**Difficulty**:
1. 旧路径Groovy脚本规则复杂: 最大催审次数+时间脚本+自定义规则组+启动时间校验，4层规则嵌套
2. 新路径(uniaccessmng)的规则模型与旧路径不同，需要保证迁移期间行为一致
3. 切流只有on/off，缺乏灰度能力
4. 催审记录表(`unify_access_urge_record`)需要兼容新旧两种路径的数据

**Result**:
- 设计了DRM开关`urgeSwitchConfigStr`控制新旧路径切换
- 旧路径: `queryUrgeCheck()` → DRM UrgeConfig → Groovy脚本规则校验
- 新路径: `urgeCheckFromMng()` → uniaccessmng场景配置 → LogicComputeUtil规则计算
- 催审记录表统一存储，`extInfo`字段记录催审上下文(URGE_CONTEXT/URGE_TIME/URGE_RESULT/URGE_REVIEWED_TIME)
- 催审执行: 调`riskCheckFacadeClient.urgeCheck()`发送催单到决策引擎
- **面试话术**: "我设计了催审双轨迁移方案，DRM开关控制新旧路径切换，旧路径Groovy脚本逐步替换为LogicComputeUtil表达式引擎，催审记录统一存储，实现了平滑迁移"

---

### STDR-5: 消息通知 — 3种事件码+超长兜底

**Situation**: 检测结果需要实时通知下游系统(商户入驻系统、审核中心等)，但不同场景对消息内容和格式要求不同，且消息中间件有payload大小限制。

**Task**: 设计消息通知机制，支持3种事件码(结果/创建/状态变更)+条件性appxrisk广播，并处理消息超长的情况。

**Difficulty**:
1. 3种事件码的触发条件不同: 结果消息只在检测完结时发，创建消息在任务创建时发(可关闭)，状态变更消息在撤销/免审/关单时发
2. appxrisk广播消息只在特定事件码(广告相关)下发
3. 消息payload有大小限制(由`ueDrm.getMsgBrokerPayloadMaxSize()`控制)，超长需要兜底
4. 消息发送在事务内，发送失败会回滚整个结果更新

**Result**:
- `sendTaskMessage()`统一处理3种事件码的消息发送
- 消息超长兜底: 检测JSON长度超过阈值时，设置`IS_REVERSE_CHECK_RESULT=true`标记，清空result体，下游收到后需反查
- appxrisk消息条件发送: 由DRM配置`sendAppxriskMsgEventCodeStr`控制哪些事件码需要广播
- 事务内发送保证一致性: 消息发送失败抛异常回滚，确保结果与消息不分离
- **面试话术**: "我设计了检测结果消息通知机制，支持3种事件码+条件性广播，消息超长时设置反查标记让下游主动查询，事务内发送保证结果与消息的一致性"

---

### STDR-6: 场景→处理器动态路由 — DRM驱动的可扩展架构

**Situation**: 咨询系统需要支持12个渠道×19个业务场景的组合，每种组合需要不同的检查处理器集合。新场景频繁增加(从7个到19个)，每次新增都需要代码改动+发布，迭代效率低。

**Task**: 设计场景→处理器的动态路由机制，让新场景的接入只需DRM配置变更，无需代码发布。

**Difficulty**:
1. 渠道×场景组合多(12×19=228种可能)，但实际有效的组合只有20+种
2. 不同场景需要不同的前置处理器(如BIZ_MAP场景需要OID转PID)和检查处理器
3. 处理器注册和发现需要在Spring容器启动时自动完成
4. 批量咨询需要跨场景去重处理器

**Result**:
- `ConsultProcessorFactory`在`afterPropertiesSet()`时自动扫描所有ConsultProcessor Bean，按processorCode注册到Map
- DRM配置`unifyConsultSceneProcessorMapStr`以`channelCode__bizScene`为key，配置preProcessorList和processorList
- 新场景接入: (1)定义场景枚举 (2)DRM配置处理器列表 (3)如需新处理器，实现ConsultProcessor接口
- 批量咨询`batchConsultCommon()`自动去重: 收集所有场景的处理器集合，只执行一次
- **面试话术**: "我设计了DRM驱动的场景→处理器动态路由架构，Spring容器自动扫描+注册处理器，DRM配置场景映射，新场景接入零代码发布，批量咨询自动去重处理器避免重复调用"

---

### STDR-7: 检测结果异步回调 — 悲观锁+幂等保证一致性

**Situation**: 检测提交到决策引擎后，结果通过异步回调返回。决策引擎可能重复回调(至少一次语义)，且回调可能乱序到达。如果并发处理不做保护，可能导致状态覆盖或数据不一致。

**Task**: 设计异步回调处理机制，保证在并发回调、重复回调、乱序回调场景下的数据一致性。

**Difficulty**:
1. 决策引擎至少一次语义: 同一结果可能回调多次
2. 回调可能乱序: 旧结果晚于新结果到达
3. 消息发送需要在事务内: 结果更新和消息发送必须原子性
4. 子任务机制: 决策引擎可返回子事件检测结果，需创建子任务

**Result**:
- `updateTaskResultByBizRiskIde()`实现三重保护:
    1. **幂等判断**: `validTask()`检查任务是否已完结
    2. **悲观锁**: `lockByTaskId()`锁定行记录
    3. **锁内二次校验**: 获取锁后再次`validTask()`防止并发窗口
- 事务模板: `TransactionTemplate`包裹结果更新+子任务写入+消息发送
- 消息发送失败抛异常回滚: 保证结果与消息的一致性
- 审计日志: `AuditLog.opLog("AUDIT")`记录状态变更
- **面试话术**: "我设计了检测结果异步回调机制，三重保护(幂等判断+悲观锁+锁内二次校验)保证并发回调一致性，事务内发送消息保证原子性，线上零数据不一致"
---

### STDR-8: God-Class治理 — UnifyAccessTaskServiceImpl拆分策略

**Situation**: `UnifyAccessTaskServiceImpl`膨胀到2408行、123个方法，混合了任务提交、手动处理、催审、消息推送、查询、校验、模型转换、规则执行等8+种职责。12个SofaReference注入，修改一处需理解整个文件。

**Task**: 制定拆分策略，在不影响线上运行的前提下，将God-Class拆分为职责清晰的组件。

**Difficulty**:
1. 123个方法间存在调用关系，不能简单按方法数切分
2. 12个SofaReference注入分散在各方法中，拆分后需处理依赖传递
3. 拆分过程中不能影响线上运行，需要渐进式重构
4. 催审逻辑新旧双轨交织，拆分时需要保持双轨的切换能力

**Result(策略)**:
- 按职责域拆分为6个组件: Submit(提交)、Manual(人工)、Urge(催审)、Message(消息)、Query(查询)、Validate(校验)
- 原Service保留编排逻辑，委托给各组件
- 渐进式重构: 先抽取最独立的Message和Query组件，再逐步抽取Urge和Validate
- 每次拆分后运行全量回归测试
- **面试话术**: "我制定了God-Class拆分策略，按职责域拆为6个组件，渐进式重构先抽最独立的Message和Query，原Service保留编排逻辑，每次拆分后全量回归"

---

## 五、架构关键模式速查

| 模式 | 应用位置 | 要点 |
|------|---------|------|
| ServiceTemplate | 所有Facade实现 | checkParams→executeService→afterService，统一异常处理 |
| Processor+PreProcessor | 咨询处理器框架 | 两层抽象+工厂自动注册+DRM路由 |
| CompletableFuture并发 | 咨询处理器执行 | 2秒超时+失败隔离+取消 |
| 悲观锁+幂等 | 异步回调 | validTask→lockByTaskId→validTask |
| 事务内消息 | 结果更新+消息发送 | TransactionTemplate+失败回滚 |
| DRM动态配置 | 场景路由/催审规则/免审名单 | 运行时变更不重启 |
| Caffeine缓存 | 免审/高优先级名单 | 1分钟过期，最大10000条 |
| Loader-Executor-Splitor | 调度任务 | INIT状态任务补偿重试 |
| 消息超长兜底 | 消息发送 | IS_REVERSE_CHECK_RESULT标记+下游反查 |
| 催审双轨 | 催审逻辑 | DRM开关+新旧路径并行 |

---

## 六、数据流全景

### 检测流程数据流
```
调用方(商户入驻/场景开通/...)
    │
    ▼
UnifyAccessCheckFacade.unifyAccessCheck()
    │ ServiceTemplate: checkParams → executeService
    ▼
UnifyAccessTaskServiceImpl.submitCheckTask()
    │ refillOid → 幂等校验 → bizCheckRequest → requestConvert2Model
    │ → insert(DB) → sendCreateMessage(MQ) → isItemSkip?
    │     YES → skipCheckProcess(AUDIT_PASS + MQ)
    │     NO  → submitBizRiskIdeCheckTask()
    ▼
RiskCheckFacadeClient.submitCheck() → 决策引擎
    │
    ├── 同步返回PASS/REJECT/CLOSE → 直接完结 + sendResultMessage(MQ)
    │
    └── 同步返回CC → AUDIT_PROCESSING → 等待异步回调
                            │
                            ▼
                updateTaskResultByBizRiskIde()
                  │ validTask → lockByTaskId → validTask
                  │ → 设状态+检测结果+完结时间
                  │ → 写子任务 → sendResultMessage(MQ)
                  │ → 审计日志
                  ▼
                下游系统收到MQ消息
```

### 咨询流程数据流
```
调用方(入驻前台/场景开通/经营地图/...)
    │
    ▼
UnifyAccessConsultFacade.unifyAccessConsult()
    │ ServiceTemplate: checkParams → checkChannel → checkBizScene
    ▼
ConsultServiceImpl.consult()
    │ getProcessorBySceneAndBizScene(DRM) → UnifyConsultSceneConfig
    │ buildConsultReq + buildConsultContext
    ▼
executePreProcessor() ── CompletableFuture并行 ── 2秒超时
    │ OidToPidPreProcessor
    │ OidToUidPreProcessor
    │ AppIdToServiceCodePreProcessor
    │ ListLibraryPreProcessor
    ▼ 结果合并到context.inputParamMap
executeProcessor() ── CompletableFuture并行 ── 2秒超时
    │ OidStatusCheckProcessor → OmifMerchantRoleQueryFacadeClient
    │ MainCategoryCheckProcessor → CategoryFacadeClient
    │ ContractedProductProcessor → OrderCoreBatchOrderQueryFacadeClient
    │ SolutionCheckProcessor → OrderCoreConsumerSolutionQueryFacadeClient
    │ QueryValidStoreProcessor → MrchprodLauncherShopQueryFacadeClient
    │ UnifySyncCheckProcessor → RiskCheckFacadeClient(决策引擎)
    │ ...
    ▼
buildConsultResult()
    │ 全部成功+全部通过 → PASS
    │ 全部成功+任一拒绝 → REJECT
    │ 有失败+全部通过 → FAILED
    │ 有失败+有拒绝 → REJECT(业务驳回优先)
    ▼
buildExtInfo() → REJECT时拼接申诉URL
    │ consultSceneCode2AppealMapping → appealURL
    │ targetId + targetType + args(riskCode + appealParam)
    ▼
返回UnifyConsultResult
```
