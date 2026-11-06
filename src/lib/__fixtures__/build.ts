import { normalizeSchedule } from '../schedule'
import type { Day, RawAssessment, RawOffering, RawSchedule, TermSpan, TermType } from '../types'

type MeetingSpec = [Day, string, string, TermSpan?]

export function rawOffering(
  id: string,
  opts: {
    code?: string
    section?: string
    term?: TermType
    meetings?: MeetingSpec[]
    exams?: RawAssessment[]
    programs?: RawOffering['programs']
    ects?: number
  } = {},
): RawOffering {
  const term = opts.term ?? 'T1'
  const span: TermSpan = term === 'S1' ? 'T1+T2' : term
  return {
    id,
    courseCode: opts.code ?? id,
    title: `Course ${opts.code ?? id}`,
    section: opts.section ?? 'TXA',
    termType: term,
    ects: opts.ects ?? (term === 'S1' ? 7 : 3.5),
    exam: { date: null, start: null, end: null },
    professors: [],
    programs: opts.programs ?? [],
    meetings: (opts.meetings ?? []).map(([day, start, end, s], i) => ({
      id: `${id}-M${i}`,
      day,
      start,
      end,
      room: null,
      termSpan: s ?? span,
    })),
    flags: [],
    exams: opts.exams ?? [],
    ectsSource: 'electives_pdf',
  }
}

export function exam(date: string, start: string | null, kind: RawAssessment['kind'] = 'exam', note: string | null = null): RawAssessment {
  return { kind, date, start, note }
}

export function buildSchedule(offerings: RawOffering[], extra: Partial<RawSchedule> = {}) {
  return normalizeSchedule({
    meta: {},
    programs: [{ id: 'FIN', name: 'Finance' }],
    areasOfExpertise: [],
    sections: { FIN: ['TXA', 'TXB'] },
    programCourses: [],
    offerings,
    ...extra,
  })
}
