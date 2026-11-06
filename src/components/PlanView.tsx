import { formatEcts, sectionLetter } from '../lib/format'
import type { Schedule, Term } from '../lib/types'
import type { Selection } from '../lib/selection'
import { Messages } from './Messages'
import { Legend, Timetable } from './Timetable'
import { Divider, Toggle } from './Toggle'
import type { PlanData } from './usePlan'

interface Props {
  schedule: Schedule
  selection: Selection
  data: PlanData
  term: Term
  onTermChange: (t: Term) => void
  onChangeProgram: () => void
  onRemove: (id: string) => void
  onAddElectives: () => void
}

export function PlanView({ schedule, selection, data, term, onTermChange, onChangeProgram, onRemove, onAddElectives }: Props) {
  const program = schedule.programs.find((p) => p.id === selection.programId)
  return (
    <>
      <div className="toolbar">
        <span>
          {program?.name} · Sekcja {sectionLetter(selection.section)}
        </span>
        <button type="button" className="link" onClick={onChangeProgram}>
          [ Zmień ]
        </button>
        <Divider />
        <TermToggles term={term} onChange={onTermChange} />
        <span className="toolbar-end">
          <Legend />
        </span>
      </div>
      <Messages schedule={schedule} classClashes={data.classClashes} examClashes={data.examClashes} sameDay={data.sameDay} />
      <div className="columns">
        <div className="col-main">
          <Timetable
            offerings={data.plan}
            term={term}
            mandatoryIds={data.mandatoryIds}
            clashingMeetingIds={data.clashingMeetingIds}
          />
        </div>
        <aside className="col-aside">
          <EctsPanel data={data} />
          <CourseList data={data} onRemove={onRemove} />
          <button type="button" className="btn primary wide" onClick={onAddElectives}>
            [ + Dodaj electivy → ]
          </button>
        </aside>
      </div>
    </>
  )
}

export function TermToggles({ term, onChange }: { term: Term; onChange: (t: Term) => void }) {
  return (
    <span className="toggle-group" role="group" aria-label="Termin">
      {(['T1', 'T2'] as const).map((t) => (
        <Toggle key={t} on={term === t} onClick={() => onChange(t)}>
          {t}
        </Toggle>
      ))}
    </span>
  )
}

function EctsPanel({ data }: { data: PlanData }) {
  const e = data.ects
  return (
    <section className="ects" aria-label="ECTS">
      <div className="ects-total">
        <span className="ects-number num">{formatEcts(e.semester)}</span>
        <span>
          ECTS
          <br />w semestrze
        </span>
      </div>
      <dl className="ects-grid">
        <dt>Kursy T1</dt>
        <dd className="value">[{formatEcts(e.t1)}]</dd>
        <dt>Kursy T2</dt>
        <dd className="value">[{formatEcts(e.t2)}]</dd>
        <dt>S1 (cały semestr)</dt>
        <dd className="value">[{formatEcts(e.s1)}]</dd>
        <dt title="Kursy danego terminu plus połowa każdego kursu S1">Obciążenie T1 / T2</dt>
        <dd className="value">
          [{formatEcts(e.t1Load)} / {formatEcts(e.t2Load)}]
        </dd>
      </dl>
      <p className="muted">
        Minimalny i maksymalny limit ECTS nie jest jeszcze potwierdzony.
        {data.plan.some((o) => o.ectsInferred) && ' * ECTS przyjęte według długości kursu (S1 = 7, T1/T2 = 3.5).'}
      </p>
    </section>
  )
}

function CourseList({ data, onRemove }: { data: PlanData; onRemove: (id: string) => void }) {
  const isMandatory = (id: string) => data.mandatoryIds.has(id)
  const sorted = [...data.plan].sort(
    (a, b) =>
      Number(!isMandatory(a.id)) - Number(!isMandatory(b.id)) || a.termType.localeCompare(b.termType) || a.title.localeCompare(b.title),
  )
  return (
    <section aria-labelledby="your-courses">
      <h2 id="your-courses" className="section-title">
        Twoje kursy
      </h2>
      <ul className="plan-list">
        {sorted.map((o) => {
          const clash = data.clashingOfferingIds.has(o.id)
          return (
            <li key={o.id} className={clash ? 'clash' : ''}>
              <i className={`sq ${isMandatory(o.id) ? 'ink' : 'blue'}`} aria-hidden />
              <span className="plan-title">
                <span lang="en">{o.title}</span>
                <span className="plan-meta">
                  {sectionLetter(o.section)} · {o.termType} · {formatEcts(o.ects)}
                  {o.ectsInferred ? '*' : ''} ECTS{clash ? ' · ⚠️ kolizja' : ''}
                </span>
              </span>
              {isMandatory(o.id) ? (
                <span className="tag">[Obowiązkowy]</span>
              ) : (
                <button type="button" className="link" onClick={() => onRemove(o.id)} aria-label={`Usuń ${o.title}`}>
                  [Usuń]
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
