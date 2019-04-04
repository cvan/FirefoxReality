(function () {
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

  const playerEl = document.getElementById('movie_player');
  if (!playerEl) {
    return;
  }

  var prefs = {
    hd: false,
    once: false,
    higher: false,
    quality: 'hd1440',
    log: true,
    qualityLabels: {
      4320: 'highres', // 8K / 4320p / QUHD
      2880: 'hd2880', // 5K / 2880p / UHD+
      2160: 'hd2160', // 4K / 2160p / UHD
      1440: 'hd1440', // 1440p / QHD
      1080: 'hd1080', // 1080p / FHD
      720: 'hd720', // 720p / HD
      480: 'large', // 480p
      360: 'medium', // 360p
      240: 'small', // 240p
      144: 'tiny', // 144p
      0: 'auto'
    }
  };
  var script = document.createElement('script');
  Object.assign(script.dataset, prefs);
  delete script.dataset.qualityLabels;
  script.setAttribute('data-quality-labels', JSON.stringify(prefs.qualityLabels));
  script.textContent = `
    var yttools = window.yttools || [];
    function youtubeHDListener (e) {
      const prefs = youtubeHDListener.prefs;
      const player = youtubeHDListener.player;
      const log = (...args) => prefs.log === 'true' && console.log('[ythd]', ...args);

      try {
        if (e === 1 && player) {
          const levels = player.getAvailableQualityLevels();
          if (levels.length === 0) {
            return log('getAvailableQualityLevels returned empty array');
          }
          const qualities = [
            'highres', 'h2880', 'hd2160', 'hd1440', 'hd1080', 'hd720', 'large', 'medium', 'small', 'tiny', 'auto'
          ];
          const q = player.getPlaybackQuality();
          if (prefs.quality in prefs.qualityLabels) {
            prefs.quality = prefs.qualityLabels[String(prefs.quality)];
          }
          if ((q.startsWith('h') && prefs.quality.startsWith('h')) && prefs.hd === 'true') {
            return log('Quality was', q, 'Changing the quality is skipped');
          }
          const compare = (q1, q2) => {
            if (q2 === 'auto') {
              return false;
            }
            const i1 = qualities.indexOf(q1);
            const i2 = qualities.indexOf(q2);
            if (i1 === -1 || i2 === -1) {
              return false;
            }
            return i1 - i2 <= 0;
          };
          if (prefs.higher === 'true' && compare(q, prefs.quality)) {
            return log('Quality was', q, 'which is higher than ', prefs.quality, 'Changing the quality is skipped');
          }
          if (q === prefs.quality) {
            return log('Selected quality is okay;', q);
          }
          const find = increase => {
            if (prefs.quality === 'highest') {
              return levels[0];
            }
            if (increase) {
              prefs.quality = qualities[qualities.indexOf(prefs.quality) - 1] || levels[0];
            }
            const index = levels.indexOf(prefs.quality);
            if (index !== -1) {
              return prefs.quality;
            }
            return find(true);
          };
          const nq = find();
          if (q === nq) {
            return log('Quality was', q, 'no better quality', 'Changing the quality is skipped');
          }
          player.setPlaybackQuality(nq);
          try {
            player.setPlaybackQualityRange(nq, nq);
          } catch (e) {}
          if (prefs.once === 'true') {
            player.removeEventListener('onStateChange', 'youtubeHDListener');
            window.youtubeHDListener = () => {};
            log('Removing Listener');
          }
          log('Quality was', q, 'Quality is set to', nq);
        }
      } catch (eerr) {
        log(err);
      }
    }
    youtubeHDListener.prefs = document.currentScript.dataset;
    youtubeHDListener.prefs.qualityLabels = JSON.parse(document.currentScript.getAttribute('data-quality-labels') || '{}');
    yttools.push(e => {
      youtubeHDListener.player = e;
      youtubeHDListener(1);
      e.addEventListener('onStateChange', 'youtubeHDListener');
    });
    // Install listener.
    function onYouTubePlayerReady (e) {
      console.log('onYouTubePlayerReady', yttools);
      yttools.forEach(c => {
        try {
          c(e);
        } catch (e) {
          console.error('err',e);
        }
      });
    }
    // See docs: https://youtube.github.io/spfjs/documentation/events/
    window.addEventListener('spfready', () => {
      if (typeof window.ytplayer === 'object' && window.ytplayer.config) {
        window.ytplayer.config.args.jsapicallback = 'onYouTubePlayerReady';
      }
    });
  `;
  document.documentElement.appendChild(script);
  // script.remove();
})();
