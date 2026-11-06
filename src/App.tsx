import { useEffect, useState } from 'react'
import { PlanScreen } from './components/PlanScreen'
import { ProgramPicker } from './components/ProgramPicker'
import { schedule } from './data'
import { loadSelection, sanitizeSelection, saveSelection, type Selection } from './lib/selection'

function App() {
  const [selection, setSelection] = useState<Selection | null>(() => loadSelection(window.localStorage, schedule))
  const [editing, setEditing] = useState(false)

  useEffect(() => saveSelection(window.localStorage, selection), [selection])

  const confirm = (programId: string, section: string) => {
    const sameProgram = selection?.programId === programId
    // Keep electives when only the section changes; sanitising drops the new section's mandatory courses.
    const next = sanitizeSelection(
      { programId, section, aoe: sameProgram ? selection?.aoe : null, electiveIds: sameProgram ? selection?.electiveIds : [] },
      schedule,
    )
    setSelection(next)
    setEditing(false)
  }

  return (
    <>
      <header className="app-header">
        <h1>Elective Planner</h1>
        <span className="muted small">Nova SBE MSc · Fall 2026/27 · unofficial</span>
      </header>
      <main>
        {!selection || editing ? (
          <ProgramPicker
            schedule={schedule}
            initialProgram={selection?.programId}
            initialSection={selection?.section}
            onConfirm={confirm}
            onCancel={selection ? () => setEditing(false) : undefined}
          />
        ) : (
          <PlanScreen schedule={schedule} selection={selection} onChange={setSelection} onChangeProgram={() => setEditing(true)} />
        )}
      </main>
      <footer className="app-footer muted small">
        Based on the published Fall 2026/27 timetable and exam calendar. Always check official sources before bidding.
      </footer>
    </>
  )
}

export default App
