---
layout: false
---

# SSE vs HTTP / HTTPS / WebSocket 协议对比

## 目录

- [一、SSE 是什么](#一sse-是什么)
- [二、SSE 工作原理](#二sse-工作原理)
- [三、SSE 数据格式详解](#三sse-数据格式详解)
- [四、SSE 代码示例](#四sse-代码示例)
- [五、SSE 核心特性](#五sse-核心特性)
- [六、四者核心对比](#六四者核心对比)
- [七、SSE vs WebSocket 深度对比](#七sse-vs-websocket-深度对比)
- [八、HTTPS 与其他三者的关系](#八https-与其他三者的关系)
- [九、选型决策树](#九选型决策树)
- [十、典型业务场景](#十典型业务场景)
- [十一、SSE 的坑与最佳实践](#十一sse-的坑与最佳实践)

---

## 一、SSE 是什么

SSE（Server-Sent Events）是一种基于 HTTP 的**服务器单向推送**协议，2015 年纳入 HTML5 标准。

核心思想：客户端发起一个普通 HTTP 请求，服务端**不关闭连接**，持续往响应体里写数据，浏览器通过 `EventSource` API 实时接收。

```
传统 HTTP：  客户端 → 请求 → 服务器 → 响应 → 连接结束
SSE：        客户端 → 请求 → 服务器 → 响应1 → 响应2 → 响应3 → ...（不断开）
```

一句话：**SSE 就是一个永远不结束的 HTTP 响应**。

---

## 二、SSE 工作原理

### 2.1 连接建立

```
客户端                                    服务器
  │                                         │
  │  GET /events HTTP/1.1                   │
  │  Accept: text/event-stream             │
  │  ────────────────────────────────────→  │
  │                                         │
  │  HTTP/1.1 200 OK                        │
  │  Content-Type: text/event-stream        │
  │  Cache-Control: no-cache                │
  │  Connection: keep-alive                 │
  │  ←────────────────────────────────────  │
  │                                         │
  │  data: {"msg": "hello"}                 │
  │  ←────────────────────────────────────  │
  │                                         │
  │  data: {"msg": "world"}                 │
  │  ←────────────────────────────────────  │
  │           （连接持续，不断开）             │
```

### 2.2 与长轮询的区别

```
长轮询：客户端请求 → 服务器挂起 → 有数据才响应 → 连接断开 → 客户端重新请求
SSE：   客户端请求 → 服务器持续推送 → 连接不断开
```

| 维度 | 长轮询 | SSE |
|------|--------|-----|
| 连接数 | 每次响应后重新建立 | 一次建立，持续复用 |
| 延迟 | 重新连接有延迟 | 近乎实时 |
| 开销 | 频繁建连，header重复 | 一次header，后续纯数据 |
| 复杂度 | 服务端需挂起请求 | 浏览器原生支持 |

---

## 三、SSE 数据格式详解

SSE 响应的 `Content-Type` 为 `text/event-stream`，数据格式是纯文本，由 **field: value** 组成，每条消息以空行 `\n\n` 分隔。

### 3.1 支持的字段

| 字段 | 作用 | 示例 |
|------|------|------|
| `data` | 消息数据（核心字段） | `data: hello` |
| `event` | 事件类型（默认 message） | `event: update` |
| `id` | 事件ID，用于断线重连 | `id: 42` |
| `retry` | 重连间隔（毫秒） | `retry: 3000` |

### 3.2 消息格式示例

```
// 最简单的消息
data: hello world\n\n

// 多行数据（data出现多次，用\n拼接）
data: {"name": "张三",\n
data:  "age": 25}\n\n

// 带事件类型
event: price\n
data: {"BTC": 65000}\n\n

// 带事件ID（断线重连时浏览器自动带上 Last-Event-ID）
id: 100\n
event: notification\n
data: 新订单到达\n\n

// 设置重连间隔
retry: 5000\n\n
```

### 3.3 解析规则

```
1. 每条消息以空行（\n\n）分隔
2. 同一消息内多个 data 字段，值用 \n 拼接
3. id 字段会作为 Last-Event-ID，断线重连时自动发送
4. 注释行以冒号开头（: keepalive），可用于心跳保活
```

---

## 四、SSE 代码示例

### 4.1 前端（浏览器）

```javascript
// 基本用法
const source = new EventSource('/api/events');

source.onmessage = (event) => {
    console.log(event.data);       // 消息数据
    console.log(event.lastEventId); // 最后的事件ID
};

// 监听自定义事件
source.addEventListener('price', (event) => {
    console.log('价格更新:', event.data);
});

source.addEventListener('notification', (event) => {
    console.log('通知:', event.data);
});

// 连接状态
source.onopen = () => console.log('连接建立');
source.onerror = (e) => {
    if (source.readyState === EventSource.CONNECTING) {
        console.log('正在重连...');  // 浏览器自动重连！
    }
};

// 关闭连接
source.close();
```

### 4.2 后端（Spring Boot）

```java
@GetMapping(value = "/events", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
public SseEmitter events() {
    SseEmitter emitter = new SseEmitter(0L); // 0=不超时

    // 发送消息
    executor.submit(() -> {
        try {
            int id = 0;
            while (true) {
                SseEmitter.SseEventBuilder event = SseEmitter.event()
                    .id(String.valueOf(++id))
                    .name("price")
                    .data("{\"BTC\": " + getPrice() + "}")
                    .reconnectTime(3000);  // 重连间隔
                emitter.send(event);
                Thread.sleep(1000);
            }
        } catch (Exception e) {
            emitter.completeWithError(e);
        }
    });

    // 断开回调
    emitter.onCompletion(() -> log.info("连接关闭"));
    emitter.onTimeout(() -> log.info("连接超时"));

    return emitter;
}
```

### 4.3 后端（Node.js）

```javascript
app.get('/events', (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });

    // 心跳保活（防止代理/负载均衡器断开连接）
    const heartbeat = setInterval(() => {
        res.write(': keepalive\n\n');
    }, 15000);

    let id = 0;
    const sendEvent = () => {
        res.write(`id: ${++id}\n`);
        res.write('event: price\n');
        res.write(`data: ${JSON.stringify({ BTC: getPrice() })}\n\n`);
    };

    const timer = setInterval(sendEvent, 1000);

    req.on('close', () => {
        clearInterval(timer);
        clearInterval(heartbeat);
    });
});
```
---

## 五、SSE 核心特性

### 5.1 自动重连

```
连接断开
  → 浏览器自动重连（默认3秒，可通过 retry 字段自定义）
  → 重连时自动带上 Last-Event-ID 请求头
  → 服务端据此从断点续传
```

这是 SSE 相比 WebSocket **最大的优势之一**——不需要自己写重连逻辑。

### 5.2 事件类型

```javascript
// 服务端可以发送不同类型的事件
event: message
data: 普通消息

event: update
data: 更新数据

event: alert
data: 告警信息

// 前端分别监听
source.addEventListener('message', handler1);
source.addEventListener('update', handler2);
source.addEventListener('alert', handler3);
```

### 5.3 浏览器兼容性

| 浏览器 | 支持情况 |
|--------|---------|
| Chrome | ✅ |
| Firefox | ✅ |
| Safari | ✅ |
| Edge | ✅ |
| IE | ❌（需 polyfill） |

### 5.4 连接数限制

SSE 基于HTTP，受浏览器同域名并发连接数限制（HTTP/1.1 默认 **6个**）。HTTP/2 下无此限制。

---

## 六、四者核心对比

| 维度 | HTTP | HTTPS | WebSocket | SSE |
|------|------|-------|-----------|-----|
| **通信方向** | 请求-响应（单向） | 同HTTP | 全双工（双向） | 服务器→客户端（单向） |
| **协议层** | 应用层 | HTTP + TLS | 独立协议（ws://） | 基于HTTP |
| **连接生命周期** | 短连接/keep-alive | 同HTTP | 持久连接 | 持久连接 |
| **数据格式** | 任意 | 任意（加密传输） | 文本 + 二进制 | 纯文本 |
| **断线重连** | 无需（每次新建） | 无需 | 需自己实现 | **浏览器自动重连** |
| **事件ID** | 无 | 无 | 无 | **原生支持**（Last-Event-ID） |
| **连接数限制** | 6个/域名 | 同HTTP | 无限制 | 6个/域名（HTTP/1.1） |
| **代理/防火墙** | 友好 | 友好 | 可能被拦截 | 友好（就是HTTP） |
| **实现复杂度** | 低 | 低 | 高 | 低 |

---

## 七、SSE vs WebSocket 深度对比

这是最关键的选择，展开对比：

| 维度 | SSE | WebSocket |
|------|-----|-----------|
| **通信方向** | 单向（服务器→客户端） | 双向 |
| **协议** | 基于HTTP，无需升级 | 需HTTP升级握手（101 Switching Protocols） |
| **数据类型** | 纯文本 | 文本 + 二进制（ArrayBuffer/Blob） |
| **自动重连** | ✅ 浏览器原生 | ❌ 需自己实现 |
| **事件ID** | ✅ 原生 Last-Event-ID | ❌ 需自己实现 |
| **事件类型** | ✅ 原生 event 字段 | ❌ 需在数据里自己定义 |
| **心跳保活** | 注释行（: ping） | ping/pong 帧 |
| **连接数** | 6个/域名（HTTP/1.1） | 无限制 |
| **代理兼容** | ✅ 好兼容（纯HTTP） | ⚠️ 部分代理不支持 |
| **二进制传输** | ❌ | ✅ |
| **客户端发送** | ❌ 需另开HTTP请求 | ✅ 直接发送 |
| **适用场景** | 推送通知、行情、日志 | 聊天、游戏、协同编辑 |

### 什么时候用 SSE？

- 只需要服务器往客户端推数据
- 需要自动重连（断线恢复）
- 数据是文本格式（JSON等）
- 想要最简单的实现

### 什么时候必须用 WebSocket？

- 客户端也要频繁发数据给服务器
- 需要传二进制数据（音视频、文件）
- 需要同时维持大量连接（>6个域名限制）
- 实时双向交互（聊天、游戏）

---

## 八、HTTPS 与其他三者的关系

HTTPS 不是同一层的概念——它是 **安全传输层**，可以叠加在任何协议上：

```
HTTP  + TLS = HTTPS        → 加密的普通请求响应
WS    + TLS = WSS          → 加密的双向通信
SSE   + TLS = SSE over HTTPS → 加密的服务器推送（只需把服务端换成https即可）
```

```
         安全层
           │
    ┌──────┴──────┐
    │    TLS      │
    └──────┬──────┘
           │
  ┌────────┼────────┐
  │        │        │
 HTTP    WS协议   SSE(基于HTTP)
  │        │        │
HTTPS    WSS    SSE over HTTPS
```

**关键点：SSE 天然支持 HTTPS，无需任何额外配置，只需服务端启用 HTTPS 即可。**

---

## 九、选型决策树

```
需要服务器主动推送数据？
├─ 否 → HTTP / HTTPS（普通请求响应）
└─ 是
    ├─ 客户端也需要频繁发数据？
    │   ├─ 是（聊天、游戏、协同编辑）→ WebSocket / WSS
    │   └─ 否
    │       ├─ 需要传二进制数据？
    │       │   ├─ 是 → WebSocket
    │       │   └─ 否
    │       │       ├─ 需要自动重连 + 事件类型？
    │       │       │   ├─ 是 → SSE
    │       │       │   └─ 否 → 长轮询也行
    │       │       └─ 连接数 > 6个/域名 且 HTTP/1.1？
    │       │           ├─ 是 → WebSocket
    │       │           └─ 否 → SSE
    └─ 安全要求？
    └─ 是 → HTTPS / WSS / SSE over HTTPS
```

---

## 十、典型业务场景

| 场景 | 选择 | 原因 |
|------|------|------|
| 股票/币价实时推送 | **SSE** | 单向推送，自动重连，JSON文本 |
| 系统通知/消息提醒 | **SSE** | 服务器推送即可，简单可靠 |
| 实时日志/事件流 | **SSE** | 单向文本流，EventSource天然适合 |
| AI 流式输出（ChatGPT） | **SSE** | 服务器逐token推送，前端逐字显示 |
| ChatGPT 风格对话 | **SSE** | 用户发一次请求，服务端流式返回 |
| 即时通讯/聊天 | **WebSocket** | 双向通信，客户端也要频繁发消息 |
| 多人在线游戏 | **WebSocket** | 双向 + 低延迟 + 二进制数据 |
| 协同编辑（在线文档） | **WebSocket** | 双向实时同步 |
| 视频直播弹幕 | **WebSocket** | 双向 + 高并发 |
| 普通API调用 | **HTTP/HTTPS** | 一问一答，无需推送 |

---

## 十一、SSE 的坑与最佳实践

### 坑1：代理/负载均衡器超时断开

Nginx 默认 60 秒无数据就断开，需要配置：

```nginx
location /events {
    proxy_pass http://backend;
    proxy_http_version 1.1;
    proxy_set_header Connection '';
    proxy_buffering off;           # 关闭缓冲，数据直接透传
    proxy_read_timeout 86400s;     # 超时设为24小时
    proxy_send_timeout 86400s;
}
```

### 坑2：HTTP/1.1 连接数限制

浏览器对同一域名最多 6 个 SSE 连接。解决方案：

- 使用 HTTP/2（无此限制）
- 使用不同子域名
- 合并多个事件流到一个连接（用 event 字段区分）

### 坑3：忘记心跳保活

中间件可能静默断开空闲连接，必须发心跳：

```
: keepalive\n\n    ← 每15秒发一次，冒号开头是注释，浏览器不触发事件
```

### 坑4：SSE 不支持 POST

`EventSource` 只支持 GET 请求。如果需要带复杂参数：

- 用 WebSocket
- 先 POST 创建资源，再 GET 订阅事件流
- 使用 fetch + ReadableStream 手动解析 SSE

### 最佳实践清单

```
✅ 始终设置 retry 字段（建议 3000-5000ms）
✅ 始终设置 id 字段（支持断线续传）
✅ 始终发心跳保活（: keepalive）
✅ Nginx/网关配置 proxy_buffering off
✅ 设置合理的超时时间
✅ 服务端处理 onCompletion/onTimeout 回调清理资源
❌ 不要用 SSE 传大数据/二进制
❌ 不要在 HTTP/1.1 下开超过 6 个连接
❌ 不要忘记处理连接异常断开
```
