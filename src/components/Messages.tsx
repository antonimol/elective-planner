import type { ClassClash } from '../lib/clashes'
import type { ExamClash } from '../lib/exams'
import type { Schedule } from '../lib/types'
import { assessmentTime, formatDate, KIND_LABEL, meetingLabel, offeringLabel } from '../format'

interface Props {
  schedule: Schedule
  classClashes: ClassClash[]
  examClashes: ExamClash[]
}

export function Messages({ schedule, classClashes, examClashes }: Props) {
  const name = (id: string) => {
    const o = schedule.offeringsById.get(id)
    return o ? offeringLabel(o) : id
  }
  const errors = examClashes.filter((c) => c.severity === 'error')
  const warnings = examClashes.filter((c) => c.severity === 'warning')

  if (classClashes.length === 0 && examClashes.length === 0) {
    return (
      <div className="messages ok" role="status">
        No clashes in your plan.
      </div>
    )
  }

  return (
    <div className="messages" role="status" aria-live="polite">
      {errors.map((c, i) => (
        <p key={`e${i}`} className="msg error">
          <strong>Exam clash (blocking):</strong> {name(c.a.offeringId)} and {name(c.b.offeringId)} both have an exam on{' '}
          {formatDate(c.a.date)}, {assessmentTime(c.a)}.
        </p>
      ))}
      {classClashes.map((c, i) => (
        <p key={`c${i}`} className="msg warning">
          <strong>Class clash:</strong> {name(c.a.offeringId)} ({meetingLabel(c.a)}) overlaps {name(c.b.offeringId)} (
          {meetingLabel(c.b)}).
        </p>
      ))}
      {warnings.map((c, i) => (
        <p key={`w${i}`} className="msg warning">
          <strong>{c.timeUnknown ? 'Same assessment day:' : 'Assessment overlap:'}</strong> {KIND_LABEL[c.a.kind]} of{' '}
          {name(c.a.offeringId)} ({assessmentTime(c.a)}) and {KIND_LABEL[c.b.kind].toLowerCase()} of {name(c.b.offeringId)} (
          {assessmentTime(c.b)}) on {formatDate(c.a.date)}.
        </p>
      ))}
    </div>
  )
}
