# 博客统计展示与知识库同步迭代记录

日期：2026-10-15

## 背景

Hexo 博客需要展示真实统计数据，并把文章同步到独立的 Spring Boot 后端。两条链路的职责不同：

- 统计链路负责页面访问、阅读时长和滚动深度，文章发布后立即生效。
- 知识库链路负责文章导入、分片和向量化，可以异步执行或关闭 Embedding。

旧流程的问题包括：文章页只上报访问但不展示数据、本地和线上 API 地址混用、本地开发没有独立增量基线，以及 Hexo 会错误加载 `scripts/` 目录中的 Shell 文件。

## 文章统计展示

文章详情页在版权信息之后、分页之前增加紧凑统计区域，显示：

```text
阅读次数
独立访客数
有效阅读次数
累计阅读时长
```

相关文件：

```text
themes/anzhiyu/layout/post.pug
source/js/blog-analytics.js
source/custom/xiaoao-redesign.css
```

统计请求失败时区域保持隐藏，不阻塞静态文章正文。

## 阅读事件

文章页面会上报：

```text
page_view
reading_heartbeat
reading_complete
```

有效阅读条件与后端一致：

```text
阅读时间至少 10 秒
最大滚动深度至少 50%
```

PJAX 页面切换后会重新初始化当前文章统计，避免继续使用上一页的文章 ID。

## 首页站点统计

首页右侧作者信息下方增加站点数据区域，展示：

```text
总访问量
总阅读时间
今日访问量
```

不新增后端接口，复用：

```text
GET /api/v1/analytics/site-summary?from=2000-01-01&to={today}
GET /api/v1/analytics/site-summary?from={today}&to={today}
```

## API 环境隔离

API 地址在 Hexo 构建时写入：

```text
window.__BLOG_API_BASE__
```

环境规则：

| 环境 | API 地址来源 |
|------|-------------|
| 本地开发 | 默认 `http://localhost:8080` |
| 线上构建 | 固定为公开地址 `https://blogadmin.pengfanao.top` |

后端公网地址不是密钥，因此在 GitHub Actions 中显式配置；管理 Token 不会写进静态页面，只在知识同步任务的请求头中使用。

## 本地知识同步

`npm run dev` 启动前调用：

```text
node tools/hexo-server.js --sync-knowledge --watch
```

本地同步状态保存在：

```text
.cache/knowledge-sync-state.json
```

`.cache` 已被 `.gitignore` 忽略，不会提交或带到线上。

同步规则：

1. 第一次没有本地基线时，读取所有被 Git 跟踪的文章并分批提交。
2. 同步成功后记录当前 Git Commit。
3. 后续启动只处理基线之后的提交变更、工作区修改和未跟踪的新文章。
4. 单批最多 100 篇、总正文最多 2,000,000 字符、单篇最多 200,000 字符。
5. 本地后端不可用或同步失败时，打印错误但继续启动静态开发服务器。
6. `npm run server` 只启动站点，不自动同步知识库。

## Front Matter 兼容

知识同步解析器现在兼容：

```text
文件开头空白行
UTF-8 BOM
LF 换行
CRLF 换行
```

真正缺少 Front Matter 或 `article_id` 的文章仍会报错，避免静默漏同步。

## 线上知识同步

线上继续复用 `tools/sync-knowledge.mjs`，但增量基线来自 GitHub：

```text
GITHUB_EVENT_BEFORE
GITHUB_SHA
```

线上不会读取本地 `.cache`。如果首次部署或浅克隆中找不到前一提交，则安全退化为全量分批 upsert。

## 线上发布保护

前端工作流在构建前调用线上后端兼容性探针：

```text
GET /api/v1/analytics/pages/00000000-0000-4000-8000-000000000000
```

只有后端返回新契约中的 `success=true` 且 `data.articleId` 正确，才继续：

```text
构建静态站点
提交知识库增量任务
发布 deploy 分支
```

因此正确发布顺序为“后端先发布，前端后发布”。后端版本不兼容时，前端不会继续上线。

## Hexo Shell 脚本加载修复

Hexo 会把根目录 `scripts/` 下的所有文件当成 JavaScript 执行，因此曾错误解析：

```text
scripts/wechat_draft_local.sh
```

`tools/build.js` 和 `tools/hexo-server.js` 会在 Hexo 运行期间临时隔离该 Shell 文件，退出后恢复原路径。原有调用方式保持不变：

```bash
scripts/wechat_draft_local.sh <run-id> --dry-run
```

## 验证记录

```text
node --check source/js/blog-analytics.js
node --check tools/sync-knowledge.mjs
node --check tools/hexo-server.js
npm run build
```

结果均通过，Hexo 构建退出码为 0。

本地真实同步结果：

```text
文章检查：60 篇，invalid=0
首次同步：成功提交 60 篇
第二次同步：No Markdown changes to synchronize.
```

## 回滚说明

- 删除文章统计模板和样式时，应同时移除对应的数据填充逻辑。
- 恢复硬编码 API 地址会破坏本地与线上隔离，不建议回滚。
- 如需停用本地自动同步，可将 `npm run dev` 恢复为不带 `--sync-knowledge`；`npm run server` 本身始终不会自动同步。
- 不应删除 `knowledge_sync_job`、`knowledge_import_job`、`knowledge_document` 或 `knowledge_chunk` 等业务表。
