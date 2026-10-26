#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Call doubao multimodal vision via Anthropic-compatible endpoint to analyze image URLs.

Reads ANTHROPIC_AUTH_TOKEN + ANTHROPIC_BASE_URL from env.
Usage:
    python vision_analyze.py <image_url> [<image_url> ...]
Outputs JSON: {"ok": bool, "results": [{"url":..., "ok":..., "text":...|"error":...}]}
"""
import json
import os
import sys
import urllib.request
import urllib.error

BASE_URL = os.environ.get("ANTHROPIC_BASE_URL", "https://ark.cn-beijing.volces.com/api/coding")
TOKEN = os.environ.get("ANTHROPIC_AUTH_TOKEN")
MODEL = os.environ.get("VISION_MODEL", "doubao-seed-2.0-pro")
MAX_TOKENS = int(os.environ.get("VISION_MAX_TOKENS", "4096"))

PROMPT = (
    "请详细识别并完整转写这张图片中的全部内容，输出 Markdown。要求：\n"
    "1. 如果是文字/PPT/文档/截图，逐字转写，保留标题层级、有序/无序列表、代码块、表格、引用、箭头/连线关系。\n"
    "2. 如果有架构图/流程图/时序图，描述节点、连线、流程步骤，必要时使用 Mermaid 还原。\n"
    "3. 不省略任何要点，不补充图中没有的内容；保留中英文专业术语原文。\n"
    "4. 直接输出转写结果，不要前置寒暄。"
)


def call(url):
    payload = {
        "model": MODEL,
        "max_tokens": MAX_TOKENS,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "image", "source": {"type": "url", "url": url}},
                    {"type": "text", "text": PROMPT},
                ],
            }
        ],
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
    try:
        with urllib.request.urlopen(req, timeout=240) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            text = "".join(part.get("text", "") for part in data.get("content", []) if part.get("type") == "text")
            return {"ok": True, "text": text}
    except urllib.error.HTTPError as e:
        msg = e.read().decode("utf-8", errors="replace")
        return {"ok": False, "error": f"HTTP {e.code}: {msg[:500]}"}
    except Exception as e:
        return {"ok": False, "error": str(e)}


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"ok": False, "error": "Usage: vision_analyze.py <url> [...]"}))
        sys.exit(2)
    if not TOKEN:
        print(json.dumps({"ok": False, "error": "no ANTHROPIC_AUTH_TOKEN"}))
        sys.exit(2)

    results = []
    for url in sys.argv[1:]:
        r = call(url)
        results.append({"url": url, **r})
    print(json.dumps({"ok": True, "results": results}, ensure_ascii=False))


if __name__ == "__main__":
    main()
