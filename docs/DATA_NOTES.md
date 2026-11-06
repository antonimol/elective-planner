# Data notes: Nova SBE MSc Fall 2026/27 schedule database

Source: `MSc_Fall_202627_Schedules.pdf` (Excel export, 14 Jul 2026). Terms in data: T1, T2.

## Counts
- 6 programs, 121 courses, 243 offerings (T1 77, T2 95, S1 71), 302 meetings (175 x 90 min, 127 x 180 min), 283 offering-professor links.
- 429 grid blocks (90-minute cells) extracted; equals the number of T1/T2/S1 course markers in the PDF text. 0 parse problems.
- Offering-program rows: 128 mandatory, 68 elective, 76 shared_3plus (grey), 1 other_not_in_legend.
- Mandatory offerings per program: BA 18 (TXA-TXC), ECON 3 (TXA), FIN 24 (TXA-TXH), IDPP 18 (TXA-TXB), IEI 12 (TXA-TXB), MGMT 53 (TXA-TXJ).
- Elective offerings open to at least one program: 116 (85 course codes).

## Method
Blocks located with PDF geometry (rectangles, bitmaps, word boxes). Time bands come from the thin horizontal separator lines and the rotated side labels, not from page numbers; bands continue across pages. Day column = 5 columns; left half = T1, right half = T2; S1 spans both. Colours are mapped to programs via the legend. Consecutive bands of one class are merged into a single meeting.

## Assumptions
1. Elective eligibility comes from the elective lists, not from colours (grey = shared is no longer used).
2. Gradient blocks are electives shared between the two programs whose colours form the gradient.
3. S1 = whole semester, so it counts in both T1 and T2.
4. Alternatives for a course = other offerings with the same course code (other section or term). Only 25 of 85 elective course codes have one.

## Anomalies
- 3 S1 offerings are shaded only in the T1 half in one band (flag `s1_fill_only_in_T1_half_in_some_band`).
- 1 block has no fill in one band (`no_fill_in_some_band`); colour taken from its other band.
- 1 offering uses a colour not in the legend (`other_not_in_legend`).
- 55 offerings have a `#B` suffix on a lecturer name (`prof_marked_#B`); meaning unknown.
- Management TXB and TXC have 6 clashing mandatory pairs, probably specialisation tracks.
- Embedded file name says "Spring" although the title says Fall.

## Exams
Source: `MSc_Exams_and_midterms_calendar_Fall_202627_V20260715.pdf`. Table `exams` (120 exams, 12 midterms, 5 presentations, 5 CEMS, 18 no-exam). Final exam copied to `offerings.exam_date/exam_start` for 230 of 243 offerings; 13 have none (no exam or not listed). Only start times are given; end time unknown. 14 exam rows refer to courses absent from the timetable (CEMS courses, internships), kept but unused. Course 9696 Stata has no exam row.

## Elective lists (folder `bidding`, last update 22/06/2026)
21 PDFs: one per program (BA, ECON, FIN, MGMT, IEI, IDPP) and one per Area of Expertise (ECON 5, FIN 2, MGMT 8). 1,515 rows parsed, 1,496 unique after merging; 0 unparsed. Types: ELECTIVE 723, OUT_PROGRAM 399, DIRECTIVE_ELECTIVE 341, CORE 29, CORE_OPTIONAL 16, EXCLUSIVE_ELECTIVE 6, EXCLUSIVE_CORE 1. Periods S1, S2, T1-T4 (Fall data uses S1, T1, T2). ECTS: S1 = 7, T = 3.5 consistently where given. Faculty IDs and names were not imported (personal data, already present from the timetable).

Cross-check with the timetable colours: electives by colour and by list disagree for a number of courses (for example Investments is on the Economics, Management and Impact lists but not coloured as their elective). The lists are treated as authoritative for electives; colours only for mandatory courses. IDPP's list appears incomplete for some courses (for example Development Economics S1 is coloured elective but absent from the IDPP list).

Fall timetable offerings not on any elective list are mostly mandatory courses (for example Econometrics, Corporate Finance), as expected.

## Missing
ECTS of 120 mostly mandatory offerings: assumed S1 = 7, T = 3.5 (`ects_source = inferred_from_term`). Confirm in `fill_in_ects.csv`.

## Privacy
`offering_professors` holds lecturer names (personal data). Keep it out of public repositories.
