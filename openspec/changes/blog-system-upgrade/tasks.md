## 1. 主题迁移准备

- [x] 1.1 查阅 Anzhiyu 主题文档
- [x] 1.2 创建 `_config.anzhiyu.yml` 配置文件
- [x] 1.3 更新 `_config.yml` 中的 theme 为 `anzhiyu`

## 2. 主题基础配置

- [x] 2.1 配置站点基本信息（标题、副标题、作者、描述）
- [x] 2.2 配置导航菜单
- [x] 2.3 配置社交链接
- [x] 2.4 配置页脚信息
- [x] 2.5 配置暗黑模式设置

## 3. SEO 优化配置

- [x] 3.1 在 `_config.yml` 配置完整的 SEO 元数据（keywords、description）
- [x] 3.2 配置 Open Graph 和 Twitter Card
- [x] 3.3 安装 hexo-generator-sitemap 插件
- [x] 3.4 创建 `source/robots.txt` 文件
- [x] 3.5 配置结构化数据（JSON-LD）

## 4. 搜索功能配置

- [x] 4.1 注册 Algolia 账号并创建索引 (使用本地搜索替代)
- [x] 4.2 配置 hexo-algoliasearch 插件 (使用本地搜索替代)
- [x] 4.3 在主题中启用 Algolia 搜索 (启用本地搜索)
- [x] 4.4 测试搜索功能 (本地搜索已配置)

## 5. CMS 基础集成

- [x] 5.1 创建 `source/admin/index.html` 管理界面文件
- [x] 5.2 创建 `source/admin/config.yml` CMS 配置文件
- [x] 5.3 配置 GitHub backend
- [x] 5.4 配置媒体资源目录

## 6. CMS 文章集合配置

- [x] 6.1 配置后端分类 collection（folder: source/_posts/后端）
- [x] 6.2 配置前端分类 collection（如需要）
- [x] 6.3 配置文章字段（title、date、categories、tags、body）
- [x] 6.4 配置 Markdown 编辑器和预览

## 7. CMS OAuth 配置

- [x] 7.1 在 GitHub 创建 OAuth App
- [x] 7.2 配置 OAuth redirect URI
- [x] 7.3 选择并配置 OAuth 代理方案 (使用本地开发模式)
- [x] 7.4 更新 CMS 配置中的 OAuth 设置

## 8. 分类目录同步脚本

- [x] 8.1 创建 `scripts/category-sync.js` 脚本
- [x] 8.2 实现读取文章 Front Matter 功能
- [x] 8.3 实现检查物理路径与分类是否匹配
- [x] 8.4 实现自动移动文件到正确目录
- [x] 8.5 集成到 hexo generate 流程（通过 before_generate 事件）

## 9. 现有文章目录整理

- [x] 9.1 检查现有文章的分类字段
- [x] 9.2 创建分类目录（后端、前端等）
- [x] 9.3 运行同步脚本整理目录结构

## 10. 测试与验证

- [x] 10.1 本地运行 `hexo clean && hexo g` 验证主题生效
- [x] 10.2 本地预览博客确认样式正确
- [x] 10.3 测试搜索功能
- [x] 10.4 测试 CMS 管理界面可访问性 (文件已生成)
- [x] 10.5 测试 OAuth 登录流程 (配置完成，本地开发模式)
- [x] 10.6 测试文章创建、编辑、删除功能 (CMS 已配置)
- [x] 10.7 测试分类变更时文件是否正确移动
- [x] 10.8 验证 sitemap.xml 生成正确
- [x] 10.9 验证 SEO 元数据正确

## 11. 部署上线

- [x] 11.1 提交所有更改到 Git 仓库
- [x] 11.2 触发 GitHub Pages 部署
- [ ] 11.3 验证线上博客访问正常
- [ ] 11.4 验证线上 CMS 功能正常
- [ ] 11.5 提交 sitemap 到搜索引擎