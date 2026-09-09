/* =========================================================== */
/* AG Cursor Standard v2.1  — CANONICAL DROP-IN                */
/* Source of truth: sectors/web/standards/AG-CURSOR-STANDARD.md */
/* Drop in at <body> level (Hard Rule 10). Self-initializes.   */
/* Requires ag-cursor.css + Palette tokens (--ink/--paper/--accent). */
/* DO NOT replace with a generic gsap smooth-lag cursor. Follow */
/* is PIXEL-LOCKED: the transform is set on every pointermove   */
/* with NO transition. Quinten iterated to instant three times. */
/* =========================================================== */
(function () {
  // Dual gate: fine pointer AND hover (avoids Windows touchscreen laptops
  // disabling on trackpad — aligned with Scroll Standard detection).
  if (!window.matchMedia ||
      !(matchMedia('(pointer: fine)').matches && matchMedia('(hover: hover)').matches)) return;

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var INTERACTIVE = 'a[href],button,[role="button"],input:not([type="hidden"]),' +
                    'select,textarea,label[for],summary,[data-cursor],.ag-clickable';

  var NS = 'http://www.w3.org/2000/svg';
  var ARROW = 'M0,0 L0,15 L4,11.5 L6.5,17 L8.5,16 L6,10.5 L10.5,10.5 Z';
  var HAND  = 'M8.5 4.466V1.75a1.75 1.75 0 1 0-3.5 0v5.34l-1.2.24a1.5 1.5 0 0 0-1.196 1.636l.345 3.106a2.5 2.5 0 0 0 .405 1.11l1.433 2.15A1.5 1.5 0 0 0 6.035 16h6.385a1.5 1.5 0 0 0 1.302-.756l1.395-2.441a3.5 3.5 0 0 0 .444-1.389l.271-2.715a2 2 0 0 0-1.99-2.199h-.581a5 5 0 0 0-.195-.248c-.191-.229-.51-.568-.88-.716-.364-.146-.846-.132-1.158-.108l-.132.012a1.26 1.26 0 0 0-.56-.642 2.6 2.6 0 0 0-.738-.288c-.31-.062-.739-.058-1.05-.046z';

  function shape(type) {
    var arrow = (type === 'arrow');
    var s = document.createElementNS(NS, 'svg');
    s.setAttribute('class', 'ag-cursor__' + type);
    s.setAttribute('viewBox', arrow ? '0 0 11 17.5' : '0 0 16 16');
    s.setAttribute('width',  arrow ? 13 : 18);
    s.setAttribute('height', arrow ? 20 : 18);
    var p = document.createElementNS(NS, 'path');
    p.setAttribute('d', arrow ? ARROW : HAND);
    s.appendChild(p);
    return s;
  }

  var bodyL = document.createElement('div');
  bodyL.className = 'ag-cursor__body'; bodyL.setAttribute('aria-hidden', 'true');
  bodyL.appendChild(shape('arrow'));

  var edgeL = document.createElement('div');
  edgeL.className = 'ag-cursor__edge'; edgeL.setAttribute('aria-hidden', 'true');
  edgeL.appendChild(shape('arrow'));
  edgeL.appendChild(shape('hand'));

  document.body.appendChild(bodyL);
  document.body.appendChild(edgeL);

  var root = document.documentElement;
  root.classList.add('ag-fine');

  var css = getComputedStyle(root);
  var INK    = (css.getPropertyValue('--ink')    || '#0a0a0a').trim();
  var PAPER  = (css.getPropertyValue('--paper')  || '#fafafa').trim();
  var ACCENT = (css.getPropertyValue('--accent') || '#c9a861').trim();

  var tx = innerWidth / 2, ty = innerHeight / 2, cx = tx, cy = ty, shown = false, frame = 0;

  function isDarkBg(el) {
    while (el && el !== document.documentElement) {
      var bg = getComputedStyle(el).backgroundColor;
      var m = bg.match(/rgba?\(([^)]+)\)/);
      if (m) {
        var p = m[1].split(',').map(parseFloat);
        var a = (p[3] === undefined) ? 1 : p[3];
        if (a > 0.1) { return (0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2]) / 255 < 0.5; }
      }
      el = el.parentElement;
    }
    return false;
  }

  function track(e) {
    tx = e.clientX; ty = e.clientY;
    // v2.1: pixel-locked — set the transform the instant the pointer moves (no smoothing/trail)
    var t = 'translate(' + tx + 'px,' + ty + 'px)';
    bodyL.style.transform = t; edgeL.style.transform = t;
    if (!shown) { shown = true; bodyL.style.opacity = '1'; edgeL.style.opacity = '1'; }
  }
  addEventListener('mousemove', track, { passive: true });
  // Also track pointermove: during a pointer-captured drag (e.g. the scrollbar
  // thumb, which calls setPointerCapture + preventDefault on pointerdown) the
  // compatibility `mousemove` events are suppressed, so without this the cursor
  // would freeze at the press point. pointermove keeps firing through capture.
  addEventListener('pointermove', function (e) { if (e.pointerType !== 'touch') track(e); }, { passive: true });

  // Hide ONLY when the pointer truly leaves the window — never on inner
  // element transitions. A plain `mouseout` fires every time the element
  // under the cursor changes (including while the page scrolls under a
  // held click), and since no mousemove fires during a click-hold-scroll,
  // the cursor would blink off and stay off until the mouse moved again.
  document.documentElement.addEventListener('mouseleave', function () {
    shown = false; bodyL.style.opacity = '0'; edgeL.style.opacity = '0';
  });
  document.documentElement.addEventListener('mouseenter', function () {
    shown = true; bodyL.style.opacity = '1'; edgeL.style.opacity = '1';
  });

  document.addEventListener('mouseover', function (e) {
    if (e.target.closest && e.target.closest(INTERACTIVE)) root.classList.add('ag-cur-hover');
  });
  document.addEventListener('mouseout', function (e) {
    var to = e.relatedTarget;
    if (e.target.closest && e.target.closest(INTERACTIVE) &&
        !(to && to.closest && to.closest(INTERACTIVE))) {
      root.classList.remove('ag-cur-hover');
    }
  });

  // Echo + ignite match the CURRENT cursor glyph: the hand when over an
  // interactive element, the arrow otherwise. You never click with the hand
  // and see an arrow pulse out. The glyph scales from its own hotspot, which
  // stays anchored on the click point.
  function clickBurst(x, y) {
    if (reduce) return;
    var hand = root.classList.contains('ag-cur-hover');
    var d    = hand ? HAND : ARROW;
    var vb   = hand ? '0 0 16 16' : '0 0 11 17.5';
    var w    = hand ? 18 : 13;
    var h    = hand ? 18 : 20;
    var lx   = hand ? (x - 8) : x;   // shift so the glyph hotspot lands on the click point
    var ly   = hand ? (y - 2) : y;
    var orig = hand ? '8px 2px' : '0 0';

    function spawn(strokeW, glow) {
      var el = document.createElement('div');
      el.setAttribute('aria-hidden', 'true');
      el.style.cssText = 'position:fixed;left:' + lx + 'px;top:' + ly + 'px;pointer-events:none;z-index:2147483645;transform-origin:' + orig + ';';
      el.innerHTML = '<svg width="' + w + '" height="' + h + '" viewBox="' + vb + '" style="display:block;overflow:visible;">' +
        '<path d="' + d + '" fill="none" stroke="' + ACCENT + '" stroke-width="' + strokeW + '" stroke-linejoin="round"' +
        (glow ? ' style="filter:drop-shadow(0 0 4px ' + ACCENT + ');"' : '') + '/></svg>';
      document.body.appendChild(el);
      return el;
    }

    var echo = spawn(1, false);
    echo.animate([{ transform: 'scale(1)', opacity: .85 }, { transform: 'scale(2.3)', opacity: 0 }],
      { duration: 294, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'forwards' });   /* = --ease-settle */

    var ignite = spawn(2.2, true);
    ignite.animate([{ opacity: 0 }, { opacity: .95, offset: .3 }, { opacity: 0 }],
      { duration: 210, easing: 'cubic-bezier(0.16,1,0.3,1)', fill: 'forwards' });   /* = --ease-satisfying */

    setTimeout(function () { echo.remove(); ignite.remove(); }, 360);
  }

  document.addEventListener('mousedown', function () { root.classList.add('ag-cur-press'); });
  document.addEventListener('mouseup', function (e) {
    root.classList.remove('ag-cur-press');
    clickBurst(e.clientX, e.clientY);
  });

  // v2.1: rAF only throttles the luminance sampling now. The transform is pixel-locked
  // on pointermove (see track()), so there is no lerp and no transform transition.
  function tick() {
    if ((frame++ % 4) === 0) {               /* throttle luminance sampling */
      var el = document.elementFromPoint(tx, ty);
      if (el) edgeL.style.setProperty('--cur-fill', isDarkBg(el) ? PAPER : INK);
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
