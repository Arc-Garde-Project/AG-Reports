/* =========================================================== */
/* AG Scroll v1.2 — the scroll engine (CANONICAL DROP-IN)      */
/* Source of truth: sectors/web/standards/AG-SCROLL-STANDARD.md (v1.2) */
/* Extracted 2026-06-26 — composes the standard's Section 1-5 snippets into  */
/* ONE self-initializing IIFE. Pairs with ag-scroll.css. Load AFTER the Lenis */
/* library (window.Lenis). Self-initializes.                                  */
/*                                                                            */
/* - Lenis smooth scroll, lerp 0.07 (LOCKED), pointer-fine gated (v1.1): on   */
/*   only when a precise pointer + hover + no reduced-motion (touch keeps      */
/*   native scroll). Exposed as window.lenis for the header/curtain/body-lock. */
/* - AGScroll: ONE centralized scroll-direction detector (14px threshold);    */
/*   subscribers listen for the `ag:scroll-direction` event instead of adding  */
/*   their own scroll listeners.                                              */
/* - AGScroll.lock()/unlock(): the ONE body scroll-lock API (preserves +       */
/*   restores position). Every overlay uses it; none roll their own.          */
/* - Scroll-to-anchor: bounded fixed 0.7s easeOutExpo (never instant, never    */
/*   >1s), native smooth-scroll fallback on touch.                            */
/* =========================================================== */
(function () {
  'use strict';

  /* ---- Section 1 + 2: Lenis engine, pointer-fine gated (v1.1) ----
     `var` (function-scoped) so the direction module + anchor handler below
     share the same instance. Touch / reduced-motion devices keep native scroll. */
  var lenis = null;
  var hasFinePointer = window.matchMedia('(pointer: fine)').matches
                    && window.matchMedia('(hover: hover)').matches;
  var reducedMotion  = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (window.Lenis && hasFinePointer && !reducedMotion) {
    lenis = new window.Lenis({
      lerp: 0.07,
      smoothWheel: true,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      wheelMultiplier: 1,
    });

    var raf = function (time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);

    window.lenis = lenis;
  }

  /* ---- Section 4: centralized scroll-direction detection (14px = 2 x 7) ---- */
  var AGScroll = (function () {
    let lastScrollY = 0;
    let scrollDirection = 'down';
    let accumulatedDelta = 0;
    const THRESHOLD = 14;

    function onScroll() {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollY;

      if (Math.sign(delta) !== Math.sign(accumulatedDelta)) {
        accumulatedDelta = 0;
      }

      accumulatedDelta += delta;

      if (Math.abs(accumulatedDelta) >= THRESHOLD) {
        const newDirection = accumulatedDelta > 0 ? 'down' : 'up';
        if (newDirection !== scrollDirection) {
          scrollDirection = newDirection;
          window.dispatchEvent(new CustomEvent('ag:scroll-direction', {
            detail: { direction: scrollDirection, scrollY: currentY }
          }));
        }
        accumulatedDelta = 0;
      }

      lastScrollY = currentY;
    }

    if (window.lenis) {
      lenis.on('scroll', onScroll);
    } else {
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    return {
      getDirection: () => scrollDirection,
      getScrollY: () => lastScrollY,
      // Aliases (defense-in-depth so legacy callers using .direction()/.scrollY() still work)
      direction: () => scrollDirection,
      scrollY: () => lastScrollY,
    };
  })();

  window.AGScroll = AGScroll;

  /* ---- Section 5: body scroll lock (preserves + restores scroll position) ---- */
  AGScroll.lock = function () {
    const scrollY = window.scrollY;
    document.documentElement.style.setProperty('--scroll-y', scrollY + 'px');

    if (window.lenis) {
      lenis.stop();
    }
    document.body.classList.add('is-locked');
  };

  AGScroll.unlock = function () {
    document.body.classList.remove('is-locked');

    const scrollY = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--scroll-y') || '0'
    );
    document.documentElement.style.removeProperty('--scroll-y');
    window.scrollTo(0, scrollY);

    if (window.lenis) {
      lenis.start();
    }
  };

  /* ---- Section 3: scroll-to-anchor, bounded fixed 0.7s easeOutExpo ---- */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();

      if (window.lenis) {
        lenis.scrollTo(target, {
          offset: 0,
          duration: 0.7,                                        // bounded: not instant, not >1s
          easing: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)), // easeOutExpo
        });
      } else {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
})();
