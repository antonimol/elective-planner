# DESIGN.md — Elective Planner, "Raw Index" redesign

Status: **implemented** (Nov 2026). This file is the design spec for `src/index.css` and the markup in `src/components/`. Screens are in `docs/design/*.png` (0-styl, 1-start, 2-plan, 3-electivy, 4-egzaminy). Deviations from the original mockups are listed in section 8.

Idea: a raw, technical, typographic index. White paper, 1px black rules, one strong blue, one signal colour. A serif is the voice (course titles, numbers), a small grotesk is the instrument (labels, values, controls). Every value and action sits in square brackets.

---

## 1. Colours

Replace the `:root` block in `src/index.css`. Existing variable names are kept so most rules keep working; values change.

```css
:root {
  /* core */
  --paper: #ffffff;      /* page and every surface */
  --ink: #0b0b0b;        /* text, rules, mandatory courses */
  --muted: #6e6e6e;      /* secondary labels, hints, hours */
  --blue: #002fa7;       /* International Klein Blue: action, values, electives */
  --signal: #ff5a1f;     /* clashes only */

  /* support */
  --grid-line: #e4e4e4;  /* timetable hour bands */
  --lunch: #f3f3f3;      /* timetable lunch band 14:00–15:30 */
  --inactive: #8a8a8a;   /* unselected large serif options (≥44px only) */

  /* legacy names → new values */
  --bg: var(--paper);
  --card: var(--paper);
  --text: var(--ink);
  --border: var(--ink);
  --primary: var(--blue);
  --mandatory: var(--ink);
  --elective: var(--blue);
  --error: var(--signal);
  --radius: 0;
}
```

Remove: `--primary-soft`, `--mandatory-bg`, `--elective-bg`, `--error-bg`, `--warning`, `--warning-bg`, `--ok`, `--ok-bg` (no tints in this direction; see the components for what replaces them).

| Token | Hex | Use | Contrast |
|---|---|---|---|
| paper | #FFFFFF | page, all surfaces | — |
| ink | #0B0B0B | text, 1px rules, mandatory blocks (white text) | 19.7:1 on paper |
| muted | #6E6E6E | labels, metadata, hours, footnotes | 5.1:1 on paper |
| blue | #002FA7 | header bar, primary button, bracket values, links, elective blocks (white text), focus ring | 10.7:1 with white |
| signal | #FF5A1F | clash fill only, always with **ink** text | 6.3:1 with ink |
| grid-line | #E4E4E4 | timetable hour lines (decorative) | — |
| lunch | #F3F3F3 | lunch band (decorative) | — |
| inactive | #8A8A8A | unselected serif options at 44px+ | 3.5:1 (large text only) |

Rules
- Course kind: mandatory = ink, elective = blue, clash = signal. Never other colours for these.
- Signal is only for clashes. A clash always also says so in words ("⚠️ Kolizja", "kolizja — blokuje").
- Never white text on signal, never blue text on signal.

## 2. Typography

Self-hosted via `@fontsource/cormorant-garamond` and `@fontsource/hanken-grotesk`, imported in `src/main.tsx` (no requests to Google, so no visitor IPs leave the site). The equivalent Google Fonts link would be:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Hanken+Grotesk:wght@400;500;600&display=swap">
```

```css
:root {
  --font-serif: 'Cormorant Garamond', Georgia, serif;
  --font-sans: 'Hanken Grotesk', system-ui, sans-serif;
  font-family: var(--font-sans);
  font-size: 12px;
  line-height: 1.35;
}
.num { font-feature-settings: 'onum'; } /* old-style figures for ECTS, dates, year */
```

| Style | Font | Size / line-height | Weight | Where |
|---|---|---|---|---|
| index-title | serif | `clamp(44px, 6.4vw, 96px)` / 1 | 500 | program names, elective titles (one line, `white-space: nowrap; overflow: hidden` — clipping at the edge is intended) |
| ects-number | serif + onum | 128px / 0.8 | 400 | ECTS total |
| exam-date | serif + onum | 64px / 1 | 400 | exam table date |
| corner | serif + onum | 56px / 0.9 | 400 | footer corners ("2026/27", "T1·T2") |
| section-title | serif | 32px / 1 | 500 | "Twoje kursy" |
| day-name | serif | 28px / 1 | 400 | timetable day headers |
| exam-course | serif | 32px / 1.05 | 400 | course in the exam table |
| block-title | serif | 20px / 1 (17px in narrow lanes) | 400 | course title in a timetable block |
| label | sans | 12px / 1.35 | 400 (600 for selected/strong) | everything technical: nav, filters, metadata, messages, lists |
| button-lg | sans | 14px | 500 | full-width primary button |
| meta-sm | sans | 11px | 400 | timetable hours, block meta |
| brand | sans, uppercase, +0.02em | 12px | 600 | "ELECTIVE PLANNER" |

Rules
- Two families only. Serif = names and numbers; sans = everything you operate.
- No other heading sizes. `h1`/`h2`/`h3` get the styles above via classes.

## 3. Shape and space

- `border-radius: 0` everywhere. No shadows. No cards: structure comes from 1px `--ink` rules (`border-bottom` between rows, `border-left` between columns).
- Page gutter 16px. Row padding 10px vertical. Meta column 200–220px, gap 24px to the title.
- Focus: `outline: 2px solid var(--blue); outline-offset: 2px`.
- Breakpoint behaviour: rows are `display:flex; flex-wrap:wrap` — the meta column (`flex: 0 0 200px`) sits above the title on phones (title `flex: 999 1 480px`). Plan aside wraps under the timetable below ~1100px; the timetable scrolls horizontally inside its box (`min-width: 700px`).

## 4. Writing

- UI language: Polish (copy in the screens). Course titles stay in their original English.
- Brackets for every value and action: `[✓] T1`, `[ ] T2`, `[2448]`, `[T1 · 3.5 ECTS]`, `[+ Dodaj]`, `[Usuń]`, `[ 28.0 ] ECTS`.
- `[✓]` = on/selected, `[ ]` = off.
- Metadata joined with ` · `. Times `08:00–11:00` (en dash). Dates `19 paź`.
- Emoji only as signals: ⚠️ for a clash, ✓ for "w planie". Never decorative.

## 5. Components

Each maps to an existing class so the change is mostly CSS.

**Header / step nav** (`.app-header`) — 40px row. Left cell: brand on paper. Right: `--blue` bar, white 12px labels, gap 40px: `[✓] Program  [✓] Plan  [ ] Electivy  [ ] Egzaminy  [ ] Podsumowanie` and, pushed right, `[ 28.0 ] ECTS`. `[✓]` marks steps done/current.

**Toolbar** (`.plan-bar`, `.filters`) — 12px row, `border-bottom: 1px solid var(--ink)`, padding 12px 16px, wraps. Holds context ("Business Analytics · Sekcja A"), bracket toggles, a 1px vertical divider (14px high) between groups, legend on the right.

**Bracket toggle** (replaces `.segmented`, `.chip`, `.tabs`) — plain text `<button>` with `aria-pressed` / `role="tab"`. On: `[✓] T1`, weight 600. Off: `[ ] T2`, muted or ink 400. No background, no border.

**Value** (`dd`, inline values) — blue text in brackets `[2448]`. Interactive values are `<button>`s in blue; hover → ink.

**Primary button** (`.btn.primary`) — blue fill, white 14px/500, padding 14px 28px, square: `[ Pokaż mój plan → ]`, `[ + Dodaj electivy → ]`. Small inline variant: `[+ Dodaj]` white on blue, padding 0 4px. Disabled: 45% opacity.

**Text button** (`.btn`, `.link`, `.btn.small`) — blue text in brackets: `[Usuń]`, `[ Zmień ]`. On a signal row: ink, 600.

**Index row** (`.choice`, `.course`) — flex row, `border-bottom: 1px solid var(--ink)`. Left: `<dl>` meta grid (80px label + bracket value). Right: index-title. States:
- default: ink title
- selected program / hovered (previewed) elective: blue title, prefixed `[✓]` (program) or followed by `←` (preview)
- already in plan: italic, muted title, meta says `✓ w planie` + `[Usuń]`
- would clash: meta shows `⚠️ kolizja czasu` on a signal chip (ink text) before `[+ Dodaj]`

**Large serif option** (section A/B/C) — serif index-title buttons in a row, gap 40px. Selected: ink, underline 3px, offset 8px. Others: `--inactive`.

**Message** (`.messages`, `.msg`) — full-width rows separated by 1px ink rules, no left border, no radius. Label column 200px (600), sentence after.
- blocking exam clash: signal fill, `⚠️ Kolizja egzaminów — blokuje`
- class clash / same day: paper, bold label `Kolizja zajęć` / `Ten sam dzień`
- all clear: paper, `✓ Brak kolizji w planie.`

**Timetable** (`.timetable`, `.tt-*`) — grid `56px repeat(5, 1fr)`; day names in serif 28px with a 1px ink rule under; columns divided by 1px ink; hour lines `--grid-line` every 90 min; lunch band `--lunch`; hours 11px muted. Scale 1px/min, 08:00–21:30 (the data has classes until 21:30).

**Timetable block** (`.tt-block`) — square, padding 6px 8px, no border. Title block-title serif, meta 11px sans `A · 11:00–14:00 · B002` (add `S1` for semester courses).
- mandatory: ink fill, white text
- elective: blue fill, white text
- clash: signal fill, ink text, extra line `⚠️ Kolizja` (600)
- preview: paper fill, 1px dashed blue border, blue text, meta ends `· podgląd`
- overlapping blocks split the column into lanes (existing `assignLanes`), title 17px.

**Legend** — 10px squares (ink, blue, signal, 8px dashed-blue outline) + label, 12px, gap 16px.

**ECTS panel** (`.ects-total`, `.ects-grid`) — ects-number + "ECTS / w semestrze" (12px) on a baseline, rule under; `<dl>` rows label left, bracket blue value right: `Kursy T1 [21.0]`, `Kursy T2 [0.0]`, `S1 (cały semestr) [7.0]`, `Obciążenie T1 / T2 [24.5 / 3.5]`; muted footnote.

**Plan list** (`.plan-list`) — rows split by 1px ink rules. 10px square (ink/blue) · title + muted `A · T1 · 3.5 ECTS` on line two · right: `[Obowiązkowy]` (ink) or `[Usuń]` (blue). Clashing row: signal fill, ink text, `⚠️ kolizja` in meta.

**Exam table** (`.exam-table`) — columns Data (280px, exam-date serif) · Godzina (90px, 12px) · Kurs (exam-course serif + 12px section/kind) · Status (220px). Header 12px/500 with ink rule. Rows split by ink rules. Blocking clash rows: signal fill, status `⚠️ kolizja — blokuje`. Same-day rows: status `[ ten sam dzień ]` (600); repeated date shown in `--inactive`. Footnote for courses without a date.

**Footer corners** (start and exams screens) — corner serif left and right, centred 12px summary or primary button, rule above.

## 6. Screens

### 0 · Style (`0-styl.png`)
Reference board: five colour blocks with hex and contrast, type specimens, the rules above.

### 1 · Start — program and section (`1-start.png`, `ProgramPicker.tsx`)
- Header with `[✓] Program`, ECTS `[ 0.0 ]`.
- Toolbar: `Krok 1 / 2` + muted "Wybierz program i sekcję. Razem ustalają twoje kursy obowiązkowe."
- Selected program row: meta (`Program [BA]`, `Sekcje [A] [B] [C]`, `Obowiązkowe [3 w T1]`) + blue title `[✓] Business Analytics`.
- Section row: label + hint, then serif `A  B  C` options.
- Remaining programs as full-width serif rows `[ ] Economics`, `[ ] Finance`, … separated by rules.
- Footer: `2026/27` · primary `[ Pokaż mój plan → ]` (disabled until program and section are chosen) · `T1·T2`.

### 2 · Plan — week and ECTS (`2-plan.png`, `PlanScreen.tsx`, `Timetable.tsx`, `PlanSummary.tsx`, `Messages.tsx`)
- Header with `[✓] Plan`, ECTS `[ 28.0 ]`.
- Toolbar: `Business Analytics · Sekcja A` · `[ Zmień ]` · `[✓] T1 [ ] T2` · legend.
- Messages stack (blocking first).
- Two columns: timetable (flex 999, min 760px) | aside 360px with left rule: ECTS panel, "Twoje kursy" list (mandatory first), full-width `[ + Dodaj electivy → ]`.

### 3 · Add electives (`3-electivy.png`, `ElectivePicker.tsx`)
- Header with `[✓] Electivy`.
- Toolbar: tabs `[✓] Twój program` `[ ] Inne mastery` | terms `[ ] Wszystkie [✓] T1 [ ] T2 [✓] S1` | checkbox `Ukryj kolidujące` | search ("Szukaj" + underline input, placeholder "tytuł lub kod").
- Index of electives: meta `Kod / Termin / Zajęcia / Egzamin / Plan` + huge serif title. Order: addable first, clashing next, already-in-plan last (italic muted). Hover/focus on a row = preview on the timetable (blue title + `←`).
- Out-of-program tab adds the muted note that rules are not confirmed yet.

### 4 · Exams (`4-egzaminy.png`, `ExamPanel.tsx`)
- Header with `[✓] Egzaminy`.
- Toolbar: "Egzaminy w twoim planie · chronologicznie" + muted note "Godziny to sloty startowe; zakładamy, że egzamin trwa maksymalnie 1,5 godziny."
- Exam table as above, horizontally scrollable under 720px.
- Footer: `2026` · `[ 7 egzaminów · 1 kolizja ]` · `T1·S1`.

Podsumowanie (step 5, `SummaryView.tsx`): toolbar, monospace text in a 1px ink box, primary `[ Kopiuj do schowka ]`.

Not designed yet: phone layouts beyond the wrapping rules, empty states (use muted 12px sentence in the list area, e.g. "Żaden kurs nie pasuje do filtrów.").

## 7. Implementation checklist

1. Add the font `<link>` to `index.html`; replace `:root` in `src/index.css` (section 1–2).
2. Set `--radius: 0`, drop `box-shadow`, `.card` backgrounds/borders → rules.
3. Restyle controls into bracket toggles (`.segmented`, `.chip`, `.tabs`, `.choice`).
4. Rewrite `.msg`, `.tt-block.*`, `.exam-table tr.*`, `.plan-list li.clash` to the signal/ink/blue scheme.
5. Add the step nav to `App.tsx`, serif index rows to `ProgramPicker` and `ElectivePicker`, footer corners.
6. Translate UI copy to Polish (or keep English — decide before step 5).
7. Check: text contrast as in section 1, focus ring visible on every control, clashes readable without colour.

## 8. Deviations from the mockups (implementation notes)

- **Fonts** are self-hosted (Fontsource) instead of the Google Fonts link, for privacy.
- **Exam length** is 1.5 h (was 3 h in the mockup copy). Clash rules in `docs/SPEC.md` FR-7.
- **Elective titles wrap** instead of clipping, sized to the list width (`clamp(32px, 7cqi, 88px)`), because users need the full course name. Program names on the start screen still clip as designed.
- **Preview on the electives screen**: a sticky timetable on the right (hidden below 1200px). Hovering or focusing a row shows the course there as a dashed-blue preview block; the row title turns blue with `←`.
- **Section label** is the letter only (`A`), taken from `TXA`.
- **Steps are views**, routed by URL hash (`#/plan`, `#/electives`, `#/exams`, `#/summary`), so the browser back button works. `[✓]` marks the current step and the ones before it.
- **Area of Expertise** filter (not in the mockups) sits in the electives toolbar as `Obszar [select]` plus `Tylko ten obszar`; the matching type shows in the row meta (`Obszar [Rekomendowany]`).
- **Non-blocking assessment overlaps** (midterm/presentation) show status `⚠️ nakłada się (nie blokuje)` without the signal fill; only blocking exam clashes are filled.
- **Phones**: the step nav scrolls horizontally in one line under the brand; message labels sit above the sentence; narrow timetable lanes use a 14px title.
