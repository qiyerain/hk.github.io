## Why

在前一个 UI 重构提案中，我们计划使用 Anzhiyu 主题替换 Fluid 主题。但标准的主题配置可能显得过于传统和"沉重"。

**无重力设计（Zero Gravity Design）** 是一种现代 UI 设计风格，通过以下特点创造轻盈、漂浮的视觉体验：
- 悬浮卡片与柔和阴影
- 流畅的过渡动画
- 大量留白与空间感
- 玻璃拟态效果（Glassmorphism）
- 渐变色与深度层次

这种设计风格可以让博客看起来更现代、更有呼吸感，提升用户的阅读体验。

## What Changes

- **悬浮卡片设计**：文章卡片、侧边栏组件采用悬浮效果，配合柔和阴影
- **流畅过渡动画**：页面切换、元素悬停、滚动时添加平滑动画
- **玻璃拟态效果**：导航栏、卡片背景使用半透明模糊效果
- **留白优化**：增加元素间距，创造轻盈的空间感
- **渐变色应用**：标题、按钮、背景使用渐变色增加视觉层次
- **微交互设计**：悬停、点击、滚动时的细节动画反馈

## Capabilities

### New Capabilities
- `zero-gravity-ui`: 无重力设计风格的 UI 组件和动画效果，包括悬浮卡片、玻璃拟态、流畅过渡等

### Modified Capabilities
- `theme-anzhiyu`: 在 Anzhiyu 主题基础上增加自定义 CSS 和 JS 实现无重力设计效果

## Impact

**代码影响**：
- `source/css/zero-gravity.css` - 自定义样式文件
- `source/js/zero-gravity.js` - 动画和交互脚本
- `_config.anzhiyu.yml` - 主题配置调整

**性能影响**：
- CSS 动画性能优化（使用 transform 和 opacity）
- 懒加载动画效果，避免首屏性能问题
- 使用 will-change 提示浏览器优化渲染