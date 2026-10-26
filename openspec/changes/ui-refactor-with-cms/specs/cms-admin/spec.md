## ADDED Requirements

### Requirement: CMS 管理界面访问
系统 SHALL 提供可通过 `/admin/` 路径访问的 CMS 管理界面。

#### Scenario: 访问 CMS 管理界面
- **WHEN** 用户访问 `https://bolg.pengfanao.top/admin/`
- **THEN** 系统显示 Decap CMS 管理界面

#### Scenario: 未登录用户重定向
- **WHEN** 未认证用户尝试访问 CMS
- **THEN** 系统重定向到 GitHub OAuth 登录页面

### Requirement: 文章列表管理
系统 SHALL 在 CMS 中显示所有已发布的文章列表。

#### Scenario: 查看文章列表
- **WHEN** 用户进入 CMS 内容管理页面
- **THEN** 系统显示所有文章的标题、日期、分类信息

#### Scenario: 按分类筛选文章
- **WHEN** 用户选择特定分类
- **THEN** 系统只显示该分类下的文章

### Requirement: 在线文章编辑
系统 SHALL 提供可视化 Markdown 编辑器用于编辑文章。

#### Scenario: 创建新文章
- **WHEN** 用户点击"新建文章"按钮
- **THEN** 系统打开编辑器，自动生成默认 Front Matter

#### Scenario: 编辑现有文章
- **WHEN** 用户选择一篇文章并点击编辑
- **THEN** 系统加载文章内容到可视化编辑器

#### Scenario: 实时预览
- **WHEN** 用户在编辑器中输入内容
- **THEN** 系统实时显示 Markdown 渲染后的预览效果

### Requirement: 媒体资源管理
系统 SHALL 提供图片等媒体资源的上传和管理功能。

#### Scenario: 上传图片
- **WHEN** 用户在媒体库点击上传并选择图片文件
- **THEN** 系统将图片保存到 `source/images/` 目录

#### Scenario: 在文章中插入图片
- **WHEN** 用户在编辑器中选择已上传的图片
- **THEN** 系统在文章中插入正确的图片引用语法

### Requirement: 文章发布流程
系统 SHALL 支持文章的草稿保存和发布功能。

#### Scenario: 保存草稿
- **WHEN** 用户编辑文章并点击"保存草稿"
- **THEN** 系统将文章保存为草稿状态，不公开显示

#### Scenario: 发布文章
- **WHEN** 用户点击"发布"按钮
- **THEN** 系统提交更改到 Git 仓库，触发自动部署

### Requirement: GitHub OAuth 认证
系统 SHALL 使用 GitHub OAuth 进行用户身份验证。

#### Scenario: GitHub 登录
- **WHEN** 用户点击"使用 GitHub 登录"
- **THEN** 系统重定向到 GitHub 授权页面

#### Scenario: 授权成功
- **WHEN** 用户在 GitHub 授权成功
- **THEN** 系统返回 CMS 管理界面，显示已登录状态