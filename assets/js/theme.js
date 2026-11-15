document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('os_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);

  const themeToggleBtn = document.getElementById('theme-toggle');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('os_theme', next);
      window.dispatchEvent(new Event('themeChanged'));
    });
  }
});