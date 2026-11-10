# Elective Planner: Specification (v0.1)

Web tool that lets Nova SBE MSc students see their timetable while choosing elective courses, and warns them about clashes.

Status: draft based on the Fall 2026/27 schedule PDF and the project description. Items marked **OPEN** need an answer before or during implementation (see section 9).

## 1. Problem and goal

Electives are currently chosen through a bidding system that does not show the timetable. Students can therefore pick courses that overlap in time (or have exams on the same day) without noticing.

Goal: show the student's weekly timetable (mandatory courses plus chosen electives), count ECTS, list exam dates, and flag every clash. A later version will also suggest an alternative offering of a course when a clash occurs.

## 2. Users

- Primary: MSc students at Nova SBE.
- Out of scope for the MVP: administrators, bidding itself, accounts.

## 3. Scope

| | MVP (v1) | Later |
|---|---|---|
| Terms | T1 and T2 of the Fall semester | T3 and T4 (next release) |
| Timetable and clash detection | yes | |
| Exam date list and exam clash error | yes | |
| ECTS counter | yes | |
| Alternative-offering suggestion | no | v1.1 (algorithm to be developed) |
| Accounts, saving selections on a server | no (selection kept in the browser) | v2 |
| Admin data upload | no | v2 |

## 4. User flow

The UI is in English and follows `docs/DESIGN.md` ("Raw Index" v2). Screen 2 is a single plan screen; the copyable summary opens in a dialog.

1. **Screen 1, "Who are you?"** The student picks a **program** (kierunek) and then a **section**. Sections (TXA, TXB, ...) exist because a program has many students, so each program is split into parallel groups with the same courses at different times. Both choices are on this first screen and together determine the mandatory courses. Sections per program: Business Analytics A-C, Economics A, Finance A-H, Management A-J, IDPP A-B, Impact Entrepreneurship and Innovation A-B.
2. **Screen 2, "My plan".**
   - Weekly timetable (Mon-Fri) with a **T1 / T2 toggle**. Courses that run the whole semester (type S1) appear in both views.
   - Mandatory courses are already placed.
   - An **elective picker** (list with search and filters) to add or remove electives. The list for the chosen program comes from the official elective lists (type ELECTIVE and similar). An optional **Area of Expertise** filter (Management, Finance, Economics) highlights the courses recommended for that area. A chosen elective appears on the timetable immediately.
   - An **ECTS counter** (mandatory plus chosen electives).
   - A panel with **exam dates** of all courses on the plan.
   - Clashes are highlighted on the timetable and listed in a message area.
   - A **Copy summary** button opens a plain-text version of the plan to paste elsewhere.
   - On the first visit, three short tips (timetable, your courses, add electives) explain the screen; they can be skipped or closed and replayed from the footer.

## 5. Functional requirements

| ID | Requirement |
|---|---|
| FR-1 | The student selects a program, then a section. Sections are listed per program (section letters are specific to a program). |
| FR-2 | The mandatory offerings for the chosen program and section are loaded and shown on the timetable. |
| FR-3 | The student can add and remove electives. Electives offered to the program are listed with course code, title, term, ECTS, meeting times. Courses of type OUT_PROGRAM (from other masters) are shown separately. A course with several sections (TXA, TXB, ...) lets the student pick the section; picking another section of the same course (same term) replaces the previous one. Each section shows whether it would cause a time or exam clash, and hovering it previews it on the timetable. A "Hide clashing" filter hides courses whose every section clashes. Courses mandatory for the student's program and section are not listed. |
| FR-4 | Timetable per term. A meeting with term span `T1` shows only in T1, `T2` only in T2, `T1+T2` (type S1) in both. |
| FR-5 | The ECTS counter shows the semester total and the ECTS of T1, T2 and S1 courses separately, plus the load per term (term courses plus half of each S1 course). S1 courses count 7 ECTS, T1/T2 courses 3.5. ECTS inferred from the term length are marked with `*`. The required minimum or maximum is **OPEN**. |
| FR-6 | **Class clash:** two meetings clash if they are on the same day, their time ranges overlap, and their term spans intersect. A clash is shown on the timetable and in the message area. |
| FR-7 | **Exam clash (error):** two final exams (kind `exam`) of different courses on the plan with the same date and overlapping times are a blocking error. Each assessment is treated as 1.5 h (maximum length) from its start slot; an explicit range (`09:00-12:00`) is used as given; per-section times in the note (`TXB - 11:00 & TXA - 15:30`) are resolved for the offering's section. Overlaps that involve a midterm or presentation, and two assessments on the same date where a time is unknown, are **warnings** (see open question 11). Exam dates come from the exams calendar. |
| FR-8 | An exam panel lists exam date and time per course on the plan, sorted by date. Assessments of different courses on the same date that do not overlap are marked "ten sam dzień" (information, not an error). A Status column shows `⚠️ Clash` (blocking), `Overlap` (non-blocking) or `Same day`. |
| FR-9 | (Later) On a clash, look for another offering of the same course that does not clash and suggest it. |
| FR-10 | The selection is stored locally in the browser and survives a page reload. |
| FR-11 | "Copy summary" opens a dialog with a plain-text summary of the plan (program, section, electives and mandatory courses with code, section, term, ECTS and class times; ECTS totals; clashes; exam dates sorted by date) with a button that copies it to the clipboard. |
| FR-12 | **First-visit tips:** the first time the plan screen opens, a banner and three tips in turn (timetable, ECTS / your courses, add electives) explain the screen. Next / Back / Done, "Skip tips" and Esc close them; the choice is stored in `localStorage` (`elective-planner.tipsSeen`), falling back to once per session if storage is unavailable. A "Show tips" link in the footer replays them. |

Clash rule as SQL (works on the schema in `schema.sql`):

```sql
SELECT a.offering_id, b.offering_id, a.day, a.start, a.end, b.start, b.end
FROM meetings a JOIN meetings b
  ON a.day = b.day AND a.start < b.end AND b.start < a.end AND a.meeting_id < b.meeting_id
 AND (a.term_span = 'T1+T2' OR b.term_span = 'T1+T2' OR a.term_span = b.term_span);
```

Time bands in the data: 08:00-09:30, 09:30-11:00, 11:00-12:30, 12:30-14:00, 15:30-17:00, 17:00-18:30, 18:30-20:00, 20:00-21:30. There are no classes between 14:00 and 15:30.

## 6. Data model

Source of truth: `schedule.sqlite` (also exported as CSV files and as `schedule.json` for the web app). Full DDL in `schema.sql`.

| Table | Meaning | Rows |
|---|---|---|
| `programs` | The 6 master programs | 6 |
| `courses` | Course code and title, ECTS | 121 |
| `offerings` | One course given in one term and one section, e.g. `T1-2389-TXA`; `ects` with `ects_source` (123 from the electives lists, 120 inferred from the term: S1 = 7, T = 3.5). `term_type` is `T1`, `T2` or `S1` (S1 = whole semester). `exam_date`/`exam_start` filled from the exams calendar for 230 of 243 offerings (the rest have no exam) | 243 (T1 77, T2 95, S1 71) |
| `offering_programs` | Mandatory offerings per program, decoded from the colour legend (its elective rows are superseded by `program_courses`) | 273 |
| `program_courses` | Official elective lists: per program, and per Area of Expertise (`aoe_id`), with course type (ELECTIVE, DIRECTIVE_ELECTIVE, CORE, CORE_OPTIONAL, EXCLUSIVE_CORE, EXCLUSIVE_ELECTIVE, OUT_PROGRAM), all periods S1, S2, T1-T4 | 1496 |
| `areas_of_expertise` | Areas of Expertise: Economics 5, Finance 2, Management 8 (incl. Luxury Management stream) | 15 |
| `catalog` | Course title and ECTS for every course and period in the lists (spring and T3/T4 included, ready for the next version) | 269 |
| `meetings` | One weekly class session: day, start, end, room, term span. Consecutive 90-minute bands of the same class are merged | 302 (90 min: 175, 180 min: 127) |
| `offering_professors` | Lecturer names (personal data, see section 10) | 283 |
| `exams` | Exams, midterms and presentations per course and term (160 rows incl. 18 "no exam") | 160 |
| `v_meetings`, `v_eligibility` | Views for the app | |

How the PDF was interpreted:

- Each block in the grid is one class in one 90-minute band. A 3-hour class appears in two consecutive bands and is merged into one meeting. Bands continue across PDF pages, so they were identified by the separator lines and labels, not by page numbers.
- Within a day column, the left half is T1 and the right half is T2. A course label starts with `T1`, `T2` or `S1`; S1 blocks span both halves.
- Colours follow the legend on the last page: dark colour = mandatory for that program, light colour = elective for that program, a two-colour gradient = elective shared by two programs, grey = shared by more than two masters. The exact mapping is in `DATA_NOTES.md`.
- Mandatory sections per program: Finance TXA-TXH, Management TXA-TXJ, Business Analytics TXA-TXC, Int. Development and Public Policy TXA-TXB, Impact Entrepreneurship and Innovation TXA-TXB, Economics TXA.

Electives: eligibility now comes from the official lists in `program_courses` (`v_eligibility` view), not from the colours. Colours are used only for mandatory courses. The two sources disagree for some courses (the lists are authoritative; the colour legend did not mark, for example, Investments as an elective for Economics, Management and Impact). Only a minority of course codes have a second offering (another section or the other term), which limits what the alternative-suggestion algorithm in FR-9 can do.

Areas of Expertise: course types in the Area lists mean CORE (required for the area), CORE_OPTIONAL (choose among), DIRECTIVE_ELECTIVE (recommended elective). The Area lists are a separate layer from the sections.

## 7. Source data and quality checks

- Source: `MSc_Fall_202627_Schedules.pdf` (Excel export dated 14 Jul 2026; the embedded file name in the footer says "Spring", which looks like a leftover in the title and should be confirmed).
- All 429 class blocks were found: the count equals the number of course markers in the PDF text.
- Every block was parsed with a section, a room and a lecturer (0 parse problems).
- Spot checks against the rendered pages matched (for example Customer Relationship Management TXA on Monday 08:00-11:00).
- Sanity test: mandatory offerings of the same program and section should not clash. This holds everywhere except Management sections TXB and TXC (6 overlapping pairs). See OPEN question 3.

Known quirks (flagged in `offerings.flags`):

- 3 offerings labelled S1 are drawn only in the T1 half in one of their two bands (Strategy Consulting TXA, Investments TXG, Corporate Strategy and Transformation TXA). They are treated as S1 (both terms).
- 1 block (Politics for Policy TXB) has no colour in its second band; the colour was taken from its first band.
- 55 offerings carry a `#B` mark after a lecturer name in the PDF (`marker_B = 1`). Meaning unknown.

## 8. Technical approach (proposal)

- Static-first web app: React + TypeScript + Vite, data loaded from `data/schedule.public.json`, selection in `localStorage`. No server needed for the MVP, so hosting is free and no personal data of students is collected.
- Clash and ECTS logic in a plain TypeScript module with unit tests (clash rule, S1 handling, exam clash).
- Deployment to GitHub Pages, automatic deploy from the main branch (`.github/workflows/deploy.yml`).
- v2 (accounts, saved selections, admin upload) needs a backend and database, for example Supabase.

## 9. Open questions and missing inputs

Resolved since v0.1: exam dates (loaded), ECTS of electives (loaded), elective eligibility per program (loaded from the lists), meaning of sections (parallel groups).

1. **ECTS of mandatory courses.** Not in the lists. 120 offerings use S1 = 7 and T = 3.5 as an assumption (`ects_source = inferred_from_term`). Confirm in `fill_in_ects.csv`.
2. **Exam dates.** Now loaded from the exams calendar PDF (v15 Jul 2026). Only the start time is given (slots 08:30, 11:30, 14:30, 17:30); exams last at most 1.5 h, so each is treated as 1.5 h from its start. Exams are per course and term, not per section (one exception: Financial Reporting midterm, TXB 11:00 and TXA 15:30).
3. **Management sections TXB and TXC.** Their mandatory offerings overlap (for example Advanced Financial Management and Human Resources Management are both Wednesday 11:00-12:30 in TXB). This is not explained by the Areas of Expertise lists, so it still needs a decision from the programme office (a real clash, a choice between courses, or colouring errors).
4. **ECTS rules.** Required minimum and maximum ECTS per term and semester, and the number of electives a student must take.
5. **Out-of-program electives.** Courses of type OUT_PROGRAM (152 offerings in the Fall terms across programs): can students take them, and how many ECTS at most?
6. **Economics.** Only 3 mandatory offerings are coloured Economics. Confirm this is complete.
7. **Areas of Expertise.** When must the student choose one, and is the choice binding for the elective list? The MVP treats it as an optional filter.
8. **Meaning of `#B`** after lecturer names.
9. **Definition of "second option".** For FR-9, is an alternative another section in the same term, the same course in the other term, or both?
10. **T3 and T4 timetable.** Their elective lists and ECTS are loaded, but there are no meeting times yet.
11. **Midterm and presentation clashes.** The MVP treats only overlapping final exams as a blocking error; overlaps with midterms or presentations are warnings. Confirm whether midterm clashes should also block.

## 10. Data and privacy

The database contains lecturer names. They are personal data under GDPR even though the timetable is public, so:

- Keep `offering_professors` (CSV table and SQLite table) out of any public repository, or replace names with placeholders in the public sample data.
- Do not commit real data to a public repo: git history is permanent.
- The static MVP stores nothing about students on a server. Accounts (v2) would require a privacy notice, EU hosting and a data-processing agreement with the provider.
- If the app is run officially for the school, the school is the data controller. Ask the programme office for approval and an official data file.

## 11. Acceptance criteria (examples)

- Choosing Finance, section TXA shows 3 mandatory offerings (Investments, Corporate Finance, Financial Modeling) on the timetable in the correct slots.
- Adding two electives that overlap in the same term on the same day shows a clash on both blocks and in the message area. Adding an elective that overlaps only in the other term shows no clash.
- An S1 course appears in both the T1 and T2 views.
- Two courses with the same exam date and overlapping times produce a blocking error.
- Reloading the page keeps the selection.

## 12. Milestones

1. Spec and data (this document and the database).
2. Mockups of the three screens.
3. Repository set up (stack, `CLAUDE.md`, README skeleton).
4. Timetable view and elective picker.
5. Clash detection with tests, then ECTS counter and exam panel.
6. Deployment and README with screenshots.
7. v1.1: alternative suggestions.
