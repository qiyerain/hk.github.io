/* ============================================================
   DeepSeek Harness · 架构与学习手册
   Vanilla JS. No dependencies. Everything persists in localStorage.
   ============================================================ */
(() => {
  'use strict'

  const $ = (sel, root = document) => root.querySelector(sel)
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel))
  const KEY = 'dsh-learn-v1'

  let state
  try {
    state = Object.assign({ theme: 'dark', done: {}, tasks: {}, notes: {}, quiz: {} }, JSON.parse(localStorage.getItem(KEY) || '{}'))
  } catch {
    state = { theme: 'dark', done: {}, tasks: {}, notes: {}, quiz: {} }
  }
  state.done = state.done || {}
  state.tasks = state.tasks || {}
  state.notes = state.notes || {}
  state.quiz = state.quiz || {}

  const save = () => {
    try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* private mode */ }
  }

  const toastEl = $('#toast')
  let toastTimer = null
  function toast (msg) {
    if (!toastEl) return
    toastEl.textContent = msg
    toastEl.classList.add('show')
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200)
  }

  async function copyText (text) {
    try {
      await navigator.clipboard.writeText(text)
      toast('已复制：' + text)
      return
    } catch { /* fall back to a selection copy below */ }
    const field = document.createElement('textarea')
    field.value = text
    field.setAttribute('readonly', '')
    field.style.position = 'fixed'
    field.style.opacity = '0'
    document.body.appendChild(field)
    field.select()
    let ok = false
    try { ok = document.execCommand('copy') } catch { ok = false }
    field.remove()
    toast(ok ? '已复制：' + text : '复制失败，请手动选择路径')
  }

  /* ---------------- theme ---------------- */
  const themeBtn = $('#themeBtn')
  const themeLabel = $('#themeLabel')

  function applyTheme (theme) {
    document.documentElement.setAttribute('data-theme', theme)
    state.theme = theme
    if (themeLabel) themeLabel.textContent = theme === 'dark' ? '深色' : '浅色'
    save()
  }
  applyTheme(state.theme === 'light' ? 'light' : 'dark')
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark')
    })
  }

  /* ---------------- chapters, nav, progress ---------------- */
  const chapters = $$('.chapter[data-chapter]')
  const marks = $$('.ch-mark[data-mark]')
  const navLinks = $$('.nav a')
  const sideRing = $('#sideRing')
  const sideProgress = $('#sideProgress')
  const footProgress = $('#footProgress')
  const readProgress = $('#readProgress')

  function chapterHref (id) { return '#' + id }

  function updateProgress () {
    const total = chapters.length
    const done = chapters.filter(c => state.done[c.id]).length
    const pct = total ? Math.round((done / total) * 100) : 0
    if (sideRing) {
      sideRing.style.setProperty('--p', pct)
      sideRing.dataset.label = pct + '%'
    }
    if (sideProgress) sideProgress.textContent = done + ' / ' + total + ' 节'
    if (footProgress) footProgress.textContent = done + ' / ' + total + ' 节已完成'
    $$('.ch-mark[data-mark]').forEach(btn => {
      const id = btn.dataset.mark
      const isDone = !!state.done[id]
      btn.classList.toggle('done', isDone)
      btn.textContent = isDone ? '✓ 已完成' : '标记完成'
      btn.setAttribute('aria-pressed', String(isDone))
    })
    $$('.nav a').forEach(a => {
      const id = a.getAttribute('href').slice(1)
      a.classList.toggle('is-done', !!state.done[id])
    })
  }

  marks.forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.mark
      state.done[id] = !state.done[id]
      if (!state.done[id]) delete state.done[id]
      save()
      updateProgress()
      if (state.done[id]) toast('已标记完成：' + (chapters.find(c => c.id === id)?.querySelector('h2')?.textContent || id))
    })
  })
  updateProgress()

  /* active nav */
  let ticking = false
  function onScroll () {
    if (ticking) return
    ticking = true
    requestAnimationFrame(() => {
      const doc = document.documentElement
      const max = doc.scrollHeight - window.innerHeight
      if (readProgress) readProgress.style.width = (max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0) + '%'

      let current = null
      for (const c of chapters) {
        if (c.getBoundingClientRect().top <= 140) current = c.id
      }
      if (max > 0 && window.scrollY >= max - 4) current = chapters[chapters.length - 1]?.id || current
      navLinks.forEach(a => a.classList.toggle('active', current !== null && a.getAttribute('href') === '#' + current))
      ticking = false
    })
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll)
  onScroll()

  /* mobile menu */
  const menuBtn = $('#menuBtn')
  const sidebar = $('#sidebar')
  function syncMenuButton () {
    if (!menuBtn) return
    menuBtn.style.display = window.matchMedia('(max-width: 980px)').matches ? 'inline-flex' : 'none'
    if (!window.matchMedia('(max-width: 980px)').matches) sidebar?.classList.remove('open')
    menuBtn.setAttribute('aria-expanded', String(!!sidebar?.classList.contains('open')))
  }
  syncMenuButton()
  window.addEventListener('resize', syncMenuButton)
  menuBtn?.addEventListener('click', () => {
    sidebar?.classList.toggle('open')
    syncMenuButton()
  })
  $$('.nav a, .side-footer button').forEach(el => el.addEventListener('click', () => {
    if (window.matchMedia('(max-width: 980px)').matches) sidebar?.classList.remove('open')
    syncMenuButton()
  }))
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && sidebar?.classList.contains('open')) {
      sidebar.classList.remove('open')
      syncMenuButton()
    }
  })

  /* reveal labs */
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in')
          io.unobserve(e.target)
        }
      })
    }, { rootMargin: '0px 0px -8% 0px' })
    $$('.lab').forEach(el => { el.classList.add('reveal'); io.observe(el) })
  }

  /* ---------------- search ---------------- */
  const dialog = $('#searchDialog')
  const searchInput = $('#searchInput')
  const searchResults = $('#searchResults')
  let searchIndex = []
  let searchSel = 0
  let searchItems = []

  function buildSearchIndex () {
    searchIndex = []
    $$('.nav a').forEach(a => {
      const id = a.getAttribute('href').slice(1)
      const ch = document.getElementById(id)
      searchIndex.push({
        kind: '章节',
        num: a.querySelector('.num')?.textContent || '',
        title: a.querySelectorAll('span')[1]?.textContent.trim() || a.textContent.trim(),
        desc: ch?.querySelector('h2')?.textContent || '',
        text: (ch?.innerText || '').replace(/✓ 已完成|标记完成/g, ' ').replace(/\s+/g, ' ').trim(),
        href: '#' + id
      })
    })
    $$('#glossary .term').forEach((t, index) => {
      const term = t.querySelector('summary')?.childNodes[0]?.textContent?.trim() || ''
      const body = t.querySelector('.td')?.textContent?.trim() || ''
      searchIndex.push({ kind: '术语', title: term, desc: body.slice(0, 80), href: '#appendix', target: index })
    })
    ;(window.DSH_PACKAGES || []).forEach(p => {
      searchIndex.push({ kind: '包', title: p.id, desc: p.desc, href: '#packages', path: p.path, text: p.name + ' ' + p.group })
    })
  }

  function openSearch () {
    if (!dialog) return
    buildSearchIndex()
    dialog.showModal()
    searchInput.value = ''
    searchSel = 0
    renderSearch('')
    setTimeout(() => searchInput.focus(), 30)
  }

  function snippet (text, query) {
    const i = text.toLowerCase().indexOf(query)
    if (i < 0) return ''
    const start = Math.max(0, i - 26)
    return (start > 0 ? '…' : '') + text.slice(start, i + query.length + 46).trim() + '…'
  }

  function renderSearch (q) {
    const query = q.trim().toLowerCase()
    let all
    if (!query) {
      all = searchIndex.filter(x => x.kind === '章节' || x.kind === '术语')
    } else {
      all = searchIndex.map(x => {
        const title = x.title.toLowerCase()
        const desc = (x.desc || '').toLowerCase()
        let score = 0
        if (title === query) score = 5
        else if (title.includes(query)) score = 4
        else if (desc.includes(query)) score = 3
        else if ((x.text || '').toLowerCase().includes(query)) score = 1
        return { x, score }
      }).filter(o => o.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(o => ({ ...o.x, match: o.score }))
    }
    const buckets = { 章节: [], 术语: [], 包: [] }
    all.forEach(x => { if (buckets[x.kind]) buckets[x.kind].push(x) })
    const limit = query ? 6 : 5
    searchItems = []
    let html = ''
    for (const kind of ['章节', '术语', '包']) {
      const items = buckets[kind].slice(0, kind === '包' ? (query ? 12 : 0) : limit)
      if (!items.length) continue
      html += '<div class="sr-group">' + kind + '</div>'
      items.forEach(it => {
        const i = searchItems.length
        searchItems.push(it)
        const desc = it.match === 1
          ? snippet(it.text || '', query)
          : (it.desc && it.desc.trim() !== it.title.trim() ? it.desc : '')
        html += '<div class="sr" data-i="' + i + '">' +
          '<span class="n">' + escapeHtml(it.num || String(i + 1).padStart(2, '0')) + '</span>' +
          '<span>' + escapeHtml(it.title) + '</span>' +
          '<span class="d">' + escapeHtml(desc) + '</span>' +
          '</div>'
      })
    }
    searchResults.innerHTML = html || '<div class="search-empty">没有匹配。试试 “turn”、“seam”、“sandbox”。</div>'
    searchSel = 0
    $$('.sr', searchResults).forEach(el => {
      el.addEventListener('click', () => chooseSearch(Number(el.dataset.i)))
      el.addEventListener('mousemove', () => { searchSel = Number(el.dataset.i); paintSearchSel() })
    })
    paintSearchSel()
  }

  function paintSearchSel () {
    $$('.sr', searchResults).forEach(el => el.classList.toggle('sel', Number(el.dataset.i) === searchSel))
  }

  function chooseSearch (i) {
    const it = searchItems[i]
    if (!it) return
    dialog.close()
    if (it.kind === '包' && it.path) {
      location.hash = '#packages'
      const ps = $('#pkgSearch')
      if (ps) { ps.value = it.title; ps.dispatchEvent(new Event('input')) }
      setTimeout(() => copyText(it.path), 250)
      return
    }
    if (it.kind === '术语' && it.target !== undefined) {
      const term = $$('#glossary .term')[it.target]
      if (term) {
        term.open = true
        history.replaceState(null, '', '#appendix')
        term.scrollIntoView({ behavior: 'smooth', block: 'center' })
        term.classList.add('flash')
        setTimeout(() => term.classList.remove('flash'), 1400)
        return
      }
    }
    location.hash = it.href
  }

  $('#openSearch')?.addEventListener('click', openSearch)
  searchInput?.addEventListener('input', e => renderSearch(e.target.value))
  searchInput?.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); searchSel = Math.min(searchItems.length - 1, searchSel + 1); paintSearchSel(); scrollSel() }
    if (e.key === 'ArrowUp') { e.preventDefault(); searchSel = Math.max(0, searchSel - 1); paintSearchSel(); scrollSel() }
    if (e.key === 'Enter') { e.preventDefault(); chooseSearch(searchSel) }
  })
  function scrollSel () {
    const el = $$('.sr', searchResults)[searchSel]
    el?.scrollIntoView({ block: 'nearest' })
  }
  document.addEventListener('keydown', e => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '')
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault()
      if (dialog?.open) dialog.close(); else openSearch()
    } else if (e.key === '/' && !typing && !dialog?.open) {
      e.preventDefault()
      openSearch()
    }
  })

  function escapeHtml (s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
  }

  /* ============================================================
     LAB 01 · plugin dependency
     ============================================================ */
  const PLUGINS = [
    { id: 'dsh-session', provides: ['sessions'], inject: [], note: 'append-only 事件日志' },
    { id: 'dsh-llm', provides: ['llm'], inject: [], note: '模型接缝定义' },
    { id: 'dsh-credentials', provides: ['credentials'], inject: [], note: '凭据引用与记录' },
    { id: 'dsh-llm-deepseek', provides: [], inject: ['llm', 'credentials'], note: '注册 DeepSeek 适配器' },
    { id: 'dsh-tools', provides: ['tools'], inject: [], note: '工具注册表与执行器选择' },
    { id: 'dsh-system-prompt', provides: ['systemPrompt'], inject: [], note: '提示词段与工具 schema 装配' },
    { id: 'dsh-agent', provides: ['agents'], inject: [], note: 'Agent 契约与实时注册表' },
    { id: 'dsh-agent-loop', provides: ['agentLoop'], inject: ['sessions', 'tools', 'systemPrompt', 'llm', 'agents'], note: '默认 turn/step 驱动' },
    { id: 'dsh-fs', provides: ['fs'], inject: [], note: '文件系统接缝定义' },
    { id: 'dsh-fs-local', provides: [], inject: ['fs'], note: '本机文件系统提供者' },
    { id: 'dsh-tool-fs', provides: [], inject: ['tools', 'fs'], note: 'Read / Write / Edit 工具' },
    { id: 'dsh-session-title', provides: ['sessionTitle'], inject: ['sessions', 'llm'], note: '从日志生成标题' }
  ]

  const plugList = $('#plugList')
  if (plugList) {
    const off = new Set()

    function compute () {
      const active = new Set()
      const providers = new Set()
      let changed = true
      let guard = 0
      while (changed && guard++ < 20) {
        changed = false
        for (const p of PLUGINS) {
          if (off.has(p.id) || active.has(p.id)) continue
          if (p.inject.every(s => providers.has(s))) {
            active.add(p.id)
            changed = true
            p.provides.forEach(s => { if (!providers.has(s)) { providers.add(s); changed = true } })
          }
        }
      }
      return { active, providers }
    }

    function renderPlugins () {
      const { active, providers } = compute()
      plugList.innerHTML = PLUGINS.map(p => {
        const blocked = !off.has(p.id) && !active.has(p.id)
        const cls = off.has(p.id) ? 'off' : blocked ? 'waiting' : 'on'
        const sub = p.inject.length ? '需要 ' + p.inject.map(s => 'ctx.' + s).join(' + ') : (p.note || '')
        return '<div class="plug ' + cls + '" data-plugin="' + p.id + '" role="button" tabindex="0" aria-pressed="' + !off.has(p.id) + '">' +
          '<span class="dot"></span><span><span class="plug-name">' + p.id.replace('dsh-', '') + '</span><span class="plug-sub">' + escapeHtml(sub) + '</span></span>' +
          '</div>'
      }).join('')

      const svc = Array.from(providers).sort()
      const svcList = $('#svcList')
      svcList.innerHTML = svc.length
        ? svc.map(s => '<div class="svc">ctx.' + s + '<span class="who">' + (PLUGINS.find(p => p.provides.includes(s) && active.has(p.id))?.id.replace('dsh-', '') || '') + '</span></div>').join('')
        : '<div class="svc empty">没有可用服务</div>'

      const consumers = PLUGINS.filter(p => p.inject.length)
      $('#consumerList').innerHTML = consumers.map(p => {
        const ready = active.has(p.id)
        return '<div class="consumer ' + (ready ? '' : 'blocked') + '">' +
          '<span>' + p.id.replace('dsh-', '') + '</span>' +
          '<span class="need">' + (ready ? '✓ 已激活' : '等待 ' + p.inject.filter(s => !providers.has(s)).join(', ')) + '</span>' +
          '</div>'
      }).join('')

      const waiting = PLUGINS.filter(p => !off.has(p.id) && !active.has(p.id))
      $('#plugCount').textContent = active.size + ' / ' + PLUGINS.length
      $('#plugStatus').innerHTML = '<b>' + active.size + '</b> 个插件激活 · <b>' + svc.length + '</b> 个服务可用 · <b>' + waiting.length + '</b> 个在等待依赖' +
        (waiting.length ? '（' + waiting.map(p => p.id.replace('dsh-', '')).join(', ') + '）' : '。服务依赖已闭合。')

      $$('.plug', plugList).forEach(el => {
        const toggle = () => {
          const id = el.dataset.plugin
          if (off.has(id)) off.delete(id); else off.add(id)
          const goWaiting = PLUGINS.filter(p => p.inject.some(s => PLUGINS.find(q => q.id === id)?.provides.includes(s)))
          renderPlugins()
          if (!off.has(id)) toast(id.replace('dsh-', '') + ' 已挂载')
          else if (goWaiting.length) toast(id.replace('dsh-', '') + ' 卸载：' + goWaiting.length + ' 个消费者退回等待')
          else toast(id.replace('dsh-', '') + ' 已卸载，注册的 effect 已回卷')
        }
        el.addEventListener('click', toggle)
        el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle() } })
      })
    }

    $('#plugAllOn')?.addEventListener('click', () => { off.clear(); renderPlugins() })
    $('#plugCoreOnly')?.addEventListener('click', () => {
      off.clear()
      PLUGINS.filter(p => !['dsh-session', 'dsh-llm', 'dsh-tools', 'dsh-system-prompt', 'dsh-agent', 'dsh-agent-loop', 'dsh-credentials'].includes(p.id)).forEach(p => off.add(p.id))
      renderPlugins()
      toast('只保留脊柱；适配器与工具插件被卸载')
    })
    $('#plugKillLoop')?.addEventListener('click', () => {
      off.add('dsh-agent-loop')
      renderPlugins()
      toast('卸载 agent-loop：ctx.sessions 仍在，数据不需要迁移')
    })
    renderPlugins()
  }

  /* ============================================================
     LAB 02 · layer stack
     ============================================================ */
  const LAYERS = [
    { n: 1, name: 'dsh-base', type: 'bundle', desc: '共享第一层：模型、工具、会话、权限、遥测' },
    { n: 2, name: 'dsh-web-app', type: 'bundle', desc: 'Web 应用、API 控制器、静态前端' },
    { n: 3, name: 'profile / cordis.patch.yml', type: 'patch', desc: '这个 profile 自己的覆盖' },
    { n: 4, name: '$DSH_HOME / cordis.patch.yml', type: 'patch', desc: '用户级覆盖，影响所有 profile' },
    { n: 5, name: '--patch ./debug.yml', type: 'overlay', desc: '命令行覆盖，最后应用' }
  ]
  const ROWS = [
    { id: 'llm', ins: 1 },
    { id: 'session', ins: 1 },
    { id: 'tools', ins: 1 },
    { id: 'agent-loop', ins: 1, cfg: '{ agents: [] }', overrides: { 3: '{ agents: [{ id: "reviewer" }] }' } },
    { id: 'hmr', ins: 1, cfg: '{ root: [] }', overrides: { 4: "{ root: ['packages/core'] }" } },
    { id: 'llm-deepseek', ins: 1 },
    { id: 'fs-sandbox', ins: 1 },
    { id: 'tool-executor-ptc', ins: 1, cfg: 'disabled: true', overrides: { 5: 'disabled: false' } },
    { id: 'tool-plugin-manager', ins: 1, cfg: 'disabled: true', overrides: { 2: 'disabled: false' } },
    { id: 'web-app', ins: 2 },
    { id: 'api-remotes', ins: 2 }
  ]

  const layerStack = $('#layerStack')
  if (layerStack) {
    let depth = 5
    let selectedRow = 'agent-loop'

    function renderLayers () {
      layerStack.innerHTML = LAYERS.map(l => {
        const applied = l.n <= depth
        return '<div class="layer ' + (applied ? 'applied' : 'future') + '" data-depth="' + l.n + '" role="button" tabindex="0">' +
          '<span class="lidx">L' + l.n + '</span>' +
          '<span><span class="lname">' + escapeHtml(l.name) + '</span><br><span class="ldesc">' + escapeHtml(l.desc) + '</span></span>' +
          '<span class="ltype">' + l.type + '</span>' +
          '</div>'
      }).join('')

      const visible = ROWS.filter(r => r.ins <= depth).map(r => {
        let src = r.ins
        let val = r.cfg || '—'
        for (let n = 1; n <= depth; n++) {
          if (r.overrides && r.overrides[n] !== undefined) { src = n; val = r.overrides[n] }
        }
        return { ...r, src, val }
      })

      $('#layerRows').innerHTML = '<div class="lrow" style="color:var(--ink-4);font-size:9.5px;letter-spacing:.08em;text-transform:uppercase">' +
        '<span>row id</span><span>来源层</span><span>生效配置</span></div>' +
        visible.map(r => {
          const changed = r.src === depth && (r.overrides?.[depth] !== undefined || r.ins === depth)
          return '<div class="lrow" data-row="' + r.id + '" role="button" tabindex="0" style="cursor:pointer">' +
            '<span class="' + (changed ? 'on' : '') + '">' + r.id + '</span>' +
            '<span class="src">L' + r.src + (r.overrides?.[r.src] !== undefined ? ' · override' : ' · insert') + '</span>' +
            '<span class="val">' + escapeHtml(r.val) + '</span>' +
            '</div>'
        }).join('')

      const overrides = visible.filter(r => r.overrides && Object.keys(r.overrides).some(n => Number(n) <= depth)).length
      $('#layerStatus').innerHTML = '当前应用 <b>L1–L' + depth + '</b> · <b>' + visible.length + '</b> 行可见 · <b>' + overrides + '</b> 行被覆盖。' +
        (depth < 5 ? ' 上层尚未应用。' : ' 完整装配。') +
        ' 规则：patch 替换整行 config，不合并。'

      $$('.layer', layerStack).forEach(el => {
        const go = () => { depth = Math.min(5, Number(el.dataset.depth)); renderLayers() }
        el.addEventListener('click', go)
        el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go() } })
      })
      $$('#layerRows .lrow[data-row]').forEach(el => {
        const go = () => {
          selectedRow = el.dataset.row
          const r = visible.find(x => x.id === selectedRow)
          if (!r) return
          $('#layerStatus').innerHTML = '<b>' + r.id + '</b>：L' + r.ins + ' 插入；最终由 <b>L' + r.src + '</b> ' +
            (r.overrides?.[r.src] !== undefined ? '整行替换 config' : '提供初始值') + '。生效值 <code>' + escapeHtml(r.val) + '</code>' +
            (r.overrides ? ' 已定义的覆盖层：' + Object.keys(r.overrides).map(n => 'L' + n).join('、') : '')
        }
        el.addEventListener('click', go)
        el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go() } })
      })
    }
    renderLayers()
  }

  /* ============================================================
     LAB 03 · turn player
     ============================================================ */
  const turnActors = $('#turnActors')
  if (turnActors) {
    const baseFrames = [
      { a: 'inbox', phase: 'input', live: ['agent/inbox/inserted'], note: '<b>用户消息进入 inbox。</b>它是一条待处理输入，还没有进入模型历史。inbox 的结构性变更会以持久事件 <code>agent/inbox/spliced</code> 记录，所以冷读也能知道“还欠什么”。' },
      { a: 'driver', phase: 'wake', live: ['agent/status → running'], note: '<b>队列唤醒驱动。</b>状态是 live 事件：它告诉 UI“开始干活了”，但不进日志。' },
      { a: 'session', phase: 'turn', durable: [{ t: 'turn/start', d: '{ turn: 1 }' }], note: '<b>先开 turn。</b>此时还没有 step。turn 打开发生在认领输入之前，所以“被拒绝/空输入”的 turn 也能有完整边界。' },
      { a: 'inbox', phase: 'claim', durable: [{ t: 'agent/inbox/spliced', d: 'removedCount: 1, inserted: []' }], live: ['agent/inbox/claimed'], note: '<b>原子认领。</b>驱动取出“下一条 next-step 输入 + 一条排队消息”。认领后消息从 inbox 移除，UI 收到 live 通知；持久投影同步落一条 spliced。' },
      { a: 'prompt', phase: 'assemble', live: ['system-prompt/assemble (waterfall)'], note: '<b>装配本 step。</b>解析这一步准入的工具集，装配 prompt 段与工具 schema，并快照本 step 的模型选择。' },
      { a: 'driver', phase: 'pre-step', live: ['agent/pre-step (waterfall)'], note: '<b>最后一个能整体否决的点。</b>监听器可以接受、改写消息，或拒绝。拒绝时已认领的批次保持移除，turn 不消耗 step。' },
      { a: 'session', phase: 'step', durable: [{ t: 'step/start', d: '{ turn: 1, step: 1 }' }], note: '<b>开 step。</b>从这里开始，一次模型请求及其工具执行有了独立边界。重试不会重开 step。' },
      { a: 'llm', phase: 'prepare', live: ['agent/request (waterfall)', 'llm.prepareCall()'], note: '<b>先绑定适配器，再提交任何东西。</b><code>prepareCall()</code> 可能异步、可能失败；放在准入之前，取消或失败时 system 与 user 都不会被提交。' },
      { a: 'session', phase: 'admit', durable: [{ t: 'system/message', d: '渲染后的系统提示词' }, { t: 'user/message', d: '认领的用户消息' }, { t: 'request/header', d: 'provider / model / tools' }], note: '<b>同步准入。</b>用已备好的调用能力对账 system 节点，提交用户消息，必要时记录 request header 与 context。请求本身没有独立的 system 字段。' },
      { a: 'driver', phase: 'freeze', note: '<b>冻结请求。</b><code>deriveMessages()</code> 从日志派生历史，消息身份首次被深冻结并在同一 agent 内复用；取消信号保持活的。' },
      { a: 'llm', phase: 'stream', live: ['llm/stream (waterfall)', 'agent/assistant-stream start', 'chunk*'], note: '<b>流式。</b>每个 chunk 先等对应的持久帧落定，再发出 live 帧。UI 的增量来自 live；重放读的是最终落定的 stream。' },
      { a: 'session', phase: 'settle', durable: [{ t: 'assistant/message', d: 'message + stream + usage' }], note: '<b>成功落定。</b>完整消息与精确的紧凑 stream 一起进日志。空内容的 assistant 消息也会记录（为了用量与证据），但不进入模型历史。' },
      { a: 'tools', phase: 'dispatch', durable: [{ t: 'tool/call', d: 'name, arguments (raw JSON)' }], live: ['tools/pre-execute (waterfall)'], note: '<b>工具调用先落日志，再执行。</b>原始 arguments 字符串原样保存；准入、守卫、审批都在执行主体之前。' },
      { a: 'tools', phase: 'execute', live: ['ctx.approval (ask)', 'tools/execute (waterfall)'], note: '<b>执行。</b>独占调用形成屏障，并行安全调用进入有界滚动池。超时、重试、指标通过 around-dispatch 包装，不需要改工具。' },
      { a: 'session', phase: 'result', durable: [{ t: 'tool/result', d: 'content / isError / meta' }], note: '<b>结果落定。</b>被拒绝、被替换、抛错，最终都变成一条模型可读的 tool result；call/result 始终配对。' },
      { a: 'session', phase: 'step-end', durable: [{ t: 'step/end', d: '{ turn: 1, step: 1 }' }], note: '<b>收 step。</b>释放这一步的工具集。如果工具要求继续，或者队列里有新的 next-step 输入，就回到装配/准入，在同一个 turn 内开下一个 step。' },
      { a: 'driver', phase: 'stop', live: ['agent/turn-stopping (serial)'], note: '<b>自然停止检查点。</b>只在没有欠账时触发；它是 serial、没有 <code>next()</code>。插件可以在这里补一条继续指令或做收尾。' },
      { a: 'session', phase: 'turn-end', durable: [{ t: 'turn/end', d: '{ reason: completed }' }], live: ['agent/status → idle'], note: '<b>收 turn。</b>结束原因是结构化的：completed / aborted / blocked / error / max-tokens / interrupted / forked。turn 结束后，驱动回到等待队列。' }
    ]

    let variant = 'normal'
    let frames = baseFrames
    let index = -1
    let playing = false
    let timer = null

    function rejectFrames () {
      return baseFrames.slice(0, 6).concat([
        { a: 'driver', phase: 'reject', live: ['agent/pre-step → reject'], note: '<b>pre-step 拒绝。</b>返回的 decision 是权威的。已认领的批次保持移除，已打开的 turn 不消耗任何 step——所以日志里没有 <code>step/start</code>。' },
        { a: 'session', phase: 'turn-end', durable: [{ t: 'turn/end', d: '{ reason: blocked }' }], live: ['agent/status → idle'], note: '<b>直接收 turn。</b>这是一个“零 step 的 turn”。很多失败路径都能落到这个形状，理解它有助于区分“没有开始”和“开始了但失败”。' }
      ])
    }

    function reset () {
      index = -1
      stop()
      render()
    }

    function render () {
      const f = frames[index]
      $$('.actor', turnActors).forEach(el => {
        el.classList.toggle('on', !!f && el.dataset.actor === f.a)
        el.classList.toggle('dim', !!f && el.dataset.actor !== f.a)
      })

      const note = $('#frameNote')
      if (!f) {
        note.innerHTML = '<span class="fphase">准备</span>点击“播放”，或按 <b>→</b> 单步。每一帧都会告诉你：谁在动、写了什么日志、模型此刻能不能看到。'
      } else {
        note.innerHTML = '<span class="fphase">' + escapeHtml(f.phase) + '</span>' + f.note
      }

      const durable = []
      const live = []
      for (let i = 0; i <= index; i++) {
        (frames[i].durable || []).forEach(d => durable.push(d))
        ;(frames[i].live || []).forEach(l => live.push(l))
      }

      const logs = $('#turnLogs')
      logs.innerHTML = durable.length
        ? durable.map((d, i) => '<div class="log-line"><span class="seq">' + (i + 1) + '</span><span class="typ">' + escapeHtml(d.t) + '</span><span class="badge durable">durable</span></div>' +
            (d.d ? '<div class="log-line" style="opacity:.65"><span class="seq"></span><span class="typ" style="padding-left:2px;font-size:9.5px">' + escapeHtml(d.d) + '</span><span></span></div>' : '')).join('')
        : '<div class="empty">还没有事件。</div>'
      $('#logCount').textContent = durable.length + ' events'

      const liveEl = $('#turnLive')
      liveEl.innerHTML = live.length
        ? live.slice(-9).map(l => '<div class="log-line"><span class="seq">·</span><span class="typ">' + escapeHtml(l) + '</span><span class="badge live">live</span></div>').join('')
        : '<div class="empty">—</div>'

      $('#turnCounter').textContent = Math.max(0, index + 1) + ' / ' + frames.length
      const bar = $('#turnScrub i')
      if (bar) bar.style.width = (frames.length > 1 ? ((index + 1) / frames.length) * 100 : 0) + '%'
      const playBtn = $('#turnPlay')
      if (playBtn) playBtn.textContent = playing ? '暂停' : (index >= frames.length - 1 ? '重播' : '播放')
      logs.scrollTop = logs.scrollHeight
      liveEl.scrollTop = liveEl.scrollHeight
    }

    function step (delta) {
      stop()
      index = Math.max(-1, Math.min(frames.length - 1, index + delta))
      render()
    }

    function stop () {
      playing = false
      if (timer) clearInterval(timer)
      timer = null
    }

    function play () {
      if (playing) { stop(); render(); return }
      if (index >= frames.length - 1) index = -1
      playing = true
      render()
      timer = setInterval(() => {
        if (index >= frames.length - 1) { stop(); render(); return }
        index++
        render()
      }, 1900)
    }

    $('#turnNext')?.addEventListener('click', () => step(1))
    $('#turnPrev')?.addEventListener('click', () => step(-1))
    $('#turnPlay')?.addEventListener('click', play)
    $('#turnReset')?.addEventListener('click', reset)
    $('#turnReject')?.addEventListener('click', e => {
      variant = variant === 'normal' ? 'reject' : 'normal'
      frames = variant === 'reject' ? rejectFrames() : baseFrames
      e.currentTarget.classList.toggle('warm', variant === 'reject')
      e.currentTarget.classList.toggle('on', variant === 'reject')
      e.currentTarget.textContent = variant === 'reject' ? '回到正常分支' : '看拒绝分支'
      reset()
      toast(variant === 'reject' ? '已切换到 pre-step 拒绝分支' : '已回到正常分支')
    })
    $('#turnScrub')?.addEventListener('click', e => {
      const r = e.currentTarget.getBoundingClientRect()
      const ratio = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width))
      stop()
      index = Math.min(frames.length - 1, Math.floor(ratio * frames.length))
      render()
    })
    $('#turnScrub')?.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { e.preventDefault(); step(1) }
      if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1) }
    })
    reset()
  }

  /* ============================================================
     LAB 04 · tool pipeline
     ============================================================ */
  const pipeNodes = $('#pipeNodes')
  if (pipeNodes) {
    const NODES = [
      { id: 'msg', n: 'MODEL', t: 'assistant 消息里出现 tool-call 块' },
      { id: 'call', n: 'tool/call', t: '执行前先落日志' },
      { id: 'present', n: 'presentCall', t: 'UI 显示待执行卡片' },
      { id: 'pre', n: 'tools/pre-execute', t: 'hooks / 权限 / 沙箱' },
      { id: 'approval', n: 'ctx.approval', t: '一次性审批；缺失即拒绝' },
      { id: 'guard', n: 'guards', t: '单调守卫：拒绝或弃权' },
      { id: 'exec', n: 'tools/execute', t: 'around：超时 / 重试 / 指标' },
      { id: 'body', n: 'tool.execute', t: '工具主体真正执行' },
      { id: 'fs', n: 'fs/*-intent', t: '写前检查（仅 fs 变更）' },
      { id: 'project', n: 'projectContent', t: '执行准备的内容投影' },
      { id: 'post', n: 'tools/post-execute', t: '接受 / 阻断 / 替换 / 加上下文' },
      { id: 'finalize', n: 'finalizeContent', t: '最后一道内容不变量' },
      { id: 'notify', n: 'tools/result', t: '冻结结果的同步通知' },
      { id: 'result', n: 'tool/result', t: '模型可见的唯一结果' }
    ]

    const DETAIL = {
      msg: '模型在 assistant 消息里请求调用工具。参数是原始 JSON 字符串，此时还没有被解析或校验。',
      call: '整批调用在这里落成持久事件 <code>tool/call</code>，早于任何执行。崩溃后若没有结果，恢复逻辑会用 TOOL_OUTCOME_UNKNOWN / TOOL_NOT_STARTED 补齐配对。',
      present: 'UI 的待执行卡片从这里开始渲染。<code>presentCall</code> 由工具定义提供，Host presenter 必须是纯函数。',
      pre: '第一个策略瀑布：hooks、权限、沙箱都在这里。返回 allow / deny / ask。它看到的是完整调用与 agent 上下文。',
      approval: '只有 pre 返回 ask 时才进入。<code>ctx.approval</code> 发起一次性询问；被拒绝、取消或无人可答，都按拒绝处理。',
      guard: '已注册的单调守卫只能 deny 或弃权（abstain），不能把别人拒绝的调用改回允许。身份相关策略因此不会被后续插件重排。',
      exec: 'around-dispatch 包装层：超时、重试、指标、trace。它包住工具主体，但不改变工具契约。',
      body: '工具自己的 <code>execute()</code>。业务规则在这里，策略不要藏在这里——否则直接调用者可以绕过。',
      fs: '只有文件系统变更工具会走到这：<code>fs/write-intent</code> 或 <code>fs/edit-intent</code>。读前写检查更靠下，挂在 <code>fs/*</code> 事件上。',
      project: '工具定义可以在这里把执行准备的内容装进结果，例如结构化摘要或附件引用。',
      post: '第二个策略瀑布：接受、阻断、替换内容，或追加 additionalContexts。上下文按 FIFO 在记录完结果后注入。',
      finalize: '工具定义的最后一刀：只允许改 content，且必须同步。之后结果被视为冻结。',
      notify: '同步通知，观察不可变、无损 JSON 的最终结果。遥测与审计在这里读，而不是在工具主体里顺手发。',
      result: '一条模型可读的 <code>tool/result</code>。拒绝、异常、超时最终都要走到这里；call/result 必须配对。'
    }

    const SCENES = {
      normal: {
        label: '正常执行',
        active: ['msg', 'call', 'present', 'pre', 'guard', 'exec', 'body', 'project', 'post', 'finalize', 'notify', 'result'],
        deny: [],
        log: ['tool/call  read_file({"path":"README.md"})', 'tool/result  {"content":"# DeepSeek Harness…"}'],
        model: 'Read 成功，结果 content 正常进入下一轮请求。'
      },
      approve: {
        label: '需要审批',
        active: ['msg', 'call', 'present', 'pre', 'approval', 'guard', 'exec', 'body', 'project', 'post', 'finalize', 'notify', 'result'],
        deny: [],
        log: ['approval/asked  { kind: "bash", ... }', 'approval/decided  { allowed: true }', 'tool/call  bash({"command":"rm -rf build"})', 'tool/result  {"content":"…"}'],
        model: '用户批准一次；调用继续。审批记录同样进日志，事后可审计。'
      },
      deny: {
        label: '守卫拒绝',
        active: ['msg', 'call', 'present', 'pre', 'guard', 'project', 'post', 'finalize', 'notify', 'result'],
        deny: ['guard'],
        log: ['tool/call  bash({"command":"curl … | sh"})', 'tool/result  {"isError": true, "content": "Denied by policy"}'],
        model: '模型读到一条 isError 的结果和拒绝原因。工具主体没有执行。'
      },
      replace: {
        label: '结果被改写',
        active: ['msg', 'call', 'present', 'pre', 'guard', 'exec', 'body', 'project', 'post', 'finalize', 'notify', 'result'],
        deny: [],
        log: ['tool/call  read_file({"path":"big.log"})', 'tool/result  {"content":"[已折叠 12k 行] …"}'],
        model: '模型看到的是 post-execute 改写后的内容；原始结果仍可从工具内部或日志证据追溯。'
      },
      throw: {
        label: '执行抛错',
        active: ['msg', 'call', 'present', 'pre', 'guard', 'exec', 'body', 'finalize', 'notify', 'result'],
        deny: ['exec'],
        log: ['tool/call  bash({"command":"make"})', 'pipeline normalization → isError', 'tool/result  {"isError": true, "content": "spawn failed: ENOENT"}'],
        model: '异常没有让 step 消失；它被归一化成一条错误结果，模型可以据此改计划。'
      }
    }

    let sceneKey = 'normal'
    let selectedNode = 'pre'

    function renderPipe () {
      const scene = SCENES[sceneKey]
      pipeNodes.innerHTML = NODES.map(n => {
        let cls = 'pipe-node'
        if (scene.deny.includes(n.id)) cls += ' deny'
        else if (scene.active.includes(n.id)) cls += ' on'
        else cls += ' skip'
        if (n.id === selectedNode) cls += ' sel'
        return '<div class="' + cls + '" data-node="' + n.id + '" role="button" tabindex="0"><span class="pn">' + n.n + '</span>' + n.t + '</div>'
      }).join('')

      $('#pipeResult').innerHTML = '<span class="rh">本次场景 · ' + scene.label + '</span>' +
        '<pre>' + scene.log.map(l => escapeHtml(l)).join('\n') + '</pre>' +
        '<div style="margin-top:6px">模型看到：' + scene.model + '</div>'

      $$('.pipe-node', pipeNodes).forEach(el => {
        const go = () => { selectedNode = el.dataset.node; renderPipe() }
        el.addEventListener('click', go)
        el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go() } })
      })

      $('#pipeDetail').innerHTML = '<div class="ed-t">' + (NODES.find(n => n.id === selectedNode)?.n || '节点详情') + '</div>' + (DETAIL[selectedNode] || '点击上方任一节点。')
    }

    $$('#pipeScenarios .chip').forEach(btn => {
      btn.addEventListener('click', () => {
        sceneKey = btn.dataset.scene
        $$('#pipeScenarios .chip').forEach(b => b.classList.toggle('on', b === btn))
        renderPipe()
      })
    })
    renderPipe()
  }

  /* ============================================================
     LAB 05 · session log
     ============================================================ */
  const evtList = $('#evtList')
  if (evtList) {
    const EVENTS = [
      { seq: 1, type: 'turn/start', kind: 'log', note: '开 turn。它没有 trigger 字段；触发信息由随后进入的 user/message 批次表达。' },
      { seq: 2, type: 'system/message', kind: 'msg', role: 'system', text: 'You are dsh. 你是一个在仓库中工作的工程 agent…（渲染后的系统提示词）', op: 'append', note: '系统提示词作为 surface 的 0 号节点进入历史。第一条必须在 user/message 之前。' },
      { seq: 3, type: 'user/message', kind: 'msg', role: 'user', text: '把 README 的安装步骤改准确，并补上测试命令。', op: 'append', note: '来源是人工输入。注入上下文、目标续轮也会走 user/message，但用 source 区分。' },
      { seq: 4, type: 'assistant/message', kind: 'msg', role: 'assistant', text: '我先读一下 README，确认当前步骤。', tool: 'read_file({"path":"README.md"})', op: 'append', note: '内嵌精确的紧凑 stream；message 是组装后的内容。工具调用块随消息一起进入历史。' },
      { seq: 5, type: 'tool/call', kind: 'log', note: '执行前落日志。原始 arguments 字符串原样保存，不在这里解析。' },
      { seq: 6, type: 'tool/result', kind: 'msg', role: 'tool', text: '# DeepSeek Harness\n安装：pnpm install…（文件内容）', op: 'append', note: '一等公民的 tool 角色消息，带 toolCallId，与上一条 call 配对。' },
      { seq: 7, type: 'assistant/message', kind: 'msg', role: 'assistant', text: '安装步骤在第 24 行；我已改写，并在开发一节补上测试命令。', op: 'append', note: '第二次成功请求。每个成功调用都产生一个 assistant/message 锚点。' },
      { seq: 8, type: 'turn/end', kind: 'log', note: 'turn 干净结束。原因是结构化的 completed。' },
      { seq: 9, type: 'turn/start', kind: 'log', note: '第二轮开始。' },
      { seq: 10, type: 'compaction/summary', kind: 'msg', role: 'system', text: '【摘要】此前完成：读取 README、修订安装步骤、补充测试命令。保留关键文件路径与未决项。', op: 'replace', replace: [4, 7], note: '压缩不是删除历史：它追加一个带 replace 的 surface 节点，遮住 4–7。原始事件仍在日志里，transcript 仍能看到过程。' },
      { seq: 11, type: 'user/message', kind: 'msg', role: 'user', text: '继续，把 CI 里对应的检查也列出来。', op: 'append', note: '新一轮的用户输入。它看到的是摘要后的历史，而不是被遮住的原消息。' },
      { seq: 12, type: 'assistant/message', kind: 'msg', role: 'assistant', text: 'CI 里与本改动相关的是 typecheck、lint 与 snapshot…', op: 'append', note: '摘要之后的新回答。' },
      { seq: 13, type: 'turn/end', kind: 'log', note: '结束第二轮。' }
    ]

    let filter = 'all'
    let selectedSeq = 3
    let applyCompaction = true

    function visibleEvents () {
      if (filter === 'all') return EVENTS
      if (filter === 'msg') return EVENTS.filter(e => e.kind === 'msg')
      return EVENTS.filter(e => e.kind === 'log')
    }

    function derive () {
      let surface = []
      for (const e of EVENTS) {
        if (e.kind !== 'msg') continue
        if (e.op === 'replace') {
          if (!applyCompaction) continue
          const start = surface.findIndex(x => x.seq === e.replace[0])
          const end = surface.findIndex(x => x.seq === e.replace[1])
          if (start >= 0 && end >= start) surface.splice(start, end - start + 1, e)
          else surface.push(e)
        } else {
          surface.push(e)
        }
      }
      return surface
    }

    function renderLogs () {
      const list = visibleEvents()
      evtList.innerHTML = list.map(e => {
        const badge = e.op === 'replace' ? 'replace' : e.kind === 'msg' ? 'msg' : 'log'
        const bcls = e.op === 'replace' ? 'replace' : e.kind === 'msg' ? 'msg' : 'log'
        return '<div class="evt ' + (e.seq === selectedSeq ? 'sel' : '') + '" data-seq="' + e.seq + '" role="button" tabindex="0">' +
          '<span class="s">' + e.seq + '</span><span class="t">' + e.type + '</span><span class="b ' + bcls + '">' + badge + '</span>' +
          '</div>'
      }).join('') || '<div class="empty-state">这个过滤器下没有事件。</div>'

      $$('.evt', evtList).forEach(el => {
        const go = () => { selectedSeq = Number(el.dataset.seq); renderLogs() }
        el.addEventListener('click', go)
        el.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); go() } })
      })

      const e = EVENTS.find(x => x.seq === selectedSeq) || EVENTS[0]
      const modelVisible = e.kind === 'msg' && (e.op !== 'replace' || applyCompaction)
      $('#evtDetail').innerHTML = '<div class="ed-t">seq ' + e.seq + ' · ' + e.type + '</div>' +
        '<div style="margin-bottom:6px">' + (modelVisible ? '<span class="badge durable">进入模型历史</span>' : '<span class="badge live" style="background:var(--panel-3);color:var(--ink-4)">不进入模型历史</span>') +
        (e.op === 'replace' ? ' <span class="badge" style="background:var(--warm-soft);color:var(--warm)">surface replace ' + e.replace[0] + '–' + e.replace[1] + '</span>' : '') + '</div>' +
        escapeHtml(e.note)

      const msgs = derive()
      const chat = $('#chatView')
      chat.innerHTML = msgs.map(m => {
        const label = m.role === 'system' ? 'system' : m.role === 'user' ? 'user' : m.role === 'tool' ? 'tool' : 'assistant'
        return '<div class="msg ' + label + '"><span class="role">' + label + '</span><div class="tx">' + escapeHtml(m.text) + '</div>' +
          (m.tool ? '<div class="tx" style="margin-top:6px;color:var(--ink-4);font-family:var(--mono);font-size:10.5px">↳ ' + escapeHtml(m.tool) + '</div>' : '') +
          '</div>'
      }).join('')
      $('#msgCount').textContent = msgs.length + ' messages'
    }

    $$('[data-logfilter]').forEach(btn => {
      btn.addEventListener('click', () => {
        filter = btn.dataset.logfilter
        $$('[data-logfilter]').forEach(b => b.classList.toggle('on', b === btn))
        renderLogs()
      })
    })
    $('#applyCompaction')?.addEventListener('change', e => {
      applyCompaction = e.target.checked
      renderLogs()
    })
    renderLogs()
  }

  /* ============================================================
     LAB 06 · capability seams
     ============================================================ */
  const seamMenu = $('#seamMenu')
  if (seamMenu) {
    const SEAMS = {
      fs: {
        label: 'ctx.fs', def: 'dsh-fs', desc: '文件系统 provider 接缝。消费者只读文件抽象，不关心是本机、沙箱还是远端。',
        providers: { local: 'dsh-fs-local', sandbox: 'dsh-fs-sandbox', ssh: 'dsh-fs-ssh' },
        note: {
          local: '直接读写本机路径。写根仍由 sandbox policy 与工具策略约束。',
          sandbox: '写根与可读路径受沙箱策略约束；同一套 Read/Write/Edit 工具不改一行。',
          ssh: '文件操作发生在远端；路径是远端路径，凭据由 SSH 连接 owner 管理。'
        },
        consumers: ['tool-fs', 'fs-observation-policy', 'tool-bash（间接）', 'system-prompt（文件上下文）']
      },
      subprocess: {
        label: 'ctx.subprocess', def: 'dsh-subprocess', desc: '进程树与取消的接缝。Bash、PTY、LSP、外部子代理都建立在它之上。',
        providers: { local: 'dsh-subprocess-local', ssh: 'dsh-subprocess-ssh' },
        note: {
          local: '本机 spawn 进程树；取消沿进程树传播。',
          ssh: '在远端执行；本机只保留连接与结果通道。'
        },
        consumers: ['bash-local', 'bash-sandbox', 'terminal-bash', 'lsp-stdio', 'subagent-codex', 'subagent-claude-code']
      },
      sandbox: {
        label: 'ctx.sandbox', def: 'dsh-sandbox', desc: '进程约束接缝。消费者在 spawn 前包装 argv，而不是自己实现隔离。',
        providers: { local: 'dsh-sandbox-local', bwrap: 'bwrap', landlock: 'Landlock', seatbelt: 'Seatbelt', ssh: 'dsh-sandbox-ssh' },
        note: {
          local: '不额外隔离，依赖权限预设与审批。',
          bwrap: 'Linux bubblewrap 命名空间隔离。',
          landlock: 'Linux Landlock 文件系统约束。',
          seatbelt: 'macOS Seatbelt sandbox profile。',
          ssh: '约束落在远端主机；本地只负责传输。'
        },
        consumers: ['bash-sandbox', 'terminal-bash', 'fs-sandbox', 'sandbox-policy']
      },
      llm: {
        label: 'ctx.llm', def: 'dsh-llm', desc: '模型适配器接缝：provider 注册实现，loop 与压缩只调用中性流服务。',
        providers: { deepseek: 'dsh-llm-deepseek', 'pi-ai': 'dsh-llm-pi-ai', replay: 'dsh-llm-replay' },
        note: {
          deepseek: '官方适配器；密钥与端点每次请求从设置/凭据解析，热轮换立即生效。',
          'pi-ai': '另一类 provider；请求扩展与鉴权走各自的 authorization flow。',
          replay: '测试用回放适配器；无密钥跑快照与确定性用例。'
        },
        consumers: ['agent-loop', 'compaction-basic', 'session-title']
      },
      subagents: {
        label: 'ctx.subagents', def: 'dsh-subagents', desc: '统一的委托激活 API；本地子 agent 与外部执行共用能力标志与 continuation。',
        providers: { spawn: 'dsh-subagent-spawn-in-process', fork: 'dsh-subagent-fork-in-process', acp: 'dsh-subagent-acp', codex: 'dsh-subagent-codex', claude: 'dsh-subagent-claude-code', sdk: 'dsh-subagent-dsh-sdk' },
        note: {
          spawn: '在同一进程里新建一个子 agent 与会话。',
          fork: '从父会话的已完成前缀剪辑出子会话。',
          acp: '通过 ACP 驱动外部实现。',
          codex: '委托给 Codex 进程。',
          claude: '委托给 Claude Code 进程。',
          sdk: '通过 SDK 在进程外创建子会话。'
        },
        consumers: ['tool-subagent', 'tool-subagent-control', 'tool-ralph', 'experimental-tool-agent-team']
      },
      persistence: {
        label: 'ctx.sessionPersistence', def: 'dsh-session-persistence', desc: '会话落盘接缝：create / open / stat / list / export 与写句柄生命周期。',
        providers: { jsonl: 'dsh-session-persistence-jsonl' },
        note: {
          jsonl: '每个会话一个 artifact；generation 文件不可改写，迁移以后继文件发布。'
        },
        consumers: ['agent-loop', 'session-query', 'hooks-claude-code', 'message-feedback', 'tool-bash（恢复检查）']
      }
    }

    let cap = 'fs'
    let provider = 'local'

    function renderSeam () {
      seamMenu.innerHTML = Object.entries(SEAMS).map(([k, v]) =>
        '<button class="seam-item ' + (k === cap ? 'on' : '') + '" data-cap="' + k + '" type="button"><code>' + v.label + '</code></button>'
      ).join('')

      const s = SEAMS[cap]
      const p = s.providers[provider] || Object.values(s.providers)[0]
      $('#seamRoles').innerHTML =
        '<div class="role-card def"><span class="rt">Definition</span><span class="rv">' + s.def + '</span><div class="rd">声明接口与生命周期契约</div></div>' +
        '<div class="role-card prov"><span class="rt">Provider</span><span class="rv">' + p + '</span><div class="rd">注册到同一 ctx key</div></div>' +
        '<div class="role-card cons"><span class="rt">Consumer</span><span class="rv">' + s.consumers.length + ' 个</span><div class="rd">只依赖定义</div></div>'

      $('#seamNote').innerHTML = '<h5>' + s.desc + '</h5>' +
        '<div class="row"><span>当前提供者</span><span><code>' + p + '</code> · ' + (s.note[provider] || Object.values(s.note)[0]) + '</span></div>' +
        '<div class="row"><span>消费者</span><span>' + s.consumers.map(c => '<span class="pill v">' + c + '</span>').join(' ') + '</span></div>' +
        '<div class="row"><span>换提供者</span><span>只改 profile 里的 provider 行；消费者、工具 schema、事件格式都不变。</span></div>'

      const controls = document.createElement('div')
      controls.className = 'controls'
      controls.style.marginTop = '10px'
      Object.entries(s.providers).forEach(([k, name]) => {
        const b = document.createElement('button')
        b.className = 'chip ' + (k === provider ? 'on' : '')
        b.type = 'button'
        b.innerHTML = name.replace('dsh-', '')
        b.addEventListener('click', () => { provider = k; renderSeam() })
        controls.appendChild(b)
      })
      const old = $('#seamNote').querySelector('.controls')
      if (old) old.remove()
      $('#seamNote').appendChild(controls)

      $$('.seam-item', seamMenu).forEach(el => {
        el.addEventListener('click', () => {
          cap = el.dataset.cap
          provider = Object.keys(SEAMS[cap].providers)[0]
          renderSeam()
        })
      })
    }

    function setWorld (world) {
      $$('#worldSwitch .world-btn').forEach(b => b.classList.toggle('on', b.dataset.world === world))
      if (world === 'local') { cap = 'fs'; provider = 'local' }
      if (world === 'sandbox') { cap = 'fs'; provider = 'sandbox' }
      if (world === 'ssh') { cap = 'fs'; provider = 'ssh' }
      renderSeam()
      if (world === 'ssh') toast('执行世界切到 SSH：fs 与 subprocess 的提供者同时改变')
      if (world === 'sandbox') toast('执行世界切到沙箱：写根与进程约束随 policy 改变')
      if (world === 'local') toast('执行世界回到本机')
    }

    $$('#worldSwitch .world-btn').forEach(b => b.addEventListener('click', () => setWorld(b.dataset.world)))
    renderSeam()
  }

  /* ============================================================
     LAB 07 · extension picker
     ============================================================ */
  const extGrid = $('#extGrid')
  if (extGrid) {
    const OPTIONS = [
      { id: 'llm', label: '新的模型提供者', tag: 'ctx.llm.register', h: '注册一个 LLM 适配器', mech: '在 <code>ctx.llm</code> 上注册适配器，实现流协议与 <code>prepareCall()</code> 的可绑定能力。',
        where: '独立的 provider 包，例如 <code>llm-&lt;name&gt;</code>；在 profile bundle 中插入一行。',
        verify: '真实 API e2e（provider 面），加适配器单测；确认取消、重试、用量与 reasoning 字段。',
        doc: 'docs/cookbook/adding-an-llm-adapter.md' },
      { id: 'tool', label: '模型能用的一种能力', tag: 'ctx.tools.register', h: '注册一个工具', mech: '定义 <code>ToolDefinition</code>（schema、execute、执行模式），通过 <code>ctx.tools.register()</code> 注册；需要时提供 presentCall/presentResult。',
        where: '工具包，通常 <code>tool-&lt;name&gt;</code>；schema 进入 prompt 装配。',
        verify: '执行器级测试（拒绝不可绕过）、结果上限、快照里的模型可见输出。',
        doc: 'docs/cookbook/adding-a-tool.md' },
      { id: 'prompt', label: '提示词里的一个段落', tag: 'ctx.systemPrompt', h: '贡献 prompt section', mech: '注册有序的提示词段与变量；装配结果最终成为 <code>system/message</code> 历史。',
        where: '拥有该领域知识的插件；不要让 UI 插件写业务提示词。',
        verify: '提示词快照；确认空渲染、系列切换与 compact 后的行为。',
        doc: 'docs/subsystems/system-prompt.md' },
      { id: 'preset', label: '某个会话的专属能力集', tag: 'agent preset', h: '按会话组合 agent', mech: '写 preset 的 <code>cordis.yml</code>；服务行需要 <code>isolate</code> realm，补丁应用在 <code>config.plugins</code> 内。',
        where: '<code>preset/</code> 或 profile 的 preset 声明。',
        verify: '两个会话并存的组合测试：A 有工具、B 没有；卸载后 A 的注册全部回卷。',
        doc: 'packages/preset/agent-preset/README.md' },
      { id: 'shell', label: '一种命令执行后端', tag: 'ctx.shell', h: '注册 shell 后端', mech: '实现 shell 执行接缝；本机实现通过 <code>ctx.subprocess</code> spawn。',
        where: '<code>shell/</code> 组；提供者包与工具包分离。',
        verify: '进程树/取消/超时测试；沙箱包装路径。',
        doc: 'docs/subsystems/shell.md' },
      { id: 'terminal', label: '持久终端', tag: 'ctx.terminals', h: '注册终端后端', mech: '实现 PTY 注册表与 owner 作用域的会话，再挂 <code>dsh-tool-terminal</code> 暴露给模型。',
        where: '<code>terminal/</code> 组。',
        verify: '屏幕恢复、并发 owner、进程清理。',
        doc: 'docs/subsystems/terminal.md' },
      { id: 'command', label: '一个人工命令', tag: 'ctx.commands', h: '注册人类命令', mech: '通过 <code>ctx.commands</code> 注册；命令分派不产生模型 turn，除非它显式投递消息。',
        where: '交互/命令插件；与工具不同，它面向人而不是模型。',
        verify: '命令解析、权限、无模型调用的路径。',
        doc: 'docs/subsystems/commands.md' },
      { id: 'job', label: '后台任务', tag: 'ctx.jobs', h: '接入后台作业', mech: '在 <code>ctx.jobs</code> 注册与管理作业；<code>job_*</code> 工具负责读取或停止。',
        where: '<code>jobs/</code> 组；执行后端可在本地或远端。',
        verify: '生命周期、日志边界、取消与 daemon 清理。',
        doc: 'docs/subsystems/jobs.md' },
      { id: 'subagent', label: '一种子代理后端', tag: 'ctx.subagents', h: '注册子代理提供者', mech: '实现 startActivation / prepareContinuable，声明能力标志；模型工具只依赖统一接口。',
        where: '<code>subagent/</code> 组，provider 包。',
        verify: '父子会话目录、深度限制、continuation、取消传播。',
        doc: 'docs/subsystems/subagent.md' },
      { id: 'webhook', label: '从外部事件启动会话', tag: 'ctx.webhookRuntime', h: '接入 webhook', mech: '注册受信任规则并挂 provider 适配器；外部事件转化为会话输入。',
        where: '<code>webhook/</code> 组。',
        verify: '鉴权、重放防护、失败可见性。',
        doc: 'docs/subsystems/webhook.md' },
      { id: 'persistence', label: '新的会话存储后端', tag: 'SessionPersistence', h: '实现会话持久化', mech: '实现 <code>create</code> / <code>open</code> / <code>stat</code> / <code>list</code> / <code>export</code>，复用共享句柄脚手架。',
        where: '<code>session/session-persistence-*</code>。',
        verify: '崩溃恢复、generation 选择、并发写拒绝、迁移边界。',
        doc: 'docs/subsystems/persistence.md' },
      { id: 'event', label: '新的持久状态', tag: 'SessionEventMap', h: '扩展会话事件', mech: '声明合并新增事件；需要改已有消息内容时注册纯 <code>SessionMessageProjection</code>；UI 从事件重建。',
        where: '拥有该状态的插件；不要往 core 里塞业务事件。',
        verify: '读端兼容（ignorable）、重放、投影、快照。',
        doc: 'docs/subsystems/session.md' },
      { id: 'ui', label: '一种新的会话卡片', tag: 'ConversationNodeDefinition', h: '注册 Chat 节点', mech: '注册节点定义与键渲染器；Host presenter 保持纯，Web 卡片从原始事件与结果元数据派生。',
        where: '<code>client/ui-*</code> 包。',
        verify: '回放一致性、窄屏布局、locale 文案、键盘可达。',
        doc: 'docs/cookbook/adding-a-tool.md' },
      { id: 'hook', label: '拦截请求或工具', tag: 'agent/* · tools/*', h: '挂事件监听器', mech: '用 <code>agent/pre-step</code>、<code>agent/request</code>、<code>agent/request-error</code>、<code>agent/turn-stopping</code> 或 <code>tools/*</code>；waterfall 记得 <code>next()</code>。',
        where: '策略插件；不要把业务分支塞进 loop。',
        verify: '包装后字段保留、短路语义、执行器级拒绝测试。',
        doc: 'docs/event-producer-consumer.md' }
    ]

    let sel = 'tool'

    function renderExt () {
      extGrid.innerHTML = OPTIONS.map(o =>
        '<button class="ext ' + (o.id === sel ? 'on' : '') + '" data-ext="' + o.id + '" type="button">' + o.label + '<small>' + o.tag + '</small></button>'
      ).join('')
      const o = OPTIONS.find(x => x.id === sel)
      $('#extAnswer').innerHTML = '<h5>' + o.h + '</h5>' +
        '<div style="color:var(--ink-3);font-size:11px;margin-bottom:6px">' + o.tag + '</div>' +
        '<div class="row"><span>机制</span><span>' + o.mech + '</span></div>' +
        '<div class="row"><span>落点</span><span>' + o.where + '</span></div>' +
        '<div class="row"><span>验证</span><span>' + o.verify + '</span></div>' +
        '<div class="row"><span>阅读</span><span><code>' + o.doc + '</code></span></div>'
      $$('.ext', extGrid).forEach(el => el.addEventListener('click', () => { sel = el.dataset.ext; renderExt() }))
    }
    renderExt()
  }

  /* ============================================================
     APPENDIX A · package explorer
     ============================================================ */
  const pkgList = $('#pkgList')
  if (pkgList && Array.isArray(window.DSH_PACKAGES)) {
    const PKGS = window.DSH_PACKAGES.slice().sort((a, b) => (a.group + a.id).localeCompare(b.group + b.id))
    const groups = Array.from(new Set(PKGS.map(p => p.group))).sort()
    let query = ''
    let group = 'all'
    let shown = 40

    $('#pkgCount').textContent = PKGS.length
    $('#pkgGroups').innerHTML = '<button class="pkg-group on" data-group="all" type="button">全部 ' + PKGS.length + '</button>' +
      groups.map(g => {
        const n = PKGS.filter(p => p.group === g).length
        return '<button class="pkg-group" data-group="' + g + '" type="button">' + g + ' ' + n + '</button>'
      }).join('')

    function filtered () {
      const q = query.trim().toLowerCase()
      return PKGS.filter(p => (group === 'all' || p.group === group) &&
        (!q || (p.id + ' ' + p.name + ' ' + p.desc + ' ' + p.group).toLowerCase().includes(q)))
    }

    function renderPkgs (resetPage = false) {
      if (resetPage) shown = 40
      const list = filtered()
      const slice = list.slice(0, shown)
      pkgList.innerHTML = slice.length
        ? slice.map(p => '<div class="pkg">' +
            '<span class="pn">' + escapeHtml(p.id) + '<span class="pg">  · ' + escapeHtml(p.group) + '</span></span>' +
            '<button class="copy" type="button" data-path="' + escapeHtml(p.path) + '">复制路径</button>' +
            '<span class="pd">' + escapeHtml(p.desc) + '</span>' +
            '</div>').join('')
        : '<div class="empty-state">没有匹配的包。试试 group 过滤或更短的关键词。</div>'
      $('#pkgMore').style.display = list.length > shown ? 'inline-flex' : 'none'
      $('#pkgMore').textContent = '加载更多（' + Math.max(0, list.length - shown) + '）'
      $$('.copy', pkgList).forEach(btn => btn.addEventListener('click', e => {
        e.stopPropagation()
        copyText(btn.dataset.path)
      }))
    }

    $('#pkgSearch')?.addEventListener('input', e => { query = e.target.value; renderPkgs(true) })
    $('#pkgMore')?.addEventListener('click', () => { shown += 40; renderPkgs() })
    $$('#pkgGroups .pkg-group').forEach(btn => btn.addEventListener('click', () => {
      group = btn.dataset.group
      $$('#pkgGroups .pkg-group').forEach(b => b.classList.toggle('on', b === btn))
      renderPkgs(true)
    }))
    renderPkgs()
  }

  /* ============================================================
     PATH · checklists + notes
     ============================================================ */
  const weeks = $('#weeks')
  if (weeks) {
    const tasks = $$('input[data-task]', weeks)
    const notes = $$('textarea[data-notes]', weeks)

    tasks.forEach(t => {
      t.checked = !!state.tasks[t.dataset.task]
      t.addEventListener('change', () => {
        state.tasks[t.dataset.task] = t.checked
        if (!t.checked) delete state.tasks[t.dataset.task]
        save()
        updatePath()
      })
    })
    notes.forEach(n => {
      n.value = state.notes[n.dataset.notes] || ''
      let timer = null
      n.addEventListener('input', () => {
        clearTimeout(timer)
        timer = setTimeout(() => { state.notes[n.dataset.notes] = n.value; save() }, 300)
      })
    })

    function updatePath () {
      const done = tasks.filter(t => t.checked).length
      const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0
      const ring = $('#pathRing')
      if (ring) { ring.style.setProperty('--p', pct); ring.dataset.label = pct + '%' }
      const d = $('#pathDone'); if (d) d.textContent = done
      const t = $('#pathTotal'); if (t) t.textContent = tasks.length
      const hint = $('#pathHint')
      if (hint) {
        hint.textContent = pct === 100 ? '全部完成。接下来：把笔记整理成一篇设计说明。'
          : pct >= 50 ? '已经过半。优先做完“能改”的练习，再读产品面。'
          : pct > 0 ? '保持节奏；每一周都要有一个可验收的产出。'
          : '从第一周开始；完成一项就勾一项。'
      }
    }

    $$('.week-head', weeks).forEach(head => {
      head.addEventListener('click', () => head.parentElement.classList.toggle('open'))
    })
    $('#pathExpand')?.addEventListener('click', e => {
      const open = !e.currentTarget.dataset.all
      e.currentTarget.dataset.all = open ? '1' : ''
      $$('.week', weeks).forEach(w => w.classList.toggle('open', open))
      e.currentTarget.textContent = open ? '全部收起' : '全部展开'
    })
    updatePath()
  }

  function exportNotes () {
    const lines = []
    lines.push('# DeepSeek Harness 学习笔记')
    lines.push('')
    lines.push('导出时间：' + new Date().toLocaleString('zh-CN'))
    lines.push('快照：v0.2.1-rc.3 · 22ddee3792')
    lines.push('')
    lines.push('## 章节完成情况')
    lines.push('')
    chapters.forEach(c => {
      const title = c.querySelector('h2')?.textContent || c.id
      lines.push('- [' + (state.done[c.id] ? 'x' : ' ') + '] ' + title)
    })
    lines.push('')
    lines.push('## 四周学习路线')
    lines.push('')
    ;['w1', 'w2', 'w3', 'w4'].forEach(w => {
      const week = document.querySelector('.week[data-week="' + w + '"]')
      if (!week) return
      lines.push('### ' + (week.querySelector('.week-head b')?.textContent || w))
      lines.push('')
      $$('input[data-task^="' + w + '"]', week).forEach(t => {
        const span = t.parentElement?.querySelector('span')
        let label = t.dataset.task
        if (span) {
          const clone = span.cloneNode(true)
          clone.querySelector('.why')?.remove()
          label = clone.textContent.replace(/\s+/g, ' ').trim()
        }
        lines.push('- [' + (t.checked ? 'x' : ' ') + '] ' + label)
      })
      const note = state.notes[w]
      if (note) { lines.push(''); lines.push('笔记：'); lines.push(''); lines.push(note) }
      lines.push('')
    })
    const answered = Object.keys(state.quiz).length
    if (answered) {
      lines.push('## 自测')
      lines.push('')
      lines.push('已作答 ' + answered + ' 题。')
      lines.push('')
    }
    lines.push('---')
    lines.push('')
    lines.push('由 learn-harness 手册导出。事实以仓库 docs/ 为准。')

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'dsh-learning-notes.md'
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
    toast('已导出 dsh-learning-notes.md')
  }

  $('#exportBtn')?.addEventListener('click', exportNotes)
  $('#resetBtn')?.addEventListener('click', () => {
    if (!window.confirm('清空学习进度、路线勾选与笔记？此操作不可撤销。')) return
    try { localStorage.removeItem(KEY) } catch { /* ignore */ }
    location.reload()
  })

  /* ============================================================
     QUIZ
     ============================================================ */
  const quizEl = $('#quiz')
  if (quizEl) {
    const QUESTIONS = [
      {
        q: '一次 step 指的是什么？',
        options: ['从用户发消息到收到回复的整段过程', '一次模型请求加上它请求的工具执行', '一个工具的完整生命周期', '一次会话从创建到销毁'],
        answer: 1,
        why: 'step 以 step/start / step/end 界定，包含一次模型请求及该请求触发的工具。turn 才是零个或多个 step 的容器；重试不另开 step。'
      },
      {
        q: '下面哪个是 live 事件，而不是持久会话事件？',
        options: ['turn/start', 'tool/result', 'agent/status', 'assistant/message'],
        answer: 2,
        why: 'agent/status 只用于实时协调与 UI，不写日志。turn/start、tool/result、assistant/message 都是可重放的持久事件。例外是 agent/inbox/spliced：它为了让 inbox 冷读可重建而持久化。'
      },
      {
        q: '系统提示词最终如何进入模型请求？',
        options: ['作为请求里独立的 system 字段', '作为 system/message 历史节点，与消息一起派生', '作为工具 schema 的一部分', '由适配器每次临时拼接，不进日志'],
        answer: 1,
        why: '请求只包含 header.config、deriveMessages() 与 header.tools，没有独立 system 字段。渲染后的提示词以 system/message 进入 surface，因此可重放。'
      },
      {
        q: '一个 turn 在流式输出中途被取消，已经显示给用户的文本会怎样？',
        options: ['全部丢弃，下一次重新生成', '以 assistant/message 且 interrupted: true 落定，保留已交付前缀', '只留在内存里，不写日志', '转成 assistant/attempt，完全不进历史'],
        answer: 1,
        why: '取消是协作式的。已交付前缀要进入下一次请求，所以以 interrupted: true 的 assistant/message 落定；未派发的工具调用补合成结果。assistant/attempt 用于没有提交 surface 消息的失败尝试。'
      },
      {
        q: '压缩（compaction）如何影响会话日志？',
        options: ['删除被摘要的旧事件，缩小文件', '追加一个带 replace surfaceOp 的事件，遮住一段节点', '直接改写旧消息的内容', '创建新的 generation 并删除旧的'],
        answer: 1,
        why: '日志 append-only。压缩追加事件，用 replace 遮蔽 surface 上的旧节点；原始事件仍在，所以 transcript 与审计完整，而模型历史看到摘要。'
      },
      {
        q: '要让模型多一种能力，首选放在哪里？',
        options: ['修改 agent-loop 的 turn 逻辑', '在 ctx.tools 注册一个工具', '在 system prompt 里写死说明', '在 Web 客户端加一个按钮'],
        answer: 1,
        why: '模型能力通过工具暴露：注册到 ctx.tools，schema 自动进入提示词装配。只有改变循环本身才应该碰 agent-loop，并且要更新架构文档。'
      },
      {
        q: '一个完整的能力接缝必须包含哪些角色？',
        options: ['配置、默认值、测试', 'Service Definition、Service Provider、Consumer', 'Host、Client、Remote', 'Tool、Executor、Presenter'],
        answer: 1,
        why: '接缝是三角色齐备的可替换能力。一个包可以兼任多个角色，但只有其中一个角色不构成接缝。SSH 能同时替换 fs/subprocess/sandbox 的提供者，就是这个结构的效果。'
      },
      {
        q: 'waterfall 监听器如果不调用 next()，会发生什么？',
        options: ['什么都不会发生，自动委托', '短路整条链，下游监听器不再运行', '抛出一个运行时错误', '只会跳过当前监听器'],
        answer: 1,
        why: 'waterfall 是 around-middleware：调用 next() 才委托下游。只观察的监听器必须委托；想独占决策的监听器则明确不调用，但两者不能靠猜。'
      },
      {
        q: '工具调用被守卫拒绝后，模型会看到什么？',
        options: ['什么都没有，模型等下一次用户输入', '一条 isError 的 tool/result，带拒绝原因', '一个 UI toast，模型不可见', 'assistant/attempt，表示请求失败'],
        answer: 1,
        why: '拒绝也走完管线并产生 tool/result。call/result 必须配对，否则后续请求会面对悬空历史；模型需要读到拒绝原因才能改计划。'
      },
      {
        q: '哪条命令可以直接看到某个 profile 最终装配出的插件树？',
        options: ['dsh --profile web --help', 'dsh --profile web --dump-config', 'pnpm run build:check', 'dsh plugin list'],
        answer: 1,
        why: '--dump-config 打印组合后的配置树；--dump-default-config 去掉用户层与 --patch。调试“插件为什么没生效”时先看它。'
      }
    ]

    let answered = 0
    let correct = 0

    function score () {
      answered = 0
      correct = 0
      QUESTIONS.forEach((q, i) => {
        const v = state.quiz[i]
        if (v === undefined) return
        answered++
        if (v === q.answer) correct++
      })
      const el = $('#quizScore')
      if (el) el.textContent = answered ? '得分：' + correct + ' / ' + QUESTIONS.length + '（已答 ' + answered + '）' : '得分：—'
    }

    function renderQuiz () {
      quizEl.innerHTML = QUESTIONS.map((q, i) => {
        const chosen = state.quiz[i]
        return '<div class="q ' + (chosen === undefined ? '' : chosen === q.answer ? 'correct' : 'wrong') + (chosen === undefined ? '' : ' revealed') + '" data-q="' + i + '">' +
          '<div class="qh"><span class="qn">' + String(i + 1).padStart(2, '0') + '</span><span>' + escapeHtml(q.q) + '</span></div>' +
          q.options.map((o, oi) =>
            '<label><input type="radio" name="q' + i + '" value="' + oi + '"' + (chosen === oi ? ' checked' : '') + '><span>' + escapeHtml(o) + '</span></label>'
          ).join('') +
          '<div class="explain"><b>解释：</b>' + q.why + '</div>' +
          '</div>'
      }).join('')

      $$('.q input', quizEl).forEach(inp => {
        inp.addEventListener('change', () => {
          const qi = Number(inp.closest('.q').dataset.q)
          state.quiz[qi] = Number(inp.value)
          save()
          const q = inp.closest('.q')
          q.classList.add('revealed')
          q.classList.remove('correct', 'wrong')
          q.classList.add(Number(inp.value) === QUESTIONS[qi].answer ? 'correct' : 'wrong')
          score()
        })
      })
      score()
    }

    $('#quizReset')?.addEventListener('click', () => {
      state.quiz = {}
      save()
      renderQuiz()
      toast('已重置自测')
    })
    renderQuiz()
  }

  /* ---------------- small polish ---------------- */
  // make code blocks copyable on double click
  $$('pre').forEach(pre => {
    pre.title = '双击复制'
    pre.addEventListener('dblclick', () => copyText(pre.innerText))
  })

  // close search on backdrop click
  dialog?.addEventListener('click', e => {
    if (e.target === dialog) dialog.close()
  })

  // hash navigation keeps a little breathing room
  window.addEventListener('hashchange', () => {
    const el = document.getElementById(location.hash.slice(1))
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
})()
