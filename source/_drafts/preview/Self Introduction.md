---
title: 自我介绍 / Self Introduction
date: 2026-05-07 20:00:00
categories:
- 面试
tags:
- 自我介绍
---

# 自我介绍 / Self Introduction

## 中文版

您好，我叫彭凡遨，有5年Java后端研发经验，目前在长沙发展。

**专业背景：**
我深耕蚂蚁集团风控领域，具备大规模分布式系统与AI大模型应用工程的双向能力。熟悉SOFABoot微服务体系，掌握RAG检索增强、MCP协议、上下文工程等前沿AI工程技术。

**最近工作经历（2023.05至今）：**
目前在数字马力终端风控技术部担任Java后端工程师，主要负责以下核心项目：

1. **数字员工项目**：超轻量级AI Agent框架，我负责记忆模块和Skill模块的核心设计与开发。实现了三层语义记忆系统、MCP工具动态集成、12+ LLM统一调度等功能。

2. **业务风险AI智能决策引擎**：支付宝业务风控智能体平台，经历了从流程型SOP编排到Agent生成Agent的五阶段演进。我负责记忆体系、工具体系、RAG召回三大核心模块。

3. **业务风险智能决策引擎**：商户风控智能决策平台，实时引擎99th <100ms，支撑10万+ TPS。我负责决策执行核心链路的设计与开发。

4. **统一接入管理平台**：风控统一接入管理平台，我负责需求审批、预警规则与任务等五大模块的设计与开发。

**之前工作经历（2021.11-2023.04）：**
在湖南鼎一致远科技有限公司担任Java后端开发工程师，独立负责打印设备远程管理SaaS平台的多个核心服务开发，涉及Spring Cloud微服务架构、MQTT通信、分布式事务等技术。

**教育背景：**
吉首大学计算机科学与技术专业本科毕业。

希望能有机会为贵公司贡献我的技术和经验。谢谢！

---

## English Version

Hello, my name is Peng Fan'ao. I have 5 years of Java backend development experience, currently based in Changsha.

**Professional Background:**
I specialize in risk control at Ant Group, with dual expertise in large-scale distributed systems and AI large model application engineering. I'm proficient in the SOFABoot microservice ecosystem and master cutting-edge AI engineering technologies including RAG retrieval augmentation, MCP protocol, and context engineering.

**Recent Work Experience (May 2023 - Present):**
Currently serving as a Java Backend Engineer in the Terminal Risk Control Technology Department at Digital Mali, responsible for the following core projects:

1. **Digital Employee Project**: An ultra-lightweight AI Agent framework. I was responsible for the core design and development of the memory module and skill module, implementing a three-layer semantic memory system, MCP tool dynamic integration, and unified scheduling across 12+ LLMs.

2. **Business Risk AI Intelligent Decision Engine (zfbbizriskagent)**: Alipay's business risk control intelligent agent platform that evolved through five stages from workflow-based SOP orchestration to Agent-generating-Agent. I was responsible for three core modules: memory system, tool system, and RAG retrieval.

3. **Business Risk Intelligent Decision Engine (bizriskide)**: A merchant risk control intelligent decision platform with real-time engine 99th percentile latency <100ms, supporting 100K+ TPS. I was responsible for the design and development of the decision execution core pipeline.

4. **Unified Access Management Platform (uniaccessmng)**: A risk control unified access management platform. I was responsible for the design and development of five modules including requirement approval and alert rule management.

**Previous Work Experience (Nov 2021 - Apr 2023):**
Worked as a Java Backend Developer at Hunan Dingyizhiyuan Technology Co., Ltd., independently responsible for the development of multiple core services for a print device remote management SaaS platform, involving Spring Cloud microservice architecture, MQTT communication, and distributed transactions.

**Education:**
Bachelor's degree in Computer Science and Technology from Jishou University.

I look forward to the opportunity to contribute my skills and experience to your company. Thank you!

---

## 面试要点提示 / Interview Tips

### 核心技术关键词 / Core Technical Keywords
- **AI/LLM**: LLM Agent, RAG, MCP Protocol, Context Engineering
- **Java**: Java 8/21, SOFABoot, CloudEngine, MyBatis
- **Architecture**: Microservices, Distributed Systems, Serverless
- **Infrastructure**: Docker/K8s, Redis/Tair, Lindorm, GeaBase

### 项目亮点 / Project Highlights
- Token消耗降低70%+
- 执行耗时从分钟级降至亚秒级
- 实时引擎99th <100ms
- 支撑10万+ TPS
- 新场景接入从天级降至分钟级

### 工作成果 / Work Achievements
- 设计并实现三层语义记忆系统
- 支持五阶段Agent范式演进
- 实现动态工具热注册机制
- 构建三路语义召回引擎


# 两个版本（英文口述短句 + 一行英文一行中文，汇丰面试，STAR结构，简短好背，二选一即可）
## 版本A：AI Agent项目（单Agent演进到多Agent，推荐，贴合你大模型工程经历）
### STAR精简版
**S（背景）**
As business requirements grew, our original single-agent framework could no longer handle complex collaborative tasks.
随着业务需求增长，原先的单智能体框架无法处理复杂协同任务。

**T（任务）**
We needed to upgrade it to a multi-agent system where different agents can communicate and work together.
我们需要升级为多智能体系统，让多个Agent能够通信、协同工作。

**A（行动，难点+解决方案）**
The main challenge was agent communication and task allocation.
主要难点是Agent之间通信和任务分配。

I designed a lightweight task orchestration layer to split complex jobs and route messages between agents.
我设计了轻量任务编排层，拆分复杂任务，在多个Agent之间转发消息。

I also added context isolation to prevent information interference among different agents.
同时增加上下文隔离，避免不同Agent之间信息互相干扰。

**R（结果）**
After the upgrade, the system supported multi-agent collaboration, and task completion rate improved significantly.
升级完成后，系统支持多Agent协同，任务完成率显著提升。

---
## 版本B：风控决策引擎（高并发流量，削峰、按需调度、读写分离）
### STAR精简版
**S（背景）**
Our risk decision engine served multiple business teams, and traffic spikes brought stability risks.
我们的风控决策引擎对接多个业务方，流量突增带来稳定性风险。

**T（任务）**
I needed to improve system capacity to handle variable high concurrent requests.
我需要提升系统承载力，应对波动的高并发请求。

**A（行动，难点+解决方案）**
The key challenge was uneven traffic from different business channels.
核心难点是各个业务渠道流量不均衡。

I implemented on-demand resource scheduling, traffic throttling for peak load, and read-write separation.
我实现资源按需调度、削峰限流，同时做了读写分离。

**R（结果）**
These measures smoothed traffic pressure, reduced peak response time, and ensured stable service.
这些方案抹平流量压力，降低峰值响应时间，保障服务稳定。

# ✅ 面试口头开场引导句（你可以先说这句，引出故事）
One big challenge I met in the project was system architecture upgrade.
我在项目中遇到的一个比较大的挑战是系统架构升级。

> 💡建议：优先背版本A，和你前面AI Agent项目连贯，技术亮点更贴合现在AI方向，汇丰科技很爱听。
> 如果你想要，我可以再压缩一版**更短极简版**，句子更短，更容易背诵。

要不要我把版本A压缩成超短口语版，每句更短，减少长单词？



Hello, my name is Peng Fan'ao.
您好，我叫彭范傲。

I have 5 years of Java backend development experience and I am currently based in Changsha.
我拥有5年Java后端开发经验，目前定居长沙。

Professional Background:
专业背景：

I specialize in risk control at Ant Group.
我深耕蚂蚁集团风控领域。

I have solid experience building large-scale distributed systems and engineering applications for large language models.
我具备搭建大规模分布式系统以及大模型工程化落地的扎实经验。

I am proficient in the SOFABoot microservice ecosystem.
熟练掌握SOFABoot微服务生态。

I also work with cutting-edge AI engineering technologies, including RAG retrieval augmentation, the MCP protocol, and context engineering.
同时接触前沿AI工程技术，包括RAG检索增强、MCP协议以及上下文工程。

Recent Work Experience (May 2023 - Present):
近期工作经历（2023年5月 - 至今）：

I’m working as a Java Backend Engineer in the Terminal Risk Control Technology Department at Digital Mali.
任职数字马力终端风控技术部Java后端工程师。

I take charge of several core projects:
负责多个核心项目：

1. Digital Employee Project: This is an ultra-lightweight AI Agent framework.
1. 数字员工项目：这是一个轻量级AI Agent框架。

I led the core design and development of the memory module and skill module.
主导记忆模块与技能模块的核心设计与开发。

I implemented a three-layer semantic memory system, dynamic integration of MCP tools, and unified scheduling for more than 12 LLMs.
实现三层语义记忆体系、MCP工具动态接入，以及12个以上大模型的统一调度。

2. Business Risk AI Intelligent Decision Engine (zfbbizriskagent): It is Alipay’s business risk control intelligent agent platform.
2. 业务风险AI智能决策引擎(zfbbizriskagent)：支付宝业务风控智能Agent平台。

It has evolved through five stages, from workflow-based SOP orchestration to Agent-generating-Agent.
项目历经五个阶段迭代，从基于工作流的SOP编排演进到Agent生成Agent。

I was responsible for three core modules: memory system, tool system and RAG retrieval.
负责三大核心模块：记忆系统、工具系统以及RAG检索。

3. Business Risk Intelligent Decision Engine (bizriskide): This merchant risk control intelligent decision platform has a real-time engine with 99th percentile latency under 100ms, supporting over 100K TPS.
3. 业务风险智能决策引擎(bizriskide)：商户风控智能决策平台，实时引擎P99延迟低于100毫秒，支持10万以上TPS。

I designed and developed the core pipeline for decision execution.
设计并开发决策执行的核心流水线。

4. Unified Access Management Platform (uniaccessmng): A unified access management platform for risk control.
4. 统一接入管理平台(uniaccessmng)：风控统一接入管理平台。

I designed and developed five modules, including requirement approval and alert rule management.
设计开发包含需求审批、告警规则管理在内的五个模块。

Previous Work Experience (Nov 2021 - Apr 2023):
过往工作经历（2021年11月 - 2023年4月）：

I worked as a Java Backend Developer at Hunan Dingyizhiyuan Technology Co., Ltd.
在湖南鼎易智远科技有限公司担任Java后端开发工程师。

I independently built multiple core services for a print device remote management SaaS platform.
独立搭建打印设备远程管理SaaS平台的多项核心服务。

My work covered Spring Cloud microservice architecture, MQTT communication and distributed transactions.
工作涉及Spring Cloud微服务架构、MQTT通信以及分布式事务。

Education:
教育背景：

I hold a Bachelor’s degree in Computer Science and Technology from Jishou University.
吉首大学计算机科学与技术专业本科。

I look forward to the opportunity to bring my skills and experience to your team. Thank you!
我期待有机会把我的技术与经验带入贵团队。谢谢！
