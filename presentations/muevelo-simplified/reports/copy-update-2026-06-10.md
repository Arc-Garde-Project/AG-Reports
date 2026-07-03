# Muevelo Simplified Deck — Copy Update Report
**Date:** 2026-06-10
**Source of truth:** `C:\Users\Minto\OneDrive\Desktop\New Copy of MUEVELO Pitch Deck June 3rd 2026.docx` (26 slides; raw extract: `reports/new-copy-extract-2026-06-10.txt`)
**Result:** Deck restructured 21 → 27 slides (26 docx slides + Thank You kept per Quinten). NOT deployed — awaiting approval.

---

## Slide Map (new order)

| # | Slide | Change |
|---|-------|--------|
| 1 | Cover | + tagline "Creating the Next Chapter of Entertainment in Montebello" |
| 2 | Executive Summary | Paragraphs 2-4 rewritten (existing customer base, ~14 years lease control, $600K acquisition + working capital wording, enterprise-value objective) |
| 3 | Investment Highlights | **NEW** — 12 bullets |
| 4 | Why This Opportunity Exists | Bullets 7→6 (new set), closing rewritten |
| 5 | Historical Venue Performance | Closing line: "customer demand" wording |
| 6 | Understanding the Revenue Decline | Bullets reworded, foot-note rewritten |
| 7 | The Muevelo Difference | Intro condensed to 1 line, bullets 6→7 (adds Revenue diversification), closing condensed |
| 8 | Transition Strategy | Intro line dropped, "Existing ownership" wording, closing rewritten |
| 9 | Licenses, Permits & Regulatory | Intro + closing dropped, lead reworded ("expects to continue") |
| 10 | Lease Position & Long-Term Venue Control | **REWORKED** — lease term Jan 1, 2025 to Dec 31, 2040; 14 Years stat (replaces 20 Years); rent schedule $3,600 / $3,800 / $4,100; 5 new advantages. Scoped `#slide-lease` CSS for 1080p fit |
| 11 | Ownership Structure | "Shares Available" label (was "Total Shares Available") |
| 12 | Capital Raise & Use of Funds | "Business Acquisition" + "Total Capital Requirement" labels, closing rewritten |
| 13 | Operating Expense Model | **REWORKED** — Management Compensation (was Henry/Mario GM Salary), Marketing Management (was Henry Marketing & Promotions), Base Rent $3,600 (was Rent & CAM $5,100), Utilities $800-$1,200, Merchant Processing & POS $4,388 (was $3,169), Sales Tax (10.25%) $9,994 (was $10,238), Required Seller Carry Payment, total $65,000-$74,000 (was $68,000-$76,000) |
| 14 | Merchant Processing Assumptions | **NEW** — 4.5% blended rate + 6 inclusions |
| 15 | Revenue Model & Attendance | "Average Operating Scenario" lead + "Operating Nights" bullet dropped, foot-note "and expanded" |
| 16 | Revenue Scenarios | Closing line dropped, Average card sub now "per month" |
| 17 | Seller Carry Repayment Strategy | **NEW** — $130K @ 6% / 39 months, payoff cards 18-30 / 12-18 / 6-12 months |
| 18 | Operating Cash Flow Projections | **REPLACES** Profitability Projections — full-dollar ranges, single foot-line |
| 19 | Estimated Distribution Timeline | **NEW** — Year 3 / Year 2-3 / Year 2 cards |
| 20 | Year 3 Distribution Potential | **NEW** — monthly + annual distributable table |
| 21 | Investment Thesis | **NEW** — 5 key factors + closing |
| 22 | Why Initial Returns Appear Conservative | **NEW** — priority statement + 5 objectives |
| 23 | Revenue Expansion Opportunities | Lead + closing dropped, bullet order per docx |
| 24 | Long-Term Growth Strategy | Intro + closing dropped, hyphenated title |
| 25 | Risk Factors | Bullets shortened to docx set, closing shortened |
| 26 | Important Disclosures | 4 paragraphs → 3 per docx |
| 27 | Thank You | KEPT per Quinten decision (not in docx) — unchanged |

**Removed:** Investor Distribution Structure (old slide 16) — superseded by slides 19 + 22.

## Standard conversions applied
- Numerals: fourteen → 14, three months → 3 months, three-month → 3-month, five key factors → 5
- En dashes → "to" (prose/dates) or " - " (table/card ranges); no em dashes
- Eyebrow stamp "Privileged & Confidential" retained on all content slides (deck design element)
- Meta description updated (20-year control → ~14 years lease)

## Verification (all proven, not assumed)
- 27 `<section class="slide">`, aria-labels sequence clean 1/27 → 27/27
- All 26 new-value greps present; all 16 stale-value greps absent (incl. $10,238, $3,169, 20 Years, Rent & CAM, Henry/Mario, "of 21")
- Browser proof @ http://127.0.0.1:8742 (served from ag-reports root for base href): counter 27, keyboard nav 1→27 works, logo loads, zero JS errors
- Fit: ALL 27 slides fit at 1920x1080 (slide 10 initially overflowed 205px → fixed with scoped `#slide-lease` rhythm CSS)
- Mobile 390x700: dense slides (3, 10, 13) overflow + scroll correctly within the clear area above the nav
- Screenshots: `copy-update-slide10-proof-2026-06-10.jpeg`, `copy-update-slide17-proof-2026-06-10.jpeg`

## Files
- Edited: `muevelo-simplified/index.html` (project source)
- Synced: `ag-reports/presentations/muevelo/simplified/index.html` (deploy staging copy, hash-verified identical)
- Snapshot: `_history/S004_Pre-Copy-Update-2026-06-10/`

## Deploy status
**NOT deployed.** Live site still shows the previous 21-slide deck. Awaiting Quinten approval for `vercel --prod`.
