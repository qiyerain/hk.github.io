## Context

当前 `fetch_daily_images.py` 在 PicGo 不可用时会把失败任务写入 `.cache/image-upload-queue/queue.json`，不会把本地路径写入 `album.yml`。但历史上曾有本地回退逻辑，导致 `source/img/curated/` 存有 90 张图片（245 MB），其中 55 张仍在 `album.yml` 中被引用。用户希望这些图片全部上云，后续任务自动启动 PicGo，避免再次堆积。

## Goals / Non-Goals

**Goals:**

- 自动检测并启动 PicGo，无需用户手动打开。
- 把 `album.yml` 中引用的本地图片全部迁移到 OSS。
- 删除已迁移的本地文件，减小仓库体积。
- 更新 SKILL.md，让用户了解新行为。

**Non-Goals:**

- 不改动数据来源或授权校验逻辑。
- 不上传 `album.yml` 未引用的图片（视为可清理的垃圾）。
- 不修改 Hexo 主题或页面渲染。

## Decisions

### PicGo 自动启动

在 `upload_via_picgo` 调用前增加 `ensure_picgo_running()`：先探测 `127.0.0.1:36677`，若未就绪则执行 `open -a PicGo`（macOS），最多等待 30 秒。仍失败则抛出异常终止脚本，避免产生新的本地堆积。支持环境变量 `PICGO_AUTOSTART=0` 关闭自动启动。

### 历史图片迁移

新增 `tools/migrate-curated-to-oss.py`：

1. 备份 `source/_data/album.yml`。
2. 正则提取所有 `/img/curated/...` 本地路径。
3. 对每个唯一路径调用 PicGo 上传，拿到 OSS URL 后在文本中全局替换。
4. 同步替换 `cover` 和 `top_background` 中的相同路径。
5. 上传成功后删除源文件；失败的文件保留并汇总报告。
6. 输出迁移统计。

### 防止再次堆积

将 `source/img/curated/` 加入 `.gitignore`。当前 `fetch_daily_images.py` 已把下载缓存放在 `.cache/image-pipeline/`，加入 ignore 是安全兜底。

