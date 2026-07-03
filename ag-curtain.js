/* ===========================================================
   AG Curtain Standard v2.2
   Orchestrator: 2100ms min, 6000ms timeout, 700ms fade, ag:ready event
   Reads sessionStorage ag_session for subsequent-visit skip
   =========================================================== */

(function () {
  'use strict';

  var IS_FIRST_VISIT = document.documentElement.classList.contains('is-first-visit');
  var MIN_DISPLAY_MS = IS_FIRST_VISIT ? 2100 : 0;
  var MAX_TIMEOUT_MS = 6000;
  var CLEANUP_DELAY_MS = 900;

  var startTime = performance.now();
  var revealed = false;

  function waitForReadiness() {
    var signals = [];
    if (document.fonts && document.fonts.ready) signals.push(document.fonts.ready);
    if (document.readyState !== 'complete') {
      signals.push(new Promise(function (resolve) {
        window.addEventListener('load', resolve, { once: true });
      }));
    }
    return Promise.all(signals);
  }

  function reveal() {
    if (revealed) return;
    revealed = true;
    document.documentElement.classList.remove('is-loading');
    document.documentElement.classList.add('is-ready');
    window.dispatchEvent(new CustomEvent('ag:ready'));
    setTimeout(function () {
      var curtain = document.querySelector('.ag-curtain');
      if (curtain && curtain.parentNode) {
        curtain.parentNode.removeChild(curtain);
      }
    }, CLEANUP_DELAY_MS);
  }

  function boot() {
    var ready = waitForReadiness();
    var timeout = new Promise(function (resolve) {
      setTimeout(resolve, MAX_TIMEOUT_MS);
    });
    Promise.race([ready, timeout]).then(function () {
      var elapsed = performance.now() - startTime;
      var remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);
      setTimeout(reveal, remaining);
    }).catch(function () {
      var elapsed = performance.now() - startTime;
      var remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);
      setTimeout(reveal, remaining);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  window.AGCurtain = { reveal: reveal };
})();
