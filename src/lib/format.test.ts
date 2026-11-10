import { describe, expect, it } from 'vitest'
import { formatDate, formatEcts } from './format'

describe('format', () => {
  it('formats dates independent of locale and time zone', () => {
    expect(formatDate('2026-10-19')).toBe('Mon 19 Oct')
    expect(formatDate('2026-12-31')).toBe('Thu 31 Dec')
  })
  it('formats ECTS without a trailing .0', () => {
    expect(formatEcts(28)).toBe('28')
    expect(formatEcts(3.5)).toBe('3.5')
  })
})
