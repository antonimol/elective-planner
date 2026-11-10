# Elective Planner

Web tool for Nova SBE MSc students: pick a program and section, see the timetable (T1/T2 toggle), add electives, track ECTS, and get warnings about class and exam clashes. Full requirements: `docs/SPEC.md`. Data notes and quality caveats: `docs/DATA_NOTES.md`.

## Stack
React 19 + TypeScript + Vite, static app, data from `data/schedule.public.json`, selection in `localStorage`. Tests with Vitest (`src/**/*.test.ts`), lint with oxlint. CI: `.github/workflows/ci.yml` runs lint, test and build on push and PRs. Node 24+ (see `.nvmrc`). Deploy: GitHub Pages via `.github/workflows/deploy.yml` on every push to `main` (Vite `base: './'`).

## Rules
- Domain logic (clash detection, ECTS, exam clashes) lives in `src/lib/` as pure functions with unit tests. UI imports from there.
- Class clash: same day, overlapping time, intersecting term spans. `T1+T2` (type S1) intersects both terms.
- Exam clash: same date and overlapping time, each assessment treated as 1.5 h (max length) from its start slot (08:30, 11:30, 14:30, 17:30). Same date without overlap = "ten sam dzień" info. Two final exams clashing is a blocking error; overlaps involving midterms/presentations, or same date with unknown time, are warnings.
- Mandatory courses come from `offering_programs` (status `mandatory`); electives come from `program_courses`, NOT from colours.
- Never commit lecturer names. `data/private/` is git-ignored; `schedule.public.json` has empty `professors`.
- Code, docs and UI copy in English. Talk to the user in Polish.
- Visual design: `docs/DESIGN.md` ("Raw Index" v2: white cards with 1px ink borders, blue #002FA7, signal #FF5A1F for clashes only, serif Cormorant Garamond only for titles/big numbers ≥20px, Hanken Grotesk for everything else, no radius/shadows). Screens and HTML mockups in `docs/design/`.
- Keep `docs/SPEC.md` in sync with any behaviour change. Update the open questions list when one is answered.

## Code map
- `src/lib/`: pure domain logic with tests (`schedule.ts` data + eligibility, `clashes.ts`, `exams.ts`, `ects.ts`, `selection.ts` incl. localStorage, `layout.ts` timetable lanes, `summary.ts` copyable plan text, `format.ts` display formatting, `tips.ts` first-visit tips persistence).
- `src/components/`: React UI. `ProgramPicker` (screen 1), `PlanScreen` (screen 2: `Messages`, `Timetable`, `ExamPanel`, `PlanSummary`, `ElectivePicker`, `SummaryDialog`), `FirstVisitTips`. `src/data.ts` loads and normalises the JSON once.

## Commands
`npm install`, `npm run dev`, `npm test` (`npm run test:watch` for watch mode), `npm run lint`, `npm run build`.

## Data
`data/*.csv` and `data/schema.sql` describe the model (SQLite DDL). Rebuilding data from the source PDFs is not automated in this repo yet.
