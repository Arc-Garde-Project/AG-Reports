/* ═══════════════════════════════════════════════════════════════════
   AG CURTAIN — "Arc Garde Presents" presentation loader, orchestrator
   -------------------------------------------------------------------
   The AG presentation loader, lifted from the deployed decks (dr-dani-b,
   c-design, arbor-growth-roadmap, all identical). Phases: load -> brand,
   then lift, then remove.

   ONE ADAPTATION, and it is the reason the curtain exists on this deck.
   The standard schedules the lift off `window.load`. That does not work
   here: the stage's rest states are <video> and its scrub frames are
   fetched by the engine AFTER boot, so neither holds up `load`. Left as
   the standard has it, the curtain would lift before the thing it exists
   to hide had arrived. It therefore ALSO waits on `ag:hybrid-ready`, the
   engine's own signal, and MAX rises from 6000 to 14000 because the
   opening loop alone is ~8.5MB at 1080p and the stock 6s fail-open would
   fire in front of a still-empty stage.

   Everything else, including the 2520 minimum and the 1400ms phase turn,
   is the standard untouched.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  var C = document.querySelector('.ag-curtain'), root = document.documentElement;
  if (!C) { root.classList.remove('is-loading'); return; }

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var MIN = 2520, BRAND_AT = 1400, CLEANUP = 900, MAX = 14000;
  var start = performance.now(), done = false;

  function lift() {
    if (done) return; done = true;
    root.classList.remove('is-loading');
    root.classList.add('is-ready');
    window.dispatchEvent(new CustomEvent('ag:ready'));
    setTimeout(function () { if (C.parentNode) C.parentNode.removeChild(C); }, CLEANUP);
  }

  if (reduce) { lift(); return; }

  setTimeout(function () { C.setAttribute('data-phase', 'brand'); }, BRAND_AT);

  /* Real progress on the hairline. The engine reports a 0..1 fraction as the
     frame sets arrive; the bar only reveals once there is something to show. */
  var prog = C.querySelector('.ld-progress'), fill = prog && prog.querySelector('i');
  if (prog && fill) {
    window.addEventListener('ag:hybrid-progress', function (e) {
      var pct = e && e.detail && typeof e.detail.pct === 'number' ? e.detail.pct : 0;
      if (pct > 0) prog.classList.add('is-live');
      fill.style.width = Math.max(0, Math.min(1, pct)) * 100 + '%';
    });
  }

  /* Both signals must land: the document finishing, and the engine saying the
     stage is actually ready to be looked at. */
  var signals = [];
  if (document.readyState === 'complete') signals.push(Promise.resolve());
  else signals.push(new Promise(function (res) {
    window.addEventListener('load', res, { once: true });
  }));
  signals.push(new Promise(function (res) {
    window.addEventListener('ag:hybrid-ready', res, { once: true });
  }));

  Promise.all(signals).then(function () {
    setTimeout(lift, Math.max(0, MIN - (performance.now() - start)));
  });

  setTimeout(lift, MAX);   /* fail open: never trap the reader behind the curtain */
})();
