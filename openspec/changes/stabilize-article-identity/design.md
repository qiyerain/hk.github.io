## Identity Contract

`articleId = UUIDv5(FIXED_NAMESPACE, normalize(title) + "\\n" + dateUtcIso)`。只在文章首次创建或存量迁移时生成并写入 Front Matter；之后修改标题、日期、slug 或 permalink 都不重新生成。

`slug` 只用于公开 URL、路径快照和兼容校验。数据库业务关系统一使用 `knowledge_document.id` / `article_id`。

## Data Flow

文章页从 `meta[name="article-id"]` 读取 ID 上报 PV；首页卡片携带 `data-analytics-article-id`，通过批量接口一次获取统计。Flyway V3 为三张统计表增加可空 `article_id`，历史数据按 canonical path 尝试回填，无法匹配的旧非文章页面保留 NULL。
