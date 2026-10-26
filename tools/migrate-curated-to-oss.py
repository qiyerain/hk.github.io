#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Migrate local /img/curated images referenced by album.yml to OSS via PicGo.

Usage:
    python3 tools/migrate-curated-to-oss.py

The script will:
    1. Back up source/_data/album.yml.
    2. Auto-start PicGo if it is not running (macOS).
    3. Upload every unique /img/curated/* path found in album.yml.
    4. Replace local paths with returned OSS URLs in album.yml.
    5. Delete successfully migrated local files.
    6. Remove empty directories under source/img/curated/.
"""

import json
import os
import platform
import re
import subprocess
import sys
import time
import urllib.request
import urllib.error
from datetime import datetime

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ALBUM_YML = os.path.join(REPO_ROOT, "source", "_data", "album.yml")
IMG_BASE = os.path.join(REPO_ROOT, "source", "img", "curated")
PICGO_SCRIPT = os.path.join(REPO_ROOT, "scripts_py", "picgo_upload.py")
PICGO_SERVER = os.environ.get("PICGO_SERVER", "http://127.0.0.1:36677")
USER_AGENT = "Mozilla/5.0 (compatible; XiaoaoBlogAlbumBot/1.0)"


def log(msg):
    print(msg, file=sys.stderr)


def is_picgo_ready(server=PICGO_SERVER):
    try:
        req = urllib.request.Request(
            f"{server.rstrip('/')}/upload",
            method="GET",
            headers={"User-Agent": USER_AGENT},
        )
        with urllib.request.urlopen(req, timeout=2) as resp:
            return resp.status == 200
    except urllib.error.HTTPError:
        return True
    except Exception:
        return False


def ensure_picgo_running():
    if is_picgo_ready():
        return
    if platform.system() != "Darwin":
        raise RuntimeError(f"PicGo 未运行，当前不支持在 {platform.system()} 上自动启动")
    log("PicGo 未运行，尝试自动启动...")
    subprocess.run(["open", "-a", "PicGo"], check=True)
    deadline = time.time() + 30
    while time.time() < deadline:
        if is_picgo_ready():
            log("PicGo 已就绪")
            return
        time.sleep(0.5)
    raise RuntimeError("PicGo 自动启动后 30 秒内未就绪")


def upload_file(file_path):
    """Upload a single file via picgo_upload.py, returning the OSS URL or None."""
    result = subprocess.run(
        [sys.executable, PICGO_SCRIPT, file_path],
        capture_output=True, text=True, timeout=120,
    )
    if result.returncode != 0:
        log(f"上传失败 ({file_path}): {result.stderr.strip()}")
        return None
    try:
        data = json.loads(result.stdout)
    except json.JSONDecodeError:
        log(f"PicGo 返回非法 JSON ({file_path}): {result.stdout}")
        return None
    if not data.get("ok") or not data.get("results"):
        log(f"PicGo 上传未返回结果 ({file_path}): {data}")
        return None
    url = data["results"][0].get("url")
    if not url or not re.match(r"^https://", url, re.IGNORECASE):
        log(f"PicGo 未返回 HTTPS URL ({file_path}): {url}")
        return None
    return url


def resolve_local_path(url_path):
    """Map /img/curated/... to filesystem path."""
    if not url_path.startswith("/img/curated/"):
        return None
    relative = url_path[len("/img/curated/"):]
    return os.path.join(IMG_BASE, relative)


def find_local_paths(content):
    """Return sorted unique local /img/curated paths found in album.yml text."""
    pattern = re.compile(r"/img/curated/[^\s\[\]\(\)'\"]+")
    found = set(pattern.findall(content))
    return sorted(found)


def backup_album_yml():
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup_path = f"{ALBUM_YML}.{stamp}.bak"
    with open(ALBUM_YML, "r", encoding="utf-8") as f:
        original = f.read()
    with open(backup_path, "w", encoding="utf-8") as f:
        f.write(original)
    log(f"已备份 album.yml: {backup_path}")
    return original


def clean_empty_dirs(root):
    """Remove empty leaf directories under root."""
    removed = []
    for dirpath, dirnames, filenames in os.walk(root, topdown=False):
        if not dirnames and not filenames and dirpath != root:
            try:
                os.rmdir(dirpath)
                removed.append(dirpath)
            except OSError:
                pass
    return removed


def main():
    ensure_picgo_running()

    if not os.path.exists(ALBUM_YML):
        raise RuntimeError(f"找不到 album.yml: {ALBUM_YML}")

    original = backup_album_yml()
    local_paths = find_local_paths(original)
    log(f"发现 {len(local_paths)} 个本地图片引用")

    migrated = []
    failed = []
    url_map = {}

    for idx, local_path in enumerate(local_paths, 1):
        file_path = resolve_local_path(local_path)
        if not file_path or not os.path.exists(file_path):
            log(f"[{idx}/{len(local_paths)}] 文件不存在，跳过: {local_path}")
            failed.append((local_path, "file not found"))
            continue

        log(f"[{idx}/{len(local_paths)}] 上传: {local_path}")
        url = upload_file(file_path)
        if url:
            url_map[local_path] = url
            migrated.append((local_path, url))
            log(f"  -> {url}")
        else:
            failed.append((local_path, "upload failed"))

    if not url_map:
        log("没有图片迁移成功，album.yml 保持不变")
        return

    updated = original
    for local_path, url in url_map.items():
        updated = updated.replace(local_path, url)

    with open(ALBUM_YML, "w", encoding="utf-8") as f:
        f.write(updated)
    log(f"已更新 album.yml，替换了 {len(url_map)} 处本地路径")

    deleted = []
    for local_path, url in migrated:
        file_path = resolve_local_path(local_path)
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
                deleted.append(file_path)
            except OSError as e:
                log(f"删除失败 {file_path}: {e}")

    removed_dirs = clean_empty_dirs(IMG_BASE)

    print(json.dumps({
        "migrated": len(migrated),
        "failed": len(failed),
        "deleted_files": len(deleted),
        "removed_dirs": len(removed_dirs),
        "details": {
            "migrated": [{"local": l, "url": u} for l, u in migrated],
            "failed": [{"local": l, "reason": r} for l, r in failed],
        },
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    sys.exit(main())
