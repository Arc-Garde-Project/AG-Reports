/* =========================================================== */
/* AG Curtain — Orchestrator (CANONICAL DROP-IN, locked)        */
/* Source of truth: sectors/web/standards/AG-CURTAIN-STANDARD.md */
/* Loads LAST so it can wait on the other AG systems.           */
/* Holds MIN_DISPLAY, fails open at MAX_TIMEOUT, lifts + removes */
/* the curtain, fires `ag:ready`. SESSION-GATED: the full intro */
/* plays once per visit (sessionStorage) so multi-page sites do  */
/* not replay it on every navigation; repeat loads reveal at     */
/* once. Mount the curtain as the FIRST child of <body>.        */
/* =========================================================== */
(function () {
  var MIN_DISPLAY_MS = 2520;   /* sweep-reveal: emblem 0-1120, sweep+reveal 1260-2160, hold ~360, then lift */
  /* ADAPTED for this page. The stock 6000 fails open before a video-led stage
     can possibly be ready: the opening loop alone is ~7MB at 1080p and the
     first scrub set is ~10MB. Failing open early would show exactly the
     half-loaded stage the curtain exists to hide. Still fails open, just later. */
  var MAX_TIMEOUT_MS = 14000;
  var CLEANUP_DELAY_MS = 900;
  var SESSION_KEY = 'agCurtainShown';

  var root = document.documentElement;

  function removeCurtain() {
    var c = document.querySelector('.ag-curtain');
    if (c && c.parentNode) c.parentNode.removeChild(c);
  }

  // Session gate: if the intro already played this visit, skip it (no replay
  // on internal navigation across a multi-page static site).
  var seen = false;
  try { seen = sessionStorage.getItem(SESSION_KEY) === '1'; } catch (e) {}
  if (seen) {
    root.classList.remove('is-loading');
    root.classList.add('is-ready');
    removeCurtain();
    return;
  }

  var startTime = (window.performance && performance.now) ? performance.now() : Date.now();
  var revealed = false;

  function waitForReadiness() {
    var signals = [];
    if (document.fonts && document.fonts.ready) signals.push(document.fonts.ready);
    if (document.readyState !== 'complete') {
      signals.push(new Promise(function (resolve) { window.addEventListener('load', resolve, { once: true }); }));
    }
    /* ADAPTED: window 'load' does NOT cover this page. The scrub frames are
       fetched by the engine after boot and the rest loops are <video>, neither
       of which holds up 'load'. ag:hybrid-ready is the engine's own signal that
       the opening loop and the first transition are actually decoded, so the
       curtain waits on the thing it is supposed to be waiting on. */
    if (document.querySelector('[data-hybrid-stage]')) {
      signals.push(new Promise(function (resolve) {
        window.addEventListener('ag:hybrid-ready', resolve, { once: true });
      }));
    }
    return Promise.all(signals);
  }

  function now() { return (window.performance && performance.now) ? performance.now() : Date.now(); }

  function reveal() {
    if (revealed) return;
    revealed = true;
    try { sessionStorage.setItem(SESSION_KEY, '1'); } catch (e) {}
    root.classList.remove('is-loading');
    root.classList.add('is-ready');
    window.dispatchEvent(new CustomEvent('ag:ready'));
    setTimeout(removeCurtain, CLEANUP_DELAY_MS);
  }

  function boot() {
    var ready = waitForReadiness();
    var timeout = new Promise(function (resolve) { setTimeout(resolve, MAX_TIMEOUT_MS); });
    Promise.race([ready, timeout]).catch(function () {}).then(function () {
      var remaining = Math.max(0, MIN_DISPLAY_MS - (now() - startTime));
      setTimeout(reveal, remaining);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  /* Real progress on the bar. The stock indeterminate slider tells the viewer
     nothing while a video-led stage pulls its assets, which reads as a hang.
     The engine emits ag:hybrid-progress with a 0..1 fraction. */
  (function () {
    var bar = document.querySelector('.ag-curtain-load__bar');
    var label = document.querySelector('.ag-curtain-load__label');
    if (!bar) return;
    var fill = bar.querySelector('i');
    window.addEventListener('ag:hybrid-progress', function (e) {
      var pct = Math.round((e.detail && e.detail.pct || 0) * 100);
      bar.classList.add('is-determinate');
      if (fill) fill.style.width = pct + '%';
      if (label) label.textContent = 'Loading ' + pct + '%';
    });
  })();

  window.AGCurtain = { reveal: reveal };
})();
