#!/usr/bin/env python3
"""
Pinterest 浏览器抓取脚本

通过 Kimi WebBridge 控制浏览器搜索 Pinterest，
提取图片 URL，下载到本地，上传到 OSS，更新 album.yml。

用法：
  python3 scripts_py/fetch_pinterest_browser.py --categories anime,technology --per-category 5
"""

import json
import os
import re
import subprocess
import sys
import time
import urllib.request
import urllib.error

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
IMG_BASE = os.path.join(REPO_ROOT, "source", "img", "curated")
ALBUM_YML = os.path.join(REPO_ROOT, "source", "_data", "album.yml")
PICGO_SCRIPT = os.path.join(REPO_ROOT, "scripts_py", "picgo_upload.py")
WEBBRIDGE_URL = "http://127.0.0.1:10086/command"

ALBUM_YML_MAP = {
    "anime": "动漫世界",
    "technology": "科技切片",
    "landscape": "风景远方",
    "city": "城市切片",
    "humanity": "人文影像",
}

SEARCH_QUERIES = {
    "anime": "anime illustration aesthetic",
    "technology": "anime cyberpunk technology",
    "landscape": "anime scenery landscape",
    "city": "anime city night",
    "humanity": "anime festival culture",
}

LABEL_PREFIX = {
    "anime": "动漫",
    "technology": "科技",
    "landscape": "风景",
    "city": "城市",
    "humanity": "人文",
}

USER_AGENT = "Mozilla/5.0 (compatible; XiaoaoBlogAlbumBot/1.0)"


def log(msg):
    print(msg, file=sys.stderr)


def webbridge_command(action, args, session="pinterest"):
    """Send a command to Kimi WebBridge."""
    payload = json.dumps({
        "action": action,
        "args": args,
        "session": session,
    }).encode("utf-8")
    req = urllib.request.Request(
        WEBBRIDGE_URL,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def search_pinterest(query, count):
    """Search Pinterest via browser, extract image URLs."""
    search_url = f"https://www.pinterest.com/search/pins/?q={urllib.parse.quote(query)}&rs=typed"
    log(f"Pinterest 搜索: {query}")

    webbridge_command("navigate", {"url": search_url, "newTab": False})
    time.sleep(3)

    # Scroll to load more images
    for i in range(2):
        webbridge_command("evaluate", {"code": "window.scrollBy(0, 1500)"})
        time.sleep(1.5)

    # Extract image URLs
    js_code = (
        '(() => { const imgs = document.querySelectorAll("img"); '
        'const pinImgs = []; '
        'for(const img of imgs) { '
        '  const src = img.src || ""; '
        '  if(src.includes("236x") || src.includes("736x") || src.includes("originals")) { '
        '    const hiRes = src.replace("236x", "originals").replace("736x", "originals"); '
        '    pinImgs.push({thumb: src, full: hiRes}); '
        '  } '
        '} '
        f'return JSON.stringify(pinImgs.slice(0, {count * 2})); '
        '})()'
    )
    result = webbridge_command("evaluate", {"code": js_code})
    if not result.get("ok"):
        log(f"提取图片失败: {result}")
        return []

    images = json.loads(result["data"]["value"])
    log(f"找到 {len(images)} 张图片")
    return images[:count]


def next_filename(category, img_base):
    """Return next numbered filename."""
    d = os.path.join(img_base, category)
    os.makedirs(d, exist_ok=True)
    existing = os.listdir(d)
    nums = []
    for name in existing:
        m = re.match(rf"^{re.escape(category)}-(\d+)\.", name)
        if m:
            nums.append(int(m.group(1)))
    next_n = (max(nums) + 1) if nums else 1
    local_path = os.path.join(d, f"{category}-{next_n:02d}.jpg")
    rel_path = f"/img/curated/{category}/{category}-{next_n:02d}.jpg"
    return local_path, rel_path


def download_image(url, dest_path):
    """Download image from URL."""
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = resp.read()
    with open(dest_path, "wb") as f:
        f.write(data)
    return len(data)


def upload_via_picgo(file_path):
    """Upload image via PicGo, return OSS URL or None."""
    try:
        result = subprocess.run(
            [sys.executable, PICGO_SCRIPT, file_path],
            capture_output=True, text=True, timeout=120,
        )
        if result.returncode != 0:
            log(f"PicGo 上传失败: {result.stderr.strip()}")
            return None
        data = json.loads(result.stdout)
        if data.get("ok") and data.get("results"):
            return data["results"][0].get("url")
        return None
    except Exception as e:
        log(f"PicGo 上传异常: {e}")
        return None


def update_album_yml(category_key, new_entries):
    """Insert new entries at the front of album_list in album.yml."""
    if not new_entries:
        return False

    with open(ALBUM_YML, "r", encoding="utf-8") as f:
        content = f.read()

    album_name = ALBUM_YML_MAP.get(category_key)
    if not album_name:
        return False

    new_lines = []
    for entry in new_entries:
        new_lines.append(f"    - content: {entry['content']}")
        new_lines.append(f"      license: {entry['license']}")
        new_lines.append(f"      source_page: {entry['source_page']}")
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
            log(f"未找到分类 '{album_name}'")
            return False
        insert_point = m_block.end()
        updated = content[:insert_point] + new_text + content[insert_point:]

    with open(ALBUM_YML, "w", encoding="utf-8") as f:
        f.write(updated)
    return True


def parse_args():
    args = {
        "per_category": 5,
        "categories": None,
        "no_upload": False,
    }
    i = 1
    while i < len(sys.argv):
        a = sys.argv[i]
        if a == "--per-category" and i + 1 < len(sys.argv):
            args["per_category"] = int(sys.argv[i + 1]); i += 2
        elif a == "--no-upload":
            args["no_upload"] = True; i += 1
        elif a == "--categories" and i + 1 < len(sys.argv):
            args["categories"] = sys.argv[i + 1].split(","); i += 2
        else:
            i += 1
    return args


def main():
    args = parse_args()
    cats = args["categories"] or list(SEARCH_QUERIES.keys())
    per = args["per_category"]

    # Check WebBridge health
    try:
        wb_bin = os.path.expanduser("~/.kimi-webbridge/bin/kimi-webbridge")
        status_raw = subprocess.run(
            [wb_bin, "status"],
            capture_output=True, text=True, timeout=10,
        )
        if '"running":true' not in status_raw.stdout.replace(" ", ""):
            print("WebBridge daemon not running or extension not connected", file=sys.stderr)
            return 1
    except Exception as e:
        print(f"WebBridge 不可用: {e}", file=sys.stderr)
        return 1

    summary = {
        "date": time.strftime("%Y-%m-%d"),
        "source": "pinterest_browser",
        "categories": {},
    }

    for cat in cats:
        query = SEARCH_QUERIES.get(cat)
        if not query:
            log(f"未知分类: {cat}")
            continue

        log(f"\n=== 抓取分类: {cat} ({LABEL_PREFIX.get(cat, cat)}) ===")

        try:
            images = search_pinterest(query, per)
        except Exception as e:
            log(f"搜索失败: {e}")
            summary["categories"][cat] = {"error": str(e)}
            continue

        if not images:
            summary["categories"][cat] = {"error": "no results"}
            continue

        new_entries = []
        for img in images:
            try:
                local_path, rel_path = next_filename(cat, IMG_BASE)

                # Try downloading originals first, fall back to 736x
                full_url = img["full"]
                try:
                    size = download_image(full_url, local_path)
                except urllib.error.HTTPError:
                    mid_url = img["full"].replace("originals", "736x")
                    log(f"原图 404，尝试 736x: {mid_url}")
                    size = download_image(mid_url, local_path)

                log(f"下载: {os.path.basename(local_path)} ({size//1024}KB)")

                oss_url = None
                if not args["no_upload"]:
                    oss_url = upload_via_picgo(local_path)
                    if oss_url:
                        log(f"已上传 OSS: {oss_url}")

                image_path = oss_url or rel_path
                label = LABEL_PREFIX.get(cat, cat)
                content_label = f"{label}·{time.strftime('%m%d')}"

                new_entries.append({
                    "content": content_label,
                    "license": "Pinterest",
                    "source_page": "https://www.pinterest.com/",
                    "image_path": image_path,
                })
                time.sleep(0.5)
            except Exception as e:
                log(f"下载/上传失败: {e}")

        if new_entries:
            ok = update_album_yml(cat, new_entries)
            summary["categories"][cat] = {
                "fetched": len(new_entries),
                "album_updated": ok,
            }
        else:
            summary["categories"][cat] = {"error": "all downloads failed"}

    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
