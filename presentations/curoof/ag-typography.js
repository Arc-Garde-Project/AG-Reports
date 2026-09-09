/* =========================================================== */
/* AG Typography Enhancer v1.0 — CANONICAL DROP-IN             */
/* Pair with ag-typography.css. Load once, before </body>.     */
/*                                                             */
/* Fixes the three orphan classes CSS physically cannot reach,  */
/* because each needs a non-breaking CHARACTER inserted into    */
/* existing copy and no CSS property can do that:               */
/*   WIDOW       1948  last two words glued                     */
/*   HYPHEN-BREAK 478  compound hyphen -> U+2011                */
/*   NUMBER-SPLIT 282  figure glued to its unit                 */
/* (counts: reports/orphan-allpages-BEFORE-2026-08-01.md, 265pp) */
/*                                                             */
/* WHAT IT DOES NOT TOUCH. INTERIOR (1273) is a sizing defect - */
/* the line cannot hold two words at that font-size — and glue  */
/* makes it WORSE, not better. That one is ag-typography.css's  */
/* display ceiling. Do not be tempted to "fix" it here.         */
/*                                                             */
/* SAFETY CONTRACT                                              */
/*  - Substitutions are VISUALLY IDENTICAL: U+00A0 renders as a */
/*    space, U+2011 renders as a hyphen. Nothing moves on screen*/
/*    except the break opportunity being removed.               */
/*  - Copy is never reworded, reordered, or re-cased. The AG    */
/*    rule that an approved copy doc is canon is not bent here: */
/*    the CHARACTERS a reader sees are unchanged.               */
/*  - Idempotent. Running twice changes nothing the second time.*/
/*  - Never runs inside code, pre, inputs, or [data-ag-no-type].*/
/*  - Glue is APPLY-VERIFY-REVERT, not predicted. Every change  */
/*    is made, then measured, then undone if the document got   */
/*    wider or the block got taller. Predicting safety was the  */
/*    first design and it was circular for shrink-to-fit boxes  */
/*    (see transact() below). Overflow is a worse defect than   */
/*    the widow, and glue that adds a line manufactures the     */
/*    interior orphan it was meant to prevent.                  */
/* =========================================================== */

(function () {
  'use strict';

  var NBSP = '\u00A0';
  var NBHY = '\u2011';                       // non-breaking hyphen
  var SKIP = 'code,pre,kbd,samp,script,style,textarea,input,select,svg,[data-ag-no-type]';

  function skip(el) { return el.closest(SKIP) !== null; }

  /* WHICH ELEMENTS GET TYPESET.
     Not a selector list. The first version used
     'h1..h6,p,li,blockquote,figcaption,dd,dt' and left a third of the
     widows untouched on the first real build, because production copy
     lives in div.kpi-label, div.header-title and bare spans just as
     often as in <p>. A hand-maintained tag list will always drift from
     the markup it is supposed to cover.

     Instead this uses the SAME definition the orphan detector uses: an
     element that owns its own line boxes, meaning it has text and no
     block-level element inside it. Checker and fixer therefore agree on
     what a "text block" is, which is the only way the fixer can be
     expected to clear what the checker finds.

     Ancestors of block boxes are marked in one pass, so the test stays
     O(1) per element instead of rescanning the subtree for each. */
  var OWNS = function (d) { return d !== 'inline' && d !== 'contents' && d !== 'none'; };
  var SPLITS = /^(block|flow-root|list-item|table|table-row|table-cell|table-caption|grid|flex)$/;

  function textBlocks(scope) {
    var all = scope.querySelectorAll('*');
    var hasBlockChild = new WeakSet();
    var disp = new WeakMap();
    var i, el, d, n;
    for (i = 0; i < all.length; i++) {
      el = all[i];
      d = getComputedStyle(el).display;
      disp.set(el, d);
      if (SPLITS.test(d)) {
        n = el.parentElement;
        while (n && !hasBlockChild.has(n)) { hasBlockChild.add(n); n = n.parentElement; }
      }
    }
    var out = [];
    for (i = 0; i < all.length; i++) {
      el = all[i];
      if (hasBlockChild.has(el)) continue;
      if (!OWNS(disp.get(el))) continue;
      if (!el.textContent || !el.textContent.trim()) continue;
      out.push(el);
    }
    return out;
  }

  /* ---- THE SAFETY NET: apply, verify, revert ----
     The first version tried to PREDICT whether glue was safe, by
     measuring the pair against el.getBoundingClientRect().width. That
     test is circular for any shrink-to-fit box (inline-block, flex or
     grid item, table cell, width:fit-content): such an element's width
     IS its current wrapped content width, so the pair always "fits" and
     the guard always passes, right up until the element grows past its
     container.

     Predicting is the wrong shape. Apply the change, measure the real
     consequence, and put it back if it made anything worse. Two
     invariants, both cheap:

       1. The document must not get wider. Turning a widow into
          horizontal overflow trades a visible-but-minor defect for an
          invisible-and-major one.
       2. The element must not get TALLER. Glue removes a break
          opportunity, so it can push a word down and add a line, which
          manufactures the one-word interior line it was meant to
          prevent. Osborne's INTERIOR count went 12 -> 14 that way.
          Glue that adds a line is glue that failed.

     Same lesson as the detector: measure the outcome, do not trust the
     model of it. */
  function transact(el, mutate) {
    var docW0 = document.documentElement.scrollWidth;
    var h0 = el.getBoundingClientRect().height;
    var undo = mutate();
    if (!undo) return;
    var grewWide = document.documentElement.scrollWidth > docW0;
    var grewTall = el.getBoundingClientRect().height > h0 + 1;
    if (grewWide || grewTall) undo();
  }

  /* ---- Pass 1: compound hyphens ----
     Browsers break at an author's hyphen with no CSS asking them to, so
     "revenue-generating" becomes "revenue-" / "generating". Only short
     compounds are glued: a long one may legitimately need the break
     rather than overflowing. */
  function fixHyphens(text) {
    return text.replace(/([A-Za-z]{2,})-([A-Za-z]{2,})/g, function (m, a, b) {
      /* CAP AT 16. A non-breaking hyphen makes the whole compound one
         unbreakable token, and ag-defensive puts `overflow-wrap:
         break-word` on body as the URL safety net. So a glued compound
         that no longer fits its line does not overflow, it gets broken
         MID-WORD instead: HYPHEN-BREAK is traded for WORD-BREAK, which
         is the uglier of the two. Measured on Osborne Advisory at cap
         22 (HYPHEN-BREAK 3->2 but WORD-BREAK 2->3).
         16 keeps the common compounds (high-ticket, long-form, Co-Host,
         top-performing) and leaves the long ones alone, since those are
         exactly the ones most likely to not fit. The transaction guard
         cannot catch this one: a mid-word break changes neither the
         element height nor the document width. */
      if (m.length > 16) return m;
      return a + NBHY + b;
    });
  }

  /* ---- Pass 2: figure + unit ----
     "$5,100 per month" must not break after the figure. Glue the number
     to the ONE short word that follows it. */
  function fixNumbers(text) {
    return text.replace(
      /([$£€¥]?\d[\d,.]*(?:%|k|m|bn?)?)(\s+)([A-Za-z][A-Za-z'-]{0,11})(?=[\s.,;:!?)]|$)/gi,
      function (m, num, sp, word) {
        if (sp.indexOf('\n') !== -1 && sp.length > 40) return m;
        return num + NBSP + word;
      }
    );
  }

  /* ---- Pass 3: widow glue ----
     Bind the final two words so the last line can never hold one word.
     Width-guarded: if the pair cannot fit the container on its own, the
     glue is refused and the widow is left for a human, because an
     overflow is worse than a widow. */
  function fixWidow(el) {
    var last = null, n;
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    while ((n = walker.nextNode())) { if (n.textContent.trim()) last = n; }
    if (!last) return;

    var t = last.textContent;
    var trimmedEnd = t.replace(/\s+$/, '');
    var m = /^([\s\S]*?)([^\s\u00A0]+)([ \t]+)([^\s\u00A0]+)$/.exec(trimmedEnd);
    if (!m) return;                          // fewer than two words in the last node
    if ((m[2] + m[4]).length > 24) return;   // implausibly long pair, do not even try

    transact(el, function () {
      last.textContent = m[1] + m[2] + NBSP + m[4] + t.slice(trimmedEnd.length);
      return function () { last.textContent = t; };
    });
  }

  function run(root) {
    var scope = root || document;
    var els = textBlocks(scope);
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (skip(el)) continue;
      if (el.getAttribute('data-ag-typeset') === '1') continue;

      /* Text passes first: they only ever REPLACE a break opportunity,
         so they cannot change the character a reader sees. */
      var tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
      var node, edits = [];
      while ((node = tw.nextNode())) {
        if (!node.textContent.trim()) continue;
        if (node.parentElement && node.parentElement.closest(SKIP)) continue;
        var out = fixNumbers(fixHyphens(node.textContent));
        if (out !== node.textContent) edits.push([node, node.textContent, out]);
      }
      /* Hyphen and number glue also remove break opportunities, so they
         get the same apply-verify-revert treatment as the widow pass.
         All of an element's text edits are one transaction: they are
         judged by their combined effect, which is what the reader sees. */
      if (edits.length) {
        transact(el, function () {
          for (var j = 0; j < edits.length; j++) edits[j][0].textContent = edits[j][2];
          return function () {
            for (var k = 0; k < edits.length; k++) edits[k][0].textContent = edits[k][1];
          };
        });
      }

      /* Widow glue LAST: it measures, so it must run after the text is
         final or it would measure a string that no longer exists. */
      fixWidow(el);
      el.setAttribute('data-ag-typeset', '1');
    }
  }

  function boot() {
    /* Webfonts change metrics, and the widow guard MEASURES. Running
       before the real face has loaded measures a page that never
       existed, exactly the failure the HTML-to-PDF path hits without a
       virtual-time budget. Wait for fonts, then typeset. */
    var go = function () { try { run(document); } catch (e) { /* never break the page for typography */ } };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(go).catch(go);
    else go();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  /* Re-typeset after dynamic content. Clears the stamp on the subtree so
     new nodes are processed and existing ones are not double-glued. */
  window.AGTypography = {
    run: run,
    refresh: function (root) {
      var scope = root || document;
      var done = scope.querySelectorAll('[data-ag-typeset]');
      for (var i = 0; i < done.length; i++) done[i].removeAttribute('data-ag-typeset');
      run(scope);
    }
  };
})();
