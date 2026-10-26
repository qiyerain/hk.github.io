#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""End-to-end batch pipeline for one image directory.

For directory `<dir>`:
  1. PicGo upload all images -> Aliyun OSS URLs.
  2. Single multimodal request (all images, one call) -> Markdown body.
  3. Write `<dir>/<dirname>.md`:
        # <dirname>
        <model output>
        ## 引用
        - <url1>
        - ...
"""
import json
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import picgo_upload  # noqa: E402
import vision_batch  # noqa: E402


def upload_dir(dir_path):
    paths = picgo_upload.collect([dir_path])
    pairs = []
    for i in range(0, len(paths), 5):
        batch = paths[i:i + 5]
        r = picgo_upload.upload_batch(batch)
        if not r.get("success"):
            return None, f"upload fail: {r.get('message')}"
        for p, u in zip(batch, r.get("result", [])):
            pairs.append({"path": p, "url": u})
        time.sleep(0.3)
    return pairs, None


def process(dir_path):
    dir_path = os.path.abspath(dir_path).replace("\\", "/")
    name = os.path.basename(dir_path.rstrip("/"))
    print(f"[{name}] uploading...", flush=True)
    pairs, err = upload_dir(dir_path)
    if err:
        print(f"[{name}] {err}", flush=True)
        return False
    if not pairs:
        print(f"[{name}] no images", flush=True)
        return False
    print(f"[{name}] uploaded {len(pairs)}, calling model...", flush=True)

    urls = [p["url"] for p in pairs]
    chunk = int(os.environ.get("VISION_CHUNK", "18"))
    parts = []
    total_usage = {"input_tokens": 0, "output_tokens": 0}
    offset = 0
    for i in range(0, len(urls), chunk):
        sub = urls[i:i + chunk]
        print(f"[{name}] chunk {i // chunk + 1}: imgs {i + 1}-{i + len(sub)}", flush=True)
        last_err = None
        ok = False
        for attempt in range(1, 4):
            try:
                resp = vision_batch.call(sub, start_index=offset + 1)
            except Exception as e:
                last_err = f"call exception: {e}"
                print(f"[{name}] chunk attempt {attempt} FAIL: {last_err}", flush=True)
                time.sleep(3 * attempt)
                continue
            content = resp.get("content")
            if not content:
                last_err = f"empty content, stop_reason={resp.get('stop_reason')}, raw={str(resp)[:300]}"
                print(f"[{name}] chunk attempt {attempt} empty: {last_err}", flush=True)
                time.sleep(3 * attempt)
                continue
            t = "".join(p.get("text", "") for p in content if p.get("type") == "text").strip()
            if not t:
                last_err = "empty text"
                print(f"[{name}] chunk attempt {attempt} empty text", flush=True)
                time.sleep(3 * attempt)
                continue
            parts.append(t)
            u = resp.get("usage", {})
            total_usage["input_tokens"] += u.get("input_tokens", 0)
            total_usage["output_tokens"] += u.get("output_tokens", 0)
            stop = resp.get("stop_reason")
            print(f"[{name}] chunk done usage={u} stop={stop}", flush=True)
            ok = True
            break
        if not ok:
            print(f"[{name}] model FAIL after retries: {last_err}", flush=True)
            with open(os.path.join(dir_path, "._upload.json"), "w", encoding="utf-8") as f:
                json.dump(pairs, f, ensure_ascii=False, indent=2)
            return False
        offset += len(sub)
    text = "\n\n".join(parts)
    print(f"[{name}] total usage={total_usage}", flush=True)

    md = []
    md.append(f"# {name}")
    md.append("")
    md.append(f"> 自动生成：{len(pairs)} 张图，由多模态模型 `{vision_batch.MODEL}` 一次性识别转写。")
    md.append("")
    md.append(text)
    md.append("")
    md.append("## 引用")
    md.append("")
    for i, p in enumerate(pairs, 1):
        fname = os.path.basename(p["path"])
        md.append(f"{i}. [{fname}]({p['url']})")
    md.append("")

    out_path = os.path.join(dir_path, f"{name}.md")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(md))
    print(f"[{name}] wrote {out_path}", flush=True)
    return True


def main():
    if len(sys.argv) < 2:
        print("Usage: build_md.py <dir> [<dir> ...]")
        sys.exit(2)
    failures = []
    for d in sys.argv[1:]:
        ok = process(d)
        if not ok:
            failures.append(d)
    if failures:
        print("FAILED:", file=sys.stderr)
        for d in failures:
            print(f"  {d}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
