#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
每日相册图片抓取脚本

从公开 API 抓取图片，通过 PicGo 上传到 OSS，并把新条目插入到 source/_data/album.yml
对应分类的 album_list 最前面（最新在前）。

数据源:
  - Wallhaven API (https://wallhaven.cc/api/v1/search) — 无需 API key
    覆盖: anime / technology / landscape / city
  - Wikimedia Commons API — 无需 API key
    覆盖: humanity（人文）
  - Pinterest API v5 — 需要 OAuth token（见 scripts_py/.pinterest_config.json）
    覆盖: 各分类补充 + "其他"分类

可选环境变量:
  WALLHAVEN_API_KEY     提供后可访问更多内容、提升速率限制
  UNSPLASH_ACCESS_KEY   预留，当前未启用
  PER_CATEGORY          每个分类抓取几张（默认 3）
  PICGO_SERVER          PicGo 服务地址（默认 http://127.0.0.1:36677）
  PICGO_AUTOSTART       设置为 0 可禁用自动启动 PicGo（默认自动启动）

PicGo 自动启动:
  脚本会在上传前检测 PicGo HTTP 服务（默认 127.0.0.1:36677）。
  若未运行且 PICGO_AUTOSTART 未禁用，则尝试通过 `open -a PicGo` 启动，
  最多等待 30 秒。启动失败会抛出异常，避免本地路径回退。

Pinterest 凭据通过 scripts_py/.pinterest_config.json 配置:
  {
    "app_id": "...",
    "app_secret": "...",
    "refresh_token": "...",     # 有效期 1 年
    "access_token": "...",      # 有效期 30 天，留空则自动用 refresh_token 获取
    "access_token_expires_at": ""
  }
未配置时，Pinterest 数据源静默跳过；token 过期时会交互式提示输入新 token。

用法:
  python3 scripts_py/fetch_daily_images.py
  python3 scripts_py/fetch_daily_images.py --per-category 5
  python3 scripts_py/fetch_daily_images.py --no-upload   # 只下载不上传
  python3 scripts_py/fetch_daily_images.py --categories anime,city
  python3 scripts_py/fetch_daily_images.py --no-pinterest  # 跳过 Pinterest

输出: JSON 摘要到 stdout，详细日志到 stderr。
"""

import json
import os
import re
import sys
import time
import urllib.request
import urllib.error
import urllib.parse
import subprocess
import platform
from base64 import b64encode
from datetime import datetime, timedelta
from io import BytesIO

# ---------------------------------------------------------------------------
# 配置
# ---------------------------------------------------------------------------

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
IMG_BASE = os.path.join(REPO_ROOT, "source", "img", "curated")
ALBUM_YML = os.path.join(REPO_ROOT, "source", "_data", "album.yml")
PICGO_SCRIPT = os.path.join(REPO_ROOT, "scripts_py", "picgo_upload.py")
IMAGE_PIPELINE = os.path.join(REPO_ROOT, "tools", "image-pipeline.js")
PIPELINE_CACHE = os.path.join(REPO_ROOT, ".cache", "image-pipeline")
PINTEREST_CONFIG = os.path.join(REPO_ROOT, "scripts_py", ".pinterest_config.json")

PER_CATEGORY_DEFAULT = 3
PICGO_SERVER = os.environ.get("PICGO_SERVER", "http://127.0.0.1:36677")
PINTEREST_API_BASE = "https://api.pinterest.com/v5"

# 分类配置：每个分类一个主数据源 + 可选 Pinterest 补充
# source: wallhaven | commons | pinterest
# pinterest_query: 启用 Pinterest 补充时使用的搜索词（可选）
CATEGORIES = {
    "anime": {
        "source": "commons",
        "query": "anime illustration",
        "pinterest_query": "anime illustration",
        "label_prefix": "动漫",
    },
    "technology": {
        "source": "commons",
        "query": "artificial intelligence technology",
        "pinterest_query": "anime cyberpunk technology",
        "label_prefix": "科技",
    },
    "landscape": {
        "source": "commons",
        "query": "landscape photography",
        "pinterest_query": "anime scenery landscape",
        "label_prefix": "风景",
    },
    "city": {
        "source": "commons",
        "query": "city skyline",
        "pinterest_query": "city skyline night",
        "label_prefix": "城市",
    },
    "humanity": {
        "source": "commons",
        "query": "people culture festival",
        "pinterest_query": "street photography people",
        "label_prefix": "人文",
    },
    # "其他" 分类：纯 Pinterest 源，关键词不归属于以上五类
    "other": {
        "source": "commons",
        "query": "abstract photography",
        "pinterest_query": "aesthetic photography",
        "label_prefix": "灵感",
    },
}

# album.yml 里的分类名映射
ALBUM_YML_MAP = {
    "anime": "动漫世界",
    "technology": "科技切片",
    "landscape": "风景远方",
    "city": "城市切片",
    "humanity": "人文影像",
    "other": "其他",
}

USER_AGENT = "Mozilla/5.0 (compatible; XiaoaoBlogAlbumBot/1.0)"


# ---------------------------------------------------------------------------
# HTTP 工具
# ---------------------------------------------------------------------------

def http_get(url, headers=None, timeout=30):
    """简单 GET，返回 bytes。"""
    h = {"User-Agent": USER_AGENT}
    if headers:
        h.update(headers)
    req = urllib.request.Request(url, headers=h, method="GET")
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


def http_get_json(url, headers=None, timeout=30):
    return json.loads(http_get(url, headers, timeout).decode("utf-8"))


# ---------------------------------------------------------------------------
# Wallhaven
# ---------------------------------------------------------------------------

def fetch_wallhaven(query, count, api_key=None):
    """从 Wallhaven API 搜索图片。"""
    params = {
        "q": query,
        "categories": "111",
        "purity": "100",
        "sorting": "toplist",
        "topRange": "1M",
        "atleast": "1920x1080",
    }
    if api_key:
        params["apikey"] = api_key

    url = "https://wallhaven.cc/api/v1/search?" + urllib.parse.urlencode(params)
    log(f"Wallhaven 请求: {url}")
    data = http_get_json(url)
    results = []
    for item in (data.get("data") or [])[:count]:
        results.append({
            "image_url": item.get("path"),
            "source_page": item.get("url"),
            "width": item.get("dimension_x"),
            "height": item.get("dimension_y"),
            "license": "Wallhaven · " + (item.get("category", "general")),
            "provider": "wallhaven",
        })
    return results


# ---------------------------------------------------------------------------
# Wikimedia Commons
# ---------------------------------------------------------------------------

def fetch_commons(query, count):
    """从 Wikimedia Commons API 搜索图片。"""
    params = {
        "action": "query",
        "format": "json",
        "generator": "search",
        "gsrsearch": f"filetype:bitmap {query}",
        "gsrlimit": str(count * 3),
        "gsrnamespace": "6",
        "prop": "imageinfo",
        "iiprop": "url|extmetadata|size",
        "iiurlwidth": "1600",
    }
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(params)
    log(f"Commons 请求: {url}")
    data = http_get_json(url)
    pages = (data.get("query") or {}).get("pages") or {}
    results = []
    for page in pages.values():
        info = (page.get("imageinfo") or [{}])[0]
        img_url = info.get("url") or info.get("thumburl")
        if not img_url:
            continue
        meta = info.get("extmetadata") or {}
        license_short = (meta.get("LicenseShortName") or {}).get("value", "CC")
        results.append({
            "image_url": img_url,
            "source_page": "https://commons.wikimedia.org/wiki/" + page.get("title", "").replace(" ", "_"),
            "width": info.get("width"),
            "height": info.get("height"),
            "license": "Wikimedia Commons · " + re.sub(r"<[^>]+>", "", license_short),
            "provider": "commons",
        })
        if len(results) >= count:
            break
    return results


# ---------------------------------------------------------------------------
# Pinterest
# ---------------------------------------------------------------------------

def load_pinterest_config():
    """读取 Pinterest 配置文件。不存在或字段不全返回 None。"""
    if not os.path.exists(PINTEREST_CONFIG):
        return None
    try:
        with open(PINTEREST_CONFIG, "r", encoding="utf-8") as f:
            cfg = json.load(f)
    except Exception as e:
        log(f"Pinterest 配置读取失败: {e}")
        return None
    # access_token 单独有效也可（不刷新场景）
    if not cfg.get("access_token") and not (
        cfg.get("app_id") and cfg.get("app_secret") and cfg.get("refresh_token")
    ):
        log("Pinterest 配置缺少必要字段（需要 access_token，或 app_id/app_secret/refresh_token）")
        return None
    return cfg


def save_pinterest_config(cfg):
    """写回 Pinterest 配置文件。"""
    with open(PINTEREST_CONFIG, "w", encoding="utf-8") as f:
        json.dump(cfg, f, ensure_ascii=False, indent=2)


def pinterest_refresh_access_token(cfg):
    """用 refresh_token 换取新 access_token。成功返回新 token 字符串，失败抛异常。"""
    app_id = cfg.get("app_id")
    app_secret = cfg.get("app_secret")
    refresh_token = cfg.get("refresh_token")
    if not (app_id and app_secret and refresh_token):
        raise RuntimeError("缺少 app_id / app_secret / refresh_token，无法刷新 access_token")

    basic = b64encode(f"{app_id}:{app_secret}".encode()).decode("utf-8")
    body = urllib.parse.urlencode({
        "grant_type": "refresh_token",
        "refresh_token": refresh_token,
    }).encode("utf-8")
    req = urllib.request.Request(
        f"{PINTEREST_API_BASE}/oauth/token",
        data=body,
        method="POST",
        headers={
            "Authorization": f"Basic {basic}",
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": USER_AGENT,
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body_text = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"刷新 token 失败 HTTP {e.code}: {body_text}")

    new_token = data.get("access_token")
    expires_in = data.get("expires_in", 30 * 24 * 3600)
    if not new_token:
        raise RuntimeError(f"刷新响应中没有 access_token: {data}")

    cfg["access_token"] = new_token
    cfg["access_token_expires_at"] = (
        datetime.utcnow() + timedelta(seconds=int(expires_in))
    ).strftime("%Y-%m-%dT%H:%M:%SZ")
    save_pinterest_config(cfg)
    log(f"Pinterest access_token 已刷新，过期时间 {cfg['access_token_expires_at']}")
    return new_token


def pinterest_prompt_new_token(cfg, reason):
    """token 全失效时，交互式提示用户输入新凭据。非 TTY 环境抛异常。"""
    if not sys.stdin.isatty():
        raise RuntimeError(f"Pinterest 凭据失效（{reason}），且当前非交互环境，无法提示输入。请手动更新 {PINTEREST_CONFIG}")

    log("")
    log("=" * 60)
    log(f"Pinterest 凭据失效：{reason}")
    log(f"请到 https://developers.pinterest.com/apps/ 重新生成 token")
    log(f"配置文件: {PINTEREST_CONFIG}")
    log("=" * 60)

    print(f"\n[Pinterest 凭据失效] 原因: {reason}", file=sys.stderr)
    print("请输入新的凭据（直接回车保留原值）：", file=sys.stderr)
    new_refresh = input(f"  refresh_token (当前末尾 ...{(cfg.get('refresh_token') or '')[-6:]}): ").strip()
    new_access = input(f"  access_token  (可留空，由 refresh_token 自动获取): ").strip()
    if new_refresh:
        cfg["refresh_token"] = new_refresh
    if new_access:
        cfg["access_token"] = new_access
        cfg["access_token_expires_at"] = ""
    elif new_refresh:
        # 仅刷新了 refresh_token，立即用它换 access_token
        cfg["access_token"] = ""
    save_pinterest_config(cfg)
    log("Pinterest 凭据已更新")


def pinterest_get_access_token(cfg):
    """返回可用的 access_token。必要时自动刷新或交互式提示。"""
    token = cfg.get("access_token")
    expires = cfg.get("access_token_expires_at")
    # 已过期或将在 1 小时内过期 → 刷新
    need_refresh = False
    if not token:
        need_refresh = True
    elif expires:
        try:
            exp_dt = datetime.strptime(expires, "%Y-%m-%dT%H:%M:%SZ")
            if exp_dt - datetime.utcnow() < timedelta(hours=1):
                need_refresh = True
        except ValueError:
            pass

    if need_refresh and cfg.get("refresh_token"):
        try:
            return pinterest_refresh_access_token(cfg)
        except Exception as e:
            log(f"刷新 access_token 失败: {e}")
            pinterest_prompt_new_token(cfg, str(e))
            # 提示后再试一次
            return pinterest_refresh_access_token(cfg) if cfg.get("refresh_token") else cfg.get("access_token")

    return token


def fetch_pinterest(query, count, cfg):
    """从 Pinterest API v5 搜索 pins。"""
    if not query:
        return []
    token = pinterest_get_access_token(cfg)
    if not token:
        log("Pinterest: 没有可用的 access_token，跳过")
        return []

    def _call(access_token):
        params = {
            "query": query,
            "page_size": str(min(count, 25)),
        }
        url = f"{PINTEREST_API_BASE}/search/pins?" + urllib.parse.urlencode(params)
        log(f"Pinterest 请求: {url}")
        req = urllib.request.Request(
            url,
            headers={
                "Authorization": f"Bearer {access_token}",
                "User-Agent": USER_AGENT,
            },
        )
        with urllib.request.urlopen(req, timeout=20) as resp:
            return json.loads(resp.read().decode("utf-8"))

    try:
        data = _call(token)
    except urllib.error.HTTPError as e:
        if e.code == 401:
            log("Pinterest 返回 401，尝试刷新 token 后重试")
            try:
                new_token = pinterest_refresh_access_token(cfg)
            except Exception as ex:
                log(f"刷新失败: {ex}")
                pinterest_prompt_new_token(cfg, f"401 Unauthorized: {ex}")
                new_token = pinterest_refresh_access_token(cfg)
            data = _call(new_token)
        else:
            body_text = e.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"Pinterest HTTP {e.code}: {body_text}")

    items = data.get("items") or data.get("data") or []
    results = []
    for pin in items[:count]:
        # 提取最大尺寸图片 URL；不同 pin 字段结构有差异，做兼容
        media = pin.get("media") or {}
        images = media.get("images") or pin.get("images") or {}
        # images 通常是 {"600x": {"url": ...}, "1200x": {...}, "originals": {...}}
        img_url = None
        for size_key in ("originals", "1200x", "600x", "564x"):
            entry = images.get(size_key) if isinstance(images, dict) else None
            if isinstance(entry, dict) and entry.get("url"):
                img_url = entry["url"]
                break
        if not img_url:
            continue
        pin_id = pin.get("id", "")
        results.append({
            "image_url": img_url,
            "source_page": f"https://www.pinterest.com/pin/{pin_id}/" if pin_id else "https://www.pinterest.com/",
            "width": None,
            "height": None,
            "license": "Pinterest",
            "provider": "pinterest",
        })
    return results


# ---------------------------------------------------------------------------
# 图片下载
# ---------------------------------------------------------------------------

def cache_paths(category, index):
    """Return ignored source/derivative paths; only verified OSS URLs are published."""
    directory = os.path.join(PIPELINE_CACHE, category)
    os.makedirs(directory, exist_ok=True)
    stem = f"{datetime.now().strftime('%Y%m%d-%H%M%S')}-{index:02d}"
    return os.path.join(directory, stem + ".source"), os.path.join(directory, stem + ".webp")


def download_image(url, dest_path):
    """下载图片到本地。"""
    data = http_get(url, timeout=60)
    with open(dest_path, "wb") as f:
        f.write(data)
    return len(data)


# ---------------------------------------------------------------------------
# PicGo 上传
# ---------------------------------------------------------------------------

def is_picgo_ready(server=PICGO_SERVER):
    """探测 PicGo HTTP 服务是否已就绪。"""
    try:
        req = urllib.request.Request(
            f"{server.rstrip('/')}/upload",
            method="GET",
            headers={"User-Agent": USER_AGENT},
        )
        with urllib.request.urlopen(req, timeout=2) as resp:
            return resp.status == 200
    except urllib.error.HTTPError:
        # 服务已启动但路径返回 404，也算就绪
        return True
    except Exception:
        return False


def ensure_picgo_running(server=PICGO_SERVER):
    """若 PicGo 未运行则尝试自动启动（macOS），等待就绪。"""
    if is_picgo_ready(server):
        return

    if os.environ.get("PICGO_AUTOSTART", "1") == "0":
        raise RuntimeError(f"PicGo 未运行且 PICGO_AUTOSTART=0，无法上传: {server}")

    if platform.system() != "Darwin":
        raise RuntimeError(f"PicGo 未运行，当前不支持在 {platform.system()} 上自动启动")

    log(f"PicGo 未运行，尝试自动启动...")
    try:
        subprocess.run(["open", "-a", "PicGo"], check=True)
    except Exception as e:
        raise RuntimeError(f"自动启动 PicGo 失败: {e}")

    deadline = time.time() + 30
    while time.time() < deadline:
        if is_picgo_ready(server):
            log("PicGo 已就绪")
            return
        time.sleep(0.5)

    raise RuntimeError("PicGo 自动启动后 30 秒内未就绪")


def upload_via_picgo(file_path):
    """调用 picgo_upload.py 上传单张图片，返回 OSS URL 或 None。"""
    import subprocess
    try:
        ensure_picgo_running()
        result = subprocess.run(
            [sys.executable, PICGO_SCRIPT, file_path],
            capture_output=True, text=True, timeout=120,
        )
        if result.returncode != 0:
            log(f"PicGo 上传失败 (exit {result.returncode}): {result.stderr.strip()}")
            return None
        data = json.loads(result.stdout)
        if data.get("ok") and data.get("results"):
            url = data["results"][0].get("url")
            if not url or not re.match(r"^https://", url, re.IGNORECASE):
                log(f"PicGo 未返回 HTTPS OSS 地址: {url}")
                return None
            try:
                req = urllib.request.Request(url, headers={"Range": "bytes=0-31", "User-Agent": USER_AGENT})
                with urllib.request.urlopen(req, timeout=15) as response:
                    content_type = response.headers.get("Content-Type", "").lower()
                    if not content_type.startswith("image/"):
                        raise RuntimeError(f"远端类型不是图片: {content_type or 'unknown'}")
            except Exception as error:
                log(f"OSS 地址验证失败: {error}")
                return None
            return url
        log(f"PicGo 返回异常: {result.stdout}")
        return None
    except Exception as e:
        log(f"PicGo 上传异常: {e}")
        return None


def prepare_album_image(source_path, output_path):
    """Validate/decode the source and generate a max-1920px WebP derivative."""
    result = subprocess.run(
        ["node", IMAGE_PIPELINE, "prepare", "--type", "album", "--input", source_path, "--output", output_path],
        capture_output=True, text=True, timeout=120,
    )
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or "图片校验/转码失败")
    return json.loads(result.stdout)


def queue_upload_failure(file_path, item, category, metadata, error):
    command = [
        "node", IMAGE_PIPELINE, "queue", "--file", file_path,
        "--source", item.get("image_url", ""),
        "--source-page", item.get("source_page", ""),
        "--license", item.get("license", ""),
        "--category", category,
        "--type", "album",
        "--hash", metadata.get("hash", ""),
        "--target", "source/_data/album.yml",
        "--error", error,
    ]
    result = subprocess.run(command, capture_output=True, text=True, timeout=30)
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or "写入上传队列失败")


def has_publishable_license(item):
    """Pinterest is reference-only; Wallhaven needs explicit reusable-license metadata."""
    if item.get("provider") != "commons":
        return False
    value = item.get("license", "").lower()
    return any(token in value for token in ("cc", "public domain", "copyrighted free use"))


def load_album_history():
    """Load published source identifiers and hashes for cross-run deduplication."""
    with open(ALBUM_YML, "r", encoding="utf-8") as album_file:
        content = album_file.read()
    sources = {
        value.strip().rstrip("/")
        for value in re.findall(r"^\s*source_page:\s*(.+?)\s*$", content, re.MULTILINE)
        if value.strip()
    }
    hashes = set(re.findall(r"^\s*sha256:\s*([0-9a-f]{64})\s*$", content, re.MULTILINE | re.IGNORECASE))
    return sources, {value.lower() for value in hashes}


# ---------------------------------------------------------------------------
# album.yml 更新（最新在前）
# ---------------------------------------------------------------------------

def update_album_yml(category_key, new_entries):
    """把新条目插入到 album.yml 对应分类的 album_list 最前面。"""
    if not new_entries:
        return False

    with open(ALBUM_YML, "r", encoding="utf-8") as f:
        content = f.read()

    album_name = ALBUM_YML_MAP.get(category_key)
    if not album_name:
        log(f"未找到分类 {category_key} 的 album.yml 映射")
        return False

    new_lines = []
    for entry in new_entries:
        new_lines.append(f"    - content: {entry['content']}")
        new_lines.append(f"      license: {entry['license']}")
        new_lines.append(f"      source_page: {entry['source_page']}")
        new_lines.append(f"      date: {entry['date']}")
        new_lines.append(f"      sha256: {entry['sha256']}")
        new_lines.append(f"      image: [{entry['image_path']}]")
        new_lines.append("")
    new_text = "\n".join(new_lines) + "\n"

    empty_pattern = re.compile(
        r"(- name:\s*" + re.escape(album_name) + r".*?)(album_list:\s*\[\]\s*\n)",
        re.DOTALL,
    )
    m_empty = empty_pattern.search(content)
    if m_empty:
        replace_point = m_empty.start(2)
        after_point = m_empty.end(2)
        replacement = "album_list:\n" + new_text
        updated = content[:replace_point] + replacement + content[after_point:]
    else:
        block_pattern = re.compile(
            r"(- name:\s*" + re.escape(album_name) + r".*?)(album_list:\s*\n)",
            re.DOTALL,
        )
        m_block = block_pattern.search(content)
        if not m_block:
            log(f"未在 album.yml 中找到分类 '{album_name}' 的 album_list，跳过")
            return False
        insert_point = m_block.end()
        updated = content[:insert_point] + new_text + content[insert_point:]

    first_image = new_entries[0]['image_path']
    block_start_re = re.compile(r'- name:\s*' + re.escape(album_name))
    bs = block_start_re.search(updated)
    if bs:
        block_start = bs.start()
        next_name = updated.find('\n\n- name:', block_start + 1)
        block_end = next_name if next_name != -1 else len(updated)
        block = updated[block_start:block_end]
        if re.search(r'^  cover:\s*$', block, re.MULTILINE):
            block = re.sub(r'^(  cover:\s*)$', f'  cover: {first_image}', block, count=1, flags=re.MULTILINE)
        if re.search(r'^  top_background:\s*$', block, re.MULTILINE):
            block = re.sub(r'^(  top_background:\s*)$', f'  top_background: {first_image}', block, count=1, flags=re.MULTILINE)
        updated = updated[:block_start] + block + updated[block_end:]

    with open(ALBUM_YML, "w", encoding="utf-8") as f:
        f.write(updated)
    return True


# ---------------------------------------------------------------------------
# 主流程
# ---------------------------------------------------------------------------

def log(msg):
    print(msg, file=sys.stderr)


def parse_args():
    args = {
        "per_category": PER_CATEGORY_DEFAULT,
        "no_upload": False,
        "categories": None,
        "no_pinterest": False,
    }
    i = 1
    while i < len(sys.argv):
        a = sys.argv[i]
        if a == "--per-category" and i + 1 < len(sys.argv):
            args["per_category"] = int(sys.argv[i + 1]); i += 2
        elif a == "--no-upload":
            args["no_upload"] = True; i += 1
        elif a == "--no-pinterest":
            args["no_pinterest"] = True; i += 1
        elif a == "--categories" and i + 1 < len(sys.argv):
            args["categories"] = sys.argv[i + 1].split(","); i += 2
        else:
            i += 1
    return args


def fetch_items_for_category(cat, cfg, per, wallhaven_key, pinterest_cfg, enable_pinterest):
    """根据分类配置抓取图片，可能合并主源 + Pinterest 补充。"""
    items = []
    src = cfg["source"]
    main_query = cfg.get("query")
    pin_query = cfg.get("pinterest_query")

    # 主数据源
    if src == "pinterest":
        if enable_pinterest and pinterest_cfg and pin_query:
            try:
                items.extend(fetch_pinterest(pin_query, per, pinterest_cfg))
            except Exception as e:
                log(f"Pinterest 主源失败: {e}")
        # Pinterest 不可用或失败时，降级到 fallback_source
        if not items:
            fb_src = cfg.get("fallback_source")
            fb_query = cfg.get("fallback_query")
            if fb_src == "wallhaven" and fb_query:
                log(f"Pinterest 不可用，降级到 Wallhaven（{fb_query}）")
                items.extend(fetch_wallhaven(fb_query, per, wallhaven_key))
    elif src == "wallhaven" and main_query:
        items.extend(fetch_wallhaven(main_query, per, wallhaven_key))
    elif src == "commons" and main_query:
        items.extend(fetch_commons(main_query, per))

    # Pinterest 补充（仅对非 pinterest 主源的分类）
    if src != "pinterest" and enable_pinterest and pinterest_cfg and pin_query:
        try:
            extra = fetch_pinterest(pin_query, max(1, per // 2), pinterest_cfg)
            log(f"Pinterest 补充 {len(extra)} 张")
            items.extend(extra)
        except Exception as e:
            log(f"Pinterest 补充失败（不影响主源）: {e}")

    return items


def main():
    args = parse_args()
    cats = args["categories"] or list(CATEGORIES.keys())
    per = args["per_category"]
    wallhaven_key = os.environ.get("WALLHAVEN_API_KEY")
    pinterest_cfg = None if args["no_pinterest"] else load_pinterest_config()
    published_sources, published_hashes = load_album_history()
    if not args["no_pinterest"] and not pinterest_cfg:
        log(f"Pinterest 未启用（{PINTEREST_CONFIG} 不存在或字段不全），跳过 Pinterest 数据源")

    summary = {
        "date": datetime.now().strftime("%Y-%m-%d"),
        "pinterest_enabled": bool(pinterest_cfg),
        "categories": {},
    }

    for cat in cats:
        cfg = CATEGORIES.get(cat)
        if not cfg:
            log(f"未知分类: {cat}，跳过")
            continue

        log(f"\n=== 抓取分类: {cat} ({cfg['label_prefix']}) ===")
        try:
            items = fetch_items_for_category(
                cat, cfg, per, wallhaven_key, pinterest_cfg,
                enable_pinterest=not args["no_pinterest"],
            )
        except Exception as e:
            log(f"抓取失败: {e}")
            summary["categories"][cat] = {"error": str(e)}
            continue

        if not items:
            log(f"未获取到图片")
            summary["categories"][cat] = {"error": "no results"}
            continue

        new_entries = []
        skipped_license = 0
        skipped_duplicate = 0
        queued = 0
        seen_hashes = set()
        for item_index, item in enumerate(items):
            try:
                source_page = item.get("source_page", "").strip().rstrip("/")
                if source_page and source_page in published_sources:
                    skipped_duplicate += 1
                    log(f"跳过历史来源重复图片: {source_page}")
                    continue
                if not has_publishable_license(item):
                    skipped_license += 1
                    log(f"仅作参考，未发布（授权不足）: {item.get('source_page', item.get('image_url'))}")
                    continue
                local_path, derivative_path = cache_paths(cat, item_index)
                size = download_image(item["image_url"], local_path)
                log(f"下载: {os.path.basename(local_path)} ({size//1024}KB) ← {item['image_url']}")
                metadata = prepare_album_image(local_path, derivative_path)
                image_hash = metadata["hash"].lower()
                if image_hash in seen_hashes or image_hash in published_hashes:
                    skipped_duplicate += 1
                    log(f"跳过历史或批次内重复图片: {image_hash}")
                    continue
                seen_hashes.add(image_hash)

                oss_url = None
                if not args["no_upload"]:
                    oss_url = upload_via_picgo(derivative_path)
                    if oss_url:
                        log(f"已上传 OSS: {oss_url}")
                if not oss_url:
                    reason = "Upload disabled" if args["no_upload"] else "PicGo upload or OSS verification failed"
                    queue_upload_failure(derivative_path, item, cat, metadata, reason)
                    queued += 1
                    log(f"已进入重试队列，未更新 album.yml: {derivative_path}")
                    continue

                content_label = f"{cfg['label_prefix']}·{datetime.now().strftime('%m%d')}"
                new_entries.append({
                    "content": content_label,
                    "license": item.get("license", ""),
                    "source_page": item.get("source_page", ""),
                    "date": datetime.now().strftime('%Y-%m-%d'),
                    "sha256": image_hash,
                    "image_path": oss_url,
                })
                if source_page:
                    published_sources.add(source_page)
                published_hashes.add(image_hash)
                time.sleep(0.5)
            except Exception as e:
                log(f"下载/上传失败: {e}")

        if new_entries:
            ok = update_album_yml(cat, new_entries)
            summary["categories"][cat] = {
                "fetched": len(new_entries),
                "album_updated": ok,
                "queued": queued,
                "license_skipped": skipped_license,
                "duplicate_skipped": skipped_duplicate,
            }
        else:
            summary["categories"][cat] = {
                "error": "no verified uploads",
                "queued": queued,
                "license_skipped": skipped_license,
                "duplicate_skipped": skipped_duplicate,
            }

    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
