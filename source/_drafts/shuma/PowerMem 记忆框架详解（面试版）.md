---
original_dir: PowerMem 记忆框架详解（面试版）
---

## 目录

- [一、PowerMem 是什么](#一powermem-是什么)
- [二、架构分层](#二架构分层)
- [三、三大记忆类型](#三三大记忆类型)
- [四、智能记忆写入流程（_intelligent_add）](#四智能记忆写入流程_intelligent_add)
- [五、艾宾浩斯遗忘曲线](#五艾宾浩斯遗忘曲线)
- [六、记忆作用域（Scope）](#六记忆作用域scope)
- [七、对话压缩（Consolidation）](#七对话压缩consolidation)
- [八、我做的改造](#八我做的改造)
- [九、面试话术要点](#九面试话术要点)
- [四大记忆框架对比](#四大记忆框架对比)
  - [1. ReMe — 过程记忆，关注"怎么做的"](#1-reme--过程记忆关注怎么做的)
  - [2. PowerMem — 工程落地的全栈记忆方案](#2-powermem--工程落地的全栈记忆方案)
  - [3. OpenViking — 上下文数据库，文件系统范式](#3-openviking--上下文数据库文件系统范式)
  - [4. MemU — 非嵌入检索，多层记忆架构](#4-memu--非嵌入检索多层记忆架构)
- [对比总结](#对比总结)
- [为什么选 PowerMem](#为什么选-powermem)
- [引用](#引用)

---

> 自动生成：10 张图，由多模态模型 `doubao-seed-2.0-pro` 一次性识别转写。

![image-20260525105310001.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525105310001.png)
- 一、PowerMem 是什么
- 二、架构分层
- 三、三大记忆类型
- 四、智能记忆写入流程（_intelligent_add）
- 五、艾宾浩斯遗忘曲线
- 六、记忆作用域（Scope）
- 七、对话压缩（Consolidation）
- 八、我做的改造
- 九、面试话术要点
- 四大记忆框架对比
  - 1. ReMe — 过程记忆
  - 2. PowerMem — 工程落地的全栈记忆方案
  - 3. OpenViking — 上下文数据库
  - 4. MemU — 非嵌入检索
- 对比总结
- 为什么选 PowerMem

---
## 一、PowerMem 是什么
PowerMem 是一个基于向量语义搜索的智能记忆系统，核心能力是让 AI Agent 拥有"长期记忆"——不仅能记住发生了什么，还能自动提取、去重、更新、遗忘。

## 二、架构分层
```mermaid
flowchart TD
    A[nanobot 记忆系统（上层）]
    A --> A1[Conversation Store（原始对话存储）]
    A --> A2[Memory Consolidator（对话压缩+画像推断）]
    A --> A3[Skill Experience Extractor（Skill经验提取）]
    B[PowerMemAdapter（适配层）]
    B --> B1[配置转换（nanobot Config → PowerMem Config）]
    B --> B2[Monkey Patch（运行时 prompt、dimensions 修复）]
    B --> B3[多 Agent 隔离（agent_code/skill_code/run_id）]
    C[PowerMem SDK（核心引擎）]
    C --> C1[智能记忆写入（_intelligent_add）]
    C --> C2[语义搜索（vector search + hybrid search）]
    C --> C3[艾宾浩斯遗忘曲线（retention 衰减 + 强化）]
    C --> C4[LLM 决策引擎（ADD/UPDATE/DELETE/NONE）]
    C --> C5[图谱存储（MemoryGraph 关系推理）]
    D[VectorStore（存储后端）]
    D --> D1[SQLite | OceanBase | TBase(Redis) | PostgreSQL]
    A1 & A2 & A3 --> B
    B --> C
    C --> D
```

![image-20260525105310002.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525105310002.png)
（架构图同上图，完整展示架构分层的全部层级与内容）
```mermaid
flowchart TD
    A[nanobot 记忆系统（上层）]
    A --> A1[Conversation Store（原始对话存储）]
    A --> A2[Memory Consolidator（对话压缩+画像推断）]
    A --> A3[Skill Experience Extractor（Skill经验提取）]
    B[PowerMemAdapter（适配层）]
    B --> B1[配置转换（nanobot Config → PowerMem Config）]
    B --> B2[Monkey Patch（运行时 prompt、dimensions 修复）]
    B --> B3[多 Agent 隔离（agent_code/skill_code/run_id）]
    C[PowerMem SDK（核心引擎）]
    C --> C1[智能记忆写入（_intelligent_add）]
    C --> C2[语义搜索（vector search + hybrid search）]
    C --> C3[艾宾浩斯遗忘曲线（retention 衰减 + 强化）]
    C --> C4[LLM 决策引擎（ADD/UPDATE/DELETE/NONE）]
    C --> C5[图谱存储（MemoryGraph 关系推理）]
    D[VectorStore（存储后端）]
    D --> D1[SQLite | OceanBase | TBase(Redis) | PostgreSQL]
    A1 & A2 & A3 --> B
    B --> C
    C --> D
```

## 三、三大记忆类型
| 类型 | 触发时机 | 内容 | Prompt |
| ---- | -------- | ---- | ------ |
| Fact | 每轮对话后实时提取 | 客观事实：身份、事件、关系、偏好 | FACT_EXTRACTION_PROMPT |
| Profile | 对话压缩时推断 | 行为模式：偏好、习惯（从多次行为归纳） | PROFILE_INFERENCE_PROMPT |
| Experience | 每日定时 + Skill 执行后 | 经验教训：条件→行动→结果 | EXPERIENCE_EXTRACTION_PROMPT / SKILL_EXPERIENCE_PROMPT |

![image-20260525105310003.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525105310003.png)
| 类型 | 触发时机 | 内容 | Prompt |
| ---- | -------- | ---- | ------ |
| Fact | 每轮对话后实时提取 | 客观事实：身份、事件、关系、偏好 | FACT_EXTRACTION_PROMPT |
| Profile | 对话压缩时推断 | 行为模式：偏好、习惯（从多次行为归纳） | PROFILE_INFERENCE_PROMPT |
| Experience | 每日定时 + Skill 执行后 | 经验教训：条件→行动→结果 | EXPERIENCE_EXTRACTION_PROMPT / SKILL_EXPERIENCE_PROMPT |

关键区别：Fact 是"说了什么"，Profile 是"推断出什么样"，Experience 是"学到了什么"。

## 四、智能记忆写入流程（_intelligent_add）
原始消息 → LLM 提取 facts → 逐条 embedding → 向量搜索相似记忆 → LLM 决策动作（ADD/UPDATE/DELETE/NONE） → 执行动作 → 写入图谱

1. 提取：LLM 从对话中抽取结构化事实
2. 去重：每条 fact 做 embedding，在向量库中搜索 top-5 相似记忆
3. 决策：LLM 看到新旧事实 + 已有记忆，决定执行什么动作
4. 执行：ADD（新增）、UPDATE（更新已有）、DELETE（删除过时）、NONE（重复跳过）
5. 图谱：写入 MemoryGraph 做关系推理

## 五、艾宾浩斯遗忘曲线
```python
class PowerMemIntelligentConfig:
    initial_retention: float = 1.0  # 初始保留度
    decay_rate: float = 0.1  # 衰减速率
    reinforcement_factor: float = 0.3  # 强化因子（再次遇到时提升）
    working_threshold: float = 0.3  # <0.3 = 工作记忆（短期）
    short_term_threshold: float = 0.6  # 0.3~0.6 = 短期记忆
    long_term_threshold: float = 0.8  # >0.8 = 长期记忆
```
- 记忆随时间衰减，`retention = initial_retention * e^(-decay_rate * time)`
- 每次被检索到时，`retention += reinforcement_factor`，模拟"复习强化"
- 低于 `working_threshold` 的记忆检索时降权，自然淘汰

## 六、记忆作用域（Scope）

![image-20260525105310004.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525105310004.png)
（内容同上图，完整保留配置与规则）
```python
class PowerMemIntelligentConfig:
    initial_retention: float = 1.0  # 初始保留度
    decay_rate: float = 0.1  # 衰减速率
    reinforcement_factor: float = 0.3  # 强化因子（再次遇到时提升）
    working_threshold: float = 0.3  # <0.3 = 工作记忆（短期）
    short_term_threshold: float = 0.6  # 0.3~0.6 = 短期记忆
    long_term_threshold: float = 0.8  # >0.8 = 长期记忆
```
- 记忆随时间衰减，`retention = initial_retention * e^(-decay_rate * time)`
- 每次被检索到时，`retention += reinforcement_factor`，模拟"复习强化"
- 低于 `working_threshold` 的记忆检索时降权，自然淘汰

私聊 → `speaker_id`（个人记忆） 群聊个人 → `group:{chat_id}:{speaker_id}`（群内个人记忆） 群聊共享 → `group:{chat_id}`（群共享记忆）

通过 `scope_detector.py` 自动判断记忆归属：
- 关键词检测：中英文关键词匹配（"我喜欢"→personal，"我们决定"→group_shared）
- LLM 检测（可选）：关键词不确定时调用 LLM 判断

## 七、对话压缩（Consolidation）
当未压缩消息数超过阈值（默认50条）时触发：
1. 旧消息 → LLM 生成累积摘要（与之前摘要合并，非替换）
2. 压缩的同时 → 推断用户Profile
3. 保留最近 N 轮对话不压缩
4. 摘要存入 `rcs_daily_summaries` 表

`llm_context` 扩展：最近 2 轮 assistant 消息的完整工具调用上下文保留，避免压缩后丢失关键中间状态。

## 八、我做的改造
1. PowerMem OceanBase 迁移

![image-20260525105310005.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525105310005.png)
1. PowerMem OceanBase 迁移
   - 新增 `team_code/skill_code/agent_id/run_id` 字段，支持多 Agent 记忆隔离
   - Patch `create_memory_model` 让 ORM 模型包含新字段
   - Patch `_build_record_for_insert` 从 metadata 中提取字段写入

2. 运行时 Prompt 支持
   - PowerMem 原生 `_intelligent_add` 接收 prompt 参数但不传递给 `_extract_facts`
   - Patch 两层方法，让运行时自定义 prompt 生效
   - 支持三种响应 key：`facts/profiles/experiences`

3. Matryoshka Dimensions 修复
   - 很多 OpenAI 兼容 API 不支持 `dimensions` 参数
   - Patch `OpenAIEmbedding.init` 和 `embed`，仅显式配置时才传 `dimensions`

4. 记忆工具重构
   - `save_memory` → `manage_memory`，支持 `create/update/delete`
   - Unicode NFKC 标准化，解决混合语言记忆检索问题
   - 修复 `agent_id` 为空和 `agent_code` filter 重复问题

5. TBase 向量存储后端
   - 实现 `TBaseVectorStore`（继承 `VectorStoreBase`），基于 Redis HNSW 索引
   - 注册到 PowerMem VectorStoreFactory
   - 支持 Snowflake ID、COSINE/L2/IP 距离度量、连接池

6. Skill 经验提取器

![image-20260525105310006.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525105310006.png)
5. TBase 向量存储后端
   - 实现 `TBaseVectorStore`（继承 `VectorStoreBase`），基于 Redis HNSW 索引
   - 注册到 PowerMem VectorStoreFactory
   - 支持 Snowflake ID、COSINE/L2/IP 距离度量、连接池

6. Skill 经验提取器
   - `SkillExperienceExtractor`：每个 Skill 维护单条经验记录，累积执行要点和已知陷阱
   - 每次执行后合并新经验，保留正确旧经验，矛盾时以最新为准

## 九、面试话术要点
"PowerMem 的核心价值是什么？" → 让 Agent 从"无状态对话"变成"有记忆的助手"。三层记忆（Fact/Profile/Experience）覆盖了从实时事实到长期经验的全生命周期，艾宾浩斯遗忘曲线让记忆自然淘汰而非无限膨胀。

"智能去重怎么做的？" → 不是简单文本匹配，是向量语义搜索 + LLM 决策。新事实先 embedding，搜 top-5 相似记忆，然后 LLM 判断是新增、更新、删除还是跳过。解决了"同一件事换个说法重复存储"的问题。

"你做了哪些关键改造？" → 三件事最有价值：一是 OceanBase 迁移时扩展了多 Agent 隔离字段，解决了多数字员工记忆串扰；二是 Patch 了 PowerMem 的 prompt 传递链，让运行时自定义 prompt 真正生效；三是自研了 TBase 向量存储后端，让企业内部 Redis 兼容服务能跑 HNSW 向量搜索。

---

## 四大记忆框架对比
### 1. ReMe — 过程记忆，关注"怎么做的"
上海交大提出的学术框架，核心解决的是 procedural memory（过程记忆）问题——让 Agent 记住"怎么做"而不是"知道什么"。

三大机制：
- Multi-faceted Distillation：从成功/失败经验中提取细粒度经验（成功模式、失败归因、对比洞察）
- Context-Adaptive Reuse：基于场景感知索引，将历史经验适配到新上下文
- Utility-based Refinement：自主增加有效记忆、修剪过时记忆，保持记忆池紧凑高质量

![image-20260525105310007.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525105310007.png)
上海交大提出的学术框架，核心解决的是 procedural memory（过程记忆）问题——让 Agent 记住"怎么做"而不是"知道什么"。

三大机制：
- Multi-faceted Distillation：从成功/失败经验中提取细粒度经验（成功模式、失败归因、对比洞察）
- Context-Adaptive Reuse：基于场景感知索引，将历史经验适配到新上下文
- Utility-based Refinement：自主增加有效记忆、修剪过时记忆，保持记忆池紧凑高质量

定位：学术研究框架，证明"记忆缩放效应"——Qwen3-8B + ReMe 超过了无记忆的 Qwen3-14B。偏向实验验证，工程化程度有限。

---

### 2. PowerMem — 工程落地的全栈记忆方案
OceanBase 团队开源，定位是生产级智能记忆管理。

核心特性：
- 混合检索：向量 + 全文 + 图检索三路召回，覆盖语义相似、精确匹配、关系推理三种场景
- 艾宾浩斯遗忘曲线：基于认知科学的时间衰减权重，近期且相关的记忆优先级更高
- LLM 驱动的记忆提取：自动从对话中提取关键事实，智能检测重复、更新冲突、合并关联记忆
- 多 Agent 支持：独立记忆空间 + 跨 Agent 共享 + scope 权限控制
- 多接入方式：Python SDK、MCP Server、HTTP API

定位：开箱即用的工程产品，强调开发者友好和生产可用。

---

### 3. OpenViking — 上下文数据库，文件系统范式
字节跳动火山引擎团队开源，自称 Context Database，不是向量数据库。

核心设计：

![image-20260525105310008.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525105310008.png)
字节跳动火山引擎团队开源，自称 Context Database，不是向量数据库。

核心设计：
- `viking://` 虚拟文件系统：把所有上下文（memory、resource、skill）组织成目录树，Agent 用 `ls/find/read` 导航
- L0/L1/L2 分层加载：L0 摘要（~100 token）→ L1 概览（~2K token）→ L2 全文，按需加载，token 消耗降低 80%+
- 目录递归检索：先定位目录再递归下钻，结合语义搜索 + 结构导航
- 检索轨迹可视化：每步检索可审计，告别黑盒 RAG
- 会话自进化：session 结束后自动提取记忆更新 user/agent 目录

定位：面向复杂 Agent 工作流的结构化上下文管理，强调可观测性和 token 效率。

---

### 4. MemU — 非嵌入检索，多层记忆架构
定位是 agentic memory framework，主打多模态输入和非嵌入检索。

三层架构：
- 底层 Raw Resources：原始多模态输入
- 中间 Memory Items：从原始数据中提取的记忆条目
- 顶层 Memory Category Files：自主聚类组织的结构化记忆文件

关键差异化：非嵌入检索——LLM 直接读取记忆分类文件，通过自然语言理解做语义推理和递归溯源（`Memory Category Files → Memory Items → Raw Resources`），不依赖向量相似度搜索。

定位：强调个性化记忆和跨场景适配，反对"一刀切"记忆策略。

---

## 对比总结

![image-20260525105310009.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525105310009.png)
（内容同上图，完整保留三层架构与差异化说明）
三层架构：
- 底层 Raw Resources：原始多模态输入
- 中间 Memory Items：从原始数据中提取的记忆条目
- 顶层 Memory Category Files：自主聚类组织的结构化记忆文件

关键差异化：非嵌入检索——LLM 直接读取记忆分类文件，通过自然语言理解做语义推理和递归溯源（`Memory Category Files → Memory Items → Raw Resources`），不依赖向量相似度搜索。

定位：强调个性化记忆和跨场景适配，反对"一刀切"记忆策略。

---

| 维度 | ReMe | PowerMem | OpenViking | MemU |
| ---- | ---- | -------- | ---------- | ---- |
| 记忆类型 | 过程记忆（how-to） | 事实记忆 + 关系记忆 | 全类型上下文 | 多模态事实记忆 |
| 检索方式 | 场景感知索引 | 向量+全文+图 | 目录递归+语义 | 非嵌入，LLM 直接读 |
| 记忆演化 | 效用驱动增删 | 遗忘曲线+去重合并 | 会话自进化 | 自主聚类重组 |
| 多 Agent | 否 | 是（隔离+共享） | 是 | 是 |
| 可观测性 | 低 | 中 | 高（检索轨迹） | 中 |
| 工程成熟度 | 学术原型 | 生产可用 | 早期但活跃 | 文档阶段 |
| 核心创新 | 经验蒸馏+修剪 | 认知科学遗忘曲线 | 文件系统范式+分层加载 | 非嵌入检索 |

---

## 为什么选 PowerMem
面试中选 PowerMem 的理由可以从 工程落地性 和 架构平衡 两个角度展开：
1. 检索鲁棒性最强

![image-20260525105310010.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525105310010.png)
面试中选 PowerMem 的理由可以从 工程落地性 和 架构平衡 两个角度展开：
1. 检索鲁棒性最强
三路混合检索（向量+全文+图）是实际生产中最稳的方案。纯向量检索有语义漂移问题（OpenViking 的目录递归缓解了但没消除），纯非嵌入检索（MemU）依赖 LLM 推理能力上限且延迟高。PowerMem 的三路召回互为兜底，语义搜不到的精确匹配能兜，精确匹配不到的关系推理能兜。

2. 遗忘曲线是真正解决记忆膨胀的机制
ReMe 的 `utility-based refinement` 和 OpenViking 的会话自进化都在做记忆修剪，但 PowerMem 的艾宾浩斯遗忘曲线是唯一有认知科学理论基础且无需额外 LLM 调用的方案——时间衰减权重是确定性的，不依赖模型判断，计算开销极低。这在记忆量大时优势明显。

3. 多 Agent 隔离+共享的权限模型
生产环境中多 Agent 协作是刚需，PowerMem 的 scope 控制做得最完整——独立空间 + 跨 Agent 共享 + 权限管理，这在 ReMe（无多 Agent）和 MemU（文档不清晰）之间是唯一可用的。

4. 接入成本最低
Python SDK + MCP Server + HTTP API 三种接入方式，对现有系统入侵最小。OpenViking 需要部署整套上下文数据库（Go + Python + 模型服务），MemU 的非嵌入检索要求模型直接读大量文本，延迟和成本都更高。

5. 不排斥其他框架的优点
PowerMem 的图检索可以吸纳 OpenViking 的结构化组织思想，遗忘曲线可以和 ReMe 的效用修剪结合。它是一个足够开放的基座，而不是一个激进的范式重构。

一句话总结：ReMe 是学术前沿，OpenViking 是范式创新，MemU 是另辟蹊径，PowerMem 是工程最优解——在检索鲁棒性、记忆管理、多 Agent 支持和接入成本之间取得了最好的平衡。

## 引用
