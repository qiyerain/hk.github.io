## Why

当前博客使用 Hexo + Fluid 主题，存在以下痛点：
1. **内容编辑困难**：每次发布或修改文章需要本地编辑 Markdown 文件，然后执行 git 提交和部署，无法随时随地更新内容
2. **缺少可视化编辑**：没有在线编辑器，无法实时预览文章效果
3. **主题不够现代**：Fluid 主题虽然功能完善，但用户希望拥有更现代化的视觉体验

现在重构 UI 并添加 CMS 后台，可以大幅提升内容管理效率，改善用户体验。

## What Changes

- **更换博客主题**：从 Fluid 主题迁移到 Anzhiyu 主题（已在依赖中），获得更现代化的 UI 设计和更好的交互体验
- **集成在线 CMS**：添加 Decap CMS（原 Netlify CMS），实现：
  - 在线可视化编辑 Markdown 文章
  - 富文本编辑器支持
  - 媒体资源（图片）上传管理
  - 文章草稿和发布流程
- **配置调整**：更新主题配置、CMS 配置、部署流程

## Capabilities

### New Capabilities
- `cms-admin`: 在线 CMS 后台管理功能，支持文章的创建、编辑、删除和媒体资源管理
- `theme-anzhiyu`: 使用 Anzhiyu 主题替换 Fluid 主题，提供现代化的博客 UI

### Modified Capabilities
- 无现有 spec 需要修改

## Impact

**代码影响**：
- `_config.yml` - 主题配置更新
- `_config.anzhiyu.yml` - 新主题配置文件
- `source/admin/` - CMS 管理界面文件
- `static/admin/` - CMS 配置文件

**依赖变化**：
- 已安装：`hexo-theme-anzhiyu` (v1.6.12)
- 需添加：无需额外 npm 包（Decap CMS 通过 CDN 集成）

**工作流变化**：
- 内容发布从「本地编辑 → git push」变为「CMS 在线编辑 → 自动提交部署」
- 支持 GitHub OAuth 认证访问 CMS