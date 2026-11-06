import { useMemo, useState } from 'react'
import { clashesWithPlan } from '../lib/clashes'
import { findExamClashes } from '../lib/exams'
import type { ElectiveCatalog, ElectiveCourse } from '../lib/schedule'
import type { AreaOfExpertise, CourseType, Offering, TermType } from '../lib/types'
import { formatDate, formatEcts, meetingLabel } from '../lib/format'

const AOE_TYPE_LABEL: Partial<Record<CourseType, string>> = {
  CORE: 'Area core',
  CORE_OPTIONAL: 'Area core (choose)',
  EXCLUSIVE_CORE: 'Area core (exclusive)',
  DIRECTIVE_ELECTIVE: 'Recommended',
}

interface Props {
  catalog: ElectiveCatalog
  plan: Offering[]
  selectedIds: Set<string>
  areas: AreaOfExpertise[]
  aoe: string | null
  onAoeChange: (aoe: string | null) => void
  onAdd: (o: Offering) => void
  onRemove: (id: string) => void
  onPreview: (o: Offering | null) => void
}

type Tab = 'program' | 'out'

interface SectionStatus {
  offering: Offering
  classClash: boolean
  examError: boolean
}

export function ElectivePicker({ catalog, plan, selectedIds, areas, aoe, onAoeChange, onAdd, onRemove, onPreview }: Props) {
  const [tab, setTab] = useState<Tab>('program')
  const [query, setQuery] = useState('')
  const [period, setPeriod] = useState<'all' | TermType>('all')
  const [hideClashing, setHideClashing] = useState(false)
  const [areaOnly, setAreaOnly] = useState(false)

  const statusOf = useMemo(() => {
    return (course: ElectiveCourse): SectionStatus[] =>
      course.offerings.map((o) => {
        // Picking another section replaces the current one, so ignore the same course in the plan.
        const others = plan.filter((p) => !(p.courseCode === o.courseCode && p.termType === o.termType))
        return {
          offering: o,
          classClash: clashesWithPlan(o, others).length > 0,
          examError: findExamClashes([o, ...others]).some(
            (c) => c.severity === 'error' && (c.a.offeringId === o.id || c.b.offeringId === o.id),
          ),
        }
      })
  }, [plan])

  const source = tab === 'program' ? catalog.inProgram : catalog.outOfProgram
  const q = query.trim().toLowerCase()
  const courses = source
    .filter((c) => period === 'all' || c.period === period)
    .filter((c) => !q || c.title.toLowerCase().includes(q) || c.courseCode.includes(q))
    .filter((c) => !areaOnly || !aoe || aoe in c.aoeTypes)
    .map((c) => ({ course: c, sections: statusOf(c) }))
    .filter(
      ({ sections }) =>
        !hideClashing || sections.some((s) => selectedIds.has(s.offering.id) || (!s.classClash && !s.examError)),
    )

  return (
    <section className="card picker-panel">
      <h2>Add electives</h2>
      <div className="tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'program'} className={tab === 'program' ? 'selected' : ''} onClick={() => setTab('program')}>
          Your program ({catalog.inProgram.length})
        </button>
        <button type="button" role="tab" aria-selected={tab === 'out'} className={tab === 'out' ? 'selected' : ''} onClick={() => setTab('out')}>
          Other masters ({catalog.outOfProgram.length})
        </button>
      </div>
      {tab === 'out' && (
        <p className="muted small">Courses from other masters (OUT_PROGRAM). Rules for taking them are not confirmed yet.</p>
      )}

      <div className="filters">
        <input type="search" placeholder="Search title or code" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search electives" />
        <select value={period} onChange={(e) => setPeriod(e.target.value as typeof period)} aria-label="Term">
          <option value="all">All terms</option>
          <option value="T1">T1</option>
          <option value="T2">T2</option>
          <option value="S1">S1 (semester)</option>
        </select>
        {areas.length > 0 && (
          <select value={aoe ?? ''} onChange={(e) => onAoeChange(e.target.value || null)} aria-label="Area of Expertise">
            <option value="">Area of Expertise: none</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        )}
        <label className="check">
          <input type="checkbox" checked={hideClashing} onChange={(e) => setHideClashing(e.target.checked)} /> Hide clashing
        </label>
        {aoe && (
          <label className="check">
            <input type="checkbox" checked={areaOnly} onChange={(e) => setAreaOnly(e.target.checked)} /> Only this area
          </label>
        )}
      </div>

      <ul className="course-list">
        {courses.length === 0 && <li className="muted">No courses match these filters.</li>}
        {courses.map(({ course, sections }) => {
          const areaType = aoe ? course.aoeTypes[aoe] : undefined
          const exam = course.offerings[0].assessments.find((a) => a.kind === 'exam')
          return (
            <li key={`${course.courseCode}-${course.period}`} className={`course ${areaType ? 'highlight' : ''}`}>
              <div className="course-head">
                <strong>{course.title}</strong>
                <span className="muted small">
                  {course.courseCode} · {course.period} · {formatEcts(course.ects)} ECTS
                  {exam ? ` · exam ${formatDate(exam.date)}` : ''}
                </span>
                {areaType && <span className="tag accent">{AOE_TYPE_LABEL[areaType] ?? areaType}</span>}
                {course.type === 'EXCLUSIVE_ELECTIVE' && <span className="tag">Exclusive</span>}
              </div>
              <ul className="sections">
                {sections.map(({ offering: o, classClash, examError }) => {
                  const selected = selectedIds.has(o.id)
                  return (
                    <li key={o.id} onMouseEnter={() => onPreview(o)} onMouseLeave={() => onPreview(null)}>
                      <span className="section-name">{o.section}</span>
                      <span className="section-times small">{o.meetings.map(meetingLabel).join(' · ')}</span>
                      {!selected && examError && <span className="tag error">Exam clash</span>}
                      {!selected && !examError && classClash && <span className="tag warning">Time clash</span>}
                      {selected ? (
                        <button type="button" className="btn small" onClick={() => onRemove(o.id)}>
                          Remove
                        </button>
                      ) : (
                        <button type="button" className="btn small primary" onClick={() => onAdd(o)} onFocus={() => onPreview(o)} onBlur={() => onPreview(null)}>
                          Add
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
            </li>
          )
        })}
      </ul>
      {catalog.unscheduledCount > 0 && tab === 'program' && (
        <p className="muted small">{catalog.unscheduledCount} listed course(s) have no class times this semester and are not shown.</p>
      )}
    </section>
  )
}
