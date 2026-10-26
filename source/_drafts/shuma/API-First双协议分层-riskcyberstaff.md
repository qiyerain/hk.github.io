---
original_dir: API-First双协议分层-riskcyberstaff
---

## 目录

  - [API-First Skill Builder — 双协议分层 — riskcyberstaff](#api-first-skill-builder--双协议分层--riskcyberstaff)
    - [一句话概括](#一句话概括)
    - [一、为什么要做这件事](#一为什么要做这件事)
    - [二、核心创新：双协议分层](#二核心创新双协议分层)
      - [为什么不能只选一个？](#为什么不能只选一个)
      - [运行时自动切换：](#运行时自动切换)
    - [三、TR Proxy 架构设计](#三tr-proxy-架构设计)
      - [三个关键设计决策](#三个关键设计决策)
    - [四、5 阶段迁移流程（详）](#四5-阶段迁移流程详)
      - [Phase 1：候选接口发现](#phase-1候选接口发现)
      - [Phase 2：浏览器抓包验证](#phase-2浏览器抓包验证)
      - [Phase 3：流程简化 + API Reference](#phase-3流程简化--api-reference)
        - [步骤 3a：流程简化反思](#步骤-3a流程简化反思)
        - [步骤 3b：生成 API Reference 文档](#步骤-3b生成-api-reference-文档)
      - [Phase 4：脚本 + 集成测试](#phase-4脚本--集成测试)
        - [4a：写脚本骨架（compact_output 留空，input 字段必须溯源）](#4a写脚本骨架compact_output-留空input-字段必须溯源)
        - [4b：运行 --no-compact 获取实际返回 + 验证输入参数](#4b运行---no-compact-获取实际返回--验证输入参数)
        - [4c：基于实际返回设计 compact 字段](#4c基于实际返回设计-compact-字段)
        - [4d：编写集成测试并运行通过](#4d编写集成测试并运行通过)
      - [Phase 5：SKILL.md 改写](#phase-5skillmd-改写)
- [流程步骤](#流程步骤)
- [前置准备](#前置准备)
- [全局规则](#全局规则)
  - [查询策略包](#查询策略包)
  - [[确认] 目标策略包](#确认-目标策略包)
  - [创建过滤策略](#创建过滤策略)
- [异常处理](#异常处理)
    - [全流程一图总结](#全流程一图总结)
        - [每个 Phase 的门禁：](#每个-phase-的门禁)
    - [五、已迁移 Skill 清单](#五已迁移-skill-清单)
    - [六、面试高频问题](#六面试高频问题)
- [引用](#引用)

---

> 自动生成：20 张图，由多模态模型 `doubao-seed-2.0-pro` 一次性识别转写。

![image-20260525100724001.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525100724001.png)

### API-First Skill Builder — 双协议分层 — riskcyberstaff

---

#### 一句话概括

把 nanobot 的 DOM 自动化 Skill（Playwright 浏览器操作）改造为直接调 API 的 Skill，并实现双协议分层：开发环境走 WebGW HTTP 网关调试，生产环境走 TR Proxy 本地 RPC 直连，延迟从 400ms 降到 90ms。

---

#### 一、为什么要做这件事

![image-20260525100724002.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525100724002.png)

原来 nanobot 的风控操作 Skill（处置策略配置、复核规则、风险负责人等）是浏览器自动化模式——Agent 用 Playwright 打开页面、点 Tab、搜索、选下拉、填表单、点保存。三大问题：

1. 慢：每次操作要导航→等待渲染→DOM 操作→等待响应，一个完整流程 30s+
2. 脆：前端改版、元素 ID 变化、加载时序不稳定，导致 Skill 频繁失败
3. 贵：每次操作消耗浏览器实例资源，并发受限

改造为 API-First 后，Agent 直接调后端接口，一个流程从 30s+ 降到 3s 以内。

---

#### 二、核心创新：双协议分层

| 开发环境（本地 Mac，无 MOSN） | 生产环境（服务器，有 MOSN sidecar） |
| ------------------------------ | ----------------------------------- |
| WebGW HTTP 网关                | TR Proxy 本地代理                   |
| POST webgw.alipay.com/{app}/... | POST 127.0.0.1:18799               |
| Cookie: IAM_TOKEN={jwt}        | Body: {app, facade, method, args}  |
| Body: [{请求对象}, {bizContext}] | ↓                                 |
| ↓                              | tr_server.py（常驻进程）            |
| ↓                              | → MosnLayottoClient                |
| ↓                              | → gRPC → MOSN sidecar → 目标服务  |
| ~400ms/次                      | ~90ms/次                            |

![image-20260525100724003.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525100724003.png)

|        | WebGW                                  | TR Proxy                                   |
| ------ | -------------------------------------- | ------------------------------------------ |
| 延迟   | ~400ms（HTTP 网关 + 认证）             | ~90ms（本地代理 + gRPC 直连）             |
| 认证   | 需要 IAM_TOKEN + Referer               | 无需认证（MOSN 处理身份）                 |
| 参数   | JSON 数组位置参数（易出错）            | 强类型命名参数（oneapi 生成）              |
| 前提   | 网络可达 webgw 域名                    | MOSN sidecar 运行中                        |
| 适用   | 开发环境（本地调试）                   | 生产环境（服务器部署）                     |

---

##### 为什么不能只选一个？

- 只选 WebGW：生产环境 400ms 延迟不可接受，且 IAM_TOKEN 需要周期性刷新增加故障点
- 只选 TR Proxy：开发环境（本地 Mac）没有 MOSN sidecar，根本跑不起来

##### 运行时自动切换：

```python
if os.environ.get("API_MODE") == "tr":
    from tr_base import tr_post  # 生产：MOSN 直连
else:
    from webgw_base import webgw_post  # 开发：WebGW 网关
```

---

#### 三、TR Proxy 架构设计

![image-20260525100724004.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525100724004.png)

```
Agent 调用 Skill 脚本
        ↓
tr_call.py --facade X --method Y --args '{}'
        |
        ├─ TCP 探测 127.0.0.1:18799
        │      未启动 → 后台拉起 tr_server.py（~3s init，只一次）
        │      已启动 → 直接 HTTP POST（~90ms）
        ↓
tr_server.py（常驻 HTTP 代理）
        |
        ├─ importlib.import_module("oneapi.{app}.{FacadeName}")
        │      → 加载 oneapi-codegen 生成的强类型 Python 类
        │      → Facade 实例 + module 缓存（同一 Facade 只 import 一次）
        ├─ getattr(mod, "RequestClass")(**args)  ← 命名参数
        ├─ BizContext(tntInstId="10000", operatorId="...")
        └─ facade.method(req, ctx)
```

![image-20260525100724005.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525100724005.png)

```
                ↓
                → MosnLayottoClient.invoke_service_return_struct()
                → gRPC → MOSN sidecar（127.0.0.1:11004） → 目标 Java 服务
                ↓
                resp.data.get_json() → JSON 返回

空闲 60s → 自动退出（省资源）
下次调用 → 自动重新拉起
```

---

##### 三个关键设计决策

1. 动态 import + 缓存：tr_server 不预持有任何 Facade 定义，调用方传字符串参数，server 用 `importlib.import_module` 动态加载。同一 Facade 只 import 一次并缓存。这让一个 tr_server 进程服务所有 Skill。
2. 懒启动 + 自动退出：首次调用时才启动（3s init），空闲 60s 自动退出。零额外资源开销。
3. 强类型 vs 位置参数：WebGW 要求手动拼 JSON 数组（`[{请求对象}, {bizContext}]`），参数顺序必须和 Java 方法签名一致——顺序错了静默失败不报错。TR Proxy 用 oneapi-codegen 生成的强类型类，参数是命名传入，编译期就能发现错误。

---

#### 四、5 阶段迁移流程（详）

以 "处置过滤策略管理"（disposal-filter-strategy-api）为例，走完 5 个 Phase。

---

##### Phase 1：候选接口发现

![image-20260525100724006.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525100724006.png)

**做什么：** 用 OneAPI MCP 查询目标 appName 下有哪些 Facade 和方法，找出可能用到的 API。

**具体步骤：**

1. 确定 appName：zfbpunishcenter
2. 调用 OneAPI MCP 查询 Facade 列表
   → AccessEventFacade、PunishDecisionFacade、FilterStrategyFacade ...
3. 查询 FilterStrategyFacade 的方法列表
   → queryByPage、queryDetail、createStrategy、updateStrategy、updatePackageStatus ...
4. 标记哪些方法可能对应 DOM 操作
   → DOM "搜索策略包" → queryByPage
   → DOM "查看策略详情" → queryDetail
   → DOM "创建过滤策略" → createStrategy
5. 全部标 ⚠ 待验证（OneAPI 的字段名可能和实际请求不一致）

**产出：**

候选 API 列表（按 Facade 分组）：

```
FilterStrategyFacade
⚠ queryByPage(pageNo, pageSize, ...)          → 对应"搜索策略包"
⚠ queryDetail(strategyId)                      → 对应"查看策略详情"
⚠ createStrategy(packageId, strategyConfig)   → 对应"创建过滤策略"
⚠ updateStrategy(strategyId, strategyConfig)  → 对应"编辑过滤策略"
⚠ updatePackageStatus(packageId, status)      → 对应"变更策略包状态"
```

![image-20260525100724007.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525100724007.png)

**关键坑：** OneAPI 记录的是 Java DTO 字段名，经过网关代理后实际传输的字段名可能不同。所以 Phase 1 的结果只是 "候选"，必须 Phase 2 抓包验证。

---

##### Phase 2：浏览器抓包验证

**做什么：** 用 agent-browser 在页面上操作，同时捕获网络请求，拿到真实的 URL、Headers、Request Body、Response Body。

**具体步骤：**

```bash
# 1. 打开页面（保持登录状态）
agent-browser --profile ~/.risk-app open https://risk.alipay.com/strategy/list
agent-browser wait --load networkidle

# 2. 开始录制
agent-browser network har start

# 3. 在页面上执行 DOM 操作
agent-browser snapshot -i                  # 看有哪些元素
agent-browser fill @e4 "测试策略包"       # 搜索框输入
agent-browser click @e5                   # 点击搜索
agent-browser wait --load networkidle

# 4. 查看捕获的 POST 请求
agent-browser network requests --type xhr,fetch --method POST --filter "FilterStrategy"
```

![image-20260525100724008.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525100724008.png)

```bash
# 输出:
# POST https://webgw.alipay.com/zfbpunishcenter/.../FilterStrategyFacade/queryByPage [200]

# 5. 查看完整请求详情
agent-browser network request 1.3 --json

# 拿到真实 Request Body:
# [{"pageNo":1,"pageSize":20,"packageStatus":"EDIT"},{"tntInstId":"10000","operatorId":"pub_zfbpunishcenter_ai_agent"}]

# 拿到真实 Response Body:
# {"success":true,"resultCode":null,"data":{"list":[...],"totalCount":5}}

# 6. 对比 Phase 1 的候选 API
# OneAPI 说参数是 strategyConfig, 实际 Body 是 strategyConfig → ✅ 一致
# OneAPI 说参数是 pageNo, 实际 Body 也是 pageNo → ✅ 一致
# 如果不一致 → 以后者为准，标 ✅ 已验证

# 7. 重复 3-6，验证所有候选 API
```

**产出：**

已验证 API 列表：

```
FilterStrategyFacade
✅ queryByPage
  URL: POST /zfbpunishcenter/.../FilterStrategyFacade/queryByPage
  Body: [{"pageNo":1,"pageSize":20,"packageStatus":"EDIT"}, {bizContext}]
  Response: {"success":true,"data":{"list":[...],"totalCount":5}}
```

![image-20260525100724009.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525100724009.png)

```
✅ createStrategy
  URL: POST /zfbpunishcenter/.../FilterStrategyFacade/createStrategy
  Body: [{"packageId":"PKG001","strategyName":"规则1","filterType":"BLACK_LIST",...}, {bizContext}]
  Response: {"success":true,"data":{"strategyId":"STR001"}}
```

**关键坑：**

- WebGW Body 是位置参数的 JSON 数组 `[{请求对象}, {bizContext}]`，顺序必须和 Java 方法签名一致
- 部分后端没有 `success` 字段，`_post()` 必须兼容
- `IAM_TOKEN + Referer` 缺一不可

---

##### Phase 3：流程简化 + API Reference

**做什么：** 对比原始 DOM 操作和抓包发现的 API，压缩中间步骤，生成三元映射表。

---

###### 步骤 3a：流程简化反思

![image-20260525100724010.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525100724010.png)

原始 DOM 操作（9 步）：
1. 导航到策略管理页面
2. 点击"策略包"Tab
3. 在搜索框输入策略包名称
4. 点击搜索按钮
5. 等待列表加载
6. 点击目标策略包
7. 点击"新建策略"按钮
8. 填写策略表单
9. 点击保存

简化后（3 步）：
1. `queryByPage(packageName)` → 查询策略包
2. [确认] → 展示查询结果，用户确认目标策略包
3. `createStrategy(packageId, config)` → 创建策略

---

**三元映射表：**

| DOM 步骤                 | API 调用                                     | Agent 步骤                           |
| ------------------------ | -------------------------------------------- | ------------------------------------ |
| 导航→点Tab→搜索→等待→点击 | `queryByPage(pageNo, pageSize, packageStatus)` | `query()` 查询策略包                 |
| 点击→填写表单→保存       | `createStrategy(packageId, strategyConfig)`  | [确认] + `act()` 创建策略            |
| 点击→选状态→确认         | `updatePackageStatus(packageId, status)`      | [确认] + `act()` 变更状态            |

**简化原则：**

- 导航步骤全部消除：Agent 不需要 navigate、click tab、wait for load

![image-20260525100724011.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525100724011.png)

- UI 渲染步骤全部消除：Agent 不需要"打开详情页看数据"，一次 API 查询直接拿到
- 合并连续查询：多个 DOM 查询如果对应同一个 API 的不同参数，合并为一次调用
- 保留确认节点：写操作前保留 [确认]，让用户审核关键参数
- 保留业务判断：如果 DOM 流程中有条件分支（如"如果状态为X则执行Y"），在 Agent 步骤中保留该判断逻辑

---

**流程简化模式：**

| 模式                     | 适用场景                 | DOM 典型流程                                   | Agent 简化流程                                   |
| ------------------------ | ------------------------ | ----------------------------------------------- | ------------------------------------------------ |
| 查询→确认→操作→完成      | CRUD 写操作             | 导航→点Tab→搜索→选中→编辑→填字段→保存           | `query()` → [确认] → `act()` → 完成             |
| 查询→格式化输出          | 纯查询/展示类操作       | 导航→等待→读取页面→提取数据                    | `query()` → `format()` → 输出                   |
| 查询→确认→批量操作→汇报 | 批量处理                 | 导航→逐条选中→逐条操作→逐条检查                | `query()` → [确认] → `batch_act()` → 汇报       |
| 查询A→确认→查询B→操作→完成 | 跨系统关联操作        | 导航A→读取→导航B→读取→填入→保存                | `query_a()` → [确认] → `query_b()` → `act()` → 完成 |
| 查询→转换→操作→完成      | 查询结果需转换后再提交 | 导航→读取→复制数据→导航→粘贴→保存              | `query()` → `transform()` → `act()` → 完成      |

---

###### 步骤 3b：生成 API Reference 文档

![image-20260525100724012.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525100724012.png)

产出 `references/api-reference-zfbpunishcenter.md`，包含每个 API 的：

- URL、Method、Headers
- Request Body 字段说明（必须来自 Phase 2 抓包）
- Response Body 结构
- 错误码
- DOM→API→Agent 三元映射表

---

##### Phase 4：脚本 + 集成测试

###### 4a：写脚本骨架（compact_output 留空，input 字段必须溯源）

![image-20260525100724013.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525100724013.png)

```python
# scripts/query_packages.py
from webgw_base import webgw_post, biz_context

def query_packages(token: str, page_no: int = 1, page_size: int = 20,
                   package_status: str = "EDIT") -> dict:
    """查询策略包列表"""
    result = webgw_post(
        token=token,
        facade="FilterStrategyFacade",
        method="queryByPage",
        body=[{"pageNo": page_no, "pageSize": page_size,
               "packageStatus": package_status}, biz_context()]
    )
    return result

def compact_output(data: dict) -> dict:
    # TODO: Phase 4c 填写，先留空
    return data
```

**关键：** `compact_output` 先留空，request body 字段必须来自 Phase 2 抓包，禁止从 OneAPI 推断。

---

###### 4b：运行 --no-compact 获取实际返回 + 验证输入参数

```bash
uv run python scripts/query_packages.py --token a1b2c3 --no-compact
```

拿到真实 API 返回 JSON，贴到对话中作为 compact 设计的依据。必须对比脚本发送的 request body 与 Phase 2 抓包的 request body。

---

###### 4c：基于实际返回设计 compact 字段

![image-20260525100724014.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525100724014.png)

```python
def compact_output(data: dict) -> dict:
    """精简输出，只保留 Agent 需要的字段"""
    packages = data.get("data", {}).get("list", [])
    return {
        "totalCount": data.get("data", {}).get("totalCount", 0),
        "packages": [{
            "packageId": p.get("packageId"),
            "packageName": p.get("packageName"),
            "status": p.get("packageStatus"),
            "version": p.get("versionNo"),
        } for p in packages]
    }
```

**关键：** compact 字段必须来自 4b 中观察到的真实字段名，不得添加 API 返回中不存在的字段。

---

###### 4d：编写集成测试并运行通过

```python
# tests/integration/test_query_packages.py
def test_compact_output_fields():
    """断言 compact 输出包含具体字段名"""
    result = query_packages(token, page_no=1, page_size=5)
    compact = compact_output(result)
    assert "totalCount" in compact
    assert "packages" in compact
    if compact["packages"]:
```

![image-20260525100724015.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525100724015.png)

```python
        pkg = compact["packages"][0]
        assert "packageId" in pkg
        assert "packageName" in pkg
        assert "status" in pkg

def test_request_params_accepted():
    """验证 API 接受脚本发送的输入参数并返回非空业务数据"""
    result = query_packages(token, page_no=1, page_size=5)
    assert result.get("success") is True
    assert result.get("data") is not None
```

**关键：** `test_request_params_accepted` 必须验证 API 返回非空业务数据，空返回视为输入参数可能错误。

---

##### Phase 5：SKILL.md 改写

改造前（DOM 模式）：

```
## 流程步骤

1. 导航到 https://risk.alipay.com/strategy/list
2. 点击"策略包"Tab
3. 在搜索框输入策略包名称，点击搜索
4. 等待列表加载，找到目标策略包
```

![image-20260525100724016.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525100724016.png)

```
5. 点击策略包名称进入详情
6. 点击"新建策略"按钮
7. 填写策略名称、过滤类型、条件表达式
8. 点击保存
9. 等待保存成功提示
```

改造后（API-First 模式）：

```
## 前置准备

1. 使用 get_token 工具获取 token 引用 key
2. 所有脚本位于 scripts/ 目录，通过 uv run python scripts/xxx.py --token {key} 调用
3. Token 异常重试：302/LoginCheckError → get_token(force_refresh=true) 重试 1 次

## 全局规则

- API 调用失败时立即终止流程并反馈错误
- 禁止自行换参数重试、跳过失败步骤、用猜测值填充
- 唯一允许自动重试：token 过期

### 查询策略包
- 执行: uv run python scripts/query_packages.py --token {key} --status EDIT
- 返回策略包列表 (packageId, packageName, status, version)
```

![image-20260525100724017.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525100724017.png)

```
### [确认] 目标策略包
- 展示查询结果，用户确认目标策略包的 packageId

### 创建过滤策略
- 执行: uv run python scripts/create_strategy.py --token {key} --package-id {id} --name "规则1" --type BLACK_LIST
- 返回创建结果 (strategyId)

## 异常处理
- token 过期 → get_token(force_refresh=true) 重试 1 次
- 其余异常 → 停止，输出错误 JSON，等用户决策
```

**改造要点：**

- 删除所有 DOM 操作（navigate、click、wait、fill）
- 每个步骤改为执行脚本 + 展示结果
- 写操作前保留 [确认] 节点
- 添加前置准备（get_token）和全局规则（禁止自主补偿）
- 添加流程断点与会话恢复

---

#### 全流程一图总结

```mermaid
flowchart TD
    P1[Phase 1<br>候选接口发现] -->|OneAPI MCP<br>查询Facade/方法| L1[候选API列表<br>⚠ 待验证]
    P2[Phase 2<br>浏览器抓包验证] -->|agent-browser<br>操作页面+抓包| L2[已验证API列表<br>✅ 已验证]
    P3[Phase 3<br>流程简化+API Ref] -->|DOM步骤 vs API<br>三元映射表| D3[api-reference.md<br>Agent步骤<DOM步骤]
    P4[Phase 4<br>脚本+集成测试] -->|4a 骨架(留空)<br>4b 运行验证<br>4c compact设计<br>4d 集成测试| D4[测试通过的脚本]
    P5[Phase 5<br>SKILL.md改写] -->|DOM步骤 → API步骤<br>添加前置准备<br>添加全局规则<br>添加异常处理| D5[API-First Skill]

    L1 --> P2
    L2 --> P3
    D3 --> P4
    D4 --> P5
```

![image-20260525100724018.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525100724018.png)

---

###### 每个 Phase 的门禁：

- Phase 1 → 2：OneAPI MCP 可用（否则跳到 Phase 2 全量发现）
- Phase 2 → 3：至少有 API 结果（否则停止，输出缺口分析）
- Phase 3 → 4：API Reference 已完成（否则禁止写脚本）
- Phase 4 → 5：集成测试全部通过（否则禁止写 SKILL.md，测试会修正 compact 设计）

---

#### 五、已迁移 Skill 清单

6 个 Skill 已完成 API-First 迁移（全部走 WebGW 协议）：

| Skill                            | 脚本数 | 主要操作               |
| -------------------------------- | ------ | ---------------------- |
| disposal-filter-strategy-api    | 10     | 处置过滤策略 CRUD      |
| protect-strategy-flow-api       | 8      | 保护策略流程管理       |

![image-20260525100724019.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525100724019.png)

| disposal-event-config-api       | 11     | 处置事件配置           |
| decision-flow-workorder-api     | 3      | 决策流程工单查询       |
| recheck-config-check             | 7      | 复核配置校验           |
| risk-owner-config                | 6      | 风险负责人配置         |

TR Proxy 方案已设计完成（模板代码 tr_server.py/tr_call.py/tr_base.py），待迁移到生产 Skill。

---

#### 六、面试高频问题

**Q: 为什么延迟差 4 倍？**
A: WebGW 路径：Agent → HTTP → WebGW 网关 → 反序列化 → TR 调用 → 序列化 → HTTP 返回，中间多了一层网关代理 + IAM 认证校验 + JSON 位置参数反序列化。TR Proxy 路径：Agent → 本地 HTTP → tr_server → gRPC → MOSN sidecar → 目标服务，省掉了网关代理层和认证层，gRPC 也比 HTTP 轻量。

**Q: TR Proxy 的懒启动不会影响首次调用延迟吗？**
A: 会，首次 3s。但这是 Agent 启动后第一次调用 Skill 时的一次性开销，后续调用都是 90ms。空闲自动退出保证不浪费资源。Agent 在一次会话中通常连续调用多个 Skill 接口，3s 的 init 开销被摊薄。

**Q: 为什么不直接在 Agent 进程内调 MOSN？**
A: 两个原因：一是 MOSN gRPC 客户端需要 SOFAPy 框架初始化（加载 application.yaml、订阅 Facade），太重了不适合每个 Skill 脚本独立跑；二是 Skill 脚本是 `uv run python` 独立进程，无法共享 Agent 主进程的 MOSN 连接。tr_server 作为常驻代理进程，一次 init 服务所有 Skill 调用。

![image-20260525100724020.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20260525100724020.png)

**Q: 双协议切换的切换点在哪？**
A: 环境变量 `API_MODE`。生产环境 nanobot gateway 启动时设 `API_MODE=tr`，Skill 脚本 import 时自动选 TR Proxy；开发环境不设，走 WebGW。零代码修改，纯配置切换。

**Q: WebGW 的位置参数坑在哪里？**
A: Java 方法签名 `demo(String id, People p)` 的 HTTP Body 是 `["id123", {"name":"xx"}]`，参数顺序和类型必须完全匹配。如果顺序错了，WebGW 不报错，只是返回空数据——这种静默失败特别难排查。TR Proxy 用 oneapi-codegen 生成的强类型类，参数是命名传入，编译期就能发现错误。

**Q: 流程简化为什么不 1:1 翻译？**
A: DOM 操作是线性的（人必须一步步点），但 API 不需要中间步骤。导航→点Tab→搜索→选中→编辑 这 5 步 DOM 操作，对应 API 就是 `query(condition)` 一步。1:1 翻译不仅浪费 API 调用，还会引入不必要的中间状态和失败点。

**Q: Phase 2 抓包为什么不能用 OneAPI 直接替代？**
A: OneAPI 记录的是 Java DTO 字段名，经过序列化/网关代理后实际传输的字段名可能不同（驼峰 vs 下划线、展平 vs 嵌套、位置参数顺序）。唯一可信来源是浏览器实际发出的请求。所以 Phase 1 用 OneAPI 发现候选，Phase 2 用 agent-browser 抓包验证真实 Body——输入字段必须溯源到抓包 JSON。

**Q: compact_output 为什么要留空到 4c 才填？**
A: 因为字段名必须来自实际 API 返回，不能从 OneAPI 元数据或 Phase 3 文档推断。4a 写骨架时还没跑过 API，不知道返回结构；4b 运行后拿到真实返回；4c 才能基于真实字段设计 compact。如果提前填，大概率字段名对不上，导致 Agent 拿到空值。

## 引用
