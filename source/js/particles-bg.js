/**
 * Home cinematic background.
 * A lightweight canvas loop creates a video-like aurora field without network assets.
 */
(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const header = document.getElementById('page-header');
  if (!header || !header.classList.contains('full_page') || reduceMotion) return;

  const canvas = document.createElement('canvas');
  canvas.id = 'pfa-cinematic-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:1;';
  header.prepend(canvas);

  const ctx = canvas.getContext('2d', { alpha: true });
  let width = 0;
  let height = 0;
  let dpr = 1;
  let frame = null;
  let running = true;

  const waves = Array.from({ length: 5 }, (_, index) => ({
    offset: Math.random() * Math.PI * 2,
    speed: 0.00016 + index * 0.000025,
    amplitude: 0.08 + index * 0.01,
    width: 0.22 + index * 0.024,
    hue: index % 2 ? 'warm' : 'cool'
  }));

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, header.clientWidth);
    height = Math.max(1, header.clientHeight);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function themeIsLight() {
    return document.documentElement.getAttribute('data-theme') === 'light';
  }

  function draw(now) {
    if (!running) return;

    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'source-over';

    const light = themeIsLight();
    const base = ctx.createLinearGradient(0, 0, width, height);
    if (light) {
      base.addColorStop(0, '#f4efe6');
      base.addColorStop(0.45, '#dfe9e6');
      base.addColorStop(1, '#f7f2e9');
    } else {
      base.addColorStop(0, '#080b10');
      base.addColorStop(0.45, '#101819');
      base.addColorStop(1, '#201511');
    }
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, width, height);

    ctx.globalCompositeOperation = light ? 'multiply' : 'screen';
    waves.forEach((wave, index) => {
      const x = width * (0.12 + index * 0.11);
      const y = height * (0.34 + Math.sin(now * wave.speed + wave.offset) * wave.amplitude);
      const radius = Math.max(width, height) * wave.width;
      const drift = Math.sin(now * wave.speed * 1.6 + wave.offset) * width * 0.14;
      const gradient = ctx.createRadialGradient(x + drift, y, 0, x + drift, y, radius);
      const cool = light ? '48, 108, 104' : '107, 197, 180';
      const warm = light ? '153, 85, 54' : '221, 129, 78';
      const color = wave.hue === 'cool' ? cool : warm;
      gradient.addColorStop(0, `rgba(${color}, ${light ? 0.2 : 0.28})`);
      gradient.addColorStop(0.52, `rgba(${color}, ${light ? 0.08 : 0.14})`);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(x + drift, y, radius * 1.5, radius * 0.46, -0.3 + index * 0.11, 0, Math.PI * 2);
      ctx.fill();
    });

    frame = requestAnimationFrame(draw);
  }

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 120);
  }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running && !frame) frame = requestAnimationFrame(draw);
    if (!running && frame) {
      cancelAnimationFrame(frame);
      frame = null;
    }
  });

  resize();
  frame = requestAnimationFrame(draw);
})();
