## ADDED Requirements

### Requirement: 分类目录结构
系统 SHALL 按 `source/_posts/<category>/` 结构组织文章物理目录。

#### Scenario: 默认分类目录
- **WHEN** 文章未指定分类
- **THEN** 文件存储在 `source/_posts/` 根目录

#### Scenario: 指定分类目录
- **WHEN** 文章指定分类为"后端"
- **THEN** 文件存储在 `source/_posts/后端/` 目录

### Requirement: CMS 分类管理
系统 SHALL 在 CMS 中按分类组织文章集合。

#### Scenario: 后端分类文章列表
- **WHEN** 用户在 CMS 中选择"后端"分类
- **THEN** 系统显示 `source/_posts/后端/` 目录下的所有文章

#### Scenario: 前端分类文章列表
- **WHEN** 用户在 CMS 中选择"前端"分类
- **THEN** 系统显示 `source/_posts/前端/` 目录下的所有文章

### Requirement: 分类变更时目录同步
系统 SHALL 在文章分类变更时自动移动文件到对应目录。

#### Scenario: 修改文章分类
- **WHEN** 用户将文章分类从"后端"改为"前端"
- **THEN** 文件从 `source/_posts/后端/` 移动到 `source/_posts/前端/`

#### Scenario: 添加新分类
- **WHEN** 用户为文章添加新的分类
- **THEN** 系统创建对应的目录并移动文件

#### Scenario: 移除分类
- **WHEN** 用户移除文章的所有分类
- **THEN** 文件移动到 `source/_posts/` 根目录

### Requirement: Front Matter 与目录一致性
系统 SHALL 确保 Front Matter 的 categories 字段与物理目录一致。

#### Scenario: 部署前检查
- **WHEN** 执行 hexo generate 或 deploy 前
- **THEN** 系统检查所有文章的 categories 与物理路径是否匹配

#### Scenario: 自动修复不一致
- **WHEN** 检测到 Front Matter 与目录不一致
- **THEN** 系统自动移动文件到正确目录