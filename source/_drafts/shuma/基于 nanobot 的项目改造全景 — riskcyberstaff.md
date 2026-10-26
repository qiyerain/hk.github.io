---
layout: false
---

# 基于 nanobot 的项目改造全景 — riskcyberstaff

## 目录

- [一、基础设施改造](#一基础设施改造)
  - [1. 分布式锁体系重构（Layotto → Redis → TBase）](#1-分布式锁体系重构layotto--redis--tbase)
  - [2. 日志系统迁移（loguru → SOFAPy LogManager + Trace）](#2-日志系统迁移loguru--sofapy-logmanager--trace)
  - [3. 数据库存储切换](#3-数据库存储切换)
  - [4. SOFAPy 框架升级 & 流式接口改造](#4-sofapy-框架升级--流式接口改造)
- [二、可靠性治理（11 个 BUG）](#二可靠性治理11-个-bug)
  - [系统性缺陷修复](#系统性缺陷修复)
  - [钉钉群消息可靠性](#钉钉群消息可靠性)
  - [其他关键修复](#其他关键修复)
- [三、记忆系统改造](#三记忆系统改造)
- [四、业务 Skill 体系构建](#四业务-skill-体系构建)
- [五、LLM 工程实践](#五llm-工程实践)
- [面试高频问题](#面试高频问题)

## 项目背景

nanobot 是企业级 AI Agent 框架，支持多渠道通信（钉钉/飞书等）、智能记忆管理、工具调用。在此基础上构建了**风险合规 AI 员工**（风控处罚场景），累计 500+ commits，改造覆盖基础设施、可靠性、记忆系统、业务 Skill 四大维度。

---

## 一、基础设施改造

### 1. 分布式锁体系重构（Layotto → Redis → TBase）

**问题**：Layotto Lock 内置 `lock_keep_alive` 自动续约，持锁节点异常退出后锁永远不释放，导致所有节点死锁。

**方案**：
- 用 Redis `SET NX EX` 替代，TTL 到期自动释放，无自动续约
- 后续迁移到 TBase（兼容 Redis 协议），锁前缀加环境隔离（灰度/线上共享前缀问题修复）
- 心跳从 1 分钟调整为 5 分钟，减少锁竞争开销

**面试要点**：这不是简单的"换了个锁"，而是从"自动续约导致锁永不过期"的根本问题出发，选择了"宁可锁过期后重新竞争，也不能让锁永远不释放"的设计哲学。

### 2. 日志系统迁移（loguru → SOFAPy LogManager + Trace）

- 从 loguru 迁移到 SOFA 框架标准日志，引入分布式 Trace 链路追踪
- 按 agent/channel/tool/memory/cron 等模块拆分日志文件，移除 nanobot.log 聚合
- 修复 `setup_logging()` 未启用 SOFAPy 文件日志导致无法按模块拆分的问题

### 3. 数据库存储切换

- 从旧 DB 迁移到新 DB，去除废弃的 `rcs_sessions` 表
- 补充数据迁移脚本，兼容新旧数据格式
- `store llm_context` 改用 UTF-8 JSON 编码，解决中文存储问题

### 4. SOFAPy 框架升级 & 流式接口改造

- 升级 SOFAPy 版本，对接 Java 侧 Triple（RPC）流式接口
- 流式接口指定 IP 和超时时间，解决 MOSN sidecar 启动慢导致连接超时
- Triple vipUrl 通过配置文件指定，支持开关控制

---

## 二、可靠性治理（11 个 BUG）

### 系统性缺陷修复

| BUG   | 问题                                         | 修复                                    |
| ----- | -------------------------------------------- | --------------------------------------- |
| BUG-1 | add_batch 方法缺少 agent_code/team_code 字段 | 补充字段                                |
| BUG-2 | asyncio.create_task 无管理，异常静默丢失     | 改为 _schedule_background_task 统一管理 |
| BUG-3 | rcs_daily_summaries 迁移缺少索引             | 补充 agent_code/team_code 列及索引      |
| BUG-4 | 分布式队列 session 处理无重试上限            | 增加最大重试次数和死信机制              |
| BUG-5 | session_key 路由回退时 agent_code 被覆盖     | 用原始 agent_code 覆盖消息              |
| BUG-6 | AgentRegistry reload/disable 未关闭 MCP 连接 | 关闭 MCP 连接资源                       |

### 钉钉群消息可靠性

| BUG   | 问题                             | 修复                                                        |
| ----- | -------------------------------- | ----------------------------------------------------------- |
| BUG B | LLM API 无超时保护，可能无限挂起 | 添加 request_timeout(默认120s)                              |
| BUG C | 异常信息泄露内部细节             | 新建 errors.py，统一 UserFacingError/sanitize_error_message |
| BUG D | poll_loop 异常退出后永久停止     | 指数退避、CancelledError 处理、Redis ping 重试 30 次        |
| BUG E | _consolidation_locks 无清理机制  | 容量守卫、/new 命令清理、_cleanup_stale_locks()             |
| BUG F | save_daily_summary TOCTOU 竞态   | 3 种 DB 后端 UPSERT 使用 CASE WHEN/GREATEST/MAX 保护        |

### 其他关键修复

- **antdinghttp 发送失败静默吞错**：改为正确抛出异常
- **inject_message 默认 channel 错误**：改为 antdinghttp
- **创建群重复拉群**：增加 businessId 原子去重（Redis SET NX）
- **LLM 篡改群 ID**：create_scene_group 返回缓存 key 而非真实群 ID
- **Trace span 生命周期**：用 try/finally 确保 span 一定关闭
- **历史对话丢失 assistant 消息**：修复加载逻辑

**面试要点**：11 个 BUG 不是零散修的，是系统性排查。TOCTOU 竞态、资源泄漏、异常吞没——这些都是分布式系统的经典陷阱，每个修复都有对应的设计模式（UPSERT 防竞态、try/finally 防泄漏、死信队列防无限重试）。

---

## 三、记忆系统改造

### 1. PowerMem OceanBase 迁移

- 新增 `team_code/skill_code/agent_id/run_id` 字段，支持多 Agent 记忆隔离
- Patch `create_memory_model` 让 ORM 模型包含新字段
- Patch `_build_record_for_insert` 从 metadata 中提取字段写入

### 2. 记忆工具重构

- `save_memory` → `manage_memory`，支持 create/update/delete 三种操作
- 运行时 prompt 支持 + manage_memory 可直接存储
- Unicode NFKC 标准化，解决混合语言记忆检索问题
- 修复 `agent_id` 为空和 `agent_code` filter 重复问题

### 3. 记忆隔离

- 多数字员工场景下记忆按 agent 隔离，防止跨员工记忆串扰
- 对话压缩提示词优化，减少记忆提取频次

### 4. TBase 向量存储后端

- 实现 `TBaseVectorStore`（继承 `VectorStoreBase`），基于 Redis HNSW 索引
- 注册到 PowerMem `VectorStoreFactory`
- 支持 Snowflake ID、COSINE/L2/IP 距离度量、连接池

**面试要点**：三层记忆（Fact/Profile/Experience）覆盖从实时事实到长期经验的全生命周期。智能去重不是文本匹配，是向量语义搜索 + LLM 决策。艾宾浩斯遗忘曲线让记忆自然淘汰而非无限膨胀。

---

## 四、业务 Skill 体系构建

基于 nanobot 的 Skill 机制，构建了完整的风控处罚业务链路：

| Skill                          | 功能           |
| ------------------------------ | -------------- |
| `punish-anomaly-detection`     | 处罚异常检测   |
| `punish-influence-analysis`    | 处罚影响分析   |
| `decision-flow-workorder-api`  | 决策流程工单   |
| `disposal-filter-strategy-api` | 处置过滤策略   |
| `protect-strategy-flow-api`    | 保护策略流程   |
| `disposal-event-config-api`    | 处置事件配置   |
| `risk-owner-config`            | 风险负责人配置 |
| `recheck-config-check`         | 复核配置校验   |
| `user-behavior-fetch`          | 用户行为获取   |

核心改造点：
- Skill 通知必须使用 `message` 工具发送群消息，确保消息可达
- 区分流程发起人和风险负责人，避免角色混淆
- 合并场景 C/D 的 Step5 + Step5.5 为统一的特征校验与个性化条件确认步骤
- [CONFIRM] 标注和返回路径规范化，减少 LLM 决策歧义

---

## 五、LLM 工程实践

- **LLM 篡改群 ID 的防御**：返回缓存 key（`nggrp:{businessId}`）而非真实群 ID，inject_message 透明解析回真实 open_conversation_id
- **Skill 确认点规范化**：[CONFIRM] 标注减少 LLM 决策歧义
- **异常信息脱敏**：UserFacingError 统一对外错误信息，sanitize_error_message 替换所有 str(e) 泄露
- **后台任务统一管理**：`_schedule_background_task` 替代裸 `asyncio.create_task`，异常不会静默丢失

---

## 面试高频问题

**Q: 分布式锁为什么不用 Layotto？**
A: Layotto Lock 内置 lock_keep_alive 自动续约，持锁节点异常退出后锁永远不释放，所有节点死锁。Redis SET NX EX 的核心优势是 TTL 到期必然释放，宁可短暂无锁重新竞争，也不能让锁永远不释放。

**Q: 记忆系统怎么解决多 Agent 串扰？**
A: OceanBase 迁移时新增 team_code/skill_code/agent_id/run_id 字段，查询时按 agent_code 过滤。记忆作用域分三层：私聊 → speaker_id，群聊个人 → group:{chat_id}:{speaker_id}，群聊共享 → group:{chat_id}。

**Q: LLM 篡改群 ID 是怎么发现的？**
A: LLM 传递长编码字符串（如 `cidbccwE+2AJ2fSP69ESPB58w==`）时容易出现字符篡改（+变空格、=丢失等）。改为返回简短的缓存 key `nggrp:{businessId}`，inject_message 透明解析回真实群ID，大模型不再接触真实ID

**Q：11个bug是怎么系统性排查的？**
A:不是逐个修的，是按类别查的：竞态类（TOCTOU、consolidation_locks）、资源泄漏类（MCP 连接、background task）、异常吞没类（poll_loop 静默停止、antdinghttp 不抛异常）、数据一致性类（agent_code 缺失、session_key 覆盖）。每个类别有对应的设计模式。
