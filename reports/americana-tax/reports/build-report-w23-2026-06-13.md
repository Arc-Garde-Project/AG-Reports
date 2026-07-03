# ATP W23 + TTP W11 Build Report — Jun 9-12 Window

**Built:** 2026-06-13
**Window:** Jun 9 - Jun 12, 2026 (aligned 4-day block)
**Standard:** W20 locked template (built from W22 / W10 predecessors)
**Status:** BUILT + VERIFIED locally over HTTP. NOT deployed (awaiting greenlight).

---

## Files

- `reports/americana-tax/w23.html` (ATP W23) — copied from w22.html, 54 verified replacements
- `reports/tooth-place/w11.html` (TTP W11) — copied from w10.html, 64 verified replacements
- Nav menus updated in both (new entry marked active, predecessor de-activated)

## Data sources

- Delivery KPIs: Meta Marketing API window-level aggregates (authoritative), pulled 2026-06-13
- TTP leads: GHL UTM attribution (Pixel Lead event not wired — Meta reports 0)
- Trackers updated through Jun 12 before build

---

## ATP W23 (Jun 9-12) — Recovery + billing resolved

Decisions (Quinten): use **live Meta ad names** (Ad 9 / Ad 14 / Ad 10); frame as **billing resolved**.

- **3-day billing blackout confirmed via Meta:** $0 delivery Jun 9 AND Jun 10 (no records). Delivery resumed Jun 11. Pause began Jun 8 (flagged in W22).
- **2 active days only** (Jun 11-12).
- Video: $59.48 spend · 3,147 imp · 139 clk · 4.42% CTR · $0.43 CPC · $18.90 CPM · 32 LP · 0 leads
  - Ad 9 (winner): $28.52 · 2,257 imp · 4.74% CTR · $0.27 CPC · $12.64 CPM · 20 LP
  - Ad 14 (hot): $30.95 · 888 imp · 3.60% CTR · $0.97 CPC · $34.85 CPM · 12 LP
  - Ad 10: dormant ($0.01, 2 imp)
- Retargeting: $2.28 · 185 imp · 5.41% CTR · 4 LP · 0 leads
- **Combined hero:** $61.76 spend · 3,332 imp · 4.47% CTR · $0.41 CPC · 36 LP · 0 leads
- Framing: billing cleared, full delivery resumes W24.

## TTP W11 (Jun 9-12) — Leads returned

- 4 full active days. Positive window: leads came back after W10's blank.
- Video: $145.90 spend · 13,818 imp · 695 clk · 5.03% CTR · $0.21 CPC · $10.56 CPM · 144 LP · **5 leads** · $29.18 blended CPL
  - Creative 11 (new, Jun 1 launch): $75.28 · 3,989 imp · 5.06% CTR · $0.37 CPC · 72 LP · **all 5 leads** · $15.06 CPL
  - Creative 4 (reach/efficiency leader): $55.59 · 8,316 imp · 5.44% CTR · $0.12 CPC · 58 LP · 0 leads
  - Creative 6 (wound down): $15.03 · 1,513 imp · 2.71% CTR · 14 LP · 0 leads
  - Creative 9 + Spanish: dormant
- All 5 leads landed Jun 12, all attributed to Creative 11.

---

## Verification

- Both: assertion-checked transforms (every replacement matched its exact expected count or the build aborted without writing).
- Adversarial stale-token sweep: zero stale W22/W10 values survive (only intentional back-references and the predecessor nav links).
- Rendered over HTTP (port 8730) + DOM-checked: titles, hero stats, carousel card/dot counts (ATP 7, TTP 4), funnel, no JS errors.
- Hero screenshots captured and visually confirmed.

## Notes / open items

- Counter renders total spend without cents for values >= $100 (TTP shows $146, not $145.90) — this is the locked W20/W10 count-up behavior, unchanged.
- NOT deployed. To publish: `ag-reports.vercel.app/reports/americana-tax/w23` and `/reports/tooth-place/w11` (needs Quinten greenlight + deploy-registry check).
