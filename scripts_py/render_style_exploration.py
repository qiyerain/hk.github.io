from html import escape
from pathlib import Path

W, H = 1080, 1440
OUT = Path('.cache/github-style-exploration-2026-10-17')
OUT.mkdir(parents=True, exist_ok=True)

ITEMS = [
    ('01', 'Agent 团队', '角色 + 共享上下文，让协作不只停在一次对话'),
    ('02', '工程 Skills', '把真实经验整理成可重复使用的方法'),
    ('03', '程序化视频', '用 HTML 描述画面，再交给机器批量渲染'),
]

def esc(v):
    return escape(v, quote=True)

def t(x, y, value, size, fill='#151515', weight='500', family='Arial, sans-serif', anchor='start'):
    return f'<text x="{x}" y="{y}" font-family="{family}" font-size="{size}px" font-weight="{weight}" fill="{fill}" text-anchor="{anchor}">{esc(value)}</text>'

def shell(name, bg, body):
    return '\n'.join([
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">',
        f'<rect width="{W}" height="{H}" fill="{bg}"/>',
        body,
        '</svg>',
    ])

def style_poster():
    p = []
    p += [t(72, 104, 'GITHUB WEEKLY / 41', 22, '#f5d90a', '800', 'Arial, sans-serif'),
          t(72, 226, 'AI 工具正在变成', 82, '#f7f7f2', '900', 'Arial, sans-serif'),
          t(72, 318, '团队基础设施', 96, '#f5d90a', '900', 'Arial, sans-serif'),
          t(76, 378, '不是又一个模型，而是更稳定的协作方式。', 24, '#d7d7cc', '600'),
          '<rect x="72" y="428" width="936" height="5" fill="#f5d90a"/>']
    y = 510
    for rank, label, desc in ITEMS:
        p += [f'<rect x="72" y="{y}" width="936" height="205" fill="#20231f" stroke="#686d61" stroke-width="2"/>',
              t(108, y + 62, rank, 48, '#f5d90a', '900', 'Arial, sans-serif'),
              t(250, y + 62, label, 31, '#f7f7f2', '800'),
              t(250, y + 112, desc, 23, '#d7d7cc', '500'),
              t(965, y + 178, '↗ 试试看', 20, '#f5d90a', '800', 'Arial, sans-serif', 'end')]
        y += 225
    p += [t(72, 1328, '把复杂技术，讲成一个能马上行动的判断。', 23, '#f7f7f2', '700'),
          t(72, 1374, '关注我｜每周一张图看懂开发者新工具', 20, '#aeb4a6', '600')]
    return shell('bold-contrast', '#10120f', '\n'.join(p))

def style_editorial():
    p = [
        '<rect x="52" y="52" width="976" height="1336" fill="#f4efe6" stroke="#222" stroke-width="2"/>',
        t(92, 116, 'THE TOOL REPORT', 19, '#9b3b2d', '800', 'Georgia, serif'),
        t(92, 206, '当 Agent 开始', 70, '#252525', '900', 'Georgia, serif'),
        t(92, 282, '拥有长期记忆', 70, '#9b3b2d', '900', 'Georgia, serif'),
        t(96, 342, '本周 3 个值得拆开的工程信号', 24, '#4a4a45', '600', 'Arial, sans-serif'),
        '<path d="M92 386 H988" stroke="#252525" stroke-width="2"/>',
        '<rect x="92" y="430" width="356" height="708" fill="#d5e2dc"/>',
        '<circle cx="270" cy="622" r="122" fill="#f4efe6" stroke="#9b3b2d" stroke-width="3"/>',
        '<path d="M204 638 Q270 520 336 638 M224 684 Q270 724 316 684" fill="none" stroke="#252525" stroke-width="8"/>',
        t(120, 1034, '观点', 20, '#9b3b2d', '800', 'Arial, sans-serif'),
        t(120, 1084, '竞争点从“会不会回答”', 23, '#252525', '700'),
        t(120, 1118, '变成“能不能持续协作”。', 23, '#252525', '700'),
    ]
    y = 472
    for rank, label, desc in ITEMS:
        p += [t(520, y, rank, 18, '#9b3b2d', '800', 'Arial, sans-serif'),
              t(590, y, label, 31, '#252525', '800', 'Georgia, serif'),
              t(590, y + 43, desc, 20, '#4a4a45', '500'),
              '<path d="M520 %d H970" stroke="#b6aca1" stroke-width="1"/>' % (y + 84)]
        y += 198
    p += [t(520, 1128, '阅读方式', 18, '#9b3b2d', '800'),
          t(520, 1178, '先看判断，再决定要不要试用。', 25, '#252525', '800', 'Georgia, serif'),
          t(92, 1304, 'WECHAT / DOUYIN KNOWLEDGE NOTE', 16, '#6f6b62', '700', 'Arial, sans-serif')]
    return shell('editorial', '#eee9df', '\n'.join(p))

def style_terminal():
    p = [
        '<rect x="54" y="54" width="972" height="1332" rx="8" fill="#111820" stroke="#35e39b" stroke-width="2"/>',
        t(92, 126, 'LIVE SIGNAL / WEEK 41', 21, '#35e39b', '800', 'monospace'),
        t(92, 220, '本周热度', 26, '#9aa8b6', '700', 'monospace'),
        t(92, 328, '从单点能力', 80, '#edf7f1', '900', 'monospace'),
        t(92, 418, '走向持久协作', 80, '#35e39b', '900', 'monospace'),
        t(96, 476, '> 关注输入、上下文、权限和复用。', 22, '#9aa8b6', '500', 'monospace'),
        '<path d="M92 520 H988" stroke="#324351" stroke-width="2"/>',
    ]
    y = 585
    for rank, label, desc in ITEMS:
        p += [t(94, y, f'[{rank}]', 24, '#35e39b', '800', 'monospace'),
              t(190, y, label, 29, '#edf7f1', '800', 'monospace'),
              t(190, y + 44, desc, 20, '#9aa8b6', '500', 'monospace'),
              t(954, y, 'READY', 16, '#ffcc66', '800', 'monospace', 'end'),
              '<path d="M94 %d H954" stroke="#324351" stroke-width="1"/>' % (y + 82)]
        y += 185
    p += [t(94, 1180, 'WHY IT MATTERS', 18, '#35e39b', '800', 'monospace'),
          t(94, 1230, '把一次性的 Demo，变成可复用的工作流。', 24, '#edf7f1', '700', 'monospace'),
          t(94, 1328, 'FOLLOW  /  每周把热榜整理成行动清单', 18, '#9aa8b6', '700', 'monospace')]
    return shell('terminal', '#0c1218', '\n'.join(p))

def style_sticker():
    p = [
        '<rect x="58" y="58" width="964" height="1324" rx="36" fill="#f7f1e7" stroke="#242b35" stroke-width="3"/>',
        '<circle cx="910" cy="126" r="62" fill="#ff6c5c"/><circle cx="910" cy="126" r="30" fill="#ffd84d"/>',
        t(92, 132, '本周开发者观察', 22, '#2a6fdb', '900'),
        t(92, 248, '把复杂技术', 74, '#202936', '900'),
        t(92, 332, '讲得更好玩', 82, '#2a6fdb', '900'),
        '<rect x="92" y="382" width="520" height="50" rx="25" fill="#ffd84d" transform="rotate(-3 92 382)"/>',
        t(108, 415, '三条线索，帮你选项目', 22, '#202936', '800'),
    ]
    ys = [520, 730, 940]
    colors = ['#d7ecff', '#ffe0d8', '#dff3d5']
    for (rank, label, desc), y, color in zip(ITEMS, ys, colors):
        p += [f'<rect x="92" y="{y}" width="896" height="166" rx="28" fill="{color}" stroke="#242b35" stroke-width="3"/>',
              t(130, y + 58, rank, 42, '#202936', '900'),
              t(242, y + 55, label, 30, '#202936', '900'),
              t(242, y + 103, desc, 19, '#384656', '600'),
              '<circle cx="930" cy="%d" r="25" fill="#fffaf2" stroke="#242b35" stroke-width="3"/>' % (y + 82),
              t(930, y + 90, '→', 24, '#2a6fdb', '900', 'Arial, sans-serif', 'middle')]
    p += [t(94, 1242, '收藏这张图，下次选工具少走弯路。', 27, '#202936', '900'),
          t(94, 1300, '关注我｜每周一张图，把 GitHub 热榜讲明白', 19, '#2a6fdb', '800')]
    return shell('sticker', '#eaf1f5', '\n'.join(p))

styles = {
    '01-bold-contrast': style_poster(),
    '02-editorial': style_editorial(),
    '03-terminal': style_terminal(),
    '04-sticker': style_sticker(),
}
for name, svg in styles.items():
    path = OUT / f'{name}.svg'
    path.write_text(svg, encoding='utf-8')
    print(path)
