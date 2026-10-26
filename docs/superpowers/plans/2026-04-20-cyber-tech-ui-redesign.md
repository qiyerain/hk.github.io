# 博客 UI 赛博科技风格改造 - 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 Hexo 博客从当前样式改造为赛博科技风格（深色背景 + 霓虹青蓝配色 + 科技感特效）

**Architecture:** 通过 Anzhiyu 主题配置修改 + 自定义 CSS/JS 注入实现，不更换主题，保留所有现有功能

**Tech Stack:** Hexo 7.3.0, Anzhiyu 主题, CSS3 (backdrop-filter, gradients, text-shadow), Canvas (粒子动画)

---

## 文件结构

| 文件 | 操作 | 职责 |
|------|------|------|
| `_config.anzhiyu.yml` | 修改 | 主题色配置、深色模式、inject 注入 |
| `source/css/cyber-tech.css` | 新建 | 核心样式：配色、发光、渐变 |
| `source/js/particles-bg.js` | 新建 | 首页粒子背景动画 |
| `source/js/reading-progress.js` | 新建 | 文章页阅读进度条 |

---

## Task 1: 配置主题色和深色模式

**Files:**
- Modify: `_config.anzhiyu.yml` (追加到文件末尾)

- [ ] **Step 1: 添加 theme_color 配置**

在 `_config.anzhiyu.yml` 文件末尾添加以下配置：

```yaml
# ======================= 赛博科技风格主题色 =======================
theme_color:
  enable: true
  main: "#00d4ff"
  dark_main: "#00d4ff"
  paginator: "#00d4ff"
  button_hover: "#0099ff"
  text_selection: "#00d4ff"
  link_color: "#00d4ff"
  meta_color: "rgba(255,255,255,0.6)"
  hr_color: "#00d4ff"
  code_foreground: "#00d4ff"
  code_background: "rgba(0,212,255,0.1)"
  toc_color: "#00d4ff"
  blockquote_padding_color: "#00d4ff"
  blockquote_background_color: "rgba(0,212,255,0.1)"
  scrollbar_color: "#00d4ff"

# 深色模式配置
darkmode:
  enable: true
  button: true
  autoChangeMode: 1
```

- [ ] **Step 2: 添加 inject 配置注入自定义 CSS/JS**

在 `_config.anzhiyu.yml` 文件末尾继续添加：

```yaml
# ======================= 注入自定义资源 =======================
inject:
  head:
    - <link rel="stylesheet" href="/css/cyber-tech.css">
  bottom:
    - <script src="/js/particles-bg.js"></script>
    - <script src="/js/reading-progress.js"></script>
```

- [ ] **Step 3: 修改 highlight_theme 为深色主题**

将 `_config.anzhiyu.yml` 第 42 行的 `highlight_theme: darker` 保持不变（已是深色）

- [ ] **Step 4: 验证配置格式**

运行: `cd "C:/GitDemos/wwrtpfa.github.io" && npx hexo config --config _config.anzhiyu.yml theme_color.enable`

预期输出: `true`

- [ ] **Step 5: 提交配置更改**

```bash
cd "C:/GitDemos/wwrtpfa.github.io"
git add _config.anzhiyu.yml
git commit -m "config: 添加赛博科技风格主题色配置"
```

---

## Task 2: 创建核心样式文件 (cyber-tech.css)

**Files:**
- Create: `source/css/cyber-tech.css`

- [ ] **Step 1: 创建 CSS 文件并添加 CSS 变量定义**

创建 `source/css/cyber-tech.css` 文件：

```css
/* ============================================
   赛博科技风格 - Cyber Tech Theme
   ============================================ */

/* CSS 变量定义 */
:root {
  /* 主色调 */
  --cyber-primary: #00d4ff;
  --cyber-secondary: #6366f1;
  --cyber-accent: #0099ff;

  /* 背景色 */
  --cyber-bg-dark: #0a0a1a;
  --cyber-bg-medium: #121220;
  --cyber-bg-light: #1a1a2e;

  /* 文字色 */
  --cyber-text-primary: rgba(255, 255, 255, 0.85);
  --cyber-text-secondary: rgba(255, 255, 255, 0.6);
  --cyber-text-muted: rgba(255, 255, 255, 0.4);

  /* 边框色 */
  --cyber-border: rgba(0, 212, 255, 0.2);
  --cyber-border-glow: rgba(0, 212, 255, 0.5);

  /* 渐变 */
  --cyber-gradient-primary: linear-gradient(135deg, #00d4ff 0%, #6366f1 100%);
  --cyber-gradient-bg: linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 100%);
  --cyber-gradient-card: linear-gradient(145deg, #121220 0%, #0d0d1a 100%);

  /* 发光效果 */
  --cyber-glow: 0 0 20px rgba(0, 212, 255, 0.3);
  --cyber-glow-strong: 0 0 30px rgba(0, 212, 255, 0.5);
}
```

- [ ] **Step 2: 添加全局背景样式**

在 `cyber-tech.css` 继续添加：

```css
/* ============================================
   全局背景
   ============================================ */

/* 网站背景 */
#web_bg {
  background: var(--cyber-gradient-bg) !important;
}

/* 深色模式下的背景增强 */
[data-theme="dark"] #web_bg {
  background: var(--cyber-gradient-bg) !important;
}

/* 页面容器背景 */
#body-wrap {
  background: transparent;
}
```

- [ ] **Step 3: 添加导航栏样式**

继续添加：

```css
/* ============================================
   导航栏 (Navbar)
   ============================================ */

/* 导航栏毛玻璃效果 */
#nav {
  background: rgba(10, 10, 26, 0.85) !important;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--cyber-border) !important;
  transition: all 0.3s ease;
}

/* 滚动后导航栏 */
#nav.nav-fixed {
  background: rgba(10, 10, 26, 0.95) !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

/* 导航链接悬停发光 */
#nav a:hover {
  color: var(--cyber-primary) !important;
  text-shadow: 0 0 10px var(--cyber-primary);
}

/* 站点名称发光 */
#site-name:hover {
  color: var(--cyber-primary) !important;
  text-shadow: 0 0 15px var(--cyber-primary);
}

/* 搜索按钮 */
#search-button:hover {
  color: var(--cyber-primary) !important;
}
```

- [ ] **Step 4: 添加首页 Banner 样式**

继续添加：

```css
/* ============================================
   首页 Banner
   ============================================ */

/* Banner 背景 */
#page-header:not(.post-bg) {
  background: var(--cyber-gradient-bg) !important;
}

/* 站点信息 */
#site-info {
  text-shadow: 0 0 30px rgba(0, 212, 255, 0.3);
}

/* 站点标题发光 */
#site-title {
  color: var(--cyber-primary) !important;
  text-shadow:
    0 0 10px var(--cyber-primary),
    0 0 20px var(--cyber-primary),
    0 0 40px var(--cyber-primary);
  animation: title-glow 2s ease-in-out infinite alternate;
}

@keyframes title-glow {
  from {
    text-shadow:
      0 0 10px var(--cyber-primary),
      0 0 20px var(--cyber-primary);
  }
  to {
    text-shadow:
      0 0 20px var(--cyber-primary),
      0 0 40px var(--cyber-primary),
      0 0 60px var(--cyber-secondary);
  }
}

/* 站点副标题 */
#site-subtitle {
  color: var(--cyber-text-secondary) !important;
}

/* 打字机效果光标 */
#subtitle-typing {
  color: var(--cyber-primary) !important;
  border-right: 2px solid var(--cyber-primary);
}
```

- [ ] **Step 5: 添加文章卡片样式**

继续添加：

```css
/* ============================================
   文章卡片 (Post Cards)
   ============================================ */

/* 首页文章卡片 */
.recent-post-item {
  background: var(--cyber-gradient-card) !important;
  border: 1px solid transparent;
  border-radius: 12px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

/* 卡片悬停效果 */
.recent-post-item:hover {
  border-color: var(--cyber-border-glow);
  box-shadow: var(--cyber-glow);
  transform: translateY(-5px);
}

/* 封面图渐变遮罩 */
.recent-post-item .post_cover img {
  transition: all 0.4s ease;
}

.recent-post-item:hover .post_cover img {
  filter: brightness(0.8);
}

/* 文章标题 */
.recent-post-item .article-title {
  color: var(--cyber-text-primary) !important;
  transition: all 0.3s ease;
}

.recent-post-item:hover .article-title {
  color: var(--cyber-primary) !important;
  text-shadow: 0 0 10px var(--cyber-primary);
}

/* 文章元信息 */
.recent-post-item .article-meta {
  color: var(--cyber-text-secondary) !important;
}

.recent-post-item .article-meta a {
  color: var(--cyber-primary) !important;
}

/* 分类标签 */
.article-meta .article-meta__categories a {
  background: var(--cyber-gradient-primary) !important;
  color: #fff !important;
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 12px;
}
```

- [ ] **Step 6: 添加文章阅读页样式**

继续添加：

```css
/* ============================================
   文章阅读页 (Article Page)
   ============================================ */

/* 文章容器 */
#article-container {
  color: var(--cyber-text-primary);
}

/* 文章背景 */
.post {
  background: var(--cyber-bg-medium) !important;
}

/* 文章标题 */
#article-container h1,
#article-container h2,
#article-container h3,
#article-container h4 {
  color: var(--cyber-text-primary) !important;
  border-bottom: 1px solid var(--cyber-border);
  padding-bottom: 8px;
}

#article-container h2 {
  border-left: 4px solid var(--cyber-primary);
  padding-left: 12px;
}

/* 文章链接 */
#article-container a {
  color: var(--cyber-primary) !important;
  border-bottom: 1px dashed var(--cyber-primary);
  transition: all 0.3s ease;
}

#article-container a:hover {
  text-shadow: 0 0 8px var(--cyber-primary);
  border-bottom-style: solid;
}

/* 引用块 */
#article-container blockquote {
  background: rgba(0, 212, 255, 0.05) !important;
  border-left: 4px solid var(--cyber-primary) !important;
  color: var(--cyber-text-secondary);
  box-shadow: inset 0 0 20px rgba(0, 212, 255, 0.05);
}

/* 代码块 */
#article-container pre {
  background: var(--cyber-bg-dark) !important;
  border: 1px solid var(--cyber-border);
  border-left: 4px solid var(--cyber-primary) !important;
  border-radius: 8px;
  box-shadow: var(--cyber-glow);
}

#article-container code {
  background: rgba(0, 212, 255, 0.1) !important;
  color: var(--cyber-primary) !important;
  border-radius: 4px;
  padding: 2px 6px;
}

#article-container pre code {
  background: transparent !important;
  color: var(--cyber-text-primary) !important;
}

/* 表格 */
#article-container table {
  border: 1px solid var(--cyber-border);
}

#article-container th {
  background: var(--cyber-bg-light) !important;
  color: var(--cyber-primary) !important;
}

#article-container td {
  border-color: var(--cyber-border);
}
```

- [ ] **Step 7: 添加侧边栏样式**

继续添加：

```css
/* ============================================
   侧边栏 (Sidebar)
   ============================================ */

/* 侧边栏容器 */
#aside-content {
  background: var(--cyber-bg-medium) !important;
  border-radius: 12px;
  border: 1px solid var(--cyber-border);
}

/* 作者卡片 */
.card-widget.card-info {
  background: var(--cyber-gradient-card) !important;
  border: 1px solid var(--cyber-border);
}

/* 头像发光 */
.card-info .avatar-img {
  border: 3px solid var(--cyber-primary);
  box-shadow: 0 0 20px var(--cyber-primary);
  animation: avatar-pulse 2s ease-in-out infinite;
}

@keyframes avatar-pulse {
  0%, 100% {
    box-shadow: 0 0 20px var(--cyber-primary);
  }
  50% {
    box-shadow: 0 0 30px var(--cyber-primary), 0 0 40px var(--cyber-secondary);
  }
}

/* 标签云 */
.card-tag-cloud a {
  color: var(--cyber-text-secondary) !important;
  transition: all 0.3s ease;
}

.card-tag-cloud a:hover {
  color: var(--cyber-primary) !important;
  text-shadow: 0 0 8px var(--cyber-primary);
}

/* 目录导航 */
.toc-link {
  color: var(--cyber-text-secondary) !important;
}

.toc-link.active {
  color: var(--cyber-primary) !important;
  text-shadow: 0 0 8px var(--cyber-primary);
}

/* 最近文章 */
.aside-list-item {
  border-bottom: 1px dashed var(--cyber-border) !important;
}

.aside-list-item:hover .title {
  color: var(--cyber-primary) !important;
}
```

- [ ] **Step 8: 添加页脚样式**

继续添加：

```css
/* ============================================
   页脚 (Footer)
   ============================================ */

/* 页脚背景 */
#footer {
  background: var(--cyber-gradient-bg) !important;
  border-top: 1px solid var(--cyber-border);
}

/* 页脚链接 */
#footer a {
  color: var(--cyber-text-secondary) !important;
  transition: all 0.3s ease;
}

#footer a:hover {
  color: var(--cyber-primary) !important;
  text-shadow: 0 0 8px var(--cyber-primary);
}

/* 页脚文字 */
#footer-wrap {
  color: var(--cyber-text-secondary);
}
```

- [ ] **Step 9: 添加按钮和交互元素样式**

继续添加：

```css
/* ============================================
   按钮和交互元素
   ============================================ */

/* 普通按钮 */
button,
.btn-beautify,
.button--animated {
  background: var(--cyber-gradient-primary) !important;
  border: none !important;
  color: #fff !important;
  box-shadow: 0 4px 15px rgba(0, 212, 255, 0.3);
  transition: all 0.3s ease;
}

button:hover,
.btn-beautify:hover,
.button--animated:hover {
  box-shadow: var(--cyber-glow-strong);
  transform: translateY(-2px);
}

/* 阅读更多按钮 */
.article-button {
  background: transparent !important;
  border: 1px solid var(--cyber-primary) !important;
  color: var(--cyber-primary) !important;
}

.article-button:hover {
  background: var(--cyber-primary) !important;
  color: var(--cyber-bg-dark) !important;
}

/* 分页器 */
.pagination .page-number {
  background: var(--cyber-bg-light) !important;
  color: var(--cyber-text-primary) !important;
  border: 1px solid var(--cyber-border);
}

.pagination .page-number:hover,
.pagination .page-number.current {
  background: var(--cyber-gradient-primary) !important;
  color: #fff !important;
  border-color: transparent;
}

/* 搜索框 */
.search-dialog {
  background: var(--cyber-bg-medium) !important;
  border: 1px solid var(--cyber-border);
  box-shadow: var(--cyber-glow-strong);
}

.search-dialog input {
  background: var(--cyber-bg-dark) !important;
  border: 1px solid var(--cyber-border) !important;
  color: var(--cyber-text-primary) !important;
}
```

- [ ] **Step 10: 添加阅读进度条样式**

继续添加：

```css
/* ============================================
   阅读进度条
   ============================================ */

.reading-progress-bar {
  position: fixed;
  top: 0;
  left: 0;
  height: 3px;
  background: var(--cyber-gradient-primary);
  z-index: 99999;
  transition: width 0.1s ease;
  box-shadow: 0 0 10px var(--cyber-primary);
}
```

- [ ] **Step 11: 添加移动端适配**

继续添加：

```css
/* ============================================
   移动端适配
   ============================================ */

@media (max-width: 768px) {
  /* 减少特效以提高性能 */

  #site-title {
    animation: none;
  }

  .card-info .avatar-img {
    animation: none;
  }

  .recent-post-item:hover {
    transform: none;
  }

  /* 简化发光效果 */
  #nav a:hover,
  #site-name:hover,
  .recent-post-item:hover .article-title {
    text-shadow: 0 0 5px var(--cyber-primary);
  }
}
```

- [ ] **Step 12: 提交 CSS 文件**

```bash
cd "C:/GitDemos/wwrtpfa.github.io"
git add source/css/cyber-tech.css
git commit -m "feat: 添加赛博科技风格核心样式"
```

---

## Task 3: 创建粒子背景动画

**Files:**
- Create: `source/js/particles-bg.js`

- [ ] **Step 1: 创建粒子背景脚本**

创建 `source/js/particles-bg.js` 文件：

```javascript
/**
 * 赛博科技风格 - 粒子背景动画
 * 为首页添加动态粒子/星空效果
 */

(function() {
  'use strict';

  // 仅在首页执行
  const isHome = document.getElementById('page-header') &&
                 !document.getElementById('page-header').classList.contains('post-bg');
  if (!isHome) return;

  // 创建 canvas
  const canvas = document.createElement('canvas');
  canvas.id = 'cyber-particles';
  canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1;';
  document.getElementById('page-header').appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let particles = [];
  let animationId = null;

  // 配置
  const config = {
    particleCount: 80,
    particleColor: '#00d4ff',
    lineColor: 'rgba(0, 212, 255, 0.1)',
    particleRadius: 2,
    lineDistance: 120,
    speed: 0.3
  };

  // 调整画布大小
  function resizeCanvas() {
    const header = document.getElementById('page-header');
    canvas.width = header.offsetWidth;
    canvas.height = header.offsetHeight;
  }

  // 粒子类
  class Particle {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.vx = (Math.random() - 0.5) * config.speed;
      this.vy = (Math.random() - 0.5) * config.speed;
      this.radius = Math.random() * config.particleRadius + 1;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      // 边界反弹
      if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
      if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = config.particleColor;
      ctx.fill();

      // 发光效果
      ctx.shadowBlur = 10;
      ctx.shadowColor = config.particleColor;
    }
  }

  // 初始化粒子
  function initParticles() {
    particles = [];
    for (let i = 0; i < config.particleCount; i++) {
      particles.push(new Particle());
    }
  }

  // 绘制连线
  function drawLines() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < config.lineDistance) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = config.lineColor;
          ctx.lineWidth = 1 - distance / config.lineDistance;
          ctx.stroke();
        }
      }
    }
  }

  // 动画循环
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
      p.update();
      p.draw();
    });

    drawLines();
    animationId = requestAnimationFrame(animate);
  }

  // 启动
  function start() {
    resizeCanvas();
    initParticles();
    animate();
  }

  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    resizeCanvas();
    initParticles();
  });

  // 页面加载完成后启动
  if (document.readyState === 'complete') {
    start();
  } else {
    window.addEventListener('load', start);
  }

  // 页面隐藏时暂停动画
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(animationId);
    } else {
      animate();
    }
  });

})();
```

- [ ] **Step 2: 提交粒子背景脚本**

```bash
cd "C:/GitDemos/wwrtpfa.github.io"
git add source/js/particles-bg.js
git commit -m "feat: 添加首页粒子背景动画"
```

---

## Task 4: 创建阅读进度条

**Files:**
- Create: `source/js/reading-progress.js`

- [ ] **Step 1: 创建阅读进度条脚本**

创建 `source/js/reading-progress.js` 文件：

```javascript
/**
 * 赛博科技风格 - 阅读进度条
 * 在文章页面顶部显示渐变色阅读进度指示
 */

(function() {
  'use strict';

  // 仅在文章页面执行
  const isPost = document.querySelector('.post') !== null;
  if (!isPost) return;

  // 创建进度条元素
  const progressBar = document.createElement('div');
  progressBar.className = 'reading-progress-bar';
  progressBar.style.width = '0%';
  document.body.appendChild(progressBar);

  // 更新进度
  function updateProgress() {
    const article = document.querySelector('#article-container') || document.querySelector('.post');
    if (!article) return;

    const articleTop = article.offsetTop;
    const articleHeight = article.offsetHeight;
    const windowHeight = window.innerHeight;
    const scrollTop = window.scrollY;

    // 计算阅读进度
    const start = articleTop - windowHeight / 2;
    const end = articleTop + articleHeight - windowHeight / 2;
    const progress = Math.max(0, Math.min(100, ((scrollTop - start) / (end - start)) * 100));

    progressBar.style.width = progress + '%';
  }

  // 监听滚动
  let ticking = false;
  window.addEventListener('scroll', function() {
    if (!ticking) {
      window.requestAnimationFrame(function() {
        updateProgress();
        ticking = false;
      });
      ticking = true;
    }
  });

  // 初始化
  updateProgress();

})();
```

- [ ] **Step 2: 提交阅读进度条脚本**

```bash
cd "C:/GitDemos/wwrtpfa.github.io"
git add source/js/reading-progress.js
git commit -m "feat: 添加文章页阅读进度条"
```

---

## Task 5: 本地测试验证

**Files:**
- 无新文件

- [ ] **Step 1: 清理并重新生成**

```bash
cd "C:/GitDemos/wwrtpfa.github.io"
npx hexo clean
npx hexo generate
```

预期: 无报错，生成成功

- [ ] **Step 2: 启动本地服务器预览**

```bash
cd "C:/GitDemos/wwrtpfa.github.io"
npx hexo server
```

预期: 服务启动在 http://localhost:4000

- [ ] **Step 3: 手动验证清单**

在浏览器中打开 http://localhost:4000 并验证：

| 检查项 | 预期效果 |
|--------|----------|
| 首页背景 | 深色渐变 + 粒子动画 |
| 导航栏 | 毛玻璃效果，链接悬停发光 |
| 站点标题 | 青蓝色发光，呼吸动画 |
| 文章卡片 | 深色背景，悬停发光边框 |
| 文章页 | 深色背景，代码块霓虹边框 |
| 阅读进度条 | 顶部青蓝渐变进度条 |
| 侧边栏 | 深色背景，头像发光 |
| 页脚 | 深色渐变背景 |

- [ ] **Step 4: 停止服务器**

按 `Ctrl+C` 停止 hexo server

---

## Task 6: 最终提交和部署

**Files:**
- 无新文件

- [ ] **Step 1: 确认所有更改已提交**

```bash
cd "C:/GitDemos/wwrtpfa.github.io"
git status
```

预期: working tree clean

- [ ] **Step 2: 推送到远程仓库**

```bash
cd "C:/GitDemos/wwrtpfa.github.io"
git push origin master
```

- [ ] **Step 3: 部署博客**

```bash
cd "C:/GitDemos/wwrtpfa.github.io"
npx hexo deploy
```

预期: 部署成功到 GitHub Pages

---

## 成功标准

- [x] 全站呈现统一的赛博科技风格
- [x] 导航栏、Banner、卡片、阅读页、侧边栏、页脚全部改造完成
- [x] 特效生效：发光文字、粒子背景、代码块美化、阅读进度条
- [x] 不影响现有功能 (评论、搜索、分享等)
- [x] 移动端样式适配
