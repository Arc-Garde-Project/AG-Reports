/* ============================================================ */
/* Master Dental - Brand MOTION engine (loads LAST, after the    */
/* ag-* scripts). Adds the cinematic effects layer on top of the */
/* canonical primitives without touching them:                   */
/*   1. hero headline word mask-rise (on curtain lift)           */
/*   2. hero gold light-sweep (on curtain lift)                  */
/*   3. depth parallax (hero photo + framed story/spot media)    */
/*   4. magnetic CTAs + cursor-origin fill on every ag-button    */
/*   5. cursor spotlight across trust cards + service tiles      */
/* Pointer effects gate on a fine pointer; parallax + sweep + the */
/* split skip under reduced-motion or <=900px. Self-initializes. */
/* ============================================================ */
(function () {
  'use strict';
  var mq = window.matchMedia;
  if (!mq) return;
  var reduced = mq('(prefers-reduced-motion: reduce)').matches;
  var fine    = mq('(pointer: fine)').matches && mq('(hover: hover)').matches;
  var mobile  = mq('(max-width: 900px)').matches;
  var motionOK = !reduced && !mobile;

  /* ---- run the hero entrance exactly once, when the curtain lifts ---- */
  function onReady(cb) {
    var ran = false;
    function go() { if (ran) return; ran = true; cb(); }
    var root = document.documentElement;
    // curtain gone (repeat visit / no curtain) -> play now; else wait for ag:ready
    if (!document.querySelector('.ag-curtain') || root.classList.contains('is-ready')) { go(); return; }
    window.addEventListener('ag:ready', go, { once: true });
    setTimeout(go, 6500); // fail-open if the curtain orchestrator never fires
  }

  /* ====================================================== */
  /* 1. HERO HEADLINE - split into word masks, then rise     */
  /* ====================================================== */
  function splitHeadline() {
    var h = document.querySelector('.hero__title[data-split-words]');
    if (!h) return null;
    if (reduced || mobile) return null;        // leave the headline as plain visible text
    try {
      var frag = document.createDocumentFragment();
      var inners = [];
      // STATIC snapshot - moving the <em> out of h mutates the live NodeList mid-loop
      var nodes = Array.prototype.slice.call(h.childNodes);
      nodes.forEach(function (node) {
        if (node.nodeType === 3) {             // text node
          // split on REGULAR spaces only - never on   (keeps "dental care" joined)
          node.textContent.split(/([ \t\n]+)/).forEach(function (part) {
            if (part === '') return;
            if (/^[ \t\n]+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span'); w.className = 'w';
            var inner = document.createElement('span'); inner.className = 'wi'; inner.textContent = part;
            w.appendChild(inner); frag.appendChild(w); inners.push(inner);
          });
        } else if (node.nodeType === 1) {       // element node (the <em>) - keep it as one unit
          var w2 = document.createElement('span'); w2.className = 'w';
          node.classList.add('wi');
          w2.appendChild(node); frag.appendChild(w2); inners.push(node);
        }
      });
      h.textContent = '';
      h.appendChild(frag);
      h.classList.add('is-split');
      inners.forEach(function (wi, i) { wi.style.transitionDelay = (i * 42) + 'ms'; });
      return h;
    } catch (e) {
      h.classList.remove('is-split');           // any failure -> revert to plain visible headline
      return null;
    }
  }

  var heroTitle = splitHeadline();

  onReady(function () {
    var hero = document.querySelector('.hero');
    if (hero && motionOK) hero.classList.add('is-lit');     // one-shot gold sweep
    // Reveal hero content with the curtain lift (NOT via the IO): the bottom-left
    // edge-pinned CTA sits in the IO's -10% dead-zone and would never fire on load.
    document.querySelectorAll('.hero .reveal').forEach(function (el) { el.classList.add('in-view'); });
    if (heroTitle) {
      requestAnimationFrame(function () { requestAnimationFrame(function () { heroTitle.classList.add('go'); }); });
      setTimeout(function () { heroTitle.classList.add('go'); }, 1400); // safety reveal
    }
  });

  /* ====================================================== */
  /* 2. DEPTH PARALLAX - one rAF loop for every layer        */
  /* ====================================================== */
  if (motionOK) {
    var heroMedia = document.querySelector('.hero__media');
    var heroEl = document.querySelector('.hero');
    var depth = [];
    document.querySelectorAll('.story__media').forEach(function (el) { el.setAttribute('data-parallax', ''); depth.push({ el: el, speed: 0.05, cap: 38 }); });
    document.querySelectorAll('.spot').forEach(function (el) { el.setAttribute('data-parallax', ''); depth.push({ el: el, speed: 0.04, cap: 30 }); });

    var ticking = false;
    function frame() {
      ticking = false;
      var vh = window.innerHeight;
      var sy = window.pageYOffset;
      if (heroMedia && heroEl) {
        var hh = heroEl.offsetHeight || vh;
        var ty = Math.min(sy * 0.2, hh * 0.32);
        heroMedia.style.transform = 'translate3d(0,' + ty.toFixed(1) + 'px,0)';
      }
      for (var i = 0; i < depth.length; i++) {
        var d = depth[i];
        var r = d.el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) continue;     // skip far off-screen
        var center = r.top + r.height / 2;
        var py = (vh / 2 - center) * d.speed;
        if (d.cap) py = Math.max(-d.cap, Math.min(d.cap, py));   // keep the float subtle, never detached
        d.el.style.setProperty('--py', py.toFixed(1) + 'px');
      }
    }
    function request() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request, { passive: true });
    request();
  }

  /* ====================================================== */
  /* 3. MAGNETIC CTAs + cursor-origin fill (fine pointer)    */
  /* ====================================================== */
  if (fine) {
    var MAX = 6;
    document.querySelectorAll('.ag-button').forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var r = btn.getBoundingClientRect();
        var rx = e.clientX - r.left, ry = e.clientY - r.top;
        btn.style.setProperty('--mx', (rx / r.width * 100) + '%');   // cursor-origin for the secondary fill
        btn.style.setProperty('--my', (ry / r.height * 100) + '%');
        var dx = (rx - r.width / 2) / (r.width / 2);
        var dy = (ry - r.height / 2) / (r.height / 2);
        var tx = Math.max(-MAX, Math.min(MAX, dx * MAX));
        var ty = Math.max(-MAX, Math.min(MAX, dy * MAX));
        btn.style.transform = 'translate(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px)';
      });
      btn.addEventListener('mouseleave', function () {
        btn.style.transform = '';   // ag-button's own transform transition (ease-snap, 300ms) eases it home
      });
    });

    /* ==================================================== */
    /* 4. CURSOR SPOTLIGHT across trust cards + service tiles */
    /* ==================================================== */
    document.querySelectorAll('.tcard, .svc').forEach(function (card) {
      card.setAttribute('data-spotlight', '');
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }
})();
