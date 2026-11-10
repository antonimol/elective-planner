import type { Term } from '../lib/types'

export function TermToggle({ term, onChange }: { term: Term; onChange: (t: Term) => void }) {
  return (
    <div className="segmented" role="group" aria-label="Term">
      {(['T1', 'T2'] as const).map((t) => (
        <button key={t} type="button" className={term === t ? 'selected' : ''} aria-pressed={term === t} onClick={() => onChange(t)}>
          {t}
        </button>
      ))}
    </div>
  )
}
