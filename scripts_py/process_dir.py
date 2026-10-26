#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Process one image directory end-to-end:

1. Upload all images via PicGo desktop HTTP server.
2. Call doubao multimodal API on each uploaded URL.
3. Write `<dirname>.md` inside the directory with image URL + vision content.

Usage:
    python process_dir.py "<absolute_dir>"
"""
import json
import os
import sys
import time

import picgo_upload
import vision_analyze


def process(dir_path):
    dir_path = os.path.abspath(dir_path).replace("\\", "/")
    name = os.path.basename(dir_path.rstrip("/"))
    print(f"[{name}] start", flush=True)

    paths = picgo_upload.collect([dir_path])
    if not paths:
        print(f"[{name}] no images, skip", flush=True)
        return False

    print(f"[{name}] uploading {len(paths)} images", flush=True)
    pairs = []
    for i in range(0, len(paths), 5):
        batch = paths[i:i + 5]
        resp = picgo_upload.upload_batch(batch)
        if not resp.get("success"):
            print(f"[{name}] upload FAIL: {resp.get('message')}", flush=True)
            return False
        urls = resp.get("result", [])
        for p, u in zip(batch, urls):
            pairs.append((p, u))
        time.sleep(0.3)
    print(f"[{name}] uploaded {len(pairs)} urls", flush=True)

    sections = []
    for idx, (p, u) in enumerate(pairs, 1):
        fname = os.path.basename(p)
        print(f"[{name}] vision {idx}/{len(pairs)} {fname}", flush=True)
        r = vision_analyze.call(u)
        if r.get("ok"):
            text = r["text"].strip()
        else:
            text = f"> 视觉分析失败：{r.get('error')}"
            print(f"[{name}] vision FAIL #{idx}: {r.get('error')}", flush=True)
        sections.append({"index": idx, "filename": fname, "url": u, "text": text})
        time.sleep(0.5)

    md_lines = [
        f"# {name}",
        "",
        f"> 自动生成：图片上传到阿里云 OSS，由多模态 LLM 转写，共 {len(sections)} 张图。",
        "",
    ]
    for s in sections:
        md_lines.append(f"## 图 {s['index']}：{s['filename']}")
        md_lines.append("")
        md_lines.append(f"![{s['filename']}]({s['url']})")
        md_lines.append("")
        md_lines.append(s["text"])
        md_lines.append("")
        md_lines.append("---")
        md_lines.append("")

    out_path = os.path.join(dir_path, f"{name}.md")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(md_lines))
    print(f"[{name}] WROTE {out_path}", flush=True)
    return True


def main():
    if len(sys.argv) < 2:
        print("Usage: process_dir.py <dir>")
        sys.exit(2)
    ok = process(sys.argv[1])
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
