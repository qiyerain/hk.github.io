/* ============================================================
   小遨的个人博客 · 全站共享脚本
   提供：主题切换、顶栏收缩、目录树抽屉、滚动揭幕
   各页在 <body> 末尾 <script src="common.js"></script> 即可
   ============================================================ */

/* ---------- 主题 ---------- */
window.XA = window.XA || {};
XA.initTheme = function(){
  var stored;
  try { stored = localStorage.getItem('xa-theme'); } catch(e){}
  var prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  var initial = (stored === 'light' || stored === 'dark') ? stored : (prefersLight ? 'light' : 'dark');
  document.documentElement.setAttribute('data-theme', initial);
  var btn = document.getElementById('themeToggle');
  if (btn){
    btn.addEventListener('click', function(){
      var cur = document.documentElement.getAttribute('data-theme') || 'dark';
      var next = cur === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('xa-theme', next); } catch(e){}
    });
  }
  var mq = window.matchMedia('(prefers-color-scheme: light)');
  mq.addEventListener && mq.addEventListener('change', function(e){
    var picked;
    try { picked = localStorage.getItem('xa-theme'); } catch(_){}
    if (!picked) document.documentElement.setAttribute('data-theme', e.matches ? 'light' : 'dark');
  });
};

/* ---------- 顶栏收缩 ---------- */
XA.initNavShrink = function(){
  var nav = document.getElementById('nav');
  if (!nav) return;
  var on = function(){ nav.classList.toggle('shrunk', window.scrollY > 80); };
  window.addEventListener('scroll', on, {passive:true});
  on();
};

/* ---------- 目录树抽屉 ---------- */
XA.initDirDrawer = function(){
  var drawer = document.getElementById('dirDrawer');
  if (!drawer) return;
  var backdrop = document.getElementById('drawerBackdrop');
  var open = function(){ drawer.classList.add('open'); if(backdrop) backdrop.classList.add('open'); drawer.setAttribute('aria-hidden','false'); };
  var close = function(){ drawer.classList.remove('open'); if(backdrop) backdrop.classList.remove('open'); drawer.setAttribute('aria-hidden','true'); };
  var dirBtn = document.getElementById('dirBtn');
  var dirMiniMore = document.getElementById('dirMiniMore');
  var dirClose = document.getElementById('dirClose');
  var dirFoot = drawer.querySelector('.dir-drawer-foot');
  if (dirBtn) dirBtn.addEventListener('click', open);
  if (dirMiniMore) dirMiniMore.addEventListener('click', open);
  if (dirClose) dirClose.addEventListener('click', close);
  if (dirFoot) dirFoot.addEventListener('click', function(){ window.location.href = 'archive.html#dir'; });
  if (backdrop) backdrop.addEventListener('click', close);
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape') close(); });

  /* 抽屉内树折叠 */
  drawer.querySelectorAll('.folder').forEach(function(f){
    f.addEventListener('click', function(e){
      e.stopPropagation();
      var li = f.closest('li'); if (!li) return;
      li.classList.toggle('open');
      f.classList.toggle('open');
    });
  });
};

/* ---------- 滚动揭幕 ---------- */
XA.initReveal = function(){
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if (en.isIntersecting){ en.target.classList.add('is-in'); io.unobserve(en.target); }
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal, .reveal-stagger').forEach(function(el){ io.observe(el); });
};

/* ---------- 一键初始化 ---------- */
XA.initAll = function(){
  XA.initTheme();
  XA.initNavShrink();
  XA.initDirDrawer();
  XA.initReveal();
};

document.addEventListener('DOMContentLoaded', XA.initAll);
