/* =========================================================== */
/* AG Footer v1.6 - footer JS (CANONICAL DROP-IN)              */
/* Source of truth: sectors/web/standards/AG-FOOTER-STANDARD.md (v1.6) */
/* Extracted 2026-06-26. Pairs with ag-footer.css.                            */
/*  1. Copyright year auto-render (Section 12, the base markup ships          */
/*     <span data-current-year>) - always include.                           */
/*  2. Watermark fit (Section 19) - ONLY needed when the optional             */
/*     .ag-footer-bgname watermark is used; converges its size to the footer  */
/*     inner content width and reserves padding so it never collides.         */
/*  Contact email/phone reveal uses the AG Contact Standard script, not here. */
/* =========================================================== */

/* ---- 1. Auto-render the copyright year (never hard-code a year that goes stale) ---- */
document.querySelectorAll('[data-current-year]').forEach(el => {
  el.textContent = new Date().getFullYear();
});

/* ---- 2. Footer watermark fit (OPTIONAL - only acts if .ag-footer-bgname exists) ----
   fit the text EXACTLY to the footer content width (optical-sizing fonts make a fixed
   multiplier drift, so measure-and-set; CSS calc is the no-JS fallback) */
(function(){
  var bg=document.querySelector('.ag-footer-bgname'), inner=document.querySelector('.ag-footer-inner');
  if(!bg||!inner) return;
  var footer=document.querySelector('.ag-footer');
  function fit(){
    var cs=getComputedStyle(inner);
    var cw=inner.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight);
    if(cw<=0) return;
    var mobile=window.innerWidth<=640, target=cw;
    bg.style.fontSize='90px';
    for(var i=0;i<5;i++){ var w=bg.getBoundingClientRect().width; if(!w) break;
      var cur=parseFloat(bg.style.fontSize);
      if(Math.abs(w-target)<1.5) break; bg.style.fontSize=(cur*target/w).toFixed(2)+'px'; }
    var r=bg.getBoundingClientRect(), fs=parseFloat(bg.style.fontSize), H=r.height, visible=H-0.14*fs;
    if(footer){
      footer.style.setProperty('--wm-h',Math.round(visible)+'px');
      footer.style.paddingBottom=Math.round(visible+(mobile?85:26))+'px';
    }
    bg.style.setProperty('--pan',(-Math.round(r.width))+'px'); /* one full tile per loop = seamless */
  }
  fit(); addEventListener('resize',fit,{passive:true});
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(fit);
})();
