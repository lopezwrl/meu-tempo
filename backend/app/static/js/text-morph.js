(function () {
  const nodes = document.querySelectorAll('.text-morph');
  if (!nodes.length) return;

  const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  nodes.forEach((node) => {
    if (node.dataset.morphReady === 'true') return;
    node.dataset.morphReady = 'true';

    const words = (node.dataset.words || node.textContent || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    if (!words.length) return;

    if (words.length < 2 || prefersReducedMotion) {
      node.textContent = words[0] || node.textContent;
      return;
    }

    const track = document.createElement('span');
    track.className = 'text-morph-track';
    track.setAttribute('aria-live', 'polite');

    const current = document.createElement('span');
    current.className = 'text-morph-word is-active';
    current.textContent = words[0];
    track.appendChild(current);

    node.textContent = '';
    node.appendChild(track);

    let activeIndex = 0;
    let activeEl = current;

    const swap = () => {
      const nextIndex = (activeIndex + 1) % words.length;
      const next = document.createElement('span');
      next.className = 'text-morph-word';
      next.textContent = words[nextIndex];
      track.appendChild(next);

      requestAnimationFrame(() => {
        activeEl.classList.remove('is-active');
        activeEl.classList.add('is-exit');
        next.classList.add('is-active');
      });

      setTimeout(() => {
        if (activeEl && activeEl.parentNode) activeEl.remove();
        activeEl = next;
        activeIndex = nextIndex;
      }, 700);
    };

    setTimeout(() => {
      swap();
      setInterval(swap, 2200);
    }, 900);
  });
})();
