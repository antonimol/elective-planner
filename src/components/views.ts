export type View = 'program' | 'plan' | 'electives' | 'exams' | 'summary'

export const VIEWS: { id: View; label: string }[] = [
  { id: 'program', label: 'Program' },
  { id: 'plan', label: 'Plan' },
  { id: 'electives', label: 'Electivy' },
  { id: 'exams', label: 'Egzaminy' },
  { id: 'summary', label: 'Podsumowanie' },
]
