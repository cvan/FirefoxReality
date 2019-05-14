const CUSTOM_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12) AppleWebKit/602.1.21 (KHTML, like Gecko) Version/9.2 Safari/602.1.21';
const LOGTAG = '[firefoxreality:webcompat:youtube]';
const YT_SELECTORS = {
  disclaimer: '.yt-alert-message, yt-alert-message',
  moviePlayer: '#movie_player'
};

try {
  // Note: À la Oculus Browser, we intentionally use this particular `User-Agent` string
  // for YouTube to force the most optimal, high-resolution layout available for playback in a mobile VR browser.
  Object.defineProperty(navigator, 'userAgent', {
    get: () => CUSTOM_USER_AGENT
  });

  // If missing, inject a `<meta name="viewport">` tag to trigger YouTube's mobile layout.
  let viewportEl = document.querySelector('meta[name="viewport"]');
  if (!viewportEl) {
    document.documentElement.insertAdjacentHTML('afterbegin',
      `<meta name="viewport" content="width=device-width, initial-scale=1" data-fxr-injected>`);
  }

  let is360 = null;
  let qs = new URLSearchParams(window.location.search);
  let retryTimeout = null;

  const prefs = {
    hd: false,
    quality: 1440,
    log: qs.get('mozDebug') !== '0' && qs.get('mozdebug') !== '0' && qs.get('debug') !== '0',
    retryAttempts: parseInt(qs.get('retryAttempts') || qs.get('retryattempts') || '10', 10),
    retryTimeout: parseInt(qs.get('retryTimeout') || qs.get('retrytimeout') || '500', 10)
  };

  const printLog = String(prefs.log) === 'true';

  const log = (...args) => printLog && console.log(LOGTAG, ...args);
  const logError = (...args) => printLog && console.error(LOGTAG, ...args);
  const logWarn = (...args) => printLog && console.warn(LOGTAG, ...args);

  window.addEventListener('click', evt => {
    if (is360 && evt.target.closest(YT_SELECTORS.moviePlayer) && !evt.target.closest('.ytp-chrome-bottom')) {
      const playerEl = document.querySelector(YT_SELECTORS.moviePlayer);
      if (!playerEl) {
        return;
      }
      playerEl.requestFullscreen();
    }
  });

  const observerConfig = {
    attributes: false,
    characterData: true,
    characterDataOldValue: true,
    childList: true
  };

  function hasElChanged (el) {
    if (!el) {
      return;
    }
    return el.matches(YT_SELECTORS.disclaimer);
  }

  const observer = new MutationObserver((mutationsList, observer) => {
    for (let mutation of mutationsList) {
      const modifiedEls = {
        added: [],
        removed: [],
        modified: []
      };
      const addedEls = [];
      let targetEl;
      if (mutation.type === 'childList') {
        for (let idx = 0; idx < mutation.addedNodes.length; idx++) {
          targetEl = mutation.addedNodes[idx];
          if (hasElChanged(targetEl)) {
            modifiedEls.added.push(targetEl);
            emitElChanged(targetEl, 'added');
          }
        }
        console.log(`Added nodes:`, modifiedEls.added);
        for (let idx = 0; idx < mutation.removedNodes.length; idx++) {
          targetEl = mutation.removedNodes[idx];
          if (hasElChanged(targetEl)) {
            modifiedEls.removed.push(targetEl);
            emitElChanged(targetEl, 'removed');
          }
        }
        console.log(`Removed nodes:`, modifiedEls.removed);
      } else if (mutation.type === 'characterData') {
        if (hasElChanged(targetEl)) {
          modifiedEls.modified.push(targetEl);
          emitElChanged(targetEl, 'modified');
        }
        console.log(`Text content changed; modified nodes:`, modifiedEls.modified);
      } else if (mutation.type === 'attributes') {
        targetEl = mutation.target;
        if (hasElChanged(targetEl)) {
          modifiedEls.modified.push(targetEl);
          emitElChanged(targetEl, 'modified');
        }
        console.log(`Attribute "${mutation.attributeName}" changed; modified nodes:`, modifiedEls.modified);
      }
      return modifiedEls();
    }
  });

  observer.observe(targetNode, observerConfig);

  window.addEventListener('load', () => {
    viewportEl = document.querySelector('meta[name="viewport"]:not([data-fxr-injected])');
    if (viewportEl) {
      viewportEl.parentNode.removeChild(viewportEl);
    }
    const disclaimerEl = document.querySelector(YT_SELECTORS.disclaimer);
    is360 = disclaimerEl ? disclaimerEl.textContent.includes('360') : false;
    if (is360) {
      ytImprover360();
    }
  });

  function ytImprover360 () {
    if (!is360) {
      return;
    }

    qs = new URLSearchParams(window.location.search);

    const currentProjection = (qs.get('mozVideoProjection') || '').toLowerCase();
    qs.delete('mozVideoProjection');
    switch (currentProjection) {
      case '360':
        qs.set('mozVideoProjection', '360');
        break;
      case '360_auto':
      default:
        qs.set('mozVideoProjection', '360_auto');
        break;
    }

    const newUrl = getNewUrl(qs);
    if (newUrl && window.location.pathname + window.location.search !== newUrl) {
      window.history.replaceState({}, document.title, newUrl);
      return newUrl;
    }
  }

  function getNewUrl (qs) {
    let newUrl = `${window.location.pathname}`;
    if (qs) {
      newUrl = `${newUrl}?${qs}`;
    }
    return newUrl;
  }

  const ytImprover = window.ytImprover = (state, attempts) => {
    if (ytImprover.completed) {
      return;
    }

    if (typeof attempts === 'undefined') {
      attempts = 1;
    }
    if (attempts >= prefs.retryAttempts) {
      logError(`Giving up trying to increase resolution after ${prefs.retryAttempts} attempts.`);
      return;
    }

    let player = document.querySelector(YT_SELECTORS.moviePlayer);
    let reason = 'unknown';
    if (state !== 1) {
      reason = 'invalid state';
    } else if (!player) {
      reason = 'player not found';
    } else if (!player.wrappedJSObject) {
      reason = 'player.wrappedJSObject not found';
      player = null;
    } else if (!player.wrappedJSObject.getAvailableQualityLevels) {
      reason = 'player.wrappedJSObject.getAvailableQualityLevels not found';
      player = null;
    }

    if (!player) {
      logWarn(`Cannot find player because ${reason}. attempts: ${attempts}`);
      attempts++;
      retryTimeout = setTimeout(() => {
        ytImprover(state, attempts);
      }, prefs.retryTimeout);
      return;
    }

    player = player.wrappedJSObject;

    const levels = player.getAvailableQualityLevels();
    if (!levels || !levels.length) {
      logWarn(`Cannot read 'player.getAvailableQualityLevels()' attempts: ${attempts}`);
      attempts++;
      retryTimeout = setTimeout(() => {
        ytImprover(state, attempts);
      }, prefs.retryTimeout);
      return;
    }

    clearTimeout(retryTimeout);
    ytImprover.completed = true;

    prefs.qualities = [
      'highres', 'h2880', 'hd2160', 'hd1440', 'hd1080', 'hd720', 'large', 'medium', 'small', 'tiny', 'auto'
    ];
    prefs.qualityLabels = {
      '4320': 'highres', // 8K / 4320p / QUHD
      '2880': 'hd2880', // 5K / 2880p / UHD+
      '2160': 'hd2160', // 4K / 2160p / UHD
      '1440': 'hd1440', // 1440p / QHD
      '1080': 'hd1080', // 1080p / FHD
      '720': 'hd720', // 720p / HD
      '480': 'large', // 480p
      '360': 'medium', // 360p
      '240': 'small', // 240p
      '144': 'tiny', // 144p
      '0': 'auto'
    };

    const getDesiredQuality = () => {
      const qsQuality = (qs.get('vq') || qs.get('quality') || '').trim().toLowerCase();
      if (qsQuality) {
        if (qsQuality in prefs.qualityLabels) {
          prefs.quality = prefs.qualityLabels[qsQuality];
        } else {
          const qsQualityNumber = parseInt(qsQuality, 10);
          if (Number.isInteger(qsQualityNumber)) {
            prefs.quality = qsQualityNumber;
          } else {
            prefs.quality = qsQuality;
          }
        }
      }
      prefs.quality = String(prefs.quality).toLowerCase();
      if (qsQuality === 'auto' || qsQuality === 'default') {
        prefs.quality = 'auto';
      }
      if (prefs.quality in prefs.qualityLabels) {
        prefs.quality = prefs.qualityLabels[prefs.quality];
      }
      return prefs.quality;
    };

    prefs.quality = getDesiredQuality();
    if (prefs.quality === 'auto') {
      return log(`Desired quality is fine (${prefs.quality})`);
    }

    const currentQuality = player.getPlaybackQuality();
    if (prefs.quality === currentQuality) {
      return log(`Current quality is desired quality (${currentQuality})`);
    }

    const findBestQuality = increase => {
      if (prefs.quality === 'highest' || prefs.quality === 'best' || prefs.quality === 'max' || prefs.quality === 'maximum') {
        return levels[0];
      }
      if (prefs.quality === 'lowest' || prefs.quality === 'worst' || prefs.quality === 'min' || prefs.quality === 'minimum') {
        return levels[levels.length - 1];
      }
      if (increase) {
        prefs.quality = prefs.qualities[prefs.qualities.indexOf(prefs.quality) - 1] || levels[0];
      }
      const index = levels.indexOf(prefs.quality);
      if (index !== -1) {
        return prefs.quality;
      }
      return findBestQuality(true);
    };
    const newBestQuality = findBestQuality();
    if (currentQuality === newBestQuality) {
      return log(`Current quality "${currentQuality}" is the best available quality`);
    }

    if (!player.setPlaybackQuality) {
      return logError('`player.setPlaybackQuality` not available');
    }
    player.setPlaybackQuality(newBestQuality);

    if (!player.setPlaybackQualityRange) {
      return logError('`player.setPlaybackQualityRange` not available');
    }
    try {
      player.setPlaybackQualityRange(newBestQuality, newBestQuality);
    } catch (e) {
      logError(`Failed to call 'player.setPlaybackQualityRange(${newBestQuality}, ${newBestQuality})' with exception: `, e);
      return;
    }

    log(`Changed quality from "${currentQuality}" to "${newBestQuality}"`);
  };

  if (window.location.pathname.startsWith('/watch')) {
    window.onYouTubePlayerReady = evt => {
      log('`onYouTubePlayerReady` called');
      window.ytImprover(1);
      evt.addEventListener('onStateChange', 'ytImprover');
    };

    window.addEventListener('spfready', () => {
      log('`spfready` event fired');
      if (typeof window.ytplayer === 'object' && window.ytplayer.config) {
        log('`window.ytplayer.config.args.jsapicallback` set');
        window.ytplayer.config.args.jsapicallback = 'onYouTubePlayerReady';
      }
    });

    ytImprover(1);
  }
} catch (err) {
  console.error(LOGTAG, 'Encountered error:', err);
}
