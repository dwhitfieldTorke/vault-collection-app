# Vault — Design Spec

Interactive prototype, iPhone. Scan a comic book or trading card and it lands on your shelf with a market estimate next to your own number.

> **Implementation note:** the real app (this repo) implements the screens, data model, and
> grade-based market-estimate calculator below, but the "Scan flow" section's camera capture and
> simulated AI-match/confidence step were dropped in favor of plain manual entry — no camera, no
> fake matching delay. Market estimates are now sourced from a real eBay Browse API lookup rather
> than the base-price-times-grade-multiplier math described here. The **Visual system** section's
> palette has since been updated to target the Relate design system (see below) and has **not yet
> been applied to the live app's CSS** — the app is currently still running the original warm
> parchment/blue palette this doc used to describe. Screens, data model, and grade tables
> otherwise match this spec.

## Concept

Comics and cards live in separate collections within the same app. The core loop is: scan the item, confirm what was matched (title, edition, condition), see how your own valuation compares to a market estimate, and save it to the shelf. Every saved item keeps both numbers side by side so the gap between "what I think it's worth" and "what it's trading for" is always visible.

## Screens

### 1. Shelf (home)

The default view. Shows the collection as a two-column grid of cover cards.

- Header: wordmark ("Vault"), running total estimate for the whole collection.
- Large heading: item count + context word ("14 items on the comics shelf" / "in the card binder").
- Subline: proposed total vs. market-estimate total for the current tab.
- Segmented control with two tabs: **Comics** and **Trading cards** — switching tabs resets the search query.
- Search field, placeholder copy changes per tab (comics: "Search title, issue, publisher"; cards: "Search player, set, number").
- Grid of item cards, 2 columns. Each card:
  - Cover area (hatched placeholder pattern standing in for the captured photo) with edition tag (top-left) and a "new" dot (top-right) if just added.
  - Item initials shown large and faint on the placeholder cover.
  - Title, condition grade, your value, and a compact delta vs. market ("+$40" / "−$12" / "at est.").
  - Tapping a card opens its Detail screen.
- Empty state ("Nothing matches that") when a search yields no results.

### 2. Item Detail

Opened from a shelf card.

- Back button labeled with the current tab name ("Comics" / "Cards").
- Cover thumbnail (placeholder) beside title, subtitle (edition · source), and a condition-grade pill.
- Value comparison panel: **Your value** and **Market est.** side by side, a divider, then a plain-language delta sentence ("You are $45 under the market estimate of $525."), and a condition slider (visual only, poor → mint) reflecting the grade's position on a 0–10 scale.
- Metadata list: Edition, Publisher/Set (label depends on type), Year, Condition (grade + note), Storage note.
- Two actions: **Use market estimate** (sets your value equal to the market figure) and **Done** (returns to the shelf).

### 3. Scan flow

Entered via the bottom nav's central Scan button. Three steps:

**a. Live capture**
Dark, full-bleed camera view with a viewfinder frame, an animated scan line sweeping vertically, and pulsing hint text ("Fill the frame with the cover" / "Center the card, avoid glare"). The Comics/Cards segmented control is repeated here (dark variant) so the type can be set before or during capture. A large circular shutter button sits at the bottom; Cancel returns to the shelf.

**b. Busy / matching**
After the shutter fires: a pulsing placeholder cover and the line "Reading the cover…" for a beat (simulated ~1.4s) before the match resolves.

**c. Confirm details**
A form pre-filled from the (simulated) match:
- Retake (back to live capture) / Confirm details header / balancing spacer.
- Matched-item summary: placeholder cover, "Matched" label, matched title, and a confidence line ("Cover match · 94% confident").
- Editable fields: Title; Edition/issue or Card number (label swaps by type); Publisher or Set (label swaps by type).
- Condition grid: 6 grade options as toggle buttons (label + short note, e.g. "NM 9.4 / Near mint"), each recalculating the market estimate when picked.
- Market estimate card: shows the computed estimate for the chosen grade, a sourcing note ("Median of 12 recent sales at NM 9.4, last 90 days."), and a "Your proposed value" currency input with a "Match est." shortcut button. A delta line below states how the proposed value compares to the estimate.
- Free-text storage note field.
- Validation: a title is required to save; otherwise an inline message appears.
- Primary action: **Add to \[comics/cards\] shelf** — saves the item, shows a toast confirmation, and returns to the shelf with the new item flagged.

### Persistent chrome

- **Toast**: a dark pill notification (checkmark + message) that appears briefly after saving an item.
- **Bottom tab bar**: Shelf (left) / Scan (center, filled pill button) / Value (right, stats placeholder — currently just flashes a toast with the running total since "Portfolio view is not in this prototype yet").

## Data model (prototype seed data)

Each collection item: `id, type (comic|card), title, edition, source (publisher/set), year, grade, value (your number), market (estimate), note`.

Grade scales, each with a value-multiplier `m` applied to a base market price to derive the estimate at that condition:

| Comics grade | Note | Multiplier |
|---|---|---|
| NM 9.4 | Near mint | 1.00 |
| VF 8.0 | Very fine | 0.62 |
| FN 6.0 | Fine | 0.38 |
| VG 4.0 | Very good | 0.24 |
| GD 2.0 | Good | 0.14 |
| Ungraded | Raw, unslabbed | 0.30 |

| Card grade | Note | Multiplier |
|---|---|---|
| PSA 10 | Gem mint | 1.00 |
| PSA 9 | Mint | 0.44 |
| PSA 8 | NM–MT | 0.26 |
| BGS 9.5 | Gem mint | 0.72 |
| Raw NM | Ungraded | 0.20 |
| Raw EX | Ungraded | 0.10 |

Seed collection ships with 4 comics (e.g. *The Vanishing Hour* #1, NM 9.4, $480 vs. $525 market) and 4 cards (e.g. M. Okonjo rookie, PSA 9, $610 vs. $700 market), used to populate the Shelf grid on first load.

## Visual system

> Restyled to follow the [Relate design system](https://styles.refero.design/style/337ade6a-4bae-49ba-b4aa-8994ac805a81)
> — "cool dawn over product canvas": clean, minimal, confident-through-restraint, a single
> saturated brand blue carrying the whole identity. **Not yet applied to the live app's CSS** —
> this section documents the target palette/type/shape system for the next styling pass; the
> screens and interaction notes elsewhere in this doc are unaffected.

- **Typography**: Inter (400/500/600) for everything — body, UI labels, and headings (no separate
  display face). Fallback stack: DM Sans, Geist, Manrope. Monospace (numeric tables, IDs): Roboto
  Mono (500/700). Scale: Display 80px/600, Heading Large 56px/600, Heading 40px/600 (all
  line-height 1.05, tight negative letter-spacing), Body 16px/400 (line-height 1.63), Body Small
  14px/400 (line-height 1.43) — never smaller than 14px, never lighter than Ash Helper below.
- **Palette**:
  - Canvas/background: `#fcfcfc` (Snow Canvas) — page background and cards
  - Secondary surfaces: `#f0f4fe` (Lavender Wash, hero/feature sections), `#f1f5f9` (Fog Surface,
    inputs and disabled states)
  - Ink: `#020520` (Midnight Ink, headings), `#14141e` (Graphite Body, body/UI text),
    `#374151` (Slate Caption, secondary copy), `#6b7280` (Ash Helper, tertiary/faint)
  - Borders/dividers: `#e2e8f0` (Stone Divider)
  - Accent (the *only* saturated brand color — never mix in a second): `#145aff` (Royal Signal)
    for headlines, links, and active states; `#3b82f6` (Cobalt Glow) for soft hover/background
    emphasis; `#0099ff` (Azure Focus) for input focus rings
  - Status accents (tags/indicators only, not brand identity): `#16ca2e` (Mint Win, success),
    `#f26052` (Coral Lost, error), `#ffa64d` (Amber Pending, pending)
- **Shape language**: two-tier rounding — 8px for cards/tags, 12px for inputs, 16–40px for outer
  containers/feature panels; buttons and pills are fully rounded (`9999px`). No sharp 90° corners
  on visible elements. Borders thin (1px) in Stone Divider.
- **Shadows**: small ambient shadow `rgba(0,0,0,0.1) 0px 0px 4px -2px` for resting cards; a soft
  blue glow `rgba(20,90,255,0.1) 0px 0px 100px -28px` for elevated/focused elements; multi-layer
  three-shadow stacks for floating feature cards.
- **Density**: compact — prefer 8–12px gaps between related elements over airy spacing; card
  padding ~12px. (The page-level section padding and 1200px max-width from the source system are
  desktop-marketing conventions and don't apply to this app's mobile-first `max-w-md` shell.)
- **Do**: pill radius on every interactive element; ghost-outlined or frosted pills for CTAs,
  never heavy filled blocks; 4–6px color-coded status dots.
- **Don't**: introduce a second saturated brand hue; use browser-default link blue (`#0000ee`);
  stack multiple saturated colors in one component; use Inter outside 400/500/600.

## Interaction notes

- Switching the Comics/Cards tab clears the current search query.
- Uppercase, letter-spaced micro-labels (10–12px) are used consistently for field labels and metadata keys throughout the detail and form screens.
- The market estimate recalculates live as the grade selection changes, before the item is saved.
- "Use market estimate" / "Match est." both offer a one-tap way to align your number with the market figure, on the Detail screen and the Scan confirm form respectively.

## Suggested next steps (from the prototype notes)

- A want list for items not yet owned.
- Sets/series completion tracking.
- An export flow for insurance documentation.
- Replace the hatched placeholder covers with the actual captured photo.