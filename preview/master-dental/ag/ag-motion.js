/* =========================================================== */
/* AG Motion v2.5 - universal reveal trigger (CANONICAL DROP-IN)*/
/* Source of truth: core/standards/AG-MOTION-STANDARD.md (v2.5) */
/* Extracted 2026-06-26, verbatim. Pairs with ag-motion.css. Self-initializes.*/
/* ONE IntersectionObserver handles every recipe: adds .in-view once per       */
/* element (never re-animates), auto-indexes stagger children, and on reduced  */
/* motion reveals everything instantly. Load after the DOM is parsed.          */
/* =========================================================== */

// AG Motion. Universal reveal trigger
(function () {
  const REVEAL_SELECTOR = '.reveal, .reveal-hero, .reveal-stagger, .reveal-cinematic';
  const REVEAL_THRESHOLD = 0.15;
  const REVEAL_ROOT_MARGIN = '0px 0px -10% 0px';

  // Respect reduced motion. Instant reveal, no animation.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll(REVEAL_SELECTOR).forEach(el => {
      el.classList.add('in-view');
    });
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target); // Fire once, never again
      }
    });
  }, {
    threshold: REVEAL_THRESHOLD,
    rootMargin: REVEAL_ROOT_MARGIN
  });

  // Auto-index children of stagger groups
  document.querySelectorAll('.reveal-stagger').forEach(group => {
    Array.from(group.children).forEach((child, i) => {
      child.style.setProperty('--i', i);
    });
  });

  // Observe all reveal elements
  document.querySelectorAll(REVEAL_SELECTOR).forEach(el => {
    observer.observe(el);
  });
})();
