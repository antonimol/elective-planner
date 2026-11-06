import { useEffect, useMemo, useState } from 'react'
import { ElectivesView } from './components/ElectivesView'
import { ExamsView } from './components/ExamsView'
import { Header } from './components/Header'
import { VIEWS, type View } from './components/views'
import { PlanView } from './components/PlanView'
import { ProgramPicker } from './components/ProgramPicker'
import { SummaryView } from './components/SummaryView'
import { usePlan } from './components/usePlan'
import { schedule } from './data'
import { addElective, loadSelection, removeElective, sanitizeSelection, saveSelection, type Selection } from './lib/selection'
import { buildPlanSummary } from './lib/summary'
import type { Offering, Term } from './lib/types'

function viewFromHash(): View | null {
  const id = window.location.hash.replace(/^#\/?/, '')
  return VIEWS.some((v) => v.id === id) ? (id as View) : null
}

function App() {
  const [selection, setSelection] = useState<Selection | null>(() => loadSelection(window.localStorage, schedule))
  const [view, setView] = useState<View>(() => viewFromHash() ?? (selection ? 'plan' : 'program'))
  const [term, setTerm] = useState<Term>('T1')

  useEffect(() => saveSelection(window.localStorage, selection), [selection])
  useEffect(() => {
    const onHash = () => setView(viewFromHash() ?? 'plan')
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const go = (v: View) => {
    if (window.location.hash !== `#/${v}`) window.location.hash = `/${v}`
    setView(v)
    window.scrollTo(0, 0)
  }

  const confirm = (programId: string, section: string) => {
    const sameProgram = selection?.programId === programId
    // Keep electives when only the section changes; sanitising drops the new section's mandatory courses.
    setSelection(
      sanitizeSelection(
        { programId, section, aoe: sameProgram ? selection?.aoe : null, electiveIds: sameProgram ? selection?.electiveIds : [] },
        schedule,
      ),
    )
    go('plan')
  }

  const current: View = selection ? view : 'program'

  return (
    <>
      {selection ? (
        <PlanApp selection={selection} view={current} term={term} setTerm={setTerm} setSelection={setSelection} go={go} onConfirm={confirm} />
      ) : (
        <>
          <Header view="program" canNavigate={false} ects={0} onNavigate={go} />
          <main>
            <ProgramPicker schedule={schedule} onConfirm={confirm} />
          </main>
        </>
      )}
      <p className="disclaimer muted">
        Nieoficjalne narzędzie oparte na opublikowanym planie i kalendarzu egzaminów Fall 2026/27. Przed biddingiem sprawdź oficjalne źródła.
      </p>
    </>
  )
}

function PlanApp({
  selection,
  view,
  term,
  setTerm,
  setSelection,
  go,
  onConfirm,
}: {
  selection: Selection
  view: View
  term: Term
  setTerm: (t: Term) => void
  setSelection: (s: Selection) => void
  go: (v: View) => void
  onConfirm: (programId: string, section: string) => void
}) {
  const data = usePlan(schedule, selection)
  const summary = useMemo(() => (view === 'summary' ? buildPlanSummary(schedule, selection) : ''), [view, selection])
  const remove = (id: string) => setSelection(removeElective(selection, id))
  const add = (o: Offering) => {
    setSelection(addElective(selection, o, schedule))
    if (o.termType !== 'S1') setTerm(o.termType)
  }

  return (
    <>
      <Header view={view} canNavigate ects={data.ects.semester} onNavigate={go} />
      <main>
        {view === 'program' && (
          <ProgramPicker schedule={schedule} initialProgram={selection.programId} initialSection={selection.section} onConfirm={onConfirm} />
        )}
        {view === 'plan' && (
          <PlanView
            schedule={schedule}
            selection={selection}
            data={data}
            term={term}
            onTermChange={setTerm}
            onChangeProgram={() => go('program')}
            onRemove={remove}
            onAddElectives={() => go('electives')}
          />
        )}
        {view === 'electives' && (
          <ElectivesView
            schedule={schedule}
            selection={selection}
            data={data}
            term={term}
            onTermChange={setTerm}
            onAoeChange={(aoe) => setSelection({ ...selection, aoe })}
            onAdd={add}
            onRemove={remove}
          />
        )}
        {view === 'exams' && <ExamsView data={data} />}
        {view === 'summary' && <SummaryView text={summary} />}
      </main>
    </>
  )
}

export default App
