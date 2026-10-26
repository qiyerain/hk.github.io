## Why

博客已经确定以 Hexo 承担静态内容、Spring Boot 承担统计和知识服务，但后端目前仍是空骨架，文章阅读量、内容导入、检索、评论和自动部署都没有可运行实现。现在需要把已经确认的架构转成有迁移、有接口、有测试和可部署镜像的第一版服务，并用一篇公开文章记录实际部署链路。

## What Changes

- 新增 PostgreSQL + pgvector 的 Flyway 基线迁移和环境配置。
- 新增文章级 PV、有效阅读、阅读会话、站点汇总和首页批量统计 API。
- 新增 Hexo Markdown 同步、Markdown/HTML/PDF 导入任务、分块预览和入库 API。
- 新增 PostgreSQL 全文搜索与可插拔向量检索端口，RAG 响应保留真实引用。
- 新增游客评论、回复、排序、点赞和管理审核 API。
- 新增统一错误格式、请求校验、CORS、安全边界和健康检查。
- 新增 Dockerfile、Compose 示例和 GitHub Actions 构建部署工作流。
- 新增一篇 Hexo 部署文章，说明 DNS、GHCR、SSH、Nginx、PostgreSQL/pgvector 和回滚流程。

## Capabilities

### New Capabilities

- `blog-analytics`: 按文章路径记录和查询 PV、UV、有效阅读和阅读时长。
- `knowledge-ingestion-search`: 同步或导入内容、分块、全文/向量检索并返回可追溯引用。
- `blog-comments`: 提供游客评论、回复、反应、排序和管理员审核能力。
- `backend-delivery`: 使用容器、GHCR、SSH、Nginx 和健康检查部署后端服务。

### Modified Capabilities

- `ui-seo-optimization`: 首页文章卡片能够按 slug 批量读取真实文章统计，不阻塞静态内容展示。

## Impact

- 博客仓库新增部署文章、OpenSpec 记录，并在后续前端阶段接入统计与搜索 API。
- `pfablog-admin` 新增 MyBatis XML、MapStruct、Validation、Flyway、PostgreSQL、Actuator、解析器、迁移、控制器、服务和测试。
- 生产环境需要 PostgreSQL 18 + pgvector、GHCR 拉取权限、SSH deploy key、Nginx 和 `api.pengfanao.top` DNS。
- ProxySQL 不参与 PostgreSQL 链路；数据库结构只能由 Flyway 管理。
