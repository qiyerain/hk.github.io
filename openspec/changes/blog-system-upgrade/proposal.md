## Why

当前博客系统存在三大核心问题：

1. **无法在线编辑**：每次修改博客需要本地编辑 Markdown 文件，再执行 git 提交部署，操作繁琐，无法随时随地更新内容
2. **UI 体验差且无搜索**：Fluid 主题界面老旧，缺少站内搜索功能，SEO 优化不足，搜索引擎收录困难
3. **分类管理困难**：文章分类仅通过 Front Matter 标识，物理目录结构混乱，移动分类时文档不会自动迁移到对应目录

这些问题严重影响了内容管理效率和用户体验，现在进行系统性重构。

## What Changes

### 1. CMS 后台管理系统
- 集成 Decap CMS（原 Netlify CMS）
- 提供在线 Markdown 可视化编辑器
- 支持文章的创建、编辑、删除操作
- 实时预览 Markdown 渲染效果
- 媒体资源（图片）上传管理

### 2. UI 重构与 SEO 优化
- 更换为 Anzhiyu 现代主题（已在依赖中）
- 配置站点元数据（title、description、keywords）
- 生成 sitemap.xml 和 robots.txt
- 配置 Open Graph 和 Twitter Card
- 集成站内搜索功能（Algolia 或本地搜索）

### 3. 分类目录管理
- 按 category 自动组织物理目录结构
- 在 CMS 中修改分类时，自动移动文档到对应目录
- 保持 source/_posts/<category>/ 的目录结构

## Capabilities

### New Capabilities
- `cms-backend`: 在线 CMS 后台，支持文章 CRUD 和 Markdown 实时渲染预览
- `ui-seo-optimization`: 现代化 UI 主题和 SEO 优化配置
- `category-directory-sync`: 分类与物理目录同步管理

### Modified Capabilities
- 无现有 spec 需要修改

## Impact

**代码影响**：
- `_config.yml` - 主题和 SEO 配置更新
- `_config.anzhiyu.yml` - 新主题配置文件
- `source/admin/` - CMS 管理界面
- `source/_posts/` - 按分类重组目录结构

**工作流变化**：
- 内容发布：本地编辑 → CMS 在线编辑
- 分类管理：手动维护 → CMS 自动同步目录

**SEO 收益**：
- 搜索引擎更好地收录博客内容
- 社交媒体分享时展示精美卡片