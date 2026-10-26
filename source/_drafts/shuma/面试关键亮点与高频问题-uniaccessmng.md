---
layout: false
---

# 面试关键亮点与高频问题 — uniaccessmng

## 一句话介绍项目
> "统一准入管理平台，基于 SOFABoot 4.3 + Java 21，负责风险事件全生命周期管理、告警任务自动化、催办场景编排，对接 10+ 外部系统，使用 ZDAL + GeaBase + HA3 三数据源混合架构，自研规则引擎 + 三套状态机 + Serverless 分布式调度。"

## 核心技术亮点（面试加分项）

### 1. 自研规则引擎（200 行核心代码）
- LogicComputeUtil + ComputeInterface 策略模式 + CompareFactory 工厂
- 栈式布尔表达式求值器（支持 AND/OR/NOT/括号，运算符优先级）
- 13 种比较算子零侵入扩展
- 三级场景匹配算法（高匹配 > 默认 > 通用匹配）
- **面试话术**："不是引入 Drools 重型框架，而是 200 行核心代码覆盖所有需求"

### 2. 三套状态机 + 混合锁策略
- UrgeScene（6 态）、WarningRule（5 态）、UrgeRule（4 态）
- 乐观锁守卫状态流转（WHERE id + status + version）
- 悲观锁保护版本递增（FOR UPDATE NOWAIT）
- 上线/下线事务原子性
- **面试话术**："NOWAIT 是快速失败哲学——宁可重试也不阻塞"

### 3. Serverless 三阶段流水线
- Split（去重分片）→ Load（加载数据）→ Execute（创建任务）
- 双规则引擎：超时规则 + 驳回规则（6 种阈值比较符）
- 事务内创建任务+通知，事务后异步外呼
- **面试话术**："AntScheduler 天然支持分布式并行，多节点不重复执行"

### 4. SOFAMQ 事务性消息 + 幂等消费
- @MsgBrokerTransactionalPublisher + @TransactionChecker
- MessageRecord 表 bizId+bizType 唯一键去重
- 双超时时间计算：绝对时间 + 仅工作时间
- **面试话术**："事务性发布保证消息不丢，幂等表保证不重复处理"

### 5. 三数据源混合架构
- OceanBase（ZDAL）+ GeaBase（GQL）+ HA3（QRS/SQL 双模式）
- HA3 DRM 降级开关，不可用切数据库直查
- 业务层聚合，Facade 接口透明
- **面试话术**："三种查询语言完全不同，业务层做聚合组装"

### 6. DRM 运行时动态配置 + 远程命令
- 7 个 DRM 资源类，50+ 参数热更新
- BackgroundDrmConsole 远程命令执行（@AfterUpdate 回调）
- JSON 解析容错，缓存联动失效
- **面试话术**："不用重启就能调整所有阈值和开关，甚至能远程执行修复命令"

### 7. 通知可靠性三层保障
- 双调度：正常发送 + 失败重试（每 5 秒）
- 钉钉双通道：个人消息 + 群消息
- 悲观锁：FOR UPDATE 锁定通知记录
- **面试话术**："三层保障确保合规告警不遗漏"

### 8. 复杂 SQL 与反范式设计
- 5 表 JOIN + 3 聚合子查询（解决方案配置查询）
- SQL 原子操作：total+1 + CONCAT 追加 ID
- 反范式权衡：relative_task_ids 逗号拼接
- **面试话术**："单条 UPDATE 避免读-改-写竞态，反范式适合只追加不修改的场景"

## 高频面试问题准备

### Q1: 规则引擎为什么自研不用 Drools？
**A**: 三个原因：(1) 我们的规则场景简单——13 种比较算子 + 逻辑表达式，Drools 的推理链和 Rete 算法是杀鸡用牛刀；(2) 自研引擎 200 行核心代码，新增算子只需实现 ComputeInterface + 注册到包，零侵入；(3) DRM 天然支持热更新，规则变更即时生效，Drools 的规则文件管理反而更重。

### Q2: FOR UPDATE NOWAIT 和普通 FOR UPDATE 怎么选？
**A**: NOWAIT 是"快速失败"策略。风控场景用户操作失败可以重试，但请求阻塞会影响链路响应时间。版本号递增用 NOWAIT 因为并发低、冲突少；通知状态更新用普通 FOR UPDATE 因为并发高、需要排队。

### Q3: 催办场景的三级匹配算法怎么设计的？
**A**: `computeScene()` 方法三层筛选：第一级高匹配——解决方案配置的审核项与事件特征项通过 LogicComputeUtil 全部匹配；第二级默认——solutionId="DEFAULT" 的场景；第三级通用匹配——解决方案未配置审核项的场景。优先级高匹配 > 默认 > 通用匹配，保证最精准的场景总是被选中。

### Q4: SOFAMQ 事务性发布怎么实现的？
**A**: @MsgBrokerTransactionalPublisher 在事务内调用 publicUniformEvent，框架将消息暂存，事务提交后才真正发送。@TransactionChecker 回调查数据库验证——查 UaEventProblemCodeRelation 记录是否存在，存在说明事务已提交，确认发送；不存在说明事务回滚，取消发送。

### Q5: 告警规则去重怎么做的？
**A**: 两层去重：第一层 RuleExecuteRecord 表记录每次规则执行，同一规则同一统计周期不重复执行；第二层 WarningRule 审核时有 ruleDuplicationCheck()，检查是否已存在相同 solutionId+eventCode+targetType+propertyCode+conditionRule 的 ONLINE 规则。

### Q6: GeaBase 图查询和 OceanBase 关系查询怎么配合？
**A**: 两种数据源独立查询，业务层组装。GeaBase 用 GQL MATCH 模式遍历实体关系（如 TinyApp→Z97Mrch），OceanBase 用 MyBatis SQL 查事件详情。EntityGraphFacade 暴露图查询服务，UaEventComponent 在业务层合并两种数据。GraphDRM 动态配置图查询参数，查询条件变更无需改代码。

### Q7: BackgroundDrmConsole 远程命令执行安全吗？
**A**: 四层防护：(1) DRM 推送有权限控制，只有运维能操作；(2) 命令对象必须实现 BaseCommand 接口；(3) backGroundExecutor 线程池异步执行，不阻塞主流程；(4) 支持压测模式切换，灰度验证后才全量推送。目前支持的命令是 ProblemEventPublishCommand（事件-问题码绑定消息重发）。

### Q8: 驳回统计的原子递增为什么不用分布式锁？
**A**: 因为 `UPDATE ... SET total = total + 1, relative_task_ids = CONCAT(...)` 是 SQL 原子操作，数据库行锁保证了并发安全，不需要额外的分布式锁。如果影响行数为 0 说明记录不存在，再 INSERT 新记录，这是 upsert 模式。

## 数字化亮点（面试加分）
- 27 个数据表，10+ 外部系统集成
- 3 套状态机（6+5+4=15 种状态），乐观锁+悲观锁混合策略
- 13 种比较算子 + 栈式表达式求值器
- 7 个 DRM 资源类，50+ 参数热更新
- 3 种数据源混合（OceanBase + GeaBase + HA3）
- 6 个 AntScheduler 定时任务（3 个 Serverless 三阶段流水线）
- 8+ Mapper 使用 FOR UPDATE NOWAIT 悲观锁
- 5 表 JOIN + 3 聚合子查询（最复杂 SQL）
- SOFAMQ 4 个消费订阅 + 1 个事务性发布

## 项目架构深度关键词（面试展开用）
- **SOFABoot 半闭源模块化**：Facade → Web/RPC → Biz Service → Core Service → DAL
- **ZDAL 序列号生成**：ADVANCED-RULE `{systemDate=8}{eDSID=2}{sequenceValue=8}` 支持弹性扩容
- **MapStruct 编译期类型安全转换**：DO ↔ Model 零手工代码
- **ServiceTemplate 模板方法**：checkParams → executeService → afterService + 压测模式支持
- **SalDigestLogAspect AOP**：自动记录所有 Integration 包下的调用摘要
- **Caffeine 自动刷新缓存**：maximumSize + refreshAfterWrite + expireAfterAccess
- **LDC Zone 路由**：GZoneGeneratorImpl 实现跨 zone 路由映射
