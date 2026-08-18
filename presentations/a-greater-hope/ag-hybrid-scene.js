/* ============================================================================
   AG HYBRID SCENE v1.0
   ----------------------------------------------------------------------------
   Five ordered states on one stage:

     REST_A (video loop) -> SCRUB_1 (canvas) -> REST_B -> SCRUB_2 -> REST_C

   Rest states are native <video> loops that play by themselves. Scrub states are
   canvas frame sequences whose frame index is driven 1:1 by scroll delta. Text
   belongs to rest states only.

   CONFIG SHAPE. Every segment carries its own `data-segment` JSON and the engine
   discovers them with one querySelectorAll. This is deliberate and is the one
   architectural decision the spec asked to be justified: the old single-scene
   build could have used a module constant, but five heterogeneous segments on
   one page would need five hand-wired constants and five hand-wired bindings.
   A per-element attribute makes the segment list data, which is exactly what a
   state machine iterating over ordered segments needs.

   PROVENANCE. The frame loader, ImageBitmap store and alpha-blend draw are
   lifted from ag-sequence v1.0, which in turn lifted them from the proven
   reference build at scroll-scene-demo-05-19-26. The state machine, the delta
   accumulator and the release-to-page behavior are net-new: nothing in the
   library drives frame index from raw wheel delta.

   GSAP/ScrollTrigger are deliberately NOT used by the stage itself: it does not
   scroll, it consumes wheel and touch delta directly, so a scroll-position
   engine has no position to read.

   Lenis DOES run on the page, via ag-scroll v1.2 at the locked lerp 0.07, and
   drives the static sections below the stage. An earlier version of this header
   claimed that while the page did not actually load Lenis at all. It does now.
   ========================================================================== */
(function () {
  'use strict';

  function initStage(stage) {
    const segEls = Array.from(stage.querySelectorAll('[data-segment]'));
    if (!segEls.length) { console.error('AG Hybrid: no [data-segment] found.'); return; }

    const segs = segEls.map((el, i) => {
      let cfg;
      try { cfg = JSON.parse(el.dataset.segment); }
      catch (err) { console.error('AG Hybrid: bad data-segment JSON on segment', i, err); cfg = {}; }
      return {
        i, el, cfg,
        kind: cfg.kind,                       // 'rest' | 'scrub'
        video: el.querySelector('video'),
        canvas: el.querySelector('canvas'),
        text: el.querySelector('[data-seg-text]'),
        frames: null,
        loaded: 0,
        pos: 0,                               // scrub only: drawn index
        target: 0                             // scrub only: where delta wants it
      };
    });

    const opts = Object.assign({
      stepPx: 700,        // wheel delta to cross one whole scrub segment (~7 notches)
      restStepPx: 300,    // default delta to leave a rest state (~3 notches)
      settleMs: 140,      // input must go quiet this long before a rest state takes over
      textDuringScrub: false   // the "text rolls in while scrubbing" idea, OFF by default
    }, JSON.parse(stage.dataset.stageConfig || '{}'));

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isNarrow = window.matchMedia('(max-width: 900px)').matches;

    /* ---- Tier selection -----------------------------------------------------
       Chosen from real viewport width x devicePixelRatio, and applied by setting
       the <source> before the browser fetches anything, so a phone never pulls a
       desktop file. CSS scaling a larger file would download the bytes anyway,
       which is the thing this exists to prevent. */
    const dpr = window.devicePixelRatio || 1;
    const effectiveWidth = window.innerWidth * dpr;
    // A phone viewport is served 360p regardless of DPR. These are full-bleed
    // background loops, not detail imagery: at a 390px viewport even 480p is
    // oversampled at 1.6x a 390px viewport, and the LOCKED Mobile §8 budget
    // is 1400KB total. 360p at crf 30 beats 480p squeezed to the same bytes.
    const tier = window.innerWidth <= 900 ? '360'
               : (effectiveWidth <= 1280 ? '720' : '1080');
    stage.dataset.tier = tier;

    segs.filter(s => s.kind === 'rest' && s.video).forEach(s => {
      const base = s.cfg.videoBase;                 // e.g. "loops/agh-rest-plate1"
      // Built as DOM nodes rather than innerHTML. The value is author-supplied,
      // but a video element is the wrong place to ever parse a string as markup.
      while (s.video.firstChild) s.video.removeChild(s.video.firstChild);
      // h264 only. VP9 was built first and measured 5.2MB against h264's 2.5MB
      // on this footage, so offering it first cost bytes rather than saving
      // them. Listing a format that is not on disk 404s on every rest state.
      const src = document.createElement('source');
      src.src = `${base}-${tier}p.mp4`;
      src.type = 'video/mp4';
      s.video.appendChild(src);
      // Only the opening loop is fetched up front. Loading all three cost 2.6MB
      // before a single interaction and blew the mobile budget on its own.
      if (s.i === 0) { s.video.preload = 'auto'; s.video.load(); }
      else { s.video.preload = 'none'; }
    });

    // ---- Frame loading for scrub segments (lifted from ag-sequence) ---------
    function expand(pattern, i) {
      return pattern.replace(/%0(\d+)d/, (_, w) => String(i + 1).padStart(parseInt(w, 10), '0'));
    }

    function loadFrame(url, arr, idx) {
      return new Promise((res, rej) => {
        const img = new Image();
        img.decoding = 'async';
        img.onload = async () => {
          try { arr[idx] = await createImageBitmap(img); }
          catch (_) { arr[idx] = img; }
          res();
        };
        img.onerror = () => rej(new Error('frame failed: ' + url));
        img.src = url;
      });
    }

    /* Frames load in BATCHES, not all at once, and progress is reported.
       The first version fired all 298 requests in parallel and awaited every
       one before the page could show anything: 25MB and 307 requests before the
       curtain would lift, plus 298 createImageBitmap decodes storming the main
       thread, which is what made it feel choppy as well as slow. Now a small
       leading slice is enough to start, the rest streams in behind, and the
       curtain gets a real percentage instead of an indeterminate bar. */
    const BATCH = 12;                     // concurrent decodes, keeps the main thread breathing

    function reportProgress() {
      let want = 0, have = 0;
      segs.forEach(x => { if (x.kind === 'scrub' && x.count) { want += x.gateCount || x.count; have += x.loaded || 0; } });
      const pct = want ? Math.min(1, have / want) : 0;
      window.dispatchEvent(new CustomEvent('ag:hybrid-progress', { detail: { pct } }));
    }

    async function loadScrub(s, gate) {
      if (s.frames) return s.gatePromise;
      const src = (isNarrow && s.cfg.mobile) ? s.cfg.mobile : s.cfg;
      s.count = src.count;
      s.frames = new Array(s.count);
      s.loaded = 0;
      // Canvas up front, not after the await: a fast scroller can arrive while
      // frames are still in flight and enter() draws immediately on arrival.
      s.ctx = s.canvas.getContext('2d', { alpha: false });
      s.canvas.width = src.width;
      s.canvas.height = src.height;

      // How much has to exist before this segment is considered startable.
      s.gateCount = gate ? Math.min(s.count, Math.ceil(s.count * 0.28)) : 0;
      let gateResolve;
      s.gatePromise = new Promise(r => { gateResolve = r; });
      if (!gate) gateResolve();

      (async () => {
        let failed = 0;
        for (let start = 0; start < s.count; start += BATCH) {
          const slice = [];
          for (let i = start; i < Math.min(start + BATCH, s.count); i++) {
            slice.push(loadFrame(expand(src.framesPath, i), s.frames, i)
              .then(() => { s.loaded++; }, () => { failed++; }));
          }
          await Promise.all(slice);
          reportProgress();
          if (s.loaded === 1) draw(s, 0);          // paint the first frame as soon as it lands
          if (s.gateCount && s.loaded >= s.gateCount) gateResolve();
          // yield so decode does not monopolise the frame
          await new Promise(r => setTimeout(r, 0));
        }
        if (failed) {
          console.error(`AG Hybrid: segment ${s.i} lost ${failed}/${s.count} frames.`);
        }
        gateResolve();
        reportProgress();
      })();

      return s.gatePromise;
    }

    function draw(s, idx) {
      if (!s.frames || !s.ctx || !s.count) return;
      const c = Math.max(0, Math.min(s.count - 1, idx));
      const a = Math.floor(c), b = Math.min(a + 1, s.count - 1), t = c - a;
      const fa = s.frames[a];
      if (!fa) return;
      s.ctx.globalAlpha = 1;
      s.ctx.drawImage(fa, 0, 0, s.canvas.width, s.canvas.height);
      if (t > 0 && a !== b && s.frames[b]) {
        s.ctx.globalAlpha = t;
        s.ctx.drawImage(s.frames[b], 0, 0, s.canvas.width, s.canvas.height);
        s.ctx.globalAlpha = 1;
      }
    }

    /* ---- Inertial easing for scrub segments -------------------------------
       pos chases target at a fixed lerp each frame. 0.14 is an AG DNA timing
       value and lands about 120ms to close a gap, which reads as weighted
       rather than laggy. The loop parks itself once it is within a tenth of a
       frame so it is not burning rAF while nothing moves. */
    let easeRaf = null;
    function startEase(s) {
      if (easeRaf) return;
      const tick = () => {
        const d = s.target - s.pos;
        if (Math.abs(d) < 0.1) {
          s.pos = s.target;
          draw(s, s.pos);
          easeRaf = null;
          armSettle();
          return;
        }
        s.pos += d * 0.14;
        draw(s, s.pos);
        easeRaf = requestAnimationFrame(tick);
      };
      easeRaf = requestAnimationFrame(tick);
    }
    function stopEase() {
      if (easeRaf) { cancelAnimationFrame(easeRaf); easeRaf = null; }
    }

    // ---- State ---------------------------------------------------------------
    let cur = 0;
    let released = false;     // true once the last rest state hands scrolling back
    let settleTimer = null;

    function show(i) {
      segs.forEach((s, k) => {
        const on = (k === i);
        s.el.dataset.active = String(on);
        if (s.kind === 'rest' && s.video) {
          if (on) { const p = s.video.play(); if (p && p.catch) p.catch(() => {}); }
          else s.video.pause();
        }
        if (s.text) {
          const visible = on && (s.kind === 'rest' || opts.textDuringScrub);
          s.text.dataset.visible = String(visible);
        }
      });
      stage.dataset.state = segs[i].kind === 'rest' ? `rest-${i}` : `scrub-${i}`;
      window.dispatchEvent(new CustomEvent('ag:hybrid-state', {
        detail: { index: i, kind: segs[i].kind, stageId: stage.id }
      }));
    }

    /* Fetch what the viewer is about to need, and nothing further. Entering a
       segment warms only its immediate neighbors, so the initial payload is one
       video and the page, not every asset in the presentation. */
    function warm(i) {
      [i - 1, i + 1].forEach(k => {
        const s = segs[k];
        if (!s) return;
        if (s.kind === 'scrub') loadScrub(s, false);
        else if (s.video && s.video.preload === 'none') {
          s.video.preload = 'auto';
          s.video.load();
        }
      });
    }

    function enter(i, atEnd) {
      cur = i;
      dwell = 0; dwellDir = 0;
      resetDwellPaint();
      warm(i);
      const s = segs[i];
      if (s.kind === 'scrub') {
        stopEase();
        s.pos = atEnd ? Math.max(0, (s.count || 1) - 1) : 0;
        s.target = s.pos;
        draw(s, s.pos);
      }
      show(i);
    }

    /* Rest states take over only once input has gone quiet. Without the debounce
       a fast flick lands mid-scrub and immediately snaps to the next rest, which
       reads as the scrub being skipped. */
    function armSettle() {
      clearTimeout(settleTimer);
      settleTimer = setTimeout(() => {
        const s = segs[cur];
        if (s.kind !== 'scrub') return;
        if (s.pos >= s.count - 1 && segs[cur + 1]) enter(cur + 1, false);
        else if (s.pos <= 0 && segs[cur - 1]) enter(cur - 1, true);
      }, opts.settleMs);
    }

    /* Rest states hold until a real push accumulates. Previously ANY nonzero
       delta advanced them, so one wheel notch blew straight past the hero and
       past four engine cards nobody had read yet. Each rest state now declares
       how much scroll it is worth, so denser content dwells longer.
       The accumulator resets on a direction change, otherwise a user who
       nudged up then decided to go down would have to unwind first. */
    let dwell = 0;
    let dwellDir = 0;

    /* A rest state used to sit completely inert while you scrolled, then snap
       to the next segment the instant the threshold tripped. Scrolling felt
       dead and then abrupt. The accumulated push now drives a small eased
       lift-and-soften on the active text, so the gesture is visibly connected
       to what happens, and the swap arrives as the end of a movement rather
       than out of nowhere. Capped well short of invisible: stopping halfway
       has to still look deliberate. */
    let dwellShown = 0, dwellRaf = null;
    function paintDwell(target) {
      const el = segs[cur] && segs[cur].text;
      if (!el) return;
      const tick = () => {
        const d = target - dwellShown;
        if (Math.abs(d) < 0.004) {
          dwellShown = target; dwellRaf = null;
        } else {
          dwellShown += d * 0.18;
          dwellRaf = requestAnimationFrame(tick);
        }
        el.style.setProperty('--dwell', dwellShown.toFixed(3));
      };
      if (!dwellRaf) dwellRaf = requestAnimationFrame(tick);
    }
    function resetDwellPaint() {
      if (dwellRaf) { cancelAnimationFrame(dwellRaf); dwellRaf = null; }
      dwellShown = 0;
      segs.forEach(x => { if (x.text) x.text.style.setProperty('--dwell', '0'); });
    }

    function onDelta(dy) {
      if (prefersReduced) return false;
      const s = segs[cur];

      if (s.kind === 'rest') {
        const dir = dy > 0 ? 1 : -1;
        const dest = dir > 0 ? segs[cur + 1] : segs[cur - 1];

        /* Nothing lies that way. Do not accumulate and do not paint: the first
           plate used to lift its text on an upward scroll even though there was
           nowhere above it to go, which read as the page wobbling for no reason.
           A dead end must look dead. */
        if (!dest) {
          if (dir > 0) { released = true; stage.dataset.released = 'true'; }
          return false;
        }

        if (dir !== dwellDir) { dwell = 0; dwellDir = dir; resetDwellPaint(); }
        dwell += Math.abs(dy);

        const need = s.cfg.dwellPx || opts.restStepPx;
        if (dwell < need) {
          paintDwell(Math.min(1, dwell / need));
          // Consumed while the state is still holding, so the page underneath
          // does not creep during the dwell.
          return true;
        }
        dwell = 0;
        resetDwellPaint();

        enter(dir > 0 ? cur + 1 : cur - 1, dir < 0);
        return true;
      }

      /* scrub: delta moves a TARGET, and a rAF loop eases the drawn position
         toward it. Setting the index straight from delta looked choppy for a
         concrete reason: at 900px across 298 frames a single 100px wheel notch
         lands 33 frames away, so the canvas jumped a third of a second of
         footage per event. The frames were never the problem. Easing turns
         those discrete jumps into continuous motion. */
      const perFrame = opts.stepPx / (s.count - 1);
      const before = s.target;
      s.target = Math.max(0, Math.min(s.count - 1, s.target + dy / perFrame));
      startEase(s);

      /* Advance the moment the transition is spent and the push continues.
         Waiting for the settle debounce here left anyone scrolling steadily
         parked on the last frame until they happened to stop, which reads as
         the page having jammed. The frames were all drawn on the way, so the
         scrub has genuinely been seen by the time this fires. */
      if (dy > 0 && before >= s.count - 1 && segs[cur + 1]) { enter(cur + 1, false); return true; }
      if (dy < 0 && before <= 0 && segs[cur - 1]) { enter(cur - 1, true); return true; }

      return true;    // consumed: the page must not scroll while scrubbing
    }

    // ---- Input ---------------------------------------------------------------
    function wheel(e) {
      if (released && window.scrollY > 0) return;
      const consumed = onDelta(e.deltaY);
      if (consumed) e.preventDefault();
    }
    stage.addEventListener('wheel', wheel, { passive: false });

    let touchY = null;
    stage.addEventListener('touchstart', e => { touchY = e.touches[0].clientY; }, { passive: true });
    stage.addEventListener('touchmove', e => {
      if (touchY === null) return;
      const dy = (touchY - e.touches[0].clientY) * 2.1;
      touchY = e.touches[0].clientY;
      if (onDelta(dy)) e.preventDefault();
    }, { passive: false });
    stage.addEventListener('touchend', () => { touchY = null; }, { passive: true });

    // Keyboard, so this is not mouse-only.
    stage.addEventListener('keydown', e => {
      const map = { ArrowDown: 240, PageDown: 700, ArrowUp: -240, PageUp: -700 };
      if (map[e.key] === undefined) return;
      if (onDelta(map[e.key])) e.preventDefault();
    });
    stage.tabIndex = 0;

    // ---- Boot ----------------------------------------------------------------
    (async function boot() {
      /* Wait on the opening video and a leading slice of the first transition,
         not on every byte. The rest streams in while the hero is already up. */
      const opener = segs[0] && segs[0].video;
      const videoReady = opener ? new Promise(r => {
        if (opener.readyState >= 3) return r();
        opener.addEventListener('canplay', r, { once: true });
        setTimeout(r, 8000);                       // never hang on a stalled video
      }) : Promise.resolve();

      await Promise.all([videoReady, loadScrub(segs[1], true)]);

      if (prefersReduced) {
        /* No jacking, no autoplay, no hidden content. Every segment is shown in
           document order with its text, and scrub canvases hold one settled
           frame. Nothing is reachable only by an interaction that is disabled. */
        stage.dataset.state = 'reduced';
        await Promise.all(segs.filter(s => s.kind === 'scrub').map(x => loadScrub(x, false)));
        segs.forEach(s => {
          s.el.dataset.active = 'true';
          if (s.text) s.text.dataset.visible = 'true';
          if (s.kind === 'scrub') draw(s, s.count - 1);
          if (s.video) { s.video.removeAttribute('autoplay'); s.video.pause(); }
        });
        window.dispatchEvent(new CustomEvent('ag:hybrid-ready',
          { detail: { stageId: stage.id, mode: 'reduced', tier } }));
        return;
      }

      enter(0, false);
      window.dispatchEvent(new CustomEvent('ag:hybrid-ready', {
        detail: {
          stageId: stage.id, mode: 'interactive', tier,
          segments: segs.map(s => ({ kind: s.kind, count: s.count || null, loaded: s.loaded || null }))
        }
      }));
    })();

    // Exposed for verification, not for page code to drive.
    stage.__hybrid = {
      go: (i, atEnd) => enter(i, !!atEnd),
      delta: onDelta,
      state: () => ({ cur, kind: segs[cur].kind, pos: segs[cur].pos, released, tier }),
      segs
    };
  }

  function boot() { document.querySelectorAll('[data-hybrid-stage]').forEach(initStage); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
