## Outcome

已完成 `daily-album-images` 工作流的改造：

- `scripts_py/fetch_daily_images.py` 现在会在上传前自动检测并启动 PicGo（macOS），PicGo 不可用时直接失败，不再回退到本地路径。
- `source/_data/album.yml` 中 45 处本地 `/img/curated/...` 引用已全部替换为 OSS URL，对应原文件已删除。
- `source/img/curated/` 目录已清空并从 Git 移除，同时加入 `.gitignore` 防止再次堆积。
- `tools/migrate-curated-to-oss.py` 作为一次性迁移脚本保留，供未来需要时使用。
- `tools/album-maintenance.js` 修复了 `source/img/curated/` 不存在时的崩溃问题。
- `daily-album-images` SKILL.md 已更新，说明自动启动 PicGo、OSS-only 约束和历史迁移方式。

## Important Decisions

1. **OSS-only 发布**： album.yml 只接受 `https://` 地址。PicGo 上传失败时条目进入 `.cache/image-upload-queue/queue.json`，不会污染相册数据。
2. **自动启动 PicGo**： 通过 `open -a PicGo` 在 macOS 上启动，提供 `PICGO_AUTOSTART=0` 禁用开关。
3. **一次性迁移**： 只上传 `album.yml` 实际引用的本地图片；未引用的剩余文件直接删除。`image_archive.json` 中对应 `publish_path` 已更新或置空。

## Validation Commands And Results

```bash
# 仓库审计
$ npm run audit:repo
Repository hygiene audit passed.

# 相册审计
$ npm run album:audit
{
  "mode": "check",
  "collections": 7,
  "entriesRemoved": 0,
  "entriesRemaining": 45,
  "exactHashGroups": 0,
  "unreferencedDuplicateFiles": 0,
  "reclaimableBytes": 0,
  "filesDeleted": 0
}

# album.yml 已无本地路径
$ grep -c '/img/curated/' source/_data/album.yml
0

# album.yml 全部为 OSS URL
$ grep -c 'https://' source/_data/album.yml
100

# 迁移脚本执行摘要
$ python3 tools/migrate-curated-to-oss.py
migrated: 45
failed: 0
deleted_files: 45
removed_dirs: 3

# 语法检查
$ python3 -m py_compile scripts_py/fetch_daily_images.py tools/migrate-curated-to-oss.py scripts_py/picgo_upload.py
# 全部通过
```

## Plan Deviations

- 原计划仅迁移 `album.yml` 引用的图片。执行中发现 `tools/album-maintenance.js` 在 `source/img/curated/` 目录不存在时会崩溃，因此额外修复了该工具，使其把缺失目录视为空。
- `image_archive.json` 不是本次变更的核心目标，但为了防止档案中留下大量失效的本地 `publish_path`，顺手把已迁移的 11 条记录改为 OSS URL，33 条未引用记录置空。

## Remaining Work

- 当前 `fetch_daily_images.py` 的自动启动仅支持 macOS。如果后续在 Linux/Windows 上运行，需要扩展启动逻辑。
- 迁移脚本 `tools/migrate-curated-to-oss.py` 是一次性的；如未来再次产生本地堆积，可复用该脚本。
- PicGo 桌面版仍由用户环境提供，脚本只负责启动已安装的应用。

## Rollback Guidance

1. 恢复 `source/_data/album.yml`：使用迁移脚本创建的备份 `source/_data/album.yml.YYYYMMDD-HHMMSS.bak`。
2. 恢复图片文件：从 Git 历史或本地 Time Machine 还原 `source/img/curated/`。
3. 撤销代码变更：`git checkout -- scripts_py/fetch_daily_images.py tools/album-maintenance.js .gitignore .codex/skills/daily-album-images/SKILL.md`。
4. 删除新增文件：`tools/migrate-curated-to-oss.py` 和 `openspec/changes/auto-start-picgo-oss-migration/`。
