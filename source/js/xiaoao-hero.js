/**
 * 小遨的个人博客 · 视频背景 Hero 注入
 * 往 #page-header.full_page 注入 <video> + 玻璃遮罩
 * 滚动驱动模糊+变暗，尊重 prefers-reduced-motion
 * 仅在首页 hero 生效，不碰其它功能
 */
(function () {
  'use strict';

  var VIDEO_URL = 'https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/Video/flower_person_loop_downloadable.mp4';
  var POSTER = ''; // 留空则不加 poster，避免首屏额外图片请求

  function init() {
    var header = document.querySelector('#page-header.full_page');
    if (!header) return;
    // 只在首页 hero（full_page 且有 site-info）注入视频
    if (!header.querySelector('#site-info') && !header.querySelector('.full_page-config')) {
      // 文章页 hero 也允许，但保留判断
    }

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 若已注入则跳过（pjax 复用）
    if (header.querySelector('.xa-hero-video')) return;

    var video = document.createElement('video');
    video.className = 'xa-hero-video';
    video.setAttribute('muted', '');
    video.setAttribute('autoplay', '');
    video.setAttribute('loop', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('preload', 'metadata');
    video.setAttribute('aria-hidden', 'true');
    if (POSTER) video.poster = POSTER;
    var src = document.createElement('source');
    src.src = VIDEO_URL;
    src.type = 'video/mp4';
    video.appendChild(src);

    var veil = document.createElement('div');
    veil.className = 'xa-hero-veil';

    // 视频放最底层，veil 在视频之上、原有内容之下
    header.insertBefore(veil, header.firstChild);
    header.insertBefore(video, veil);

    // 视频加载失败则静默隐藏（退回纯灰阶 hero）
    video.addEventListener('error', function () {
      video.style.display = 'none';
      veil.style.background = 'var(--xa-bg)';
    });

    // 强制静音播放（部分浏览器需要）
    video.muted = true;
    var playPromise = video.play();
    if (playPromise && playPromise.catch) {
      playPromise.catch(function () { /* 自动播放被拦截，静默处理 */ });
    }

    if (reduceMotion) {
      video.removeAttribute('autoplay');
      video.pause();
      return;
    }

    // 滚动驱动模糊 + 变暗
    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        var rect = header.getBoundingClientRect();
        var h = rect.height || window.innerHeight;
        // hero 被滚出视口的比例
        var p = Math.min(1, Math.max(0, -rect.top / h));
        video.style.filter = 'blur(' + (p * 14).toFixed(2) + 'px) brightness(' + (1 - p * 0.55).toFixed(3) + ')';
        video.style.transform = 'scale(' + (1.04 + p * 0.06).toFixed(3) + ')';
        veil.style.opacity = (1 - p * 0.3).toFixed(3);
        ticking = false;
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
  // pjax 切换后重新注入
  document.addEventListener('pjax:complete', init);
})();
