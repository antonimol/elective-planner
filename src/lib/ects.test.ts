import { describe, expect, it } from 'vitest'
import { buildSchedule, rawOffering } from './__fixtures__/build'
import { ectsSummary } from './ects'

describe('ectsSummary', () => {
  it('sums per term and semester; S1 counts half towards each term load', () => {
    const s = buildSchedule([
      rawOffering('A', { term: 'T1' }),
      rawOffering('B', { term: 'T1' }),
      rawOffering('C', { term: 'T2' }),
      rawOffering('D', { term: 'S1' }),
    ])
    expect(ectsSummary(s.offerings)).toEqual({ t1: 7, t2: 3.5, s1: 7, t1Load: 10.5, t2Load: 7, semester: 17.5 })
  })
  it('is zero for an empty plan', () => {
    expect(ectsSummary([]).semester).toBe(0)
  })
})
