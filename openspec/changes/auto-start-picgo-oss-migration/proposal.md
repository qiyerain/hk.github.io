## Why

相册自动化脚本 `fetch_daily_images.py` 在 PicGo 桌面版未运行时会把图片降级为本地路径写入 `source/_data/album.yml`，导致 `source/img/curated/` 长期堆积图片（当前 245 MB / 90 文件）。用户要求图片必须上传到 OSS，不再把原图保留在项目里。

## What Changes

- 为每日相册抓取脚本增加 PicGo 自动启动能力：未运行时自动调起 `/Applications/PicGo.app`，等待端口就绪。
- 将现有 `source/img/curated/` 中的本地图片批量上传到 OSS，并把 `album.yml` 中的本地路径替换为 OSS URL。
- 上传成功后删除本地原图，并把 `source/img/curated/` 加入 `.gitignore`，防止再次堆积。
- 更新 `daily-album-images` SKILL.md，说明自动启动 PicGo 的行为和失败处理。

## Capabilities

### Modified Capabilities

- `daily-album-images`: 自动启动 PicGo、禁止本地路径回退、批量迁移历史本地图片。

## Impact

- `scripts_py/fetch_daily_images.py`：增加 PicGo 进程管理。
- `tools/migrate-curated-to-oss.py`（新增）：一次性迁移脚本。
- `source/_data/album.yml`：本地图片路径改为 OSS URL。
- `source/img/curated/`：删除已上传原图，部分目录可能变空。
- `.gitignore`：忽略 `source/img/curated/`。
- `.codex/skills/daily-album-images/SKILL.md`：文档更新。

