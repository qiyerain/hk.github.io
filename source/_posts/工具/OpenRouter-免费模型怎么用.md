---
title: OpenRouter 的免费模型怎么用：18 个能聊天，17 个能进 agent
date: 2026-10-24 13:40:00
article_id: 72e1fbcd-605f-50ca-a454-7688ad2f6f79
categories:
  - 工具
tags:
  - OpenRouter
  - 免费模型
  - LLM
  - Agent
  - API
cover: https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/blog/openrouter-free-cover-1600x900.png
top_img: https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/blog/openrouter-free-cover-1600x900.png
cover_alt: OpenRouter 20 个零价条目里 18 个可聊天、17 个支持工具调用的概览图
description: 我实时查了 OpenRouter 的 469 个模型，20 个零价条目里 18 个能聊天、17 个能进 agent。这篇讲清楚怎么按任务挑、三条接入路径怎么配、接上之后怎么验收，以及免费换来的四个约束。
---

> **免费模型省下的不是钱，是试错成本。**

我把 OpenRouter 的模型目录拉下来数了一遍：469 个模型，prompt 和 completion 价格都是 0 的有 20 个。其中两个是音乐生成，真正能对话的是 18 个。

这 18 个里有 17 个支持工具调用。也就是说，它们不只是"能聊"，而是能进 agent 循环，跑多步任务。

但免费是有代价的，而且代价不在账单上。这篇文章按"挑、接、验、防"四步走一遍，把能用和不能用的边界说清楚。

> **一句话看懂：`:free` 是独立端点，有独立限额；先按任务挑模型，再按客户端接端点，最后用证据验收，而不是靠感觉。**

## 目录

- [一、先把账算清楚](#一、先把账算清楚)
- [二、按任务挑模型](#二、按任务挑模型)
- [三、三条接入路径](#三、三条接入路径)
- [四、接上之后怎么验收](#四、接上之后怎么验收)
- [五、免费的四个约束](#五、免费的四个约束)
- [六、我的使用策略](#六、我的使用策略)
- [清单](#清单)

---

## 一、先把账算清楚

统计口径很简单：`pricing.prompt == 0` 且 `pricing.completion == 0`。

按这个口径，20 个条目里：

- **18 个是聊天模型**，能正常发消息、接工具。
- **2 个是 Google Lyria 音乐生成**，token 价是 0，但实际按首收费：完整歌曲 $0.08/首，30 秒片段 $0.04/段。

第二条最容易被误读。看到 `pricing` 全是 0 就以为免费，结果月末发现有消费——因为它的计费单位不是 token。

这也是我写这篇的第一个动机：**免费和"计价器显示为零"是两件事。**

## 二、按任务挑模型

18 个模型的能力差距很大：上下文从 65k 到 1M，参数从 2.6B 到 975B。硬用一个"最强"去跑所有任务，通常是最慢的方案。

![按任务挑：四类免费模型，各有各的强项](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/blog/openrouter-free-matrix-v2-1200x675.png)

我的分法是四类。

**要通读整仓库、对比长文档**，用 1M 上下文里推理最强的三个：`thinkingmachines/inkling:free`（975B MoE，41B 激活）、`nvidia/nemotron-3-ultra-550b-a55b:free`（550B MoE，55B 激活）、`thinkingmachines/inkling-small:free`（276B MoE）。

这类模型的体验是"想得深但等得久"。我一般只在需要它一次看完几十个文件时才用。

**要改代码、跑测试、读报错再改**，用 Poolside 的两个编码模型：`laguna-s-2.1:free`（118B，8B 激活，Terminal-Bench 2.1 得分 70.2%）和 `laguna-xs-2.1:free`。它们是为 agent 场景训练的，工具调用的形状比通用模型稳。

**要看截图、票据、视频片段**，用 `nvidia/nemotron-3.5-super-vl:free`（支持文本、图像、视频输入）、`google/gemma-4-31b-it:free`、`dots-studio/dots-3-note-preview:free`（512k 上下文）。

**要跑批量抽取、分类、子代理**，用小的：`nvidia/nemotron-3.5-lightning:free`（30B MoE，3B 激活）、`liquid/lfm-2.5-2.6b:free`（65k 上下文，适合短文本任务）。

完整的 18 个在这张表里，按上下文从大到小排：

| 模型 | 上下文 | 工具 |
| --- | --- | --- |
| `thinkingmachines/inkling:free` | 1M | ✅ |
| `thinkingmachines/inkling-small:free` | 1M | ✅ |
| `nvidia/nemotron-3-ultra-550b-a55b:free` | 1M | ✅ |
| `nvidia/nemotron-3.5-lightning:free` | 1M | ✅ |
| `nvidia/nemotron-3.5-super-vl:free` | 1M | ✅ |
| `dots-studio/dots-3-note-preview:free` | 512k | ✅ |
| `nvidia/nemotron-3-super-120b-a12b:free` | 262k | ✅ |
| `google/gemma-4-26b-a4b-it:free` | 262k | ✅ |
| `google/gemma-4-31b-it:free` | 262k | ✅ |
| `poolside/laguna-s-2.1:free` | 262k | ✅ |
| `poolside/laguna-xs-2.1:free` | 262k | ✅ |
| `recursive/flint-v1.0:free` | 262k | ✅ |
| `xingchen-agi/xing4.0-29b-a4b:free` | 262k | ✅ |
| `cohere/north-mini-code:free` | 256k | ✅ |
| `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free` | 256k | ✅ |
| `openrouter/free` | 200k | ✅ |
| `nvidia/nemotron-3.5-content-safety:free` | 128k | ❌ |
| `liquid/lfm-2.5-2.6b:free` | 65k | ✅ |

最后一行值得单独说：`content-safety` 是 4B 的内容审核模型，唯一不支持 tools 的聊天条目。它适合做护栏，不适合当主模型。

还有一个 `openrouter/free` 是路由器：随机从可用免费模型里挑一个，还会过滤掉不适合当前请求的。它适合"我就想跑通一下"，不适合做评测——每次跑到的模型可能不一样。

## 三、三条接入路径

OpenRouter 只暴露一个 OpenAI 兼容端点：`https://openrouter.ai/api/v1`。所以能不能接，取决于你的客户端支不支持自定义 `base_url`。

![三条接入路径，一个 OpenAI 兼容端点](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/blog/openrouter-endpoint-paths-1200x675.png)

**路径一：OpenCode。**

OpenCode 的模型名带 provider 前缀，OpenRouter 的模型长这样：`openrouter/thinkingmachines/inkling:free`。配置好 key 之后，选全名就行。

这条路径最省事，因为工具调用、流式、图片输入都是它自己处理的。

**路径二：Codex + CC Switch。**

如果你习惯用 Codex，可以在 CC Switch 里加一个自定义供应商：

- `base_url`：`https://openrouter.ai/api/v1`
- `wire_api`：`chat`
- `apiKey`：`sk-or-` 开头的那串

`wire_api` 选 `chat`，对应的是 `/chat/completions`，不是 `/responses`。

**路径三：curl 或 OpenAI SDK。**

脚本、批处理、评测用这条最直接：

```bash
curl -s https://openrouter.ai/api/v1/chat/completions \
  -H "Authorization: Bearer $OPENROUTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "thinkingmachines/inkling:free",
    "messages": [{"role": "user", "content": "用三句话解释什么是会话日志"}]
  }'
```

模型名一定要写全 id，`:free` 后缀不能省。省了就是另一个（付费的）端点，或者直接 404。

## 四、接上之后怎么验收

这一步最多人跳过。免费模型的失败往往是静默的：请求成功、返回正常、账单为零，但结果不能用。

![接上之后：三步确认，再谈能不能用](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/blog/openrouter-checks-1200x675.png)

我的三步：

**第一步，查这把 key 的额度和用量。**

```bash
curl -s -H "Authorization: Bearer $OPENROUTER_KEY" \
  https://openrouter.ai/api/v1/key
```

返回值里有限额和使用量。先看这个，比等 429 再猜要快。

**第二步，发一个最小请求，看响应里的 `model` 字段。**

这是唯一能证明"我确实用到了想用的模型"的证据。如果用 `openrouter/free`，响应里的 `model` 很可能不是你预期的那个。

**第三步，打开 tools 跑一轮真实小任务。**

支持 tools 不等于工具调用可用。参数拼错、模型不支持某种 JSON schema、上游版本差异，都会让它退化成纯文本回答。跑一个"列目录再读文件"的小任务，比看文档可靠。

常见红灯我对了个表：

- `429`：免费额度或并发打满，等一会儿或换模型。
- `404`：模型 id 少了 `:free` 后缀。
- `403`：key 没开通，或者来源受限。
- `5xx`：上游在切换，重试一次，还不行就换。

判定标准只有一条：**能在你的真实任务里稳定产出可验证结果，才算能用。** 能返回，只说明网络通。

## 五、免费的四个约束

**约束一：额度按账号算，不按模型算。**

`:free` 端点是独立端点，有自己的每日请求上限。具体数字跟账号状态有关，所以别抄别人的数字，去 `/api/v1/key` 看自己的。

**约束二：高峰会排队。**

免费流量优先级低于付费。我遇到过同一个请求白天超时、凌晨秒回。跑长任务尽量避开高峰。

**约束三：上游会换，而且免费端点有到期日。**

同一个模型 id 背后可能挂多个 provider。我这次快照里就有三个免费条目带到期时间：`laguna-s-2.1:free` 和 `laguna-xs-2.1:free` 到 2026-10-31，`dots-3-note-preview:free` 到 2026-12-31。

这意味着**不能把免费端点写死进生产流程**。今天能跑的方案，下周可能就不存在了。

**约束四：日志与数据策略更宽松。**

免费通道通常伴随更宽松的保留策略。内部代码、客户数据、未公开的方案，不要走免费通道。这不是阴谋论，是成本结构的必然结果——免费额度由谁承担，数据就要相应地被处理。

## 六、我的使用策略

跑了一段时间之后，我固定成四条：

1. **主任务用付费模型，副任务用免费。** 写代码、改线上配置这类事，稳定性比省钱重要。
2. **免费模型只做"能验证"的活。** 摘要、抽取、分类、批量改写——结果对不对一眼能看出来。
3. **模型 id 写全，不用路由器。** 评测和回归需要确定性，`openrouter/free` 每次可能不同。
4. **把到期日记进提醒。** 免费端点有生命周期，方案里留一条"换模型"的退路。

还有一个反直觉的结论：免费模型最适合的场景，不是"省钱"，而是**"降低尝试门槛"**。想试一个新模型值不值得用，先跑免费版，跑通了再换付费版，这个流程比看榜单有用。

## 清单

- [ ] 用 `/api/v1/models` 确认当前哪些条目价格为零（别用旧文章里的名单）
- [ ] 按任务类型挑模型，不要一个模型打天下
- [ ] 模型名写全 id，带 `:free`
- [ ] 用 `/api/v1/key` 查自己的额度，不抄别人的数字
- [ ] 发一个最小请求，确认响应里的 `model` 字段
- [ ] 跑一轮真实 tools 任务，确认工具调用没退化
- [ ] 检查免费端点的到期时间
- [ ] 内部代码和客户数据不走免费通道

## 引用

- 模型目录：`https://openrouter.ai/api/v1/models`（本文数据为 2026-10-24 快照，共 469 个模型）
- 额度查询：`https://openrouter.ai/api/v1/key`
- 限流说明：`https://openrouter.ai/docs/api-reference/limits`
- 免费变体说明：`https://openrouter.ai/docs/faq`（`:free` 是独立变体，有自己的限流）
