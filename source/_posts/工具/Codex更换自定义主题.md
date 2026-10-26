---
title: Codex更换自定义主题
date: 2026-09-23 03:10:00
article_id: 87cd3699-8e48-5ca5-9a4a-d135291cfc93
updated: 2026-09-23 03:10:00
categories:
  - 工具
tags:
  - Codex
  - DreamSkin
  - macOS
  - FFmpeg
  - WebP
description: 在 macOS 上用 DreamSkin 给 Codex 更换自定义主题，并把 MP4 处理成可用的动态 WebP 背景。
cover: /img/covers/home/codex-theme.svg
top_img: /img/covers/home/codex-theme.svg
cover_alt: Codex、DreamSkin 与 FFmpeg 动态主题处理流程示意
visual_template: handdrawn-knowledge-flow
visual_renderer: html-svg
visual_aspect: inline
---

最近给 Codex 换了一套背景。折腾下来，静态主题其实很简单，真正费时间的是动态背景：原视频很清楚，一转成 WebP，体积和画质就开始打架。

这篇把完整流程记下来。只想换现成主题的话，前半部分几分钟就能完成；想自己做动态主题，再往后看 FFmpeg 那一段。

## 一、安装 DreamSkin

DreamSkin 是一款第三方 Codex 桌面端主题工具。它通过本地 CDP 注入主题，不需要修改 Codex 官方应用包。

先打开 [DreamSkin 官网](https://dreamskin.cc/)，或者直接进入 [下载页面](https://dreamskin.cc/download) 下载安装包。

在 macOS 上安装时，建议先把 Codex（旧版本界面里可能显示为 ChatGPT）彻底退出。不是只关窗口，而是在菜单栏或程序坞中选择“退出”。否则旧进程还在运行，主题引擎可能无法正确安装或加载。

安装步骤很普通：

1. 下载并打开 DMG。
2. 将 DreamSkin 拖入“应用程序”。
3. 启动 DreamSkin，按提示授予必要权限。

## 二、安装或升级主题引擎

第一次启动后，打开 Mac 顶部菜单栏里的 DreamSkin 图标，依次选择：

> 维护 → 修复 / 重新安装引擎…

![在 DreamSkin 菜单中修复或重新安装主题引擎](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/blog/codex-clipboard-a8649369-eecf-46e4-a19d-feb953fbba6a.png)

这一步会把当前版本的主题引擎装好。以后 Codex 更新后，如果主题突然失效，也可以先回到这里重新安装引擎，再重新应用一次皮肤。

## 三、一键应用主题

接着进入 DreamSkin 官方主题库。我做的这款主题已经发布，可以直接打开：

[查看并安装这款 Codex 主题](https://dreamskin.cc/themes/ver_04ccc15583f908ce0673)

在主题详情页点击“一键换肤”，然后回到 DreamSkin 应用皮肤即可。

![主题应用后的 Codex 界面](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/blog/codex-clipboard-ea70377f-193e-408b-832e-9b16d74131a8.png)

如果页面按钮没有拉起 DreamSkin，先确认应用已经启动，再试一次。主题装好后通常不需要重启 Mac，重新应用皮肤或重开 Codex 就够了。

## 四、动态主题为什么要先转成 WebP

我后来又做了一版动态背景，源文件是一段 MP4。这里不能直接把视频改名成 `background.webp`，因为两种文件的内容格式完全不同。

DreamSkin 当前的主题包只识别 `background.png`、`background.jpg` 和 `background.webp`。引擎读取图片后，将它变成 Blob URL，再作为 CSS 背景交给 Codex 界面显示。MP4 是视频容器，现有链路里没有负责创建 `<video>`、自动播放和循环控制的代码。

动态 WebP 正好卡在中间：对引擎来说它仍然是一张图片，对用户来说它又能播放多帧动画。因此目前最省事的办法，就是用 FFmpeg 把 MP4 抽帧、缩放，再编码成动态 WebP。

![MP4 转成 DreamSkin 动态主题的处理流程](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/blog/dreamskin-flow.png)

## 五、我实际使用的 FFmpeg 命令

先安装 FFmpeg：

```bash
brew install ffmpeg
```

然后执行下面这条命令。把输入和输出路径换成自己的即可：

```bash
ffmpeg -y \
  -i "/path/input.mp4" \
  -an \
  -vf "fps=15,scale=1920:1080:force_original_aspect_ratio=increase:flags=lanczos,crop=1920:1080,setpts=PTS-STARTPTS" \
  -c:v libwebp_anim \
  -lossless 0 \
  -compression_level 4 \
  -q:v 92 \
  -loop 0 \
  "/path/background.webp"
```

这组参数的意思并不复杂：

- `-an`：去掉音频，桌面背景用不到声音。
- `fps=15`：每秒保留 15 帧。对壁纸来说通常够用，也能明显减小体积。
- `scale` 加 `crop`：先等比放大，再裁成 1920×1080，不拉伸画面。
- `flags=lanczos`：缩放时尽量保留细节。
- `-q:v 92`：有损 WebP 的画质参数，数字越高越清楚，文件也越大。
- `-loop 0`：无限循环播放。

我这次做出来的文件是 1920×1080、15 FPS、76 帧、质量 92，最终 8.66 MB，已经能在 Codex 里正常循环。

## 六、为什么必须小于 10 MiB

这个限制不是经验值，而是 DreamSkin 当前源码里的硬校验：背景图片最大允许 `10 × 1024 × 1024` 字节，也就是 **10,485,760 字节**。

超过这个大小，主题在导入或校验时就会被拒绝。所以不要盯着源视频是 40 MB、80 MB 还是 4K。最终文件大小主要由下面几项决定：

- 视频时长；
- 画面运动和细节多少；
- 输出分辨率；
- 帧率；
- WebP 质量。

同样是 4K 视频，5 秒的慢镜头和 30 秒的快速运动，压出来可能差很多。

如果生成结果超过 10 MiB，我一般按这个顺序调整：先把 `q92` 降到 `q90` 或 `q88`，再把 `fps=15` 降到 `fps=12`，最后才把 1920×1080 降到 1600×900。先降分辨率最伤观感，不建议一上来就做。

可以用下面这张表快速选参数：

| 视频时长 | 建议分辨率 | 帧率 | 质量 |
| --- | --- | --- | --- |
| 5 秒以内 | 1920×1080 | 15 FPS | 92 |
| 5～8 秒 | 1920×1080 | 15 FPS | 88～90 |
| 8～12 秒 | 1920×1080 | 12 FPS | 85～88 |
| 12～20 秒 | 1600×900 | 10 FPS | 82～86 |

这只是起点，不是万能公式。画面越复杂，越需要继续降低质量或帧率。

## 七、别忘了检查它是不是真的会动

有些 FFmpeg 构建虽然带有 `libwebp_anim`，实际输出却可能只有一帧。文件扩展名还是 WebP，但放进主题后只会显示静态画面。

安装 WebP 工具并检查帧数：

```bash
brew install webp
webpmux -info "/path/background.webp"
```

输出里的 `Number of frames` 必须大于 1。

如果只有一帧，可以改用更稳妥的两步法：先用 FFmpeg 导出序列帧，再交给 `img2webp` 合成。

```bash
mkdir -p /tmp/dreamskin-frames

ffmpeg -y \
  -i "/path/input.mp4" \
  -an \
  -vf "fps=15,scale=1920:1080:force_original_aspect_ratio=increase:flags=lanczos,crop=1920:1080" \
  "/tmp/dreamskin-frames/frame-%04d.png"

img2webp \
  -lossy -q 92 -d 67 -loop 0 \
  /tmp/dreamskin-frames/frame-*.png \
  -o "/path/background.webp"
```

`-d 67` 表示每帧大约停留 67 毫秒，对应约 15 FPS。生成后再跑一次 `webpmux -info`，确认帧数和文件大小。

最后，把生成的文件命名为 `background.webp`，覆盖主题目录中的同名文件，再从 DreamSkin 菜单选择“重新应用皮肤”。只要主题结构没变，后续换视频都可以沿用这套流程。

## 八、后面准备怎么改

WebP 方案能用，但画质、体积和帧率必须互相让步。尤其是 2K、4K 视频，为了塞进 10 MiB，损失会比较明显。

后续更合理的方向是直接改 DreamSkin 引擎：

1. 在主题包校验中允许 MP4、WebM 等视频资源；
2. 注入一个静音、循环、自动播放的 `<video>` 背景层；
3. 处理窗口切换、主题卸载和资源释放；
4. 再根据实际内存占用，决定是否放宽 10 MiB 限制。

只把 10 MiB 改大并不能解决 MP4 播放，因为“文件能通过校验”和“渲染器会播放视频”是两件事。原生视频支持的改动会比改一个数字大一些，但能绕开动态 WebP 的体积困境，画质和编码效率也会好得多。

现阶段如果只是想快速换一段动态背景，还是建议先用 5～8 秒的短视频、1080p、12～15 FPS。这个区间最容易把体积控制住，实际桌面观感也比较稳。

## 参考链接

- [DreamSkin 官网](https://dreamskin.cc/)
- [DreamSkin 下载](https://dreamskin.cc/download)
- [本文使用的主题](https://dreamskin.cc/themes/ver_04ccc15583f908ce0673)
- [DreamSkin 开源仓库](https://github.com/Fei-Away/Codex-Dream-Skin)
