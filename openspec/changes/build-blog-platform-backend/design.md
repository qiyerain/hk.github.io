## Context

`pfablog-admin` 当前是 Spring Boot 4.1.1 的空骨架，博客仍由 Hexo 静态构建。用户已确定 Java 26、PostgreSQL + pgvector、Nginx、Docker 和 GitHub Actions。设计必须支持先部署基础服务，再逐步接入统计、内容导入、搜索、RAG 和评论，而不能要求博客页面依赖后端才能渲染。

## Goals / Non-Goals

**Goals:**

- 用 Flyway 管理 PostgreSQL/pgvector schema，保证本地、CI 和生产可重复迁移。
- 提供文章级统计、首页批量统计、Markdown/HTML/PDF 导入和可追溯检索 API。
- 采用端口/适配器隔离 Embedding 和 LLM，未配置供应商时返回受控错误而不是假数据。
- 通过游客凭证和管理员鉴权实现评论基础 CRUD、审核和排序。
- 输出健康检查、Docker 镜像和 GitHub Actions 部署链路。

**Non-Goals:**

- 本次不迁移 Hexo 到 Next.js，不实现公开用户注册，不实现 OCR 和复杂 PDF 版式还原。
- 不使用 ProxySQL 代理 PostgreSQL，不在数据库未确认前启用 HNSW。
- 不把真实服务器 IP、密码、SSH 私钥或模型密钥写入代码仓库。

## Decisions

1. **持久化：MyBatis XML + PostgreSQL + Flyway。** 项目采用简单三层结构 `Controller → Service → Mapper`，SQL 统一放在 XML 中，DO 表示数据库对象，MapStruct 在编译期生成 DO 与 VO 的转换实现。该方式便于显式控制 JSONB、pgvector 和索引相关 SQL；Flyway 负责可审计的版本迁移，不使用 JPA 自动建表，也不引入 DDD 分层。
2. **模型接入：Spring AI + MyBatis pgvector 查询。** Spring AI 提供 `EmbeddingModel`、`ChatClient` 和流式回答的供应商抽象；文章、切片、向量和引用仍通过 MyBatis XML 管理。第一版不直接使用 Spring AI `PgVectorStore`，避免业务过滤条件和事务边界被隐藏在另一套存储抽象中；待 Spring Boot/Spring AI 兼容矩阵和查询需求稳定后再评估切换。
2. **异步导入：任务表 + `TaskExecutor`。** 上传、文本提取、分块和 Embedding 分阶段执行；接口先返回 `jobId`，客户端查询状态。第一版不引入消息队列，避免个人项目增加 Kafka/Redis 运维成本。
3. **解析器：Markdown/HTML/PDF 适配器。** 文本层 PDF 使用 Apache PDFBox，HTML 必须清除脚本和事件属性；OCR 作为后续适配器。替代方案是把解析放在前端，安全边界和大文件处理都不可靠。
4. **检索：全文端口 + 可选向量端口。** PostgreSQL FTS 永远可用；Embedding provider 未配置时搜索仍可用，RAG 返回 `EMBEDDING_NOT_CONFIGURED`。不生成伪向量或伪引用。
5. **鉴权：管理 API 使用固定的 Spring Security 边界。** 第一版允许通过配置的管理 token 运行 CI/后台接口，后续再接 GitHub OAuth；公开统计读取和评论读取不需要登录，但写入限流。
6. **部署：GHCR + SSH 拉取镜像。** GitHub Actions 测试和构建，服务器只运行 Compose；Nginx 反代 API。此流程比服务器直接拉 Git 仓库更少暴露源代码和构建工具。

## Risks / Trade-offs

- [PDF 提取不完整] -> 明确只保证文本层 PDF，保存原文件和页码，失败任务可重试。
- [模型供应商不可用或费用超限] -> provider 端口、超时、限流和状态字段；全文搜索不依赖模型。
- [schema 在开发期变化] -> 所有变更进入 Flyway，baseline 只用于空库，不直接当生产手工脚本。
- [后台 token 泄漏] -> 只存 GitHub Secrets/服务器 `.env`，日志脱敏，支持轮换。
- [并发导入耗尽内存] -> 文件大小限制、有限任务线程、单任务 chunk 上限和超时。

## Migration Plan

1. 添加依赖、配置和 `V1__baseline.sql`，在临时 PostgreSQL + pgvector 上验证。
2. 实现健康检查、统计 API 和数据库测试。
3. 实现同步/导入任务、文本解析、分块预览和状态查询。
4. 实现 FTS、可选 Embedding、RAG 引用和评论 API。
5. 构建 Docker 镜像，Actions 推送 GHCR，服务器先以新容器启动并通过健康检查，再切换 Nginx。
6. 回滚时恢复上一镜像；数据库只执行向前兼容迁移，数据恢复使用备份演练。

## Open Questions

- 生产 PostgreSQL 是宿主机实例还是 pgvector Docker 容器，需要在首次部署前确认。
- 具体 Embedding 模型及维度需要在接入供应商后锁定，当前 DDL 示例为 1536 维。
- 管理员最终使用 GitHub OAuth 还是短期管理 token，需要在 UI 开发前定案。
