/* =========================================================== */
/* em-page.js — Eterna Motorworks, page-local effects           */
/* Not a shared ag-* primitive: the drag-track and count-up are */
/* bespoke to this build. Self-initializes, self-contained.     */
/* =========================================================== */
(function () {
  'use strict';

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Hero background video ----
     No `autoplay` attribute in the HTML on purpose: playback is started
     here, gated on reduced-motion, so that preference is respected the
     same way every other animation on this page is. A reduced-motion
     visitor simply sees the <video>'s `poster` frame, which is the same
     starting frame as the loop itself, so nothing looks broken or half-
     loaded. Data-saver visitors get the same fallback via canplay never
     firing / the browser declining to buffer, same net effect. */
  function initHeroVideo() {
    var video = document.getElementById('emHeroVideo');
    if (!video || reduce) return;
    var playPromise = video.play();
    if (playPromise && playPromise.catch) playPromise.catch(function () {});
  }

  /* ---- Count-up: data-countup / data-prefix / data-comma ---- */
  function initCountups() {
    var els = document.querySelectorAll('[data-countup]');
    if (!els.length) return;

    function setFinal(el) {
      var target = parseFloat(el.getAttribute('data-countup'));
      var prefix = el.getAttribute('data-prefix') || '';
      var comma = el.getAttribute('data-comma') === '1';
      el.textContent = prefix + (comma ? target.toLocaleString('en-US') : String(target));
    }

    if (reduce) { els.forEach ? els.forEach(setFinal) : Array.prototype.forEach.call(els, setFinal); return; }

    function animate(el) {
      var target = parseFloat(el.getAttribute('data-countup'));
      var prefix = el.getAttribute('data-prefix') || '';
      var comma = el.getAttribute('data-comma') === '1';
      var duration = 1400; /* --duration-cinematic, 7 x 200 */
      var start = null;

      function tick(now) {
        if (start === null) start = now;
        var p = Math.min((now - start) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        var val = Math.round(target * eased);
        el.textContent = prefix + (comma ? val.toLocaleString('en-US') : String(val));
        if (p < 1) requestAnimationFrame(tick);
        else setFinal(el);
      }
      requestAnimationFrame(tick);
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { animate(entry.target); io.unobserve(entry.target); }
      });
    }, { threshold: 0.6 });

    Array.prototype.forEach.call(els, function (el) { io.observe(el); });
  }

  /* ---- Stage drag-track (HOW WE DO IT) ---- */
  function initRoad() {
    var track = document.getElementById('emRoadTrack');
    if (!track) return;
    var fill = document.getElementById('emRoadFill');
    var prevBtn = document.getElementById('emRoadPrev');
    var nextBtn = document.getElementById('emRoadNext');
    var pipsWrap = document.getElementById('emRoadPips');
    var cards = Array.prototype.slice.call(track.querySelectorAll('.em-road__card'));

    var currentIndex = 0;

    function setActive(index) {
      currentIndex = index;
      cards.forEach(function (c, i) { c.classList.toggle('is-active', i === index); });
      pips.forEach(function (p, i) { p.classList.toggle('is-active', i === index); });
    }

    /* Pips (defined before the initial onTrackScroll() call below, which
       invokes setActive() synchronously and needs `pips` to already exist). */
    var pips = cards.map(function (card, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'em-road__pip' + (i === 0 ? ' is-active' : '');
      b.setAttribute('aria-label', 'Go to stage ' + (i + 1));
      b.addEventListener('click', function () { goTo(i); });
      pipsWrap.appendChild(b);
      return b;
    });

    /* "Active" = the leading card, i.e. whichever card's LEFT edge sits
       closest to the track's current scrollLeft. A wide desktop viewport
       shows 3+ of the 4 cards at once, so a center-of-viewport or
       ratio-based (IntersectionObserver) test ties across several cards
       simultaneously, and which tied card "wins" is implementation-
       defined — that produced the bug where one Next click jumped
       straight to card 4 instead of advancing 1->2->3->4 in order.
       Distance-to-leading-edge has no ties and matches "click Next once,
       advance exactly one stage." */
    function nearestIndexToScrollLeft() {
      var pos = track.scrollLeft;
      var closest = 0, closestDist = Infinity;
      cards.forEach(function (c, i) {
        var dist = Math.abs(c.offsetLeft - pos);
        if (dist < closestDist) { closestDist = dist; closest = i; }
      });
      return closest;
    }

    function updateFill() {
      var max = track.scrollWidth - track.clientWidth;
      var pct = max > 0 ? (track.scrollLeft / max) * 100 : 0;
      fill.style.width = Math.max(6, Math.min(100, pct)) + '%';
    }

    function onTrackScroll() { updateFill(); setActive(nearestIndexToScrollLeft()); }
    track.addEventListener('scroll', onTrackScroll, { passive: true });
    onTrackScroll();

    function goTo(index) {
      index = Math.max(0, Math.min(cards.length - 1, index));
      track.scrollTo({ left: cards[index].offsetLeft, behavior: reduce ? 'auto' : 'smooth' });
      setActive(index);
    }
    function step(dir) { goTo(currentIndex + dir); }
    prevBtn.addEventListener('click', function () { step(-1); });
    nextBtn.addEventListener('click', function () { step(1); });

    /* Pointer drag-to-scroll (mouse). Touch/trackpad keep native scroll. */
    var dragging = false, startX = 0, startScroll = 0, moved = false;
    track.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'touch') return;
      dragging = true; moved = false;
      startX = e.clientX; startScroll = track.scrollLeft;
      track.classList.add('is-dragging');
      track.setPointerCapture(e.pointerId);
    });
    track.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      track.scrollLeft = startScroll - dx;
    });
    function endDrag(e) {
      if (!dragging) return;
      dragging = false;
      track.classList.remove('is-dragging');
      if (e && e.pointerId !== undefined) { try { track.releasePointerCapture(e.pointerId); } catch (err) {} }
    }
    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);
    track.addEventListener('pointerleave', function (e) { if (dragging) endDrag(e); });
    /* Suppress the click that follows a real drag (prevents accidental card link activation). */
    track.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { initHeroVideo(); initCountups(); initRoad(); });
  } else {
    initHeroVideo(); initCountups(); initRoad();
  }
})();
