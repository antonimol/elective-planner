import { findClassClashes } from './clashes'
import { ectsSummary } from './ects'
import { findExamClashes, findSameDayAssessments, sortedAssessments } from './exams'
import { assessmentTime, formatDateLong, formatEcts, KIND_LABEL, meetingLabel, offeringLabel, sectionLetter } from './format'
import { mandatoryOfferings } from './schedule'
import { planOfferings, type Selection } from './selection'
import type { Offering, Schedule } from './types'

/** Plain-text summary of the plan (Polish), meant to be copied into notes or an e-mail. */
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
    `Mój plan: ${program}, sekcja ${sectionLetter(selection.section)}`,
    'Nova SBE MSc, semestr zimowy 2026/27',
    ...(aoe ? [`Obszar (Area of Expertise): ${aoe.name}`] : []),
    '',
    `ELECTIVY (${electives.length})`,
    ...(electives.length ? electives.flatMap(courseLines) : ['- brak']),
    '',
    `KURSY OBOWIĄZKOWE (${mandatory.length})`,
    ...(mandatory.length ? mandatory.flatMap(courseLines) : ['- brak']),
    '',
    `ECTS: ${formatEcts(e.semester)} w semestrze (kursy T1 ${formatEcts(e.t1)}, kursy T2 ${formatEcts(e.t2)}, S1 ${formatEcts(e.s1)})`,
  ]
  if (plan.some((o) => o.ectsInferred)) lines.push('* ECTS przyjęte według długości kursu (S1 = 7, T1/T2 = 3.5).')

  const classClashes = findClassClashes(plan)
  const examClashes = findExamClashes(plan)
  const sameDay = findSameDayAssessments(plan)
  lines.push('', 'KOLIZJE')
  if (classClashes.length + examClashes.length + sameDay.length === 0) lines.push('- brak')
  for (const c of examClashes.filter((x) => x.severity === 'error')) {
    lines.push(`- Kolizja egzaminów (blokuje): ${name(c.a.offeringId)} i ${name(c.b.offeringId)}, ${formatDateLong(c.a.date)} ${assessmentTime(c.a)}`)
  }
  for (const c of classClashes) {
    lines.push(`- Kolizja zajęć: ${name(c.a.offeringId)} ${meetingLabel(c.a)} nachodzi na ${name(c.b.offeringId)} ${meetingLabel(c.b)}`)
  }
  for (const c of examClashes.filter((x) => x.severity === 'warning')) {
    lines.push(
      `- ${c.timeUnknown ? 'Ten sam dzień, godzina nieznana' : 'Nakładanie się zaliczeń'}: ${KIND_LABEL[c.a.kind]} z ${name(c.a.offeringId)} i ${KIND_LABEL[c.b.kind]} z ${name(c.b.offeringId)}, ${formatDateLong(c.a.date)}`,
    )
  }
  for (const p of sameDay) {
    lines.push(`- Ten sam dzień: ${name(p.a.offeringId)} i ${name(p.b.offeringId)}, ${formatDateLong(p.a.date)}`)
  }

  const exams = sortedAssessments(plan)
  lines.push('', 'TERMINY EGZAMINÓW')
  if (exams.length === 0) lines.push('- brak')
  for (const a of exams) {
    const o = schedule.offeringsById.get(a.offeringId)!
    lines.push(`- ${formatDateLong(a.date)}, ${assessmentTime(a)}: ${o.title} (${KIND_LABEL[a.kind]})`)
  }
  return lines.join('\n')
}

function courseLines(o: Offering): string[] {
  const ects = `${formatEcts(o.ects)}${o.ectsInferred ? '*' : ''} ECTS`
  return [
    `- ${o.title} [${o.courseCode}], sekcja ${sectionLetter(o.section)}, ${o.termType}, ${ects}`,
    `  Zajęcia: ${o.meetings.map((m) => `${meetingLabel(m)}${m.room ? ` (${m.room})` : ''}`).join('; ') || 'brak'}`,
  ]
}

const TERM_ORDER = { T1: 0, S1: 1, T2: 2 }

function sortCourses(list: Offering[]): Offering[] {
  return [...list].sort((a, b) => TERM_ORDER[a.termType] - TERM_ORDER[b.termType] || a.title.localeCompare(b.title))
}
