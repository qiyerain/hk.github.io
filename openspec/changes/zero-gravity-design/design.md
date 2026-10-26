## Context

此变更是在 `ui-refactor-with-cms` 提案基础上的 UI 风格增强。

**基础变更**：
- 使用 Anzhiyu 主题替换 Fluid 主题
- 集成 Decap CMS 在线编辑功能

**无重力设计目标**：
在 Anzhiyu 主题基础上，通过自定义 CSS 和 JS 实现现代化的无重力设计风格。

## Goals / Non-Goals

**Goals:**
- 实现悬浮卡片和玻璃拟态视觉效果
- 添加流畅的过渡动画和微交互
- 优化留白和空间感
- 保持性能，不影响页面加载速度

**Non-Goals:**
- 不创建全新主题，仅通过自定义样式增强
- 不添加复杂的 3D 效果（影响性能）
- 不改变主题的核心功能

## Decisions

### 决策 1：实现方式 - 自定义 CSS/JS 注入

**选择**: 通过 Hexo 的 inject 功能注入自定义 CSS 和 JS

**理由**:
- 不修改主题源码，便于主题升级
- 灵活调整样式，不影响原有功能
- 可以逐步迭代设计效果

**实现方式**:
- `source/css/zero-gravity.css` 注入到 head
- `source/js/zero-gravity.js` 注入到 body 结尾
- 在 `_config.anzhiyu.yml` 中配置 inject

### 决策 2：悬浮效果 - 多层阴影系统

**选择**: 使用 CSS box-shadow 创建多层阴影

**阴影层级**:
```css
/* 轻微悬浮 - 默认状态 */
--shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.08);

/* 中等悬浮 - 悬停状态 */
--shadow-md: 0 8px 24px rgba(0, 0, 0, 0.12);

/* 高度悬浮 - 激活/焦点状态 */
--shadow-lg: 0 16px 48px rgba(0, 0, 0, 0.16);
```

### 决策 3：玻璃拟态 - backdrop-filter

**选择**: 使用 backdrop-filter 实现模糊透明效果

**实现**:
```css
.glass-effect {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}
```

**兼容性处理**:
- Safari 需要 -webkit 前缀
- 不支持的浏览器降级为纯色背景

### 决策 4：动画方案 - CSS Transitions + Keyframes

**选择**: 使用 CSS 实现动画，JS 仅用于滚动触发

**理由**:
- CSS 动画性能更好（GPU 加速）
- 仅使用 transform 和 opacity 保证流畅
- 尊重 prefers-reduced-motion 设置

**动画类型**:
1. **悬浮进入动画**: 元素进入视口时淡入上浮
2. **悬停微交互**: 卡片轻微上浮 + 阴影加深
3. **页面过渡**: 淡入淡出效果

### 决策 5：色彩渐变

**选择**: 使用柔和的渐变色增加视觉层次

**渐变应用**:
- 首页 Banner：渐变背景
- 文章标题：渐变文字
- 按钮：渐变背景 + 悬停变化

## Risks / Trade-offs

**风险 1**: 玻璃拟态在某些浏览器不支持
→ 缓解：使用 @supports 检测，降级为纯色背景

**风险 2**: 过多动画可能影响性能
→ 缓解：使用 transform/opacity，避免重绘；尊重 prefers-reduced-motion

**风险 3**: 与主题样式冲突
→ 缓解：使用更高优先级选择器，必要时使用 !important

## Open Questions

1. 是否需要为暗黑模式单独设计无重力效果？
2. 动画强度偏好：轻柔 vs 明显？