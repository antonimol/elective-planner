import type { ReactNode } from 'react'
import { ectsSummary } from '../lib/ects'
import type { Offering } from '../lib/types'
import { formatEcts } from '../lib/format'

interface Props {
  offerings: Offering[]
  mandatoryIds: Set<string>
  clashingOfferingIds: Set<string>
  onRemove: (offeringId: string) => void
  /** First-visit tip anchored to this card. */
  tip?: ReactNode
}

export function PlanSummary({ offerings, mandatoryIds, clashingOfferingIds, onRemove, tip }: Props) {
  const e = ectsSummary(offerings)
  const anyInferred = offerings.some((o) => o.ectsInferred)
  const sorted = [...offerings].sort(
    (a, b) => Number(!mandatoryIds.has(a.id)) - Number(!mandatoryIds.has(b.id)) || a.termType.localeCompare(b.termType) || a.title.localeCompare(b.title),
  )

  return (
    <section className={`card ${tip ? 'tip-anchor' : ''}`} aria-label="ECTS">
      {tip}
      <h2>ECTS</h2>
      <div className="ects-total">
        <span className="ects-number num">{formatEcts(e.semester)}</span>
        <span className="muted">ECTS this semester</span>
      </div>
      <dl className="ects-grid">
        <dt>T1 courses</dt>
        <dd>{formatEcts(e.t1)}</dd>
        <dt>T2 courses</dt>
        <dd>{formatEcts(e.t2)}</dd>
        <dt>S1 (whole semester)</dt>
        <dd>{formatEcts(e.s1)}</dd>
        <dt title="Term courses plus half of each S1 course">Load in T1 / T2</dt>
        <dd>
          {formatEcts(e.t1Load)} / {formatEcts(e.t2Load)}
        </dd>
      </dl>
      <p className="muted small">
        The required minimum and maximum ECTS are not confirmed yet.
        {anyInferred && ' * ECTS assumed from term length (S1 = 7, T1/T2 = 3.5).'}
      </p>

      <h3 className="label">Your courses</h3>
      <ul className="plan-list">
        {sorted.map((o) => (
          <li key={o.id} className={clashingOfferingIds.has(o.id) ? 'clash' : ''}>
            <span className={`dot ${mandatoryIds.has(o.id) ? 'mandatory' : 'elective'}`} aria-hidden />
            <span className="plan-title">
              {o.title}{' '}
              <span className="muted">
                {o.section} · {o.termType} · {formatEcts(o.ects)}
                {o.ectsInferred ? '*' : ''} ECTS
              </span>
            </span>
            {mandatoryIds.has(o.id) ? (
              <span className="tag">Mandatory</span>
            ) : (
              <button type="button" className="btn small" onClick={() => onRemove(o.id)} aria-label={`Remove ${o.title}`}>
                Remove
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
