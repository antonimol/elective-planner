import { formatMinutes } from './lib/time'
import type { Assessment, Meeting, Offering } from './lib/types'

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const

export function meetingLabel(m: Meeting): string {
  return `${m.day} ${formatMinutes(m.start)}–${formatMinutes(m.end)}`
}

export function offeringLabel(o: Offering): string {
  return `${o.title} (${o.section}, ${o.termType})`
}

export function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
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
