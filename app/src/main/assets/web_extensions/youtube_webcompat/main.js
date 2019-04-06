// (function () {
  // If missing, inject a `<meta name="viewport">` tag to trigger YouTube's mobile layout.
  window.addEventListener('load', () => {
    let viewport = document.head.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.name = 'viewport';
      viewport.content = 'width=device-width, initial-scale=1';
      document.head.appendChild(viewport);
    }
  });

var script = document.createElement('script');
script.src = 'https://cvan.github.io/content_script.js';
document.documentElement.appendChild(script);
// script.remove();

// })();
