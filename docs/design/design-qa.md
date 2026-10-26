# 小遨博客全站玻璃重构 — Design QA

## Visual truth and implementation evidence

- 首页参考：`codex-clipboard-38563c3b-8e80-4c94-994f-eab50938619c.png`
- 文章资料库参考：`codex-clipboard-7d101780-db19-469f-a890-678a04c23f88.png`
- 归档参考：`codex-clipboard-8320e62b-0c7d-4410-b9e6-3b15f7a3cf21.png`
- 文章阅读参考：`codex-clipboard-4bb70ae0-482b-42bd-9c64-7b72c2454f04.png`
- React Bits ProfileCard 规格：`attachments/6c48d01b-7b37-448c-b776-d62387b96887/pasted-text.txt`
- 同视口对照：
  - `image-archive/review/qa-home-comparison.jpg`
  - `image-archive/review/qa-directory-comparison.jpg`
  - `image-archive/review/qa-archive-comparison.jpg`
  - `image-archive/review/qa-post-comparison.jpg`
- 聚焦区域：
  - `image-archive/review/qa-about-profile.png`
  - `image-archive/review/qa-post-toc-active.png`
- 桌面视口：1440×1000、2048×961/1152/1207/1189；移动视口：390×844。
- 状态：亮色、暗色、滚动中目录、目录抽屉、友链筛选、公众号预览、鼠标悬浮人物卡。

## Full-view comparison findings

- 首页保留灰阶编辑排版与中文衬线标题，将原型的平面半透明卡升级为有内高光、折射边和环境阴影的玻璃系统；首屏比例、内容层级和背景遮罩保持一致。
- 文章资料库把原本分离的目录和文章网格收进同一个玻璃容器；桌面双栏、移动抽屉、分页归位和卡片封面比例均已验证。
- 归档从文字长列表改为横向卡牌轨道；卡片具备轻微发牌角度、滚动吸附和聚焦抬升，小屏幕退化为无旋转单列。
- 文章阅读页维持窄正文＋右侧目录。代码块在亮色与暗色都具备足够对比，目录在长文滚动时保持吸顶。

## Focused region findings

- 关于页人物照片按 ProfileCard 规格完成原生实现：缓动倾斜、鼠标追光、背后辉光、照片视差、身份信息玻璃条和联系方式；移动端与减少动态模式关闭倾斜。
- 文章目录新增当前章节玻璃游标、左侧光标、`当前 / 总数` 进度。实测滚动至“创建 Agent”时显示 `05 / 12`，游标会平滑移动而不遮挡文字。
- 公众号精选预览不再依赖主题懒加载的占位 `src`；hover/focus 会更新真实本地封面，移动端默认显示首张预览。

## Functional and responsive verification

- [x] `npm run build`：成功，144 个页面/资源生成，无 Pug、YAML、Front Matter 错误。
- [x] JavaScript 语法检查：`xiaoao-site.js`、`xiaoao-experience.js` 通过。
- [x] 首页、关于、归档、标签、目录、友链、公众号、文章详情：桌面截图检查通过。
- [x] 关于、归档、目录、友链、公众号：390×844 无横向溢出、无破图。
- [x] 文章详情：亮色/暗色代码块可读；右侧目录 sticky；滚动章节状态正确。
- [x] 目录移动抽屉：点击后 `is-filter-open=true`，目录轨道可见。
- [x] 友链筛选：Agent 分类从 9 张资源卡正确筛选到 2 张。
- [x] 公众号预览：真实图片加载，hover 后封面和 active 状态更新。
- [x] 所有外链包含 `target="_blank" rel="noopener noreferrer"`，9 个本地图标均存在。
- [x] reduced-motion 与触屏模式关闭倾斜、视差和发牌旋转。

## Cover and data audit

- 文章总数：44；每日 GitHub 趋势：5（原海报保持不变）；其余文章：39。
- 39 篇非 GitHub 趋势文章均有显式 `cover` 与 `top_img`，且两者一致。
- 本地封面缺失：0；SHA-256 重复：0；近似重复：0；唯一封面：39。
- 图片档案：85 条；文章—封面映射：39 条；官方 AI 生态资源：9 条；缺失图标：0。
- 外部连通性抽查中 5 个官方站点直接返回 200；GitHub、火山引擎、Hugging Face、Docker 在当前网络环境的 HEAD 请求超时，不影响本地页面与链接配置。

## Residual P3 notes

- 部分真实文章标题较长，卡片会按既定行数截断；完整标题仍保留在文章页与可访问名称中。
- 归档卡牌采用横向轨道以避免十张卡重叠后不可读；这是相对参考稿的有意交互升级。

## 2026-06-21 follow-up verification

- 目录入口已从左右分栏改为单一玻璃工作台；5 个目录、最近文章和 hover 封面预览处于同一视觉容器。
- 目录分类页改为横向目录轨道＋双栏文章卡，9 张 agent 封面自然宽度均为 1600，破图数为 0。
- 分页点击从 `/archives/page/2/` 实测跳转至 `/archives/`，不再被主题事件吞掉。
- 相册新增“科技切片”，桌面端 4 列原生 Masonry 共 12 张，移动端退化为 1 列；全部图片加载成功。
- 首页 Variable Proximity 标题包含 7 个独立字符节点，桌面指针响应启用，触屏与 reduced-motion 自动降级。
- 赞赏区与中控台均指向新的微信、支付宝收款图；关于页 GitHub 与邮箱链接实测存在。
- 同视口 1280×720 对照了 Matcha Cartel 参考与首页实现，保留其工业编号、微型坐标和大留白语言，同时维持博客原有灰阶玻璃基调。

No P0, P1, or P2 visual or functional issues remain.

final result: passed
