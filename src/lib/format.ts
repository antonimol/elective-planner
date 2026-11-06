// Display formatting (Polish UI). Course titles stay in their original English.
import { ASSESSMENT_DURATION_MIN } from './exams'
import { formatMinutes } from './time'
import type { Assessment, Day, Meeting, Offering } from './types'

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const

export const DAY_SHORT: Record<Day, string> = { Mon: 'pon', Tue: 'wt', Wed: 'śr', Thu: 'czw', Fri: 'pt' }
export const DAY_HEADER: Record<Day, string> = { Mon: 'Pon', Tue: 'Wt', Wed: 'Śr', Thu: 'Czw', Fri: 'Pt' }

/** "TXA" -> "A" */
export function sectionLetter(section: string): string {
  return section.replace(/^TX/, '')
}

export function timeRange(start: number, end: number): string {
  return `${formatMinutes(start)}–${formatMinutes(end)}`
}

export function meetingLabel(m: Meeting): string {
  return `${DAY_SHORT[m.day]} ${timeRange(m.start, m.end)}`
}

/** Meetings with the same hours are grouped: "wt, czw 18:30–20:00". */
export function meetingsLabel(meetings: Meeting[]): string {
  const order = (m: Meeting) => DAYS.indexOf(m.day)
  const groups = new Map<string, Meeting[]>()
  for (const m of [...meetings].sort((a, b) => order(a) - order(b) || a.start - b.start)) {
    const key = timeRange(m.start, m.end)
    groups.set(key, [...(groups.get(key) ?? []), m])
  }
  return [...groups.entries()].map(([time, ms]) => `${[...new Set(ms.map((m) => DAY_SHORT[m.day]))].join(', ')} ${time}`).join(', ')
}

export function offeringLabel(o: Offering): string {
  return `${o.title} (${sectionLetter(o.section)}, ${o.termType})`
}

const WEEKDAYS = ['nd', 'pon', 'wt', 'śr', 'czw', 'pt', 'sob']
const MONTHS = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru']

/** "2026-10-19" -> "19 paź" (independent of the browser locale and time zone). */
export function formatDate(iso: string): string {
  const [, m, d] = iso.split('-').map(Number)
  return `${d} ${MONTHS[m - 1]}`
}

/** "2026-10-19" -> "pon 19 paź" */
export function formatDateLong(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return `${WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]} ${formatDate(iso)}`
}

export function assessmentTime(a: Assessment): string {
  if (a.start === null || a.end === null) return a.timeLabel ? `${a.timeLabel} (niejasne)` : 'godzina nieznana'
  return timeRange(a.start, a.end)
}

/** Start time only, unless the source gave an explicit range. */
export function assessmentStart(a: Assessment): string {
  if (a.start === null || a.end === null) return a.timeLabel ?? '?'
  return a.end - a.start === ASSESSMENT_DURATION_MIN ? formatMinutes(a.start) : timeRange(a.start, a.end)
}

export const KIND_LABEL: Record<Assessment['kind'], string> = {
  exam: 'egzamin',
  midterm: 'kolokwium',
  presentation: 'prezentacja',
}

export function formatEcts(n: number): string {
  return n.toFixed(1)
}

export function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (n === 1) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}
