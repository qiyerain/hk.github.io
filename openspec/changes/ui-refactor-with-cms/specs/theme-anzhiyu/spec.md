## ADDED Requirements

### Requirement: 主题切换
系统 SHALL 使用 Anzhiyu 主题作为博客默认主题。

#### Scenario: 主题生效
- **WHEN** 用户访问博客首页
- **THEN** 系统使用 Anzhiyu 主题渲染页面

#### Scenario: 配置文件加载
- **WHEN** 存在 `_config.anzhiyu.yml` 配置文件
- **THEN** 系统加载并应用自定义主题配置

### Requirement: 响应式布局
主题 SHALL 支持桌面和移动端的自适应布局。

#### Scenario: 桌面端显示
- **WHEN** 用户使用桌面浏览器访问
- **THEN** 系统显示多列布局和完整导航

#### Scenario: 移动端显示
- **WHEN** 用户使用移动设备访问
- **THEN** 系统切换为单列布局和折叠导航菜单

### Requirement: 文章阅读体验
主题 SHALL 提供优化的文章阅读体验。

#### Scenario: 代码高亮
- **WHEN** 文章包含代码块
- **THEN** 系统应用语法高亮显示

#### Scenario: 图片灯箱
- **WHEN** 用户点击文章中的图片
- **THEN** 系统以灯箱模式全屏显示图片

#### Scenario: 目录导航
- **WHEN** 文章包含多个标题
- **THEN** 系统在侧边栏显示文章目录

### Requirement: 搜索功能
主题 SHALL 提供站点内容搜索功能。

#### Scenario: 搜索文章
- **WHEN** 用户在搜索框输入关键词
- **THEN** 系统显示匹配的文章列表

### Requirement: 暗黑模式
主题 SHALL 支持亮色/暗色主题切换。

#### Scenario: 自动切换
- **WHEN** 用户的系统设置为暗色模式
- **THEN** 博客自动应用暗色主题

#### Scenario: 手动切换
- **WHEN** 用户点击主题切换按钮
- **THEN** 博客在亮色和暗色主题之间切换

### Requirement: 社交功能
主题 SHALL 支持社交链接展示。

#### Scenario: 显示社交图标
- **WHEN** 配置了社交链接
- **THEN** 页脚或侧边栏显示对应的社交平台图标

### Requirement: 评论系统
主题 SHALL 支持集成评论系统。

#### Scenario: 评论加载
- **WHEN** 用户访问文章详情页
- **THEN** 系统加载评论组件（如 Valine、Twikoo 等）