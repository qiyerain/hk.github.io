const fs = require('node:fs');
const path = require('node:path');

const output = path.join(__dirname, '../source/img/covers/home');
const covers = [
  { id: 'agent-basics', category: 'AI AGENT / 01', title: 'Agent 会调用工具', accent: '#83e2bd', nodes: ['提出问题', 'LLM 决策', '调用工具'], foot: 'THINK  /  ACT  /  OBSERVE', loop: true },
  { id: 'backend-deploy', category: 'BACKEND / DEPLOY', title: '博客后端部署链路', accent: '#ffbd7e', nodes: ['GitHub Actions', 'Docker 镜像', 'Nginx · API · DB'], foot: 'BUILD  /  PUBLISH  /  SERVE' },
  { id: 'codex-theme', category: 'TOOLING / MACOS', title: 'Codex 主题转换', accent: '#b4c6ff', nodes: ['MP4 视频', 'FFmpeg → WebP', 'DreamSkin · Codex'], foot: 'SOURCE  /  OPTIMIZE  /  APPLY' },
  { id: 'android-mac', category: 'TOOLING / SCREEN', title: 'Android 投屏 Mac', accent: '#8cdfe7', nodes: ['Android · USB', 'ADB 调试', 'scrcpy · Mac'], foot: 'CONNECT  /  AUTHORIZE  /  MIRROR' },
  { id: 'content-workflow', category: 'CONTENT / PIPELINE', title: '一份原稿，两处发布', accent: '#e9ca8c', nodes: ['Markdown 原稿', 'Hexo 博客', '微信草稿'], foot: 'WRITE ONCE  /  REVIEW  /  DELIVER', branch: true },
  { id: 'code-agent', category: 'AI AGENT / 03', title: '搭建代码助手 Agent', accent: '#93dbad', nodes: ['读取文件', '编写代码', '执行 Shell'], foot: 'READ  /  WRITE  /  RUN' },
  { id: 'browser-process', category: 'BROWSER / PROCESS', title: '排查浏览器残留进程', accent: '#f29c91', nodes: ['Codex / Claude', 'agent-browser', 'Chrome 进程'], foot: 'TRACE OWNER  /  CLOSE SESSION  /  VERIFY' },
  { id: 'langchain-loop', category: 'AI AGENT / 02', title: 'LangChain 内部循环', accent: '#9ecfe8', nodes: ['Think', 'Act', 'Observe'], foot: 'PLAN  /  TOOL CALL  /  RESULT', loop: true },
  { id: 'career-resilience', category: 'GROWTH / STRATEGY', title: '建立职业抗风险能力', accent: '#e7c6a1', nodes: ['现金流', '可迁移技能', '可验证作品'], foot: 'BUFFER  /  SKILL  /  PROOF' },
  { id: 'github-trends', category: 'OPEN SOURCE / WEEKLY', title: 'GitHub 趋势观察', accent: '#c7b7f5', nodes: ['Trending repos', '技术信号', '周度判断'], foot: 'SCAN  /  COMPARE  /  EXPLAIN' },
];

const escape = value => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char]);
const text = (x, y, value, size, fill, weight = 600, extra = '') => `<text x="${x}" y="${y}" fill="${fill}" font-size="${size}" font-weight="${weight}" ${extra}>${escape(value)}</text>`;

function node(x, label, accent, index) {
  const labelSize = label.length > 13 ? 30 : label.length > 9 ? 34 : 40;
  return `<g>
    <rect x="${x}" y="365" width="310" height="145" rx="8" fill="#1a292e" stroke="#60767a" stroke-opacity=".55"/>
    <rect x="${x}" y="365" width="310" height="5" fill="${accent}"/>
    ${text(x + 26, 407, `0${index + 1}`, 24, accent, 700)}
    ${text(x + 26, 465, label, labelSize, '#f5f8f5', 700)}
  </g>`;
}

function coverSvg(item) {
  const xs = [72, 445, 818];
  const arrows = item.branch
    ? `<path d="M382 438 H420 Q445 438 445 405 V397 H818 M445 438 V520 Q445 550 472 550 H818" fill="none" stroke="${item.accent}" stroke-width="5"/><path d="M802 388 l17 9 -17 9 M802 541 l17 9 -17 9" fill="none" stroke="${item.accent}" stroke-width="5"/>`
    : [382, 755].map(x => `<path d="M${x} 438 h58 m-16 -13 16 13 -16 13" fill="none" stroke="${item.accent}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
  const branchNodes = item.branch
    ? `${node(72, item.nodes[0], item.accent, 0)}<rect x="818" y="365" width="310" height="85" rx="8" fill="#1a292e" stroke="#60767a" stroke-opacity=".55"/>${text(844, 421, item.nodes[1], 36, '#f5f8f5', 700)}<rect x="818" y="505" width="310" height="85" rx="8" fill="#1a292e" stroke="#60767a" stroke-opacity=".55"/>${text(844, 561, item.nodes[2], 36, '#f5f8f5', 700)}`
    : item.nodes.map((label, index) => node(xs[index], label, item.accent, index)).join('');
  const loop = item.loop ? `<path d="M973 535 v44 Q973 600 944 600 H238 Q209 600 209 579 v-44" fill="none" stroke="${item.accent}" stroke-opacity=".7" stroke-width="4" stroke-dasharray="10 12"/><path d="m198 550 11 -16 11 16" fill="none" stroke="${item.accent}" stroke-width="4"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675" role="img" aria-label="${escape(item.title)}">
  <defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#b5d3cf" stroke-opacity=".08"/></pattern></defs>
  <rect width="1200" height="675" fill="#101c20"/><rect width="1200" height="675" fill="url(#grid)"/>
  <rect x="72" y="68" width="66" height="6" fill="${item.accent}"/>
  ${text(72, 126, item.category, 25, item.accent, 700, 'font-family="Arial,sans-serif"')}
  ${text(72, 245, item.title, 70, '#f5f8f5', 700)}
  <path d="M72 302 H1128" stroke="#7c9291" stroke-opacity=".5"/>
  ${arrows}${branchNodes}${loop}
  ${text(72, 637, item.foot, 22, '#9caeaf', 600, 'font-family="Arial,sans-serif"')}
  <circle cx="1118" cy="618" r="9" fill="${item.accent}"/>
</svg>`;
}

function heroSvg() {
  const labels = [
    { x: 1530, y: 74, label: 'AI Agent', accent: '#83e2bd' },
    { x: 1530, y: 250, label: 'Java · Backend', accent: '#ffbd7e' },
    { x: 1530, y: 426, label: 'Tools · Practice', accent: '#9ecfe8' },
  ];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="2400" height="600" viewBox="0 0 2400 600" role="img" aria-label="AI Agent、Java 后端与工程实践知识结构图">
  <defs><pattern id="grid" width="44" height="44" patternUnits="userSpaceOnUse"><path d="M44 0H0V44" fill="none" stroke="#aecdc7" stroke-opacity=".1"/></pattern></defs>
  <rect width="2400" height="600" fill="#102026"/><rect width="2400" height="600" fill="url(#grid)"/>
  <path d="M1160 300 H1400 L1490 150 H1530 M1400 300 L1490 475 H1530" fill="none" stroke="#95adaf" stroke-opacity=".65" stroke-width="5"/>
  <circle cx="1400" cy="300" r="24" fill="#83e2bd"/><circle cx="1530" cy="150" r="14" fill="#83e2bd"/><circle cx="1530" cy="475" r="14" fill="#9ecfe8"/>
  ${labels.map(({ x, y, label, accent }) => `<rect x="${x}" y="${y}" width="360" height="98" rx="8" fill="#1b3036" stroke="${accent}" stroke-width="3"/>${text(x + 28, y + 63, label, 38, '#f6faf7', 700, 'font-family="Arial,sans-serif"')}`).join('')}
  <path d="M1900 150 H2320 M1900 300 H2320 M1900 445 H2320" stroke="#81a29d" stroke-opacity=".35" stroke-width="3" stroke-dasharray="8 12"/>
</svg>`;
}

fs.mkdirSync(output, { recursive: true });
for (const item of covers) fs.writeFileSync(path.join(output, `${item.id}.svg`), coverSvg(item));
fs.writeFileSync(path.join(output, 'site-topics.svg'), heroSvg());
