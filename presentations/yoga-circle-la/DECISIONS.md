# Yoga Circle LA proposal — design decision log

Every deliberate divergence from an AG primitive or standard, with the reason.
Required by AG-DESIGN-TASTE-STANDARD rule I3.

## Divergences

| Decision | AG default | What this deck does | Why |
|---|---|---|---|
| Card radius 24px / 32px | AG radius set 0/3/7/14/21 | 24px cards, 32px proof block | The client's live site sets `--radius-lg: 24px` and `--radius-xl: 32px`. A client's own shipped artifact outranks a generic AG value for that client's look. |
| Palette is sage-led, not ember-led | Brand mark colour usually leads | Sage `#5b7c6b` action, gold `#c9a86c` ornament, ember `#ea5604` held to the seal and the live ad pair only | yogacirclela.com carries no orange anywhere. Matching her site beat matching her logo. Quinten approved 2026-09-08. |
| Sage text sets at `#4a6758`, not `#5b7c6b` | Use the brand token as published | Darker step for text, published token for fills | Her published `#5b7c6b` measures 4.25:1 on cream and fails AA. Matching the site without inheriting its contrast defect. |
| Two infinite marquees | TASTE F9 forbids infinite animation | Wood ticker and platform rail both loop forever, and neither pauses on hover | Quinten's explicit direction 2026-09-09: "make sure that the mouse doesn't make it stop, for both scroll effects". |
| AG report curtain, not `ag-curtain` v2.5 | Website curtain primitive | Two-phase load/brand curtain lifted from the locked Arbor report | Presentations use the report curtain. Timing matches the standard (2520/900/6000) plus a `BRAND_AT` phase the website primitive has no concept of. 6 of 10 sibling decks in ag-reports do the same. |
| No call to action | TASTE F1 expects one CTA in the first viewport | The deck ends on the ledger, no CTA | It is a proposal delivered by a person over a private magic link, not a landing page. Raised with Quinten 2026-09-09. |
| Scrollbar rail label hidden at 768 and below | Rail ships with its label | Rail and thumb kept, words dropped | Same call Quinten made on this client's website build: words on the pill read as clutter on a phone. |

## Not divergences, recorded so they are not re-litigated

- `ag-scrollbar.css` and `ag-scrollbar.js` are byte-identical to the library copies, verified with `cmp`. The label suppression is an override in the deck, not a fork.
- Section rhythm is 79.2px per edge, chosen to land the between-section gap on her site's 160px, not on an arbitrary number.
- Timeline bars reveal with `clip-path`, not `scaleX`, because scaling squashes the label text for the full duration.
