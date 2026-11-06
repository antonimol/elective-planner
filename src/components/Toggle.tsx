import type { ReactNode } from 'react'

/** Bracket toggle: "[✓] T1" when on, "[ ] T2" when off. */
export function Toggle({
  on,
  onClick,
  children,
  role,
  disabled,
}: {
  on: boolean
  onClick: () => void
  children: ReactNode
  role?: 'tab'
  disabled?: boolean
}) {
  const state = role === 'tab' ? { 'aria-selected': on } : { 'aria-pressed': on }
  return (
    <button type="button" className={`toggle ${on ? 'on' : ''}`} onClick={onClick} role={role} disabled={disabled} {...state}>
      <span aria-hidden>{on ? '[✓]' : '[ ]'}</span> {children}
    </button>
  )
}

export function Divider() {
  return <span className="divider" aria-hidden />
}
