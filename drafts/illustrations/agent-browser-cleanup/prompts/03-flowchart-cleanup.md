---
illustration_id: 03
type: flowchart
style: sketch-notes
palette: macaron
language: zh
aspect: "16:9"
---

Use case: productivity-visual
Asset type: 技术博客正文安全清理流程图
Primary request: 生成一张从低风险到高风险的 agent-browser 残留进程清理流程图，强调先检查和官方关闭，最后才强制 KILL。

LAYOUT：左到右主流程，末端有一个向上回到“复查”的小回环。

STEPS：
1. “检查” — session list + pgrep，小放大镜图标。
2. “官方关闭” — close --all，薄荷绿大卡片和关闭按钮图标。
3. “清理记录” — doctor --offline --quick，小扫帚图标。
4. “仍有残留？” — 菱形判断框。
5. “TERM” — 温和终止，等待“3 秒”。
6. “KILL” — 仅对卡死残留，珊瑚红小卡片。
7. “复查” — CPU、内存、session 都归零或恢复正常。

SAFE LANE：流程图下方单独画一条薄荷绿安全带，写“普通 Chrome 保留”，配一个未被箭头触碰的普通浏览器窗口。

LABELS（必须逐字准确）：
- “检查”
- “session list + pgrep”
- “官方关闭”
- “close --all”
- “清理记录”
- “doctor --offline --quick”
- “仍有残留？”
- “TERM”
- “等待 3 秒”
- “KILL”
- “只处理卡死残留”
- “复查”
- “普通 Chrome 保留”

COLORS：暖奶油背景；黑色手绘线条；浅蓝用于检查，薄荷绿用于官方关闭和安全带，薰衣草用于 doctor 与复查，蜜桃色用于 TERM，珊瑚红仅用于 KILL 和警告。Color values and color names are rendering guidance only — do NOT display color names, hex codes, or palette labels as visible text in the image.

STYLE：清晰的手绘 sketchnote 流程图，圆角框、粗手绘箭头、简单图标、少量星号和下划线。KILL 不能比官方关闭更大。不要真实品牌 Logo，不要照片，不要 3D，不要渐变。中文和命令必须准确、清晰、手机端可读。

Clean composition with generous white space. Main elements centered or positioned by content needs. Text should be large and prominent with handwritten-style fonts. Keep minimal, focus on keywords. No watermark.
ASPECT: 16:9
