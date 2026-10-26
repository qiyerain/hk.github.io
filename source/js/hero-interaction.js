(() => {
  let mossScene = null;

  const bindMossCanvas = () => {
    const header = document.querySelector('#page-header.full_page');
    const canvas = document.querySelector('#pfa-moss-canvas');

    if (!header || !canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (mossScene) mossScene.destroy();

    const ctx = canvas.getContext('2d', { alpha: true });
    const pointer = { x: 0.58, y: 0.42, active: false };
    let width = 0;
    let height = 0;
    let dpr = 1;
    let frame = null;
    let resizeTimer = null;

    const strands = Array.from({ length: 230 }, (_, index) => ({
      t: (index % 115) / 114,
      side: index < 115 ? -1 : 1,
      seed: Math.random(),
      length: 13 + Math.random() * 36,
      lean: -0.5 + Math.random(),
      shade: Math.random()
    }));

    const dust = Array.from({ length: 52 }, () => ({
      x: 0.18 + Math.random() * 0.72,
      y: 0.12 + Math.random() * 0.62,
      seed: Math.random(),
      size: 0.6 + Math.random() * 1.6
    }));

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, header.clientWidth);
      height = Math.max(1, header.clientHeight);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const branchPoint = t => {
      const x = width * (-0.08 + t * 1.24);
      const y = height * (0.9 - t * 0.32 + Math.sin(t * Math.PI * 2.2) * 0.05);
      return { x, y };
    };

    const drawBranch = now => {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (let layer = 0; layer < 4; layer += 1) {
        ctx.beginPath();
        for (let i = 0; i <= 120; i += 1) {
          const point = branchPoint(i / 120);
          const wobble = Math.sin(now * 0.00045 + i * 0.13 + layer) * (3 + layer);
          if (i === 0) ctx.moveTo(point.x, point.y + wobble);
          else ctx.lineTo(point.x, point.y + wobble);
        }
        ctx.strokeStyle = [
          'rgba(234, 221, 190, 0.54)',
          'rgba(108, 85, 56, 0.62)',
          'rgba(42, 56, 38, 0.52)',
          'rgba(18, 20, 16, 0.46)'
        ][layer];
        ctx.lineWidth = Math.max(4, height * (0.038 - layer * 0.006));
        ctx.stroke();
      }
    };

    const drawMoss = now => {
      strands.forEach(strand => {
        const base = branchPoint(strand.t);
        const dx = pointer.x * width - base.x;
        const dy = pointer.y * height - base.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const proximity = Math.max(0, 1 - distance / (width * 0.22));
        const wind = Math.sin(now * 0.002 + strand.seed * 9) * 4;
        const bloom = 1 + proximity * 1.15;
        const length = strand.length * bloom;
        const angle = -Math.PI / 2 + strand.side * (0.42 + strand.lean * 0.3) + wind * 0.015 + proximity * strand.side * 0.42;
        const tipX = base.x + Math.cos(angle) * length;
        const tipY = base.y + Math.sin(angle) * length;
        const hue = 86 + strand.shade * 34 + proximity * 30;
        const alpha = 0.36 + strand.shade * 0.32 + proximity * 0.28;

        ctx.beginPath();
        ctx.moveTo(base.x, base.y);
        ctx.quadraticCurveTo(
          base.x + Math.cos(angle - 0.25) * length * 0.42,
          base.y + Math.sin(angle - 0.25) * length * 0.42,
          tipX,
          tipY
        );
        ctx.strokeStyle = `hsla(${hue}, 58%, ${30 + proximity * 18}%, ${alpha})`;
        ctx.lineWidth = 0.7 + strand.shade * 1.7 + proximity * 1.3;
        ctx.stroke();

        if (proximity > 0.32) {
          ctx.beginPath();
          ctx.arc(tipX, tipY, 1.6 + proximity * 2.4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(189, 224, 113, ${0.22 + proximity * 0.34})`;
          ctx.fill();
        }
      });
    };

    const drawDust = now => {
      ctx.globalCompositeOperation = 'screen';
      dust.forEach(particle => {
        const drift = Math.sin(now * 0.0007 + particle.seed * 10) * 12;
        const x = particle.x * width + drift + (pointer.x - 0.5) * 18;
        const y = particle.y * height + Math.cos(now * 0.0006 + particle.seed * 7) * 10;
        ctx.beginPath();
        ctx.arc(x, y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(225, 236, 179, ${0.08 + particle.seed * 0.14})`;
        ctx.fill();
      });
      ctx.globalCompositeOperation = 'source-over';
    };

    const draw = now => {
      ctx.clearRect(0, 0, width, height);
      drawDust(now);
      drawBranch(now);
      drawMoss(now);
      frame = requestAnimationFrame(draw);
    };

    const updatePointer = event => {
      const rect = header.getBoundingClientRect();
      pointer.x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      pointer.y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
      pointer.active = true;
      header.style.setProperty('--pfa-moss-x', `${pointer.x * 100}%`);
      header.style.setProperty('--pfa-moss-y', `${pointer.y * 100}%`);
    };

    const leavePointer = () => {
      pointer.active = false;
      pointer.x = 0.58;
      pointer.y = 0.42;
      header.style.setProperty('--pfa-moss-x', '58%');
      header.style.setProperty('--pfa-moss-y', '42%');
    };

    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 120);
    };

    resize();
    leavePointer();
    header.addEventListener('pointermove', updatePointer, { passive: true });
    header.addEventListener('pointerleave', leavePointer, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    frame = requestAnimationFrame(draw);

    mossScene = {
      destroy() {
        if (frame) cancelAnimationFrame(frame);
        clearTimeout(resizeTimer);
        header.removeEventListener('pointermove', updatePointer);
        header.removeEventListener('pointerleave', leavePointer);
        window.removeEventListener('resize', handleResize);
        ctx.clearRect(0, 0, width, height);
      }
    };
  };

  const bindHeroInteraction = () => {
    const hero = document.querySelector('#page-header.full_page #site-info');
    const glass = hero && hero.querySelector('.pfa-hero-glass');

    if (!hero || !glass || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const reset = () => {
      hero.style.setProperty('--pfa-hero-x', '50%');
      hero.style.setProperty('--pfa-hero-y', '50%');
      hero.style.setProperty('--pfa-hero-rotate-x', '0deg');
      hero.style.setProperty('--pfa-hero-rotate-y', '0deg');
    };

    const update = event => {
      const rect = hero.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      const rotateY = (x - 50) / 18;
      const rotateX = (50 - y) / 20;

      hero.style.setProperty('--pfa-hero-x', `${x}%`);
      hero.style.setProperty('--pfa-hero-y', `${y}%`);
      hero.style.setProperty('--pfa-hero-rotate-x', `${rotateX}deg`);
      hero.style.setProperty('--pfa-hero-rotate-y', `${rotateY}deg`);
    };

    reset();
    hero.addEventListener('pointermove', update, { passive: true });
    hero.addEventListener('pointerleave', reset, { passive: true });
  };

  const bindHomeVisual = () => {
    const stage = document.querySelector('.pfa-home-visual');
    if (!stage || stage.dataset.pfaBound === 'true' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const reset = () => {
      stage.style.setProperty('--pfa-visual-x', '50%');
      stage.style.setProperty('--pfa-visual-y', '50%');
      stage.style.setProperty('--pfa-visual-rotate-x', '0deg');
      stage.style.setProperty('--pfa-visual-rotate-y', '0deg');
    };

    const update = event => {
      const rect = stage.getBoundingClientRect();
      const x = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100));
      const rotateY = (x - 50) / 12;
      const rotateX = (50 - y) / 16;

      stage.style.setProperty('--pfa-visual-x', `${x}%`);
      stage.style.setProperty('--pfa-visual-y', `${y}%`);
      stage.style.setProperty('--pfa-visual-rotate-x', `${rotateX}deg`);
      stage.style.setProperty('--pfa-visual-rotate-y', `${rotateY}deg`);
    };

    reset();
    stage.dataset.pfaBound = 'true';
    stage.addEventListener('pointermove', update, { passive: true });
    stage.addEventListener('pointerleave', reset, { passive: true });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      bindMossCanvas();
      bindHeroInteraction();
      bindHomeVisual();
    }, { once: true });
  } else {
    bindMossCanvas();
    bindHeroInteraction();
    bindHomeVisual();
  }

  document.addEventListener('pjax:complete', () => {
    bindMossCanvas();
    bindHeroInteraction();
    bindHomeVisual();
  });
})();
