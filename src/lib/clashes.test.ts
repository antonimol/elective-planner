import { describe, expect, it } from 'vitest'
import { buildSchedule, rawOffering } from './__fixtures__/build'
import { clashesWithPlan, findClassClashes, meetingsClash, showsInTerm, termSpansIntersect } from './clashes'

describe('termSpansIntersect', () => {
  it('T1+T2 intersects both terms', () => {
    expect(termSpansIntersect('T1+T2', 'T1')).toBe(true)
    expect(termSpansIntersect('T2', 'T1+T2')).toBe(true)
    expect(termSpansIntersect('T1+T2', 'T1+T2')).toBe(true)
  })
  it('T1 and T2 do not intersect', () => {
    expect(termSpansIntersect('T1', 'T2')).toBe(false)
    expect(termSpansIntersect('T1', 'T1')).toBe(true)
  })
})

describe('showsInTerm', () => {
  it('S1 meetings show in both terms', () => {
    expect(showsInTerm('T1+T2', 'T1')).toBe(true)
    expect(showsInTerm('T1+T2', 'T2')).toBe(true)
    expect(showsInTerm('T1', 'T2')).toBe(false)
  })
})

describe('class clashes', () => {
  const s = buildSchedule([
    rawOffering('A', { term: 'T1', meetings: [['Mon', '08:00', '11:00']] }),
    rawOffering('B', { term: 'T1', meetings: [['Mon', '09:30', '11:00']] }),
    rawOffering('C', { term: 'T2', meetings: [['Mon', '09:30', '11:00']] }),
    rawOffering('D', { term: 'S1', meetings: [['Mon', '10:00', '12:30']] }),
    rawOffering('E', { term: 'T1', meetings: [['Mon', '11:00', '12:30']] }),
    rawOffering('F', { term: 'T1', meetings: [['Tue', '08:00', '11:00']] }),
  ])
  const o = (id: string) => s.offeringsById.get(id)!

  it('detects overlap on the same day and term', () => {
    expect(meetingsClash(o('A').meetings[0], o('B').meetings[0])).toBe(true)
  })
  it('ignores overlap in the other term', () => {
    expect(meetingsClash(o('A').meetings[0], o('C').meetings[0])).toBe(false)
  })
  it('S1 clashes with both T1 and T2', () => {
    expect(meetingsClash(o('D').meetings[0], o('A').meetings[0])).toBe(true)
    expect(meetingsClash(o('D').meetings[0], o('C').meetings[0])).toBe(true)
  })
  it('back-to-back classes do not clash', () => {
    expect(meetingsClash(o('A').meetings[0], o('E').meetings[0])).toBe(false)
  })
  it('different days do not clash', () => {
    expect(meetingsClash(o('A').meetings[0], o('F').meetings[0])).toBe(false)
  })
  it('findClassClashes lists every pair once', () => {
    const pairs = findClassClashes([o('A'), o('B'), o('C'), o('D')]).map((c) => [c.a.offeringId, c.b.offeringId].sort().join('-'))
    expect(pairs.sort()).toEqual(['A-B', 'A-D', 'B-D', 'C-D'])
  })
  it('clashesWithPlan checks a candidate against the plan', () => {
    expect(clashesWithPlan(o('C'), [o('A'), o('B')])).toEqual([])
    expect(clashesWithPlan(o('D'), [o('A'), o('E')])).toHaveLength(2)
  })
})
