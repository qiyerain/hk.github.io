## Outcome

文章稳定 ID 已贯通 Hexo Front Matter、静态页面、统计 API、统计表、评论和知识库引用。标题、日期或 URL 改变不会再改变文章业务归属。

## Validation

- `cd /Users/pengfanao/code/pfablog-admin && ./mvnw clean test -q`：通过。
- `cd /Users/pengfanao/code/wwrtpfa.github.io && npm run build`：通过。
- `npm run audit:repo`：通过。
- 所有 `source/_posts/**/*.md` 均包含 `article_id`。
- `git diff --check`：通过。

## Deployment Note

如果数据库只删了业务表但保留 `flyway_schema_history`，Flyway 可能不会重跑迁移。重建测试库时应清空 `public` schema 后重新启动后端，让 V1、V2、V3 按顺序执行。
