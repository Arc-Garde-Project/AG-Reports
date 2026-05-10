# Session Report — ATP OCS Presentation

**Date:** 2026-05-05
**Project:** Americana Tax Planning — Organic Content System
**File:** `ag-reports/presentations/americana-tax/ocs.html`
**Live URL:** https://ag-reports.vercel.app/presentations/americana-tax/ocs
**Owner:** Quinten

---

## Summary

Comprehensive content, visual, and math overhaul of the ATP OCS sales presentation. 4 commits pushed to `Arc-Garde-Project/ag-reports` master, all auto-deployed via Vercel.

Initial state: deck was already deployed at the live URL with the 30-day "180 posts/month" framing and a flat 8-icon platform row. End state: 28-day math, 1,008 cross-platform total surfaced in hero, 4×2 glass platform grid with per-platform cadence, full content-mix breakdown in scope cards, new "What We Need" client onboarding section, and consistent chevron section labels.

---

## Commits (chronological)

| # | SHA | Description |
|---|-----|-------------|
| 1 | `3f8b38f` | Content mix rebuild, platform grid redesign, what-we-need section |
| 2 | `3050c75` | Instagram removal from text card (4 platforms not 5) |
| 3 | `5af9344` | 28-day math, per-platform cadence, 1,008 cross-platform total |
| 4 | `7f79631` | Chevron badges, mobile hero rewrap, readability bump, May date |

---

## Changes by Section

### Section 1 — Hero
- **Platform grid redesigned:** flat 8-icon row → 4×2 glass card grid with brand-color top accents and hover lift
- **Each platform card** now has icon + name + posts/day cadence
  - 6 posts/day: Facebook, Threads, X (Twitter), LinkedIn (get all 3 content types)
  - 3 posts/day: Instagram, TikTok, YouTube, Google Maps (video + image only)
- **Hero stat updated:** `168 / Posts Per Month` → `1,008 / Posts Across All Platforms`
- **Mobile hero rewrap:** "Content System" wraps to second line below "Organic" at viewports under 768px
- Mobile platform card text bumped (name 13→14px, tag 11→12px)

### Section 2 — Scope Cards
- Replaced 3 row-1 cards with new content mix breakdown:
  - **SHORT FORM VIDEO** — 56 videos/month, all 8 platforms, video icon (kept)
  - **IMAGE POSTS** — 28 image posts/month, all 8 platforms, NEW photo icon
  - **TEXT POSTS** — 84 text posts/month, 4 platforms (Facebook, LinkedIn, X, Threads), NEW file-text icon
- Removed old MULTI-PLATFORM DISTRIBUTION card (info absorbed into per-card distribution lines)
- Row 2 (ACCOUNT UNIFICATION + REPORTING) untouched
- List item font size 15px → 16px

### Section 3 — Dashboard
- "Posts Published / Monthly" metric: `168` → `1,008` (cross-platform total for consistency with hero)

### Section 4 — Pricing Card
- List bullets updated:
  - "90 short-form videos per month" → "56 short-form videos per month"
  - "90 text and graphic posts per month" → split into "28 image posts per month" + "84 text posts per month"
- List item font size 15px → 16px

### Section 5 — Next Steps
- **NEW sub-section: "WHAT WE NEED TO BEGIN"** with 5 checklist items:
  1. Profile access on all 8 platforms (admin invite or login)
  2. One 2 to 3 hour on-site shoot day (we bring cameras/lighting/audio)
  3. Brand assets (logo files, brand colors, existing templates)
  4. Topic sign-off (we send monthly content calendar, you approve)
  5. One point of contact (for monthly reports, strategy reviews, questions)
- Visual treatment: blue-gradient top accent card with custom blue-circle check icons on each list item
- Step description font size 15px → 16px

### Section 6 — Footer
- Date: `April 2026` → `May 2026`

### Global / All Sections
- **Section labels redesigned:** long 40px horizontal-line accent → chevron pairs on both sides (`‹ LABEL ›`). Affected 5 labels: section 2, 3, 4, 5 main, 5 needs sub-section
- **Em dashes scrubbed** from `<title>` and `og:title` per AG copywriting standard (replaced with `|`)
- **Meta description** updated to reflect new content mix (56v / 28i / 84t)
- **OG description** updated 180 → 168 posts/month

---

## Math Reference (28-day basis, locked)

| Content Type | Per Day | Per Month | Platforms | Cross-Platform Total |
|--------------|---------|-----------|-----------|----------------------|
| Short-form video | 2 | 56 | 8 (all) | 448 |
| Image posts | 1 | 28 | 8 (all) | 224 |
| Text posts | 3 | 84 | 4 (FB/LI/X/Threads) | 336 |
| **Total** | **6** | **168** | varies | **1,008** |

Hero and dashboard surface the 1,008 cross-platform total. Scope cards and pricing card surface the 168 unique-pieces breakdown.

---

## AG Standards Compliance

- ✅ No em dashes in user-facing copy
- ✅ Half carriage returns (`<span class="hcr">`) preserved in body paragraphs
- ✅ Orphan prevention (`&nbsp;`) added to all new list items between last 2 words
- ✅ Animation timing 0.3s (multiples of 3 or 7)
- ✅ Glass effect on platform cards (gradient bg + border + hover shadow)
- ✅ Brand-color top accents on platform cards
- ✅ Touch targets > 48px on all interactive elements
- ✅ Responsive: 4×2 grid desktop → 2×4 grid mobile
- ✅ No placeholder content
- ✅ AG fluid tokens preserved on hero title (`clamp()` values)
- ✅ Lenis smooth scroll preserved (0.9s)
- ✅ Bebas Neue + DM Sans + Space Grotesk font stack preserved

---

## Decisions Log

| Decision | Resolution |
|----------|-----------|
| Daily cadence: 6/day vs 3/day | Kept 6/day. Reframed as content mix (2v + 1i + 3t) |
| Calendar basis: 30 vs 28 days | 28-day basis confirmed |
| Hero stat framing | 1,008 cross-platform total (not 168 unique) |
| Section 3 dashboard metric | Match hero at 1,008 for consistency |
| Text on Instagram | Excluded. IG is image-first |
| Platform tagline copy | Removed. Replaced with daily cadence numbers |
| "What We Need" placement | Below 3 chronological steps, before "Ready when you are" tag |
| Section label visual | Chevron pairs on both sides (replaced 40px line) |
| Bigger text scope | Universal +1px on body list copy (15→16) + mobile platform text bump |

---

## Outstanding / Flagged

- **One em dash remains** in CSS comment at line 1116 (`SCROLL REVEAL — RAT BRAIN TRANSITIONS`). Code comment only, not user-facing. Left in place.
- **`.arc-ocs1-platform-tag` CSS class** retained for cadence text usage. Originally created for taglines, repurposed.
- **Repo redirect notice on push:** GitHub flags new canonical URL `Arc-Garde-Project/AG-Reports.git` (capitalized) vs current `ag-reports.git` (lowercase). Push works fine via redirect. Optional cleanup: `git remote set-url origin https://github.com/Arc-Garde-Project/AG-Reports.git`
- **Unrelated uncommitted changes** in repo (`index.html` modification + 14 untracked files in `presentations/` and `reports/`) — not touched this session.

---

## Files Modified

- `presentations/americana-tax/ocs.html` (4 commits, 300+ lines net change)

---

## Next Session Hooks

- Live URL ready for ATP review: `https://ag-reports.vercel.app/presentations/americana-tax/ocs`
- Per Quinten's earlier note, full deck copy sweep (sections 3, 4, 5 alignment with new content mix framing) was deferred — may be revisited after ATP feedback
- Repo origin URL update is optional cleanup
