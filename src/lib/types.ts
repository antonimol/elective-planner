// Types for data/schedule.public.json (raw) and the normalised domain model.

export type TermType = 'T1' | 'T2' | 'S1'
export type TermSpan = 'T1' | 'T2' | 'T1+T2'
export type Term = 'T1' | 'T2'
export type Day = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri'

export type OfferingStatus = 'mandatory' | 'elective' | 'shared_3plus' | 'other_not_in_legend'

export type CourseType =
  | 'ELECTIVE'
  | 'DIRECTIVE_ELECTIVE'
  | 'CORE'
  | 'CORE_OPTIONAL'
  | 'EXCLUSIVE_CORE'
  | 'EXCLUSIVE_ELECTIVE'
  | 'OUT_PROGRAM'

export type AssessmentKind = 'exam' | 'midterm' | 'presentation' | 'no_exam'

// ---- Raw JSON ----

export interface RawMeeting {
  id: string
  day: Day
  start: string
  end: string
  room: string | null
  termSpan: TermSpan
}

export interface RawAssessment {
  kind: AssessmentKind
  date: string | null
  start: string | null
  note: string | null
}

export interface RawOffering {
  id: string
  courseCode: string
  title: string
  section: string
  termType: TermType
  ects: number
  exam: { date: string | null; start: string | null; end: string | null }
  professors: string[]
  programs: { program: string; status: OfferingStatus }[]
  meetings: RawMeeting[]
  flags: string[]
  exams: RawAssessment[]
  ectsSource: string
}

export interface Program {
  id: string
  name: string
}

export interface AreaOfExpertise {
  program: string
  id: string
  name: string
}

export interface ProgramCourse {
  program: string
  /** null = the program's own elective list; otherwise an Area of Expertise list. */
  aoe: string | null
  courseCode: string
  period: TermType
  type: CourseType
}

export interface RawSchedule {
  meta: Record<string, string>
  programs: Program[]
  areasOfExpertise: AreaOfExpertise[]
  sections: Record<string, string[]>
  programCourses: ProgramCourse[]
  offerings: RawOffering[]
}

// ---- Domain model ----

export interface Meeting {
  id: string
  offeringId: string
  day: Day
  /** Minutes since midnight. */
  start: number
  end: number
  room: string | null
  termSpan: TermSpan
}

export interface Assessment {
  offeringId: string
  kind: Exclude<AssessmentKind, 'no_exam'>
  /** ISO date, e.g. 2026-10-19. */
  date: string
  /** Minutes since midnight; null if the time is unknown or ambiguous. */
  start: number | null
  end: number | null
  /** Time as written in the source, for display. */
  timeLabel: string | null
}

export interface Offering {
  id: string
  courseCode: string
  title: string
  section: string
  termType: TermType
  ects: number
  ectsInferred: boolean
  programs: { program: string; status: OfferingStatus }[]
  meetings: Meeting[]
  assessments: Assessment[]
  /** True if the source lists the course as having no exam. */
  noExam: boolean
  flags: string[]
}

export interface Schedule {
  meta: Record<string, string>
  programs: Program[]
  areasOfExpertise: AreaOfExpertise[]
  sections: Record<string, string[]>
  programCourses: ProgramCourse[]
  offerings: Offering[]
  offeringsById: Map<string, Offering>
}
