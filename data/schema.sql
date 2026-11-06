PRAGMA foreign_keys = ON;
CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT);
CREATE TABLE programs (program_id TEXT PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE courses (course_code TEXT PRIMARY KEY, title TEXT NOT NULL, ects REAL);          -- ects: not in the PDF, to be filled
CREATE TABLE offerings (
  offering_id TEXT PRIMARY KEY,                       -- <term_type>-<course_code>-<section>, e.g. T1-2389-TXA
  course_code TEXT NOT NULL REFERENCES courses(course_code),
  section TEXT NOT NULL,                              -- TXA, TXB, ... (letters are per program for mandatory courses)
  term_type TEXT NOT NULL CHECK (term_type IN ('T1','T2','S1')),   -- S1 = runs in both terms of the semester
  exam_date TEXT, exam_start TEXT, exam_end TEXT,     -- final exam from the exams calendar PDF (start time only; exam_end unknown)
  flags TEXT,                                         -- data-quality flags, '|' separated
  ects REAL, ects_source TEXT                         -- electives_pdf | inferred_from_term (S1=7, T=3.5; to confirm)
);
CREATE TABLE offering_programs (                      -- colour legend of the PDF
  offering_id TEXT NOT NULL REFERENCES offerings(offering_id),
  program_id TEXT NOT NULL,                           -- a programs.program_id, or '*' for shared / other
  status TEXT NOT NULL CHECK (status IN ('mandatory','elective','shared_3plus','other_not_in_legend')),
  PRIMARY KEY (offering_id, program_id, status)
);
CREATE TABLE meetings (                               -- one weekly class session (consecutive 90-min bands are merged)
  meeting_id TEXT PRIMARY KEY,
  offering_id TEXT NOT NULL REFERENCES offerings(offering_id),
  day TEXT NOT NULL CHECK (day IN ('Mon','Tue','Wed','Thu','Fri')),
  start TEXT NOT NULL, end TEXT NOT NULL,             -- HH:MM
  duration_min INTEGER NOT NULL,
  room TEXT,
  term_span TEXT NOT NULL CHECK (term_span IN ('T1','T2','T1+T2'))
);
CREATE TABLE offering_professors (                    -- personal data: keep out of public repos (see SPEC.md, Data & privacy)
  offering_id TEXT NOT NULL REFERENCES offerings(offering_id),
  professor TEXT NOT NULL,
  marker_B INTEGER NOT NULL DEFAULT 0,                -- '#B' suffix in the PDF, meaning unknown
  PRIMARY KEY (offering_id, professor)
);
CREATE TABLE exams (                                  -- from MSc_Exams_and_midterms_calendar PDF (per course+term, not per section)
  exam_id INTEGER PRIMARY KEY, course_code TEXT NOT NULL, term_type TEXT NOT NULL,
  kind TEXT NOT NULL,                                 -- exam | midterm | presentation | cems_exam | cems_presentation | no_exam
  date TEXT, start TEXT, note TEXT);
CREATE INDEX idx_meetings_offering ON meetings(offering_id);
CREATE INDEX idx_meetings_day ON meetings(day, start);
CREATE INDEX idx_offerings_course ON offerings(course_code);

CREATE VIEW v_meetings AS
  SELECT m.meeting_id, o.offering_id, o.course_code, c.title, o.section, o.term_type, m.day, m.start, m.end,
         m.duration_min, m.room, m.term_span
  FROM meetings m JOIN offerings o USING (offering_id) JOIN courses c USING (course_code);



-- Added from the electives lists (folder 'bidding', last update 22/06/2026)
CREATE TABLE areas_of_expertise (program_id TEXT NOT NULL, aoe_id TEXT NOT NULL, name TEXT NOT NULL, PRIMARY KEY(program_id,aoe_id));
CREATE TABLE catalog (course_code TEXT NOT NULL, period TEXT NOT NULL, title TEXT NOT NULL, ects REAL, ects_source TEXT, PRIMARY KEY(course_code,period));  -- all periods S1,S2,T1..T4,A
CREATE TABLE program_courses (                        -- elective lists per program; aoe_id '' = program level, else Area of Expertise list
  program_id TEXT NOT NULL, aoe_id TEXT NOT NULL DEFAULT '', course_code TEXT NOT NULL, period TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('ELECTIVE','DIRECTIVE_ELECTIVE','CORE','CORE_OPTIONAL','EXCLUSIVE_CORE','EXCLUSIVE_ELECTIVE','OUT_PROGRAM')),
  PRIMARY KEY(program_id,aoe_id,course_code,period));
CREATE VIEW v_eligibility AS   -- mandatory from colour legend; electives from the lists (supersedes the colour-based elective/grey classification)
  SELECT offering_id, program_id, 'mandatory' AS role, '' AS aoe_id FROM offering_programs WHERE status='mandatory'
  UNION
  SELECT o.offering_id, pc.program_id, CASE pc.type WHEN 'OUT_PROGRAM' THEN 'out_of_program' ELSE 'elective' END, pc.aoe_id
  FROM program_courses pc JOIN offerings o ON o.course_code=pc.course_code AND o.term_type=pc.period;
