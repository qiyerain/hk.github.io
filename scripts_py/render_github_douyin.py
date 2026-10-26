from html import escape
from pathlib import Path

W, H = 1080, 1440
rows = [
    ("01", "boykopovar/AnyPS5", "跨平台工具", "自动把 PS5 执行文件移植到 Linux 和 Windows", "+10,243", "C++", "#fff0a8", "⌕"),
    ("02", "mvschwarz/openrig", "Agent 团队", "用角色、共享上下文和任务所有权组织团队", "+2,693", "TypeScript", "#dff1e6", "◉"),
    ("03", "mattpocock/skills", "工程 Skills", "把真实工程实践整理成可复用的 Skills", "+7,448", "Shell", "#e7e0ff", "▣"),
    ("04", "heygen-com/hyperframes", "视频渲染", "让 Agent 通过 HTML 描述并渲染视频", "+3,996", "TypeScript", "#ffe7d7", "</>"),
    ("05", "cursor/plugins", "插件扩展", "提供 Cursor 插件规范和官方插件集合", "+1,109", "TypeScript", "#dff3f5", "✦"),
]

def text(x, y, value, size, weight="400", fill="#151515", anchor="start"):
    return f'<text x="{x}" y="{y}" font-family="Heiti SC, PingFang SC, Arial, sans-serif" font-size="{size}px" font-weight="{weight}" fill="{fill}" text-anchor="{anchor}">{escape(value)}</text>'

parts = [
    f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">',
    '<rect width="1080" height="1440" fill="#f7f6ef"/>',
    '<rect x="28" y="28" width="1024" height="1384" rx="28" fill="#fffdf7" stroke="#deded5" stroke-width="3"/>',
    '<circle cx="935" cy="72" r="18" fill="#f2c94c"/><circle cx="970" cy="72" r="10" fill="#e66b4c"/>',
    text(64, 86, "GITHUB WEEKLY", 22, "700", "#238636"),
    text(64, 156, "GitHub 本周热门项目", 54, "900"),
    text(66, 198, "2026 · 第41周  |  本周新增 Star 排名", 22, "600", "#55584f"),
    '<rect x="64" y="222" width="952" height="4" rx="2" fill="#238636"/>',
    text(64, 270, "智能体工具正从单点能力转向持久协作生态", 25, "700", "#8f3f2f"),
    text(1016, 270, "每周更新", 20, "700", "#238636", "end"),
]

y = 300
for rank, name, tag, desc, added, lang, badge, icon in rows:
    card_h = 116
    parts.append(f'<rect x="64" y="{y}" width="952" height="{card_h}" rx="18" fill="#ffffff" stroke="#e3e3d9" stroke-width="2"/>')
    parts.append(f'<rect x="64" y="{y}" width="94" height="{card_h}" rx="18" fill="{badge}"/>')
    parts.append(text(111, y + 70, rank, 40, "900", "#131313", "middle"))
    parts.append(f'<circle cx="205" cy="{y + 58}" r="31" fill="#f1f3ee" stroke="#c7d0c3" stroke-width="2"/>')
    parts.append(text(205, y + 68, icon, 27, "700", "#238636", "middle"))
    name_size = 23 if len(name) <= 24 else 19
    parts.append(text(256, y + 38, name, name_size, "800"))
    parts.append(f'<rect x="256" y="{y + 51}" width="142" height="25" rx="12" fill="#edf5f2"/>')
    parts.append(text(327, y + 69, tag, 15, "700", "#39786e", "middle"))
    parts.append(text(256, y + 101, desc, 17, "500", "#575950"))
    parts.append(text(970, y + 49, "★", 27, "800", "#e4a900", "end"))
    parts.append(text(970, y + 77, added, 26, "900", "#151515", "end"))
    parts.append(text(970, y + 101, "本周新增 Star", 14, "600", "#76786f", "end"))
    parts.append(text(985, y + 28, lang, 13, "600", "#777a72", "end"))
    y += 128

parts += [
    '<rect x="64" y="1335" width="952" height="50" rx="16" fill="#1f2d2a"/>',
    text(94, 1368, "关注我｜每周把 GitHub 热榜整理成能看懂、能落地的项目清单", 20, "700", "#fffdf7"),
    text(978, 1368, "→", 30, "900", "#f2c94c", "end"),
    '</svg>',
]

out = Path(".cache/github-weekly-2026-10-09/douyin/github-weekly-douyin-2026-10-09.svg")
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text("\n".join(parts), encoding="utf-8")
print(out)
