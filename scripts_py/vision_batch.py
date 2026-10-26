#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Send a directory's images (already uploaded URLs) in ONE multimodal request.

Usage:
    python vision_batch.py <url1> <url2> ...
or pipe a JSON file produced by picgo_upload.py:
    python vision_batch.py --from-upload <path-to-upload.json>
"""
import json
import os
import sys
import urllib.request
import urllib.error

BASE_URL = os.environ.get("ANTHROPIC_BASE_URL", "https://ark.cn-beijing.volces.com/api/coding")
TOKEN = os.environ.get("ANTHROPIC_AUTH_TOKEN")
MODEL = os.environ.get("VISION_MODEL", "doubao-seed-2.0-pro")
MAX_TOKENS = int(os.environ.get("VISION_MAX_TOKENS", "16000"))

PROMPT = (
    "下面是一组按顺序排列的图片（同一篇文档/PPT 的连续截图），请按图片顺序，"
    "对每一张图分别完整识别并转写其全部内容，输出 Markdown。要求：\n"
    "1. 用 `## 图 N` 作为每张图的小标题，N 直接复用我在每张图前给出的编号（不要从 1 重新开始）。\n"
    "2. 文字/PPT/截图：逐字转写，保留标题层级、列表、代码块、表格、引用、箭头/连线关系。\n"
    "3. 架构图/流程图/时序图：描述节点、连线、流程步骤，必要时使用 Mermaid 还原。\n"
    "4. 不省略任何要点，不补充图中没有的内容；保留中英文专业术语原文。\n"
    "5. 直接输出 Markdown，不要前置寒暄。"
)


def build_content(urls, start_index=1):
    content = []
    for i, u in enumerate(urls, start_index):
        content.append({"type": "text", "text": f"图 {i}："})
        content.append({"type": "image", "source": {"type": "url", "url": u}})
    content.append({"type": "text", "text": PROMPT})
    return content


def call(urls, start_index=1):
    payload = {
        "model": MODEL,
        "max_tokens": MAX_TOKENS,
        "messages": [{"role": "user", "content": build_content(urls, start_index)}],
    }
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        BASE_URL.rstrip("/") + "/v1/messages",
        data=body,
        headers={
            "Content-Type": "application/json; charset=utf-8",
            "Authorization": f"Bearer {TOKEN}",
            "anthropic-version": "2023-06-01",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=600) as resp:
        return json.loads(resp.read().decode("utf-8"))


def main():
    args = sys.argv[1:]
    if not args:
        print("Usage: vision_batch.py <url> ... | --from-upload <file>")
        sys.exit(2)
    if args[0] == "--from-upload":
        with open(args[1], "r", encoding="utf-8") as f:
            data = json.load(f)
        urls = [r["url"] for r in data["results"]]
    else:
        urls = args

    print(f"# requesting model={MODEL} images={len(urls)}", file=sys.stderr, flush=True)
    try:
        resp = call(urls)
    except urllib.error.HTTPError as e:
        msg = e.read().decode("utf-8", errors="replace")
        print(f"HTTP {e.code}: {msg}", file=sys.stderr)
        sys.exit(1)
    text = "".join(p.get("text", "") for p in resp.get("content", []) if p.get("type") == "text")
    out_file = os.environ.get("VISION_OUT")
    if out_file:
        with open(out_file, "w", encoding="utf-8") as f:
            f.write(text)
    else:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stdout.write(text)
    usage = resp.get("usage", {})
    sys.stderr.write(f"\n<!-- usage: {usage} stop_reason={resp.get('stop_reason')} -->\n")


if __name__ == "__main__":
    main()
