/* ===========================================================
   AG Motion Standard v2.1 - Universal reveal trigger
   IntersectionObserver 0.15 threshold, -10% rootMargin
   =========================================================== */

(function () {
  'use strict';

  var REVEAL_SELECTOR = '.reveal, .reveal-hero, .reveal-stagger, .reveal-image';
  var REVEAL_THRESHOLD = 0.15;
  var REVEAL_ROOT_MARGIN = '0px 0px -10% 0px';

  function init() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.querySelectorAll(REVEAL_SELECTOR).forEach(function (el) {
        el.classList.add('in-view');
      });
      return;
    }

    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll(REVEAL_SELECTOR).forEach(function (el) {
        el.classList.add('in-view');
      });
      return;
    }

    document.querySelectorAll('.reveal-stagger').forEach(function (group) {
      Array.prototype.forEach.call(group.children, function (child, i) {
        child.style.setProperty('--i', i);
      });
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: REVEAL_THRESHOLD,
      rootMargin: REVEAL_ROOT_MARGIN
    });

    document.querySelectorAll(REVEAL_SELECTOR).forEach(function (el) {
      observer.observe(el);
    });
  }

  /* Wait for curtain to lift before running reveals (so they don't fire under curtain) */
  if (document.documentElement.classList.contains('is-loading')) {
    window.addEventListener('ag:ready', init, { once: true });
  } else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
