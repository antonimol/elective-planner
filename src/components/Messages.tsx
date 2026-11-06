import type { ClassClash } from '../lib/clashes'
import type { ExamClash, SameDayPair } from '../lib/exams'
import { assessmentStart, formatDate, KIND_LABEL, meetingLabel } from '../lib/format'
import type { Schedule } from '../lib/types'

interface Props {
  schedule: Schedule
  classClashes: ClassClash[]
  examClashes: ExamClash[]
  sameDay: SameDayPair[]
}

export function Messages({ schedule, classClashes, examClashes, sameDay }: Props) {
  const title = (id: string) => schedule.offeringsById.get(id)?.title ?? id
  const errors = examClashes.filter((c) => c.severity === 'error')
  const warnings = examClashes.filter((c) => c.severity === 'warning')

  if (classClashes.length + examClashes.length + sameDay.length === 0) {
    return (
      <div className="messages" role="status">
        <p className="msg">
          <span className="msg-label">✓ Brak kolizji w planie.</span>
        </p>
      </div>
    )
  }

  return (
    <div className="messages" role="status" aria-live="polite">
      {errors.map((c, i) => (
        <p key={`e${i}`} className="msg signal">
          <span className="msg-label">⚠️ Kolizja egzaminów — blokuje</span>
          <span>
            {title(c.a.offeringId)} i {title(c.b.offeringId)} mają egzamin {formatDate(c.a.date)}, {assessmentStart(c.a)}.
          </span>
        </p>
      ))}
      {classClashes.map((c, i) => (
        <p key={`c${i}`} className="msg">
          <span className="msg-label">Kolizja zajęć</span>
          <span>
            {title(c.a.offeringId)} ({meetingLabel(c.a)}) nachodzi na {title(c.b.offeringId)} ({meetingLabel(c.b)}).
          </span>
        </p>
      ))}
      {warnings.map((c, i) => (
        <p key={`w${i}`} className="msg">
          <span className="msg-label">{c.timeUnknown ? 'Ten sam dzień' : 'Nakładanie się zaliczeń'}</span>
          <span>
            {title(c.a.offeringId)} ({KIND_LABEL[c.a.kind]}, {assessmentStart(c.a)}) i {title(c.b.offeringId)} ({KIND_LABEL[c.b.kind]},{' '}
            {assessmentStart(c.b)}) — {formatDate(c.a.date)}
            {c.timeUnknown ? ', godzina jednego z nich jest nieznana.' : '. Nie blokuje, ale sprawdź.'}
          </span>
        </p>
      ))}
      {sameDay.map((p, i) => (
        <p key={`s${i}`} className="msg">
          <span className="msg-label">Ten sam dzień</span>
          <span>
            {title(p.a.offeringId)} ({assessmentStart(p.a)}) i {title(p.b.offeringId)} ({assessmentStart(p.b)}) —{' '}
            {p.a.kind === p.b.kind ? `oba: ${KIND_LABEL[p.a.kind]}` : `${KIND_LABEL[p.a.kind]} i ${KIND_LABEL[p.b.kind]}`}{' '}
            {formatDate(p.a.date)}.
          </span>
        </p>
      ))}
    </div>
  )
}
