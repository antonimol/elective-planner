import type { Offering } from './types'

export interface EctsSummary {
  /** Courses that run only in T1 / only in T2. */
  t1: number
  t2: number
  /** Whole-semester (S1) courses. */
  s1: number
  /** Workload per term: term courses plus half of each S1 course. */
  t1Load: number
  t2Load: number
  semester: number
}

export function ectsSummary(offerings: Offering[]): EctsSummary {
  const sum = (type: Offering['termType']) =>
    offerings.filter((o) => o.termType === type).reduce((acc, o) => acc + o.ects, 0)
  const t1 = sum('T1')
  const t2 = sum('T2')
  const s1 = sum('S1')
  return { t1, t2, s1, t1Load: t1 + s1 / 2, t2Load: t2 + s1 / 2, semester: t1 + t2 + s1 }
}
