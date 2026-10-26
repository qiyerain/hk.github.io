## 1. PicGo 自动启动

- [x] 1.1 在 `fetch_daily_images.py` 中新增 `ensure_picgo_running()` 与 `is_picgo_ready()`
- [x] 1.2 在 `upload_via_picgo()` 前调用自动启动逻辑
- [x] 1.3 支持 `PICGO_AUTOSTART=0` 禁用自动启动

## 2. 历史本地图片迁移

- [x] 2.1 创建 `tools/migrate-curated-to-oss.py`
- [x] 2.2 备份 `source/_data/album.yml`
- [x] 2.3 上传所有被 `album.yml` 引用的本地图片并替换为 OSS URL
- [x] 2.4 删除已成功迁移的本地文件
- [x] 2.5 清理空目录

## 3. 仓库防护与文档

- [x] 3.1 把 `source/img/curated/` 加入 `.gitignore`
- [x] 3.2 更新 `daily-album-images` SKILL.md
- [x] 3.3 运行仓库审计与 YAML 验证
