import { findClassClashes } from './clashes'
import { ectsSummary } from './ects'
import { findExamClashes, sortedAssessments } from './exams'
import { assessmentTime, formatDate, formatEcts, KIND_LABEL, meetingLabel, offeringLabel } from './format'
import { mandatoryOfferings } from './schedule'
import { planOfferings, type Selection } from './selection'
import type { Offering, Schedule } from './types'

/** Plain-text summary of the plan, meant to be copied (e.g. into notes or an e-mail). */
export function buildPlanSummary(schedule: Schedule, selection: Selection): string {
  const plan = planOfferings(selection, schedule)
  const mandatoryIds = new Set(mandatoryOfferings(schedule, selection.programId, selection.section).map((o) => o.id))
  const mandatory = sortCourses(plan.filter((o) => mandatoryIds.has(o.id)))
  const electives = sortCourses(plan.filter((o) => !mandatoryIds.has(o.id)))
  const program = schedule.programs.find((p) => p.id === selection.programId)?.name ?? selection.programId
  const aoe = schedule.areasOfExpertise.find((a) => a.program === selection.programId && a.id === selection.aoe)
  const e = ectsSummary(plan)
  const name = (id: string) => {
    const o = schedule.offeringsById.get(id)
    return o ? offeringLabel(o) : id
  }

  const lines: string[] = [
    `My plan: ${program}, section ${selection.section}`,
    'Nova SBE MSc, Fall 2026/27',
    ...(aoe ? [`Area of Expertise: ${aoe.name}`] : []),
    '',
    `ELECTIVES (${electives.length})`,
    ...(electives.length ? electives.flatMap(courseLines) : ['- none yet']),
    '',
    `MANDATORY COURSES (${mandatory.length})`,
    ...(mandatory.length ? mandatory.flatMap(courseLines) : ['- none']),
    '',
    `ECTS: ${formatEcts(e.semester)} this semester (T1 courses ${formatEcts(e.t1)}, T2 courses ${formatEcts(e.t2)}, S1 courses ${formatEcts(e.s1)})`,
  ]
  if (plan.some((o) => o.ectsInferred)) lines.push('* ECTS assumed from term length (S1 = 7, T1/T2 = 3.5).')

  const classClashes = findClassClashes(plan)
  const examClashes = findExamClashes(plan)
  lines.push('', 'CLASHES')
  if (classClashes.length === 0 && examClashes.length === 0) lines.push('- none')
  for (const c of examClashes.filter((x) => x.severity === 'error')) {
    lines.push(`- Exam clash (blocking): ${name(c.a.offeringId)} and ${name(c.b.offeringId)}, ${formatDate(c.a.date)} ${assessmentTime(c.a)}`)
  }
  for (const c of classClashes) {
    lines.push(`- Class clash: ${name(c.a.offeringId)} ${meetingLabel(c.a)} overlaps ${name(c.b.offeringId)} ${meetingLabel(c.b)}`)
  }
  for (const c of examClashes.filter((x) => x.severity === 'warning')) {
    lines.push(
      `- Assessment overlap: ${KIND_LABEL[c.a.kind]} of ${name(c.a.offeringId)} and ${KIND_LABEL[c.b.kind].toLowerCase()} of ${name(c.b.offeringId)}, ${formatDate(c.a.date)}`,
    )
  }

  const exams = sortedAssessments(plan)
  lines.push('', 'EXAM DATES')
  if (exams.length === 0) lines.push('- none')
  for (const a of exams) {
    const o = schedule.offeringsById.get(a.offeringId)!
    lines.push(`- ${formatDate(a.date)}, ${assessmentTime(a)}: ${o.title} (${KIND_LABEL[a.kind].toLowerCase()})`)
  }
  return lines.join('\n')
}

function courseLines(o: Offering): string[] {
  const ects = `${formatEcts(o.ects)}${o.ectsInferred ? '*' : ''} ECTS`
  return [
    `- ${o.title} [${o.courseCode}], section ${o.section}, ${o.termType}, ${ects}`,
    `  Classes: ${o.meetings.map((m) => `${meetingLabel(m)}${m.room ? ` (${m.room})` : ''}`).join('; ') || 'none listed'}`,
  ]
}

const TERM_ORDER = { T1: 0, S1: 1, T2: 2 }

function sortCourses(list: Offering[]): Offering[] {
  return [...list].sort((a, b) => TERM_ORDER[a.termType] - TERM_ORDER[b.termType] || a.title.localeCompare(b.title))
}
