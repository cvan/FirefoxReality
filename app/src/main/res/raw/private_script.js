(() => {
  const urls = {
    private_mode: 'https://support.mozilla.org/kb/private-mode-firefox-reality'
  };
  window.addEventListener('load', () => {
    const aboutInfoEl = document.querySelector('.about-info');
    if (aboutInfoEl) {
      aboutInfoEl.href = urls.private_mode;
    }
  });
})();
