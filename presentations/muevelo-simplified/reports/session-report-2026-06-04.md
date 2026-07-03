# Session Report — Muevelo Pitch Deck (Simplified)

**Date:** 2026-06-03 → 2026-06-04
**Build:** Muevelo West investor pitch deck, simplified take
**Live:** https://ag-reports.vercel.app/presentations/muevelo/simplified
**Owner:** Quinten

---

## What this session did

### Setup + BUILD-PATH Stages 1–5
- Created the launch prompt `MUELVO PITCH DECK SIMPLIFIED.md`, moved the build into its own folder `ag-reports/presentations/muevelo-simplified/` (dev/source) with a clean deploy folder later at `ag-reports/presentations/muevelo/simplified/`.
- **Stage 1 (Intake):** verified the 21-slide investor PDF as source of truth.
- **Stage 2 (Pre-Flight):** Client Psychology Profile = Controller; Asset Tracker (all facts PROVIDED, gaps resolved by scope = "PDF slides only"); seeded REVISIONS.txt.
- **Stage 3 (Direction):** brand kit INHERITED from the existing full deck (synthwave palette, Anton / Outfit / DM Sans). Six Creative Dials set **M21 L30 T55 D80 N25 I15** (older-audience tuned). Neon = restrained accent. Dark base kept.
- **Stage 4 (Build):** built all 21 slides, content verified.
- **Stage 5 (Design gate):** many approved revisions (below). Currently a live preview at the design gate.

### Source-of-truth resolution
- Discovered the original full deck was built from a **v28 PowerPoint** that DIFFERS from the Google Docs PDF (different share price $7,200 vs $7,142, total $720K vs $600K, etc.). Quinten: **"go back to the simplified, forget the other one."** → Source of truth = **Google Docs investor PDF** (v28 dropped). See `reports/source-comparison-2026-06-03.md`.

### Content fidelity (100% PDF words)
- Verified every number/name/figure verbatim from the PDF (`reports/content-fidelity-2026-06-03.md`).
- Per Quinten "revert to PDF-exact": replaced 13 editorial display headlines with the PDF's exact slide titles; set every content-slide eyebrow to **"Privileged & Confidential"** (the PDF's own per-slide stamp). Deck is now 100% PDF words (only standards conversions: en dashes → "to", spelled numbers → numerals).

### Design revisions (approved)
- Everything centered; eyebrow off-center fixed (specificity bug); spacing doubled; half carriage-return after every period (sentences split); consistent generous block spacing; Friday/Sat/Sun + scenario cards → centered upside-down-triangle wrap; subtle polish (tabular numerals, staggered reveal, cover-logo breathe, divider/title depth, grain); **loading curtain**; **fullscreen Enter/Exit buttons**; centered circular nav arrows.

### Deploy + mobile hardening
- Deployed to `ag-reports` (Arc-Garde-Project). First went to top-level `/simplified` → corrected to nest at **`/presentations/muevelo/simplified`**. Logo fixed via `<base href="/presentations/muevelo/simplified/">` (cleanUrls broke relative asset paths). Every deploy isolated an unrelated tooth-place WIP (git stash → deploy → pop); existing `/presentations/muevelo` deck verified unharmed each time.
- Mobile: fixed flexbox-centering scroll bug; fixed bottom text hidden behind the fixed nav (slide scroll-area now ends above the nav + tightened phone spacing so slides 10/15 fit); built a **custom always-visible scroll indicator** (shows only when a slide overflows, thumb tracks scroll) — now **solid neon pink, 4px thin**.

---

## Key facts
- **Live URL:** `ag-reports.vercel.app/presentations/muevelo/simplified`
- **Deploy:** project `ag-reports`, repo `Arc-Garde-Project/AG-Reports`, folder `ag-reports/presentations/muevelo/simplified/` (deck-only; dev folder excluded via `.vercelignore`). Deploy method: `vercel --prod` from `ag-reports/`.
- **Assets need the `<base href>`** to resolve under cleanUrls. Local file-preview must be served from the ag-reports root (e.g. `http://127.0.0.1:8742/presentations/muevelo/simplified/`).
- **Registry updated.**

---

```
LOCKED, DO NOT TOUCH
These are finished and live. Do not recreate, renumber, or change them
without an explicit instruction from me.

- All 34 AG standards in the directory, present and live (presentation build; no full audit run this session)
- Source of truth = the Google Docs investor PDF (21 slides). The v28 PowerPoint and the original full deck are DROPPED, not references.
- Deck is 100% PDF words: editorial headlines reverted to the PDF's exact slide titles; every content-slide eyebrow = "Privileged & Confidential".
- Live slug = ag-reports.vercel.app/presentations/muevelo/simplified (nested under muevelo, NOT top-level /simplified). Requires <base href="/presentations/muevelo/simplified/">.
- Creative direction locked: dark synthwave, restrained neon accent, older-audience tuned, Profile M21 L30 T55 D80 N25 I15. Fonts Anton/Outfit/DM Sans. Logo = Muevelo @ Chico.
- Mobile model locked: slide scroll-area ends above the nav; custom always-visible scroll indicator = solid neon pink (#ff2b8a), 4px thin, shows only on overflowing slides.
- Loading curtain + fullscreen Enter/Exit buttons + centered circular nav are in and verified.

STATE
- Last cleared stage: Stage 5 (Design gate) — live preview, under revision/approval.
- Next action: get final design-gate sign-off, then run Stage 6 (Night Watch standards audit) + Stage 7 (formal PR) to harden + finalize.
- Open: Stage 6 + Stage 7 not yet run (this is a Stage-5 preview deploy, not a hardened/PR'd release). No missing facts (deck is 100% from the PDF). No placeholders.
```
