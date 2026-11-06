import { rangesOverlap } from './time'
import type { Meeting, Offering, Term, TermSpan } from './types'

/** T1+T2 (type S1) intersects both terms. */
export function termSpansIntersect(a: TermSpan, b: TermSpan): boolean {
  return a === 'T1+T2' || b === 'T1+T2' || a === b
}

export function showsInTerm(span: TermSpan, term: Term): boolean {
  return span === 'T1+T2' || span === term
}

/** Same day, overlapping time, intersecting term spans. */
export function meetingsClash(a: Meeting, b: Meeting): boolean {
  return a.day === b.day && rangesOverlap(a.start, a.end, b.start, b.end) && termSpansIntersect(a.termSpan, b.termSpan)
}

export interface ClassClash {
  a: Meeting
  b: Meeting
}

/** All clashing meeting pairs between different offerings. */
export function findClassClashes(offerings: Offering[]): ClassClash[] {
  const meetings = offerings.flatMap((o) => o.meetings)
  const clashes: ClassClash[] = []
  for (let i = 0; i < meetings.length; i++) {
    for (let j = i + 1; j < meetings.length; j++) {
      const a = meetings[i]
      const b = meetings[j]
      if (a.offeringId !== b.offeringId && meetingsClash(a, b)) clashes.push({ a, b })
    }
  }
  return clashes
}

/** Meetings of `candidate` that would clash with the plan. */
export function clashesWithPlan(candidate: Offering, plan: Offering[]): ClassClash[] {
  const others = plan.filter((o) => o.id !== candidate.id).flatMap((o) => o.meetings)
  return candidate.meetings.flatMap((a) => others.filter((b) => meetingsClash(a, b)).map((b) => ({ a, b })))
}
