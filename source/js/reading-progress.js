/**
 * 赛博科技风格 - 阅读进度条
 * 在文章页面顶部显示渐变色阅读进度指示
 */

(function() {
  'use strict';

  // 仅在文章页面执行
  const isPost = document.querySelector('.post') !== null;
  if (!isPost) return;

  // 创建进度条元素
  const progressBar = document.createElement('div');
  progressBar.className = 'reading-progress-bar';
  progressBar.style.width = '0%';
  document.body.appendChild(progressBar);

  // 更新进度
  function updateProgress() {
    const article = document.querySelector('#article-container') || document.querySelector('.post');
    if (!article) return;

    const articleTop = article.offsetTop;
    const articleHeight = article.offsetHeight;
    const windowHeight = window.innerHeight;
    const scrollTop = window.scrollY;

    // 计算阅读进度
    const start = articleTop - windowHeight / 2;
    const end = articleTop + articleHeight - windowHeight / 2;
    const progress = Math.max(0, Math.min(100, ((scrollTop - start) / (end - start)) * 100));

    progressBar.style.width = progress + '%';
  }

  // 监听滚动
  let ticking = false;
  window.addEventListener('scroll', function() {
    if (!ticking) {
      window.requestAnimationFrame(function() {
        updateProgress();
        ticking = false;
      });
      ticking = true;
    }
  });

  // 初始化
  updateProgress();

})();
