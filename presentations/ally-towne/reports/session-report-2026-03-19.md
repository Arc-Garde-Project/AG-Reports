# Session Report - Ally Towne / The Wedding Mentor
**Date:** 2026-03-19
**Type:** Presentation Build
**Status:** Live

---

## What Was Done

### Presentation Rebuilt from Scratch
- Previous version was a paid ads only proposal with tiered pricing ($2,100/$3,927). Completely wrong for the current deal structure
- Rebuilt as a 14% revenue share partnership proposal
- Light theme (cream/rose gold) matching her actual website brand colors
- Fonts: Playfair Display (serif) + Inter (body) + Space Grotesk (data) matching her website
- Stripped to 4 sections: Hero, The Situation, The Plan, The Payment
- CTA section removed per Quinten's request

### Design Iterations
- Started dark theme, corrected to light after checking her actual website CSS
- Pill button service tags replaced with clean text + dot separators
- Plan section redesigned from cramped two-column to visual flow + card grid
- Logo added from Supabase asset, doubled in size
- All sections centered
- Eyebrow text replaced with logo

### Content
- Hero title: "YOU HAVE THE EXPERTISE. NOW YOU NEED THE SYSTEM."
- Situation section: 52 videos, $249 course price, 0 active funnels
- Plan section: 4-step visual flow (Ad > Funnel + PDF > Email Sequence > Whop) + 6 service cards
- Payment: 14% rev share, large centered number, "What that means" breakdown, "Why Revenue Share" explanation

### Deal Structure
- **14% revenue share on all operations**
- No monthly fees, no setup fees, no build fees
- Ad spend paid directly to Meta by Ally (separate from rev share)
- Revenue share applies to: course sales, community subscriptions, all revenue from systems AG builds

### What AG Delivers (all for the 14%)
- Funnel build (landing page, email capture, lead magnet PDF, email sequence, sales page)
- Paid ads management (Meta, 4-day testing cycles, reports every 4 days)
- Website redesign (black/white + rose accent, real content)
- Whop setup (course hosting, payment processing, community)
- Community management
- Professional videography (if needed)
- Ad creative production

### Technical
- Title: The Wedding Mentor Growth Partnership by Arc Garde
- Meta description, OG tags, Twitter Card, favicon all set
- noindex/nofollow
- Fluid clamp() tokens, prefers-reduced-motion, Intersection Observer
- IDWIP pass: orphan prevention with non-breaking spaces, half-carriage returns after periods
- Mobile hardened: 48px touch targets, touch-action on all links/buttons, tablet keeps 3-col stats and 2-col plan grid, logo scales on mobile, plan flow stacks vertically

### Deployment
- Live URL: `https://ag-reports.vercel.app/presentations/ally-towne/`
- Repo: Arc-Garde-Project/AG-Reports (master branch)
- Multiple commits pushed throughout session

---

## Background Context
- Ally Towne runs ATOWNEVENT / The Wedding Mentor
- Wedding planning course: ~52 videos structured by wedding timeline (18mo, 15mo, 12mo, etc.)
- Course price: ~$249
- Leads coming from catering companies
- Re-recording all videos (new on-camera format, branded backdrop)
- Beta tester lined up for testimonial
- Platform: Whop (lost Kajabi access)
- Consultation rate: $99/hour
- Brand: black and white with rose/pink accent
- Website build already exists in AG Website folder

---

## Outstanding Items
- [ ] Ally needs to finish re-recording course videos (~2 weeks from Feb 26)
- [ ] Final module count and pricing decision from Ally
- [ ] Whop account setup (AG to configure)
- [ ] Funnel build (landing page, email sequence, sales page)
- [ ] Website redesign pending presentation approval
- [ ] Beta tester testimonial (Ally meeting her)
- [ ] Lead magnet PDF creation
- [ ] Rev share agreement / contract to be drafted
- [ ] Health note: Ally was recently hospitalized, surgery consultation pending. Timelines may shift

---

## Files
- Presentation (deploy): `ag-reports/presentations/ally-towne/index.html`
- Meeting notes: `AG Clients/AG Website/AG The Wedding Mentor/docs/MeetingNotes_Ally_Feb26.pdf`
- Website build: `AG Clients/AG Website/AG The Wedding Mentor/build/`
- Logo: `https://ulhrqamsvaohirawndyu.supabase.co/storage/v1/object/public/AG%20-%20Assets/AG%20Wedding%20Mentor/AT%20wedding%20Mentor%20Logo%20T.png`
- Live: `https://ag-reports.vercel.app/presentations/ally-towne/`
