import { useEffect, useRef } from 'react'

export type TipStep = 1 | 2 | 3

const TIPS: Record<TipStep, { label: string; aria: string; title: string; text: string }> = {
  1: {
    label: 'Timetable',
    aria: 'your week',
    title: 'Your week, at a glance',
    text: 'Mandatory courses are already in. Hover an elective in the list to preview it here; anything that clashes turns orange.',
  },
  2: {
    label: 'Your courses',
    aria: 'your courses',
    title: 'Keep count of your ECTS',
    text: 'Everything in your plan is listed here with its credits. Mandatory courses stay; electives can be removed with one click.',
  },
  3: {
    label: 'Add electives',
    aria: 'add electives',
    title: 'Find and add electives',
    text: 'Search or filter by term, then pick a section. “Time clash” tells you before you add it; “Hide clashing” clears them from the list.',
  },
}

interface PopoverProps {
  step: TipStep
  onNext: () => void
  onBack: () => void
  onFinish: () => void
}

/** One tip, rendered inside the card it points at (the card must be position: relative). */
export function TipPopover({ step, onNext, onBack, onFinish }: PopoverProps) {
  const ref = useRef<HTMLDivElement>(null)
  const primary = useRef<HTMLButtonElement>(null)
  const tip = TIPS[step]

  useEffect(() => {
    primary.current?.focus({ preventScroll: true })
    ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [step])

  return (
    <div ref={ref} role="dialog" aria-label={`Tip ${step} of 3: ${tip.aria}`} className={`tip tip-${step}`}>
      <span className="tip-arrow" aria-hidden />
      <div className="tip-head">
        Tip {step} / 3 · {tip.label}
      </div>
      <div className="tip-body">
        <p className="tip-title">{tip.title}</p>
        <p className="tip-text">{tip.text}</p>
        <div className="tip-actions">
          {step === 3 ? (
            <button type="button" className="tip-link" onClick={onBack}>
              ← Back
            </button>
          ) : (
            <button type="button" className="tip-link" onClick={onFinish}>
              Skip tips
            </button>
          )}
          <button ref={primary} type="button" className="btn small primary" onClick={step === 3 ? onFinish : onNext}>
            {step === 3 ? 'Done' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function TipsBanner({ onSkip }: { onSkip: () => void }) {
  return (
    <div className="tips-banner" role="status">
      <strong>New here?</strong>
      <span>Three quick tips walk you through the timetable, your courses and the elective list.</span>
      <button type="button" className="link" onClick={onSkip}>
        Skip tips
      </button>
    </div>
  )
}
