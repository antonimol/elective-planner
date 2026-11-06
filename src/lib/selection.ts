import { mandatoryOfferings } from './schedule'
import type { Offering, Schedule } from './types'

export interface Selection {
  programId: string
  section: string
  /** Optional Area of Expertise filter. */
  aoe: string | null
  electiveIds: string[]
}

export const STORAGE_KEY = 'elective-planner:selection:v1'

/**
 * Add an elective offering. Another section of the same course in the same term is replaced,
 * because a student takes a course only once.
 */
export function addElective(selection: Selection, offering: Offering, schedule: Schedule): Selection {
  const kept = selection.electiveIds.filter((id) => {
    const o = schedule.offeringsById.get(id)
    return o && !(o.courseCode === offering.courseCode && o.termType === offering.termType)
  })
  return { ...selection, electiveIds: [...kept, offering.id] }
}

export function removeElective(selection: Selection, offeringId: string): Selection {
  return { ...selection, electiveIds: selection.electiveIds.filter((id) => id !== offeringId) }
}

/** Mandatory offerings plus chosen electives. */
export function planOfferings(selection: Selection, schedule: Schedule): Offering[] {
  const mandatory = mandatoryOfferings(schedule, selection.programId, selection.section)
  const electives = selection.electiveIds
    .map((id) => schedule.offeringsById.get(id))
    .filter((o): o is Offering => o !== undefined)
  return [...mandatory, ...electives]
}

/** Drop anything that no longer matches the data (unknown program, section, offering ids). */
export function sanitizeSelection(value: unknown, schedule: Schedule): Selection | null {
  if (!value || typeof value !== 'object') return null
  const v = value as Partial<Selection>
  if (typeof v.programId !== 'string' || typeof v.section !== 'string') return null
  if (!schedule.sections[v.programId]?.includes(v.section)) return null
  const mandatoryIds = new Set(mandatoryOfferings(schedule, v.programId, v.section).map((o) => o.id))
  const electiveIds = Array.isArray(v.electiveIds)
    ? [...new Set(v.electiveIds.filter((id): id is string => typeof id === 'string'))].filter(
        (id) => schedule.offeringsById.has(id) && !mandatoryIds.has(id),
      )
    : []
  const aoe =
    typeof v.aoe === 'string' && schedule.areasOfExpertise.some((a) => a.program === v.programId && a.id === v.aoe)
      ? v.aoe
      : null
  return { programId: v.programId, section: v.section, aoe, electiveIds }
}

export function loadSelection(storage: Pick<Storage, 'getItem'>, schedule: Schedule): Selection | null {
  try {
    const text = storage.getItem(STORAGE_KEY)
    return text ? sanitizeSelection(JSON.parse(text), schedule) : null
  } catch {
    return null
  }
}

export function saveSelection(storage: Pick<Storage, 'setItem' | 'removeItem'>, selection: Selection | null): void {
  try {
    if (selection) storage.setItem(STORAGE_KEY, JSON.stringify(selection))
    else storage.removeItem(STORAGE_KEY)
  } catch {
    // Storage full or disabled (private mode): the plan just won't persist.
  }
}
