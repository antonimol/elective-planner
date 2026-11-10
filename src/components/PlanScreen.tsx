import { useMemo, useState } from 'react'
import { findClassClashes } from '../lib/clashes'
import { findExamClashes, findSameDayAssessments } from '../lib/exams'
import { electiveCatalog, mandatoryOfferings } from '../lib/schedule'
import { buildPlanSummary } from '../lib/summary'
import { addElective, planOfferings, removeElective, type Selection } from '../lib/selection'
import type { Offering, Schedule, Term } from '../lib/types'
import { ElectivePicker } from './ElectivePicker'
import { ExamPanel } from './ExamPanel'
import { TipPopover, TipsBanner, type TipStep } from './FirstVisitTips'
import { useEscToClose } from './useEscToClose'
import { Messages } from './Messages'
import { PlanSummary } from './PlanSummary'
import { SummaryDialog } from './SummaryDialog'
import { TermToggle } from './TermToggle'
import { Timetable } from './Timetable'

interface Props {
  schedule: Schedule
  selection: Selection
  onChange: (s: Selection) => void
  onChangeProgram: () => void
  /** Current first-visit tip, or null when the tour is not running. */
  tipStep: TipStep | null
  onTipStep: (step: TipStep) => void
  onTipsFinish: () => void
}

export function PlanScreen({ schedule, selection, onChange, onChangeProgram, tipStep, onTipStep, onTipsFinish }: Props) {
  const [term, setTerm] = useState<Term>('T1')
  const [preview, setPreview] = useState<Offering | null>(null)
  const [summaryOpen, setSummaryOpen] = useState(false)

  const plan = useMemo(() => planOfferings(selection, schedule), [selection, schedule])
  const mandatoryIds = useMemo(
    () => new Set(mandatoryOfferings(schedule, selection.programId, selection.section).map((o) => o.id)),
    [schedule, selection.programId, selection.section],
  )
  const catalog = useMemo(
    () => electiveCatalog(schedule, selection.programId, selection.section),
    [schedule, selection.programId, selection.section],
  )
  const classClashes = useMemo(() => findClassClashes(plan), [plan])
  const examClashes = useMemo(() => findExamClashes(plan), [plan])
  const sameDay = useMemo(() => findSameDayAssessments(plan), [plan])
  useEscToClose(tipStep !== null, onTipsFinish)
  const tip = (step: TipStep) =>
    tipStep === step ? (
      <TipPopover
        step={step}
        onNext={() => onTipStep((step + 1) as TipStep)}
        onBack={() => onTipStep((step - 1) as TipStep)}
        onFinish={onTipsFinish}
      />
    ) : undefined
  const clashingMeetingIds = new Set(classClashes.flatMap((c) => [c.a.id, c.b.id]))
  const clashingOfferingIds = new Set([
    ...classClashes.flatMap((c) => [c.a.offeringId, c.b.offeringId]),
    ...examClashes.filter((c) => c.severity === 'error').flatMap((c) => [c.a.offeringId, c.b.offeringId]),
  ])
  const program = schedule.programs.find((p) => p.id === selection.programId)
  const areas = schedule.areasOfExpertise.filter((a) => a.program === selection.programId)

  const add = (o: Offering) => {
    onChange(addElective(selection, o, schedule))
    if (o.termType !== 'S1') setTerm(o.termType)
  }

  return (
    <div className="plan">
      {tipStep !== null && <TipsBanner onSkip={onTipsFinish} />}
      <div className="plan-bar">
        <div>
          <h1 className="plan-heading">
            {program?.name} · Section {selection.section}
          </h1>
          <button type="button" className="link" onClick={onChangeProgram}>
            Change program or section
          </button>
        </div>
        <div className="plan-bar-actions">
          <button type="button" className="btn" onClick={() => setSummaryOpen(true)}>
            Copy summary
          </button>
          <TermToggle term={term} onChange={setTerm} />
        </div>
      </div>
      <SummaryDialog
        open={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        text={summaryOpen ? buildPlanSummary(schedule, selection) : ''}
      />

      <div className="plan-grid">
        <div className="plan-main">
          <Messages schedule={schedule} classClashes={classClashes} examClashes={examClashes} sameDay={sameDay} />
          <section className={`card ${tipStep === 1 ? 'tip-anchor' : ''}`} aria-label={`Timetable ${term}`}>
            {tip(1)}
            <div className="legend small">
              <span>
                <i className="dot mandatory" /> Mandatory
              </span>
              <span>
                <i className="dot elective" /> Elective
              </span>
              <span>
                <i className="dot clash" /> Clash
              </span>
              <span>
                <i className="dot preview" /> Preview
              </span>
              <span className="muted">Hover a section in the list to preview it.</span>
            </div>
            <Timetable offerings={plan} term={term} mandatoryIds={mandatoryIds} clashingMeetingIds={clashingMeetingIds} preview={preview} />
          </section>
          <ExamPanel offerings={plan} examClashes={examClashes} sameDay={sameDay} />
        </div>
        <aside className="plan-side">
          <PlanSummary
            offerings={plan}
            mandatoryIds={mandatoryIds}
            clashingOfferingIds={clashingOfferingIds}
            onRemove={(id) => onChange(removeElective(selection, id))}
            tip={tip(2)}
          />
          <ElectivePicker
            catalog={catalog}
            plan={plan}
            selectedIds={new Set(selection.electiveIds)}
            areas={areas}
            aoe={selection.aoe}
            onAoeChange={(aoe) => onChange({ ...selection, aoe })}
            onAdd={add}
            onRemove={(id) => onChange(removeElective(selection, id))}
            onPreview={setPreview}
            previewId={preview?.id}
            tip={tip(3)}
          />
        </aside>
      </div>
    </div>
  )
}
