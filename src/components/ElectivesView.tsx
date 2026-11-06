import { useMemo, useState } from 'react'
import { clashesWithPlan } from '../lib/clashes'
import { findExamClashes } from '../lib/exams'
import { assessmentStart, formatDate, formatEcts, meetingsLabel, sectionLetter } from '../lib/format'
import type { ElectiveCourse } from '../lib/schedule'
import type { Selection } from '../lib/selection'
import type { CourseType, Offering, Schedule, Term, TermType } from '../lib/types'
import { TermToggles } from './PlanView'
import { Legend, Timetable } from './Timetable'
import { Divider, Toggle } from './Toggle'
import type { PlanData } from './usePlan'

const AOE_TYPE_LABEL: Partial<Record<CourseType, string>> = {
  CORE: 'Rdzeń obszaru',
  CORE_OPTIONAL: 'Rdzeń (do wyboru)',
  EXCLUSIVE_CORE: 'Rdzeń (wyłączny)',
  DIRECTIVE_ELECTIVE: 'Rekomendowany',
}

const PERIODS: TermType[] = ['T1', 'T2', 'S1']

type Status = 'free' | 'replace' | 'clash' | 'exam-clash' | 'in-plan'
const STATUS_ORDER: Record<Status, number> = { free: 0, replace: 0, clash: 1, 'exam-clash': 1, 'in-plan': 2 }

interface Row {
  course: ElectiveCourse
  offering: Offering
  status: Status
  replaces?: Offering
}

interface Props {
  schedule: Schedule
  selection: Selection
  data: PlanData
  term: Term
  onTermChange: (t: Term) => void
  onAoeChange: (aoe: string | null) => void
  onAdd: (o: Offering) => void
  onRemove: (id: string) => void
}

export function ElectivesView({ schedule, selection, data, term, onTermChange, onAoeChange, onAdd, onRemove }: Props) {
  const [tab, setTab] = useState<'program' | 'out'>('program')
  const [periods, setPeriods] = useState<Set<TermType>>(new Set(PERIODS))
  const [query, setQuery] = useState('')
  const [hideClashing, setHideClashing] = useState(false)
  const [areaOnly, setAreaOnly] = useState(false)
  const [preview, setPreview] = useState<Offering | null>(null)

  const areas = schedule.areasOfExpertise.filter((a) => a.program === selection.programId)
  const aoe = selection.aoe

  const rows = useMemo(() => {
    const selectedIds = new Set(selection.electiveIds)
    const source = tab === 'program' ? data.catalog.inProgram : data.catalog.outOfProgram
    const result: Row[] = []
    for (const course of source) {
      for (const offering of course.offerings) {
        const others = data.plan.filter((p) => !(p.courseCode === offering.courseCode && p.termType === offering.termType))
        const replaces = data.plan.find(
          (p) => p.id !== offering.id && p.courseCode === offering.courseCode && p.termType === offering.termType,
        )
        let status: Status = replaces ? 'replace' : 'free'
        if (selectedIds.has(offering.id)) status = 'in-plan'
        else if (
          findExamClashes([offering, ...others]).some(
            (c) => c.severity === 'error' && (c.a.offeringId === offering.id || c.b.offeringId === offering.id),
          )
        )
          status = 'exam-clash'
        else if (clashesWithPlan(offering, others).length > 0) status = 'clash'
        result.push({ course, offering, status, replaces })
      }
    }
    return result
  }, [tab, data, selection.electiveIds])

  const q = query.trim().toLowerCase()
  const visible = rows
    .filter((r) => periods.has(r.course.period))
    .filter((r) => !q || r.course.title.toLowerCase().includes(q) || r.course.courseCode.includes(q))
    .filter((r) => !areaOnly || !aoe || aoe in r.course.aoeTypes)
    .filter((r) => !hideClashing || r.status === 'free' || r.status === 'replace' || r.status === 'in-plan')
    .sort(
      (a, b) =>
        STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
        a.course.title.localeCompare(b.course.title) ||
        a.offering.section.localeCompare(b.offering.section),
    )

  const togglePeriod = (p: TermType) => {
    const next = new Set(periods)
    if (next.has(p)) next.delete(p)
    else next.add(p)
    if (next.size > 0) setPeriods(next)
  }

  const previewTerm: Term = preview && preview.termType !== 'S1' ? preview.termType : term

  return (
    <>
      <div className="toolbar">
        <span className="toggle-group" role="tablist" aria-label="Lista">
          <Toggle role="tab" on={tab === 'program'} onClick={() => setTab('program')}>
            Twój program <span className="muted">({data.catalog.inProgram.length})</span>
          </Toggle>
          <Toggle role="tab" on={tab === 'out'} onClick={() => setTab('out')}>
            Inne mastery <span className="muted">({data.catalog.outOfProgram.length})</span>
          </Toggle>
        </span>
        <Divider />
        <span className="toggle-group" role="group" aria-label="Termin">
          <Toggle on={periods.size === PERIODS.length} onClick={() => setPeriods(new Set(PERIODS))}>
            Wszystkie
          </Toggle>
          {PERIODS.map((p) => (
            <Toggle key={p} on={periods.has(p)} onClick={() => togglePeriod(p)}>
              {p}
            </Toggle>
          ))}
        </span>
        <Divider />
        <label className="check">
          <input type="checkbox" checked={hideClashing} onChange={(e) => setHideClashing(e.target.checked)} /> Ukryj kolidujące
        </label>
        {areas.length > 0 && (
          <>
            <Divider />
            <label className="field">
              Obszar
              <select value={aoe ?? ''} onChange={(e) => onAoeChange(e.target.value || null)}>
                <option value="">— brak —</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </label>
            {aoe && (
              <label className="check">
                <input type="checkbox" checked={areaOnly} onChange={(e) => setAreaOnly(e.target.checked)} /> Tylko ten obszar
              </label>
            )}
          </>
        )}
        <label className="field search">
          Szukaj
          <input type="search" placeholder="tytuł lub kod" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
      </div>
      {tab === 'out' && (
        <div className="toolbar note muted">Kursy z innych programów (OUT_PROGRAM). Zasady ich wyboru nie są jeszcze potwierdzone.</div>
      )}

      <div className="electives-layout">
        <ul className="index electives-list" aria-label="Electivy">
          {visible.length === 0 && <li className="empty muted">Żaden kurs nie pasuje do filtrów.</li>}
          {visible.map((r) => (
            <ElectiveRow
              key={r.offering.id}
              row={r}
              aoeType={aoe ? r.course.aoeTypes[aoe] : undefined}
              previewing={preview?.id === r.offering.id}
              onPreview={setPreview}
              onAdd={onAdd}
              onRemove={onRemove}
            />
          ))}
          {tab === 'program' && data.catalog.unscheduledCount > 0 && (
            <li className="empty muted">
              {data.catalog.unscheduledCount} kurs(y) z listy nie mają zajęć w tym semestrze i nie są pokazane.
            </li>
          )}
        </ul>
        <aside className="electives-preview" aria-label="Podgląd planu">
          <div className="toolbar">
            <span>Podgląd planu</span>
            <TermToggles term={previewTerm} onChange={onTermChange} />
            <span className="toolbar-end">
              <Legend />
            </span>
          </div>
          <Timetable
            offerings={data.plan}
            term={previewTerm}
            mandatoryIds={data.mandatoryIds}
            clashingMeetingIds={data.clashingMeetingIds}
            preview={preview}
          />
        </aside>
      </div>
    </>
  )
}

function ElectiveRow({
  row,
  aoeType,
  previewing,
  onPreview,
  onAdd,
  onRemove,
}: {
  row: Row
  aoeType?: CourseType
  previewing: boolean
  onPreview: (o: Offering | null) => void
  onAdd: (o: Offering) => void
  onRemove: (id: string) => void
}) {
  const { course, offering: o, status } = row
  const exam = o.assessments.find((a) => a.kind === 'exam')
  const inPlan = status === 'in-plan'
  return (
    <li
      className={`index-row elective ${inPlan ? 'in-plan' : ''} ${previewing ? 'previewing' : ''}`}
      onMouseEnter={() => onPreview(inPlan ? null : o)}
      onMouseLeave={() => onPreview(null)}
      onFocus={() => onPreview(inPlan ? null : o)}
      onBlur={() => onPreview(null)}
    >
      <dl className="meta">
        <dt>Kod</dt>
        <dd className="value">[{course.courseCode}]</dd>
        <dt>Termin</dt>
        <dd className="value">
          [{course.period} · {formatEcts(o.ects)} ECTS]
        </dd>
        <dt>Zajęcia</dt>
        <dd className="value">
          [{sectionLetter(o.section)} · {meetingsLabel(o.meetings)}]
        </dd>
        <dt>Egzamin</dt>
        <dd className="value">[{exam ? `${formatDate(exam.date)} · ${assessmentStart(exam)}` : 'brak daty'}]</dd>
        {aoeType && (
          <>
            <dt>Obszar</dt>
            <dd className="value">[{AOE_TYPE_LABEL[aoeType] ?? aoeType}]</dd>
          </>
        )}
        {course.type === 'EXCLUSIVE_ELECTIVE' && (
          <>
            <dt>Typ</dt>
            <dd className="value">[Exclusive]</dd>
          </>
        )}
        <dt>Plan</dt>
        <dd className="plan-cell">
          {inPlan ? (
            <>
              ✓ w planie{' '}
              <button type="button" className="link" onClick={() => onRemove(o.id)} aria-label={`Usuń ${course.title}`}>
                [Usuń]
              </button>
            </>
          ) : (
            <>
              {status === 'exam-clash' && <span className="chip-signal">⚠️ kolizja egzaminu</span>}
              {status === 'clash' && <span className="chip-signal">⚠️ kolizja czasu</span>}
              <button
                type="button"
                className={status === 'free' ? 'btn-inline' : 'link'}
                onClick={() => onAdd(o)}
                aria-label={`Dodaj ${course.title}, sekcja ${sectionLetter(o.section)}`}
              >
                {status === 'replace' && row.replaces ? `[Zamień na sekcję ${sectionLetter(o.section)}]` : '[+ Dodaj]'}
              </button>
            </>
          )}
        </dd>
      </dl>
      <div className="index-title" lang="en">
        {course.title}
        {previewing && (
          <span className="arrow" aria-hidden>
            {' '}
            ←
          </span>
        )}
      </div>
    </li>
  )
}
