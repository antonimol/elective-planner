import { formatMinutes, rangesOverlap, toMinutes } from './time'
import type { Assessment, Offering, RawAssessment } from './types'

/** The source gives only start times; every assessment is assumed to last at most 1.5 hours. */
export const ASSESSMENT_DURATION_MIN = 90

/**
 * Turn a raw exam row into an Assessment for one offering.
 * Supported time formats: "14:30", "09:00-12:00", and per-section times given in the
 * note ("TXB - 11:00 & TXA - 15:30"). Anything else keeps the date with an unknown time.
 * Returns null for "no exam" rows and rows without a date.
 */
export function parseAssessment(raw: RawAssessment, offeringId: string, section: string): Assessment | null {
  if (raw.kind === 'no_exam' || !raw.date) return null

  const base = { offeringId, kind: raw.kind, date: raw.date }
  const label = raw.start?.trim() || null

  const perSection = sectionTimeFromNote(raw.note, section)
  if (perSection !== null) {
    return { ...base, start: perSection, end: perSection + ASSESSMENT_DURATION_MIN, timeLabel: formatMinutes(perSection) }
  }
  if (label && /^\d{1,2}:\d{2}$/.test(label)) {
    const start = toMinutes(label)
    return { ...base, start, end: start + ASSESSMENT_DURATION_MIN, timeLabel: label }
  }
  const range = label ? /^(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/.exec(label) : null
  if (range) {
    return { ...base, start: toMinutes(range[1]), end: toMinutes(range[2]), timeLabel: label }
  }
  return { ...base, start: null, end: null, timeLabel: label }
}

function sectionTimeFromNote(note: string | null, section: string): number | null {
  if (!note) return null
  for (const m of note.matchAll(/(TX[A-Z])\s*-\s*(\d{1,2}:\d{2})/g)) {
    if (m[1] === section) return toMinutes(m[2])
  }
  return null
}

export type ExamClashSeverity = 'error' | 'warning'

export interface ExamClash {
  a: Assessment
  b: Assessment
  /**
   * error: two final exams overlap (blocking).
   * warning: other assessments overlap, or two assessments share a date and one time is unknown.
   */
  severity: ExamClashSeverity
  timeUnknown: boolean
}

/** Find overlapping assessments between different offerings in the plan. */
export function findExamClashes(offerings: Offering[]): ExamClash[] {
  const all = offerings.flatMap((o) => o.assessments)
  const clashes: ExamClash[] = []
  for (let i = 0; i < all.length; i++) {
    for (let j = i + 1; j < all.length; j++) {
      const a = all[i]
      const b = all[j]
      if (a.offeringId === b.offeringId || a.date !== b.date) continue
      const known = a.start !== null && a.end !== null && b.start !== null && b.end !== null
      if (known && !rangesOverlap(a.start!, a.end!, b.start!, b.end!)) continue
      const severity: ExamClashSeverity = known && a.kind === 'exam' && b.kind === 'exam' ? 'error' : 'warning'
      clashes.push({ a, b, severity, timeUnknown: !known })
    }
  }
  return clashes
}

export interface SameDayPair {
  a: Assessment
  b: Assessment
}

/** Assessments of different offerings on the same date that do not overlap (both times known). */
export function findSameDayAssessments(offerings: Offering[]): SameDayPair[] {
  const all = sortedAssessments(offerings)
  const pairs: SameDayPair[] = []
  for (let i = 0; i < all.length; i++) {
    for (let j = i + 1; j < all.length; j++) {
      const a = all[i]
      const b = all[j]
      if (a.offeringId === b.offeringId || a.date !== b.date) continue
      if (a.start === null || a.end === null || b.start === null || b.end === null) continue
      if (!rangesOverlap(a.start, a.end, b.start, b.end)) pairs.push({ a, b })
    }
  }
  return pairs
}

/** All assessments of the plan sorted by date, then time. */
export function sortedAssessments(offerings: Offering[]): Assessment[] {
  return offerings
    .flatMap((o) => o.assessments)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.start ?? 0) - (b.start ?? 0))
}
