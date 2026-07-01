(function () {
  const root = document.documentElement;
  const toggle = document.getElementById('theme-toggle');
  const stored = localStorage.getItem('bhaskar-theme');
  const system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const current = stored || system;
  root.setAttribute('data-theme', current);

  function syncToggleLabel() {
    if (!toggle) return;
    const isDark = root.getAttribute('data-theme') === 'dark';
    toggle.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
    toggle.setAttribute('title', isDark ? 'Switch to light theme' : 'Switch to dark theme');
  }

  if (toggle) {
    syncToggleLabel();
    toggle.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem('bhaskar-theme', next);
      syncToggleLabel();
    });
  }
})();
