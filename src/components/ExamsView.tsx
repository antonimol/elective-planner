import { sortedAssessments } from '../lib/exams'
import { assessmentStart, formatDate, KIND_LABEL, plural, sectionLetter } from '../lib/format'
import type { Assessment } from '../lib/types'
import { Corners } from './Corners'
import type { PlanData } from './usePlan'

export function ExamsView({ data }: { data: PlanData }) {
  const rows = sortedAssessments(data.plan)
  const byId = new Map(data.plan.map((o) => [o.id, o]))
  const involved = (a: Assessment, pairs: { a: Assessment; b: Assessment }[]) => pairs.some((p) => p.a === a || p.b === a)
  const errors = data.examClashes.filter((c) => c.severity === 'error')
  const warnings = data.examClashes.filter((c) => c.severity === 'warning')
  const withoutDate = data.plan.filter((o) => o.assessments.length === 0)
  const examCount = rows.filter((a) => a.kind === 'exam').length
  const years = [...new Set(rows.map((a) => a.date.slice(0, 4)))].join('/') || '2026/27'
  const terms = (['T1', 'T2', 'S1'] as const).filter((t) => data.plan.some((o) => o.termType === t)).join('·')

  return (
    <>
      <div className="toolbar">
        <span>Egzaminy w twoim planie · chronologicznie</span>
        <span className="muted">Godziny to sloty startowe; zakładamy, że egzamin trwa maksymalnie 1,5 godziny.</span>
      </div>
      <div className="exam-scroll">
        {rows.length === 0 ? (
          <p className="empty muted">W planie nie ma jeszcze egzaminów.</p>
        ) : (
          <table className="exam-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Godzina</th>
                <th>Kurs</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a, i) => {
                const o = byId.get(a.offeringId)!
                const blocking = involved(a, errors)
                const warning = involved(a, warnings)
                const sameDay = involved(a, data.sameDay)
                const repeated = i > 0 && rows[i - 1].date === a.date && !blocking
                return (
                  <tr key={i} className={blocking ? 'signal' : ''}>
                    <td className={`exam-date num ${repeated ? 'repeated' : ''}`}>{formatDate(a.date)}</td>
                    <td>{assessmentStart(a)}</td>
                    <td>
                      <span className="exam-course" lang="en">{o.title}</span>{' '}
                      <span className="exam-meta">
                        {sectionLetter(o.section)}
                        {o.termType === 'S1' ? ' · S1' : ''} · {KIND_LABEL[a.kind]}
                      </span>
                    </td>
                    <td className="status">
                      {blocking ? '⚠️ kolizja — blokuje' : warning ? '⚠️ nakłada się (nie blokuje)' : sameDay ? '[ ten sam dzień ]' : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
        {withoutDate.length > 0 && (
          <p className="footnote muted">
            Brak daty egzaminu: {withoutDate.map((o) => `${o.title}${o.noExam ? ' (bez egzaminu)' : ''}`).join(', ')}.
          </p>
        )}
      </div>
      <Corners left={years} right={terms || 'T1·T2'}>
        <span>
          [ {examCount} {plural(examCount, 'egzamin', 'egzaminy', 'egzaminów')} · {errors.length}{' '}
          {plural(errors.length, 'kolizja', 'kolizje', 'kolizji')} ]
        </span>
      </Corners>
    </>
  )
}
