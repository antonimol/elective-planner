import { describe, expect, it } from 'vitest'
import { schedule } from '../data'
import { findClassClashes } from './clashes'
import { electiveCatalog, mandatoryOfferings } from './schedule'
import { planOfferings } from './selection'

// Integration tests on data/schedule.public.json (acceptance criteria in docs/SPEC.md section 11).
describe('public schedule data', () => {
  it('contains no lecturer names', async () => {
    const raw = (await import('../../data/schedule.public.json')).default as { offerings: { professors: unknown[] }[] }
    expect(raw.offerings.filter((o) => o.professors.length > 0)).toEqual([])
  })

  it('Finance TXA has Investments, Corporate Finance and Financial Modeling as mandatory', () => {
    const titles = mandatoryOfferings(schedule, 'FIN', 'TXA').map((o) => o.title).sort()
    expect(titles).toEqual(['Corporate Finance', 'Financial Modeling', 'Investments'])
  })

  it('mandatory offerings do not clash, except the known Management TXB/TXC cases', () => {
    for (const [programId, sections] of Object.entries(schedule.sections)) {
      for (const section of sections) {
        const clashes = findClassClashes(planOfferings({ programId, section, aoe: null, electiveIds: [] }, schedule))
        const known = programId === 'MGMT' && (section === 'TXB' || section === 'TXC')
        if (!known) expect(clashes, `${programId} ${section}`).toEqual([])
      }
    }
  })

  it('electives come from the lists and exclude the mandatory courses', () => {
    const catalog = electiveCatalog(schedule, 'FIN', 'TXA')
    const codes = new Set([...catalog.inProgram, ...catalog.outOfProgram].map((c) => c.courseCode))
    for (const o of mandatoryOfferings(schedule, 'FIN', 'TXA')) expect(codes.has(o.courseCode)).toBe(false)
    expect(catalog.inProgram.length).toBeGreaterThan(0)
    expect(catalog.outOfProgram.every((c) => c.type === 'OUT_PROGRAM')).toBe(true)
  })

  it('every dated assessment has a parsed time', () => {
    const unknown = schedule.offerings.flatMap((o) => o.assessments).filter((a) => a.start === null)
    expect(unknown).toEqual([])
  })
})
