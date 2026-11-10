import { describe, expect, it } from 'vitest'
import { buildSchedule, exam, rawOffering } from './__fixtures__/build'
import { buildPlanSummary } from './summary'

const mandatory = [{ program: 'FIN', status: 'mandatory' as const }]
const s = buildSchedule([
  rawOffering('M1', { code: '1001', programs: mandatory, term: 'S1', meetings: [['Tue', '09:30', '11:00']], exams: [exam('2026-12-10', '14:30')] }),
  rawOffering('E1', { code: '2001', meetings: [['Wed', '08:00', '09:30']], exams: [exam('2026-10-17', '17:30')] }),
  rawOffering('E2', { code: '2002', meetings: [['Wed', '09:00', '10:30']], exams: [exam('2026-10-17', '17:30')] }),
])
const base = { programId: 'FIN', section: 'TXA', aoe: null, electiveIds: [] as string[] }

describe('buildPlanSummary', () => {
  it('lists program, courses, ECTS and exam dates', () => {
    const text = buildPlanSummary(s, { ...base, electiveIds: ['E1'] })
    expect(text).toContain('My plan: Finance, section TXA')
    expect(text).toContain('- Course 2001 [2001], section TXA, T1, 3.5 ECTS')
    expect(text).toContain('  Classes: Wed 08:00–09:30')
    expect(text).toContain('ECTS: 10.5 this semester')
    expect(text).toContain('- Sat 17 Oct, 17:30–19:00: Course 2001 (exam)')
    expect(text).toMatch(/CLASHES\n- none/)
  })
  it('lists class and exam clashes', () => {
    const text = buildPlanSummary(s, { ...base, electiveIds: ['E1', 'E2'] })
    expect(text).toContain('- Exam clash (blocking): Course 2001 (TXA, T1) and Course 2002 (TXA, T1)')
    expect(text).toContain('- Class clash: Course 2001 (TXA, T1) Wed 08:00–09:30 overlaps Course 2002 (TXA, T1) Wed 09:00–10:30')
  })
  it('lists exams on the same day that do not overlap', () => {
    const s2 = buildSchedule([
      rawOffering('A', { exams: [exam('2026-10-17', '08:30')] }),
      rawOffering('B', { exams: [exam('2026-10-17', '17:30')] }),
    ])
    const text = buildPlanSummary(s2, { ...base, electiveIds: ['A', 'B'] })
    expect(text).toContain('- Same assessment day: Exam of Course A (TXA, T1) and exam of Course B (TXA, T1), Sat 17 Oct')
  })
  it('says when there are no electives', () => {
    expect(buildPlanSummary(s, base)).toMatch(/ELECTIVES \(0\)\n- none yet/)
  })
})
