import { useMemo } from 'react'
import { findClassClashes } from '../lib/clashes'
import { ectsSummary } from '../lib/ects'
import { findExamClashes, findSameDayAssessments } from '../lib/exams'
import { electiveCatalog, mandatoryOfferings } from '../lib/schedule'
import { planOfferings, type Selection } from '../lib/selection'
import type { Schedule } from '../lib/types'

/** Everything derived from the selection that more than one view needs. */
export function usePlan(schedule: Schedule, selection: Selection) {
  return useMemo(() => {
    const plan = planOfferings(selection, schedule)
    const mandatoryIds = new Set(mandatoryOfferings(schedule, selection.programId, selection.section).map((o) => o.id))
    const classClashes = findClassClashes(plan)
    const examClashes = findExamClashes(plan)
    const sameDay = findSameDayAssessments(plan)
    return {
      plan,
      mandatoryIds,
      catalog: electiveCatalog(schedule, selection.programId, selection.section),
      classClashes,
      examClashes,
      sameDay,
      ects: ectsSummary(plan),
      clashingMeetingIds: new Set(classClashes.flatMap((c) => [c.a.id, c.b.id])),
      clashingOfferingIds: new Set([
        ...classClashes.flatMap((c) => [c.a.offeringId, c.b.offeringId]),
        ...examClashes.filter((c) => c.severity === 'error').flatMap((c) => [c.a.offeringId, c.b.offeringId]),
      ]),
    }
  }, [schedule, selection])
}

export type PlanData = ReturnType<typeof usePlan>
