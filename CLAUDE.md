# Elective Planner

Web tool for Nova SBE MSc students: pick a program and section, see the timetable (T1/T2 toggle), add electives, track ECTS, and get warnings about class and exam clashes. Full requirements: `docs/SPEC.md`. Data notes and quality caveats: `docs/DATA_NOTES.md`.

## Stack
React 19 + TypeScript + Vite, static app, data from `data/schedule.public.json`, selection in `localStorage`. Tests with Vitest (`src/**/*.test.ts`), lint with oxlint. CI: `.github/workflows/ci.yml` runs lint, test and build on push and PRs. Node 24+ (see `.nvmrc`). Deploy: Vercel/Netlify/GitHub Pages.

## Rules
- Domain logic (clash detection, ECTS, exam clashes) lives in `src/lib/` as pure functions with unit tests. UI imports from there.
- Class clash: same day, overlapping time, intersecting term spans. `T1+T2` (type S1) intersects both terms.
- Exam clash: same date and same start slot (08:30, 11:30, 14:30, 17:30), treated as 3 h. It is a blocking error.
- Mandatory courses come from `offering_programs` (status `mandatory`); electives come from `program_courses`, NOT from colours.
- Never commit lecturer names. `data/private/` is git-ignored; `schedule.public.json` has empty `professors`.
- Code and docs in English. Talk to the user in Polish.
- Keep `docs/SPEC.md` in sync with any behaviour change. Update the open questions list when one is answered.

## Commands
`npm install`, `npm run dev`, `npm test` (`npm run test:watch` for watch mode), `npm run lint`, `npm run build`.

## Data
`data/*.csv` and `data/schema.sql` describe the model (SQLite DDL). Rebuilding data from the source PDFs is not automated in this repo yet.
