## Context

当前项目是一个 Hexo 静态博客，部署在 GitHub Pages 上。

**技术栈**：
- Hexo 7.3.0 - 静态站点生成器
- 当前主题：Fluid 1.9.8
- 目标主题：Anzhiyu 1.6.12（已安装）
- 部署：GitHub Pages → https://bolg.pengfanao.top

**约束**：
- 静态站点，无后端服务器
- CMS 需要通过 GitHub API 实现 OAuth 认证
- 内容存储在 Git 仓库中

## Goals / Non-Goals

**Goals:**
- 迁移到 Anzhiyu 主题，获得现代化 UI
- 集成 Decap CMS，实现在线文章管理
- 支持 GitHub OAuth 认证访问 CMS
- 保留现有文章内容和媒体资源

**Non-Goals:**
- 不修改现有文章内容
- 不实现自定义后端服务
- 不改变部署目标（仍为 GitHub Pages）

## Decisions

### 决策 1：CMS 选择 - Decap CMS

**选择**: Decap CMS（原 Netlify CMS）

**理由**:
- 开源免费，无需付费服务
- 原生支持 GitHub 后端
- 支持静态站点部署
- 提供 Markdown 可视化编辑器
- 支持媒体库管理

**替代方案**:
- hexo-admin: 需要运行 Hexo server，不适合纯静态部署
- TinaCMS: 功能强大但配置复杂，学习成本高
- Forestry.io: 已停止服务

### 决策 2：主题选择 - Anzhiyu

**选择**: Anzhiyu 主题

**理由**:
- 已在项目依赖中（hexo-theme-anzhiyu 1.6.12）
- 基于 Butterfly 主题二次开发，UI 更现代
- 支持丰富的自定义配置
- 中文文档完善

**替代方案**:
- Butterfly: 更流行但配置复杂
- 保持 Fluid: 无法满足现代化 UI 需求

### 决策 3：认证方案 - GitHub OAuth

**选择**: 使用 GitHub OAuth App

**理由**:
- Decap CMS 官方推荐方案
- 无需自建认证服务器
- 支持使用 GitHub 身份验证

**实现**:
- 创建 GitHub OAuth App
- 配置 redirect_uri
- 使用 Netlify Identity 或自建 OAuth 代理

## Risks / Trade-offs

**风险 1**: Decap CMS 需要配置 OAuth 才能在生产环境使用
→ 缓解：使用 Netlify OAuth 或自建 OAuth 代理服务

**风险 2**: 主题迁移可能导致样式不兼容
→ 缓解：先在本地测试，逐步迁移配置

**风险 3**: 现有文章 Front Matter 格式可能需要调整
→ 缓解：Anzhiyu 兼容标准 Hexo Front Matter，只需少量调整

## Migration Plan

**阶段 1：主题迁移**
1. 创建 `_config.anzhiyu.yml` 配置文件
2. 更新 `_config.yml` 中的 theme 设置
3. 迁移自定义配置（导航、页脚、社交链接等）
4. 本地测试并修复问题

**阶段 2：CMS 集成**
1. 创建 `source/admin/index.html` 管理界面
2. 创建 `source/admin/config.yml` CMS 配置
3. 配置 GitHub OAuth App
4. 测试在线编辑功能

**阶段 3：部署验证**
1. 提交所有更改
2. 触发 GitHub Actions 部署
3. 验证线上 CMS 功能

**回滚策略**: 保留 `_config.fluid.yml`，可随时切换回 Fluid 主题

## Open Questions

1. 是否需要配置 OAuth 代理服务？（如果不想用 Netlify）
2. Anzhiyu 主题的具体自定义需求（颜色、布局、功能模块）？
3. CMS 编辑权限是否需要多人协作？