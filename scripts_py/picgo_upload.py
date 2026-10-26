#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Upload images to PicGo desktop HTTP server (127.0.0.1:36677).

Usage:
    python picgo_upload.py <directory>
    python picgo_upload.py <file1> <file2> ...

Outputs JSON: {"ok": bool, "results": [{"path":..., "url":...}], "error": ...}
"""
import json
import os
import sys
import urllib.request
import urllib.error

PICGO_URL = "http://127.0.0.1:36677/upload"


def upload_batch(paths):
    payload = json.dumps({"list": paths}, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        PICGO_URL,
        data=payload,
        headers={"Content-Type": "application/json; charset=utf-8"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            body = resp.read().decode("utf-8")
            return json.loads(body)
    except urllib.error.HTTPError as e:
        return {"success": False, "message": f"HTTP {e.code}: {e.read().decode('utf-8', errors='replace')}"}
    except Exception as e:
        return {"success": False, "message": f"Error: {e}"}


def collect(args):
    files = []
    for a in args:
        if os.path.isdir(a):
            for name in sorted(os.listdir(a)):
                lower = name.lower()
                if lower.endswith((".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp")):
                    files.append(os.path.abspath(os.path.join(a, name)))
        elif os.path.isfile(a):
            files.append(os.path.abspath(a))
    # Normalize backslashes -> forward slashes (PicGo accepts both, but consistent)
    return [p.replace("\\", "/") for p in files]


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"ok": False, "error": "Usage: picgo_upload.py <dir|files...>"}))
        sys.exit(2)

    paths = collect(sys.argv[1:])
    if not paths:
        print(json.dumps({"ok": False, "error": "No image files found"}, ensure_ascii=False))
        sys.exit(1)

    # Upload in chunks of 5 to be safe
    results = []
    chunk_size = 5
    for i in range(0, len(paths), chunk_size):
        batch = paths[i:i + chunk_size]
        resp = upload_batch(batch)
        if not resp.get("success"):
            print(json.dumps({
                "ok": False,
                "error": resp.get("message", "unknown"),
                "batch": batch,
                "partial": results,
            }, ensure_ascii=False))
            sys.exit(1)
        urls = resp.get("result", [])
        for p, u in zip(batch, urls):
            results.append({"path": p, "url": u})

    print(json.dumps({"ok": True, "results": results}, ensure_ascii=False))


if __name__ == "__main__":
    main()
