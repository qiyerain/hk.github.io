# Historical cover migration inventory

Audit date: 2026-09-23

## Finding

The content-aware cover rule exists, but it was introduced after the current library. Front matter inspection identifies 46 posts whose covers are known generic legacy assets: 18 reuse eight anime covers and 28 use topic-loose `dedup-XX.webp` technology photographs. Two newer GitHub Weekly covers are bespoke or require separate review and are not included below.

This file is an inventory, not permission to bulk reassign images. Each item must receive an article-derived brief, a reviewed 16:9 sketch cover, `cover_alt`, and a verified OSS URL before its front matter changes.

## Generic anime covers (18)

- `source/_posts/agent/Claude Code 从零到上手.md`
- `source/_posts/agent/Claude-Code-Codex-agent-browser-残留进程排查.md`
- `source/_posts/agent/Claude使用技巧.md`
- `source/_posts/agent/Comet Skill——串起 OpenSpec 与 Superpowers.md`
- `source/_posts/agent/Kimi WebBridge-vs-agent-browser-vs-Playwright对比.md`
- `source/_posts/agent/Kimi WebBridge原理.md`
- `source/_posts/agent/LangChain-Agent-01-概念篇-Agent是什么.md`
- `source/_posts/agent/LangChain-Agent-02-架构篇-LangChain内部怎么转的.md`
- `source/_posts/agent/LangChain-Agent-03-实战篇-从零搭建代码助手Agent.md`
- `source/_posts/agent/nanobot核心架构.md`
- `source/_posts/agent/当AI学会排版-3个开源Skill编排微信公众号引擎.md`
- `source/_posts/成长/经济下行时年轻人的出路不是硬扛.md`
- `source/_posts/面试/HashMap线程安全问题与解决方案.md`
- `source/_posts/面试/MyBatis原理.md`
- `source/_posts/面试/Spring Bean循环依赖.md`
- `source/_posts/面试/Spring Bean生命周期.md`
- `source/_posts/面试/Spring与SpringBoot.md`
- `source/_posts/面试/synchronized与ReentrantLock区别.md`

## Generic technology photographs (28)

- `source/_posts/后端/Docker.md`
- `source/_posts/后端/Flowable.md`
- `source/_posts/后端/git使用.md`
- `source/_posts/后端/hexo入门.md`
- `source/_posts/后端/JavaBase.md`
- `source/_posts/后端/Juc并发编程.md`
- `source/_posts/后端/Linux常用命令.md`
- `source/_posts/后端/Maven脚手架.md`
- `source/_posts/后端/Mybatis.md`
- `source/_posts/后端/Mysql篇.md`
- `source/_posts/后端/Redis.md`
- `source/_posts/后端/Springboot-cloud.md`
- `source/_posts/后端/Springmvc.md`
- `source/_posts/后端/StableDeiffusion.md`
- `source/_posts/后端/Webflow.md`
- `source/_posts/后端/前端部署.md`
- `source/_posts/后端/安装Linux系统.md`
- `source/_posts/后端/并发.md`
- `source/_posts/后端/快速搭建一个人博客.md`
- `source/_posts/后端/算法.md`
- `source/_posts/后端/设计模式.md`
- `source/_posts/后端/项目开发.md`
- `source/_posts/每周GitHub趋势/2026-06-15-GitHub趋势.md`
- `source/_posts/每周GitHub趋势/2026-06-17-GitHub趋势.md`
- `source/_posts/每周GitHub趋势/2026-06-18-GitHub趋势.md`
- `source/_posts/每周GitHub趋势/2026-06-20-GitHub趋势.md`
- `source/_posts/每周GitHub趋势/2026-06-22-GitHub趋势.md`
- `source/_posts/面试/HashMap底层原理与扩容.md`

## Migration order

1. Agent and interview series, because anime covers create the largest semantic mismatch.
2. Evergreen backend articles, grouped only where a shared visual system still permits article-specific diagrams and labels.
3. Historical GitHub trend posts, after deciding whether old daily editions remain publicly prominent enough to justify regeneration.
