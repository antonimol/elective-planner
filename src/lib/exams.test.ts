import { describe, expect, it } from 'vitest'
import { buildSchedule, exam, rawOffering } from './__fixtures__/build'
import { findExamClashes, parseAssessment, sortedAssessments } from './exams'

describe('parseAssessment', () => {
  it('assumes 3 h for a start slot', () => {
    expect(parseAssessment(exam('2026-10-19', '14:30'), 'X', 'TXA')).toMatchObject({ start: 870, end: 1050 })
  })
  it('parses an explicit range', () => {
    expect(parseAssessment(exam('2026-10-14', '09:00-12:00', 'presentation'), 'X', 'TXA')).toMatchObject({ start: 540, end: 720 })
  })
  it('takes the per-section time from the note', () => {
    const raw = exam('2026-09-22', '11:00 + 15:30', 'exam', 'TXB - 11:00 & TXA - 15:30 (midterm during class time)')
    expect(parseAssessment(raw, 'X', 'TXA')).toMatchObject({ start: 930 })
    expect(parseAssessment(raw, 'X', 'TXB')).toMatchObject({ start: 660 })
  })
  it('keeps the date with unknown time when the format is not understood', () => {
    expect(parseAssessment(exam('2026-09-22', '11:00 + 15:30'), 'X', 'TXC')).toMatchObject({ start: null, end: null })
  })
  it('skips no-exam rows and rows without a date', () => {
    expect(parseAssessment({ kind: 'no_exam', date: null, start: null, note: null }, 'X', 'TXA')).toBeNull()
    expect(parseAssessment(exam('', '08:30'), 'X', 'TXA')).toBeNull()
  })
})

describe('findExamClashes', () => {
  const s = buildSchedule([
    rawOffering('A', { exams: [exam('2026-10-19', '14:30')] }),
    rawOffering('B', { exams: [exam('2026-10-19', '14:30')] }),
    rawOffering('C', { exams: [exam('2026-10-19', '11:30')] }),
    rawOffering('D', { exams: [exam('2026-10-20', '14:30')] }),
    rawOffering('E', { exams: [exam('2026-10-19', '14:30', 'midterm')] }),
    rawOffering('F', { exams: [exam('2026-10-19', null)] }),
  ])
  const o = (...ids: string[]) => ids.map((id) => s.offeringsById.get(id)!)

  it('two final exams in the same slot are a blocking error', () => {
    expect(findExamClashes(o('A', 'B'))).toEqual([expect.objectContaining({ severity: 'error' })])
  })
  it('adjacent slots on the same day do not clash', () => {
    expect(findExamClashes(o('A', 'C'))).toEqual([])
  })
  it('different dates do not clash', () => {
    expect(findExamClashes(o('A', 'D'))).toEqual([])
  })
  it('an exam overlapping a midterm is a warning', () => {
    expect(findExamClashes(o('A', 'E'))).toEqual([expect.objectContaining({ severity: 'warning' })])
  })
  it('same date with unknown time is a warning', () => {
    expect(findExamClashes(o('A', 'F'))).toEqual([expect.objectContaining({ severity: 'warning', timeUnknown: true })])
  })
  it('sorts assessments by date and time', () => {
    expect(sortedAssessments(o('D', 'A', 'C')).map((a) => a.offeringId)).toEqual(['C', 'A', 'D'])
  })
})
