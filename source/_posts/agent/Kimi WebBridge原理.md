---
title: Kimi WebBridge 原理
date: 2026-05-18 15:00:00
article_id: 63089468-0954-5191-90c8-946c7333e23d
categories:
- 面试
tags:
- WebBridge
- 浏览器自动化
cover: /img/covers/cover-5.webp
top_img: /img/covers/cover-5.webp

---

# Kimi WebBridge 原理

## 目录

- [架构概览](#架构概览)
- [通信流程](#通信流程)
- [关键设计点](#关键设计点)
- [核心工具一览](#核心工具一览)
- [已知限制](#已知限制)

---

## 架构概览

Kimi WebBridge 由三个核心组件协作：

1. **浏览器扩展** — 安装在用户真实浏览器（Chrome 等）中，拥有对浏览器标签页、DOM 的完整访问权限。
2. **本地守护进程 (Daemon)** — 运行在 `http://127.0.0.1:10086` 的本地 HTTP 服务，由 `~/.kimi-webbridge/bin/kimi-webbridge` 启动和管理。
3. **AI Agent（如 Claude）** — 通过 `curl` 向守护进程发送 JSON 指令。

## 通信流程

```
Claude → curl POST → 本地 Daemon (127.0.0.1:10086) → 浏览器扩展 → 操作真实浏览器
```

1. AI 把操作意图（如"导航到某 URL"、"点击某元素"）以 JSON 格式 POST 给 Daemon
2. Daemon 转发指令给浏览器扩展
3. 扩展在真实浏览器中执行操作（点击、填表、截图等）
4. 结果沿原路返回给 AI

## 关键设计点

- **使用用户的真实浏览器**：扩展运行在用户已有的浏览器会话中，能复用用户的登录状态（cookies、session），不需要重新登录任何网站
- **无障碍树 (Accessibility Tree)**：`snapshot` 返回语义化的无障碍树，元素以 `@e` 引用标识。比 CSS 选择器更稳定——即使网站改了 class 名字，语义引用仍然有效
- **合成事件**：`click` 和 `fill` 通过 `el.click()` 和原生 setter + 事件派发实现，属于 DOM 层的合成事件（`isTrusted=false`），因此某些严格检查 `isTrusted` 的网站（如银行、验证码）无法操作
- **Session 隔离**：不同 session 对应不同的标签页组，可以同时操作多个网站互不干扰
- **fill 的三种模式**：
  - `<input>` / `<textarea>`：设置 `.value`，触发 `input`/`change` 事件
  - `[contenteditable]`（ProseMirror/Lexical/Slate 等）：聚焦 → 全选 → `document.execCommand('insertText')`，触发 `beforeinput`/`input` 事件
  - 其他元素：最佳努力设置 `.value` + 触发事件

## 核心工具一览

| 工具 | 作用 | 关键参数 |
|------|------|----------|
| `navigate` | 导航到指定 URL | `url`, `newTab`, `group_title` |
| `find_tab` | 复用已打开的标签页 | `url`, `active` |
| `snapshot` | 获取页面无障碍树 | 无 |
| `click` | 点击元素 | `selector`（@e 引用或 CSS） |
| `fill` | 填写文本 | `selector`, `value` |
| `evaluate` | 执行 JavaScript | `code`（支持 async/await） |
| `screenshot` | 截图（需用辅助脚本） | `format`, `quality`, `selector` |
| `network` | 捕获网络请求 | `cmd`, `filter`, `requestId` |
| `save_as_pdf` | 保存页面为 PDF | `paper_format`, `landscape`, `scale` |

## 已知限制

- **严格检查 `isTrusted` 的网站**：银行、验证码等场景，合成事件会被拒绝，这是产品边界而非 bug
- **跨域 iframe**：`fill`、`click`、`evaluate`、`snapshot` 仅操作顶层帧，跨域 iframe 中的元素需直接导航到 iframe 的 URL
