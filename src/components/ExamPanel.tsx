import type { ExamClash } from '../lib/exams'
import { sortedAssessments } from '../lib/exams'
import type { Assessment, Offering } from '../lib/types'
import { assessmentTime, formatDate, KIND_LABEL } from '../lib/format'

interface Props {
  offerings: Offering[]
  examClashes: ExamClash[]
}

export function ExamPanel({ offerings, examClashes }: Props) {
  const rows = sortedAssessments(offerings)
  const byId = new Map(offerings.map((o) => [o.id, o]))
  const severity = (a: Assessment) => {
    const hits = examClashes.filter((c) => c.a === a || c.b === a)
    if (hits.some((c) => c.severity === 'error')) return 'error'
    return hits.length ? 'warning' : ''
  }
  const withoutDate = offerings.filter((o) => o.assessments.length === 0)

  return (
    <section className="card">
      <h2>Exam dates</h2>
      {rows.length === 0 ? (
        <p className="muted">No exams in your plan yet.</p>
      ) : (
        <table className="exam-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Course</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a, i) => {
              const o = byId.get(a.offeringId)!
              return (
                <tr key={i} className={severity(a)}>
                  <td>{formatDate(a.date)}</td>
                  <td>{assessmentTime(a)}</td>
                  <td>
                    {o.title} <span className="muted">({o.section})</span>
                  </td>
                  <td>{KIND_LABEL[a.kind]}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
      {withoutDate.length > 0 && (
        <p className="muted small">
          No exam date listed: {withoutDate.map((o) => `${o.title}${o.noExam ? ' (no exam)' : ''}`).join(', ')}.
        </p>
      )}
      <p className="muted small">Exam times are start slots; each exam is assumed to last 3 hours.</p>
    </section>
  )
}
