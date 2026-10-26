---
illustration_id: 02
type: framework
style: sketch-notes
palette: macaron
language: zh
aspect: "16:9"
---

Use case: infographic-diagram
Asset type: 技术博客正文框架图
Primary request: 解释 Claude Code、Codex 通过多个 agent-browser session 拉起多棵 Chrome 进程树的架构关系。

STRUCTURE：从左到右的三层分叉框架，清晰表达一对多关系。

ZONES：
- LEFT：一个大圆角框“Claude Code / Codex”，下面小字“并发工具调用”。
- CENTER：三张纵向排列的薰衣草色卡片，分别写“Session A”“Session B”“Session C”，每张卡片右侧连接一个小框“daemon”。
- RIGHT：每个 daemon 连接一个蜜桃色浏览器框“独立 Chrome”，再分出三个小节点“Renderer”“GPU”“Network”。
- BOTTOM：一条结论横条“每个 session 都可能是一棵浏览器进程树”。

CONNECTIONS：左侧主框分叉到 3 个 session；session 到 daemon 是实线箭头；daemon 到独立 Chrome 是粗箭头；Chrome 到三个子进程是细树枝线。用一个珊瑚红括号圈住右侧三棵树，并标记“资源叠加”。

LABELS（必须逐字准确）：
- “Claude Code / Codex”
- “并发工具调用”
- “Session A” / “Session B” / “Session C”
- “daemon”
- “独立 Chrome”
- “Renderer” / “GPU” / “Network”
- “资源叠加”
- “每个 session 都可能是一棵浏览器进程树”

COLORS：暖奶油纸张背景；黑色手绘线条和文字；浅蓝用于入口，薰衣草用于 session，薄荷绿用于 daemon，蜜桃色用于 Chrome，珊瑚红只用于“资源叠加”。Color values and color names are rendering guidance only — do NOT display color names, hex codes, or palette labels as visible text in the image.

STYLE：手稿式技术框架图，略微抖动的黑色笔触，圆角卡片，手绘箭头，少量齿轮、终端、浏览器轮廓图标。不要真实 Logo，不要照片，不要 3D，不要渐变，不要长段文字。中文和英文标签都必须清晰。

Clean composition with generous white space. Main elements centered or positioned by content needs. Text should be large and prominent with handwritten-style fonts. Keep minimal, focus on keywords. No watermark.
ASPECT: 16:9
