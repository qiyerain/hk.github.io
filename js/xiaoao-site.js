(function () {
  'use strict';

  function init() {
    initNavigationGlassState();

    var themeButton = document.querySelector('#theme_button .darkmode_switchbutton');
    if (themeButton && !themeButton.dataset.xaBound) {
      themeButton.dataset.xaBound = 'true';
      themeButton.addEventListener('click', function (event) {
        event.preventDefault();
        var nativeToggle = document.getElementById('darkmode');
        if (nativeToggle) nativeToggle.click();
      });
    }

    document.querySelectorAll('.xa-month-toggle').forEach(function (button) {
      if (button.dataset.xaBound) return;
      button.dataset.xaBound = 'true';
      button.addEventListener('click', function () {
        var posts = button.nextElementSibling;
        var expanded = button.getAttribute('aria-expanded') !== 'false';
        button.setAttribute('aria-expanded', String(!expanded));
        if (posts) posts.hidden = expanded;
      });
    });

    document.querySelectorAll('[data-copy-target]').forEach(function (button) {
      if (button.dataset.xaBound) return;
      button.dataset.xaBound = 'true';
      button.addEventListener('click', function () {
        var target = document.querySelector(button.dataset.copyTarget);
        if (!target) return;
        navigator.clipboard.writeText(target.textContent.trim()).then(function () {
          button.textContent = '已复制';
          window.setTimeout(function () { button.textContent = '复制'; }, 1600);
        });
      });
    });

    buildReadingToc();
    initAlbumPagination();
  }

  function initNavigationGlassState() {
    if (window.__xaNavGlassCleanup) window.__xaNavGlassCleanup();
    var body = document.body;
    var homeHeader = document.querySelector('#page-header.full_page');
    var frameRequested = false;
    var sync = function () {
      frameRequested = false;
      var isHome = Boolean(homeHeader);
      body.classList.toggle('xa-home-context', isHome);
      body.classList.toggle('xa-nav-elevated', !isHome || window.scrollY > 48);
    };
    var requestSync = function () {
      if (frameRequested) return;
      frameRequested = true;
      window.requestAnimationFrame(sync);
    };
    window.addEventListener('scroll', requestSync, { passive: true });
    sync();
    window.__xaNavGlassCleanup = function () {
      window.removeEventListener('scroll', requestSync);
      window.__xaNavGlassCleanup = null;
    };
  }

  function buildReadingToc() {
    if (window.__xaReadingTocCleanup) window.__xaReadingTocCleanup();
    var list = document.getElementById('xa-reading-toc__list');
    var article = document.getElementById('article-container');
    if (!list || !article) return;
    var indicator = list.querySelector('.xa-reading-toc__indicator');
    list.replaceChildren();
    if (indicator) list.appendChild(indicator);
    var headings = Array.prototype.slice.call(article.querySelectorAll('h2, h3'));
    if (!headings.length) {
      list.closest('.xa-reading-toc').hidden = true;
      return;
    }
    var controller = new AbortController();
    var signal = controller.signal;
    var toc = list.closest('.xa-reading-toc');
    var progress = toc.querySelector('[data-reading-progress]');
    var mobileProgress = document.querySelector('[data-mobile-reading-progress]');
    var trigger = document.querySelector('[data-toc-trigger]');
    var closeButton = toc.querySelector('[data-toc-close]');
    var backdrop = document.querySelector('[data-toc-backdrop]');
    var positions = [];
    var articleBottom = 0;
    var activeIndex = -1;
    var ticking = false;
    var resizeObserver = null;
    var mutationObserver = null;
    var alignHashUntil = window.location.hash ? Date.now() + 10000 : 0;
    var closeSheet = function () {
      document.body.classList.remove('xa-toc-open');
      trigger.setAttribute('aria-expanded', 'false');
      toc.setAttribute('aria-hidden', window.matchMedia('(max-width: 900px)').matches ? 'true' : 'false');
      if (document.activeElement && toc.contains(document.activeElement)) trigger.focus();
      window.requestAnimationFrame(recalculate);
    };
    var openSheet = function () {
      document.body.classList.add('xa-toc-open');
      trigger.setAttribute('aria-expanded', 'true');
      toc.setAttribute('aria-hidden', 'false');
      var activeLink = list.querySelector('.is-active') || list.querySelector('a');
      if (activeLink) window.setTimeout(function () { activeLink.focus(); }, 40);
    };
    var navigationOffset = function () {
      var nav = document.getElementById('nav');
      return Math.max(64, nav ? nav.offsetHeight : 0) + 16;
    };
    headings.forEach(function (heading, index) {
      if (!heading.id) heading.id = 'section-' + (index + 1);
      var link = document.createElement('a');
      link.href = '#' + encodeURIComponent(heading.id);
      link.textContent = heading.textContent;
      link.className = heading.tagName === 'H3' ? 'is-sub' : '';
      link.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        var navigate = function () {
          recalculate();
          var top = window.scrollY + heading.getBoundingClientRect().top - navigationOffset();
          window.history.pushState(null, '', '#' + encodeURIComponent(heading.id));
          alignHashUntil = Date.now() + 5000;
          window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
          activate(index, true);
        };
        if (window.matchMedia('(max-width: 900px)').matches) {
          closeSheet();
          window.requestAnimationFrame(navigate);
        } else {
          navigate();
        }
      }, { signal: signal });
      list.appendChild(link);
    });
    var links = Array.prototype.slice.call(list.querySelectorAll('a'));
    var activate = function (index, force) {
      if (!force && index === activeIndex) return;
      activeIndex = index;
      var active = links[index];
      if (!active) return;
      links.forEach(function (link, linkIndex) {
        var isActive = linkIndex === index;
        link.classList.toggle('is-active', isActive);
        if (isActive) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
      var value = String(index + 1).padStart(2, '0') + ' / ' + String(links.length).padStart(2, '0');
      if (progress) progress.textContent = value;
      if (mobileProgress) mobileProgress.textContent = value;
      window.requestAnimationFrame(function () {
        toc.style.setProperty('--toc-active-top', active.offsetTop + 'px');
        toc.style.setProperty('--toc-active-height', active.offsetHeight + 'px');
        toc.style.setProperty('--toc-active-opacity', '1');
        var target = active.offsetTop - ((list.clientHeight - active.offsetHeight) / 2);
        var maximum = Math.max(0, list.scrollHeight - list.clientHeight);
        list.scrollTo({ top: Math.max(0, Math.min(maximum, target)), behavior: 'smooth' });
      });
    };
    var recalculate = function () {
      positions = headings.map(function (heading) { return window.scrollY + heading.getBoundingClientRect().top; });
      articleBottom = window.scrollY + article.getBoundingClientRect().bottom;
      update();
    };
    var update = function () {
      ticking = false;
      var line = window.scrollY + navigationOffset();
      var index = 0;
      for (var i = 0; i < positions.length; i += 1) {
        if (positions[i] <= line + 1) index = i;
        else break;
      }
      if (window.scrollY + window.innerHeight >= articleBottom - 24) index = headings.length - 1;
      activate(index);
    };
    var requestUpdate = function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };
    var navigateToCurrentHash = function () {
      if (!window.location.hash) {
        requestUpdate();
        return;
      }
      var id;
      try { id = decodeURIComponent(window.location.hash.slice(1)); } catch (error) { id = window.location.hash.slice(1); }
      var target = headings.find(function (heading) { return heading.id === id; });
      if (!target) return;
      window.requestAnimationFrame(function () {
        var top = window.scrollY + target.getBoundingClientRect().top - navigationOffset();
        var previousBehavior = document.documentElement.style.scrollBehavior;
        document.documentElement.style.scrollBehavior = 'auto';
        window.scrollTo(0, Math.max(0, top));
        window.requestAnimationFrame(function () { document.documentElement.style.scrollBehavior = previousBehavior; });
        activate(headings.indexOf(target), true);
      });
    };
    var syncResponsiveState = function () {
      var mobile = window.matchMedia('(max-width: 900px)').matches;
      if (!mobile) {
        document.body.classList.remove('xa-toc-open');
        trigger.setAttribute('aria-expanded', 'false');
      }
      toc.setAttribute('aria-hidden', mobile && !document.body.classList.contains('xa-toc-open') ? 'true' : 'false');
      recalculate();
    };
    window.addEventListener('scroll', requestUpdate, { passive: true, signal: signal });
    window.addEventListener('resize', syncResponsiveState, { passive: true, signal: signal });
    window.addEventListener('hashchange', navigateToCurrentHash, { signal: signal });
    window.addEventListener('popstate', navigateToCurrentHash, { signal: signal });
    window.addEventListener('wheel', function () { alignHashUntil = 0; }, { passive: true, signal: signal });
    window.addEventListener('touchstart', function () { alignHashUntil = 0; }, { passive: true, signal: signal });
    article.querySelectorAll('img').forEach(function (image) {
      if (!image.complete) image.addEventListener('load', function () {
        recalculate();
        if (window.location.hash) navigateToCurrentHash();
      }, { once: true, signal: signal });
    });
    if ('ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(function () {
        window.requestAnimationFrame(function () {
          recalculate();
          if (window.location.hash && Date.now() < alignHashUntil) navigateToCurrentHash();
        });
      });
      resizeObserver.observe(article);
    }
    if ('MutationObserver' in window) {
      mutationObserver = new MutationObserver(function () {
        window.requestAnimationFrame(function () {
          recalculate();
          if (window.location.hash && Date.now() < alignHashUntil) navigateToCurrentHash();
        });
      });
      mutationObserver.observe(article, { subtree: true, attributes: true, attributeFilter: ['src', 'class', 'style'] });
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () {
      recalculate();
      if (window.location.hash) navigateToCurrentHash();
    });
    trigger.addEventListener('click', function () {
      if (document.body.classList.contains('xa-toc-open')) closeSheet();
      else openSheet();
    }, { signal: signal });
    closeButton.addEventListener('click', closeSheet, { signal: signal });
    backdrop.addEventListener('click', closeSheet, { signal: signal });
    document.addEventListener('keydown', function (event) {
      if (!document.body.classList.contains('xa-toc-open')) return;
      if (event.key === 'Escape') closeSheet();
      if (event.key !== 'Tab') return;
      var focusable = [closeButton].concat(links);
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }, { signal: signal });
    window.__xaReadingTocCleanup = function () {
      controller.abort();
      if (resizeObserver) resizeObserver.disconnect();
      if (mutationObserver) mutationObserver.disconnect();
      document.body.classList.remove('xa-toc-open');
      window.__xaReadingTocCleanup = null;
    };
    syncResponsiveState();
    window.setTimeout(function () { recalculate(); navigateToCurrentHash(); }, 80);
  }

  function initAlbumPagination() {
    var gallery = document.querySelector('[data-album-gallery]');
    var pagination = document.querySelector('[data-album-pagination]');
    if (!gallery || !pagination || gallery.dataset.paginationBound === 'true') return;
    gallery.dataset.paginationBound = 'true';
    var items = Array.prototype.slice.call(gallery.querySelectorAll('[data-album-item]'));
    var pageSize = Math.max(1, Number(gallery.dataset.pageSize) || 12);
    var pageCount = Math.max(1, Math.ceil(items.length / pageSize));
    var previous = pagination.querySelector('[data-album-prev]');
    var next = pagination.querySelector('[data-album-next]');
    var status = pagination.querySelector('[data-album-page-status]');
    var readPage = function () {
      var value = Number(new URL(window.location.href).searchParams.get('page')) || 1;
      return Math.min(pageCount, Math.max(1, value));
    };
    var render = function (page, updateHistory) {
      items.forEach(function (item, index) {
        item.hidden = index < (page - 1) * pageSize || index >= page * pageSize;
      });
      previous.disabled = page === 1;
      next.disabled = page === pageCount;
      status.textContent = '第 ' + page + ' / ' + pageCount + ' 页';
      if (updateHistory) {
        var url = new URL(window.location.href);
        if (page === 1) url.searchParams.delete('page');
        else url.searchParams.set('page', String(page));
        window.history.pushState({ albumPage: page }, '', url.pathname + url.search + url.hash);
      }
      window.requestAnimationFrame(function () {
        window.dispatchEvent(new Event('resize'));
      });
    };
    var current = readPage();
    pagination.hidden = pageCount <= 1;
    previous.addEventListener('click', function () {
      if (current <= 1) return;
      current -= 1;
      render(current, true);
      gallery.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    next.addEventListener('click', function () {
      if (current >= pageCount) return;
      current += 1;
      render(current, true);
      gallery.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    window.addEventListener('popstate', function () {
      current = readPage();
      render(current, false);
    });
    render(current, false);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  document.addEventListener('pjax:complete', init);
})();
