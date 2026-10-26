## 1. 主题迁移准备

- [ ] 1.1 查阅 Anzhiyu 主题文档，了解配置选项
- [ ] 1.2 创建 `_config.anzhiyu.yml` 配置文件
- [ ] 1.3 更新 `_config.yml` 中的 theme 为 `anzhiyu`

## 2. 主题配置迁移

- [ ] 2.1 迁移站点基本信息（标题、副标题、作者）
- [ ] 2.2 配置导航菜单
- [ ] 2.3 配置社交链接（GitHub、微信等）
- [ ] 2.4 配置页脚信息
- [ ] 2.5 配置首页 Banner 图片和文字
- [ ] 2.6 配置暗黑模式设置

## 3. 功能配置

- [ ] 3.1 配置代码高亮主题
- [ ] 3.2 配置文章目录（TOC）显示
- [ ] 3.3 配置图片灯箱功能
- [ ] 3.4 配置搜索功能（Algolia 或本地搜索）
- [ ] 3.5 配置评论系统（Valine/Twikoo/Giscus）

## 4. CMS 集成

- [ ] 4.1 创建 `source/admin/index.html` 管理界面文件
- [ ] 4.2 创建 `source/admin/config.yml` CMS 配置文件
- [ ] 4.3 配置 CMS 后端为 GitHub
- [ ] 4.4 配置文章集合（posts）的编辑字段
- [ ] 4.5 配置媒体文件夹路径

## 5. OAuth 配置

- [ ] 5.1 在 GitHub 创建 OAuth App
- [ ] 5.2 配置 OAuth redirect URI
- [ ] 5.3 选择 OAuth 代理方案（Netlify Identity 或自建）
- [ ] 5.4 更新 CMS 配置中的 OAuth 相关设置

## 6. 测试与验证

- [ ] 6.1 本地运行 `hexo clean && hexo g` 验证主题生效
- [ ] 6.2 本地预览博客确认样式正确
- [ ] 6.3 测试 CMS 管理界面可访问性
- [ ] 6.4 测试 OAuth 登录流程
- [ ] 6.5 测试文章编辑和保存功能
- [ ] 6.6 测试媒体资源上传功能

## 7. 部署上线

- [ ] 7.1 提交所有更改到 Git 仓库
- [ ] 7.2 触发 GitHub Pages 部署
- [ ] 7.3 验证线上博客访问正常
- [ ] 7.4 验证线上 CMS 功能正常