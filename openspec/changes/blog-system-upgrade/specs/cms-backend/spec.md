## ADDED Requirements

### Requirement: CMS 管理界面访问
系统 SHALL 提供可通过 `/admin/` 路径访问的 CMS 管理界面。

#### Scenario: 访问 CMS 管理界面
- **WHEN** 用户访问 `/admin/` 路径
- **THEN** 系统显示 Decap CMS 管理界面

#### Scenario: 未登录用户认证
- **WHEN** 未认证用户尝试访问 CMS
- **THEN** 系统重定向到 GitHub OAuth 登录页面

### Requirement: 文章在线创建
系统 SHALL 支持通过 CMS 在线创建新文章。

#### Scenario: 创建新文章
- **WHEN** 用户在 CMS 中点击"新建文章"
- **THEN** 系统打开 Markdown 编辑器，自动生成 Front Matter 模板

#### Scenario: 设置文章分类和标签
- **WHEN** 用户填写文章的 categories 和 tags 字段
- **THEN** 系统将分类和标签信息写入 Front Matter

### Requirement: 文章在线编辑
系统 SHALL 支持在线编辑现有文章。

#### Scenario: 编辑文章内容
- **WHEN** 用户选择一篇文章并点击编辑
- **THEN** 系统加载文章内容到可视化编辑器

#### Scenario: Markdown 实时预览
- **WHEN** 用户在编辑器中输入 Markdown 内容
- **THEN** 系统实时显示渲染后的 HTML 预览效果

#### Scenario: 保存编辑结果
- **WHEN** 用户点击保存按钮
- **THEN** 系统将修改提交到 Git 仓库，触发自动部署

### Requirement: 文章在线删除
系统 SHALL 支持在线删除文章。

#### Scenario: 删除文章
- **WHEN** 用户选择一篇文章并点击删除
- **THEN** 系统弹出确认对话框，确认后删除文件并提交更改

### Requirement: 媒体资源管理
系统 SHALL 支持图片等媒体资源的上传和管理。

#### Scenario: 上传图片
- **WHEN** 用户在媒体库中上传图片
- **THEN** 系统将图片保存到指定目录

#### Scenario: 在文章中插入图片
- **WHEN** 用户在编辑器中选择已上传的图片
- **THEN** 系统在 Markdown 中插入正确的图片引用语法