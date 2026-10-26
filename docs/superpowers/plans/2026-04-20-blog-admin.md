# 博客管理后台实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建轻量级博客管理后台，支持在线创建、编辑、删除文章，管理分类和标签，图片上传到阿里云 OSS。

**Architecture:** 纯前端 Vue 3 应用，通过 GitHub API 操作仓库文件，通过阿里云 OSS SDK 上传图片。配置存储在 localStorage，分类/标签配置存储在仓库的 `admin/config.json`。

**Tech Stack:** Vue 3, Vite, Vue Router, Pinia, Element Plus, v-md-editor, axios, ali-oss

---

## 文件结构

```
admin-app/
├── src/
│   ├── views/                    # 页面组件
│   │   ├── Login.vue
│   │   ├── Dashboard.vue
│   │   ├── PostList.vue
│   │   ├── PostEdit.vue
│   │   ├── Category.vue
│   │   ├── Tag.vue
│   │   └── Settings.vue
│   ├── components/               # 公共组件
│   │   ├── MdEditor.vue
│   │   ├── PostCard.vue
│   │   └── ConfirmDialog.vue
│   ├── services/                 # 服务模块
│   │   ├── github.js
│   │   ├── oss.js
│   │   └── storage.js
│   ├── stores/                   # Pinia 状态
│   │   ├── user.js
│   │   ├── post.js
│   │   └── config.js
│   ├── router/
│   │   └── index.js
│   ├── utils/
│   │   └── index.js
│   ├── styles/
│   │   └── index.css
│   ├── App.vue
│   └── main.js
├── public/
├── index.html
├── package.json
├── vite.config.js
└── vercel.json
```

---

## Task 1: 项目初始化

**Files:**
- Create: `admin-app/package.json`
- Create: `admin-app/vite.config.js`
- Create: `admin-app/index.html`
- Create: `admin-app/vercel.json`

- [ ] **Step 1: 创建 admin-app 目录和 package.json**

```bash
mkdir -p admin-app/src admin-app/public
```

```json
{
  "name": "blog-admin",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "vue": "^3.4.0",
    "vue-router": "^4.3.0",
    "pinia": "^2.1.0",
    "element-plus": "^2.6.0",
    "@vueuse/core": "^10.9.0",
    "axios": "^1.6.0",
    "ali-oss": "^6.20.0",
    "@kangc/v-md-editor": "^2.3.0",
    "@kangc/v-md-editor/lib/theme/vuepress.js": "^2.3.0",
    "@kangc/v-md-editor/lib/theme/github.css": "^2.3.0",
    "highlight.js": "^11.9.0",
    "gray-matter": "^4.0.3"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.0",
    "vite": "^5.2.0",
    "unplugin-vue-components": "^0.26.0",
    "unplugin-auto-import": "^0.17.0"
  }
}
```

- [ ] **Step 2: 创建 vite.config.js**

```javascript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
```

- [ ] **Step 3: 创建 index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>博客管理后台</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

- [ ] **Step 4: 创建 vercel.json**

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

- [ ] **Step 5: 安装依赖**

```bash
cd admin-app && npm install
```

- [ ] **Step 6: Commit**

```bash
git add admin-app/package.json admin-app/vite.config.js admin-app/index.html admin-app/vercel.json
git commit -m "feat: 初始化博客管理后台项目"
```

---

## Task 2: 基础文件和样式

**Files:**
- Create: `admin-app/src/main.js`
- Create: `admin-app/src/App.vue`
- Create: `admin-app/src/styles/index.css`

- [ ] **Step 1: 创建 main.js**

```javascript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import VueMarkdownEditor from '@kangc/v-md-editor'
import '@kangc/v-md-editor/lib/style/base-editor.css'
import vuepressTheme from '@kangc/v-md-editor/lib/theme/vuepress.js'
import '@kangc/v-md-editor/lib/theme/style/vuepress.css'
import hljs from 'highlight.js'

import App from './App.vue'
import router from './router'
import './styles/index.css'

VueMarkdownEditor.use(vuepressTheme, {
  highlight: {
    lineNumbers: true,
    hljs,
  },
})

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(ElementPlus)
app.use(VueMarkdownEditor)
app.mount('#app')
```

- [ ] **Step 2: 创建 App.vue**

```vue
<template>
  <el-config-provider :locale="zhCn">
    <router-view />
  </el-config-provider>
</template>

<script setup>
import zhCn from 'element-plus/es/locale/lang/zh-cn'
</script>

<style>
html, body, #app {
  height: 100%;
  margin: 0;
  padding: 0;
}
</style>
```

- [ ] **Step 3: 创建 styles/index.css**

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

#app {
  height: 100%;
}

/* Markdown 编辑器样式 */
.v-md-editor {
  height: 100%;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-thumb {
  background-color: #dcdfe6;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background-color: #c0c4cc;
}
```

- [ ] **Step 4: Commit**

```bash
git add admin-app/src/
git commit -m "feat: 创建基础文件和样式"
```

---

## Task 3: 工具函数

**Files:**
- Create: `admin-app/src/utils/index.js`

- [ ] **Step 1: 创建工具函数**

```javascript
/**
 * 解析 Markdown Front Matter
 */
export function parseFrontMatter(content) {
  const matter = require('gray-matter')
  const parsed = matter(content)
  return {
    frontMatter: parsed.data,
    content: parsed.content,
    raw: content
  }
}

/**
 * 将对象转换为 Front Matter 字符串
 */
export function stringifyFrontMatter(frontMatter, content) {
  const matter = require('gray-matter')
  return matter.stringify(content, frontMatter)
}

/**
 * 生成文章 slug
 */
export function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * 格式化日期
 */
export function formatDate(date) {
  if (!date) return ''
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

/**
 * 生成长度唯一的文件名
 */
export function generateFilename() {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `${timestamp}-${random}`
}

/**
 * 防抖函数
 */
export function debounce(fn, delay = 300) {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add admin-app/src/utils/index.js
git commit -m "feat: 添加工具函数"
```

---

## Task 4: 存储服务

**Files:**
- Create: `admin-app/src/services/storage.js`

- [ ] **Step 1: 创建存储服务**

```javascript
const STORAGE_KEYS = {
  TOKEN: 'blog_admin_token',
  OSS_CONFIG: 'blog_admin_oss_config',
  REPO_CONFIG: 'blog_admin_repo_config',
}

class StorageService {
  // GitHub Token
  getToken() {
    return localStorage.getItem(STORAGE_KEYS.TOKEN)
  }

  setToken(token) {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token)
  }

  clearToken() {
    localStorage.removeItem(STORAGE_KEYS.TOKEN)
  }

  // OSS 配置
  getOSSConfig() {
    const config = localStorage.getItem(STORAGE_KEYS.OSS_CONFIG)
    return config ? JSON.parse(config) : null
  }

  setOSSConfig(config) {
    localStorage.setItem(STORAGE_KEYS.OSS_CONFIG, JSON.stringify(config))
  }

  clearOSSConfig() {
    localStorage.removeItem(STORAGE_KEYS.OSS_CONFIG)
  }

  // 仓库配置
  getRepoConfig() {
    const config = localStorage.getItem(STORAGE_KEYS.REPO_CONFIG)
    return config ? JSON.parse(config) : null
  }

  setRepoConfig(config) {
    localStorage.setItem(STORAGE_KEYS.REPO_CONFIG, JSON.stringify(config))
  }

  clearRepoConfig() {
    localStorage.removeItem(STORAGE_KEYS.REPO_CONFIG)
  }

  // 清除所有配置
  clearAll() {
    this.clearToken()
    this.clearOSSConfig()
    this.clearRepoConfig()
  }

  // 检查是否已配置
  isConfigured() {
    return !!(this.getToken() && this.getOSSConfig() && this.getRepoConfig())
  }
}

export default new StorageService()
```

- [ ] **Step 2: Commit**

```bash
git add admin-app/src/services/storage.js
git commit -m "feat: 添加存储服务"
```

---

## Task 5: GitHub 服务

**Files:**
- Create: `admin-app/src/services/github.js`

- [ ] **Step 1: 创建 GitHub 服务**

```javascript
import axios from 'axios'
import storage from './storage'

const GITHUB_API = 'https://api.github.com'

class GitHubService {
  constructor() {
    this.token = null
    this.owner = null
    this.repo = null
  }

  init(token, owner, repo) {
    this.token = token
    this.owner = owner
    this.repo = repo
  }

  getHeaders() {
    return {
      Authorization: `token ${this.token}`,
      Accept: 'application/vnd.github.v3+json',
    }
  }

  // 获取文件内容
  async getFile(path) {
    const url = `${GITHUB_API}/repos/${this.owner}/${this.repo}/contents/${path}`
    const response = await axios.get(url, {
      headers: this.getHeaders(),
    })
    return {
      content: atob(response.data.content),
      sha: response.data.sha,
    }
  }

  // 创建或更新文件
  async saveFile(path, content, message, sha = null) {
    const url = `${GITHUB_API}/repos/${this.owner}/${this.repo}/contents/${path}`
    const data = {
      message,
      content: btoa(unescape(encodeURIComponent(content))),
    }
    if (sha) {
      data.sha = sha
    }
    const response = await axios.put(url, data, {
      headers: this.getHeaders(),
    })
    return response.data
  }

  // 删除文件
  async deleteFile(path, message, sha) {
    const url = `${GITHUB_API}/repos/${this.owner}/${this.repo}/contents/${path}`
    await axios.delete(url, {
      headers: this.getHeaders(),
      data: { message, sha },
    })
  }

  // 获取目录内容
  async getDirectory(path) {
    const url = `${GITHUB_API}/repos/${this.owner}/${this.repo}/contents/${path}`
    const response = await axios.get(url, {
      headers: this.getHeaders(),
    })
    return response.data
  }

  // 获取文章列表
  async getPosts() {
    const posts = []
    const postsPath = 'source/_posts'
    
    try {
      const items = await this.getDirectory(postsPath)
      
      for (const item of items) {
        if (item.type === 'file' && item.name.endsWith('.md')) {
          const file = await this.getFile(item.path)
          posts.push({
            name: item.name,
            path: item.path,
            sha: file.sha,
            ...this.parsePost(file.content),
          })
        } else if (item.type === 'dir') {
          // 处理分类目录
          const subItems = await this.getDirectory(item.path)
          for (const subItem of subItems) {
            if (subItem.type === 'file' && subItem.name.endsWith('.md')) {
              const file = await this.getFile(subItem.path)
              posts.push({
                name: subItem.name,
                path: subItem.path,
                sha: file.sha,
                ...this.parsePost(file.content),
              })
            }
          }
        }
      }
    } catch (error) {
      console.error('获取文章列表失败:', error)
    }
    
    return posts
  }

  // 解析文章
  parsePost(content) {
    const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
    let frontMatter = {}
    let body = content
    
    if (frontMatterMatch) {
      const frontMatterStr = frontMatterMatch[1]
      body = content.slice(frontMatterMatch[0].length).trim()
      
      // 解析 YAML Front Matter
      const lines = frontMatterStr.split('\n')
      for (const line of lines) {
        const match = line.match(/^(\w+):\s*(.*)$/)
        if (match) {
          const key = match[1]
          let value = match[2]
          
          // 处理数组
          if (value === '') {
            value = []
            const arrayStart = lines.indexOf(line) + 1
            for (let i = arrayStart; i < lines.length; i++) {
              const arrayMatch = lines[i].match(/^\s+-\s+(.+)$/)
              if (arrayMatch) {
                value.push(arrayMatch[1])
              } else {
                break
              }
            }
          }
          
          frontMatter[key] = value
        }
      }
    }
    
    return { frontMatter, body, raw: content }
  }

  // 获取配置
  async getConfig() {
    try {
      const file = await this.getFile('admin/config.json')
      return JSON.parse(file.content)
    } catch (error) {
      // 配置文件不存在，返回默认配置
      return {
        categories: ['后端', '前端', '运维', '其他'],
        tags: [],
      }
    }
  }

  // 保存配置
  async saveConfig(config) {
    let sha = null
    try {
      const file = await this.getFile('admin/config.json')
      sha = file.sha
    } catch (error) {
      // 文件不存在
    }
    
    await this.saveFile(
      'admin/config.json',
      JSON.stringify(config, null, 2),
      '更新配置',
      sha
    )
  }

  // 验证 Token
  async validateToken() {
    try {
      const url = `${GITHUB_API}/user`
      await axios.get(url, { headers: this.getHeaders() })
      return true
    } catch (error) {
      return false
    }
  }
}

export default new GitHubService()
```

- [ ] **Step 2: Commit**

```bash
git add admin-app/src/services/github.js
git commit -m "feat: 添加 GitHub 服务"
```

---

## Task 6: OSS 服务

**Files:**
- Create: `admin-app/src/services/oss.js`

- [ ] **Step 1: 创建 OSS 服务**

```javascript
import OSS from 'ali-oss'
import { generateFilename } from '@/utils'

class OSSService {
  constructor() {
    this.client = null
  }

  init(region, bucket, accessKeyId, accessKeySecret, folder = 'blog-images') {
    this.client = new OSS({
      region,
      bucket,
      accessKeyId,
      accessKeySecret,
      secure: true,
    })
    this.folder = folder
  }

  // 上传文件
  async upload(file) {
    if (!this.client) {
      throw new Error('OSS 未初始化')
    }

    const ext = file.name.split('.').pop()
    const filename = `${this.folder}/${generateFilename()}.${ext}`

    const result = await this.client.put(filename, file)
    return result.url
  }

  // 删除文件
  async delete(url) {
    if (!this.client) {
      throw new Error('OSS 未初始化')
    }

    // 从 URL 中提取文件名
    const urlObj = new URL(url)
    const filename = urlObj.pathname.slice(1)
    
    await this.client.delete(filename)
  }
}

export default new OSSService()
```

- [ ] **Step 2: Commit**

```bash
git add admin-app/src/services/oss.js
git commit -m "feat: 添加 OSS 服务"
```

---

## Task 7: Pinia Stores

**Files:**
- Create: `admin-app/src/stores/user.js`
- Create: `admin-app/src/stores/post.js`
- Create: `admin-app/src/stores/config.js`

- [ ] **Step 1: 创建 user store**

```javascript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import storage from '@/services/storage'
import github from '@/services/github'
import oss from '@/services/oss'

export const useUserStore = defineStore('user', () => {
  const token = ref(storage.getToken())
  const ossConfig = ref(storage.getOSSConfig())
  const repoConfig = ref(storage.getRepoConfig())

  const isLoggedIn = computed(() => !!token.value && !!ossConfig.value && !!repoConfig.value)

  function setToken(t) {
    token.value = t
    storage.setToken(t)
  }

  function setOSSConfig(config) {
    ossConfig.value = config
    storage.setOSSConfig(config)
    oss.init(config.region, config.bucket, config.accessKeyId, config.accessKeySecret, config.folder)
  }

  function setRepoConfig(config) {
    repoConfig.value = config
    storage.setRepoConfig(config)
    github.init(token.value, config.owner, config.repo)
  }

  function initServices() {
    if (token.value && repoConfig.value) {
      github.init(token.value, repoConfig.value.owner, repoConfig.value.repo)
    }
    if (ossConfig.value) {
      oss.init(
        ossConfig.value.region,
        ossConfig.value.bucket,
        ossConfig.value.accessKeyId,
        ossConfig.value.accessKeySecret,
        ossConfig.value.folder
      )
    }
  }

  function logout() {
    token.value = null
    ossConfig.value = null
    repoConfig.value = null
    storage.clearAll()
  }

  return {
    token,
    ossConfig,
    repoConfig,
    isLoggedIn,
    setToken,
    setOSSConfig,
    setRepoConfig,
    initServices,
    logout,
  }
})
```

- [ ] **Step 2: 创建 post store**

```javascript
import { defineStore } from 'pinia'
import { ref } from 'vue'
import github from '@/services/github'

export const usePostStore = defineStore('post', () => {
  const posts = ref([])
  const currentPost = ref(null)
  const loading = ref(false)

  async function fetchPosts() {
    loading.value = true
    try {
      posts.value = await github.getPosts()
    } finally {
      loading.value = false
    }
  }

  function setCurrentPost(post) {
    currentPost.value = post
  }

  function clearCurrentPost() {
    currentPost.value = null
  }

  return {
    posts,
    currentPost,
    loading,
    fetchPosts,
    setCurrentPost,
    clearCurrentPost,
  }
})
```

- [ ] **Step 3: 创建 config store**

```javascript
import { defineStore } from 'pinia'
import { ref } from 'vue'
import github from '@/services/github'

export const useConfigStore = defineStore('config', () => {
  const categories = ref([])
  const tags = ref([])
  const loading = ref(false)

  async function fetchConfig() {
    loading.value = true
    try {
      const config = await github.getConfig()
      categories.value = config.categories || []
      tags.value = config.tags || []
    } finally {
      loading.value = false
    }
  }

  async function saveConfig() {
    await github.saveConfig({
      categories: categories.value,
      tags: tags.value,
    })
  }

  function addCategory(name) {
    if (!categories.value.includes(name)) {
      categories.value.push(name)
    }
  }

  function removeCategory(name) {
    const index = categories.value.indexOf(name)
    if (index > -1) {
      categories.value.splice(index, 1)
    }
  }

  function addTag(name) {
    if (!tags.value.includes(name)) {
      tags.value.push(name)
    }
  }

  function removeTag(name) {
    const index = tags.value.indexOf(name)
    if (index > -1) {
      tags.value.splice(index, 1)
    }
  }

  return {
    categories,
    tags,
    loading,
    fetchConfig,
    saveConfig,
    addCategory,
    removeCategory,
    addTag,
    removeTag,
  }
})
```

- [ ] **Step 4: Commit**

```bash
git add admin-app/src/stores/
git commit -m "feat: 添加 Pinia stores"
```

---

## Task 8: 路由配置

**Files:**
- Create: `admin-app/src/router/index.js`

- [ ] **Step 1: 创建路由配置**

```javascript
import { createRouter, createWebHistory } from 'vue-router'
import storage from '@/services/storage'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/',
    component: () => import('@/views/Layout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
      },
      {
        path: 'posts',
        name: 'PostList',
        component: () => import('@/views/PostList.vue'),
      },
      {
        path: 'posts/new',
        name: 'PostNew',
        component: () => import('@/views/PostEdit.vue'),
      },
      {
        path: 'posts/edit/:path',
        name: 'PostEdit',
        component: () => import('@/views/PostEdit.vue'),
      },
      {
        path: 'categories',
        name: 'Category',
        component: () => import('@/views/Category.vue'),
      },
      {
        path: 'tags',
        name: 'Tag',
        component: () => import('@/views/Tag.vue'),
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/Settings.vue'),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const isConfigured = storage.isConfigured()
  
  if (to.meta.requiresAuth !== false && !isConfigured) {
    next('/login')
  } else if (to.path === '/login' && isConfigured) {
    next('/')
  } else {
    next()
  }
})

export default router
```

- [ ] **Step 2: Commit**

```bash
git add admin-app/src/router/index.js
git commit -m "feat: 添加路由配置"
```

---

## Task 9: Layout 组件

**Files:**
- Create: `admin-app/src/views/Layout.vue`

- [ ] **Step 1: 创建 Layout 组件**

```vue
<template>
  <el-container class="layout-container">
    <el-aside width="200px">
      <div class="logo">
        <h2>博客管理</h2>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
      >
        <el-menu-item index="/">
          <el-icon><Odometer /></el-icon>
          <span>仪表盘</span>
        </el-menu-item>
        <el-menu-item index="/posts">
          <el-icon><Document /></el-icon>
          <span>文章管理</span>
        </el-menu-item>
        <el-menu-item index="/categories">
          <el-icon><Folder /></el-icon>
          <span>分类管理</span>
        </el-menu-item>
        <el-menu-item index="/tags">
          <el-icon><PriceTag /></el-icon>
          <span>标签管理</span>
        </el-menu-item>
        <el-menu-item index="/settings">
          <el-icon><Setting /></el-icon>
          <span>系统设置</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-main>
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Odometer, Document, Folder, PriceTag, Setting } from '@element-plus/icons-vue'

const route = useRoute()
const activeMenu = computed(() => route.path)
</script>

<style scoped>
.layout-container {
  height: 100%;
}

.el-aside {
  background-color: #304156;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.logo h2 {
  font-size: 18px;
  font-weight: 600;
}

.el-menu {
  border-right: none;
}

.el-main {
  background-color: #f0f2f5;
  padding: 20px;
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add admin-app/src/views/Layout.vue
git commit -m "feat: 添加 Layout 组件"
```

---

## Task 10: 登录页

**Files:**
- Create: `admin-app/src/views/Login.vue`

- [ ] **Step 1: 创建登录页**

```vue
<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <h2>博客管理后台</h2>
      </template>
      
      <el-form :model="form" label-width="100px" @submit.prevent="handleLogin">
        <el-divider content-position="left">GitHub 配置</el-divider>
        
        <el-form-item label="Token" required>
          <el-input
            v-model="form.token"
            type="password"
            placeholder="GitHub Personal Access Token"
            show-password
          />
        </el-form-item>
        
        <el-form-item label="Owner" required>
          <el-input v-model="form.owner" placeholder="仓库所有者" />
        </el-form-item>
        
        <el-form-item label="Repo" required>
          <el-input v-model="form.repo" placeholder="仓库名称" />
        </el-form-item>
        
        <el-divider content-position="left">OSS 配置</el-divider>
        
        <el-form-item label="Region" required>
          <el-input v-model="form.ossRegion" placeholder="如: oss-cn-hangzhou" />
        </el-form-item>
        
        <el-form-item label="Bucket" required>
          <el-input v-model="form.ossBucket" placeholder="存储桶名称" />
        </el-form-item>
        
        <el-form-item label="AccessKey ID" required>
          <el-input v-model="form.accessKeyId" placeholder="AccessKey ID" />
        </el-form-item>
        
        <el-form-item label="AccessKey Secret" required>
          <el-input
            v-model="form.accessKeySecret"
            type="password"
            placeholder="AccessKey Secret"
            show-password
          />
        </el-form-item>
        
        <el-form-item label="图片目录">
          <el-input v-model="form.folder" placeholder="如: blog-images" />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" native-type="submit" :loading="loading" style="width: 100%">
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import github from '@/services/github'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)

const form = ref({
  token: '',
  owner: '',
  repo: '',
  ossRegion: '',
  ossBucket: '',
  accessKeyId: '',
  accessKeySecret: '',
  folder: 'blog-images',
})

onMounted(() => {
  if (userStore.token) {
    form.value.token = userStore.token
  }
  if (userStore.repoConfig) {
    form.value.owner = userStore.repoConfig.owner || ''
    form.value.repo = userStore.repoConfig.repo || ''
  }
  if (userStore.ossConfig) {
    form.value.ossRegion = userStore.ossConfig.region || ''
    form.value.ossBucket = userStore.ossConfig.bucket || ''
    form.value.accessKeyId = userStore.ossConfig.accessKeyId || ''
    form.value.folder = userStore.ossConfig.folder || 'blog-images'
  }
})

async function handleLogin() {
  if (!form.value.token || !form.value.owner || !form.value.repo) {
    ElMessage.warning('请填写 GitHub 配置')
    return
  }
  
  if (!form.value.ossRegion || !form.value.ossBucket || !form.value.accessKeyId || !form.value.accessKeySecret) {
    ElMessage.warning('请填写 OSS 配置')
    return
  }
  
  loading.value = true
  
  try {
    // 验证 Token
    github.init(form.value.token, form.value.owner, form.value.repo)
    const isValid = await github.validateToken()
    
    if (!isValid) {
      ElMessage.error('Token 无效或权限不足，请检查')
      return
    }
    
    // 保存配置
    userStore.setToken(form.value.token)
    userStore.setRepoConfig({
      owner: form.value.owner,
      repo: form.value.repo,
    })
    userStore.setOSSConfig({
      region: form.value.ossRegion,
      bucket: form.value.ossBucket,
      accessKeyId: form.value.accessKeyId,
      accessKeySecret: form.value.accessKeySecret,
      folder: form.value.folder || 'blog-images',
    })
    
    ElMessage.success('登录成功')
    router.push('/')
  } catch (error) {
    ElMessage.error('登录失败: ' + error.message)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 500px;
}

.login-card h2 {
  text-align: center;
  margin: 0;
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add admin-app/src/views/Login.vue
git commit -m "feat: 添加登录页"
```

---

## Task 11: 仪表盘页面

**Files:**
- Create: `admin-app/src/views/Dashboard.vue`

- [ ] **Step 1: 创建仪表盘页面**

```vue
<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card shadow="hover">
          <div class="stat-card">
            <el-icon :size="40" color="#409EFF"><Document /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ postStore.posts.length }}</div>
              <div class="stat-label">文章总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <div class="stat-card">
            <el-icon :size="40" color="#67C23A"><Folder /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ configStore.categories.length }}</div>
              <div class="stat-label">分类数量</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <div class="stat-card">
            <el-icon :size="40" color="#E6A23C"><PriceTag /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ configStore.tags.length }}</div>
              <div class="stat-label">标签数量</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-card style="margin-top: 20px">
      <template #header>
        <span>最近文章</span>
      </template>
      <el-table :data="recentPosts" style="width: 100%">
        <el-table-column prop="frontMatter.title" label="标题" />
        <el-table-column prop="frontMatter.categories" label="分类" width="120">
          <template #default="{ row }">
            {{ (row.frontMatter.categories || []).join(', ') || '无' }}
          </template>
        </el-table-column>
        <el-table-column prop="frontMatter.date" label="发布日期" width="180" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { Document, Folder, PriceTag } from '@element-plus/icons-vue'
import { usePostStore } from '@/stores/post'
import { useConfigStore } from '@/stores/config'

const postStore = usePostStore()
const configStore = useConfigStore()

const recentPosts = computed(() => {
  return [...postStore.posts]
    .sort((a, b) => {
      const dateA = new Date(a.frontMatter?.date || 0)
      const dateB = new Date(b.frontMatter?.date || 0)
      return dateB - dateA
    })
    .slice(0, 5)
})

onMounted(async () => {
  await Promise.all([
    postStore.fetchPosts(),
    configStore.fetchConfig(),
  ])
})
</script>

<style scoped>
.stat-card {
  display: flex;
  align-items: center;
  gap: 20px;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add admin-app/src/views/Dashboard.vue
git commit -m "feat: 添加仪表盘页面"
```

---

## Task 12: 文章列表页面

**Files:**
- Create: `admin-app/src/views/PostList.vue`

- [ ] **Step 1: 创建文章列表页面**

```vue
<template>
  <div class="post-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>文章列表</span>
          <el-button type="primary" @click="$router.push('/posts/new')">
            新建文章
          </el-button>
        </div>
      </template>
      
      <!-- 筛选栏 -->
      <div class="filter-bar">
        <el-input
          v-model="searchText"
          placeholder="搜索文章标题"
          style="width: 300px"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        
        <el-select v-model="filterCategory" placeholder="分类筛选" clearable style="width: 150px">
          <el-option
            v-for="cat in configStore.categories"
            :key="cat"
            :label="cat"
            :value="cat"
          />
        </el-select>
        
        <el-select v-model="filterTag" placeholder="标签筛选" clearable style="width: 150px">
          <el-option
            v-for="tag in configStore.tags"
            :key="tag"
            :label="tag"
            :value="tag"
          />
        </el-select>
      </div>
      
      <!-- 文章表格 -->
      <el-table :data="filteredPosts" style="width: 100%" v-loading="postStore.loading">
        <el-table-column prop="frontMatter.title" label="标题" min-width="200" />
        <el-table-column label="分类" width="120">
          <template #default="{ row }">
            <el-tag v-for="cat in (row.frontMatter.categories || [])" :key="cat" size="small" style="margin-right: 4px">
              {{ cat }}
            </el-tag>
            <span v-if="!row.frontMatter?.categories?.length">无</span>
          </template>
        </el-table-column>
        <el-table-column label="标签" width="200">
          <template #default="{ row }">
            <el-tag
              v-for="tag in (row.frontMatter.tags || []).slice(0, 3)"
              :key="tag"
              type="info"
              size="small"
              style="margin-right: 4px"
            >
              {{ tag }}
            </el-tag>
            <span v-if="(row.frontMatter.tags || []).length > 3">
              +{{ row.frontMatter.tags.length - 3 }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="frontMatter.date" label="发布日期" width="180" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="editPost(row)">编辑</el-button>
            <el-button type="danger" link @click="deletePost(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { usePostStore } from '@/stores/post'
import { useConfigStore } from '@/stores/config'
import github from '@/services/github'

const router = useRouter()
const postStore = usePostStore()
const configStore = useConfigStore()

const searchText = ref('')
const filterCategory = ref('')
const filterTag = ref('')

const filteredPosts = computed(() => {
  let posts = postStore.posts
  
  if (searchText.value) {
    posts = posts.filter(p => 
      p.frontMatter?.title?.toLowerCase().includes(searchText.value.toLowerCase())
    )
  }
  
  if (filterCategory.value) {
    posts = posts.filter(p => 
      p.frontMatter?.categories?.includes(filterCategory.value)
    )
  }
  
  if (filterTag.value) {
    posts = posts.filter(p => 
      p.frontMatter?.tags?.includes(filterTag.value)
    )
  }
  
  return posts
})

function editPost(post) {
  postStore.setCurrentPost(post)
  router.push(`/posts/edit/${encodeURIComponent(post.path)}`)
}

async function deletePost(post) {
  try {
    await ElMessageBox.confirm(
      `确定要删除文章「${post.frontMatter?.title || post.name}」吗？`,
      '删除确认',
      { type: 'warning' }
    )
    
    await github.deleteFile(post.path, `删除文章: ${post.frontMatter?.title || post.name}`, post.sha)
    ElMessage.success('删除成功')
    await postStore.fetchPosts()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败: ' + error.message)
    }
  }
}

onMounted(async () => {
  await Promise.all([
    postStore.fetchPosts(),
    configStore.fetchConfig(),
  ])
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add admin-app/src/views/PostList.vue
git commit -m "feat: 添加文章列表页面"
```

---

## Task 13: 文章编辑页面

**Files:**
- Create: `admin-app/src/views/PostEdit.vue`

- [ ] **Step 1: 创建文章编辑页面**

```vue
<template>
  <div class="post-edit">
    <el-card>
      <template #header>
        <div class="card-header">
          <el-button @click="$router.back()">返回</el-button>
          <span>{{ isNew ? '新建文章' : '编辑文章' }}</span>
          <el-button type="primary" @click="savePost" :loading="saving">保存</el-button>
        </div>
      </template>
      
      <el-form :model="form" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="标题" required>
              <el-input v-model="form.title" placeholder="文章标题" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="发布日期">
              <el-date-picker
                v-model="form.date"
                type="datetime"
                placeholder="选择日期时间"
                format="YYYY-MM-DD HH:mm:ss"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="分类">
              <el-select v-model="form.categories" multiple placeholder="选择分类" style="width: 100%">
                <el-option
                  v-for="cat in configStore.categories"
                  :key="cat"
                  :label="cat"
                  :value="cat"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="标签">
              <el-select v-model="form.tags" multiple placeholder="选择标签" style="width: 100%">
                <el-option
                  v-for="tag in configStore.tags"
                  :key="tag"
                  :label="tag"
                  :value="tag"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="封面图片">
              <el-upload
                :show-file-list="false"
                :before-upload="uploadCover"
              >
                <el-input v-model="form.cover" placeholder="点击上传或输入URL" />
              </el-upload>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="摘要">
          <el-input v-model="form.description" type="textarea" :rows="2" placeholder="文章摘要" />
        </el-form-item>
      </el-form>
      
      <!-- Markdown 编辑器 -->
      <div class="editor-container">
        <v-md-editor
          v-model="form.content"
          height="500px"
          :disabled-menus="[]"
          @upload-image="handleUploadImage"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { usePostStore } from '@/stores/post'
import { useConfigStore } from '@/stores/config'
import { useUserStore } from '@/stores/user'
import github from '@/services/github'
import oss from '@/services/oss'
import { formatDate } from '@/utils'

const route = useRoute()
const router = useRouter()
const postStore = usePostStore()
const configStore = useConfigStore()
const userStore = useUserStore()

const isNew = computed(() => !route.params.path)
const saving = ref(false)

const form = ref({
  title: '',
  date: formatDate(new Date()),
  categories: [],
  tags: [],
  cover: '',
  description: '',
  content: '',
})

const postPath = ref('')
const postSha = ref('')

onMounted(async () => {
  await configStore.fetchConfig()
  
  if (!isNew.value) {
    // 编辑模式，加载文章内容
    postPath.value = decodeURIComponent(route.params.path)
    
    try {
      const file = await github.getFile(postPath.value)
      const parsed = github.parsePost(file.content)
      
      form.value.title = parsed.frontMatter.title || ''
      form.value.date = parsed.frontMatter.date || formatDate(new Date())
      form.value.categories = parsed.frontMatter.categories || []
      form.value.tags = parsed.frontMatter.tags || []
      form.value.cover = parsed.frontMatter.cover || ''
      form.value.description = parsed.frontMatter.description || ''
      form.value.content = parsed.body || ''
      postSha.value = file.sha
    } catch (error) {
      ElMessage.error('加载文章失败')
      router.back()
    }
  }
})

async function uploadCover(file) {
  try {
    const url = await oss.upload(file)
    form.value.cover = url
    ElMessage.success('封面上传成功')
  } catch (error) {
    ElMessage.error('封面上传失败: ' + error.message)
  }
  return false
}

async function handleUploadImage(event, insertImage, files) {
  const file = files[0]
  
  try {
    const url = await oss.upload(file)
    insertImage({
      url,
      desc: file.name,
    })
    ElMessage.success('图片上传成功')
  } catch (error) {
    ElMessage.error('图片上传失败: ' + error.message)
  }
}

async function savePost() {
  if (!form.value.title) {
    ElMessage.warning('请输入文章标题')
    return
  }
  
  saving.value = true
  
  try {
    // 生成文件内容
    const frontMatter = {
      title: form.value.title,
      date: form.value.date,
      updated: formatDate(new Date()),
    }
    
    if (form.value.categories.length) {
      frontMatter.categories = form.value.categories
    }
    if (form.value.tags.length) {
      frontMatter.tags = form.value.tags
    }
    if (form.value.cover) {
      frontMatter.cover = form.value.cover
    }
    if (form.value.description) {
      frontMatter.description = form.value.description
    }
    
    // 构建 Markdown 内容
    let content = '---\n'
    for (const [key, value] of Object.entries(frontMatter)) {
      if (Array.isArray(value)) {
        content += `${key}:\n`
        value.forEach(v => content += `  - ${v}\n`)
      } else {
        content += `${key}: ${value}\n`
      }
    }
    content += '---\n\n'
    content += form.value.content
    
    // 确定文件路径
    let filePath = postPath.value
    if (isNew.value) {
      const category = form.value.categories[0] || ''
      const slug = form.value.title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '-')
      filePath = category
        ? `source/_posts/${category}/${slug}.md`
        : `source/_posts/${slug}.md`
    }
    
    // 保存文件
    await github.saveFile(
      filePath,
      content,
      isNew.value ? `创建文章: ${form.value.title}` : `更新文章: ${form.value.title}`,
      postSha.value || null
    )
    
    ElMessage.success('保存成功')
    router.push('/posts')
  } catch (error) {
    ElMessage.error('保存失败: ' + error.message)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.editor-container {
  margin-top: 16px;
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add admin-app/src/views/PostEdit.vue
git commit -m "feat: 添加文章编辑页面"
```

---

## Task 14: 分类管理页面

**Files:**
- Create: `admin-app/src/views/Category.vue`

- [ ] **Step 1: 创建分类管理页面**

```vue
<template>
  <div class="category-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>分类管理</span>
          <el-button type="primary" @click="showAddDialog">新增分类</el-button>
        </div>
      </template>
      
      <el-table :data="categoriesWithCount" style="width: 100%">
        <el-table-column prop="name" label="分类名称" />
        <el-table-column prop="count" label="文章数量" width="120" />
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button type="primary" link @click="editCategory(row)">编辑</el-button>
            <el-button type="danger" link @click="deleteCategory(row)" :disabled="row.count > 0">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑分类' : '新增分类'" width="400px">
      <el-form @submit.prevent="saveCategory">
        <el-form-item label="分类名称">
          <el-input v-model="categoryName" placeholder="请输入分类名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveCategory">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useConfigStore } from '@/stores/config'
import { usePostStore } from '@/stores/post'

const configStore = useConfigStore()
const postStore = usePostStore()

const dialogVisible = ref(false)
const isEdit = ref(false)
const categoryName = ref('')
const editingCategory = ref('')

const categoriesWithCount = computed(() => {
  return configStore.categories.map(cat => ({
    name: cat,
    count: postStore.posts.filter(p => p.frontMatter?.categories?.includes(cat)).length,
  }))
})

function showAddDialog() {
  isEdit.value = false
  categoryName.value = ''
  dialogVisible.value = true
}

function editCategory(row) {
  isEdit.value = true
  editingCategory.value = row.name
  categoryName.value = row.name
  dialogVisible.value = true
}

async function saveCategory() {
  if (!categoryName.value.trim()) {
    ElMessage.warning('请输入分类名称')
    return
  }
  
  if (isEdit.value) {
    if (categoryName.value !== editingCategory.value) {
      configStore.removeCategory(editingCategory.value)
      configStore.addCategory(categoryName.value.trim())
    }
  } else {
    if (configStore.categories.includes(categoryName.value.trim())) {
      ElMessage.warning('分类已存在')
      return
    }
    configStore.addCategory(categoryName.value.trim())
  }
  
  await configStore.saveConfig()
  ElMessage.success(isEdit.value ? '编辑成功' : '新增成功')
  dialogVisible.value = false
}

async function deleteCategory(row) {
  try {
    await ElMessageBox.confirm(
      `确定要删除分类「${row.name}」吗？`,
      '删除确认',
      { type: 'warning' }
    )
    
    configStore.removeCategory(row.name)
    await configStore.saveConfig()
    ElMessage.success('删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(async () => {
  await Promise.all([
    configStore.fetchConfig(),
    postStore.fetchPosts(),
  ])
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add admin-app/src/views/Category.vue
git commit -m "feat: 添加分类管理页面"
```

---

## Task 15: 标签管理页面

**Files:**
- Create: `admin-app/src/views/Tag.vue`

- [ ] **Step 1: 创建标签管理页面**

```vue
<template>
  <div class="tag-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>标签管理</span>
          <el-button type="primary" @click="showAddDialog">新增标签</el-button>
        </div>
      </template>
      
      <el-table :data="tagsWithCount" style="width: 100%">
        <el-table-column prop="name" label="标签名称" />
        <el-table-column prop="count" label="文章数量" width="120" />
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button type="primary" link @click="editTag(row)">编辑</el-button>
            <el-button type="danger" link @click="deleteTag(row)" :disabled="row.count > 0">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑标签' : '新增标签'" width="400px">
      <el-form @submit.prevent="saveTag">
        <el-form-item label="标签名称">
          <el-input v-model="tagName" placeholder="请输入标签名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveTag">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useConfigStore } from '@/stores/config'
import { usePostStore } from '@/stores/post'

const configStore = useConfigStore()
const postStore = usePostStore()

const dialogVisible = ref(false)
const isEdit = ref(false)
const tagName = ref('')
const editingTag = ref('')

const tagsWithCount = computed(() => {
  return configStore.tags.map(tag => ({
    name: tag,
    count: postStore.posts.filter(p => p.frontMatter?.tags?.includes(tag)).length,
  }))
})

function showAddDialog() {
  isEdit.value = false
  tagName.value = ''
  dialogVisible.value = true
}

function editTag(row) {
  isEdit.value = true
  editingTag.value = row.name
  tagName.value = row.name
  dialogVisible.value = true
}

async function saveTag() {
  if (!tagName.value.trim()) {
    ElMessage.warning('请输入标签名称')
    return
  }
  
  if (isEdit.value) {
    if (tagName.value !== editingTag.value) {
      configStore.removeTag(editingTag.value)
      configStore.addTag(tagName.value.trim())
    }
  } else {
    if (configStore.tags.includes(tagName.value.trim())) {
      ElMessage.warning('标签已存在')
      return
    }
    configStore.addTag(tagName.value.trim())
  }
  
  await configStore.saveConfig()
  ElMessage.success(isEdit.value ? '编辑成功' : '新增成功')
  dialogVisible.value = false
}

async function deleteTag(row) {
  try {
    await ElMessageBox.confirm(
      `确定要删除标签「${row.name}」吗？`,
      '删除确认',
      { type: 'warning' }
    )
    
    configStore.removeTag(row.name)
    await configStore.saveConfig()
    ElMessage.success('删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(async () => {
  await Promise.all([
    configStore.fetchConfig(),
    postStore.fetchPosts(),
  ])
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add admin-app/src/views/Tag.vue
git commit -m "feat: 添加标签管理页面"
```

---

## Task 16: 系统设置页面

**Files:**
- Create: `admin-app/src/views/Settings.vue`

- [ ] **Step 1: 创建系统设置页面**

```vue
<template>
  <div class="settings-page">
    <el-card>
      <template #header>
        <span>系统设置</span>
      </template>
      
      <el-form :model="form" label-width="140px" @submit.prevent="saveSettings">
        <el-divider content-position="left">GitHub 配置</el-divider>
        
        <el-form-item label="Token">
          <el-input
            v-model="form.token"
            type="password"
            placeholder="GitHub Personal Access Token"
            show-password
          />
        </el-form-item>
        
        <el-form-item label="Owner">
          <el-input v-model="form.owner" placeholder="仓库所有者" />
        </el-form-item>
        
        <el-form-item label="Repo">
          <el-input v-model="form.repo" placeholder="仓库名称" />
        </el-form-item>
        
        <el-divider content-position="left">OSS 配置</el-divider>
        
        <el-form-item label="Region">
          <el-input v-model="form.ossRegion" placeholder="如: oss-cn-hangzhou" />
        </el-form-item>
        
        <el-form-item label="Bucket">
          <el-input v-model="form.ossBucket" placeholder="存储桶名称" />
        </el-form-item>
        
        <el-form-item label="AccessKey ID">
          <el-input v-model="form.accessKeyId" placeholder="AccessKey ID" />
        </el-form-item>
        
        <el-form-item label="AccessKey Secret">
          <el-input
            v-model="form.accessKeySecret"
            type="password"
            placeholder="AccessKey Secret"
            show-password
          />
        </el-form-item>
        
        <el-form-item label="图片目录">
          <el-input v-model="form.folder" placeholder="如: blog-images" />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" native-type="submit" :loading="saving">保存配置</el-button>
          <el-button type="danger" @click="clearSettings">清除所有配置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const saving = ref(false)

const form = ref({
  token: '',
  owner: '',
  repo: '',
  ossRegion: '',
  ossBucket: '',
  accessKeyId: '',
  accessKeySecret: '',
  folder: 'blog-images',
})

onMounted(() => {
  if (userStore.token) {
    form.value.token = userStore.token
  }
  if (userStore.repoConfig) {
    form.value.owner = userStore.repoConfig.owner || ''
    form.value.repo = userStore.repoConfig.repo || ''
  }
  if (userStore.ossConfig) {
    form.value.ossRegion = userStore.ossConfig.region || ''
    form.value.ossBucket = userStore.ossConfig.bucket || ''
    form.value.accessKeyId = userStore.ossConfig.accessKeyId || ''
    form.value.accessKeySecret = userStore.ossConfig.accessKeySecret || ''
    form.value.folder = userStore.ossConfig.folder || 'blog-images'
  }
})

async function saveSettings() {
  saving.value = true
  
  try {
    userStore.setToken(form.value.token)
    userStore.setRepoConfig({
      owner: form.value.owner,
      repo: form.value.repo,
    })
    userStore.setOSSConfig({
      region: form.value.ossRegion,
      bucket: form.value.ossBucket,
      accessKeyId: form.value.accessKeyId,
      accessKeySecret: form.value.accessKeySecret,
      folder: form.value.folder || 'blog-images',
    })
    
    ElMessage.success('保存成功')
  } catch (error) {
    ElMessage.error('保存失败: ' + error.message)
  } finally {
    saving.value = false
  }
}

async function clearSettings() {
  try {
    await ElMessageBox.confirm(
      '确定要清除所有配置吗？这将退出登录。',
      '清除确认',
      { type: 'warning' }
    )
    
    userStore.logout()
    ElMessage.success('配置已清除')
    router.push('/login')
  } catch (error) {
    // 用户取消
  }
}
</script>
```

- [ ] **Step 2: Commit**

```bash
git add admin-app/src/views/Settings.vue
git commit -m "feat: 添加系统设置页面"
```

---

## Task 17: 创建初始配置文件

**Files:**
- Create: `admin/config.json`

- [ ] **Step 1: 创建配置文件**

```json
{
  "categories": ["后端", "前端", "运维", "其他"],
  "tags": ["Java", "Vue", "Docker", "MySQL", "Redis", "Spring"]
}
```

- [ ] **Step 2: Commit**

```bash
git add admin/config.json
git commit -m "feat: 创建初始配置文件"
```

---

## Task 18: 测试与构建验证

**Files:**
- 无新文件

- [ ] **Step 1: 本地开发测试**

```bash
cd admin-app && npm run dev
```

访问 http://localhost:5173 验证功能

- [ ] **Step 2: 构建测试**

```bash
cd admin-app && npm run build
```

验证构建成功，生成 dist 目录

- [ ] **Step 3: 提交所有代码**

```bash
git add .
git commit -m "feat: 博客管理后台开发完成"
git push
```

---

## Self-Review Checklist

**1. Spec Coverage:**
- [x] 登录页 - Task 10
- [x] 仪表盘 - Task 11
- [x] 文章列表 - Task 12
- [x] 文章编辑 - Task 13
- [x] 分类管理 - Task 14
- [x] 标签管理 - Task 15
- [x] 系统设置 - Task 16
- [x] GitHub API 服务 - Task 5
- [x] OSS 服务 - Task 6
- [x] 存储服务 - Task 4

**2. Placeholder Scan:**
- [x] 无 TBD/TODO
- [x] 无 "实现类似"
- [x] 所有代码步骤都有完整代码

**3. Type Consistency:**
- [x] 服务方法名一致
- [x] Store 属性名一致
- [x] 表单字段名一致
