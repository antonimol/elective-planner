import { formatMinutes } from './time'
import type { Assessment, Meeting, Offering } from './types'

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const

export function meetingLabel(m: Meeting): string {
  return `${m.day} ${formatMinutes(m.start)}–${formatMinutes(m.end)}`
}

export function offeringLabel(o: Offering): string {
  return `${o.title} (${o.section}, ${o.termType})`
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "2026-10-19" -> "Mon 19 Oct" (independent of the browser locale and time zone). */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  return `${WEEKDAYS[date.getUTCDay()]} ${d} ${MONTHS[m - 1]}`
}

export function assessmentTime(a: Assessment): string {
  if (a.start === null || a.end === null) return a.timeLabel ? `${a.timeLabel} (unclear)` : 'time unknown'
  return `${formatMinutes(a.start)}–${formatMinutes(a.end)}`
}

export const KIND_LABEL: Record<Assessment['kind'], string> = {
  exam: 'Exam',
  midterm: 'Midterm',
  presentation: 'Presentation',
}

export function formatEcts(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}
