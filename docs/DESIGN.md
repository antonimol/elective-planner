# DESIGN.md — Elective Planner, "Raw Index" v2

Status: **implemented** (Nov 2026). Replaces the v1 "Raw Index" step-nav design. Deviations are listed in section 8.
Reference: `docs/design/*.png` (screens) and `docs/design/mockups/*.html` (static HTML of the same screens; exact values live there — open them in a browser, copy values, do not ship them).

Scope: **visual restyle + one new feature (first-visit tips)**. Functionality, data, copy and component structure stay as they are today, unless a section below says otherwise. UI language stays **English**.

| Screen | Image | Mockup | Code |
|---|---|---|---|
| Style reference | `0-style.png` | `0-style.html` | — |
| Start (program + section) | `1-start.png` | `1-start.html` | `ProgramPicker.tsx` |
| Plan | `2-plan.png` | `2-plan.html` | `PlanScreen.tsx` and children |
| Plan, first visit (tips) | `2b-plan-first-visit-step1/2/3.png` (all three at once: `2b-plan-first-visit.png`) | `2b-plan-first-visit.html` | new `FirstVisitTips.tsx` |
| Copy summary dialog | `3-summary-dialog.png` | `3-summary-dialog.html` | `SummaryDialog.tsx` |

---

## 1. Colours

Replace the `:root` variables in `src/index.css`. Old names are kept and remapped, so most rules keep working.

```css
:root {
  --paper: #ffffff;      /* page and every surface */
  --ink: #0b0b0b;        /* text, 1px borders, mandatory courses */
  --muted: #6e6e6e;      /* secondary text, labels, hours */
  --blue: #002fa7;       /* International Klein Blue: actions, selection, electives, header */
  --signal: #ff5a1f;     /* clashes only, always with ink text */
  --hairline: #e4e4e4;   /* row dividers inside cards, timetable hour lines */
  --lunch: #f3f3f3;      /* timetable lunch band 14:00–15:30 */

  /* legacy names → new values */
  --bg: var(--paper);
  --card: var(--paper);
  --text: var(--ink);
  --border: var(--ink);
  --primary: var(--blue);
  --mandatory: var(--ink);
  --mandatory-bg: var(--ink);
  --elective: var(--blue);
  --elective-bg: var(--blue);
  --error: var(--signal);
  --error-bg: var(--signal);
  --radius: 0;
}
```

Remove `--primary-soft`, `--warning`, `--warning-bg`, `--ok`, `--ok-bg` and every rule that uses them (warnings become plain rows with a bold label, see Messages).

| Token | Hex | Use | Contrast |
|---|---|---|---|
| paper | #FFFFFF | page, cards, inputs | — |
| ink | #0B0B0B | text, borders, mandatory blocks (white text) | 19.7:1 on paper |
| muted | #6E6E6E | secondary text | 5.1:1 on paper |
| blue | #002FA7 | header bar, primary buttons, selected states, links, elective blocks (white text), focus ring | 10.7:1 with white |
| signal | #FF5A1F | clash fills: messages, blocks, rows, tags | 6.3:1 with ink |
| hairline | #E4E4E4 | decorative dividers only | — |
| lunch | #F3F3F3 | decorative band only | — |

Rules: mandatory = ink, elective = blue, clash = signal, preview = dashed blue outline. Signal is only for clashes, always with ink text and always with a word ("Clash", "Time clash", "Exam clash (blocking)"). Never white or blue text on signal.

## 2. Typography

Fonts are self-hosted via Fontsource (imported in `src/main.tsx`), so no visitor IPs go to Google. The equivalent Google Fonts link:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Hanken+Grotesk:wght@400;500;600&display=swap">
```

```css
:root {
  --font-serif: 'Cormorant Garamond', Georgia, serif;
  --font-sans: 'Hanken Grotesk', system-ui, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-family: var(--font-sans);
  font-size: 14px;
  line-height: 1.45;
}
```

| Style | Font | Size / line-height | Weight | Where |
|---|---|---|---|---|
| brand | serif | 26px / 1 | 500 | "Elective Planner" in the header |
| page-title | serif | 34–36px / 1.1 | 500 | "Who are you?", "Business Analytics · Section TXA" |
| card-title | serif | 26px / 1.1 | 500 | Exam dates, ECTS, Add electives |
| tip-title | serif | 22px / 1.1 | 500 | first-visit tip heading |
| day-name | serif | 20px / 1 | 500 | timetable day headers |
| ects-number | serif, `font-feature-settings: 'onum'` | 60px / 0.9 | 400 | ECTS total |
| body | sans | 14px / 1.45 | 400 | default |
| body-strong | sans | 14px | 600 | course titles in lists, choice titles |
| table | sans | 13.5px | 400 | exam table, course lists |
| small | sans | 12.5px | 400 | hints, metadata, small buttons |
| label | sans, uppercase, letter-spacing 0.04em | 12px | 600 | fieldset legends ("PROGRAM", "SECTION"), "YOUR COURSES" |
| tag | sans | 11.5px | 600 | tags |
| block | sans | 12–12.5px title (600), 11.5px meta | — | timetable blocks |
| code | mono | 12.5px / 1.5 | 400 | summary textarea |

Rule: **serif only for titles and big numbers, never below 20px.** Everything you read in detail or operate is the sans.

## 3. Shape, space, states

- `border-radius: 0` everywhere. No shadows. Cards and controls: `1px solid var(--ink)`. Inner dividers: `1px solid var(--hairline)`.
- Card padding `16px 18px 18px`; page padding 24px; gap between cards 20px. Plan grid: main `flex: 999 1 640px`, aside `flex: 1 1 380px; max-width: 440px` (stacks under ~1100px).
- Control heights: primary button 44px, secondary 40px, segmented 38px, section chip 40px, small button 30px, inputs 38px.
- Focus: `outline: 2px solid var(--blue); outline-offset: 2px`.
- Hover: secondary buttons and chips → `border-color: var(--blue)`; course card being previewed → `border: 2px solid var(--blue)` (keep total size: drop padding by 1px).
- Disabled: `opacity: .45; cursor: not-allowed`.
- Emoji only as signals: ⚠️ on clashes, ✓ for "selected / in plan / copied". No decorative emoji.

## 4. Components (existing class → new look)

**Header** (`.app-header`) — full-width blue bar, padding 14px 24px, white text: brand (serif 26px) + tagline (12.5px). On the plan screen, right side: `28 ECTS this semester` (12.5px).

**Choice card** (`.choice`) — 1px ink border, padding 13px 15px, title 14px/600, detail 12.5px muted ("3 sections"). Selected: `2px solid var(--blue)`, blue text, title prefixed "✓ ". Grid `repeat(auto-fill, minmax(210px, 1fr))`, gap 10px.

**Section chip** (`.chip`) — 40px high, padding 0 18px, 1px ink border, 600. Selected: blue fill, white text.

**Buttons** (`.btn`) — secondary: white, 1px ink border. Primary (`.btn.primary`): blue fill, blue border, white, 500. Small (`.btn.small`): 30px, 12.5px; "Add" is small primary, "Remove" small secondary. Link (`.link`): blue, underlined, offset 3px, 13px.

**Segmented control** (`.segmented`, T1/T2) — 1px ink border around the group, segments separated by a 1px ink line, 600; selected: blue fill, white text.

**Tabs** (`.tabs`) — 1px ink line under the row; tab 600 muted; selected: blue text with a 3px blue underline overlapping the line.

**Inputs** (`.filters input, select`) — 38px, 1px ink border, square, white. Checkbox `accent-color: var(--blue)`, 16px.

**Tag** (`.tag`) — 11.5px/600, padding 1px 6px, square. Default: 1px ink border ("Mandatory", "Same day", "Exclusive"). `.tag.error` / `.tag.warning` ("Exam clash", "Time clash"): signal fill, no border. `.tag.accent` (Area of Expertise): blue border, blue text.

**Messages** (`.messages`, `.msg`) — one bordered box, rows separated by 1px ink lines, padding 10px 14px, no left border. Exam clash (blocking): signal fill, label "⚠️ Exam clash (blocking):". Class clash and same-day/overlap: white rows, bold label. No clashes: one white row "✓ No clashes in your plan."

**Timetable** (`.timetable`, `.tt-*`) — inside a card. Legend row (10px squares + labels, 12.5px) with the hint in muted. Day names serif 20px with 1px ink line under; day columns divided by 1px ink lines; hour lines `--hairline`; lunch band `--lunch`; hours 11.5px muted. Keep existing scale and lane logic.

**Timetable block** (`.tt-block`) — square, no border, padding 6px 8px; title 12.5px/600, meta 11.5px. Mandatory: ink fill, white. Elective: blue fill, white. Clash: signal fill, ink text, extra line "⚠️ Clash". Preview: white, 1px dashed blue border, blue text, extra line "Preview". Narrow lanes: title 12px, padding 5px 6px. Remove the old left border and outline.

**Exam table** (`.exam-table`) — 13.5px; header 12px/600 muted with 1px ink line; rows divided by hairline. Columns: Date · Time · Course (section muted) · Type · **Status** (new column: empty, "Same day" tag, or "⚠️ Clash" bold). Blocking rows: signal fill, ink text.

**ECTS card** (`PlanSummary`) — card-title "ECTS", ects-number + "ECTS this semester" (muted), `dl` rows muted label / bold value right-aligned, muted note. "YOUR COURSES" label after a 1px ink line. List rows: 10px square (ink/blue), title + muted meta, then "Mandatory" tag or "Remove" small button; rows divided by hairline; clashing row: signal fill.

**Course card** (`.course`) — 1px ink border, padding 10px 12px, title 14px/600, meta 12.5px muted, sections below a hairline: section code (12.5px/600, 34px wide), times (12.5px muted), optional "Time clash"/"Exam clash" tag, Add/Remove. A section already in the plan shows "✓ In plan" + Remove. Previewed course: 2px blue border. AoE-highlighted course: 2px blue border too.

**Summary dialog** (`.summary-dialog`) — 720px, white, 1px ink border, square, padding 20px 22px 22px; backdrop `rgba(20,20,20,.45)`; title serif 28px; Close small secondary; textarea mono 12.5px with 1px ink border; status "✓ Copied to clipboard."; primary "Copy to clipboard".

## 5. Screens

**1 · Start** — header; centered card max 760px, padding 28px 32px 32px: page-title "Who are you?", muted intro, PROGRAM legend + choice grid (6 programs, real section counts), SECTION legend + chips, muted hint, then a 1px ink line and the primary "Show my plan →" right-aligned. Footer: one muted 12.5px line centred. Behaviour unchanged.

**2 · Plan** — header; plan bar: page-title "{Program} · Section {code}" + link "Change program or section"; right: "Copy summary" (secondary) + T1/T2 segmented. Main column: messages, timetable card, exam card. Aside: ECTS card, Add electives card. Behaviour unchanged.

**3 · Summary dialog** — as in section 4; text unchanged.

## 6. New feature: first-visit tips

Shown the first time someone opens the plan screen (after picking a program); one tip at a time, three steps.

| Step | Anchored to | Placement | Title | Text |
|---|---|---|---|---|
| 1 / 3 · Timetable | timetable card | inside the card, over the free afternoon area, arrow pointing up | Your week, at a glance | Mandatory courses are already in. Hover an elective in the list to preview it here; anything that clashes turns orange. |
| 2 / 3 · Your courses | ECTS card | left of the card, arrow pointing right | Keep count of your ECTS | Everything in your plan is listed here with its credits. Mandatory courses stay; electives can be removed with one click. |
| 3 / 3 · Add electives | Add electives card | left of the card, arrow pointing right | Find and add electives | Search or filter by term, then pick a section. "Time clash" tells you before you add it; "Hide clashing" clears them from the list. |

Look (see `2b-plan-first-visit-step*.png`):
- Popover 290px wide, white, 1px ink border, square, no shadow.
- Header strip: blue, white 11.5px/600 uppercase, letter-spacing .06em: "TIP 1 / 3 · TIMETABLE".
- Body padding 12px 14px 14px: tip-title (serif 22px), text 13.5px.
- Footer: left link-style muted "Skip tips" (step 3: "← Back"), right small primary "Next →" (step 3: "Done").
- Arrow: 12px square rotated 45°, white with ink border on the two outer sides (blue, no border, when it touches the header strip).
- Anchored card gets `outline: 2px solid var(--blue); outline-offset: 4px` while its tip is open.
- Banner above the plan bar while the tour runs: 1px blue border, blue text, padding 10px 14px: "**New here?** Three quick tips walk you through the timetable, your courses and the elective list." + right link "Skip tips".

Behaviour:
- Start automatically on the first plan view; store `elective-planner.tipsSeen = "1"` in `localStorage` on Done or Skip (wrap in try/catch; if storage fails, show once per session).
- Esc = Skip. Focus moves to the popover's primary button when a step opens; `role="dialog"`, `aria-label="Tip 1 of 3: your week"`, non-modal (page stays usable).
- Below 1100px (aside stacks under the main column) place tips 2 and 3 above their card with the arrow pointing down.
- Add a small "Show tips" link in the footer to replay the tour.
- Unit-test the persistence helper (Vitest), like the existing `lib/*.test.ts`.

## 7. Implementation order

1. Fonts in `index.html`; new `:root` in `src/index.css`.
2. Restyle global elements: header, cards, buttons, chips, segmented, tabs, inputs, tags, focus.
3. Restyle messages, timetable blocks, exam table (+ Status column), plan list, course cards, dialog.
4. Build `FirstVisitTips.tsx` + `src/lib/tips.ts` (persistence) + tests.
5. Compare each screen with its PNG at 1440px, then at 1100px and 390px.
6. `npm run lint && npm test && npm run build` must pass.

## 8. Implementation notes and deviations

- **Fonts** self-hosted (`@fontsource/cormorant-garamond`, `@fontsource/hanken-grotesk`) instead of the Google Fonts link.
- **Exam length is 1.5 h**, not 3 h as in the mockup copy: exam times read `14:30–16:00` and the exam note says "assumed to last at most 1.5 hours". Rules in `docs/SPEC.md` FR-7.
- **Timetable scale** stays at 1px/min, 08:00–21:30 (the data has classes until 21:30); course titles wrap in full. Tip 1 therefore sits at `top: 440px` (14:00) instead of 380px.
- **Exam table Status**: blocking clash `⚠️ Clash`; non-blocking overlap (midterm/presentation) `Overlap` tag; same date without overlap `Same day` tag.
- **Tabs** keep their counts ("Your program (27)"); the "Showing 5 of…" line in the mockup is not implemented (the list scrolls).
- **Tips** live in `src/components/FirstVisitTips.tsx` (popover + banner), persistence in `src/lib/tips.ts` (`elective-planner.tipsSeen`, in-memory fallback), Esc handling in `useEscToClose.ts`. "Show tips" sits in the footer on the plan screen.
- **Mockups** in `docs/design/mockups/` are references only; they load Google Fonts and are not part of the app.
