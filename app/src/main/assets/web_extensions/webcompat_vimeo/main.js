let LOGTAG = '[firefoxreality:webcompat:vimeo]';
const VIMEO_SELECTORS = {
  player: '.js-player-fullscreen',
  playerArea: '.player_area',
  playerContainer: '.player_container',
  embedPlayer: '#player',
  embedVideo: 'video',
  embedVideoTarget: '.vp-target',
  embedVideoPlayButton: '.vp-controls .play'
};
const VIMEO_PATHS = {
  videoPage: /\/\d+/.test(window.location.pathname),
  videoEmbed: window.location.hostname === 'player.vimeo.com' && /\/\d+/.test(window.location.pathname)
};

if (VIMEO_PATHS.videoPage) {
  LOGTAG += ' [video:page]';
} else if (VIMEO_PATHS.videoEmbed) {
  LOGTAG += ' [video:embed]';
} else {
  LOGTAG += ` [video:other]`;
}

LOGTAG += ` [${window.location.href}]`;

let is360 = () => window.vimeo && window.vimeo.clip_page_config && window.vimeo.clip_page_config.clip.is_spatial;
let is360VideoPage = null;
let qs = new URLSearchParams(window.location.search);
const prefs = {
  log: qs.get('mozDebug') !== '0' && qs.get('mozdebug') !== '0' && qs.get('debug') !== '0'
};

const printLog = String(prefs.log) === 'true';

const log = (...args) => printLog && console.log(LOGTAG, ...args);
const logError = (...args) => printLog && console.error(LOGTAG, ...args);
const logWarn = (...args) => printLog && console.warn(LOGTAG, ...args);

function vimeoImprover () {
  vimeoImprover.called = true;
  if (vimeoImprover.called) {
    const iframeEl = document.getElementById('fxr-webcompat-vimeo-player-360');
    if (iframeEl) {
      iframeEl.src = iframeEl.src.replace('360_auto', '360');
    }
    return;
  }

  const scriptPatch = document.createElement('script');
  scriptPatch.setAttribute('data-fxr-patch-for', 'vimeoSpatial');
  scriptPatch.setAttribute('data-fxr-patched', 'vimeoSpatial');
  scriptPatch.textContent = `
// *** Injected by Firefox Reality ***
console.log('${LOGTAG}', 'Fixing playback of Vimeo 360 videos');

window.mozFxr = window.mozFxr || {};
window.mozFxr.patched = Object.assign(window.mozFxr.patched || {}, {vimeoSpatial: {before: false}});
window.mozFxr.patched.vimeoSpatial.after = true;

function getNewUrl (qs) {
  let newUrl = window.location.pathname;
  if (qs) {
    newUrl = newUrl + '?' + qs;
  }
  return newUrl;
}

const qs = new URLSearchParams(window.location.search);

const clipConfig = window.vimeo && window.vimeo.clip_page_config;
let is360 = clipConfig && window.vimeo.clip_page_config.clip.is_spatial;
let videoId = clipConfig && clipConfig.clip && clipConfig.clip.id;

const VIMEO_SELECTORS = {
  player: '.js-player-fullscreen',
  playerArea: '.player_area',
  playerContainer: '.player_container',
  embedPlayer: '#player',
  embedVideo: 'video',
  embedVideoTarget: '.vp-target',
  embedVideoPlayButton: '.vp-controls .play'
};
const VIMEO_PATHS = {
  videoPage: clipConfig,
};
const playerEl = document.querySelector(VIMEO_SELECTORS.player);

let urlConfig = playerEl.querySelector('[data-config-url]').dataset.configUrl;
let urlConfigParsed = new URL(urlConfig);

const projection = qs.get('mozVideoProjection') || (is360 ? '360_auto' : '');
if (!is360) {
  qs.remove('mozVideoProjection');
}
if (!qs.has('mozVideoProjection')) {
  qs.set('mozVideoProjection', projection);
}

const newUrl = getNewUrl(qs);
const currentUrlSearch = (window.location.search || '');
if (newUrl && window.location.pathname + currentUrlSearch !== newUrl) {
  window.history.replaceState({}, document.title, newUrl);
}

const qsIframe = urlConfigParsed.searchParams;
qsIframe.set('canvas', '1');
qsIframe.set('mozVideoProjection', projection);
qsIframe.set('transparent', 'true');

let urlIframe = \`https://player.vimeo.com/video/\${videoId}?\${qsIframe}\${urlConfigParsed.hash}\`;

const playerContainerEl = document.querySelector(VIMEO_SELECTORS.playerContainer);
let previousPlayerContainerHtml = '';

if (currentUrlSearch) {
  const iframeEl = document.querySelector('iframe[data-fxr-patched]');
  if (iframeEl) {
    iframeEl.setAttribute('src', urlIframe);
  } else {
    if (playerContainerEl) {
      previousPlayerContainerHtml = playerContainerEl.innerHTML;
    }
    playerContainerEl.innerHTML = \`<iframe src="\${urlIframe}" id="fxr-webcompat-vimeo-player-360" data-fxr-patched="360" allowfullscreen allow="autoplay; encrypted-media"></iframe>\`;
  }
}

function restorePlayerContainer () {
  if (playerContainerEl && previousPlayerContainerHtml) {
    playerContainerEl.innerHTML = previousPlayerContainerHtml;
  }
}
window.addEventListener('popstate', restorePlayerContainer);
window.addEventListener('pushstate', restorePlayerContainer);
`.trim();
  document.documentElement.appendChild(scriptPatch);
}

// TODO: Remove this later and properly handle single-page-app navigation.
// For now, we require full, synchronous page loads when the user presses a link.
window.addEventListener('click', evt => {
  const closestLinkEl = evt.target && evt.target.closest('a[href^="/"]');
  if (closestLinkEl && closestLinkEl.href && closestLinkEl.origin === 'https://vimeo.com' && !evt.shiftKey && !evt.altKey && !evt.metaKey) {
    evt.preventDefault();
    evt.stopPropagation();
    window.location.href = closestLinkEl.href;
  }
});

window.addEventListener('fullscreenchange', evt => {
  if (!document.fullscreenElement) {
    vimeoImprover();
  }
});

try {
  if (VIMEO_PATHS.videoPage) {
    vimeoImprover();
  }
} catch (err) {
  console.error(LOGTAG, 'Encountered error:', err);
}
