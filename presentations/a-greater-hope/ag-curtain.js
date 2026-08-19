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
  /* MAX was 14000, then 60000. NOBODY GETS PAST THIS UNTIL EVERY ASSET IS IN
     (Quinten, 2026-08-18, stated twice). The engine and the cloud loop each
     wait on FULL BUFFERING now and re-kick a stalled fetch rather than giving
     up, and each carries its own 240s last-resort ceiling that logs an error.
     This one sits ABOVE both of those so it can never be the thing that
     releases a half-loaded deck: if it ever fires, both reporters have failed
     to report at all, which is a defect and says so. */
  var MIN = 2520, BRAND_AT = 1400, CLEANUP = 900, MAX = 300000;
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

  /* ---- REAL PROGRESS, COUNTED SMOOTHLY ------------------------------------
     WHAT THE NUMBER MEANS, stated plainly: ag:hybrid-progress reports how much
     of the scrub frame gate has arrived, which is the dominant part of this
     load. It is not every byte on the page, so the readout is HELD BELOW 100
     until ag:hybrid-ready actually fires, and only then runs to 100. It never
     shows 100 while the deck is still assembling, and it never goes backwards.

     The engine reports in batches of 12, so the raw value arrives in steps. A
     rAF loop eases the displayed number toward the target instead of letting it
     jump, and adds a slow creep while a batch is in flight so it never looks
     frozen. The creep can only ever approach the real value, never pass it. */
  var fill = C.querySelector('.ld-progress i');
  var pctEl = C.querySelector('.ld-pct');
  var target = 0, shown = 0, ready = false, raf = 0, finish;
  /* The lift waits for the count to actually reach 100 so it is never cut off
     mid-number. It can only delay things once ag:hybrid-ready has landed, and
     the MAX fail-open below still overrides it. */
  var counted = new Promise(function (res) { finish = res; });

  /* Two reporters, because the cloud loop on the last section is not part of
     the stage. They are blended by rough byte share, stage ~35MB against the
     cloud loop's ~5MB, so the number tracks the whole wait rather than the
     larger half of it. The weights are an approximation and are stated as one;
     everything else about the readout is measured. */
  var STAGE_W = 0.87, COST_W = 0.13;
  var stagePct = 0, costPct = 0;
  function blend() {
    target = Math.max(target, Math.min(1, stagePct * STAGE_W + costPct * COST_W));
  }
  window.addEventListener('ag:hybrid-progress', function (e) {
    var p = e && e.detail && typeof e.detail.pct === 'number' ? e.detail.pct : 0;
    stagePct = Math.max(stagePct, Math.max(0, Math.min(1, p)));
    blend();
  });
  window.addEventListener('ag:cost-progress', function (e) {
    var p = e && e.detail && typeof e.detail.pct === 'number' ? e.detail.pct : 0;
    costPct = Math.max(costPct, Math.max(0, Math.min(1, p)));
    blend();
  });
  window.addEventListener('ag:cost-ready', function () { costPct = 1; blend(); });
  window.addEventListener('ag:hybrid-ready', function () { ready = true; target = 1; }, { once: true });
  /* Same race as the signals below: either reporter may have finished before
     this script ran, so the latched flags are read once at startup rather than
     relying on an event that has already been and gone. */
  if (window.__agCostReady) { costPct = 1; blend(); }
  if (window.__agHybridReady) { ready = true; target = 1; }

  function tick() {
    var cap = ready ? 1 : 0.99;               // never claim done before it is
    var t = Math.min(target, cap);
    // creep toward the target so a slow batch still shows life
    if (shown < t) shown += Math.max((t - shown) * 0.08, 0.0016);
    if (shown > t) shown = t;
    if (shown > cap) shown = cap;
    var whole = Math.floor(shown * 100);
    if (pctEl) pctEl.textContent = whole + '%';
    if (fill) fill.style.width = (shown * 100).toFixed(1) + '%';
    if (ready && shown >= 1) { finish(); return; }
    raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);
  window.addEventListener('ag:ready', function () { cancelAnimationFrame(raf); }, { once: true });

  /* Both signals must land: the document finishing, and the engine saying the
     stage is actually ready to be looked at. */
  var signals = [];
  if (document.readyState === 'complete') signals.push(Promise.resolve());
  else signals.push(new Promise(function (res) {
    window.addEventListener('load', res, { once: true });
  }));
  /* Each reporter LATCHES a flag before it dispatches, and this checks the flag
     first. Listening alone is a race: whichever of these fires before the
     external curtain script has executed would be missed entirely, and the
     curtain would wait on a signal that had already happened. That is exactly
     what hung the phone, where the cost section reports in ~255ms. */
  function awaitSignal(name, flag) {
    return new Promise(function (res) {
      if (window[flag]) return res();
      window.addEventListener(name, res, { once: true });
    });
  }
  signals.push(awaitSignal('ag:hybrid-ready', '__agHybridReady'));
  /* The cost section's cloud sequence is not part of the stage, so it reports
     separately. Without this the curtain could lift while the last section
     still had no footage. */
  signals.push(awaitSignal('ag:cost-ready', '__agCostReady'));
  signals.push(counted);   /* let the number finish counting, see above */

  Promise.all(signals).then(function () {
    setTimeout(lift, Math.max(0, MIN - (performance.now() - start)));
  });

  /* Last resort only. Reaching this means neither the stage nor the cloud loop
     reported within five minutes, which is a defect worth seeing rather than
     hiding. */
  setTimeout(function () {
    if (done) return;
    console.error('AG curtain: nothing reported ready within ' + (MAX / 1000) +
      's; opening anyway. The deck may be incomplete.');
    lift();
  }, MAX);
})();
