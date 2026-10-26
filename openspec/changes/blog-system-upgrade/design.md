## Context

当前是一个 Hexo 静态博客，部署在 GitHub Pages。需要解决三大问题：在线编辑、UI/SEO、分类目录管理。

**技术栈**：
- Hexo 7.3.0
- 当前主题：Fluid 1.9.8 → 目标主题：Anzhiyu 1.6.12
- 部署：GitHub Pages

**约束**：
- 静态站点，CMS 需通过 GitHub API 实现
- 分类目录同步需要自定义脚本支持

## Goals / Non-Goals

**Goals:**
- 实现在线 CMS 后台，支持文章 CRUD 和 Markdown 预览
- 更换现代化主题，完善 SEO 配置
- 实现分类与物理目录同步
- 添加站内搜索功能

**Non-Goals:**
- 不开发自定义后端服务
- 不修改现有文章内容
- 不改变 GitHub Pages 部署方式

## Decisions

### 决策 1：CMS 选择 - Decap CMS

**选择**: Decap CMS（原 Netlify CMS）

**理由**:
- 开源免费，原生支持 GitHub 后端
- 提供 Markdown 可视化编辑器 + 实时预览
- 支持媒体资源管理
- 无需额外服务器

**配置方案**:
```yaml
# source/admin/config.yml
backend:
  name: github
  repo: wwrtpfa/wwrtpfa.github.io
  branch: main

media_folder: "source/images"
public_folder: "/images"

collections:
  - name: "posts"
    label: "文章"
    folder: "source/_posts"
    create: true
    slug: "{{slug}}"
    fields:
      - {label: "标题", name: "title", widget: "string"}
      - {label: "日期", name: "date", widget: "datetime"}
      - {label: "分类", name: "categories", widget: "list"}
      - {label: "标签", name: "tags", widget: "list"}
      - {label: "正文", name: "body", widget: "markdown"}
```

### 决策 2：主题选择 - Anzhiyu

**选择**: Anzhiyu 主题

**理由**:
- 已在项目依赖中（hexo-theme-anzhiyu 1.6.12）
- UI 现代化，支持丰富的自定义配置
- 内置 SEO 优化和搜索功能支持
- 中文文档完善

### 决策 3：搜索功能 - Algolia

**选择**: Algolia 搜索

**理由**:
- Anzhiyu 主题原生支持
- 免费套餐足够个人博客使用
- 搜索速度快，体验好

**替代方案**: 本地搜索（hexo-generator-search）

### 决策 4：SEO 优化方案

**实现要点**:
1. **站点元数据**：在 `_config.yml` 配置 title、subtitle、description、keywords
2. **sitemap.xml**：使用 hexo-generator-sitemap 插件
3. **robots.txt**：手动创建，配置爬虫规则
4. **Open Graph**：主题内置支持，配置 OG 标签
5. **结构化数据**：配置 JSON-LD

### 决策 5：分类目录同步

**问题**: Hexo 默认只通过 Front Matter 的 categories 字段标识分类，物理目录不会自动按分类组织。

**方案**: 通过 CMS 配置 + 后处理脚本实现

**实现方式**:
1. CMS 中按分类组织文档路径：
   ```yaml
   collections:
     - name: "backend"
       label: "后端"
       folder: "source/_posts/后端"
     - name: "frontend"
       label: "前端"
       folder: "source/_posts/前端"
   ```
2. 创建 Node.js 脚本在部署前检查并移动文档：
   - 读取文档的 categories 字段
   - 检查物理路径是否匹配
   - 不匹配则移动文件

## Risks / Trade-offs

**风险 1**: CMS OAuth 配置复杂
→ 缓解：使用 Netlify OAuth 或 GitHub OAuth App

**风险 2**: 分类目录同步脚本可能有边缘情况
→ 缓解：部署前测试，保留原文件备份

**风险 3**: 主题迁移样式可能不兼容
→ 缓解：本地充分测试后再部署

## Migration Plan

**阶段 1：主题迁移**
1. 创建 `_config.anzhiyu.yml`
2. 配置导航、社交链接、暗黑模式
3. 配置 SEO 元数据和 Open Graph
4. 配置 Algolia 搜索

**阶段 2：CMS 集成**
1. 创建 `source/admin/index.html`
2. 创建 `source/admin/config.yml`
3. 配置 GitHub OAuth
4. 配置分类目录结构

**阶段 3：分类同步脚本**
1. 创建 `scripts/category-sync.js`
2. 实现 Front Matter 与目录同步逻辑
3. 集成到部署流程

**阶段 4：SEO 优化**
1. 安装 hexo-generator-sitemap
2. 创建 robots.txt
3. 验证搜索引擎收录

## Open Questions

1. OAuth 代理方案选择：Netlify vs 自建？
2. 是否需要为每个分类创建独立的 CMS collection？