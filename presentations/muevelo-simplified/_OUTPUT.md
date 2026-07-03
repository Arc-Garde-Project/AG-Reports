# _OUTPUT.md — Muevelo Pitch Deck (Simplified)

**Client:** Muevelo West at Chico's Montebello
**Sector:** Reports / Presentations (investor pitch deck)
**Build:** Simplified take (full version exists at `../muevelo/index.html`)
**Owner:** Quinten
**Started:** 2026-06-03

---

## HEARTBEAT (current state)

- **Stage:** Built + DEPLOYED LIVE (27-slide new copy).
- **Live URL:** https://ag-reports.vercel.app/presentations/muevelo/simplified
- **Last action:** 2026-06-10 mobile table fix DEPLOYED LIVE — slides 18 + 20 (3-column scenario tables) clipped at 390px; `.dtable--stack` now stacks them per scenario at <=560px (data-label captions above bold values), desktop unchanged. Verified: zero horizontal overflow on all 27 slides @390, 1080p fit clean, live checks green. Earlier same day: full copy update (21 → 27 slides per "New Copy of MUEVELO Pitch Deck June 3rd 2026.docx", word-for-word fidelity PASSED via `reports/fidelity-check-2026-06-10.py`) deployed + verified. Report: `reports/copy-update-2026-06-10.md`. Snapshot: `_history/S004_Pre-Copy-Update-2026-06-10/`.
- **Next action:** None pending. Deck live + correct. Awaiting next direction.
- **Open items:** none.
- **Creative Profile:** M21 L30 T55 D80 N25 I15 (re-tuned for older audience). Neon = restrained accent. Logo placed on tile.
- **Preview port:** 8742 (ag-reports root served via python http.server — deck at http://127.0.0.1:8742/presentations/muevelo/simplified/)

---

## SOURCE OF TRUTH

- **Intake:** `C:\Users\Minto\OneDrive\Desktop\Investor Deck - Google Docs.pdf` (21 slides, verified 2026-06-03)
- **Logo:** reuse `../muevelo/assets/muevelo-logo.png` from the existing full deck
- **Launch prompt:** `MUELVO PITCH DECK SIMPLIFIED.md` (this folder)

---

## STAGE LOG

### Stage 1 — Intake  [COMPLETE 2026-06-03]
- Intake exists and verified complete: 21-slide investor deck PDF, source of truth.
- Content captured: 21 slides (Cover, Exec Summary, Why Opportunity, Historical Performance, Revenue Decline, Muevelo Difference, Transition Strategy, Licenses, Lease Position, Ownership Structure, Capital Raise, Operating Expense Model, Revenue Model, Revenue Scenarios, Profitability, Distribution Structure, Revenue Expansion, Long-Term Growth, Risk Factors, Disclosures, Thank You).
- No facts invented. All numbers, names, and claims sourced from the PDF.
- Brand name per source: **Muevelo** (file named "MUELVO" per Quinten's instruction; deck content uses correct "Muevelo").

---

### Stage 2 — Pre-Flight  [AWAITING REQUIREMENTS GATE]
- Intake verified for zero guesswork: all 21 slides clear, no ambiguity in facts/numbers.
- Build-type standards loaded (deck, not web app): Palette, Typography, Motion, Mobile, Copywriting, Section, Composition, Imagery, Content Fidelity. Web-app standards N/A.
- Client Psychology Profile: **Controller** (see report below).
- Asset Tracker generated → `ASSET-TRACKER.md`. 18 PROVIDED, 2 PLACEHOLDER (contact info, optional venue photo).
- REVISIONS.txt seeded from CLIENT-TEMPLATE, backfilled with 3 deltas to date.
- Quality floor confirmed: full quality, no reduced tier. Six Creative Dials set at Stage 3.
- Snapshot WPCS-Approved: pending gate approval.

### Stage 3 — Research & Brand Kit  [AWAITING DIRECTION GATE]
- Research: 5 sources on investor-deck design (Figma 34 examples, Best Pitch, Slidebean 35, Qubit Capital principles, the "pitch deck that shaped all decks"). Insight: minimalism, data-driven visuals, one idea per slide, clear hierarchy, restraint. Validates the simplified direction.
- Brand Kit INHERITED from existing full deck (same brand, legitimate source, not invented): near-black base (#000/#060606/#0c0c0c), off-white text (#f5f5f5/#d6d6db/#8e8e96), synthwave neon accents (pink #ff2b8a, cyan #00d8ff, yellow #ffcd00, green #5dd47a, purple #b154f5, orange #ff9933), gold #c9a861, signature gradient. Fonts: Anton (display) / Outfit (sans) / DM Sans (body).
- Simplified direction: neon as accent/punctuation (cover + dividers), NOT wallpaper. Pink + cyan + gold lead.
- Six Creative Dials: **M40 L45 T60 D80 N40 I25**. Rationale in style-tile.html.
- Style tile: `style-tile.html` (served at http://127.0.0.1:8741/style-tile.html).
- Snapshot Tile-Approved: pending gate approval.

---

## DECISIONS LOG

- 2026-06-10: COPY UPDATE source of truth = "New Copy of MUEVELO Pitch Deck June 3rd 2026.docx" (OneDrive Desktop, 26 slides). Supersedes the Google Docs PDF for copy. Thank You slide KEPT per Quinten (not in the docx) → deck = 27 slides. Extract saved at `reports/new-copy-extract-2026-06-10.txt`.

- 2026-06-03: Simplified build given its own folder (`muevelo-simplified/`), separate from the full deck (`muevelo/`). Per Quinten "move that file to the right spot."
- 2026-06-03: Intake source of truth = OneDrive investor deck PDF. Logo reused from existing deck.
- 2026-06-04: RIPPLE AUDIT after Slide 10 share-price fix ($7,142→$6,000). Scanned all 21 slides for every $ figure, share reference, %. CONFIRMED contained to Slide 10 — share price/count/minimum appear nowhere else; the deck never states the investor-pool dollar total, so no derived figure needed recomputing. Old/derived values ($7,142 / $35,710 / $349,958 / $294,000 / $306,000) absent everywhere. $600K (slides 2 & 11) is an independently-stated total, unchanged (now reconciles: 100×$6,000). Note: Slide 12 GM salary is coincidentally $6,000, unrelated — left as-is.

---

## REVISIONS

REVISIONS.txt to be seeded at Stage 2 from CLIENT-TEMPLATE.
