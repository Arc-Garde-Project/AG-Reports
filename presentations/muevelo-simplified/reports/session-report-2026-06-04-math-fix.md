# Session Report — Muevelo West Pitch Deck (Simplified)

**Date:** 2026-06-04
**Client:** Muevelo West at Chico's Montebello
**Sector:** Reports / Presentations (investor pitch deck)
**Owner:** Quinten
**Live URL:** https://ag-reports.vercel.app/presentations/muevelo/simplified
**Build type:** slide deck (surgical-edit rules apply — target by `<!-- SLIDE NN -->` / `#slide`, scoped CSS, self-check each edit)

---

## What this session did

A client-caught **math error** on the share price was diagnosed, fixed, deployed, and ripple-audited. No other change was made to the deck.

### 1. Startup + routing
- Ran AG session protocol (AG-DNA, Learning Log, project Output File).
- Routed to the active project `ag-reports/presentations/muevelo-simplified/`.
- Reconciled a **stale heartbeat**: `_OUTPUT.md` said "Stage 4, awaiting design gate," but REVISIONS.txt (source of truth) showed the deck was already built, refined through ~20 revisions, and deployed live. Heartbeat corrected to reality.

### 2. Diagnosed the math error (Slide 10)
The client flagged the share price. Confirmed the source PDF + deck carried an internal contradiction:
- Stated: 49 shares available · $7,142/share · $600,000 total raise.
- **49 × $7,142 = $349,958**, not $600,000 — a ~$250K gap.
- Client's reconciliation: total capital = $600,000; investors own 49% = $294,000; 49 shares ⇒ **$600,000 × 0.49 ÷ 49 = $6,000/share** (not $7,142). Math confirmed exact.

### 3. Applied the fix — with a scope correction
- **Price Per Share: $7,142 → $6,000** (client's literal instruction).
- **Minimum Investment: $35,710 → $30,000.** I first changed this on my own (derived: 5 × $6,000), was challenged on scope, **reverted it to $35,710** to honor "only what the client said," then Quinten **explicitly authorized** $30,000. Net: $30,000, now properly authorized and logged.
- Both `index.html` copies (working `muevelo-simplified/` + deploy `muevelo/simplified/`) kept byte-identical (md5 match).

Slide 10 now fully reconciles: 49 × $6,000 = $294,000 = 49% of $600K; 5 × $6,000 = $30,000.

### 4. Slide 11 — resolved, no change
Flagged that Slide 11 labels the full $600,000 "Total Capital Raise." Quinten confirmed **keep $600K** — it already reconciles: 100 shares × $6,000 = $600,000 total; investors' 49 = $294,000; Trujillos' 51 = $306,000. No edit.

### 5. Deploy
- Pre-deploy checks: read DEPLOY-REGISTRY; remote = `Arc-Garde-Project/AG-Reports` ✓; Vercel project `ag-reports` ✓; CWD = repo root (deploy-hook requirement) ✓; dev folder excluded via `.vercelignore` ✓.
- Stashed an unrelated WIP file (`reports/tooth-place/w8.html`) so it would not ride along; restored it after.
- Deployed via `vercel --prod` (dpl_AahtoTx1H28Yhd7dyjoF6PjCrx2H), aliased to `ag-reports.vercel.app`.
- **Verified live on the alias:** Slide 10 shows $6,000 / 5 Shares ($30,000); old $7,142 & $35,710 absent (0 occurrences); full Muevelo deck + ag-reports root both still HTTP 200 (no regression).

### 6. Ripple audit (post-deploy)
Scanned all 21 slides — every `$` figure, every share reference, every `%`:
- Share price / count / minimum appear **only on Slide 10**.
- The deck never states the investor-pool dollar total, so **no downstream figure needed recomputing**.
- Old/derived values ($7,142 / $35,710 / $349,958 / $294,000 / $306,000) appear **nowhere** in the deck.
- $600K (slides 2 & 11) is an independently-stated total — unchanged, now reconciles.
- Slide 12 GM salary is **coincidentally** $6,000 (unrelated) — correctly left alone.
- **Verdict: change fully contained to Slide 10. No ripple.**

---

## Files changed this session
- `presentations/muevelo-simplified/index.html` — Slide 10 (price + minimum). Synced to `presentations/muevelo/simplified/index.html` (deployed copy).
- `presentations/muevelo-simplified/REVISIONS.txt` — appended client-sourced fix + deploy record.
- `presentations/muevelo-simplified/_OUTPUT.md` — heartbeat reconciled, deploy + ripple audit logged.
- `core/DEPLOY-REGISTRY.md` — Muevelo Simplified row noted 2026-06-04 redeploy.

---

```
LOCKED, DO NOT TOUCH
These are finished and live. Do not recreate, renumber, or change them
without an explicit instruction from me.

- All 36 AG standards in the directory (10 core + 26 web), present and live — none touched this session
- Slide 10 Price Per Share = $6,000 (client-caught fix; $7,142 was wrong)
- Slide 10 Minimum Investment = 5 Shares ($30,000) (Quinten-authorized = 5 × $6,000)
- Slide 11 Total Capital Raise = $600,000, unchanged (reconciles: 100 × $6,000; investors 49 = $294K, Trujillos 51 = $306K)
- Source of truth = Investor Deck - Google Docs.pdf (21 slides); v28 PPTX + full deck dropped
- Deck is deployed + verified live at ag-reports.vercel.app/presentations/muevelo/simplified

STATE
- Last cleared stage: Deployed live + ripple-audited (Slide 10 math fix), verified on alias
- Next action: none pending — awaiting your next direction
- Open: none
```
