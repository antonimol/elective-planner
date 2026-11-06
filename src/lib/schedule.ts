import { parseAssessment } from './exams'
import { toMinutes } from './time'
import type { CourseType, Offering, RawSchedule, Schedule, TermType } from './types'

export function normalizeSchedule(raw: RawSchedule): Schedule {
  const offerings: Offering[] = raw.offerings.map((o) => ({
    id: o.id,
    courseCode: o.courseCode,
    title: o.title,
    section: o.section,
    termType: o.termType,
    ects: o.ects,
    ectsInferred: o.ectsSource === 'inferred_from_term',
    programs: o.programs,
    flags: o.flags,
    meetings: o.meetings.map((m) => ({
      id: m.id,
      offeringId: o.id,
      day: m.day,
      start: toMinutes(m.start),
      end: toMinutes(m.end),
      room: m.room,
      termSpan: m.termSpan,
    })),
    assessments: o.exams
      .map((e) => parseAssessment(e, o.id, o.section))
      .filter((a): a is NonNullable<typeof a> => a !== null),
    noExam: o.exams.some((e) => e.kind === 'no_exam'),
  }))
  return {
    meta: raw.meta,
    programs: raw.programs,
    areasOfExpertise: raw.areasOfExpertise,
    sections: raw.sections,
    programCourses: raw.programCourses,
    offerings,
    offeringsById: new Map(offerings.map((o) => [o.id, o])),
  }
}

/** Mandatory offerings for a program and section (from offering_programs, status "mandatory"). */
export function mandatoryOfferings(schedule: Schedule, programId: string, section: string): Offering[] {
  return schedule.offerings.filter(
    (o) => o.section === section && o.programs.some((p) => p.program === programId && p.status === 'mandatory'),
  )
}

export interface ElectiveCourse {
  courseCode: string
  title: string
  period: TermType
  ects: number
  /** Type on the program's own list, or the Area of Expertise type if the course is only on an Area list. */
  type: CourseType
  /** Area of Expertise id -> course type on that Area's list. */
  aoeTypes: Record<string, CourseType>
  /** One offering per section. */
  offerings: Offering[]
}

export interface ElectiveCatalog {
  inProgram: ElectiveCourse[]
  outOfProgram: ElectiveCourse[]
  /** Courses on the lists that have no offering in the timetable. */
  unscheduledCount: number
}

/**
 * Electives open to a program, from the official lists (program_courses), not from colours.
 * Courses mandatory for the student's program and section are left out.
 */
export function electiveCatalog(schedule: Schedule, programId: string, section: string): ElectiveCatalog {
  const mandatoryCodes = new Set(mandatoryOfferings(schedule, programId, section).map((o) => o.courseCode))
  const byKey = new Map<string, ElectiveCourse>()
  let unscheduledCount = 0

  const entries = schedule.programCourses
    .filter((pc) => pc.program === programId)
    // Program-list rows first so they set the course type.
    .sort((a, b) => Number(a.aoe !== null) - Number(b.aoe !== null))

  for (const pc of entries) {
    if (mandatoryCodes.has(pc.courseCode)) continue
    const key = `${pc.courseCode}|${pc.period}`
    let course = byKey.get(key)
    if (!course) {
      const offerings = schedule.offerings
        .filter((o) => o.courseCode === pc.courseCode && o.termType === pc.period)
        .sort((a, b) => a.section.localeCompare(b.section))
      if (offerings.length === 0) {
        if (pc.aoe === null) unscheduledCount++
        continue
      }
      course = {
        courseCode: pc.courseCode,
        title: offerings[0].title,
        period: pc.period,
        ects: offerings[0].ects,
        type: pc.type,
        aoeTypes: {},
        offerings,
      }
      byKey.set(key, course)
    }
    if (pc.aoe !== null) course.aoeTypes[pc.aoe] = pc.type
  }

  const byTitle = (a: ElectiveCourse, b: ElectiveCourse) => a.title.localeCompare(b.title) || a.period.localeCompare(b.period)
  const all = [...byKey.values()].sort(byTitle)
  return {
    inProgram: all.filter((c) => c.type !== 'OUT_PROGRAM'),
    outOfProgram: all.filter((c) => c.type === 'OUT_PROGRAM'),
    unscheduledCount,
  }
}
