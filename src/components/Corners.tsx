import type { ReactNode } from 'react'

/** Footer with serif corners (start and exams screens). */
export function Corners({ left, right, children }: { left: string; right: string; children?: ReactNode }) {
  return (
    <footer className="corners">
      <span className="corner num">{left}</span>
      <div className="corners-middle">{children}</div>
      <span className="corner num">{right}</span>
    </footer>
  )
}
