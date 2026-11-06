import { Fragment, useState } from 'react'
import { sectionLetter } from '../lib/format'
import { mandatoryOfferings } from '../lib/schedule'
import type { Schedule } from '../lib/types'
import { Corners } from './Corners'

interface Props {
  schedule: Schedule
  initialProgram?: string
  initialSection?: string
  onConfirm: (programId: string, section: string) => void
}

export function ProgramPicker({ schedule, initialProgram, initialSection, onConfirm }: Props) {
  const [programId, setProgramId] = useState(initialProgram ?? '')
  const [section, setSection] = useState(initialSection ?? '')

  const pickProgram = (id: string) => {
    setProgramId(id)
    const list = schedule.sections[id] ?? []
    setSection(list.length === 1 ? list[0] : '')
  }

  return (
    <>
      <div className="toolbar">
        <span>Krok 1 / 2</span>
        <span className="muted">Wybierz program i sekcję. Razem ustalają twoje kursy obowiązkowe.</span>
      </div>

      <div className="index" role="radiogroup" aria-label="Program">
        {schedule.programs.map((p) => {
          const selected = p.id === programId
          const sections = schedule.sections[p.id] ?? []
          return (
            <Fragment key={p.id}>
              <div className={`index-row ${selected ? 'selected' : ''}`}>
                {selected && (
                  <dl className="meta">
                    <dt>Program</dt>
                    <dd className="value">[{p.id}]</dd>
                    <dt>Sekcje</dt>
                    <dd className="value">{sections.map((s) => `[${sectionLetter(s)}]`).join(' ')}</dd>
                    <dt>Obowiązkowe</dt>
                    <dd className="value">[{mandatoryCount(schedule, p.id, section || sections[0])}]</dd>
                  </dl>
                )}
                <button
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className="index-title as-button"
                  onClick={() => pickProgram(p.id)}
                >
                  <span className="bracket">{selected ? '[✓]' : '[ ]'}</span> <span lang="en">{p.name}</span>
                </button>
              </div>
              {selected && (
                <div className="index-row section-row">
                  <p className="meta-note">
                    Sekcja <span className="muted">— masz ją w planie zajęć lub na portalu studenta</span>
                  </p>
                  <div className="serif-options" role="radiogroup" aria-label="Sekcja">
                    {sections.map((s) => (
                      <button
                        key={s}
                        type="button"
                        role="radio"
                        aria-checked={section === s}
                        aria-label={`Sekcja ${sectionLetter(s)}`}
                        className={`serif-option ${section === s ? 'on' : ''}`}
                        onClick={() => setSection(s)}
                      >
                        {sectionLetter(s)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </Fragment>
          )
        })}
      </div>

      <Corners left="2026/27" right="T1·T2">
        <button type="button" className="btn primary" disabled={!programId || !section} onClick={() => onConfirm(programId, section)}>
          [ Pokaż mój plan → ]
        </button>
      </Corners>
    </>
  )
}

function mandatoryCount(schedule: Schedule, programId: string, section: string | undefined): string {
  if (!section) return '—'
  const list = mandatoryOfferings(schedule, programId, section)
  const parts = (['T1', 'T2', 'S1'] as const)
    .map((t) => [t, list.filter((o) => o.termType === t).length] as const)
    .filter(([, n]) => n > 0)
    .map(([t, n]) => `${n} w ${t}`)
  return parts.join(' · ') || '0'
}
