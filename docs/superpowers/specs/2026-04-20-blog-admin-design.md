# 博客管理后台设计文档

## 概述

轻量级博客管理后台，替代 Decap CMS，支持在线创建、编辑、删除文章，管理分类和标签，图片上传到阿里云 OSS。

## 技术栈

| 技术 | 用途 |
|------|------|
| Vue 3 | 前端框架 |
| Vite | 构建工具 |
| Vue Router | 路由管理 |
| Pinia | 状态管理 |
| Element Plus | UI 组件库 |
| v-md-editor | Markdown 编辑器 |
| axios | HTTP 请求 |
| @vueuse/core | 工具函数 |
| highlight.js | 代码高亮 |
| ali-oss | 阿里云 OSS SDK |

## 架构设计

```
┌─────────────────────────────────────────────────────────┐
│                    博客管理后台                           │
│               Vue 3 + Element Plus                       │
├─────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────┐ │
│  │ 文章管理 │  │ 分类管理 │  │ 标签管理 │  │ 系统设置    │ │
│  └─────────┘  └─────────┘  └─────────┘  └─────────────┘ │
├─────────────────────────────────────────────────────────┤
│                      服务层                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │ GitHub API  │  │  阿里云 OSS  │  │ LocalStorage    │  │
│  │ (文章/配置)  │  │  (图片存储)  │  │ (Token/密钥)    │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## 存储设计

| 数据 | 存储位置 | 说明 |
|------|----------|------|
| GitHub Token | localStorage | 敏感信息，不上传 |
| OSS AccessKey/Secret | localStorage | 敏感信息，不上传 |
| OSS Bucket/Region | localStorage | 配置信息 |
| 分类配置 | `admin/config.json` | 版本控制 |
| 标签配置 | `admin/config.json` | 版本控制 |
| 文章内容 | `source/_posts/*.md` | 版本控制 |

## 目录结构

```
wwrtpfa.github.io/              # 博客仓库根目录
├── admin-app/                  # 后台项目
│   ├── src/
│   │   ├── views/              # 页面组件
│   │   │   ├── Login.vue       # 登录页
│   │   │   ├── Dashboard.vue   # 首页仪表盘
│   │   │   ├── PostList.vue    # 文章列表
│   │   │   ├── PostEdit.vue    # 文章编辑
│   │   │   ├── Category.vue    # 分类管理
│   │   │   ├── Tag.vue         # 标签管理
│   │   │   └── Settings.vue    # 系统设置
│   │   ├── components/         # 公共组件
│   │   │   ├── MdEditor.vue    # Markdown 编辑器
│   │   │   ├── PostCard.vue    # 文章卡片
│   │   │   └── ConfirmDialog.vue
│   │   ├── services/           # 服务模块
│   │   │   ├── github.js       # GitHub API
│   │   │   ├── oss.js          # 阿里云 OSS
│   │   │   └── storage.js      # 本地存储
│   │   ├── stores/             # Pinia 状态
│   │   │   ├── user.js         # 用户状态
│   │   │   ├── post.js         # 文章状态
│   │   │   └── config.js       # 配置状态
│   │   ├── router/             # 路由配置
│   │   │   └── index.js
│   │   ├── utils/              # 工具函数
│   │   │   └── index.js
│   │   ├── App.vue
│   │   └── main.js
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── vercel.json
├── admin/                      # 配置目录
│   └── config.json             # 分类/标签配置
├── source/                     # Hexo 博客目录
│   └── _posts/                 # 文章目录
└── ...
```

## 页面设计

### 登录页

- GitHub Token 输入框
- OSS 配置表单（Region、Bucket、AccessKey、Secret）
- 登录按钮
- 配置保存到 localStorage

### 首页仪表盘

- 文章总数统计
- 分类数量统计
- 标签数量统计
- 最近文章列表（5篇）

### 文章管理

**文章列表页：**
- 文章卡片列表（标题、分类、标签、日期）
- 搜索框（按标题搜索）
- 分类筛选下拉框
- 标签筛选下拉框
- 新建文章按钮
- 编辑/删除操作

**文章编辑页：**
- 标题输入框
- 分类选择器
- 标签选择器（多选）
- 发布日期选择器
- Markdown 编辑器（左侧编辑 + 右侧预览）
- 保存按钮
- 返回按钮

### 分类管理

- 分类列表（名称 + 文章数量）
- 新增分类按钮
- 编辑/删除操作
- 删除时检查是否有关联文章

### 标签管理

- 标签列表（名称 + 文章数量）
- 新增标签按钮
- 编辑/删除操作
- 删除时检查是否有关联文章

### 系统设置

- GitHub Token 显示/修改
- OSS 配置显示/修改
- 保存配置按钮

## 数据结构

### config.json

```json
{
  "categories": ["后端", "前端", "运维", "其他"],
  "tags": ["Java", "Vue", "Docker", "MySQL", "Redis", "Spring"]
}
```

### 文章 Front Matter

```yaml
---
title: 文章标题
date: 2026-04-20 10:00:00
updated: 2026-04-20 12:00:00
categories:
  - 后端
tags:
  - Java
  - Spring
cover: https://oss.xxx.com/blog-images/cover.jpg
description: 文章摘要
---
```

### 文章文件路径

```
source/_posts/
├── 后端/
│   ├── JavaBase.md
│   └── Springboot-cloud.md
├── 前端/
│   └── Vue入门.md
└── 其他文章.md        # 无分类文章放根目录
```

## API 设计

### GitHub Service

```javascript
class GitHubService {
  // 初始化
  init(token, owner, repo)

  // 文章操作
  getPosts()                    // 获取文章列表
  getPost(path)                 // 获取单篇文章
  createPost(path, content, message)    // 创建文章
  updatePost(path, content, message, sha) // 更新文章
  deletePost(path, message, sha)    // 删除文章

  // 配置操作
  getConfig()                   // 获取 admin/config.json
  saveConfig(config)            // 保存配置

  // 目录操作
  getTree(path)                 // 获取目录结构
  createDirectory(path)         // 创建目录（通过创建 .gitkeep）
}
```

### OSS Service

```javascript
class OSSService {
  // 初始化
  init(region, bucket, accessKeyId, accessKeySecret)

  // 上传图片
  upload(file, folder)          // 上传文件，返回 URL

  // 删除图片
  delete(filename)              // 删除文件
}
```

### Storage Service

```javascript
class StorageService {
  // GitHub Token
  getToken()
  setToken(token)
  clearToken()

  // OSS 配置
  getOSSConfig()
  setOSSConfig(config)
  clearOSSConfig()

  // 仓库配置
  getRepoConfig()
  setRepoConfig(config)
}
```

## 错误处理

| 场景 | 处理方式 |
|------|----------|
| Token 无效 | 提示"Token 无效，请检查" |
| Token 权限不足 | 提示"请勾选 repo 权限" |
| 网络错误 | 提示"网络错误，请重试" |
| 文件冲突 | 提示"文件已被修改，请刷新后重试" |
| OSS 上传失败 | 提示"图片上传失败，请检查 OSS 配置" |
| 删除分类有关联文章 | 提示"该分类下有文章，无法删除" |

## 部署方案

### Vercel 双项目部署

**项目 1：博客前台**
- Root Directory: `/`（根目录）
- 构建命令: `hexo generate`
- 输出目录: `public`
- 域名: `bolg.pengfanao.top`

**项目 2：管理后台**
- Root Directory: `admin-app`
- 构建命令: `npm run build`
- 输出目录: `dist`
- 域名: `admin.pengfanao.top` 或 `bolg.pengfanao.top/admin`

### 部署步骤

1. 将 `admin-app` 目录推送到 GitHub 仓库
2. Vercel 控制台导入项目
3. 设置 Root Directory 为 `admin-app`
4. 自动识别 Vite，配置构建命令
5. 部署完成后访问域名

## 安全考虑

- GitHub Token 和 OSS 密钥存储在浏览器 localStorage
- 仅个人使用，不涉及多用户权限
- Token 需要 `repo` 权限才能读写仓库
- OSS 前端直传，AccessKey 暴露在浏览器（个人使用可接受）

## 后续扩展

可选的后续功能：
- 文章草稿功能
- 文章版本历史
- 批量操作（批量删除、批量移动分类）
- 导出文章为 PDF
- 主题切换（暗黑模式）
