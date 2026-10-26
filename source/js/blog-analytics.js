(function () {
  'use strict';
  let activeArticleId = null, activeSessionId = null, startedAt = 0, maxScrollDepth = 0;
  let heartbeatTimer = null, completionSent = false;
  const apiBase = () => String(window.__BLOG_API_BASE__ || '').replace(/\/$/, '');
  const articleId = () => document.querySelector('meta[name="article-id"]')?.content || '';
  const storageId = (storage, key) => {
    let value = storage.getItem(key);
    if (!value) {
      value = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      storage.setItem(key, value);
    }
    return value;
  };
  const formatNumber = (value) => Number(value || 0).toLocaleString('zh-CN');
  const localDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const formatDuration = (seconds) => {
    const value = Number(seconds || 0);
    if (value < 3600) return `${formatNumber(Math.floor(value / 60))} 分钟`;
    return `${formatNumber(Math.floor(value / 3600))} 小时`;
  };

  async function loadSiteAnalytics() {
    const target = document.querySelector('[data-site-analytics]'), base = apiBase();
    if (!target || !base) return;
    const today = localDate(new Date());
    const request = (from, to) => fetch(`${base}/api/v1/analytics/site-summary?${new URLSearchParams({ from, to })}`, { headers: { Accept: 'application/json' } })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('site analytics failed')))
      .then((body) => body.data || body);
    try {
      const [total, daily] = await Promise.all([request('2000-01-01', today), request(today, today)]);
      target.querySelector('[data-site-page-views]').textContent = formatNumber(total.pageViews);
      target.querySelector('[data-site-reading-time]').textContent = formatDuration(total.readingSeconds);
      target.querySelector('[data-site-today-views]').textContent = formatNumber(daily.pageViews);
      target.hidden = false;
    } catch (_) { /* optional */ }
  }

  async function loadHomepageAnalytics() {
    const cards = Array.from(document.querySelectorAll('[data-analytics-article-id]'));
    const base = apiBase();
    if (!cards.length || !base) return;
    const ids = [...new Set(cards.map((card) => card.dataset.analyticsArticleId).filter(Boolean))];
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 3000);
    try {
      const query = new URLSearchParams({ articleIds: ids.join(',') });
      const response = await fetch(`${base}/api/v1/analytics/pages?${query}`, { headers: { Accept: 'application/json' }, signal: controller.signal });
      if (!response.ok) return;
      const body = await response.json();
      const summaries = new Map((body.data?.items || body.items || []).map((item) => [item.articleId, item]));
      cards.forEach((card) => {
        const summary = summaries.get(card.dataset.analyticsArticleId);
        const target = card.querySelector('[data-analytics-views]');
        if (summary && target) { target.textContent = `${formatNumber(summary.pageViews)} 次阅读`; target.hidden = false; }
      });
    } catch (_) { /* optional */ } finally { window.clearTimeout(timeout); }
  }

  async function loadArticleAnalytics(id) {
    const target = document.querySelector('[data-article-analytics]'), base = apiBase();
    if (!target || !id || !base) return;
    const controller = new AbortController(), timeout = window.setTimeout(() => controller.abort(), 3000);
    try {
      const response = await fetch(`${base}/api/v1/analytics/pages/${encodeURIComponent(id)}`, { headers: { Accept: 'application/json' }, signal: controller.signal });
      if (!response.ok) return;
      const body = await response.json(), summary = body.data || body;
      if (!summary || summary.articleId !== id) return;
      target.querySelector('[data-analytics-page-views]').textContent = formatNumber(summary.pageViews);
      target.querySelector('[data-analytics-unique-visitors]').textContent = formatNumber(summary.uniqueVisitors);
      target.querySelector('[data-analytics-valid-reads]').textContent = formatNumber(summary.validReads);
      target.querySelector('[data-analytics-reading-seconds]').textContent = formatNumber(summary.readingSeconds);
      target.hidden = false;
    } catch (_) { /* optional */ } finally { window.clearTimeout(timeout); }
  }

  function updateScrollDepth() {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollable > 0) maxScrollDepth = Math.max(maxScrollDepth, Math.min(1, window.scrollY / scrollable));
  }

  function sendReadingEvent(event) {
    const base = apiBase();
    if (!activeArticleId || !activeSessionId || !base) return;
    fetch(`${base}/api/v1/analytics/events`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, keepalive: true,
      body: JSON.stringify({ articleId: activeArticleId, visitorId: storageId(localStorage, 'pfablog_visitor_id'), pagePath: location.pathname, event, sessionId: activeSessionId, durationSeconds: Math.floor((Date.now() - startedAt) / 1000), scrollDepth: maxScrollDepth, occurredAt: new Date().toISOString() })
    }).catch(() => {});
  }

  async function trackArticleView() {
    const id = articleId(), base = apiBase();
    if (!id || !base) return;
    activeArticleId = id; activeSessionId = storageId(sessionStorage, 'pfablog_session_id'); startedAt = Date.now(); maxScrollDepth = 0; completionSent = false;
    if (heartbeatTimer) window.clearInterval(heartbeatTimer);
    try {
      await fetch(`${base}/api/v1/analytics/events`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, keepalive: true, body: JSON.stringify({ articleId: id, visitorId: storageId(localStorage, 'pfablog_visitor_id'), pagePath: location.pathname, event: 'page_view', sessionId: activeSessionId, durationSeconds: 0, scrollDepth: 0, occurredAt: new Date().toISOString() }) });
    } catch (_) { /* optional */ }
    loadArticleAnalytics(id);
    heartbeatTimer = window.setInterval(() => { updateScrollDepth(); sendReadingEvent('reading_heartbeat'); if (!completionSent && Date.now() - startedAt >= 10000 && maxScrollDepth >= 0.5) { completionSent = true; sendReadingEvent('reading_complete'); } }, 10000);
  }

  document.addEventListener('DOMContentLoaded', () => { loadHomepageAnalytics(); loadSiteAnalytics(); trackArticleView(); window.addEventListener('scroll', updateScrollDepth, { passive: true }); });
  document.addEventListener('pjax:complete', () => { loadHomepageAnalytics(); loadSiteAnalytics(); trackArticleView(); updateScrollDepth(); });
})();
