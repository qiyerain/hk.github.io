#!/usr/bin/env python3
"""
Upload images to WeChat permanent material library (永久素材库).
Returns media_id and url for each image.
Pure stdlib only (no requests dependency).
"""
import os
import sys
import json
import uuid
import mimetypes
import urllib.request
import urllib.parse
from pathlib import Path


def load_env(env_path: Path) -> dict:
    env = {}
    if not env_path.exists():
        return env
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" in line:
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip().strip('"').strip("'")
    return env


def get_access_token(app_id: str, app_secret: str) -> str:
    qs = urllib.parse.urlencode({
        "grant_type": "client_credential",
        "appid": app_id,
        "secret": app_secret,
    })
    url = f"https://api.weixin.qq.com/cgi-bin/token?{qs}"
    with urllib.request.urlopen(url, timeout=30) as r:
        data = json.loads(r.read().decode("utf-8"))
    if data.get("errcode"):
        raise RuntimeError(f"Access token error: {data}")
    return data["access_token"]


def build_multipart(image_path: Path) -> tuple[bytes, str]:
    boundary = f"----PicGoBoundary{uuid.uuid4().hex}"
    content_type = mimetypes.guess_type(image_path.name)[0] or "image/png"
    with open(image_path, "rb") as f:
        file_bytes = f.read()

    body = b""
    body += f"--{boundary}\r\n".encode("utf-8")
    body += f'Content-Disposition: form-data; name="media"; filename="{image_path.name}"\r\n'.encode("utf-8")
    body += f"Content-Type: {content_type}\r\n\r\n".encode("utf-8")
    body += file_bytes
    body += b"\r\n"
    body += f"--{boundary}--\r\n".encode("utf-8")
    return body, boundary


def upload_material(image_path: Path, access_token: str) -> dict:
    qs = urllib.parse.urlencode({"access_token": access_token, "type": "image"})
    url = f"https://api.weixin.qq.com/cgi-bin/material/add_material?{qs}"

    body, boundary = build_multipart(image_path)
    req = urllib.request.Request(
        url,
        data=body,
        method="POST",
        headers={
            "Content-Type": f"multipart/form-data; boundary={boundary}",
            "Content-Length": str(len(body)),
        },
    )
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.loads(r.read().decode("utf-8"))


def main():
    if len(sys.argv) < 2:
        print("Usage: upload_to_wechat_material.py <image1> [image2 ...]", file=sys.stderr)
        sys.exit(1)

    env_path = Path("/Users/pengfanao/code/wwrtpfa.github.io/.baoyu-skills/.env")
    env = load_env(env_path)
    app_id = env.get("WECHAT_APPID") or env.get("WECHAT_APP_ID")
    app_secret = env.get("WECHAT_APP_SECRET") or env.get("WECHAT_APPSECRET")
    if not app_id or not app_secret:
        print(f"Missing WECHAT_APPID / WECHAT_APP_SECRET in {env_path}", file=sys.stderr)
        sys.exit(2)

    print(f"[wechat-material] Fetching access token for {app_id}...", file=sys.stderr)
    token = get_access_token(app_id, app_secret)

    results = []
    for image_arg in sys.argv[1:]:
        image_path = Path(image_arg).expanduser().resolve()
        if not image_path.exists():
            results.append({"path": str(image_path), "ok": False, "error": "file not found"})
            continue
        print(f"[wechat-material] Uploading {image_path.name}...", file=sys.stderr)
        try:
            resp = upload_material(image_path, token)
            if resp.get("errcode"):
                results.append({"path": str(image_path), "ok": False, "response": resp})
            else:
                results.append({
                    "path": str(image_path),
                    "ok": True,
                    "media_id": resp.get("media_id"),
                    "url": resp.get("url"),
                })
        except Exception as e:
            results.append({"path": str(image_path), "ok": False, "error": str(e)})

    print(json.dumps({"results": results}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
