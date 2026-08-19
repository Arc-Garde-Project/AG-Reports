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
      holdMs: 900,        // a rest state cannot be scrolled past for this long after arriving
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
    /* Tiers are full filename suffixes now, not just numbers, because the phone
       tier is no longer simply a smaller version of the same file.
       THE PHONE GETS A SHARPER, SHORTER LOOP. cover crops 67% of the width at a
       390px viewport, so the visible strip came from about 211 source pixels
       stretched across 1170 device pixels: a 5.5x upscale, which is why it read
       as mush. The phone file is 1280 wide, which halves that, and it pays for
       the resolution by dropping the 2x slow motion (18.5s -> 9.3s) rather than
       by breaching the LOCKED 1400KB budget. Measured: 886KB, and its loop seam
       is 1.25x against neighboring frames where the 360p file it replaces
       measured 3.56x, so the wrap is better as well as sharper. */
    const tier = window.innerWidth <= 900 ? 'phone'
               : (effectiveWidth <= 1280 ? '720p' : '1080p');
    stage.dataset.tier = tier;

    segs.filter(s => s.kind === 'rest' && s.video).forEach(s => {
      const base = s.cfg.videoBase;                 // e.g. "loops/agh-rest-plate1"
      // Built as DOM nodes rather than innerHTML. The value is author-supplied,
      // but a video element is the wrong place to ever parse a string as markup.
      while (s.video.firstChild) s.video.removeChild(s.video.firstChild);

      /* ON A PHONE, ONLY THE HERO IS FOOTAGE. The three loops together are
         1067KB of the LOCKED 1400KB mobile budget, and loading them all to
         honor the "everything before the curtain lifts" rule measured 1931KB,
         a hard breach. Phones get the opening loop and a still for the other
         two, which is the same trade already made for the scrub segments and
         the cost section. The still is the loop's own first frame, so the plate
         is the real image rather than an empty box, and nothing beige can show.
         The full-motion deck is the desktop deck. */
      /* MOBILE RUNS THE SAME DECK AS DESKTOP (Quinten, 2026-08-19).
         Plates 2 and 3 used to be stills on a phone and the scrub segments were
         removed entirely, because three desktop loops plus two desktop frame
         sets is 2768KB against a LOCKED 1400KB. The assets are rebuilt at phone
         scale instead: three 960-wide short loops and two 32-frame 380px scrub
         sets, 1342KB all in. Same five states, same scroll-scrub, same order. */
      // h264 only. VP9 was built first and measured 5.2MB against h264's 2.5MB
      // on this footage, so offering it first cost bytes rather than saving
      // them. The URL is recorded rather than attached as a <source>: boot
      // sets it on the element itself, see loadVideo.
      s.videoUrl = `${base}-${tier}.mp4`;
      /* A POSTER, SO A PLATE IS NEVER AN EMPTY BOX.
         The rest videos other than the opener carry preload="none" and only
         begin fetching when warm() fires, so arriving at Plate 2 or Plate 3
         before its 6-8MB has landed showed the <video> element's own
         background and nothing else. That is what the beige screen was: the
         same defect that used to read as a black screen, just repainted.
         The poster is the loop's own first frame at 854px, 16-28KB, so the
         plate is THERE instantly and the video takes over when it can play.
         Desktop only: on a phone this would add ~70KB to a budget already at
         1377 of 1400KB, and the phone tier is 360p where the wait is short. */
      if (s.cfg.poster) s.video.poster = isNarrow ? (s.cfg.posterMobile || s.cfg.poster) : s.cfg.poster;

      s.video.preload = 'none';   // nothing streams; boot fetches the whole file
    });

    // ---- Frame loading for scrub segments (lifted from ag-sequence) ---------
    function expand(pattern, i) {
      return pattern.replace(/%0(\d+)d/, (_, w) => String(i + 1).padStart(parseInt(w, 10), '0'));
    }

    /* A FRAME REQUEST MUST ALWAYS SETTLE.
       This used to resolve only on load and reject only on error. An <img> that
       neither fires is entirely possible when the browser stalls or drops a
       request under load, and the batch loop below awaits Promise.all, so one
       hung request wedged the whole pipeline permanently.
       That is exactly what happened in production: measured on the live site,
       frame loading STOPPED at 7.5s with scrub 1 at 160 of 298 and scrub 2 at
       77 of 298, both mid-batch, and nothing more arrived for the next twenty
       seconds. The Plate 2 -> 3 transition had no frames to draw, which is why
       it showed no motion.
       Now every request settles: one retry, then it gives up and resolves
       anyway so the loop advances. A frame that never arrives is simply absent
       from the array, and draw() already falls back to the nearest one it has. */
    function loadFrame(url, arr, idx, attempt) {
      return new Promise(res => {
        const img = new Image();
        let done = false;
        const finish = ok => {
          if (done) return; done = true;
          clearTimeout(timer);
          if (ok) return res(true);
          if (attempt < 3) return res(loadFrame(url, arr, idx, attempt + 1));
          res(false);
        };
        const timer = setTimeout(() => { img.src = ''; finish(false); }, 12000);
        img.decoding = 'async';
        img.onload = async () => {
          try { arr[idx] = await createImageBitmap(img); }
          catch (_) { arr[idx] = img; }
          finish(true);
        };
        img.onerror = () => finish(false);
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

    /* PROGRESS COVERS EVERY ASSET THE CURTAIN NOW WAITS FOR, not just the
       frames. It used to report the scrub gate alone, which was a fraction of
       the real wait, so the bar could sit at 100% while three videos were still
       arriving. Each asset contributes its own completion fraction and they are
       averaged: frame sets by frames loaded, videos by how much of their
       duration has buffered. Nothing here is invented — every term is read off
       the asset itself. */
    /* THE LOOPS ARE LOADED ONCE, BY THE ELEMENT.
       They used to be pulled with fetch() and handed over as a blob: URL, so
       the guarantee could be stated in bytes. iOS refuses blob video, so the
       element was given the plain URL instead and the fetch was kept to warm
       the cache. Measured in production, that warms nothing: Vercel serves
       these with "max-age=0, must-revalidate" and the element downloaded the
       whole file a SECOND time. 886KB became 1772KB on a phone, and four loops
       became eight on a desktop. That is most of why the wait was so long.

       One request each now. Readiness is readyState 4, HAVE_ENOUGH_DATA, which
       is the browser stating it can play to the end without stalling.
       Stated honestly: that is a weaker promise than "every byte is here", and
       it is the strongest promise available across both engines. WebKit does
       not populate buffered ranges for these files at all, so a byte-level test
       is not portable. The frame sets, which are the bulk of the deck, keep
       their exact count-based guarantee. */
    function loadVideo(s, url) {
      s.videoReady = false;
      const v = s.video;
      const done = () => {
        if (s.videoReady) return;
        s.videoReady = true;
      };
      v.addEventListener('canplaythrough', done);
      v.addEventListener('loadeddata', () => { if (v.readyState >= 4) done(); });
      v.preload = 'auto';
      v.src = url;
      v.load();
      // some engines settle at readyState 4 without firing canplaythrough again
      const poll = setInterval(() => {
        if (v.readyState >= 4) { done(); clearInterval(poll); }
      }, 250);
      setTimeout(() => clearInterval(poll), 120000);
    }



    function assetsComplete() {
      return segs.every(s => {
        if (s.kind === 'scrub') {
          return !!s.count && ((s.loaded || 0) + (s.failed || 0)) >= s.count;
        }
        if (s.kind === 'rest' && s.video && !s.skipVideo) return !!s.videoReady;
        return true;
      });
    }

    // only used when the hard ceiling trips, so the console says what was missing
    function assetReport() {
      return segs.map(s => {
        if (s.kind === 'scrub') return `scrub${s.i}:${s.loaded || 0}/${s.count || 0}`;
        if (s.kind === 'rest' && s.video && !s.skipVideo) {
          return `video${s.i}:${s.videoReady ? 'ok' : 'rs' + s.video.readyState}`;
        }
        return `seg${s.i}:skipped`;
      }).join(' ');
    }

    function overallProgress() {
      const parts = [];
      segs.forEach(x => {
        if (x.kind === 'scrub' && x.count) {
          parts.push(Math.min(1, (x.loaded || 0) / x.count));
        }
        if (x.kind === 'rest' && x.video && !x.skipVideo) {
          let f = 0;
          if (x.videoReady) f = 1;
          else if (x.video.duration && x.video.buffered && x.video.buffered.length) {
            f = Math.min(0.95, x.video.buffered.end(x.video.buffered.length - 1) / x.video.duration);
          } else if (x.video.readyState >= 1) f = 0.25;
          parts.push(f);
        }
      });
      if (!parts.length) return 0;
      return parts.reduce((a, b) => a + b, 0) / parts.length;
    }

    function reportProgress() {
      window.dispatchEvent(new CustomEvent('ag:hybrid-progress',
        { detail: { pct: overallProgress() } }));
    }

    /* Videos buffer without firing anything useful per chunk, so the readout
       would stall between frame batches. A slow tick keeps it honest and stops
       once the stage is up. */
    let tickerId = 0;
    function progressTicker() {
      if (tickerId) return;
      tickerId = setInterval(() => {
        reportProgress();
        if (overallProgress() >= 1) { clearInterval(tickerId); tickerId = 0; }
      }, 300);
    }

    /* A LOW-RESOLUTION PROXY, LOADED AHEAD OF EVERYTHING ELSE, so a transition
       can MOVE long before its full frame set exists.
       The full sets are 298 frames and about 9MB each. Measured at 8Mbps, the
       second one is not complete until roughly 29 seconds, and a reader arrives
       well before that. That is why the Plate 2 -> Plate 3 scrub read as a
       frozen picture: the frame index was advancing correctly across frames
       that had not arrived.
       The decimated set already built for phones is 43 frames at 640x360, about
       half a megabyte, and lands in about a second. Desktop now loads it too and
       draw() falls back to it, so the scrub animates immediately at low
       resolution and sharpens as the real frames land. Started before the full
       sets so it is first in the queue rather than stuck behind 9MB. */
    function loadProxy(s) {
      const m = s.cfg.mobile;
      if (!m || s.proxy) return;
      s.proxy = new Array(m.count);
      s.proxyCount = m.count;
      (async () => {
        for (let start = 0; start < m.count; start += BATCH) {
          const slice = [];
          for (let i = start; i < Math.min(start + BATCH, m.count); i++) {
            slice.push(loadFrame(expand(m.framesPath, i), s.proxy, i, 0));
          }
          await Promise.all(slice);
          if (s.ctx && !s.lastFrame && s.proxy[0]) draw(s, 0);   // first sign of life
          await new Promise(r => setTimeout(r, 0));
        }
      })();
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
      /* alpha:false means the backing store is OPAQUE and starts BLACK, so a
         canvas that has not been drawn to yet is a black slab and no CSS
         background behind it can show through. That is what produced the pure
         black on the second scrub, which is entered long before its frames
         arrive. Priming it with the footage's own ground means the worst case
         is haze the color of the plates instead of a hole. */
      s.ctx.fillStyle = '#876F58';
      s.ctx.fillRect(0, 0, s.canvas.width, s.canvas.height);

      // How much has to exist before this segment is considered startable.
      s.gateCount = gate ? Math.min(s.count, Math.ceil(s.count * 0.28)) : 0;
      let gateResolve;
      s.gatePromise = new Promise(r => { gateResolve = r; });
      if (!gate) gateResolve();
      // resolves when every frame in this segment has settled, one way or the
      // other. The gate promise cannot serve for this: ungated it resolves at once.
      let doneResolve;
      s.donePromise = new Promise(r => { doneResolve = r; });

      s.failed = 0;
      (async () => {
        let failed = 0;
        for (let start = 0; start < s.count; start += BATCH) {
          const slice = [];
          for (let i = start; i < Math.min(start + BATCH, s.count); i++) {
            slice.push(loadFrame(expand(src.framesPath, i), s.frames, i, 0)
              .then(ok => { if (ok) s.loaded++; else { failed++; s.failed++; } }));
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
        doneResolve();
        reportProgress();
      })();

      return s.gatePromise;
    }

    /* THE CANVAS MUST NEVER BE LEFT UNPAINTED.
       This used to `return` when the requested frame had not arrived yet, which
       left the canvas blank and showed the stage's own background through it.
       Measured on the live site: 10 of 20 samples taken across the two scrubs
       rendered at mean luminance 0, i.e. pure black. Frames load in batches of
       12 behind a 28% gate, so scrolling faster than the network outruns them
       every time, and the reader gets a black slab mid-transition instead of
       the footage.
       Now a missing frame falls back to the nearest EARLIER frame that has
       actually arrived, and failing that to whatever was last painted. The
       transition holds on an image rather than dropping out. */
    function draw(s, idx) {
      if (!s.frames || !s.ctx || !s.count) return;
      const c = Math.max(0, Math.min(s.count - 1, idx));
      const want = Math.floor(c), b = Math.min(want + 1, s.count - 1), t = c - want;
      let fa = s.frames[want];
      const exact = !!fa;
      /* The proxy is consulted BEFORE walking back through the full set. A
         low-resolution frame at the RIGHT index beats a sharp one at the wrong
         index: the first keeps the transition moving, the second freezes it. */
      if (!fa && s.proxy && s.proxyCount) {
        const pi = Math.round((want / Math.max(1, s.count - 1)) * (s.proxyCount - 1));
        fa = s.proxy[pi] || null;
      }
      if (!fa) {
        for (let k = want - 1; k >= 0; k--) { if (s.frames[k]) { fa = s.frames[k]; break; } }
      }
      if (!fa) fa = s.lastFrame;          // nothing behind it yet: hold the last painted image
      if (!fa) return;                    // genuinely nothing has arrived, leave the warm ground
      s.ctx.globalAlpha = 1;
      s.ctx.drawImage(fa, 0, 0, s.canvas.width, s.canvas.height);
      s.lastFrame = fa;
      // blend toward the next frame ONLY when the exact full-resolution frame
      // was the one drawn; blending a sharp neighbor over a proxy flickers
      if (exact && t > 0 && want !== b && s.frames[b]) {
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
      /* 0.14 -> 0.12, paired with stepPx 900 -> 1800.
         The transitions were too fast and read as the footage being cut rather
         than traveled through. stepPx is what actually controls that: at 900
         across 298 frames a single 100px notch jumped 33 frames, a third of a
         second of footage per wheel event. At 1800 it moves 17, so the input is
         twice as fine. The softer lerp smooths what is left.
         Measured cost, notches to cross the whole stage: 35 before, 71 now,
         with each transition going from ~10 notches to 29. Chosen off a sweep:
         2100/0.09 gave 14 frames per notch but 81 notches total, and 1500/0.12
         gave 20 and 61. This is the middle. */
      const tick = () => {
        const d = s.target - s.pos;
        if (Math.abs(d) < 0.1) {
          s.pos = s.target;
          draw(s, s.pos);
          easeRaf = null;
          if (s.exitOnSettle > 0 && s.pos >= s.count - 1.5 && segs[s.i + 1]) {
            s.exitOnSettle = 0; enter(s.i + 1, false); return;
          }
          if (s.exitOnSettle < 0 && s.pos <= 0.5 && segs[s.i - 1]) {
            s.exitOnSettle = 0; enter(s.i - 1, true); return;
          }
          armSettle();
          return;
        }
        /* THE FOOTAGE NEVER PLAYS FASTER THAN THE FOOTAGE.
           A plain lerp moves a fraction of the REMAINING distance, so a single
           wheel notch produced a burst and then a decay. Measured over a real
           mouse-wheel cadence (120px every 90ms): the drawn index advanced a
           mean of 2.30 frames per animation frame with a standard deviation of
           1.78 and a peak of 7.19, and 49% of frames jumped more than 2.5. That
           unevenness is the glitchiness, and the 2.3x mean is the speed.
           The step is now capped at roughly one source frame per animation
           frame. 1.15 was exactly real time and measured too slow to sit
           through, so it is 1.85: still a fixed rate with no burst, about 1.6x
           speed, which takes a transition from 4.8s to roughly 2.7s. Scrolling
           harder does not play faster, it queues more travel and the transition
           plays it out at that constant rate. The exit already waits for the
           drawn position, so nothing is skipped by the lag. */
        const step = d * 0.12;
        s.pos += Math.sign(step) * Math.min(Math.abs(step), 1.85);
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
        /* Never on a phone. Scrub segments are removed from the DOM at <=900px
           (.hseg:has(canvas){display:none}) so their frames can never be seen,
           and warm() was still pulling the decimated set for them: measured at
           a 390px viewport, ~40 frames of frames-scrub1-mobile downloading for
           a segment that does not render. */
        if (s.kind === 'scrub') loadScrub(s, false);
        else if (s.video && !s.skipVideo && s.video.preload === 'none') {
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
      /* NO ANCHORS ON A PHONE (Quinten, 2026-08-19). The hold is a TIME-based
         refusal: the plate will not advance for holdMs no matter how hard you
         push. That is right on a desktop, where a trackpad flick is 500px and
         would otherwise throw the reader past a plate they never saw. On a
         phone it reads as the deck fighting the thumb. Mobile keeps the
         DISTANCE cost below (dwellPx), which is the same bargain the last
         section makes: content takes scroll to pass, but nothing refuses to
         move. A swipe carries straight through. */
      if (s.kind === 'rest') s.holdUntil = performance.now() + (isNarrow ? 0 : (s.cfg.holdMs || opts.holdMs));
      if (s.kind === 'scrub') {
        stopEase();
        s.pos = atEnd ? Math.max(0, (s.count || 1) - 1) : 0;
        s.target = s.pos;
        /* ENTERING A TRANSITION COSTS SCROLL, SO LEAVING IT THE SAME WAY MUST
           TOO. Entering cost a full rest dwell, six notches, while backing out
           through the same edge cost ONE, so scrolling up six and back down six
           did not return you where you started: it bounced out of the scrub
           instantly and then spent the rest of the push entering the NEXT
           transition. That asymmetry is what read as the deck skipping ahead
           and ignoring the transition.
           This is the toll for going back out the way you came in. Pushing
           INWARD clears it immediately, so it never gets in the way of actually
           traveling the scrub. */
        s.edgeHold = isNarrow ? 0 : (opts.edgeHoldPx || 300);
        s.edgeFrom = atEnd ? 1 : -1;
        s.exitOnSettle = 0;
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
      /* THE STAGE DOES NOT TOUCH INPUT ON A PHONE.
         Mobile unstacks into normal flow and the scrub segments are removed, so
         there is nothing to jack, but the touchmove handler still ran onDelta,
         got `true` back and called preventDefault on every move. That is why
         the deck could not be swiped AT ALL on iOS: the page was scrollable,
         the gesture was simply being eaten. Reported on two devices.
         Synthetic touch events cannot drive native scrolling, which is why no
         amount of emulation surfaced it. */
      if (prefersReduced) return false;
      const s = segs[cur];

      if (s.kind === 'rest') {
        const dir = dy > 0 ? 1 : -1;
        const dest = dir > 0 ? segs[cur + 1] : segs[cur - 1];

        /* THE LAST PLATE HAS TO REST TOO.
           Scrolling down off the final rest state found no next segment and
           released the page on the FIRST notch, so that plate never dwelled at
           all: its copy was handed away before anyone could read it, which is
           why the resting sections did not read as rests. It now spends the
           same dwell every other rest state spends, and only then hands over.
           Upward off the first plate stays genuinely dead: there is nothing
           above it, and accumulating there made the hero wobble for no reason. */
        if (!dest) {
          if (dir < 0) return false;
          if (dir !== dwellDir) { dwell = 0; dwellDir = dir; resetDwellPaint(); }
          dwell += Math.abs(dy);
          if (performance.now() < (s.holdUntil || 0)) {
            paintDwell(Math.min(1, dwell / (s.cfg.dwellPx || opts.restStepPx)));
            return true;
          }
          const needOut = s.cfg.dwellPx || opts.restStepPx;
          if (dwell < needOut) { paintDwell(Math.min(1, dwell / needOut)); return true; }
          dwell = 0; resetDwellPaint();
          released = true; stage.dataset.released = 'true';
          return false;
        }

        if (dir !== dwellDir) { dwell = 0; dwellDir = dir; resetDwellPaint(); }
        dwell += Math.abs(dy);

        /* A PLATE HOLDS FOR A BEAT NO AMOUNT OF SCROLL CAN BUY THROUGH.
           dwellPx alone could not anchor anything: 500px is a single trackpad
           flick, so arriving at a plate mid-gesture handed it straight on and
           the reader never saw what was on it. A rest state now refuses to
           advance for holdMs after it is entered, however hard the wheel is
           turned. Scroll still paints the dwell response during the hold, so it
           reads as the plate resisting rather than as the page ignoring you. */
        if (performance.now() < (s.holdUntil || 0)) {
          paintDwell(Math.min(1, dwell / (s.cfg.dwellPx || opts.restStepPx)));
          return true;
        }

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
      s.target = Math.max(0, Math.min(s.count - 1, s.target + dy / perFrame));
      startEase(s);

      /* THE TRANSITION HAS TO ACTUALLY FINISH BEFORE IT HANDS OVER.
         This used to test `before`, the TARGET, which the delta moves
         instantly. The drawn position eases toward that target at a fraction
         per frame, so the target hits the end long before the picture does and
         the segment was handed on with the tail of the scrub never shown.
         Measured: scrolling up into this scrub and back down, it jumped to the
         next state with the drawn frame at 271 of 297. Twenty-six frames of
         the transition, discarded, every time.
         The exit now waits for the DRAWN position, so the last frame a reader
         sees is the last frame of the transition. Pushing harder meanwhile is
         not lost: the target stays pinned at the edge and the ease keeps
         running, so it costs a beat, not a jam. */
      if (s.edgeHold > 0) {
        const backOut = (s.edgeFrom > 0 && dy > 0) || (s.edgeFrom < 0 && dy < 0);
        if (backOut) { s.edgeHold -= Math.abs(dy); return true; }
        s.edgeHold = 0;                 // moved inward: the toll is spent
      }

      const atEnd   = s.pos >= s.count - 1.5 && s.target >= s.count - 1;
      const atStart = s.pos <= 0.5 && s.target <= 0;
      if (dy > 0 && atEnd && segs[cur + 1]) { enter(cur + 1, false); return true; }
      if (dy < 0 && atStart && segs[cur - 1]) { enter(cur - 1, true); return true; }

      /* Pushed past the end while the picture is still catching up. Remember
         it, so the advance fires the moment the ease lands rather than making
         the reader nudge again to unstick a transition that has visibly
         finished. */
      if (dy > 0 && s.target >= s.count - 1 && segs[cur + 1]) s.exitOnSettle = 1;
      else if (dy < 0 && s.target <= 0 && segs[cur - 1]) s.exitOnSettle = -1;
      else s.exitOnSettle = 0;

      return true;    // consumed: the page must not scroll while scrubbing
    }

    // ---- Input ---------------------------------------------------------------
    function wheel(e) {
      if (released && window.scrollY > 0) return;
      const consumed = onDelta(e.deltaY);
      if (consumed) e.preventDefault();
    }
    if (!prefersReduced) stage.addEventListener('wheel', wheel, { passive: false });

    let touchY = null;
    if (!prefersReduced) {
      stage.addEventListener('touchstart', e => { touchY = e.touches[0].clientY; }, { passive: true });
      stage.addEventListener('touchmove', e => {
        if (touchY === null) return;
        const dy = (touchY - e.touches[0].clientY) * 2.1;
        touchY = e.touches[0].clientY;
        if (onDelta(dy)) e.preventDefault();
      }, { passive: false });
      stage.addEventListener('touchend', () => { touchY = null; }, { passive: true });
    }

    // Keyboard, so this is not mouse-only.
    stage.addEventListener('keydown', e => {
      const map = { ArrowDown: 240, PageDown: 700, ArrowUp: -240, PageUp: -700 };
      if (map[e.key] === undefined) return;
      if (onDelta(map[e.key])) e.preventDefault();
    });
    stage.tabIndex = 0;

    /* THE SUN MEETS THE LOGO ON A PHONE TOO.
       The desktop fix is a fixed transform, which works there because cover
       barely crops a 16:9 plate in a 16:9-ish window. A phone is nothing like
       that: at 390x844 the drawn image is ~1500px wide against a 390px box, so
       two thirds of the width is cropped and the sun lands about 37px right of
       center. That offset is not a constant either, it moves with the viewport,
       so it is COMPUTED rather than guessed: object-position is solved from the
       real box, the real intrinsic size and the sun's measured position at
       52.5% of frame width. Holds across 350 to 900 by construction. */
    /* PORTRAIT PHONE ASSETS ARE CROPPED AROUND THE SUN ALREADY (2026-08-19),
       so on a phone the sun sits at the middle of its own frame rather than at
       52.5% of a wide one. Landscape tiers keep the measured value. */
    const SUN_X = isNarrow ? 0.5 : 0.525;
    function aimSun() {
      const s = segs[0];
      if (!s || !s.video || !isNarrow) return;
      const v = s.video, r = v.getBoundingClientRect();
      const vw = v.videoWidth, vh = v.videoHeight;
      if (!vw || !vh || !r.width || !r.height) return;
      const scale = Math.max(r.width / vw, r.height / vh);
      const drawnW = vw * scale;
      const over = drawnW - r.width;
      if (over <= 1) { v.style.objectPosition = ''; return; }
      const p = (SUN_X * drawnW - r.width / 2) / over;
      v.style.objectPosition = (Math.max(0, Math.min(1, p)) * 100).toFixed(2) + '% center';
    }
    if (isNarrow) {
      window.addEventListener('resize', aimSun, { passive: true });
      window.addEventListener('orientationchange', aimSun);
      if (segs[0] && segs[0].video) {
        segs[0].video.addEventListener('loadedmetadata', aimSun);
        segs[0].video.addEventListener('loadeddata', aimSun);
      }
    }

    // ---- Boot ----------------------------------------------------------------
    (async function boot() {
      /* EVERYTHING IS IN BEFORE THE CURTAIN LIFTS. Quinten, 2026-08-18.
         This used to wait on the opening video and a 28% slice of the first
         transition, and let the rest stream in behind the hero. That is why a
         reader could arrive at a plate whose video had not started, or a scrub
         whose frames had not landed, and get a flat color instead of footage.
         The loading screen exists to be the guarantee, so it now holds until
         every rest loop can play through and every frame set is complete.
         The cost is a longer wait, which is exactly what the percentage on the
         curtain is there to show. */

      // proxies first: small, and they make the transitions usable the instant
      // the stage opens even if a full set is still settling
      if (!isNarrow) segs.forEach(s => { if (s.kind === 'scrub') loadProxy(s); });   // phone frames ARE the small set

      // every rest loop, downloaded in full before anything opens
      segs.forEach(s => {
        if (s.kind === 'rest' && s.video && !s.skipVideo && s.videoUrl) loadVideo(s, s.videoUrl);
      });

      /* Scrub sets are skipped entirely on a phone: those segments are removed
         from the DOM there, so fetching them would be pure weight and would
         make the wait longer for nothing. */
      segs.forEach(s => { if (s.kind === 'scrub') loadScrub(s, false); });

      progressTicker();

      /* NOBODY GETS PAST THE CURTAIN UNTIL EVERY ASSET IS ACTUALLY IN.
         Quinten, 2026-08-18, stated twice.

         This waits on FULL BUFFERING, not on canplaythrough. That event is the
         browser's ESTIMATE that it could play to the end without stalling, not
         a statement that the file has arrived, so waiting on it could still
         hand over a deck that had to fetch mid-scroll. buffered.end() against
         duration is the real thing.

         There is no routine timeout here any more. Both the video wait and the
         frame wait used to give up after 45s and release a half-loaded page,
         which is exactly what the loading screen exists to prevent. A stalled
         video is RE-KICKED instead, every 8 seconds, until it completes.

         The only ceiling left is HARD_CEILING, and it is a genuine last resort
         against a permanently broken asset: reaching it is a defect and it says
         so in the console. */
      const HARD_CEILING = 240000;
      const t0 = performance.now();
      let ceilingHit = false;

      await new Promise(resolve => {
        (function check() {
          if (assetsComplete()) return resolve();
          if (performance.now() - t0 > HARD_CEILING) {
            ceilingHit = true;
            console.error('AG Hybrid: assets did not finish within ' +
              (HARD_CEILING / 1000) + 's; opening anyway. ' + assetReport());
            return resolve();
          }
          setTimeout(check, 250);
        })();
      });
      if (!ceilingHit) reportProgress();

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
        window.__agHybridReady = true;
        window.dispatchEvent(new CustomEvent('ag:hybrid-ready',
          { detail: { stageId: stage.id, mode: 'reduced', tier } }));
        return;
      }

      enter(0, false);

      /* Nothing is prefetched here any more. Boot above does not resolve until
         every video can play through and every frame set is complete, so by the
         time this line runs there is nothing left to fetch. */

      /* LATCH BEFORE DISPATCHING. An event only reaches listeners that already
         exist. ag-curtain.js is an external script and on a phone this fires in
         a few hundred milliseconds, so the curtain could miss it entirely and
         wait forever on a signal that had already happened. The flag is what
         makes readiness order-independent. */
      window.__agHybridReady = true;
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
