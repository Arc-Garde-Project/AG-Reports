/* =========================================================== */
/* AG Header v2.5 - Adaptive Header behavior (CANONICAL DROP-IN)*/
/* Source of truth: sectors/web/standards/AG-ADAPTIVE-HEADER-STANDARD.md (v2.5) */
/* Extracted 2026-06-26 from the Clinic of Angels build-tier3 reference (ag-header.js v2.1 */
/* behavior, the standard's cited reference). Pairs with ag-header.css. Self-initializes. */
/*                                                                                        */
/* - Hide on scroll-down past the hero, show on scroll-up; transparent over a dark .hero. */
/* - Spiral hamburger (.ag-header__toggle) opens a body-level right drawer (.ag-drawer)   */
/*   + .ag-backdrop. Focus trap, body scroll-lock (position:fixed), Lenis coordination.   */
/* - Close via X (.ag-drawer__close) / backdrop / Esc / link. In-page #anchors smooth-    */
/*   scroll via Lenis after close; real links navigate. Reference: Owners Table Intl.     */
/* =========================================================== */
(function () {
  'use strict';

  var header = document.querySelector('.ag-header');
  var toggle = document.querySelector('.ag-header__toggle');
  var drawer = document.querySelector('.ag-drawer');
  var backdrop = document.querySelector('.ag-backdrop');
  var closeBtn = document.querySelector('.ag-drawer__close');
  if (!header || !toggle || !drawer || !backdrop) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Transparent over the (dark) homepage hero; solid once past it.
     Self-contained scroll tracking. ag:scroll-direction only fires on a direction
     CHANGE, so a straight scroll-down from the top would never trigger the slide-up. */
  var heroEl = document.querySelector('.hero');
  var lastY = window.scrollY;

  function pastHero() {
    if (!heroEl) return window.scrollY > 84;
    return window.scrollY > (heroEl.offsetHeight - header.offsetHeight - 8);
  }
  function onHeaderScroll() {
    var y = window.scrollY;
    var past = pastHero();
    if (heroEl) header.classList.toggle('is-transparent', !past);   // white-on-hero vs solid
    if (document.body.classList.contains('is-locked')) { lastY = y; return; }
    /* Master Dental: the hero (first section) no longer has chips, so the bar can
       stay visible over it. Keep it visible through the hero; once PAST it (into the
       second section) auto-hide on scroll-down and reveal on scroll-up. */
    if (!past) {
      header.classList.remove('is-hidden');               // visible through the hero (first section)
    } else if (y > lastY + 4) {
      header.classList.add('is-hidden');                  // into the second section, scrolling down -> slide up
    } else if (y < lastY - 4) {
      header.classList.remove('is-hidden');               // scrolling up -> bring it back
    }
    lastY = y;
  }
  window.addEventListener('scroll', onHeaderScroll, { passive: true });
  if (window.lenis && window.lenis.on) window.lenis.on('scroll', onHeaderScroll);
  window.addEventListener('resize', onHeaderScroll, { passive: true });
  onHeaderScroll();

  var scrollY = 0, lastFocused = null;
  var FOCUSABLE = 'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])';

  function trapFocus(e) {
    if (e.key !== 'Tab') return;
    var f = drawer.querySelectorAll(FOCUSABLE); if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function openNav() {
    lastFocused = document.activeElement;
    drawer.removeAttribute('hidden'); backdrop.removeAttribute('hidden');
    void drawer.offsetWidth; /* force reflow so the slide fires */
    drawer.classList.add('is-open'); backdrop.classList.add('is-open');
    document.body.classList.add('is-dropdown-open');  /* drives the spiral hamburger -> X */
    toggle.setAttribute('aria-expanded', 'true'); toggle.setAttribute('aria-label', 'Close menu');
    drawer.setAttribute('aria-hidden', 'false');
    scrollY = window.scrollY;
    document.body.style.top = '-' + scrollY + 'px';
    document.body.classList.add('is-locked');
    if (window.lenis && window.lenis.stop) window.lenis.stop();
    document.addEventListener('keydown', trapFocus);
    setTimeout(function () { (closeBtn || drawer.querySelector('a,button')).focus({ preventScroll: true }); }, 90);
  }

  function closeNav(opts) {
    opts = opts || {};
    drawer.classList.remove('is-open'); backdrop.classList.remove('is-open');
    document.body.classList.remove('is-dropdown-open');
    toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-label', 'Open menu');
    /* move focus out before aria-hidden, restore on every close path */
    if (lastFocused && lastFocused.focus) lastFocused.focus({ preventScroll: true }); else toggle.focus({ preventScroll: true });
    drawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('is-locked'); document.body.style.top = '';
    if (window.lenis) {
      if (window.lenis.resize) window.lenis.resize();
      if (!opts.skipRestore && window.lenis.scrollTo) window.lenis.scrollTo(scrollY, { immediate: true, force: true });
      if (window.lenis.start) window.lenis.start();
    } else if (!opts.skipRestore) {
      window.scrollTo(0, scrollY);
    }
    document.removeEventListener('keydown', trapFocus);
    setTimeout(function () {
      if (!drawer.classList.contains('is-open')) { drawer.setAttribute('hidden', ''); backdrop.setAttribute('hidden', ''); }
    }, 630);
  }

  toggle.addEventListener('click', function () {
    (toggle.getAttribute('aria-expanded') === 'true') ? closeNav() : openNav();
  });
  if (closeBtn) closeBtn.addEventListener('click', function () { closeNav(); });
  backdrop.addEventListener('click', function () { closeNav(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && drawer.classList.contains('is-open')) closeNav();
  });

  drawer.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var href = link.getAttribute('href');
      var target = (href && href.length > 1 && href.charAt(0) === '#') ? document.querySelector(href) : null;
      if (target) {
        e.preventDefault();
        closeNav({ skipRestore: true });
        requestAnimationFrame(function () { requestAnimationFrame(function () {
          if (window.lenis && window.lenis.scrollTo) { if (window.lenis.resize) window.lenis.resize(); window.lenis.scrollTo(target); }
          else { target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); }
        }); });
      } else {
        /* real page link: close, let navigation proceed */
        closeNav({ skipRestore: true });
      }
    });
  });
})();
