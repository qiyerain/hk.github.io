---
layout: false
---

# 可复用设计模式与架构

> 来源项目：bizriskide（风控决策引擎平台 · SOFABoot）

## 目录

- [一、整体架构与模块分层](#一整体架构与模块分层)
  - [1.1 多模块分层架构](#11-多模块分层架构)
- [二、核心设计模式](#二核心设计模式)
  - [2.1 三阶段处理器管线（Template Method + Pipeline）](#21-三阶段处理器管线template-method--pipeline)
  - [2.2 注解驱动的处理器I/O绑定](#22-注解驱动的处理器io绑定)
  - [2.3 工厂 + 策略模式（处理器调度）](#23-工厂--策略模式处理器调度)
  - [2.4 决策引擎（规则树 + 比较运算符）](#24-决策引擎规则树--比较运算符)
  - [2.5 HybridPE 流程引擎（DAG + 驱动模式）](#25-hybridpe-流程引擎dag--驱动模式)
  - [2.6 命令模式（控制操作）](#26-命令模式控制操作)
  - [2.7 CQRS（命令查询职责分离）](#27-cqrs命令查询职责分离)
- [三、数据模型设计模式](#三数据模型设计模式)
  - [3.1 extInfo 扩展字段模式](#31-extinfo-扩展字段模式)
  - [3.2 三层模型分离](#32-三层模型分离)
  - [3.3 枚举增强模式](#33-枚举增强模式)
- [四、基础设施组件](#四基础设施组件)
  - [4.1 ServiceTemplate + ServiceCallback（统一服务执行模板）](#41-servicetemplate--servicecallback统一服务执行模板)
  - [4.2 分层日志摘要（Digest Log）](#42-分层日志摘要digest-log)
  - [4.3 异常体系](#43-异常体系)
  - [4.4 Result\<T\> 统一返回](#44-resultt-统一返回)
  - [4.5 BizContext 请求上下文](#45-bizcontext-请求上下文)
  - [4.6 DRM 动态配置](#46-drm-动态配置)
  - [4.7 分布式锁](#47-分布式锁)
  - [4.8 ID 生成服务](#48-id-生成服务)
  - [4.9 事务性消息回调](#49-事务性消息回调)
  - [4.10 声明式参数校验](#410-声明式参数校验)
  - [4.11 SDK 本地缓存 + 降级模式](#411-sdk-本地缓存--降级模式)
  - [4.12 BusinessThreadLocal 请求上下文传递](#412-businessthreadlocal-请求上下文传递)
- [五、调度任务框架（Split-Load-Execute）](#五调度任务框架split-load-execute)
- [六、数据访问层模式](#六数据访问层模式)
  - [6.1 三层分离](#61-三层分离)
  - [6.2 双数据源配置](#62-双数据源配置)
  - [6.3 DAL 拦截器](#63-dal-拦截器)
  - [6.4 BizLogTransactionTemplate](#64-bizlogtransactiontemplate)
  - [6.5 Repository 抽象](#65-repository-抽象)
- [七、外部集成模式](#七外部集成模式)
  - [7.1 Client 接口 + 实现 分离](#71-client-接口--实现-分离)
  - [7.2 统一 SAL 拦截](#72-统一-sal-拦截)
  - [7.3 DRM 控制外部调用](#73-drm-控制外部调用)
- [八、环境配置与多环境管理](#八环境配置与多环境管理)
  - [8.1 六环境 Profile](#81-六环境-profile)
  - [8.2 日志分层](#82-日志分层)
- [九、ConvertUtil 注解驱动转换框架](#九convertutil-注解驱动转换框架)
- [十、最值得直接复用的 Top 10 设计](#十最值得直接复用的-top-10-设计)

---

## 一、整体架构与模块分层

### 1.1 多模块分层架构
```
app/
  bootstrap/       -- 启动入口，配置文件
  core/
    model/         -- 领域模型（纯POJO，不依赖Spring）
    service/       -- 领域服务（Repository抽象 + 业务编排）
  common/
    util/          -- 工具类、异常、日志、DRM、转换框架
    dal/           -- 数据访问层（DAO + DO + Query + SQL映射）
    service/
      facade/      -- 对外服务契约（接口 + DTO + 枚举）
      integration/ -- 外部系统集成（Client接口 + 实现）
      sdk/         -- 可复用SDK（带本地缓存和降级）
  biz/
    shared/        -- 共享业务组件（Component接口 + 实现）
    service/impl/  -- Facade实现 + RPC服务暴露 + 调度任务 + 消息监听
    hybridpe/      -- 独立流程引擎模块
  test/            -- 测试基础设施
```

**可复用要点**：
- **facade/integration/sdk 三层分离**：facade 只定义接口和DTO，不依赖实现；integration 封装外部调用；sdk 提供带缓存的本地化SDK
- **core/model 独立于 Spring**：领域模型不引入框架依赖，可跨模块复用
- **biz/shared 与 biz/service/impl 分离**：共享业务逻辑在 shared 中，RPC暴露层在 service/impl 中，实现业务逻辑与通信协议解耦

---

## 二、核心设计模式

### 2.1 三阶段处理器管线（Template Method + Pipeline）

这是项目最核心的模式，用于风控审核的完整生命周期：

```
TaskProcessorInterface<R,P,T>          -- 顶层接口
    └── CommonProcessor<R,P,T>         -- 基础实现：构建运行上下文、特性池更新、事务管理
         ├── PreProcessor<T>           -- 阶段1：数据采集/预处理
         │    └── AbstractPreProcessor<I,O,T>  -- 带注解驱动的I/O绑定
         │         └── ~100个具体PreProcessor（Build*、Query*、Get*）
         ├── CheckItemProcessor<T>     -- 阶段2：风险检查/审核
         │    └── AbstractCheckItemProcessor<I,O,T>
         │         └── ~40个具体CheckItemProcessor
         └── AfterProcessor<T>         -- 阶段3：决策后处理
              └── ~10个具体AfterProcessor
```

**流程**：
```
EventOrder(审核工单) 到达
  → [阶段1] PreProcessor 并行执行数据采集，全部完成后触发阶段2
  → [阶段2] CheckItemProcessor 并行执行风险检查，全部完成后触发决策计算
  → 决策引擎计算结果(PASS/REJECT/CC/UNKNOWN)
  → [阶段3] AfterProcessor 执行通知、处罚、人工复审等后处理
```

**可复用设计**：
- 三阶段管线自动衔接：每个阶段完成后自动检查是否所有任务完成，触发下一阶段
- 特性池（Feature Pool）作为阶段间数据传递的共享介质
- 抽象基类处理通用逻辑（上下文构建、事务、I/O序列化），子类只关注业务

### 2.2 注解驱动的处理器I/O绑定

通过自定义注解实现处理器输入输出的声明式绑定：

```java
@AbilityInput(key = "param_key", type = InputType.BASIC, valueType = ValueType.STRING)
private String inputField;

@AbilityOutput(itemCode = "feature_code", valueType = ValueType.STRING)
private String outputField;
```

**可复用设计**：
- `CommonProcessor.buildInputParam()` 通过反射读取 `@AbilityInput` 从运行上下文自动填充输入
- `CommonProcessor.convert2ProcessResult()` 通过反射读取 `@AbilityOutput` 自动将输出序列化为特性项
- 每个处理器自描述I/O契约，无需外部配置文件

### 2.3 工厂 + 策略模式（处理器调度）

```java
TaskProcessorFactory:
  - Spring afterPropertiesSet() 时自动发现所有 CommonProcessor Bean
  - 按 getProcessCode() 建立索引
  - 支持实例后缀：processCode|instanceId，同一处理器类服务多配置
  - 运行时按 code 获取处理器实例
```

**同类工厂**：
- `CompareFactory`：比较运算符策略调度
- `CommandHandlerFactory`：控制命令策略调度
- `ItemFieldGetterFactory`：字段值提取策略调度（自注册模式）
- `ProcessorFactory`（HybridPE）：节点处理器调度
- `NodeDriverFactory`（HybridPE）：节点驱动模式调度
- `BizRuleBuilderFactory`（HybridPE）：业务规则构建器调度

### 2.4 决策引擎（规则树 + 比较运算符）

```
DecisionComputeEngine
  → 遍历 DecisionStrategyRuleNode（规则树）
  → 每个节点用 CompareFactory 获取比较运算符
  → 比较运算符（EqualsCompare, NumberCompare, IncludeCompare 等）对特性值进行判断
  → 输出决策结果 PASS/REJECT/CC/UNKNOWN
```

**可复用设计**：
- 规则树可配置，支持多级嵌套
- 比较运算符可扩展，新增运算符只需实现 `CompareInterface`
- 离线决策引擎将规则配置转换为 ODPS SQL 执行批量决策

### 2.5 HybridPE 流程引擎（DAG + 驱动模式）

独立的流程编排引擎，支持有向无环图（DAG）流程：

```
FlowRule（规则/流程定义）
  → FlowInstance（流程

/流程定义）
  → FlowInstance（流程实例）
    → NodeInstance（节点实例）

NodeDriveMode:
  - EXECUTE：同步执行
  - ROTATION：轮询结果
  - NOTIFY：异步回调

INodeProcessor（可插拔节点处理器）
  - OdpsSQLExecuteProcessor：提交ODPS SQL并轮询
  - SofaConnectorInstanceProcessor：触发数据同步任务
  - BizInstanceCreateProcessor：创建业务实例

节点完成后自动评估 JEXL 表达式，决定激活哪些下游节点
```

**可复用设计**：
- Driver + Processor 双层策略：Driver 决定驱动方式，Processor 实现业务逻辑
- 自动链式执行：节点完成后通过 JEXL 表达式自动路由
- 幂等控制：Driver 层的 `isIdempotent()` 检查
- 状态机：FlowRuleStatusEnum 内置状态转换规则 `canChangeStatus()`

### 2.6 命令模式（控制操作）

```java
CommandHandler<P, R>:
  - execute(P param): R
  - getCommand(): ControlCommandKeyEnum

CommandHandlerFactory:
  - 按 command code 索引 handler
  - 支持：关闭工单、错误后重处理等操作
```

### 2.7 CQRS（命令查询职责分离）

```java
// 查询服务
LibraryCodeQueryService -- 只读操作，返回 Info/Result DTO
// 更新服务
LibraryCodeUpdateService -- 写操作，返回 boolean/void
```

---

## 三、数据模型设计模式

### 3.1 extInfo 扩展字段模式

几乎所有领域模型都使用 `Map<String, Object> extInfo` 实现可扩展字段：

```java
// 用枚举作为 key，提供类型安全
public void addExtInfo(FlowRuleExtEnum key, Object value) {
    if (this.extInfo == null) {
        this.extInfo = new HashMap<>();
    }
    this.extInfo.put(key.name(), value);
}
```

**可复用设计**：
- 避免频繁加字段改表——新需求用 extInfo 承载
- 枚举 key 提供类型安全和代码可读性
- JSON 序列化/反序列化到数据库

### 3.2 三层模型分离

```
DO (Data Object)  -- common/dal/，与数据库表一一对应
Model             -- core/model/，领域模型，包含业务逻辑
Info/Query/Request -- common/service/facade/，对外DTO
```

**转换层**：
- Convertor 静态工具类：DO → Model
- GenericConvertor：CGLIB BeanCopier + 自定义 Converter（处理 Enum→String, Map→JSON, Collection→JSON）
- `@Convert` 注解框架：声明式字段映射，支持嵌套对象递归

### 3.3 枚举增强模式

```java
// 1. code/name 查找
public static FlowRuleStatusEnum getByCode(String code) { ... }

// 2. 状态机内置
public enum FlowRuleStatusEnum {
    EDIT(nextStatus = [PRE, DELETE]),
    PRE(nextStatus = [GRAY, ONLINE, EDIT, DELETE]),
    ...;
    public boolean canChangeStatus(FlowRuleStatusEnum target) {
        return nextStatus.contains(target);
    }
}

// 3. 枚举接口体系
EnumInterface<T> { T code(); String name(); }
EnumStringInterface extends EnumInterface<String>
EnumIntegerInterface extends EnumInterface<Integer>
CommonEnumUtil.findByCode() / findByName() / getList()
```

---

## 四、基础设施组件

### 4.1 ServiceTemplate + ServiceCallback（统一服务执行模板）

```java
serviceTemplate.execute(new ServiceCallback<Result>() {
    void checkParams() { /* 参数校验 */ }
    Result executeService() { /* 业务逻辑 */ }
    String getServiceDesc() { /* 监控描述 */ }
    void afterService() { /* 后置钩子（可选）*/ }
});
```

**模板自动处理**：
1. 参数校验
2. 业务执行
3. 统一异常处理（BizException vs 系统 Throwable）
4. 结构化 Result\<T\> 返回
5. BaseMonitorLogger 监控
6. ThreadLocal 清理

### 4.2 分层日志摘要（Digest Log）

```
DAL层 → DalDigestLogInterceptor → BIZRISKIDE-DAL-DIGEST
SAL层 → SalDigestLogInterceptor → BIZRISKIDE-SAL-DIGEST
服务层 → InterceptorUtil.digestServiceInvoke → BIZRISKIDE-SERVICE-DIGEST
业务层 → LoggerUtil.biz → BIZRISKIDE-BIZ-SERVICE
调度层 → SCHEDULE_LOGGER
监控层 → BaseMonitorLogger → MONITOR-LOGGER
消息订阅 → BIZRISKIDE-MSG-SUB
消息发布 → BIZRISKIDE-MSG-PUB
```

**格式**：`[signature]Y/N,costMs,code,msg` 或 `[dataSource,method,success,cost]`

**可复用设计**：
- 三层拦截器（DAL/SAL/Service）自动记录每次调用的成功/失败、耗时
- BaseDigestLogInterceptor 抽象基类提供结构化格式
- 支持敏感数据脱敏（MistClient/OpenApiGatewayClient）

### 4.3 异常体系

```java
CommonException (RuntimeException)
  ├── ErrorCodeEnum code       -- SOFA 16位错误码
  ├── ErrorContext errorContext -- 错误上下文
  ├── String bizTips           -- 面向业务的提示信息
  └── String thirdPartErrorCode -- 第三方错误码

CommonBizException extends CommonException -- 业务异常
```

### 4.4 Result\<T\> 统一返回

```java
Result<T> {
    T data;
    String resultCode;
    String resultMsg;
    String customResultMsg;
    boolean isSuccess;
}
```

### 4.5 BizContext 请求上下文

```java
BizContext {
    String tntInstId;      -- 租户ID
    String operatorId;      -- 操作人
    String operatorType;    -- 操作人类型
    Map<String, Object> extInfo; -- 扩展信息
}
```

### 4.6 DRM 动态配置

```java
@DResource
public class CommonDrm {
    @DAttribute
    private String preEnv;
    @DAttribute
    private List<String> preZoneList;
}
```

**可复用设计**：运行时热更新配置，无需重启；每个子系统有独立 DRM 类

### 4.7 分布式锁

```java
LockService:
  String lock(String lockObject, LockTypeEnum lockType, int expireSeconds)
  boolean unlock(String lockId)

StrategyDispatchRepository:
  boolean stateLock(String id)          -- 乐观锁
  boolean releaseStateLock(String id)
  int releaseStateLock(Date expireTime) -- 释放过期锁
```

### 4.8 ID 生成服务

```java
BirSequenceService:
  String getNextId(String seqName, String shardingKey)

// ZDAL Sequence 配置：数据库号 + eDSID + 序列号
```

### 4.9 事务性消息回调

```java
TxCallbackHandler<Payload>:
  String topic()
  String eventCode()
  boolean handle(Payload payload)  // 返回 true 触发回滚

AbstractTxCallbackHandler<Payload>:
  afterPropertiesSet() → 自动注册到 TxCallbackListener

// 发布端
UniformEventPublisherClient: publish() / publishWithTx()
```
### 4.10 声明式参数校验

```java
@RequestCheck(nonNull = true, desc = "xxx")   -- 非空校验
@LengthCheck(maxLength = 100, desc = "xxx")    -- 长度校验
@EnumCheck(enumClass = XxxEnum.class)           -- 枚举校验

CheckUtil.requestAnnotationCheck(obj) → BooleanExt<String>
```

### 4.11 SDK 本地缓存 + 降级模式

```java
LibraryCodeCheckService:
  - 本地 ConcurrentHashMap 缓存
  - 缓存过期 → 查询全量列表 → 若列表 < threshold 填充本地缓存
  - 若列表 > threshold → 加入黑名单1小时，回退到远程单条查询
  - 异常时降级到远程查询
  - 5分钟缓存TTL，可配置 threshold
```

### 4.12 BusinessThreadLocal 请求上下文传递

```java
BusinessThreadContext { preHeat, debug, shadow, refresh, liteLog, loadTest, sceneCode, extInfo }
BusinessThreadLocal { get(), put(), clearRef() }
ThreadLocalUtil { put(key, value), get(key), getString(key), remove(key) }
```

---

## 五、调度任务框架（Split-Load-Execute）

基于 AntScheduler Serverless 的三阶段调度模式：

```
*Scheduler    -- @Scheduler + @SchedulerTaskSpec(cron=...)，编排 pipeline
  → *Splitor  -- 将工作拆分为 DataLoadFilterItem 分片
  → *Loader   -- 按 filter 从 DB 加载实体ID
  → *Executer -- 逐ID执行业务逻辑，包裹在 ServiceTemplate 中
```

**三组调度器**：
1. hybridpe/scheduler：流程调度、流程实例启动、节点执行、节点轮询
2. decisionengine/scheduler：处理任务执行/超时/监控/灰度结束/延迟任务/预池
3. offlineengine/scheduler：离线决策调度/轮询/策略分发

---

## 六、数据访问层模式

### 6.1 三层分离

```
DAO (mapper/)   -- MyBatis 接口 + XML映射
DO  (model/)    -- 数据库行对象（snake_case → camelCase）
Query (query/)  -- 查询参数对象，DalPageQuery 提供分页基础
```

### 6.2 双数据源配置

```java
bizRiskIdeDataSource        -- 主库（实时数据）
bizRiskIdeDataSourceHistory -- 历史库（归档数据）

// MyBatis Configuration 按 package 路由到不同 SqlSessionFactory
```

### 6.3 DAL 拦截器

- BeanNameAutoProxyCreator 自动代理所有 `*DAO` Bean
- 记录每次 DAO 调用的数据源、方法名、成功/失败、耗时
- 从 ZDAL ThreadLocalMap 提取物理数据源名（分库分表键）

### 6.4 BizLogTransactionTemplate

```java
// 继承 TransactionTemplate，添加慢事务告警（>100ms 记录警告日志）
```

### 6.5 Repository 抽象

```java
// core/service/repository/ 提供 DAO 之上的抽象
interface EventRepository {
    void insert(Event event);
    Event queryById(String id);
    Event lockById(String id);           // 悲观锁 SELECT FOR UPDATE
    PageList<Event> queryByPage(Query q);
}
```

---

## 七、外部集成模式

### 7.1 Client 接口 + 实现 分离

每个外部系统一个 package：
```
integration/xxx/
  XxxClient.java       -- 接口
  XxxClientImpl.java   -- 实现（SOFA RPC 或 HTTP 调用）
```

### 7.2 统一 SAL 拦截

```java
@Aspect
@Around("execution(* com.alipay.bizriskide.common.service.integration..*.*(..))")
// 自动记录所有外部调用的系统名、方法、成功/失败、耗时
// 从包路径提取系统名
```

### 7.3 DRM 控制外部调用

```java
// 外部调用 URL 和超时通过 DRM 动态配置，支持运行时切换环境
```

---

## 八、环境配置与多环境管理

### 8.1 六环境 Profile

default / dev / test / prepub / sim / prod

**渐进配置**：
- dev/test：stable pool 主机、run_mode=TEST、dbmode=dev
- prepub：预生产，接近生产配置
- prod：域名化 VIP、无测试标记

### 8.2 日志分层

Log4j2 全异步，14 个 Appender 按职责分流：
- 通用：app-default.log, common-error.log
- 分层摘要：dal-digest, sal-digest, service-digest, biz-service
- 领域：schedule, monitor, msg-sub, msg-pub, core-service
- 框架：sofa-default.log

---

## 九、ConvertUtil 注解驱动转换框架

```java
@Convert(value = "targetFieldName", defaultStringValue = "", nested = false, extend = DefaultConvert.class)

ConvertUtil:
  convertBySrcAnnotation(src, target)          -- 按源注解转换
  convertByTargetAnnotation(src, target)       -- 按目标注解转换
  convertListBySrcAnnotation(srcList, clazz)   -- 列表转换
  covertByBeanCopier(src, target)              -- CGLIB 快速拷贝
  convertBeanToMap / convertListByBeanMap      -- Map → Bean
```

支持：嵌套对象递归、枚举互转、Boolean→Y/N→0/1 转换

---

## 十、最值得直接复用的 Top 10 设计

1. **ServiceTemplate + ServiceCallback**：统一服务执行模板，参数校验+业务执行+异常处理+监控+ThreadLocal清理一体化
2. **三阶段处理器管线**：PreProcessor→CheckItemProcessor→AfterProcessor，自动衔接，特性池数据传递
3. **注解驱动 I/O 绑定**（@AbilityInput/@AbilityOutput）：处理器自描述I/O契约
4. **工厂+策略自动注册**：Spring afterPropertiesSet 自动发现+索引，运行时按 code 调度
5. **extInfo + 枚举 key 扩展字段**：避免频繁改表，类型安全
6. **分层 Digest Log 拦截器**：DAL/SAL/Service 三层自动记录调用摘要
7. **SDK 本地缓存+降级模式**：本地缓存→黑名单→远程降级
8. **Split-Load-Execute 调度框架**：分片→加载→执行三阶段调度
9. **HybridPE DAG 流程引擎**：规则定义→实例创建→节点驱动→自动路由
10. **ConvertUtil 注解转换框架**：声明式字段映射+CGLIB快速拷贝
