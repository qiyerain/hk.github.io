---
title: 写一次，博客和公众号草稿同时就绪：我的内容工作流
date: 2026-06-22 10:30:00
article_id: d4c00803-5668-5314-8eea-0e91e399870e
updated: 2026-09-15 21:11:28
categories:
  - agent
tags:
  - AI
  - 技能编排
  - md2wechat
  - 内容工作流
  - 自动化
cover: /img/covers/home/content-workflow.svg
top_img: /img/covers/home/content-workflow.svg
cover_alt: Markdown 原稿同时发布到 Hexo 博客和微信公众号的内容工作流
description: 我把研究、写作、封面、博客构建、公众号排版和草稿上传串成了一条可检查、可中断、可继续的个人内容工作流。
wechat_cover: https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/blog/cover-workflow-wechat-1080x460.png
wechat_status: draft
visual_template: handdrawn-knowledge-flow
visual_renderer: html-svg
visual_aspect: cover
meta:
  - name: style-pack
    content: C
sources:
  - https://github.com/geekjourneyx/md2wechat-skill
  - https://github.com/JimLiu/baoyu-skills
  - https://github.com/wwrtpfa/wwrtpfa.github.io
  - https://github.com/Molunerfinn/PicGo
  - https://hexo.io/
---

> **我真正想省掉的，不是写作，而是写完之后那一串重复劳动。** 维护一份 Markdown，就能得到一篇博客和一篇排好版的公众号草稿；某一步失败，也不必从头再来。

每次写完文章，我都要重复同一套动作：找封面、处理正文图、上传图床、检查博客，再去公众号后台重新排一遍。

写作只做了一次，搬运却像又写了一次。

于是我把这些步骤串成了一条个人内容工作流。它不替我按下最终发布按钮，但会把成品送到按钮前，并告诉我哪里通过了、哪里应该停。

> **一句话看懂：一份内容作为事实源，博客和公众号分别输出，失败从断点继续。**

## 先看结果：我最终拿到什么

不是一堆中间文件，而是三个可以继续使用的结果。

**博客成品**：标题、摘要、封面、正文图片、来源和分类都完整，Hexo 构建通过后才进入发布流程。

**公众号成品**：不是裸 Markdown，而是适合手机阅读的内联样式 HTML；正文图和封面也会进入公众号素材流程。

**恢复记录**：文章、图片和草稿状态被保存下来。网络或接口出错时，下次只重试没完成的部分。

![一份 Markdown 如何变成博客文章和公众号草稿](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/blog/workflow-dual-output-1200x675.png)

这张图就是整套流程：**同一份原稿，走向两个发布端；每个关键步骤前都有检查点。**

## 三个 Skill，不是三个“万能引擎”

我一开始也把它们讲复杂了。其实三个工具的关系非常简单：一个管全局，一个管排版，一个管送达。

> **总控｜wechat-article-generator**
>
> 它像项目经理加质检员：理解选题、组织文章、规划图片、调用图床、生成 Hexo 文件，并判断下一步该调用谁。它关心的是整件事有没有闭环。

> **排版｜md2wechat**
>
> 它把 Markdown 转成公众号兼容的 HTML，并负责主题、预览、封面和信息图等排版能力。文章已经写好、只想解决公众号排版的人，用这一段就够了。

> **送达｜baoyu-post-to-wechat**
>
> 它处理正文图片、封面素材、账号配置和草稿创建。它只负责把成品安全送进编辑后台，默认不会替我发布或群发。

所以，真正的关系不是“三个 AI 一起写文章”，而是：

**总控决定顺序，md2wechat 负责变好看，baoyu 负责放进草稿箱。**

## 稳定，不等于“一键无脑跑完”

这套工作流真正有用的地方，是把容易忘、容易错的动作变成固定顺序。

**先写清楚。** 总控先确认读者、核心结论和信息来源。涉及新闻、项目数据和产品能力时，必须保留来源，不能猜数字。

**再让图片解释内容。** 封面负责让读者一眼看懂主题，正文图负责解释流程、架构或故障恢复，不拿无关“科技图”凑数。

**图片先进入 OSS。** 博客只引用真实线上地址。上传失败时，流程停止，不偷偷改成本地路径，也不拿默认图顶上去。

**两个渠道分别渲染。** 博客保留 Markdown，交给 Hexo；公众号生成全内联样式 HTML，避免进入编辑器后样式丢失。

**最后才检查交付。** 封面、正文图、移动端字号、HTML 兼容性和博客构建全部通过，才算完成。

> 自动化不是“什么都继续做”，而是**该继续时继续，该停时明确停下。**

## 图片不是装饰，它要先回答问题

我对封面的要求只有一个：用户只看这张图，也能知道文章在讲什么。

因此，系统先从标题、摘要和正文里提炼一个主题与两到四个要点，再决定画面结构。图片模型只负责无文字底图或视觉框架，准确中文最后由可控排版叠加。

主标题和关键信息保留 6% 到 8% 的安全边距，缩成手机封面后仍要看得清。

如果生成服务不可用，才会选择同主题、来源明确的真实素材。技术文章只看技术类候选，不会从动漫、风景和人物图里随机抽一张。

这不是“有图就行”，而是四道检查：**主题相关、文字正确、画幅适配、来源可追溯。**

## 真正遇到故障时，会发生什么

![内容工作流的失败恢复策略](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/blog/failure-resume-1200x675.png)

我把故障分成三种，不同故障有不同处理方式。

**能替代**：封面生成服务不可用，可以换成同主题的真实素材，但必须重新检查构图和授权。

**能续跑**：出口 IP 不在白名单，博客和微信 HTML 可以保留；网络恢复后，只重试草稿上传。

**必须停**：图片没上传到 OSS、文章检查没通过、草稿条件不满足。此时不能伪造 URL，也不能为了“看起来完成了”而静默降级。

`state.json` 记录文章哈希、素材和草稿结果。它不会让错误自动消失，但会让下一次清楚知道：**哪些已经完成，哪些还没做。**

## 9 月 13 日那次失败，反而说明它有用

那期 GitHub 周报第一次运行时，博客已经构建并推送成功，公众号却没有出现草稿。

问题不在文章，而在代理改变了出口 IP，公众号令牌接口返回 `40164`，当前地址不在白名单。

流程没有假装成功。文章、微信 HTML、封面和已上传图片都被保留下来。

关闭代理后，我只重试了草稿阶段：重新检查令牌，上传正文图与封面，创建草稿，再核对标题、正文和阅读原文链接。

没有重新研究，没有重新写稿，也没有再生成一篇博客。

> 这比“全自动”更重要：**失败时知道停在哪里，恢复时知道从哪里接着走。**

## 你不必复刻整套系统

只做公众号排版，就拿走 [md2wechat](https://github.com/geekjourneyx/md2wechat-skill)：Markdown 写完后，用它生成适合公众号的 HTML 和预览。

已经有排好版的 Markdown 或 HTML，只差进入草稿箱，就用 [baoyu-post-to-wechat](https://github.com/JimLiu/baoyu-skills/tree/main/skills/baoyu-post-to-wechat)。

同时维护 Hexo、Hugo 等博客和公众号，再借鉴总控思路：保留一份主稿，为两个渠道分别输出，并给图片、排版和构建设置硬检查。

如果只想改善封面，也只需要拿走一条原则：**先让图片说清文章主题，再谈风格好不好看。**

## 文末工具箱

- [wechat-article-generator：我的总控 Skill](https://github.com/wwrtpfa/wwrtpfa.github.io/tree/master/.codex/skills/wechat-article-generator)
- [md2wechat：Markdown 转公众号 HTML、预览与视觉生成](https://github.com/geekjourneyx/md2wechat-skill)
- [baoyu-post-to-wechat：公众号草稿上传与多通道发布](https://github.com/JimLiu/baoyu-skills/tree/main/skills/baoyu-post-to-wechat)
- [PicGo：图片上传与图床客户端](https://github.com/Molunerfinn/PicGo)
- [Hexo：静态博客生成器](https://hexo.io/)

我最后留下的不是一个所有人都要照搬的方案，而是三个可以复用的原则：**一份内容作为事实源，工具各做自己擅长的事，任何发布都要经过可验证的质量门。**

如果你也在做内容，你最想先省掉哪一步：排版、配图，还是草稿上传？
