# Elective Planner

Timetable-aware elective selection for Nova SBE MSc students. Shows mandatory and elective courses on a weekly calendar (T1/T2), counts ECTS, and flags class and exam clashes.

Status: MVP working locally (T1/T2, clash and exam checks, ECTS, saved selection). Not deployed yet. Spec: [docs/SPEC.md](docs/SPEC.md). Data notes: [docs/DATA_NOTES.md](docs/DATA_NOTES.md).

## Features (MVP)
- Choose program and section
- Weekly timetable with T1/T2 toggle
- Elective picker with ECTS counter
- Exam dates panel and exam clash error
- Class clash warnings

## Roadmap
T3/T4 terms, alternative-offering suggestions, saved selections.

## Data and privacy
The public data contains no lecturer names. Source schedules belong to Nova SBE.

## Development
Requires Node 24+.

```bash
npm install
npm run dev      # local dev server
npm test         # unit tests (Vitest)
npm run lint     # oxlint
npm run build    # type-check and production build
```

See `CLAUDE.md` for stack and project rules.

## License
TBD
