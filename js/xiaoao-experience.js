(function () {
  'use strict';

  var revealObserver;
  var heroFrame;
  var heroCleanup;

  function bindReveals(root) {
    var nodes = Array.prototype.slice.call((root || document).querySelectorAll('[data-reveal]:not([data-xa-reveal-bound])'));
    if (!nodes.length) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      nodes.forEach(function (node) { node.classList.add('is-revealed'); });
      return;
    }
    if (!revealObserver) {
      revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-revealed');
          revealObserver.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    }
    nodes.forEach(function (node, index) {
      node.dataset.xaRevealBound = 'true';
      node.style.transitionDelay = Math.min(index % 5, 4) * 70 + 'ms';
      revealObserver.observe(node);
    });
  }

  function bindGlass(root) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || window.matchMedia('(hover: none)').matches) return;
    (root || document).querySelectorAll('[data-glass-tilt]:not([data-xa-tilt-bound])').forEach(function (node) {
      node.dataset.xaTiltBound = 'true';
      node.addEventListener('pointermove', function (event) {
        var rect = node.getBoundingClientRect();
        var x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
        var y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
        node.style.setProperty('--glass-rx', ((.5 - y) * 4.5).toFixed(2) + 'deg');
        node.style.setProperty('--glass-ry', ((x - .5) * 5.5).toFixed(2) + 'deg');
        node.style.setProperty('--glass-x', (x * 100).toFixed(1) + '%');
        node.style.setProperty('--glass-y', (y * 100).toFixed(1) + '%');
      }, { passive: true });
      node.addEventListener('pointerleave', function () {
        node.style.setProperty('--glass-rx', '0deg');
        node.style.setProperty('--glass-ry', '0deg');
      });
    });
  }

  function bindBack(root) {
    (root || document).querySelectorAll('[data-xa-back]:not([data-xa-back-bound])').forEach(function (button) {
      button.dataset.xaBackBound = 'true';
      button.addEventListener('click', function () {
        var fallback = button.dataset.fallback || '/';
        var referrer;
        try { referrer = document.referrer ? new URL(document.referrer) : null; } catch (error) { referrer = null; }
        if (referrer && referrer.origin === window.location.origin && window.history.length > 1) window.history.back();
        else if (window.pjax) window.pjax.loadUrl(fallback);
        else window.location.assign(fallback);
      });
    });
  }

  function bindFriendFilters(root) {
    var scope = root || document;
    scope.querySelectorAll('[data-link-filter]:not([data-xa-filter-bound])').forEach(function (button) {
      button.dataset.xaFilterBound = 'true';
      button.addEventListener('click', function () {
        var filter = button.dataset.linkFilter;
        var container = button.closest('.xa-friends');
        if (!container) return;
        container.querySelectorAll('[data-link-filter]').forEach(function (item) {
          var active = item === button;
          item.classList.toggle('is-active', active);
          item.setAttribute('aria-pressed', String(active));
        });
        container.querySelectorAll('[data-link-category]').forEach(function (card) {
          card.hidden = filter !== 'all' && card.dataset.linkCategory !== filter;
        });
      });
    });
  }

  function bindLibrary(root) {
    var scope = root || document;
    scope.querySelectorAll('.xa-library__filter:not([data-xa-library-bound])').forEach(function (button) {
      button.dataset.xaLibraryBound = 'true';
      button.addEventListener('click', function () {
        var library = button.closest('.xa-library');
        if (!library) return;
        var open = !library.classList.contains('is-filter-open');
        library.classList.toggle('is-filter-open', open);
        button.setAttribute('aria-expanded', String(open));
      });
    });
    hydrateLibraryImages(scope);
  }

  function bindDirectoryToggles(root) {
    (root || document).querySelectorAll('.post-directory-nav .post-dir-toggle:not([data-xa-directory-toggle-bound])').forEach(function (toggle) {
      toggle.dataset.xaDirectoryToggleBound = 'true';
      toggle.addEventListener('click', function () {
        var node = toggle.closest('[data-dir-node]');
        var children = node && node.querySelector(':scope > .post-dir-children');
        if (!children) return;
        var open = toggle.getAttribute('aria-expanded') !== 'true';
        toggle.setAttribute('aria-expanded', String(open));
        children.hidden = !open;
      });
    });
  }

  function hydrateLibraryImages(root) {
    (root || document).querySelectorAll('.xa-library img[data-lazy-src]').forEach(function (image) {
      image.src = image.dataset.lazySrc;
      image.removeAttribute('data-lazy-src');
      image.classList.remove('lazyload');
    });
  }

  function bindImageFallbacks(root) {
    (root || document).querySelectorAll('img[data-xa-fallback]:not([data-xa-fallback-bound])').forEach(function (image) {
      image.dataset.xaFallbackBound = 'true';
      var useFallback = function () {
        var fallback = image.dataset.xaFallback;
        if (!fallback || image.dataset.xaFallbackUsed === 'true') return;
        image.dataset.xaFallbackUsed = 'true';
        image.src = fallback;
        image.removeAttribute('srcset');
        image.removeAttribute('data-lazy-src');
      };
      image.addEventListener('error', useFallback, { once: true });
      if (image.complete && image.naturalWidth === 0) useFallback();
    });
  }

  function bindProgressiveLists(root) {
    (root || document).querySelectorAll('[data-xa-progressive]:not([data-xa-progressive-bound])').forEach(function (container) {
      container.dataset.xaProgressiveBound = 'true';
      var button = container.querySelector('[data-xa-progressive-more]');
      if (!button) return;
      var items = Array.prototype.slice.call(container.querySelectorAll('[data-xa-progressive-item]'));
      var step = Math.max(1, Number(container.dataset.xaStep) || 8);
      var status = button.querySelector('[data-xa-progressive-status]');
      var update = function () {
        var visible = items.filter(function (item) { return !item.hidden; }).length;
        if (status) status.textContent = '已显示 ' + visible + ' / ' + items.length;
        if (visible >= items.length) button.hidden = true;
      };
      button.addEventListener('click', function () {
        var hidden = items.filter(function (item) { return item.hidden; }).slice(0, step);
        hidden.forEach(function (item) { item.hidden = false; });
        if (hidden[0]) hidden[0].querySelector('a').focus({ preventScroll: true });
        update();
      });
      update();
    });
  }

  function bindVariableProximity(root) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || window.matchMedia('(hover: none)').matches) return;
    (root || document).querySelectorAll('[data-variable-proximity]:not([data-xa-proximity-bound])').forEach(function (container) {
      container.dataset.xaProximityBound = 'true';
      var characters = Array.prototype.slice.call(container.querySelectorAll('.xa-variable-char'));
      var radius = Number(container.dataset.proximityRadius) || 150;
      var frame = 0;
      var pointerX = -9999;
      var pointerY = -9999;
      var render = function () {
        characters.forEach(function (character) {
          var rect = character.getBoundingClientRect();
          var dx = pointerX - (rect.left + rect.width / 2);
          var dy = pointerY - (rect.top + rect.height / 2);
          var strength = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / radius);
          character.style.setProperty('--vp-weight', String(Math.round(480 + strength * 360)));
          character.style.setProperty('--vp-lift', (-strength * 3.5).toFixed(2) + 'px');
          character.style.setProperty('--vp-scale', (1 + strength * .025).toFixed(3));
        });
        frame = 0;
      };
      var schedule = function () { if (!frame) frame = requestAnimationFrame(render); };
      container.addEventListener('pointermove', function (event) {
        pointerX = event.clientX;
        pointerY = event.clientY;
        schedule();
      }, { passive: true });
      container.addEventListener('pointerleave', function () {
        pointerX = -9999;
        pointerY = -9999;
        schedule();
      });
    });
  }

  function bindWechatPreview(root) {
    var scope = root || document;
    scope.querySelectorAll('[data-wechat-picks]:not([data-xa-picks-bound])').forEach(function (picks) {
      picks.dataset.xaPicksBound = 'true';
      var preview = picks.querySelector('.xa-wechat-preview');
      var image = preview && preview.querySelector('img');
      var title = preview && preview.querySelector('strong');
      var date = preview && preview.querySelector('time');
      if (!preview || !image) return;
      var activate = function (row) {
        if (!row || row.classList.contains('is-active')) return;
        picks.querySelectorAll('.xa-editorial-row').forEach(function (item) { item.classList.toggle('is-active', item === row); });
        preview.classList.add('is-changing');
        var next = new Image();
        next.onload = function () {
          image.classList.remove('lazyload');
          image.removeAttribute('data-lazy-src');
          image.src = row.dataset.previewSrc;
          image.alt = row.dataset.previewTitle + ' 封面预览';
          if (title) title.textContent = row.dataset.previewTitle;
          if (date) date.textContent = row.dataset.previewDate;
          requestAnimationFrame(function () { preview.classList.remove('is-changing'); });
        };
        next.onerror = function () { preview.classList.remove('is-changing'); };
        next.src = row.dataset.previewSrc;
      };
      picks.querySelectorAll('.xa-editorial-row').forEach(function (row) {
        row.addEventListener('mouseenter', function () { activate(row); });
        row.addEventListener('focus', function () { activate(row); });
      });
    });
  }

  function bindProfileCards(root) {
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var coarsePointer = window.matchMedia('(hover: none)').matches;
    (root || document).querySelectorAll('[data-profile-card]:not([data-xa-profile-bound])').forEach(function (card) {
      card.dataset.xaProfileBound = 'true';
      if (reduceMotion || coarsePointer) return;
      var currentX = 76;
      var currentY = 24;
      var targetX = 50;
      var targetY = 50;
      var frame = 0;
      var active = false;
      var render = function () {
        currentX += (targetX - currentX) * .14;
        currentY += (targetY - currentY) * .14;
        card.style.setProperty('--pc-x', currentX.toFixed(2) + '%');
        card.style.setProperty('--pc-y', currentY.toFixed(2) + '%');
        card.style.setProperty('--pc-rx', ((50 - currentY) / 5.2).toFixed(2) + 'deg');
        card.style.setProperty('--pc-ry', ((currentX - 50) / 5.8).toFixed(2) + 'deg');
        card.style.setProperty('--pc-tx', ((currentX - 50) * -.08).toFixed(2) + 'px');
        card.style.setProperty('--pc-ty', ((currentY - 50) * -.06).toFixed(2) + 'px');
        card.style.setProperty('--pc-shadow-x', ((currentX - 50) * .28).toFixed(2) + 'px');
        card.style.setProperty('--pc-shadow-y', ((currentY - 50) * .34).toFixed(2) + 'px');
        if (active || Math.abs(targetX - currentX) > .08 || Math.abs(targetY - currentY) > .08) frame = requestAnimationFrame(render);
        else frame = 0;
      };
      var start = function () { if (!frame) frame = requestAnimationFrame(render); };
      card.addEventListener('pointerenter', function () {
        active = true;
        card.style.setProperty('--pc-active', '1');
        start();
      });
      card.addEventListener('pointermove', function (event) {
        var rect = card.getBoundingClientRect();
        targetX = Math.max(0, Math.min(100, (event.clientX - rect.left) / rect.width * 100));
        targetY = Math.max(0, Math.min(100, (event.clientY - rect.top) / rect.height * 100));
        start();
      }, { passive: true });
      card.addEventListener('pointerleave', function () {
        active = false;
        targetX = 50;
        targetY = 50;
        card.style.setProperty('--pc-active', '0');
        start();
      });
      card.style.setProperty('--pc-active', '.45');
      start();
      window.setTimeout(function () { card.style.setProperty('--pc-active', '0'); }, 1200);
    });
  }

  function bindHeroScroll() {
    var header = document.querySelector('#page-header.full_page');
    var hero = header && header.querySelector('#site-info');
    if (!header || !hero) {
      if (heroCleanup) heroCleanup();
      return;
    }
    if (header.dataset.xaScrollBound === 'true') return;
    if (heroCleanup) heroCleanup();
    header.dataset.xaScrollBound = 'true';
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var canHover = window.matchMedia('(hover: hover)').matches;
    var pointerX = .5;
    var pointerY = .5;
    var targetX = .5;
    var targetY = .5;
    var render = function () {
      var progress = Math.max(0, Math.min(1, window.scrollY / Math.max(header.offsetHeight * .82, 1)));
      header.style.setProperty('--xa-hero-progress', progress.toFixed(3));
      hero.style.transform = 'translate3d(0,' + (progress * 54).toFixed(1) + 'px,0) scale(' + (1 - progress * .055).toFixed(3) + ')';
      hero.style.opacity = String(1 - progress * .68);
      if (!reduceMotion && canHover) {
        pointerX += (targetX - pointerX) * .18;
        pointerY += (targetY - pointerY) * .18;
        header.style.setProperty('--xa-hero-x', (pointerX * 100).toFixed(1) + '%');
        header.style.setProperty('--xa-hero-y', (pointerY * 100).toFixed(1) + '%');
        header.style.setProperty('--xa-hero-shift-x', ((pointerX - .5) * -16).toFixed(1) + 'px');
        header.style.setProperty('--xa-hero-shift-y', ((pointerY - .5) * -12).toFixed(1) + 'px');
      }
      heroFrame = null;
      if (Math.abs(targetX - pointerX) > .001 || Math.abs(targetY - pointerY) > .001) {
        heroFrame = requestAnimationFrame(render);
      }
    };
    var schedule = function () {
      if (heroFrame) return;
      heroFrame = requestAnimationFrame(render);
    };
    var onPointerMove = function (event) {
      var rect = header.getBoundingClientRect();
      targetX = Math.max(0, Math.min(1, (event.clientX - rect.left) / Math.max(rect.width, 1)));
      targetY = Math.max(0, Math.min(1, (event.clientY - rect.top) / Math.max(rect.height, 1)));
      schedule();
    };
    var onPointerLeave = function () {
      targetX = .5;
      targetY = .5;
      schedule();
    };
    window.addEventListener('scroll', schedule, { passive: true });
    if (!reduceMotion && canHover) {
      header.addEventListener('pointermove', onPointerMove, { passive: true });
      header.addEventListener('pointerleave', onPointerLeave, { passive: true });
    }
    heroCleanup = function () {
      window.removeEventListener('scroll', schedule);
      header.removeEventListener('pointermove', onPointerMove);
      header.removeEventListener('pointerleave', onPointerLeave);
      if (heroFrame) cancelAnimationFrame(heroFrame);
      heroFrame = null;
      heroCleanup = null;
    };
    render();
  }

  function init() {
    bindReveals(document);
    bindGlass(document);
    bindBack(document);
    bindFriendFilters(document);
    bindLibrary(document);
    bindDirectoryToggles(document);
    bindImageFallbacks(document);
    bindProgressiveLists(document);
    bindVariableProximity(document);
    bindWechatPreview(document);
    bindProfileCards(document);
    bindHeroScroll();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
  document.addEventListener('pjax:complete', init);
  document.addEventListener('xa:content-updated', function (event) {
    var root = event.detail && event.detail.root ? event.detail.root : document;
    bindReveals(root);
    bindGlass(root);
    bindProfileCards(root);
    bindLibrary(root);
    bindDirectoryToggles(root);
    bindImageFallbacks(root);
    bindProgressiveLists(root);
    bindVariableProximity(root);
  });
})();
