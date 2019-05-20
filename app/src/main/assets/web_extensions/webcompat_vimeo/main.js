let LOGTAG = '[firefoxreality:webcompat:vimeo]';
// const VIMEO_SELECTORS = {
//   player: '.js-player-fullscreen',
//   playerArea: '.player_area',
//   playerContainer: '.player_container',
//   embedPlayer: '#player',
//   embedVideo: 'video',
//   embedVideoTarget: '.vp-target',
//   embedVideoPlayButton: '.vp-controls .play'
// };
const VIMEO_CURRENT_PAGE = {
  hasVideo: /\/\d+/.test(window.location.pathname),
  isVideoDetailPage: false,
  isVideoEmbedPage: false
};
if (VIMEO_CURRENT_PAGE.hasVideo) {
  VIMEO_CURRENT_PAGE.isVideoDetailPage = window.location.hostname !== 'player.vimeo.com';
  VIMEO_CURRENT_PAGE.isVideoEmbedPage = window.location.hostname === 'player.vimeo.com';
}
const FXR_PATCH_NAME = 'vimeo360';
// const QS_DEFAULTS = {
//   canvas: '1',
//   mozVideoProjection: '360_auto'
// };
// const PROJECTION_MAPPING = {
//   'equirectangular': '360'
// };
const VIMEO_SCRIPT_REGEXS = {
  videoDetailPage: /window\.vimeo\.clip_page_config\s*=\s*/i,
  videoEmbedPage: /.*config\s*=\s*{/i
};
if (VIMEO_CURRENT_PAGE.hasVideo) {
  LOGTAG += ' [video]';
}
if (VIMEO_CURRENT_PAGE.isVideoDetailPage) {
  LOGTAG += ' [page]';
} else if (VIMEO_CURRENT_PAGE.isVideoEmbedPage) {
  LOGTAG += ' [embed]';
} else {
  LOGTAG += ` [other]`;
}

LOGTAG += ` [${window.location.href}]`;

// let is360 = () => window.vimeo && window.vimeo.clip_page_config && window.vimeo.clip_page_config.clip.is_spatial;
// let is360VideoPage = null;
let qs = new URLSearchParams(window.location.search);
const prefs = {
  log: qs.get('mozDebug') !== '0' && qs.get('mozdebug') !== '0' && qs.get('debug') !== '0'
};

const printLog = String(prefs.log) === 'true';

const log = (...args) => printLog && console.log(LOGTAG, ...args);
const logError = (...args) => printLog && console.error(LOGTAG, ...args);
const logWarn = (...args) => printLog && console.warn(LOGTAG, ...args);

log('loaded');

/*
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
const VIMEO_CURRENT_PAGE = {
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
      previousPlayerContainerHtml = playerContainerEl.innerHTML + '';
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
*/

// TODO: Remove this later and properly handle single-page-app navigation.
// For now, we require full, synchronous page loads when the user presses a link.
/*
window.addEventListener('click', evt => {
  const closestLinkEl = evt.target && evt.target.closest('a[href^="/"]');
  if (closestLinkEl && closestLinkEl.href && closestLinkEl.origin === 'https://vimeo.com' && !evt.shiftKey && !evt.altKey && !evt.metaKey) {
    evt.preventDefault();
    evt.stopPropagation();
    window.location.href = closestLinkEl.href;
  }
});
*/

/*
window.addEventListener('fullscreenchange', evt => {
  if (!document.fullscreenElement) {
    vimeoImprover();
  }
});
*/

try {
  // if (VIMEO_CURRENT_PAGE.videoPage) {
  //   vimeoImprover();
  // }
  // if (VIMEO_CURRENT_PAGE.videoDetailPage && !VIMEO_CURRENT_PAGE.videoEmbedPage) {

  if (VIMEO_CURRENT_PAGE.isVideoDetailPage) {
    log('video page');

    window.addEventListener('beforescriptexecute', patchBeforeScriptExecute);
    // Note: See docs on `beforescriptexecute`, a Gecko-proprietary event:
    // - https://bugzilla.mozilla.org/show_bug.cgi?id=587931
    // - https://developer.mozilla.org/en-US/docs/Web/API/Element/beforescriptexecute_event
    // - https://github.com/whatwg/html/commit/69f83cf
    // - https://github.com/whatwg/html/issues/943
    // - https://github.com/whatwg/html/pull/1103

    function patchBeforeScriptExecute (evt) {
      log('patchBeforeScriptExecute', evt);
      try {
        const target = evt.target;

        const scriptText = target && target.textContent;
        // Look for only unpatched inline <script>s with a line that contains `config = {`,
        // which contains the values for the Vimeo player.
        if (!scriptText || !VIMEO_SCRIPT_REGEXS.videoEmbedPage.test(scriptText) ||
            target.getAttribute('data-fxr-patched') === FXR_PATCH_NAME) {
          return;
        }

        log(`Found Vimeo script: "${target}" [0]`);

        if (document.head.querySelector(`script[data-fxr-patch-for~="${FXR_PATCH_NAME}"]`)) {
          // Already injected inline <script> to patch this JS script and any loaded in the future.
          evt.target.setAttribute('data-fxr-patched', FXR_PATCH_NAME);
          return;
        }

        log(`Found Vimeo script: "${target}" [1]`);

        // Stop the external JS script from being executed, and remove the <script> from the page.
        evt.preventDefault();
        evt.stopPropagation();
        target.remove();

        const scriptTextLines = scriptText.split('\n');
        let line = '';
        let idx = 0;
        let is360 = false;
        for (; idx < scriptTextLines.length; idx++) {
          line = scriptTextLines[idx];
          if (VIMEO_SCRIPT_REGEXS.videoEmbedPage.test(line)) {
            if (line.includes('"is_spatial":true') || line.includes('"is_spatial": true')) {
              is360 = true;
            }
            line = line.trim().replace(/"is_spatial":\s*true/i, '"is_spatial": false');
            break;
          }
        }
        document.documentElement.setAttribute('data-fxr-is-360', is360 ? 'true' : 'false');
        // let configObj = null;
        // try {
        //   configObj = JSON.parse(line);
        // } catch (err) {
        //   logWarn('Could not parse line JSON from from JS variable assignment "config" for Vimeo player', err);
        // }
        // if (configObj) {
        //   log('Detected 360', configObj);
        //   if (configObj.video && configObj.video.spatial !== 0) {
        //     if (configObj.video.spatial.projection === 'equirectangular') {
        //       configObj.video.spatial = 0;
        //     }
        //     if (configObj.video.canvas !== 1) {
        //       configObj.video.canvas = 1;
        //     }
        //     if (configObj.embed.transparent !== 1) {
        //       configObj.embed.transparent = 1;
        //     }
        //     log('Detected 360');
        //     //config.video.embed_code
        //     //configObj.video.share_url
        //     //configObj.video.url
        //   } else {
        //     log('Detected *NOT* 360');
        //   }
        // }
        // line = `var config = ${JSON.stringify(configObj)};`;
        scriptTextLines[idx] = line;

        const newScriptText = scriptTextLines.join('\n');

        // Inject the <script> back onto the page, but this time with the values of `config` changed.
        const scriptRedo = document.createElement('script');
        scriptRedo.textContent = newScriptText;
        scriptRedo.setAttribute('data-fxr-patched', FXR_PATCH_NAME);
        document.body.appendChild(scriptRedo);

        log(`Injected script: "${scriptRedo}" [1]`);

        window.removeEventListener('beforescriptexecute', patchBeforeScriptExecute);
      } catch (err) {
        log('Encountered error:', err);
      }
    }
  } else if (VIMEO_CURRENT_PAGE.isVideoEmbedPage) {
    log('embed page');
    // qs.sort();
    // const qsStrBefore = qs.toString();
    // Object.keys(QS_DEFAULTS).forEach(key => {
    //   if (!qs.has(key)) {
    //     qs.set(key, QS_DEFAULTS[key]);
    //   }
    // });
    //
    // qs.sort();
    // const qsStrAfter = qs.toString();
    //
    // if (qsStrBefore !== qsStrAfter) {
    //   const newUrl = window.location.pathname + '?' + qsStrAfter + (window.location.hash || '');
    //   log('updating URL', '->', newUrl);
    //   window.history.replaceState({}, document.title, newUrl);
    // }

    window.addEventListener('beforescriptexecute', patchBeforeScriptExecute);
    // Note: See docs on `beforescriptexecute`, a Gecko-proprietary event:
    // - https://bugzilla.mozilla.org/show_bug.cgi?id=587931
    // - https://developer.mozilla.org/en-US/docs/Web/API/Element/beforescriptexecute_event
    // - https://github.com/whatwg/html/commit/69f83cf
    // - https://github.com/whatwg/html/issues/943
    // - https://github.com/whatwg/html/pull/1103

    function patchBeforeScriptExecute (evt) {
      log('patchBeforeScriptExecute', evt);
      try {
        const target = evt.target;

        const scriptText = target && target.textContent;
        // Look for only unpatched inline <script>s with a line that contains `config = {`,
        // which contains the values for the Vimeo player.
        if (!scriptText || !VIMEO_SCRIPT_REGEXS.videoDetailPage.test(scriptText) ||
            target.getAttribute('data-fxr-patched') === FXR_PATCH_NAME) {
          return;
        }

        log(`Found Vimeo script: "${target}" [0]`);

        if (document.head.querySelector(`script[data-fxr-patch-for~="${FXR_PATCH_NAME}"]`)) {
          // Already injected inline <script> to patch this JS script and any loaded in the future.
          evt.target.setAttribute('data-fxr-patched', FXR_PATCH_NAME);
          return;
        }

        log(`Found Vimeo script: "${target}" [1]`);

        // Stop the external JS script from being executed, and remove the <script> from the page.
        evt.preventDefault();
        evt.stopPropagation();
        target.remove();

        const scriptTextLines = scriptText.split('\n');
        let line = '';
        let idx = 0;
        for (; idx < scriptTextLines.length; idx++) {
          line = scriptTextLines[idx];
          if (VIMEO_SCRIPT_REGEXS.videoDetailPage.test(line)) {
            line = line.trim().replace(/.*config\s*=\s*/i, '').replace(/;$/, '');
            break;
          }
        }
        let configObj = null;
        try {
          configObj = JSON.parse(line);
        } catch (err) {
          logWarn('Could not parse line JSON from from JS variable assignment "config" for Vimeo player', err);
        }
        let is360 = false;
        if (configObj) {
          log('Detected 360', configObj);
          if (configObj.video && configObj.video.spatial !== 0) {
            if (configObj.video.spatial.projection === 'equirectangular') {
              configObj.video.spatial = 0;
            }
            if (configObj.video.canvas !== 1) {
              configObj.video.canvas = 1;
            }
            if (configObj.embed.transparent !== 1) {
              configObj.embed.transparent = 1;
            }
            is360 = true;
            log('Detected 360');
            //config.video.embed_code
            //configObj.video.share_url
            //configObj.video.url
          } else {
            log('Detected *NOT* 360');
          }
        }
        line = `var config = ${JSON.stringify(configObj)};`;
        scriptTextLines[idx] = line;

        const newScriptText = scriptTextLines.join('\n');

        document.documentElement.setAttribute('data-fxr-is-360', is360 ? 'true' : 'false');

        // Inject the <script> back onto the page, but this time with the values of `config` changed.
        const scriptRedo = document.createElement('script');
        scriptRedo.textContent = newScriptText;
        scriptRedo.setAttribute('data-fxr-patched', FXR_PATCH_NAME);
        document.body.appendChild(scriptRedo);

        log(`Injected script: "${target}" [1]`);

        window.removeEventListener('beforescriptexecute', patchBeforeScriptExecute);
      } catch (err) {
        log('Encountered error:', err);
      }
    }
  }
} catch (err) {
  console.error(LOGTAG, 'Encountered error:', err);
}
