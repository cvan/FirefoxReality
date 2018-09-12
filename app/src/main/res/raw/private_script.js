(() => {
  document.body.innerHTML += '<p>script</p>';
  const urls = {
    private_mode: 'https://support.mozilla.org/kb/private-mode-firefox-reality'
  };
  window.addEventListener('load', () => {
    document.body.innerHTML += '<p>load</p>';
    const aboutInfoEl = document.querySelector('.about-info');
    if (aboutInfoEl) {
      document.body.innerHTML += '<p>about info found</p>';
      aboutInfoEl.href = urls.private_mode;
    } else {
      document.body.innerHTML += '<p>about info not found</p>';
    }
  });
})();
