import type { ExamClash, SameDayPair } from '../lib/exams'
import { sortedAssessments } from '../lib/exams'
import { assessmentTime, formatDate, KIND_LABEL } from '../lib/format'
import type { Assessment, Offering } from '../lib/types'

interface Props {
  offerings: Offering[]
  examClashes: ExamClash[]
  sameDay: SameDayPair[]
}

export function ExamPanel({ offerings, examClashes, sameDay }: Props) {
  const rows = sortedAssessments(offerings)
  const byId = new Map(offerings.map((o) => [o.id, o]))
  const involved = (a: Assessment, pairs: { a: Assessment; b: Assessment }[]) => pairs.some((p) => p.a === a || p.b === a)
  const errors = examClashes.filter((c) => c.severity === 'error')
  const warnings = examClashes.filter((c) => c.severity === 'warning')
  const withoutDate = offerings.filter((o) => o.assessments.length === 0)

  return (
    <section className="card" aria-label="Exam dates">
      <h2>Exam dates</h2>
      {rows.length === 0 ? (
        <p className="muted">No exams in your plan yet.</p>
      ) : (
        <div className="table-scroll">
          <table className="exam-table">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Time</th>
                <th scope="col">Course</th>
                <th scope="col">Type</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a, i) => {
                const o = byId.get(a.offeringId)!
                const blocking = involved(a, errors)
                return (
                  <tr key={i} className={blocking ? 'signal' : ''}>
                    <td>{formatDate(a.date)}</td>
                    <td>{assessmentTime(a)}</td>
                    <td>
                      {o.title} <span className="muted">({o.section})</span>
                    </td>
                    <td>{KIND_LABEL[a.kind]}</td>
                    <td>
                      {blocking ? (
                        <strong>⚠️ Clash</strong>
                      ) : involved(a, warnings) ? (
                        <span className="tag">Overlap</span>
                      ) : involved(a, sameDay) ? (
                        <span className="tag">Same day</span>
                      ) : null}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      {withoutDate.length > 0 && (
        <p className="muted small">
          No exam date listed: {withoutDate.map((o) => `${o.title}${o.noExam ? ' (no exam)' : ''}`).join(', ')}.
        </p>
      )}
      <p className="muted small">Exam times are start slots; each exam is assumed to last at most 1.5 hours.</p>
    </section>
  )
}
