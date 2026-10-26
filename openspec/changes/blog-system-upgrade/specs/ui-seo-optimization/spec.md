## ADDED Requirements

### Requirement: 现代化 UI 主题
系统 SHALL 使用 Anzhiyu 主题提供现代化的用户界面。

#### Scenario: 主题渲染
- **WHEN** 用户访问博客任意页面
- **THEN** 系统使用 Anzhiyu 主题渲染页面

#### Scenario: 响应式布局
- **WHEN** 用户使用不同尺寸的设备访问
- **THEN** 页面自适应显示，移动端和桌面端均有良好体验

### Requirement: 站内搜索功能
系统 SHALL 提供站内文章搜索功能。

#### Scenario: 搜索文章
- **WHEN** 用户在搜索框输入关键词并搜索
- **THEN** 系统显示包含该关键词的文章列表

#### Scenario: 搜索结果排序
- **WHEN** 搜索返回多个结果
- **THEN** 结果按相关度和日期排序

### Requirement: SEO 元数据
系统 SHALL 为每个页面生成完整的 SEO 元数据。

#### Scenario: 首页 SEO
- **WHEN** 用户访问首页
- **THEN** 页面包含完整的 title、description、keywords meta 标签

#### Scenario: 文章页 SEO
- **WHEN** 用户访问文章详情页
- **THEN** 页面包含文章标题、描述、关键词等 SEO 元数据

### Requirement: Sitemap 生成
系统 SHALL 自动生成 sitemap.xml 文件。

#### Scenario: 生成 sitemap
- **WHEN** 执行 hexo generate 时
- **THEN** 系统在 public 目录生成 sitemap.xml

#### Scenario: sitemap 更新
- **WHEN** 添加或修改文章后重新生成
- **THEN** sitemap.xml 包含最新的文章链接

### Requirement: robots.txt 配置
系统 SHALL 提供 robots.txt 文件指导搜索引擎爬虫。

#### Scenario: 访问 robots.txt
- **WHEN** 搜索引擎爬虫请求 /robots.txt
- **THEN** 系统返回正确的爬虫规则配置

### Requirement: Open Graph 支持
系统 SHALL 为页面生成 Open Graph 标签。

#### Scenario: 社交媒体分享
- **WHEN** 用户在社交媒体分享文章链接
- **THEN** 社交平台显示文章标题、描述、缩略图等预览信息

### Requirement: 暗黑模式支持
系统 SHALL 支持亮色/暗色主题切换。

#### Scenario: 自动跟随系统
- **WHEN** 用户系统设置为暗色模式
- **THEN** 博客自动应用暗色主题

#### Scenario: 手动切换
- **WHEN** 用户点击主题切换按钮
- **THEN** 博客在亮色和暗色主题之间切换