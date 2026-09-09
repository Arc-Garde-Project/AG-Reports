/* =========================================================== */
/* AG Header v2.7 — Adaptive Header behavior (CANONICAL DROP-IN)*/
/* Source of truth: sectors/web/standards/AG-ADAPTIVE-HEADER-STANDARD.md (v2.7) */
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
    if (!past) {
      header.classList.remove('is-hidden');               // always visible over the hero
    } else if (y > lastY + 4) {
      header.classList.add('is-hidden');                  // scroll down past hero -> slide up
    } else if (y < lastY - 4) {
      header.classList.remove('is-hidden');               // scroll up -> bring it back
    }
    lastY = y;
  }
  window.addEventListener('scroll', onHeaderScroll, { passive: true });
  if (window.lenis && window.lenis.on) window.lenis.on('scroll', onHeaderScroll);
  window.addEventListener('resize', onHeaderScroll, { passive: true });
  onHeaderScroll();

  /* ---- Slack-based auto-collapse (Adaptive Header Standard v2.7) ----
     The collapse point is MEASURED, not hardcoded.

     THE INVARIANT. Every input to the decision is read inside the
     [data-nav-measuring] probe, which forces intrinsic layout, so no input is
     geometry that the collapsed state itself produced. The question asked is
     state-independent:

         does the EXPANDED layout fit inside the row's content box?

       required  = brand + nav + cta + 2 gaps   (all intrinsic, inside the probe)
       available = row content width            (clientWidth minus its padding)

       collapse  when  available <  required + 7
       re-expand when  available >= required + 21   (hysteresis, so it cannot flap)

     WHY THIS CHANGED (v2.6.0 defect). v2.6.0 asked a different question, "is
     there room left over for the nav", and computed it from the brand's CURRENT
     box width. While collapsed the row is `1fr auto`, so the brand column
     stretched to fill: at 1400px it measured 1177px instead of 218px, `avail`
     came out at 63px against the 1049px needed, and the header could therefore
     NEVER re-expand once collapsed. Only a reload recovered it, because a fresh
     load starts in the expanded template. v2.6.0 also read the nav's width while
     it was still viewport-constrained, so the same eight links reported 744px at
     400px and 1028px at 1400px. Both inputs are now intrinsic.

     The guarantee is testable and is canaried: measuring the same viewport width
     while collapsed and while expanded must return IDENTICAL numbers. If that
     parity ever breaks, an input has become state-dependent again.

     Unchanged on purpose: the 700px phone floor, the 900px no-JS CSS fallback,
     and the 7/21 slack and hysteresis constants. No breakpoint was guessed. */
  /* MACHINE-READABLE VERSION MARKER. A string literal written to the DOM, not a
     comment: minifiers mangle identifiers but never string contents, so this
     survives bundling, is greppable in the shipped JS, and is visible in the
     rendered DOM. Exact value, so a v2.5 file can never satisfy it. */
  header.setAttribute('data-ag-header-version', '2.7');

  var acRow = header.querySelector('.ag-header__row') || header;
  var acNav = header.querySelector('.ag-header__nav');
  var acBrand = header.querySelector('.ag-header__brand') || header.querySelector('.ag-header__logo');
  var acCta = acRow.querySelector(':scope > .ag-button');
  var AC_SLACK = 7, AC_HYST = 21, AC_FLOOR = 700;
  var acState = null; /* true = collapsed, false = expanded */

  /* Set and removed inside one synchronous block. Layout is forced by the reads,
     but the browser never paints this state, so there is no flash. */
  function acMeasure() {
    header.setAttribute('data-nav-measuring', '');
    var cs = getComputedStyle(acRow);
    var gap = parseFloat(cs.columnGap); if (!(gap >= 0)) gap = 21;
    var padL = parseFloat(cs.paddingLeft) || 0;
    var padR = parseFloat(cs.paddingRight) || 0;
    var brandW = acBrand ? acBrand.getBoundingClientRect().width : 0;
    var navW = acNav ? acNav.getBoundingClientRect().width : 0;
    var ctaW = acCta ? acCta.getBoundingClientRect().width : 0;
    var available = acRow.clientWidth - padL - padR;
    header.removeAttribute('data-nav-measuring');
    return {
      brandW: brandW, navW: navW, ctaW: ctaW, gap: gap,
      required: brandW + navW + ctaW + gap * 2,
      available: available
    };
  }
  header.__agHeaderMeasure = acMeasure; /* documented test seam: state-parity canary */

  function acApply(state) {
    if (state === acState) return;
    acState = state;
    header.classList.toggle('is-collapsed', state);
    header.classList.toggle('is-expanded', !state);
  }
  function autoCollapse() {
    if (!acNav) return;
    if (window.innerWidth <= AC_FLOOR) { acApply(true); return; }
    var m = acMeasure();
    if (acState === true) acApply(!(m.available >= m.required + AC_HYST));
    else acApply(m.available < m.required + AC_SLACK);
  }
  var acRaf = null;
  function acSchedule() {
    if (acRaf) return;
    acRaf = requestAnimationFrame(function () { acRaf = null; autoCollapse(); });
  }
  window.addEventListener('resize', acSchedule, { passive: true });
  window.addEventListener('orientationchange', acSchedule);
  window.addEventListener('load', acSchedule);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(acSchedule);
  /* Nav content can change after load (a CMS swap, i18n, a client-side route change).
     v2.6 re-evaluated only on resize/load/fonts, so the measurement was right but
     nothing re-ran it and the state went stale until the next resize. Scoped to the
     nav subtree, and it cannot self-trigger: the probe toggles an attribute on
     .ag-header, which is outside this target, and a style recalc is not a DOM
     mutation. Work is coalesced by the same rAF guard, so a burst of mutations
     costs one measurement, not one per record. */
  if (window.MutationObserver && acNav) {
    new MutationObserver(acSchedule).observe(acNav, {
      childList: true, characterData: true, subtree: true
    });
  }
  autoCollapse();

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
