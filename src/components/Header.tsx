import { formatEcts } from '../lib/format'
import { VIEWS, type View } from './views'

interface Props {
  view: View
  canNavigate: boolean
  ects: number
  onNavigate: (v: View) => void
}

export function Header({ view, canNavigate, ects, onNavigate }: Props) {
  const current = VIEWS.findIndex((v) => v.id === view)
  return (
    <header className="app-header">
      <div className="brand">Elective Planner</div>
      <nav className="steps" aria-label="Kroki">
        {VIEWS.map((v, i) => (
          <button
            key={v.id}
            type="button"
            className={`step ${view === v.id ? 'current' : ''}`}
            aria-current={view === v.id ? 'page' : undefined}
            disabled={!canNavigate && v.id !== 'program'}
            onClick={() => onNavigate(v.id)}
          >
            <span aria-hidden>{i <= current ? '[✓]' : '[ ]'}</span> {v.label}
          </button>
        ))}
        <span className="header-ects">
          [ <span className="num-sans">{formatEcts(ects)}</span> ] ECTS
        </span>
      </nav>
    </header>
  )
}
