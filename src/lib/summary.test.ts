import { describe, expect, it } from 'vitest'
import { buildSchedule, exam, rawOffering } from './__fixtures__/build'
import { buildPlanSummary } from './summary'

const mandatory = [{ program: 'FIN', status: 'mandatory' as const }]
const s = buildSchedule([
  rawOffering('M1', { code: '1001', programs: mandatory, term: 'S1', meetings: [['Tue', '09:30', '11:00']], exams: [exam('2026-12-10', '14:30')] }),
  rawOffering('E1', { code: '2001', meetings: [['Wed', '08:00', '09:30']], exams: [exam('2026-10-17', '17:30')] }),
  rawOffering('E2', { code: '2002', meetings: [['Wed', '09:00', '10:30']], exams: [exam('2026-10-17', '17:30')] }),
  rawOffering('E3', { code: '2003', meetings: [['Fri', '08:00', '09:30']], exams: [exam('2026-10-17', '08:30')] }),
])
const base = { programId: 'FIN', section: 'TXA', aoe: null, electiveIds: [] as string[] }

describe('buildPlanSummary', () => {
  it('lists program, courses, ECTS and exam dates', () => {
    const text = buildPlanSummary(s, { ...base, electiveIds: ['E1'] })
    expect(text).toContain('Mój plan: Finance, sekcja A')
    expect(text).toContain('- Course 2001 [2001], sekcja A, T1, 3.5 ECTS')
    expect(text).toContain('  Zajęcia: śr 08:00–09:30')
    expect(text).toContain('ECTS: 10.5 w semestrze')
    expect(text).toContain('- sob 17 paź, 17:30–19:00: Course 2001 (egzamin)')
    expect(text).toMatch(/KOLIZJE\n- brak/)
  })
  it('lists class clashes, exam clashes and same-day exams', () => {
    const text = buildPlanSummary(s, { ...base, electiveIds: ['E1', 'E2', 'E3'] })
    expect(text).toContain('- Kolizja egzaminów (blokuje): Course 2001 (A, T1) i Course 2002 (A, T1)')
    expect(text).toContain('- Kolizja zajęć: Course 2001 (A, T1) śr 08:00–09:30 nachodzi na Course 2002 (A, T1) śr 09:00–10:30')
    expect(text).toContain('- Ten sam dzień: Course 2003 (A, T1) i Course 2001 (A, T1), sob 17 paź')
  })
  it('says when there are no electives', () => {
    expect(buildPlanSummary(s, base)).toMatch(/ELECTIVY \(0\)\n- brak/)
  })
})
