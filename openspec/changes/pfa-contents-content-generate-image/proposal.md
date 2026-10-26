## Why

PFA 的博客、微信和抖音内容需要一套能长期识别的视觉语言，但当前图片生成依赖单次判断，项目特性、icon、模板和来源标识容易漂移。现在建立一个可成长的 `PFA. Contents Content Generate Image` 技能，让内容类型自动选择模板，并让每个项目或知识模块通过确定性 icon、结构和 `pfa` 来源标识被快速识别。

## What Changes

- 新增 `pfa-contents-content-generate-image` 技能，覆盖封面、知识卡片、架构图、项目榜单和博客插图。
- 提供内容分析与模板选择规则，初始支持高对比大字报、杂志编辑部、数据终端、轻贴纸卡片四套模板。
- 提供项目/知识主题的确定性 icon 词典与安全回退 icon，避免长文字承担全部识别工作。
- 统一生成 SVG 源文件、PNG 预览、manifest 和校验报告，并在画面中保留小写 `pfa` 来源标识。
- 用本周 GitHub 趋势作为第一次真实验证，检查自动模板选择、icon 映射、中文文字、安全边距和可读性。

## Capabilities

### New Capabilities

- `content-image-generation`: 根据内容语义选择模板、映射 icon、生成可嵌入博客/微信/抖音的图片资产并输出验证清单。

### Modified Capabilities

无。

## Impact

- 新增技能目录及其 renderer、icon 资产、模板参考和验证脚本。
- 新增 `.cache/` 下的样稿与验证产物；不修改已有博客正文、周报数据或发布链路。
- 复用现有 Python、SVG、`rsvg-convert` 和图片检查工具；不新增运行时依赖。
