/* ===========================================================
   AG Scroll Standard v1.1
   - Lenis lerp 0.07 on fine-pointer devices
   - AGScroll API: direction, lock, unlock
   - 14px direction threshold
   - prefers-reduced-motion destroys Lenis
   =========================================================== */

(function () {
  'use strict';

  var hasFinePointer = window.matchMedia('(pointer: fine)').matches
                    && window.matchMedia('(hover: hover)').matches;
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var lenis = null;
  if (window.Lenis && hasFinePointer && !prefersReducedMotion) {
    lenis = new window.Lenis({
      lerp: 0.07,
      smoothWheel: true,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      wheelMultiplier: 1
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    window.lenis = lenis;
  }

  /* ---------- Direction detection ---------- */

  var THRESHOLD = 14;
  var lastY = window.scrollY;
  var direction = 'down';
  var accumulated = 0;

  function onScroll() {
    var current = window.scrollY;
    var delta = current - lastY;

    if (Math.sign(delta) !== Math.sign(accumulated) && Math.sign(delta) !== 0) {
      accumulated = 0;
    }
    accumulated += delta;

    if (Math.abs(accumulated) >= THRESHOLD) {
      var newDirection = accumulated > 0 ? 'down' : 'up';
      if (newDirection !== direction) {
        direction = newDirection;
        window.dispatchEvent(new CustomEvent('ag:scroll-direction', {
          detail: { direction: direction, scrollY: current }
        }));
      }
      accumulated = 0;
    }
    lastY = current;
  }

  if (lenis) {
    lenis.on('scroll', onScroll);
  } else {
    window.addEventListener('scroll', onScroll, { passive: true });
  }


  /* ---------- Body scroll lock ---------- */

  function lock() {
    var scrollY = window.scrollY;
    document.documentElement.style.setProperty('--scroll-y', scrollY + 'px');
    if (lenis) { lenis.stop(); }
    document.body.classList.add('is-locked');
  }

  function unlock() {
    document.body.classList.remove('is-locked');
    var scrollY = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--scroll-y') || '0',
      10
    );
    document.documentElement.style.removeProperty('--scroll-y');
    window.scrollTo(0, scrollY);
    if (lenis) { lenis.start(); }
  }


  /* ---------- Scroll-to-anchor ---------- */

  document.addEventListener('click', function (e) {
    var anchor = e.target.closest('a[href^="#"]');
    if (!anchor) return;
    var id = anchor.getAttribute('href');
    if (id === '#' || id === '') return;
    var target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();

    if (lenis) {
      lenis.scrollTo(target, { offset: 0 });
    } else {
      target.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start'
      });
    }
  });


  /* ---------- Reduced motion runtime listener ---------- */

  var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  mq.addEventListener('change', function (e) {
    if (e.matches && lenis) {
      lenis.destroy();
      lenis = null;
      window.lenis = null;
    }
  });


  /* ---------- AGScroll API ---------- */

  window.AGScroll = {
    lock: lock,
    unlock: unlock,
    direction: function () { return direction; },
    scrollY: function () { return lastY; }
  };
})();
