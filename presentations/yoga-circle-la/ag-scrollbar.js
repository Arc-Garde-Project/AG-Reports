/* =========================================================== */
/* AG Scrollbar: canonical primitive                           */
/* AG Scrollbar Standard v2.0 (2026-09-07). Mount at <body>.   */
/*                                                             */
/* Load AFTER lenis.min.js + ag-scroll.js so window.lenis is   */
/* available. Falls back to native scroll when Lenis is absent */
/* (non-desktop, reduced-motion, or a build without Scroll).   */
/* =========================================================== */
(function () {
  // Fine pointer + hover only, aligns with Cursor + Scroll standards.
  if (!window.matchMedia || !(matchMedia('(pointer: fine)').matches && matchMedia('(hover: hover)').matches)) return;

  var lenis  = window.lenis || null;          // AG Scroll Standard exposes this on desktop
  var docEl  = document.scrollingElement || document.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Read/write scroll through Lenis when present, native otherwise.
  function pos()  { return lenis ? lenis.scroll : docEl.scrollTop; }
  function vmax() { return Math.max(1, lenis ? lenis.limit : (docEl.scrollHeight - docEl.clientHeight)); }
  function toY(y) { if (lenis) lenis.scrollTo(y, { immediate: true, force: true }); else docEl.scrollTop = y; }

  var bar   = document.createElement('div'); bar.className = 'ag-sb'; bar.setAttribute('aria-hidden', 'true');
  // Version contract. Survives minification and is readable at runtime.
  // The standards gate reads this attribute. Do not remove or rename.
  bar.setAttribute('data-ag-scrollbar-version', '2.0');
  var track = document.createElement('div'); track.className = 'ag-sb__track';
  var thumb = document.createElement('div'); thumb.className = 'ag-sb__thumb';
  var label = document.createElement('div'); label.className = 'ag-sb__label';
  track.appendChild(thumb); bar.appendChild(track); bar.appendChild(label);
  document.body.appendChild(bar);

  var TRACK_TOP = 21, MIN_THUMB = 42, trackH = 0, hideT = 0, dragging = false, hover = false;
  var SECTIONS = [], activeI = -1;

  function metrics() { trackH = track.clientHeight; }

  // Document-absolute top. NOT offsetTop: offsetTop is measured against the
  // nearest positioned ancestor, so any section inside a `position:relative`
  // wrapper reports a top relative to that wrapper and its checkpoint tick
  // lands in the wrong place on the rail. Identical to offsetTop when
  // sections are direct static children, correct when they are not.
  function docTop(el) {
    return el.getBoundingClientRect().top + (window.scrollY || docEl.scrollTop || 0);
  }

  function build() {
    [].slice.call(track.querySelectorAll('.ag-sb__tick')).forEach(function (t) { t.remove(); });
    SECTIONS = [];
    var sh = Math.max(1, docEl.scrollHeight);
    [].slice.call(document.querySelectorAll('section, [data-sb-checkpoint]')).forEach(function (s, i) {
      var head = s.querySelector('h1,h2,h3');
      var name = s.dataset.sbLabel || (head ? head.textContent.trim() : (s.id || ('Section ' + (i + 1))));
      var top = docTop(s);
      var t = document.createElement('div'); t.className = 'ag-sb__tick';
      t.style.top = ((top / sh) * trackH) + 'px';
      track.appendChild(t);
      SECTIONS.push({ top: top, name: name, tick: t });
    });
  }

  function currentIndex() {
    var line = pos() + docEl.clientHeight * 0.35, idx = 0;
    for (var i = 0; i < SECTIONS.length; i++) { if (SECTIONS[i].top <= line) idx = i; }
    return idx;
  }
  function popLabel() {
    label.classList.add('is-show');
    if (reduce) return;
    label.animate([{ transform: 'scale(.9)' }, { transform: 'scale(1)' }], { duration: 210, easing: 'cubic-bezier(.22,1,.36,1)' });
  }
  function setActive(i) {
    if (i === activeI || !SECTIONS[i]) return false;
    if (SECTIONS[activeI]) SECTIONS[activeI].tick.classList.remove('is-active');
    activeI = i;
    SECTIONS[i].tick.classList.add('is-active');
    label.textContent = SECTIONS[i].name;
    return true;
  }
  function update() {
    var th = Math.max(MIN_THUMB, (docEl.clientHeight / docEl.scrollHeight) * trackH);
    var top = (pos() / vmax()) * (trackH - th);
    thumb.style.height = th + 'px';
    thumb.style.top = top + 'px';
    var changed = setActive(currentIndex());
    label.style.top = ((TRACK_TOP + top + th / 2) - label.offsetHeight / 2) + 'px';
    if (changed) popLabel();
  }
  function show() {
    bar.classList.add('is-active');
    if (activeI >= 0) label.classList.add('is-show');
    if (reduce) return;
    clearTimeout(hideT);
    hideT = setTimeout(function () { if (!dragging && !hover) { bar.classList.remove('is-active'); label.classList.remove('is-show'); } }, 1400);
  }
  function onScroll() { update(); show(); }

  function keepAlive() { hover = true; clearTimeout(hideT); bar.classList.add('is-active'); if (activeI >= 0) label.classList.add('is-show'); }
  function release()   { hover = false; show(); }
  bar.addEventListener('mouseenter', keepAlive);
  bar.addEventListener('mouseleave', release);
  label.addEventListener('mouseenter', keepAlive);
  label.addEventListener('mouseleave', release);

  // Lenis primary, native fallback (also covers reduced-motion where Lenis is destroyed).
  if (lenis && lenis.on) lenis.on('scroll', onScroll);
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', function () { metrics(); build(); update(); }, { passive: true });

  // Drag to scroll: thumb AND bubble are both handles.
  function yToScroll(clientY) {
    var r = track.getBoundingClientRect(), th = thumb.offsetHeight;
    var p = Math.min(1, Math.max(0, (clientY - r.top - th / 2) / (trackH - th)));
    toY(p * vmax());
  }
  function startDrag(el, e) { dragging = true; bar.classList.add('is-drag'); try { el.setPointerCapture(e.pointerId); } catch (x) {} e.preventDefault(); }
  thumb.addEventListener('pointerdown', function (e) { startDrag(thumb, e); });
  label.addEventListener('pointerdown', function (e) { startDrag(label, e); });
  addEventListener('pointermove', function (e) { if (dragging) yToScroll(e.clientY); });
  addEventListener('pointerup', function () { if (dragging) { dragging = false; bar.classList.remove('is-drag'); show(); } });
  track.addEventListener('pointerdown', function (e) { if (e.target === track) yToScroll(e.clientY); });

  metrics(); build(); update(); show();
  // Re-run refresh() after dynamic content / route changes.
  window.AGScrollbar = { bar: bar, track: track, thumb: thumb, label: label, refresh: function () { metrics(); build(); update(); } };
})();
