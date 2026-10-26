---
original_dir: BCN网络接入-riskcyberstaff
---

## 目录

- [一句话概括](#一句话概括)
- [一、解决什么问题](#一解决什么问题)
  - [5 件核心事情](#5-件核心事情)
- [二、为什么不用黑板模式](#二为什么不用黑板模式)
- [三、架构设计](#三架构设计)
  - [BcnChannel（继承 BaseChannel）](#bcnchannel继承-basechannel)
  - [BcnBotConnection（每个 agent 一个 WebSocket）](#bcnbotconnection每个-agent-一个-websocket)
- [四、启动与注册流程](#四启动与注册流程)
- [五、故障切换流程](#五故障切换流程)
- [六、消息处理时序](#六消息处理时序)
  - [chat.send（被 @mention，跨机器处理）](#chatsend被-mention跨机器处理)
  - [chat.send（未被 @mention）/ chat.inject（旁观）](#chatsend未被-mention-chatinject旁观)
  - [chat.history（历史查询）](#chathistory历史查询)
- [七、ZCache Key 设计](#七zcache-key-设计)
- [八、WebSocket 帧协议](#八websocket-帧协议)
  - [bot.connect 握手](#botconnect-握手)
  - [chat.send（BCN → Bot）](#chatsendbcn--bot)
  - [chat.event（Bot → BCN，异步回复）](#chateventbot--bcn异步回复)
- [九、面试高频问题](#九面试高频问题)
- [引用](#引用)

---

> 自动生成：13 张图，由多模态模型 `doubao-seed-2.0-pro` 一次性识别转写。

![image-20260525104024001.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525104024001.png)

# BCN 网络接入设计 — riskcyberstaff

## 一句话概括

让 nanobot 的 Agent 以 bot 身份加入 BCN 协作网络，和其他引擎的 bot 圆桌讨论，同时保证分布式部署下的连接高可用和消息可靠送达。

## 一、解决什么问题

当前 nanobot 的 Agent 只能在单一渠道（钉钉/飞书等）内独立运行，不同 Bot 之间无法协作。BCN 是一个基于 WebSocket 的私有 bot 协调服务，接入后 nanobot 的 agent 可以作为独立 bot 身份加入"圆桌群聊"，和其他引擎的 bot 一起工作。

5 件核心事情

| 能力 | 说明 |
|------|------|

---

![image-20260525104024002.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525104024002.png)

让 nanobot 的 Agent 以 bot 身份加入 BCN 协作网络，和其他引擎的 bot 圆桌讨论，同时保证分布式部署下的连接高可用和消息可靠送达。

当前 nanobot 的 Agent 只能在单一渠道（钉钉/飞书等）内独立运行，不同 Bot 之间无法协作。BCN 是一个基于 WebSocket 的私有 bot 协调服务，接入后 nanobot 的 agent 可以作为独立 bot 身份加入"圆桌群聊"，和其他引擎的 bot 一起工作。

### 5 件核心事情

| 能力 | 说明 |
|------|------|
| Bot 注册 | 指定 team 下的 agent_code 注册为 BCN bot，持久化 token 身份 |
| 消息收发 | 接收 BCN 路由的消息（chat.send），经 AgentLoop 处理后回复（chat.event） |
| 静默旁观 | 未被 @mention 时只写历史不触发 LLM，节省推理成本 |
| 历史查询 | 响应 BCN 的 chat.history 请求，返回会话记录 |
| 分布式高可用 | 多节点部署下，通过 ZCache 分布式锁保证同一 bot 只有一个 WebSocket 连接，故障自动切换 |

## 二、为什么不用黑板模式

黑板模式（共享状态 + 轮询）是最简单的多 Agent 协作方式，nanobot 已有的 `DistributedQueue` 本质上就是黑板。但 BCN 场景下不够用：

| 维度 | 黑板 | BCN 协议 |
|------|------|----------|

---

![image-20260525104024003.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525104024003.png)

| 能力 | 说明 |
|------|------|
| Bot 注册 | 指定 team 下的 agent_code 注册为 BCN bot，持久化 token 身份 |
| 消息收发 | 接收 BCN 路由的消息（chat.send），经 AgentLoop 处理后回复（chat.event） |
| 静默旁观 | 未被 @mention 时只写历史不触发 LLM，节省推理成本 |
| 历史查询 | 响应 BCN 的 chat.history 请求，返回会话记录 |
| 分布式高可用 | 多节点部署下，通过 ZCache 分布式锁保证同一 bot 只有一个 WebSocket 连接，故障自动切换 |

黑板模式（共享状态 + 轮询）是最简单的多 Agent 协作方式，nanobot 已有的 `DistributedQueue` 本质上就是黑板。但 BCN 场景下不够用：

| 维度 | 黑板 | BCN 协议 |
|------|------|----------|
| 实时性 | 轮询，秒级延迟 | 推送，毫秒级 |
| 路由 | 无，各 Bot 自行过滤 | @mention、session、run_id 原生支持 |
| 可靠性 | 写入即忘 | ACK + pending_replies 兜底 |
| 跨引擎 | 需要共享存储 + 约定格式 | 统一协议，各引擎独立实现 |
| 适用场景 | 同框架内简单任务分发 | 多引擎实时协作 |

核心原因：BCN 是已有外部服务，参与圆桌的 Bot 来自不同引擎（不都是 nanobot），不可能共享同一块 Redis/DB 作为黑板。BCN 提供的是跨引擎的统一协议，就像 HTTP 之于浏览器和服务器。

---

![image-20260525104024004.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525104024004.png)

黑板模式（共享状态 + 轮询）是最简单的多 Agent 协作方式，nanobot 已有的 `DistributedQueue` 本质上就是黑板。但 BCN 场景下不够用：

| 维度 | 黑板 | BCN 协议 |
|------|------|----------|
| 实时性 | 轮询，秒级延迟 | 推送，毫秒级 |
| 路由 | 无，各 Bot 自行过滤 | @mention、session、run_id 原生支持 |
| 可靠性 | 写入即忘 | ACK + pending_replies 兜底 |
| 跨引擎 | 需要共享存储 + 约定格式 | 统一协议，各引擎独立实现 |
| 适用场景 | 同框架内简单任务分发 | 多引擎实时协作 |

核心原因：BCN 是已有外部服务，参与圆桌的 Bot 来自不同引擎（不都是 nanobot），不可能共享同一块 Redis/DB 作为黑板。BCN 提供的是跨引擎的统一协议，就像 HTTP 之于浏览器和服务器。

## 三、架构设计

### BcnChannel（继承 BaseChannel）

```
BaseChannel (abstract)
└── BcnChannel
       ├── config: BcnConfig
       ├── _connections: dict[str, BcnBotConnection]
       ├── _zcache: Redis
       ├── _config_store: ConfigurationStore
       ├── start() / stop()
       └── send(msg: OutboundMessage)
              └── 当前机器持有 bcn:conn_lock:{agent_code}?
```

---

![image-20260525104024005.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525104024005.png)

```
BaseChannel (abstract)
└── BcnChannel
       ├── config: BcnConfig
       ├── _connections: dict[str, BcnBotConnection]
       ├── _zcache: Redis
       ├── _config_store: ConfigurationStore
       ├── start() / stop()
       └── send(msg: OutboundMessage)
              ├── 当前机器持有 bcn:conn_lock:{agent_code}?
              │      是 → 直接 ws.send(chat.event)
              │      否 → RPUSH bcn:pending_replies:{agent_code}
```

### BcnBotConnection（每个 agent 一个 WebSocket）

```
BcnBotConnection
   ├── agent_code: str
   ├── _ws: WebSocketClientProtocol | None
   ├── _token: str | None              # 从 rcs_configurations 加载
   ├── _bot_uuid: str | None
   ├── _lock_held: bool
   ├── _recv_task: asyncio.Task | None
   ├── _heartbeat_task: asyncio.Task | None
   ├── _reply_poll_task: asyncio.Task | None
   │
   ├── start() / stop()
   ├── _acquire_lock_loop()           # SETNX 抢锁 + EXPIRE 续锁
   ├── _connect()                      # bot.connect 握手 + token 持久化
   ├── _recv_loop()                    # 接收 BCN 帧并分发
   ├── _heartbeat_loop()               # 60s 发 bot.status
   ├── _reply_poll_loop()              # LPOP bcn:pending_replies
```

---

![image-20260525104024006.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525104024006.png)

```
BcnBotConnection
   ├── agent_code: str
   ├── _ws: WebSocketClientProtocol | None
   ├── _token: str | None              # 从 rcs_configurations 加载
   ├── _bot_uuid: str | None
   ├── _lock_held: bool
   ├── _recv_task: asyncio.Task | None
   ├── _heartbeat_task: asyncio.Task | None
   ├── _reply_poll_task: asyncio.Task | None
   │
   ├── start() / stop()
   ├── _acquire_lock_loop()           # SETNX 抢锁 + EXPIRE 续锁
   ├── _connect()                      # bot.connect 握手 + token 持久化
   ├── _recv_loop()                    # 接收 BCN 帧并分发
   ├── _heartbeat_loop()               # 60s 发 bot.status
   ├── _reply_poll_loop()              # LPOP bcn:pending_replies
   ├── _handle_chat_send(frame)
   ├── _handle_chat_inject(frame)
   └── _handle_chat_history(frame)
```

## 四、启动与注册流程

```
nanobot gateway 启动
        │
        ▼
ChannelManager._init_channels()
        │   bcn.enabled = true
        ▼
BcnChannel.start()
```

---

![image-20260525104024007.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525104024007.png)

```
nanobot gateway 启动
        │
        ▼
ChannelManager._init_channels()
        │   bcn.enabled = true
        ▼
BcnChannel.start()
        │
        ├── 遍历 config.bcn.teams
        │       agent_codes 非空 → 取白名单
        │       agent_codes 为空 → list_agents_by_team(team_code) 取全部 enabled agent
        │
        └── 每个 agent_code 启动 BcnBotConnection
                │
                ├── 从 rcs_configurations 读历史 token
                ├── ZCache SETNX bcn:conn_lock:{agent_code} EX 60
                │       抢到锁 ──→ 建立 WebSocket 连接
                │       │            bot.connect 握手
                │       │            is_new=true → 写 token 到 rcs_configurations
                │       │            is_new=false → 身份恢复
                │       │            启动三个 loop:
                │       │              recv_loop（接收 BCN 消息）
                │       │              heartbeat_loop (60s bot.status)
                │       │              reply_poll_loop (LPOP pending_replies)
                │       未抢到锁 → 后台定时重试抢锁
                └── done
```

## 五、故障切换流程

```
Machine X 宕机
```

---

![image-20260525104024008.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525104024008.png)

```
Machine X 宕机
        │
        ▼
bcn:conn_lock:{agent_code} 60s 后自动过期
        │
        ▼
Machine Y 抢到锁
        ├── 从 rcs_configurations 读 token
        ├── WebSocket 重连，携带 token
        ├── BCN 返回 is_new=false，身份不变
        └── 接管 bcn:pending_replies:{agent_code} 的轮询
            （ZCache 中已有的未发回复不丢失）
```

关键：故障切换时间 = 锁 TTL（60s）+ 抢锁重试间隔。token 持久化保证重连后身份不变，pending_replies 队列保证消息不丢失。

## 六、消息处理时序

### chat.send（被 @mention，跨机器处理）

```
BCN          Machine X (持锁)        ZCache              Machine Y (处理队列)
 │                │                    │                       │
 │─chat.send─────▶│                    │                       │
 │                │──SET bcn:req_seen─▶│                       │
 │                │──SET bcn:run─────▶│                       │
 │                │──SET bcn:chat_agent▶│                     │
 │◀─ACK(run_id)──│                    │                       │
 │                │──RPUSH session_tasks▶│                    │
 │                │                    │◀─LPOP active_sess────│
 │                │                    │                       │  AgentLoop 处理
```

---

![image-20260525104024009.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525104024009.png)

```
BCN          Machine X (持锁)        ZCache              Machine Y (处理队列)
 │                │                    │                       │
 │─chat.send─────▶│                    │                       │
 │                │──SET bcn:req_seen─▶│                       │
 │                │──SET bcn:run─────▶│                       │
 │                │──SET bcn:chat_agent▶│                     │
 │◀─ACK(run_id)──│                    │                       │
 │                │──RPUSH session_tasks▶│                    │
 │                │                    │◀─LPOP active_sess────│
 │                │                    │                       │  AgentLoop 处理
 │                │                    │◀─GET bcn:chat_agent──│
 │                │                    │◀─GETDEL bcn:run──────│
 │                │                    │◀─RPUSH pending_rep───│
 │                │◀─LPOP pending_rep──│                       │
 │◀─chat.event──│                     │                       │
 │   (state=final)│                   │                       │
```

### chat.send（未被 @mention）/ chat.inject（旁观）

```
BCN          Machine X (持锁)              ConversationStore
 │                │                              │
 │─chat.send────▶│  (you_are_mentioned=false)   │
 │◀─ACK({})─────│                               │
 │                │─add(role=user)──────────────▶│  写历史，不触发 AgentLoop
```

### chat.history（历史查询）

```
BCN          Machine X (持锁)        ConversationStore
```

---

![image-20260525104024010.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525104024010.png)

```
BCN          Machine X (持锁)        ConversationStore
 │                │                          │
 │─chat.history─▶│                          │
 │                │  (session_key, limit)   │
 │                │──get_messages──────────▶│
 │                │◀─[{role,content,ts}]────│
 │◀─res(messages)│                          │
```

## 七、ZCache Key 设计

| Key | TTL | 用途 |
|-----|-----|------|
| `bcn:conn_lock:{agent_code}` | 60s | 连接锁，保证单节点持 WS |
| `bcn:pending_replies:{agent_code}` | 无 | 回复队列，RPUSH/LPOP |
| `bcn:req_seen:{req_id}` | 300s | 请求去重，防重复处理 |
| `bcn:run:{run_id}` | 300s | run 上下文，ACK 与回复关联 |
| `bcn:chat_agent:{session_key}` | 300s | 会话路由，记录处理该会话的 agent |

## 八、WebSocket 帧协议

三种帧类型：req（发起请求）、res（回应 req）、event（单向推送）

### bot.connect 握手

---

![image-20260525104024011.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525104024011.png)

三种帧类型：req（发起请求）、res（回应 req）、event（单向推送）

```json
// 首次连接
{"type": "req", "id": "1", "method": "bot.connect", "params": {"protocol_version": 1}}

// 重连（携带历史 token）
{"type": "req", "id": "1", "method": "bot.connect", "params": {"token": "tok-abc123", "protocol_version": 1}}

// BCN 响应
{"type": "res", "id": "1", "ok": true, "payload": {"is_new": false, "token": "tok-abc123", "bot_uuid": "bot-xyz789"}}
```

### chat.send（BCN → Bot）

```json
{"type": "req", "id": "chat-001", "method": "chat.send",
 "params": {
    "bcs_group_id": "grp-456",
    "session_key": "sess-123",
    "message": {"role": "user", "content": [{"type":"text","text":"@bot 分析死锁"}], "timestamp": 1710960000000},
    "session_context": {"you_are_mentioned": true, "is_sender": false}
 }}

// Bot 立即 ACK (200ms 内)
{"type": "res", "id": "chat-001", "ok": true, "payload": {"run_id": "run-xxx"}}
```

### chat.event（Bot → BCN，异步回复）

```json
{"type": "event", "event": "chat.event",
 "payload": {
    "run_id": "run-xxx",
```

---

![image-20260525104024012.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525104024012.png)

```json
{"type": "event", "event": "chat.event",
 "payload": {
    "run_id": "run-xxx",
    "bcs_group_id": "grp-456",
    "state": "final",
    "message": {"role": "assistant", "content": [{"type": "text", "text": "分析结果: ..."}], "timestamp": 1710960001000},
    "stop_reason": "complete"
 },
 "seq": 1}
```

本期只实现 `state: final`，不做流式 delta。

```json
// BCN 查询
{"type": "req", "id": "hist-001", "method": "chat.history", "params": {"session_key": "sess-123", "limit": 50}}

// Bot 响应
{"type": "res", "id": "hist-001", "ok": true,
 "payload": {
    "session_key": "sess-123",
    "session_id": "grp-456",
    "messages": [
        {"role": "user", "content": "请分析死锁", "timestamp": 1710960000000},
        {"role": "assistant", "content": "分析结果: ...", "timestamp": 1710960001000}
    ]
 }}
```

## 九、面试高频问题

---

![image-20260525104024013.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525104024013.png)

```json
// BCN 查询
{"type": "req", "id": "hist-001", "method": "chat.history", "params": {"session_key": "sess-123", "limit": 50}}

// Bot 响应
{"type": "res", "id": "hist-001", "ok": true,
 "payload": {
    "session_key": "sess-123",
    "session_id": "grp-456",
    "messages": [
        {"role": "user", "content": "请分析死锁", "timestamp": 1710960000000},
        {"role": "assistant", "content": "分析结果: ...", "timestamp": 1710960001000}
    ]
 }}
```

**Q: 为什么不用黑板模式？** A: 三个原因：实时性（推 vs 拉）、路由语义（@mention/run_id 黑板做不到）、跨引擎（BCN 是外部服务，参与方不都是 nanobot，不可能共享 Redis）。黑板适合同框架内任务分发，BCN 解决的是跨引擎实时协作。

**Q: 分布式锁故障切换的延迟怎么控制？** A: 锁 TTL 60s，续锁间隔 30s。故障切换时间 = 锁剩余 TTL + 抢锁重试间隔，最坏情况约 60s。token 持久化保证重连后身份不变，pending_replies 队列保证消息不丢失。

**Q: 跨机器回复怎么解决？** A: 处理 AgentLoop 的机器可能不是持 WebSocket 连接的机器。回复先 RPUSH 到 `bcn:pending_replies:{agent_code}`，持锁节点轮询 LPOP 后通过 WS 发出。这样即使消息处理和 WS 连接在不同机器上，回复也不会丢失。

**Q: 静默旁观怎么实现？** A: chat.send 帧的 `session_context.you_are_mentioned` 字段。为 true 时触发 AgentLoop 处理，为 false 时只写 ConversationStore 不触发 LLM。chat.inject 也是旁观模式，同样只写历史。

**Q: 本期为什么只实现 state: final？** A: 流式 delta 需要更复杂的协议设计（序列号、分片、中断处理），且 LLM 流式输出的 chunk 对齐和错误处理比较复杂。先实现 final 保证核心链路可用，流式作为后续优化。

## 引用
