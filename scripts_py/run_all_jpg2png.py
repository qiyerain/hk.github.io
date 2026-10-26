#!/usr/bin/env python
# -*- coding: utf-8 -*-
import os
import sys
import subprocess

this_dir = os.path.dirname(os.path.abspath(__file__))
root = os.path.join(os.path.dirname(this_dir), "source/_drafts/shuma")

todo = []
for name in sorted(os.listdir(root)):
    d = os.path.join(root, name)
    if not os.path.isdir(d):
        continue
    md = os.path.join(d, name + ".md")
    if not os.path.exists(md):
        continue
    with open(md, "r", encoding="utf-8") as f:
        c = f.read()
        has_png = "image-" in c and ".png" in c
    if not has_png:
        todo.append(d)

print(f"Todo: {len(todo)} dirs", file=sys.stderr)

for d in todo:
    print("=" * 60, file=sys.stderr)
    print(f"Processing: {d}", file=sys.stderr)
    try:
        subprocess.run(
            [sys.executable, "jpg2png_relink.py", d],
            check=True,
            cwd=this_dir,
            capture_output=False,
        )
    except subprocess.CalledProcessError as e:
        print(f"FAIL: {d}", file=sys.stderr)
