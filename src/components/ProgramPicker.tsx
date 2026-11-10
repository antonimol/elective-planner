import { useState } from 'react'
import type { Schedule } from '../lib/types'

interface Props {
  schedule: Schedule
  initialProgram?: string
  initialSection?: string
  onConfirm: (programId: string, section: string) => void
  onCancel?: () => void
}

export function ProgramPicker({ schedule, initialProgram, initialSection, onConfirm, onCancel }: Props) {
  const [programId, setProgramId] = useState(initialProgram ?? '')
  const [section, setSection] = useState(initialSection ?? '')
  const sections = programId ? schedule.sections[programId] ?? [] : []

  const pickProgram = (id: string) => {
    setProgramId(id)
    const list = schedule.sections[id] ?? []
    setSection(list.length === 1 ? list[0] : '')
  }

  return (
    <section className="picker card">
      <h1 className="page-title">Who are you?</h1>
      <p className="muted">Pick your master program and section. Together they set your mandatory courses.</p>

      <fieldset>
        <legend>Program</legend>
        <div className="choice-grid">
          {schedule.programs.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`choice ${programId === p.id ? 'selected' : ''}`}
              aria-pressed={programId === p.id}
              onClick={() => pickProgram(p.id)}
            >
              <span className="choice-title">
                {programId === p.id ? '✓ ' : ''}
                {p.name}
              </span>
              <span className="choice-detail">
                {(schedule.sections[p.id] ?? []).length} {(schedule.sections[p.id] ?? []).length === 1 ? 'section' : 'sections'}
              </span>
            </button>
          ))}
        </div>
      </fieldset>

      {programId && (
        <fieldset>
          <legend>Section</legend>
          <div className="chip-row">
            {sections.map((s) => (
              <button
                key={s}
                type="button"
                className={`chip ${section === s ? 'selected' : ''}`}
                aria-pressed={section === s}
                onClick={() => setSection(s)}
              >
                {s}
              </button>
            ))}
          </div>
          <p className="muted small">Not sure? Your section is on your class timetable or student portal.</p>
        </fieldset>
      )}

      <div className="actions">
        {onCancel && (
          <button type="button" className="btn" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="button" className="btn primary" disabled={!programId || !section} onClick={() => onConfirm(programId, section)}>
          Show my plan →
        </button>
      </div>
    </section>
  )
}
