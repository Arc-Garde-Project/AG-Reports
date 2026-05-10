# IDWIP Report - AG Presentations (5 Files)
**Date:** 2026-03-14
**Path:** AG Clients/AG Presentations/ag-reports/presentations/
**Verdict:** FAIL
**Scope Note:** Client-facing sales presentations (single-file HTML, Framer embed context). Production essentials excluded. Checks scoped to format.

---

## Summary

| Subsystem | Result | Findings |
|-----------|--------|----------|
| DVAR | PASS | 1 warning |
| DWAR | FAIL | 4 issues |
| CURB | FAIL | 5 issues |
| OPTIC | FAIL | 6 issues |

**Overall: FAIL. DWAR, CURB, and OPTIC each contain at least one hard failure.**

---

## Files Evaluated

1. presentations/ally-towne/index.html - The Wedding Mentor, Paid Ads Proposal
2. presentations/lashingona/index.html - Lashingona by Erika, Growth System
3. presentations/spine-doctor/index.html - Dr. Kushagra Verma, Growth System
4. presentations/liminal-means/index.html - Liminal Means, Growth System
5. presentations/americana-tax/index.html - Americana Tax Planning, Content + Website

All 5 files share the same base template. Issues marked ALL apply to every file.

---

## DVAR Findings

### DVAR-1: Color Tokens - PASS
All colors defined in :root as CSS variables. Each file swaps accent tokens (--gold, --gold-light, --gold-dark) for brand differentiation. No hardcoded hex outside :root. PASS.

### DVAR-2: Typography - PASS
Google Fonts: Bebas Neue, DM Sans, Space Grotesk. All Google Fonts. clamp() fluid sizing on headings. Line heights: display 0.9-1.05, body 1.6-2.1. PASS.

### DVAR-3: Spacing - PASS
Tokens --s-3 through --s-168 (multiples of 3 and 7). Used consistently. PASS.

### DVAR-4: Visual Hierarchy - WARN
ALL files. Single h1 per page. h1 > h2 hierarchy correct. No heading skips. No main landmark (see DWAR-1). WARN.

### DVAR-5: Responsive Fidelity - MANUAL REVIEW REQUIRED
Breakpoints at 600px, 800px, 900px, 630px confirmed. Grid collapse present. Visual check required at 350px, 768px, 1400px.

---

## DWAR Findings

### DWAR-1: Semantic Structure - FAIL
ALL 5 files. No main, header, footer, or nav landmarks. No skip link.
Fix: Wrap all sections in <main id="main-content">. Add skip link as first child of body.

### DWAR-2: Keyboard Navigation - MANUAL REVIEW REQUIRED
Tab buttons and CTA links present. Requires live keyboard testing in browser.

### DWAR-3: Screen Reader Compatibility - FAIL
ALL 5 files.

1. Tab buttons missing type attribute (ally-towne lines 1219-1221, all files).
   Fix: Add type="button" to all .arc-paid3-tab elements.

2. No ARIA on tab pattern. No role="tablist", role="tab", or aria-selected.
   Fix: Add role="tablist" to .arc-paid3-tabs, role="tab" and aria-selected to each button.

3. Inline styles on labels - ally-towne lines 1076 and 1078 have inline justify-content and text-align. Exceeds 3 inline style tolerance.
   Fix: Convert to modifier CSS classes.

### DWAR-4: Visual Accessibility - MANUAL REVIEW REQUIRED
--text-muted (50% white) on #000000 needs contrast check. Run through contrast tool.

### DWAR-5: Interactive Elements - FAIL
ALL 5 files.

1. Hover states not wrapped in @media (hover: hover).
   Examples: .arc-web-card:hover (lashingona line 515), .arc-web-platform:hover (line 639), .arc-web-cta:hover (line 240).
   Fix: Wrap ALL :hover rules in @media (hover: hover) across all 5 files.

2. No :focus-visible styles. Keyboard users see inconsistent browser defaults on dark backgrounds.
   Fix: :focus-visible { outline: 2px solid var(--gold); outline-offset: 3px; }

3. .arc-paid3-tab has padding: 12px 21px, approx 44px height. Below 48px minimum.
   Fix: Increase to padding: 14px 21px.

4. No touch-action: manipulation on interactive elements.
   Fix: Add touch-action: manipulation to all a, button, interactive elements.

---

## CURB Findings

### CURB-1: HTML Standards - FAIL
ALL 5 files.

1. Meta viewport missing viewport-fit=cover. Current value: width=device-width, initial-scale=1.0.
   Fix: <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">

2. No main landmark in any file (see DWAR-1).

3. CSS reset block (*, *::before, *::after reset) repeated 3+ times per file. Lashingona example: lines 74, 314, 665.
   Fix: Consolidate to single location at top of stylesheet.

### CURB-2: CSS Standards - FAIL
ALL 5 files.

1. min-height: 100vh on .arc-web-hero-section (line 80, all files). iOS Safari collapses the viewport on scroll.
   Fix: Change to min-height: 100dvh.

2. Inline styles present (see DWAR-3 item 3).

3. prefers-reduced-motion present in all files. PASS.

4. No !important violations found. PASS.

### CURB-3: JavaScript Standards - PASS
No console.log in any file. No commented-out code blocks. Scripts at end of body. PASS.

### CURB-4: File Organization - PASS
All files named index.html in correctly named client subfolders. PASS.

### CURB-5: Content Quality - FAIL

liminal-means/index.html - HARD FAIL - placeholder text in client-visible copy:
- Line 3249: "...reputation you've spent years building in Target Market." Unfilled placeholder.
- Lines 3271, 3274: Marquee reads "Target Market MEANINGFUL WORK" in large display text visible to client.
- Line 3316: "When a Target Market client is choosing between you and a competitor..." Proposal body copy unfilled.
  Fix: Replace all "Target Market" instances with Liminal Means actual service market before any client delivery.

spine-doctor/index.html - WARN:
- Approx. line 3751: Paid ads scope reads "Los Angeles & Orange County metro focus." Confirm this is correct for Dr. Kushagra Verma or replace.

ally-towne/index.html - WARN:
- Line 1166: <li>Customer demographics</li> - generic. Confirm intentional or replace with specific targeting language.

lashingona/index.html - WARN:
- Line 3752: <li>Customer demographics</li> - same pattern. Verify intent.

americana-tax/index.html - PASS. No placeholder content found.

---

## OPTIC Findings

### OPTIC-1: Asset Optimization - PASS
No img tags in any of the 5 files. All visuals are inline SVGs or CSS-generated elements. No external image host violations. PASS.

### OPTIC-2: Animation Performance - FAIL
ALL 5 files share the same timing violations. All 5 use the same base template.

Approved AG DNA values under 1s: 0.3s, 0.6s, 0.7s, 0.9s.
Approved over 1s: 2.1s, 3s, 4.2s, 6s, 6.3s, 7s, 9s, 12.6s, 14s, 21s.

Non-compliant values (lashingona as reference - identical in all 5 files):

| Non-Compliant Value | Location | Required Fix |
|---------------------|----------|--------------|
| 0.1s | Line 108 animation delay | Change to 0.3s |
| 0.2s | Line 142 animation delay | Change to 0.3s |
| 0.35s | Line 162 animation delay | Change to 0.3s |
| 0.4s | Lines 512, 526, 608, 738, 753 transitions | Change to 0.3s |
| 0.5s | Lines 115, 202, 250, 544 animations | Change to 0.6s |
| 0.65s | Line 236 animation delay | Change to 0.6s or 0.7s |
| 0.8s | Line 142 animation duration | Change to 0.7s or 0.9s |
| 1s | Lines 206 and 545 animation-delay | Change to 0.9s |
| 20s | arcWebMarquee duration line 270 | Change to 21s |

Compliant values confirmed: 0.7s (line 108), 0.9s (line 205 delay), 3s (arcWebBreathe).

Fix the shared base template first, then re-propagate to all 5 files.

### OPTIC-3: Load Performance - FAIL
ALL 5 files.

1. Chart.js in head without defer. Line 10 all files: <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script> is render-blocking.
   Fix: Add defer attribute to that script tag, or move it to end of body.

2. Google Fonts preconnect links present for both fonts.googleapis.com and fonts.gstatic.com. PASS.

### OPTIC-4: Production Essentials - N/A
ag-error-handler, ag-vitals, ag-health-beacon, security meta tags, robots.txt, sitemap.xml excluded for presentation format per scope.

### OPTIC-5: SEO Baseline - FAIL
ALL 5 files.

1. No <meta name="robots" content="noindex, nofollow"> tag. These are client-facing presentations and must not be indexed by search engines.
   Fix: Add <meta name="robots" content="noindex, nofollow"> to every file's head.

2. No <meta name="description"> present in any file.
   Fix: Add a brief description meta tag to each file.

3. Title tags present and within range:
   - ally-towne: "The Wedding Mentor | Paid Ads Proposal - Arc Garde" (47 chars). PASS.
   - lashingona: "Lashingona by Erika | Growth System - Arc Garde" (47 chars). PASS.
   - spine-doctor: "Dr. Kushagra Verma | Growth System - Arc Garde" (46 chars). PASS.
   - liminal-means: "Liminal Means | Growth System - Arc Garde" (41 chars). PASS.
   - americana-tax: "Americana Tax Planning | Content + Website - Arc Garde" (54 chars). PASS.

4. No OG, Twitter Card, JSON-LD, or favicon - acceptable for presentation format. The noindex absence is the hard FAIL.

---

## Per-File Verdicts

| File | Verdict | Critical Issues |
|------|---------|----------------|
| ally-towne | FAIL | Shared template failures; Customer demographics copy (WARN) |
| lashingona | FAIL | Shared template failures; Customer demographics copy (WARN) |
| spine-doctor | FAIL | Shared template failures; market copy needs verification |
| liminal-means | FAIL | Shared template failures + Target Market placeholder in 5 visible locations (HARD FAIL) |
| americana-tax | FAIL | Shared template failures only; no unique content failures |

---

## Manual Review Required

1. Responsive fidelity - Visual inspection at 350px, 768px, 1400px for all 5 files.
2. Color contrast - --text-muted (50% white) on #000000. Use contrast checker. Target 4.5:1 minimum.
3. Keyboard navigation - Tab through all interactive elements in a real browser.
4. spine-doctor market copy - Confirm whether Los Angeles & Orange County is correct for this client.

---

## Required Fixes Before Client Delivery

Priority 1 - Blocks delivery:

1. liminal-means: Replace all "Target Market" with actual client market. Confirmed locations: lines 3249, 3271, 3274, 3316. Check paid ads and organic sections as well.
2. spine-doctor: Verify market copy in paid ads section. Replace if incorrect.
3. ALL FILES: Add <meta name="robots" content="noindex, nofollow"> to head.
4. ALL FILES: Add defer to Chart.js script tag (line 10 in each file).

Priority 2 - Template update (apply to base then propagate):

5. ALL FILES: Wrap all :hover rules in @media (hover: hover) { }.
6. ALL FILES: Fix all non-compliant animation timing values per table above.
7. ALL FILES: Change min-height: 100vh to min-height: 100dvh on .arc-web-hero-section.
8. ALL FILES: Add viewport-fit=cover to meta viewport tag.
9. ALL FILES: Add :focus-visible { outline: 2px solid var(--gold); outline-offset: 3px; }
10. ALL FILES: Add type="button" and ARIA roles to tab button pattern.
11. ALL FILES: Add <main id="main-content"> and skip navigation link.
12. ALL FILES: Add touch-action: manipulation to interactive elements.
13. ALL FILES: Increase .arc-paid3-tab to padding: 14px 21px minimum for 48px touch target.
14. ally-towne, lashingona: Confirm or replace "Customer demographics" list items.

---

*Report generated by IDWIP - Integrated Design & Web Integrity Protocol*
*Validator run: 2026-03-14*
