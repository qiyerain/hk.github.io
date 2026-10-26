#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""For each image dir, convert all .jpg/.jpeg/.png/.bmp to PNG with name
`image-<14-digit-ts>-<NNN>.png`, upload to PicGo (Aliyun OSS), then rewrite
the dir's existing `<dir>.md`:
  - replace the old URL list under `## 引用` (in order) with new PNG URLs
  - inject `![image-...](png-url)` immediately under each `## 图 N` heading

Usage:
    python jpg2png_relink.py <dir> [<dir> ...]
"""
import json
import os
import re
import sys
import time
from datetime import datetime
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import picgo_upload  # noqa

EXTS = (".jpg", ".jpeg", ".png", ".bmp", ".webp")


def list_images(d):
    return sorted(
        f for f in os.listdir(d)
        if f.lower().endswith(EXTS) and not f.lower().startswith("image-")
    )


def convert_dir(d):
    """Convert jpg/etc -> image-<ts>-<idx>.png. Returns list of new abs paths."""
    files = list_images(d)
    if not files:
        return []
    ts_base = datetime.now().strftime("%Y%m%d%H%M%S")
    out = []
    png_dir = os.path.join(d, "_png")
    os.makedirs(png_dir, exist_ok=True)
    for i, fname in enumerate(files, 1):
        src = os.path.join(d, fname)
        new_name = f"image-{ts_base}{i:03d}.png"
        dst = os.path.join(png_dir, new_name)
        if not os.path.exists(dst):
            with Image.open(src) as im:
                if im.mode in ("RGBA", "LA"):
                    im.save(dst, "PNG")
                else:
                    im.convert("RGB").save(dst, "PNG", optimize=True)
        out.append((fname, dst.replace("\\", "/"), new_name))
    return out


def upload(paths):
    pairs = []
    for i in range(0, len(paths), 5):
        batch = paths[i:i + 5]
        r = picgo_upload.upload_batch(batch)
        if not r.get("success"):
            return None, f"upload fail: {r.get('message')}"
        urls = r.get("result", [])
        for p, u in zip(batch, urls):
            pairs.append((p, u))
        time.sleep(0.3)
    return pairs, None


def rewrite_md(md_path, new_urls, new_names, old_filenames):
    with open(md_path, "r", encoding="utf-8") as f:
        text = f.read()

    # 1. Replace `## 引用` body with new image-name -> new url
    ref_idx = text.rfind("## 引用")
    if ref_idx == -1:
        head = text.rstrip() + "\n\n## 引用\n\n"
    else:
        head = text[:ref_idx]
        head = head.rstrip() + "\n\n## 引用\n\n"
    ref_lines = []
    for i, (name, url) in enumerate(zip(new_names, new_urls), 1):
        ref_lines.append(f"{i}. [{name}]({url})")
    text_new = head + "\n".join(ref_lines) + "\n"

    # 2. Inject `![alt](url)` under each `## 图 N` heading.
    #    Map figure index -> (name, url)
    mapping = {i + 1: (n, u) for i, (n, u) in enumerate(zip(new_names, new_urls))}

    def insert_after_heading(m):
        n = int(m.group(1))
        if n not in mapping:
            return m.group(0)
        name, url = mapping[n]
        # Skip if already has an image right after
        return f"{m.group(0)}\n\n![{name}]({url})"

    pattern = re.compile(r"^(?:##\s*图\s*(\d+)[^\n]*)$", re.MULTILINE)
    # Need to also strip any pre-existing image line directly under heading first
    # Remove existing `![...]` line that follows `## 图 N`
    text_new = re.sub(
        r"(^##\s*图\s*\d+[^\n]*\n)\n*!\[[^\]]*\]\([^)]*\)\n",
        r"\1",
        text_new,
        flags=re.MULTILINE,
    )
    text_new = pattern.sub(insert_after_heading, text_new)

    with open(md_path, "w", encoding="utf-8") as f:
        f.write(text_new)


def process(d):
    d = os.path.abspath(d).replace("\\", "/")
    name = os.path.basename(d.rstrip("/"))
    md = os.path.join(d, f"{name}.md")
    if not os.path.exists(md):
        print(f"[{name}] no md, skip")
        return False

    converted = convert_dir(d)
    if not converted:
        print(f"[{name}] no source images, skip")
        return False
    print(f"[{name}] converted {len(converted)} -> PNG")

    abs_paths = [c[1] for c in converted]
    pairs, err = upload(abs_paths)
    if err:
        print(f"[{name}] {err}")
        return False
    new_names = [c[2] for c in converted]
    new_urls = [u for _, u in pairs]
    print(f"[{name}] uploaded {len(new_urls)} PNGs")

    rewrite_md(md, new_urls, new_names, [c[0] for c in converted])
    print(f"[{name}] rewrote {md}")
    return True


def main():
    if len(sys.argv) < 2:
        print("Usage: jpg2png_relink.py <dir> [...]")
        sys.exit(2)
    fails = []
    for d in sys.argv[1:]:
        ok = process(d)
        if not ok:
            fails.append(d)
    if fails:
        print("FAIL:")
        for d in fails:
            print(f"  {d}")
        sys.exit(1)


if __name__ == "__main__":
    main()
