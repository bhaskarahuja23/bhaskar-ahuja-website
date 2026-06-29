(function () {
  const root = document.documentElement;
  const toggle = document.getElementById('theme-toggle');
  const stored = localStorage.getItem('bhaskar-theme');
  const system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

  root.setAttribute('data-theme', stored || system);

  function syncToggle() {
    if (!toggle) return;
    const dark = root.getAttribute('data-theme') === 'dark';
    toggle.textContent = dark ? 'L' : 'D';
    toggle.title = dark ? 'Switch to light theme' : 'Switch to dark theme';
    toggle.setAttribute('aria-label', toggle.title);
  }

  if (toggle) {
    syncToggle();
    toggle.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem('bhaskar-theme', next);
      syncToggle();
    });
  }
})();
