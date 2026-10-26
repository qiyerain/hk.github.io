## Why

评论、统计、知识库切片和 RAG 引用需要跨 URL 变化保持同一篇文章的归属。slug 会因标题、日期或 permalink 变化，不能继续作为业务主键。

## What Changes

- 为 Hexo 存量文章和新文章写入稳定的 `article_id` Front Matter。
- 统计前端和后端接口按 `articleId` 上报、查询和批量回填。
- 通过 Flyway V3 将统计表与 `knowledge_document.id` 关联，并同步架构 DDL 与文档。

## Impact

- Hexo 文章 Front Matter、文章页和首页卡片模板、统计脚本。
- Spring Boot 统计模型、Mapper XML、Controller、Service 和数据库迁移。
- 评论、知识库和 RAG 的既有 article ID 契约保持一致。
