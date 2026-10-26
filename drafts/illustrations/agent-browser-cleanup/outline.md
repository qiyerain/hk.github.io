---
type: mixed
density: balanced
style: sketch-notes
palette: macaron
language: zh
image_count: 4
---

## Illustration 1

**Position**: 文章标题后
**Purpose**: 用一眼可懂的封面呈现“AI 已停、浏览器仍在后台发热”的冲突
**Visual Content**: Claude Code、Codex 对话窗口关闭，后台仍有 8 组浏览器进程树，Mac 发热；突出“不是普通 Chrome 标签页”
**Type Application**: 横向封面信息图
**Filename**: 01-infographic-ai-browser-heat.png

## Illustration 2

**Position**: “二、根因”中的调用链之后
**Purpose**: 解释并发 agent、session、daemon、Chrome 子进程的层级关系
**Visual Content**: Claude Code / Codex 向 3 个 session 分叉，每个 session 连接 daemon 和独立 Chrome，再派生 Renderer、GPU、Network
**Type Application**: 分层框架图
**Filename**: 02-framework-process-tree.png

## Illustration 3

**Position**: “四、三层清理”标题后
**Purpose**: 让读者按风险从低到高执行清理，避免一上来 KILL
**Visual Content**: 检查 → close --all → doctor → TERM → 等 3 秒 → KILL → 复查；普通 Chrome 保留
**Type Application**: 左到右流程图
**Filename**: 03-flowchart-cleanup.png

## Illustration 4

**Position**: “六、从源头预防”标题后
**Purpose**: 对比临时救火与长期治理，强化可复用做法
**Visual Content**: 左侧反复 force kill，右侧 idle timeout、复用 session、trap/finally、结束复查
**Type Application**: 左右对比图
**Filename**: 04-comparison-prevention.png
