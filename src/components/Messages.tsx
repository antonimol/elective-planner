import type { ClassClash } from '../lib/clashes'
import type { ExamClash, SameDayPair } from '../lib/exams'
import { assessmentTime, formatDate, KIND_LABEL, meetingLabel, offeringLabel } from '../lib/format'
import type { Schedule } from '../lib/types'

interface Props {
  schedule: Schedule
  classClashes: ClassClash[]
  examClashes: ExamClash[]
  sameDay: SameDayPair[]
}

export function Messages({ schedule, classClashes, examClashes, sameDay }: Props) {
  const name = (id: string) => {
    const o = schedule.offeringsById.get(id)
    return o ? offeringLabel(o) : id
  }
  const title = (id: string) => schedule.offeringsById.get(id)?.title ?? id
  const errors = examClashes.filter((c) => c.severity === 'error')
  const warnings = examClashes.filter((c) => c.severity === 'warning')

  if (classClashes.length + examClashes.length + sameDay.length === 0) {
    return (
      <section className="messages" role="status" aria-label="Clashes">
        <p className="msg">✓ No clashes in your plan.</p>
      </section>
    )
  }

  return (
    <section className="messages" role="status" aria-live="polite" aria-label="Clashes">
      {errors.map((c, i) => (
        <p key={`e${i}`} className="msg signal">
          <strong>⚠️ Exam clash (blocking):</strong> {name(c.a.offeringId)} and {name(c.b.offeringId)} both have an exam on{' '}
          {formatDate(c.a.date)}, {assessmentTime(c.a)}.
        </p>
      ))}
      {classClashes.map((c, i) => (
        <p key={`c${i}`} className="msg">
          <strong>Class clash:</strong> {title(c.a.offeringId)} ({meetingLabel(c.a)}) overlaps {title(c.b.offeringId)} ({meetingLabel(c.b)}).
        </p>
      ))}
      {warnings.map((c, i) => (
        <p key={`w${i}`} className="msg">
          <strong>{c.timeUnknown ? 'Same assessment day:' : 'Assessment overlap:'}</strong> {KIND_LABEL[c.a.kind]} of {title(c.a.offeringId)} (
          {assessmentTime(c.a)}) and {KIND_LABEL[c.b.kind].toLowerCase()} of {title(c.b.offeringId)} ({assessmentTime(c.b)}) on{' '}
          {formatDate(c.a.date)}.
        </p>
      ))}
      {sameDay.map((p, i) => (
        <p key={`s${i}`} className="msg">
          <strong>Same assessment day:</strong> {KIND_LABEL[p.a.kind]} of {title(p.a.offeringId)} ({assessmentTime(p.a)}) and{' '}
          {KIND_LABEL[p.b.kind].toLowerCase()} of {title(p.b.offeringId)} ({assessmentTime(p.b)}) on {formatDate(p.a.date)}.
        </p>
      ))}
    </section>
  )
}
