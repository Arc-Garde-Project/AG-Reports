# Mobile Proof Gate — PASS

**Date:** 2026-07-22
**Target:** file:///C:/Users/Minto/Desktop/Arc%20Garde%20Clients/Arc%20Garde/ag-reports/presentations/dr-dani-b/index.html
**Profiles:** iphone-se, iphone-15, pixel-8, ipad, dpi-125 (WebKit runs included)
**Shots:** skipped

Enforces AG-MOBILE-STANDARD v2.7 §15: literal centering at ≤900 (§6C), tap targets, input zoom, sticky stack, Safe Edge, Browser Chrome Tint (§6D), and the LOCKED §8 budgets.

| Severity | Count |
|----------|------:|
| CRITICAL | 0 |
| WARN | 52 |
| INFO | 4 |

## Runs

| Profile | Engine | Screenshot | CRITICAL | WARN |
|---------|--------|------------|:--------:|:----:|
| iphone-se | chromium | - | 0 | 12 |
| iphone-se | webkit | - | 0 | 0 |
| iphone-15 | chromium | - | 0 | 12 |
| iphone-15 | webkit | - | 0 | 0 |
| pixel-8 | chromium | - | 0 | 12 |
| ipad | chromium | - | 0 | 16 |
| dpi-125 | chromium | - | 0 | 0 |

Interaction shots (iphone-15): `iphone-15-nav-open.jpg` (hamburger OPEN), `iphone-15-midscroll.jpg` — these are the design-critic's mobile craft surfaces.

## Budgets (§8 LOCKED)

| Metric | Measured | Budget |
|--------|---------:|-------:|
| Total page weight | 250KB | 1400KB |
| JavaScript | 74KB | 210KB |
| LCP (local) | 324ms | 2500ms |
| CLS | 0 | 0.1 |

## Findings

### WARN

- **[centering @ iphone-se/chromium]** `li` — text-align: left at 375px (must center at <=900, §6C)
- **[centering @ iphone-se/chromium]** `li` — text-align: left at 375px (must center at <=900, §6C)
- **[centering @ iphone-se/chromium]** `li` — text-align: left at 375px (must center at <=900, §6C)
- **[centering @ iphone-se/chromium]** `li` — text-align: left at 375px (must center at <=900, §6C)
- **[centering @ iphone-se/chromium]** `li` — text-align: left at 375px (must center at <=900, §6C)
- **[centering @ iphone-se/chromium]** `p.arc-paid3-value-title` — text-align: left at 375px (must center at <=900, §6C)
- **[centering @ iphone-se/chromium]** `button.arc-mech-tab.active` — off-center block: 3px left vs 167px right gap (tolerance 14px)
- **[centering @ iphone-se/chromium]** `button.arc-mech-tab` — off-center block: 65px left vs 90px right gap (tolerance 14px)
- **[centering @ iphone-se/chromium]** `button.arc-mech-tab` — off-center block: 142px left vs 3px right gap (tolerance 14px)
- **[tap-target @ iphone-se/chromium]** `a.ag-skip-link` — 150x46px (< 49x49 LOCKED min)
- **[tap-target @ iphone-se/chromium]** `button.arc-mech-tab.active` — 59x37px (< 49x49 LOCKED min)
- **[tap-target @ iphone-se/chromium]** `button.arc-mech-tab` — 74x37px (< 49x49 LOCKED min)
- **[centering @ iphone-15/chromium]** `li` — text-align: left at 393px (must center at <=900, §6C)
- **[centering @ iphone-15/chromium]** `li` — text-align: left at 393px (must center at <=900, §6C)
- **[centering @ iphone-15/chromium]** `li` — text-align: left at 393px (must center at <=900, §6C)
- **[centering @ iphone-15/chromium]** `li` — text-align: left at 393px (must center at <=900, §6C)
- **[centering @ iphone-15/chromium]** `li` — text-align: left at 393px (must center at <=900, §6C)
- **[centering @ iphone-15/chromium]** `p.arc-paid3-value-title` — text-align: left at 393px (must center at <=900, §6C)
- **[centering @ iphone-15/chromium]** `button.arc-mech-tab.active` — off-center block: 3px left vs 167px right gap (tolerance 14px)
- **[centering @ iphone-15/chromium]** `button.arc-mech-tab` — off-center block: 65px left vs 90px right gap (tolerance 14px)
- **[centering @ iphone-15/chromium]** `button.arc-mech-tab` — off-center block: 142px left vs 3px right gap (tolerance 14px)
- **[tap-target @ iphone-15/chromium]** `a.ag-skip-link` — 150x46px (< 49x49 LOCKED min)
- **[tap-target @ iphone-15/chromium]** `button.arc-mech-tab.active` — 59x37px (< 49x49 LOCKED min)
- **[tap-target @ iphone-15/chromium]** `button.arc-mech-tab` — 74x37px (< 49x49 LOCKED min)
- **[centering @ pixel-8/chromium]** `li` — text-align: left at 412px (must center at <=900, §6C)
- **[centering @ pixel-8/chromium]** `li` — text-align: left at 412px (must center at <=900, §6C)
- **[centering @ pixel-8/chromium]** `li` — text-align: left at 412px (must center at <=900, §6C)
- **[centering @ pixel-8/chromium]** `li` — text-align: left at 412px (must center at <=900, §6C)
- **[centering @ pixel-8/chromium]** `li` — text-align: left at 412px (must center at <=900, §6C)
- **[centering @ pixel-8/chromium]** `p.arc-paid3-value-title` — text-align: left at 412px (must center at <=900, §6C)
- **[centering @ pixel-8/chromium]** `button.arc-mech-tab.active` — off-center block: 3px left vs 167px right gap (tolerance 14px)
- **[centering @ pixel-8/chromium]** `button.arc-mech-tab` — off-center block: 65px left vs 90px right gap (tolerance 14px)
- **[centering @ pixel-8/chromium]** `button.arc-mech-tab` — off-center block: 142px left vs 3px right gap (tolerance 14px)
- **[tap-target @ pixel-8/chromium]** `a.ag-skip-link` — 150x46px (< 49x49 LOCKED min)
- **[tap-target @ pixel-8/chromium]** `button.arc-mech-tab.active` — 59x37px (< 49x49 LOCKED min)
- **[tap-target @ pixel-8/chromium]** `button.arc-mech-tab` — 74x37px (< 49x49 LOCKED min)
- **[centering @ ipad/chromium]** `li` — text-align: left at 820px (must center at <=900, §6C)
- **[centering @ ipad/chromium]** `li` — text-align: left at 820px (must center at <=900, §6C)
- **[centering @ ipad/chromium]** `li` — text-align: left at 820px (must center at <=900, §6C)
- **[centering @ ipad/chromium]** `li` — text-align: left at 820px (must center at <=900, §6C)
- **[centering @ ipad/chromium]** `li` — text-align: left at 820px (must center at <=900, §6C)
- **[centering @ ipad/chromium]** `p.arc-mech-dash-period` — text-align: left at 820px (must center at <=900, §6C)
- **[centering @ ipad/chromium]** `p.arc-mech-dash-title` — text-align: left at 820px (must center at <=900, §6C)
- **[centering @ ipad/chromium]** `p.arc-paid3-dashboard-period` — text-align: left at 820px (must center at <=900, §6C)
- **[centering @ ipad/chromium]** `p.arc-paid3-dashboard-client` — text-align: left at 820px (must center at <=900, §6C)
- **[centering @ ipad/chromium]** `p.arc-paid3-value-title` — text-align: left at 820px (must center at <=900, §6C)
- **[centering @ ipad/chromium]** `button.arc-mech-tab.active` — off-center block: 3px left vs 167px right gap (tolerance 14px)
- **[centering @ ipad/chromium]** `button.arc-mech-tab` — off-center block: 65px left vs 90px right gap (tolerance 14px)
- **[centering @ ipad/chromium]** `button.arc-mech-tab` — off-center block: 142px left vs 3px right gap (tolerance 14px)
- **[tap-target @ ipad/chromium]** `a.ag-skip-link` — 150x46px (< 49x49 LOCKED min)
- **[tap-target @ ipad/chromium]** `button.arc-mech-tab.active` — 59x37px (< 49x49 LOCKED min)
- **[tap-target @ ipad/chromium]** `button.arc-mech-tab` — 74x37px (< 49x49 LOCKED min)
### INFO

- **[budget-weight @ iphone-15/chromium]** `total` — 250KB of 1400KB budget
- **[budget-js @ iphone-15/chromium]** `scripts` — 74KB of 210KB budget
- **[vitals-lcp @ iphone-15/chromium]** `LCP` — 324ms (target < 2500ms; local render, unthrottled network)
- **[vitals-cls @ iphone-15/chromium]** `CLS` — 0 (target < 0.1)

