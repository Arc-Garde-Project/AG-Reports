# IDWIP Round 2 -- Ally Towne index-v2.html
**Date:** 2026-03-26
**File:** `presentations/ally-towne/index-v2.html`

---

## DVAR (Design & Visual Audit Report)

| # | Check | Status | Details |
|---|-------|--------|---------|
| 1 | Typography (max 2 fonts) | PASS | Playfair Display + Inter. No other fonts loaded. `--font-data` fully removed |
| 2 | Animation timing compliance | PASS | All values compliant (see timing audit below) |
| 3 | Colors via CSS vars | PASS | All colors use `var(--*)`. Only exception: `#fff` on `.plan__flow-num` (L502) and `::selection` (L117) -- acceptable for white constants |
| 4 | Responsive fluid tokens | PASS | All typography and spacing use `clamp()`. Breakpoints (768px, 600px, 480px) used for layout shifts only |
| 5 | Visual hierarchy | PASS | h1 > h2 > section-label > body. Clear progression |
| 6 | Images | WARN | Logo is PNG (known exception -- no WebP on Supabase). Single image in build |
| 7 | Icons | N/A | No icons used |
| 8 | Stretch prevention | PASS | `.hero__subtitle` has `max-width: 560px`. Pricing card has `max-width: 560px`. No full-width stretch issues |
| 9 | Unused CSS var `--bg-card` | FAIL | Defined on L61 but never used anywhere in the file |

### Full Animation Timing Audit

| Line | Element | Property | Value | Compliant? |
|------|---------|----------|-------|------------|
| 146 | `.scroll-progress` | transition: width | 0.3s | YES |
| 230 | `.reveal` | transition: opacity | 0.7s | YES |
| 230 | `.reveal` | transition: transform | 0.7s | YES |
| 239 | `.reveal-d1` | transition-delay | 0.3s | YES |
| 240 | `.reveal-d2` | transition-delay | 0.6s | YES |
| 241 | `.reveal-d3` | transition-delay | 0.9s | YES |
| 314 | `.roadmap__dot::after` | animation: num-pulse | 2.1s | YES |
| 374 | `.marquee__track` | animation: marquee-scroll | 21s | YES |
| 414 | `.situation__stat` | transition: border-color, box-shadow, transform | 0.6s | YES |
| 423 | `.situation__stat::after` | transition: width | 0.9s | YES |
| 447 | `.stat-ring__fill` | transition: stroke-dashoffset | 2.1s | YES |
| 486 | `.plan__flow-step` | transition: border-color, box-shadow, transform | 0.6s | YES |
| 512 | `.plan__flow-num::after` | animation: num-pulse | 2.1s | YES |
| 558 | `.plan__item` | transition: border-color, box-shadow, transform | 0.6s | YES |
| 566 | `.plan__item::before` | transition: opacity | 0.3s | YES |
| 1112 | aurora orbs (JS) | transition: opacity | 2.1s | YES |
| 1112 | aurora orbs (JS) | transition: transform | 7s | YES |
| 1146 | particle delays (JS) | animationDelay | 0, 0.9, 2.1, 3, 4.2, 6.3 | YES (all compliant) |
| 1147 | particle durations (JS) | animation duration | 4.2, 6, 6.3, 7, 9, 12.6 | YES (all compliant) |
| 1161 | eyebrow lines (JS) | transition: width | 0.6s | YES |
| 1180 | shimmer-sweep (JS) | animation duration | 3s | YES |
| 1180 | shimmer-sweep (JS) | animation delay | 0.6s | YES |

**All 22 timing values compliant. 0 violations.**

---

## DWAR (Design & Web Accessibility Report)

| # | Check | Status | Details |
|---|-------|--------|---------|
| 1 | Skip link | PASS | L753: `<a href="#main" class="skip-link">Skip to content</a>` |
| 2 | Landmarks | PASS | `<main id="main">` (L757), `<footer>` (L1029), 4 `<section>` elements |
| 3 | Alt text | PASS | Logo img (L770) has `alt="The Wedding Mentor"` |
| 4 | Keyboard nav | PASS | `:focus-visible` styled (L135-139). Skip link functional |
| 5 | ARIA | PASS | Decorative elements (`aurora`, `grain`, `particles`, `marquee`, arrows, `stat-ring`) all have `aria-hidden="true"` |
| 6 | Contrast | PASS | `--text: #1a1a1a` on `--bg: #faf8f5` = high contrast. `--text-muted: #5a5a5a` on white bg = ~7:1 |
| 7 | Reduced motion | PASS | Full `prefers-reduced-motion: reduce` block (L738-748) kills all animations/transitions, resets scroll, hides particles and orbs |
| 8 | Text sizing | PASS | All text uses `clamp()` fluid tokens. No fixed font-size |
| 9 | Touch targets | PASS | `touch-action: manipulation` on all `a, button` (L735) |
| 10 | Heading hierarchy | PASS | h1 (L778) > h2 (L855, 916, 988). No skipped levels. Exactly 1 h1 |
| 11 | Landmark for footer | PASS | `<footer>` element outside `<main>` (L1029) |

---

## CURB (Code Uniformity & Robustness Baseline)

| # | Check | Status | Details |
|---|-------|--------|---------|
| 1 | DOCTYPE | PASS | L1: `<!DOCTYPE html>` |
| 2 | lang | PASS | L2: `<html lang="en">` |
| 3 | charset | PASS | L4: `<meta charset="UTF-8">` |
| 4 | viewport | PASS | L5: `width=device-width, initial-scale=1.0, viewport-fit=cover` |
| 5 | overflow-x | PASS | html (L101) and body (L109) both have `overflow-x: hidden` |
| 6 | overflow-wrap | PASS | L110: `overflow-wrap: break-word` |
| 7 | box-sizing | PASS | L100: `*, *::before, *::after { box-sizing: border-box; }` |
| 8 | tap-highlight | PASS | L111: `-webkit-tap-highlight-color: transparent` |
| 9 | text-wrap | PASS | L115: headings `text-wrap: balance`. L116: body text `text-wrap: pretty` |
| 10 | CSS vars | PASS | Full `:root` block with color, font, spacing, and ease vars |
| 11 | HTML structure | PASS | head > body > main + footer. Clean nesting |
| 12 | IntersectionObserver | PASS | Used for reveals (L1058), stat cards (L1072), rings (L1087), orbs (L1109), eyebrow lines (L1158), shimmer (L1174). Fallback on L1054-1056 |
| 13 | Passive listeners | PASS | L1045: `{ passive: true }` on scroll listener |
| 14 | SEO: title | PASS | L7: unique title |
| 15 | SEO: description | PASS | L8: meta description present |
| 16 | SEO: canonical | PASS | L28 |
| 17 | SEO: OG tags | PASS | L10-15: type, title, description, image, url |
| 18 | SEO: Twitter Card | PASS | L17-21: card, title, description, image |
| 19 | SEO: favicon | PASS | L24-25: favicon + apple-touch-icon (absolute URLs) |
| 20 | SEO: JSON-LD | PASS | L43-55: WebPage schema |
| 21 | SEO: 1 h1 | PASS | Exactly 1 h1 on L778 |
| 22 | Resource hints | PASS | preconnect (Google Fonts, gstatic, Supabase), preload (logo image) |
| 23 | Defensive CSS | PASS | `img { max-width: 100%; height: auto }`, box-sizing, overflow-wrap |
| 24 | Security: nosniff | PASS | L31 |
| 25 | Security: referrer | PASS | L32 |
| 26 | Security: permissions | PASS | L33 |
| 27 | Hover guards | PASS | All hover states wrapped in `@media (hover: hover)` (L428, 489, 569) |
| 28 | robots noindex | PASS | L6: `noindex, nofollow` (correct for client presentation) |

---

## OPTIC (Optimization, Performance, Testing & Integrity Check)

| # | Check | Status | Details |
|---|-------|--------|---------|
| 1 | Content verification | PASS | 52 videos, $249 price, 14% rev share, Whop, catering companies -- all match client brief |
| 2 | Asset URLs absolute | PASS | Logo (L770): absolute Supabase URL. OG image (L14): absolute. Favicons (L24-25): absolute. All fonts via Google CDN |
| 3 | Dependencies | PASS | Zero external JS dependencies. Google Fonts only external CSS |
| 4 | Preload hero image | PASS | L36: `<link rel="preload" as="image">` for logo |
| 5 | will-change usage | PASS | Used on animated elements only: aurora-orb (L192), particle (L222), stat-ring__fill (L446), pricing__card::before (L620) |
| 6 | z-index audit | PASS | skip-link: 9999, scroll-progress: 9999, grain: 9998, aurora: 0, container: 2, roadmap dot: 2, roadmap line: 1. No conflicts |
| 7 | Unused CSS classes | FAIL | 3 classes in CSS but never in HTML: `.badge` (L595-599), `.badge--success` (L600), `.reveal--up` (L235) |
| 8 | Unused CSS var | FAIL | `--bg-card` (L61) defined but never referenced |
| 9 | JS errors | PASS | All DOM queries guarded with `if (!el) return`. IntersectionObserver has fallback. No unhandled edge cases |
| 10 | Mobile 350px | PASS | Fluid tokens scale down to 350px. Grid uses `minmax(min(100%, 250px), 1fr)`. 480px breakpoint stacks to 1fr |
| 11 | Specificity | PASS | Flat BEM-style selectors throughout. No `!important` in author CSS (only in reduced-motion override) |
| 12 | Logo format | WARN | PNG format (known exception -- no WebP available on Supabase) |
| 13 | Second `<style>` block | INFO | `@keyframes particle-float` in a second `<style>` tag at L1190-1197 (after `</script>`). Not a violation but could be consolidated into the main style block |

---

## Summary

| Subsystem | Result | Fails |
|-----------|--------|-------|
| DVAR | FAIL | 1 (unused `--bg-card` var) |
| DWAR | PASS | 0 |
| CURB | PASS | 0 |
| OPTIC | FAIL | 2 (3 unused CSS classes: `.badge`, `.badge--success`, `.reveal--up`; unused CSS var `--bg-card`) |

---

## VERDICT: FAIL

### Remaining Issues (4 items, all low-severity cleanup)

| # | Severity | Issue | Fix |
|---|----------|-------|-----|
| 1 | LOW | Unused CSS class `.badge` (L595-599) | Remove `.badge { ... }` block |
| 2 | LOW | Unused CSS class `.badge--success` (L600) | Remove `.badge--success { ... }` rule |
| 3 | LOW | Unused CSS class `.reveal--up` (L235) | Remove `.reveal--up { ... }` rule |
| 4 | LOW | Unused CSS var `--bg-card` (L61) | Remove `--bg-card: #ffffff;` from `:root` |

All 22 animation timing values are compliant. All Round 1 fixes verified. The 4 remaining issues are dead code cleanup only -- zero functional or visual impact.
