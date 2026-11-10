import { useEffect, useMemo, useState } from 'react'
import type { TipStep } from './components/FirstVisitTips'
import { PlanScreen } from './components/PlanScreen'
import { ProgramPicker } from './components/ProgramPicker'
import { schedule } from './data'
import { ectsSummary } from './lib/ects'
import { formatEcts } from './lib/format'
import { loadSelection, planOfferings, sanitizeSelection, saveSelection, type Selection } from './lib/selection'
import { createTipsStore } from './lib/tips'

function safeLocalStorage(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

const tipsStore = createTipsStore(safeLocalStorage())

function App() {
  const [selection, setSelection] = useState<Selection | null>(() => loadSelection(window.localStorage, schedule))
  // The link always opens on the program and section picker; a saved choice is preselected there.
  const [editing, setEditing] = useState(true)
  // Cancel (back to the plan) only makes sense once the plan has been opened in this visit.
  const [planOpened, setPlanOpened] = useState(false)
  // The tour starts the first time the plan screen is shown (after picking a program).
  const [tipStep, setTipStep] = useState<TipStep | null>(null)

  useEffect(() => saveSelection(window.localStorage, selection), [selection])

  const onPlanScreen = selection !== null && !editing

  const finishTips = () => {
    tipsStore.markSeen()
    setTipStep(null)
  }

  const ects = useMemo(() => (selection ? ectsSummary(planOfferings(selection, schedule)).semester : null), [selection])

  const confirm = (programId: string, section: string) => {
    const sameProgram = selection?.programId === programId
    // Keep electives when only the section changes; sanitising drops the new section's mandatory courses.
    const next = sanitizeSelection(
      { programId, section, aoe: sameProgram ? selection?.aoe : null, electiveIds: sameProgram ? selection?.electiveIds : [] },
      schedule,
    )
    setSelection(next)
    setEditing(false)
    setPlanOpened(true)
    if (!tipsStore.seen()) setTipStep(1)
  }

  return (
    <>
      <header className="app-header">
        <span className="brand">Elective Planner</span>
        <span className="tagline">Timetable-aware elective selection for Nova SBE MSc students</span>
        {onPlanScreen && ects !== null && <span className="header-ects">{formatEcts(ects)} ECTS this semester</span>}
      </header>
      <main>
        {!selection || editing ? (
          <ProgramPicker
            schedule={schedule}
            initialProgram={selection?.programId}
            initialSection={selection?.section}
            onConfirm={confirm}
            onCancel={selection && planOpened ? () => setEditing(false) : undefined}
          />
        ) : (
          <PlanScreen
            schedule={schedule}
            selection={selection}
            onChange={setSelection}
            onChangeProgram={() => {
              setTipStep(null)
              setEditing(true)
            }}
            tipStep={tipStep}
            onTipStep={setTipStep}
            onTipsFinish={finishTips}
          />
        )}
      </main>
      <footer className="app-footer">
        Source schedules belong to Nova SBE. The public data contains no lecturer names. Always check official sources before bidding.
        {onPlanScreen && (
          <>
            {' '}
            <button
              type="button"
              className="link"
              onClick={() => {
                setTipStep(1)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            >
              Show tips
            </button>
          </>
        )}
      </footer>
    </>
  )
}

export default App
