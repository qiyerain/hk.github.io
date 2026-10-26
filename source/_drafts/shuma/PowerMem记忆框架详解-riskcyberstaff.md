---
original_dir: PowerMem记忆框架详解-riskcyberstaff
---

## 目录

- [一、PowerMem 是什么](#一powermem-是什么)
- [二、架构分层](#二架构分层)
- [三、三大记忆类型](#三三大记忆类型)
  - [Fact 提取的黑白名单设计](#fact-提取的黑白名单设计)
- [四、智能记忆写入流程（`_intelligent_add`）](#四智能记忆写入流程_intelligent_add)
- [五、艾宾浩斯遗忘曲线](#五艾宾浩斯遗忘曲线)
- [六、记忆作用域（Scope）](#六记忆作用域scope)
- [七、对话压缩（Consolidation）](#七对话压缩consolidation)
- [八、Skill 经验提取器](#八skill-经验提取器)
- [九、我做的关键改造](#九我做的关键改造)
  - [1. PowerMem OceanBase 迁移](#1-powermem-oceanbase-迁移)
  - [2. 运行时 Prompt 支持](#2-运行时-prompt-支持)
  - [3. Matryoshka Dimensions 修复](#3-matryoshka-dimensions-修复)
  - [4. 记忆工具重构](#4-记忆工具重构)
  - [5. TBase 向量存储后端](#5-tbase-向量存储后端)
  - [6. Skill 经验提取器](#6-skill-经验提取器)
- [十、面试高频问题](#十面试高频问题)
- [引用](#引用)

---

> 自动生成：9 张图，由多模态模型 `doubao-seed-2.0-pro` 一次性识别转写。

![image-20260525105459001.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525105459001.png)

# PowerMem 记忆框架详解 — riskcyberstaff

---

## 一、PowerMem 是什么
PowerMem 是一个基于向量语义搜索的智能记忆系统，核心能力是让 AI Agent 拥有"长期记忆"——不仅能记住发生了什么，还能自动提取、去重、更新、遗忘。

---

## 二、架构分层

![image-20260525105459002.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525105459002.png)

```mermaid
flowchart TD
    A[nanobot 记忆系统（上层）]
    A --> A1[ConversationStore<br>（原始对话存储）]
    A --> A2[MemoryConsolidator<br>（对话压缩+画像推断）]
    A --> A3[SkillExperienceExtractor<br>（Skill经验提取）]

    B[PowerMemAdapter（适配层）]
    B --> B1[- 配置转换（nanobot Config → PowerMem Config）]
    B --> B2[- Monkey Patch（运行时 prompt、dimensions 修复）]
    B --> B3[- 多 Agent 隔离（agent_code/skill_code/run_id）]

    C[PowerMem SDK（核心引擎）]
    C --> C1[- 智能记忆写入（_intelligent_add）]
    C --> C2[- 语义搜索（vector search + hybrid search）]
    C --> C3[- 艾宾浩斯遗忘曲线（retention 衰减 + 强化）]
    C --> C4[- LLM 决策引擎（ADD/UPDATE/DELETE/NONE）]
    C --> C5[- 图谱存储 MemoryGraph 关系推理]

    D[VectorStore（存储后端）]
    D --> D1[SQLite | OceanBase | TBase(Redis) | PostgreSQL]

    A --> B --> C --> D
```

---

## 三、三大记忆类型

| 类型 | 触发时机 | 内容 | Prompt |
|------|----------|------|--------|
| Fact | 每轮对话后实时提取 | 客观事实：身份、事件、关系、偏好 | `FACT_EXTRACTION_PROMPT` |
| Profile | 对话压缩时推断 | 行为模式：偏好、习惯（从多 | `PROFILE_INFERENCE_PROMPT` |

![image-20260525105459003.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525105459003.png)

| 类型 | 触发时机 | 内容 | Prompt |
|------|----------|------|--------|
| Fact | 每轮对话后实时提取 | 客观事实：身份、事件、关系、偏好 | `FACT_EXTRACTION_PROMPT` |
| Profile | 对话压缩时推断 | 行为模式：偏好、习惯（从多次行为归纳） | `PROFILE_INFERENCE_PROMPT` |
| Experience | 每日定时 + Skill 执行后 | 经验教训：条件→行动→结果 | `EXPERIENCE_EXTRACTION_PROMPT` / `SKILL_EXPERIENCE_PROMPT` |

关键区别：Fact 是"说了什么"，Profile 是"推断出什么样"，Experience 是"学到了什么"。

### Fact 提取的黑白名单设计
提取什么（白名单）：
- 身份：某人是谁、什么角色、负责什么
- 关键事件：某人做了什么重要决策或操作，结果如何
- 关系：某人与某项目/团队/系统的关系
- 明确表达的偏好或立场

不提取什么（黑名单）：
- 查询类操作的具体数值（案件数、工单等随时会变的数字）
- 工具执行的技术细节（耗时、状态码、API 名称）
- 天气、实时行情等瞬时数据
- 操作产生的临时标识和中间状态（工单号、策略包ID等）
- 日常业务操作流水（创建/修改/删除/配置/上线/审批等）

这种设计避免记忆库被垃圾信息填满。

![image-20260525105459004.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525105459004.png)

---

## 四、智能记忆写入流程（`_intelligent_add`）
原始消息 → LLM 提取 facts → 逐条 embedding → 向量搜索相似记忆（top-5）→ LLM 决策动作（ADD/UPDATE/DELETE/NONE）→ 执行动作 → 写入图谱

1. 提取：LLM 从对话中抽取结构化事实
2. 去重：每条 fact 做 embedding，在向量库中搜索 top-5 相似记忆
3. 决策：LLM 看到新旧事实 + 已有记忆，决定执行什么动作
4. 执行：ADD（新增）、UPDATE（更新已有）、DELETE（删除过时）、NONE（重复跳过）
5. 图谱：写入 MemoryGraph 做关系推理

去重不是文本匹配：是向量语义搜索 + LLM 决策。解决了"同一件事换个说法重复存储"的问题。

---

## 五、艾宾浩斯遗忘曲线
```
initial_retention: 1.0      # 初始保留度
decay_rate: 0.1             # 衰减速率
reinforcement_factor: 0.3   # 强化因子（再次遇到时提升）
working_threshold: 0.3      # < 0.3 = 工作记忆（短期）
short_term_threshold: 0.6   # 0.3~0.6 = 短期记忆
long_term_threshold: 0.8    # > 0.8 = 长期记忆
```

- 记忆随时间衰减：`retention = initial_retention * e^(-decay_rate * time)`
- 每次被检索到时：`retention += reinforcement_factor`，模拟"复习强化"
- 低于 `working_threshold` 的记忆检索时降权，自然淘汰

面试要点：遗忘曲线让记忆系统不会无限膨胀。不常用的记忆自然衰减，被反复引用的记忆得到强化——这和人脑的记忆机制一致。

![image-20260525105459005.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525105459005.png)

---

## 六、记忆作用域（Scope）
```
私聊 → speaker_id                    （个人记忆）
群聊个人 → group:{chat_id}:{speaker_id} （群内个人记忆）
群聊共享 → group:{chat_id}            （群共享记忆）
```

通过 `scope_detector.py` 自动判断记忆归属：
- 关键词检测：中英文关键词匹配（"我喜欢"→personal，"我们决定"→group_shared）
- LLM 检测（可选）：关键词不确定时调用 LLM 判断

---

## 七、对话压缩（Consolidation）
当未压缩消息数超过阈值（默认50条）时触发：
1. 旧消息 → LLM 生成累积摘要（与之前摘要合并，非替换）
2. 压缩的同时 → 推断用户 Profile
3. 保留最近 N 轮对话不压缩
4. 摘要存入 `rcs_daily_summaries` 表
5. llm_context 扩展：最近 2 轮 assistant 消息的完整工具调用上下文保留，避免压缩后丢失关键中间状态

---

## 八、Skill 经验提取器
`SkillExperienceExtractor`：每个 Skill 维护单条经验记录，累积执行要点和已知陷阱。
- 每次执行后合并新经验，保留正确旧经验，矛盾时以最新为准

![image-20260525105459006.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525105459006.png)

- 执行要点最多 7 条，已知陷阱最多 5 条
- 与通用 Experience 提取的区别：通用提取条件→行动→结果模式，Skill 经验提取的是操作指南和避坑指南

---

## 九、我做的关键改造
### 1. PowerMem OceanBase 迁移
- 新增 `team_code/skill_code/agent_id/run_id` 字段，支持多 Agent 记忆隔离
- Patch `create_memory_model` 让 ORM 模型包含新字段
- Patch `_build_record_for_insert` 从 metadata 中提取字段写入

### 2. 运行时 Prompt 支持

![image-20260525105459007.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525105459007.png)

- PowerMem 原生 `_intelligent_add` 接收 `prompt` 参数但不传递给 `_extract_facts`
- Patch 两层方法，让运行时自定义 prompt 生效
- 支持三种响应 key：`facts` / `profiles` / `experiences`

### 3. Matryoshka Dimensions 修复
- 很多 OpenAI 兼容 API 不支持 `dimensions` 参数
- Patch `OpenAIEmbedding.__init__` 和 `embed`，仅显式配置时才传 dimensions

### 4. 记忆工具重构
- `save_memory` → `manage_memory`，支持 create/update/delete
- Unicode NFKC 标准化，解决混合语言记忆检索问题
- 修复 `agent_id` 为空和 `agent_code` filter 重复问题

### 5. TBase 向量存储后端
- 实现 `TBaseVectorStore`（继承 `VectorStoreBase`），基于 Redis HNSW 索引
- 注册到 PowerMem `VectorStoreFactory`
- 支持 Snowflake ID、COSINE/L2/IP 距离度量、连接池

### 6. Skill 经验提取器

![image-20260525105459008.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525105459008.png)

- `SkillExperienceExtractor`：每个 Skill 维护单条经验记录
- 每次执行后合并新经验，保留正确旧经验，矛盾时以最新为准

---

## 十、面试高频问题
**Q: PowerMem 的核心价值是什么？**
A: 让 Agent 从"无状态对话"变成"有记忆的助手"。三层记忆（Fact/Profile/Experience）覆盖了从实时事实到长期经验的全生命周期，艾宾浩斯遗忘曲线让记忆自然淘汰而非无限膨胀。

**Q: 智能去重怎么做的？**
A: 不是简单文本匹配，是向量语义搜索 + LLM 决策。新事实先 embedding，搜 top-5 相似记忆，然后 LLM 判断是新增、更新、删除还是跳过。

**Q: 你做了哪些关键改造？**
A: 三件事最有价值：一是 OceanBase 迁移时扩展了多 Agent 隔离字段，解决了多数字员工记忆串扰；二是 Patch 了 PowerMem 的 prompt 传递链，让运行时自定义 prompt 真正生效；三是自研了 TBase 向量存储后端，让企业内部 Redis 兼容服务能跑 HNSW 向量搜索。

**Q: 遗忘曲线怎么防止重要记忆被淘汰？**
A: 每次被检索到时 `retention += reinforcement_factor`，模拟"复习强化"。重要记忆因为被频繁检索，

![image-20260525105459009.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525105459009.png)

retention 会持续保持在高水平。只有真正不用的记忆才会自然衰减到阈值以下。

**Q: 多 Agent 隔离是怎么实现的？**
A: 两层隔离：写入时通过 `agent_code/run_id` 字段标记来源，查询时通过 filters 按 `agent_code` 过滤。记忆作用域还区分了私聊记忆、群聊个人记忆、群聊共享记忆三个层级。

## 引用
