---
title: 安卓投屏mac
cover_position: 50% 50%
featured: false
date: 2026-09-20 16:59:57
article_id: 9b7da57e-9a9d-5746-bb28-486affecea9a
categories:
tags:
description: 安卓手机投屏mac
cover: /img/covers/home/android-mac.svg
top_img: /img/covers/home/android-mac.svg
cover_alt: Android、ADB 与 scrcpy 投屏到 Mac 的连接链路示意图
series:
series_order:
---



可以直接下载，不必依赖 Homebrew。你这台 Mac 是 Apple Silicon（`arm64`），下载官方的 Apple Silicon 版本：

[下载 scrcpy-macos-aarch64-v4.1.tar.gz](https://github.com/Genymobile/scrcpy/releases/download/v4.1/scrcpy-macos-aarch64-v4.1.tar.gz)

它不是 `.dmg` 安装器，而是官方便携版压缩包。操作方法：

1. 下载并双击解压。
2. 打开“终端”，进入解压目录，例如：

```bash
cd ~/Downloads/scrcpy-macos-aarch64-v4.1
```

3. 连接安卓手机并打开 USB 调试，然后运行：

```bash
./scrcpy --video-bit-rate=16M --max-size=1920 --max-fps=60 --stay-awake
```

如果提示无法执行：

```bash
chmod +x scrcpy
./scrcpy
```

如果 macOS 阻止打开，到“系统设置 → 隐私与安全性”里允许，或者在 Finder 中右键 `scrcpy`，选择“打开”。

如果提示找不到 `adb`，再下载官方 Android Platform Tools：

[下载 platform-tools for Mac](https://dl.google.com/android/repository/platform-tools-latest-darwin.zip)

解压后执行：

```bash
cd ~/Downloads/platform-tools
./adb devices
```

看到手机后，用下面方式启动 scrcpy：

```bash
cd ~/Downloads/scrcpy-macos-aarch64-v4.1
PATH="$HOME/Downloads/platform-tools:$PATH" ./scrcpy \
  --video-bit-rate=16M \
  --max-size=1920 \
  --max-fps=60 \
  --stay-awake
```

如果想去掉上面点白边，ctrl+c结束后在执行
```bash
./scrcpy \
  --window-borderless \
  --video-bit-rate=16M \
  --max-size=1920 \
  --max-fps=60 \
  --stay-awake
```

如果想占满Mac整个屏幕，ctrl+c结束后在执行
```bash
./scrcpy \
  --window-borderless \
  --always-on-top \
  --video-bit-rate=16M \
  --max-size=1920 \
  --max-fps=60 \
  --stay-awake
```

你的直播链路直接这样即可：

```text
安卓手机 USB → scrcpy → Mac 抖音直播伴侣窗口采集
```

如果只是 Homebrew 下载超时，直接下载官方压缩包通常更适合你当前情况。

![img.png](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/blog/img.png)
