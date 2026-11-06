import { describe, expect, it } from 'vitest'
import { buildSchedule, rawOffering } from './__fixtures__/build'
import { formatDate, formatDateLong, formatEcts, meetingsLabel, plural, sectionLetter } from './format'

describe('format', () => {
  it('formats dates in Polish, independent of locale and time zone', () => {
    expect(formatDate('2026-10-19')).toBe('19 paź')
    expect(formatDateLong('2026-10-19')).toBe('pon 19 paź')
    expect(formatDateLong('2026-12-31')).toBe('czw 31 gru')
  })
  it('groups meetings with the same hours', () => {
    const s = buildSchedule([
      rawOffering('A', { meetings: [['Thu', '18:30', '20:00'], ['Tue', '18:30', '20:00'], ['Fri', '15:30', '17:00']] }),
    ])
    expect(meetingsLabel(s.offerings[0].meetings)).toBe('wt, czw 18:30–20:00, pt 15:30–17:00')
  })
  it('section letter, ECTS and plural', () => {
    expect(sectionLetter('TXB')).toBe('B')
    expect(formatEcts(28)).toBe('28.0')
    expect(['egzamin', 'egzaminy', 'egzaminów'].map((_, i) => plural([1, 3, 7][i], 'egzamin', 'egzaminy', 'egzaminów'))).toEqual([
      'egzamin',
      'egzaminy',
      'egzaminów',
    ])
    expect(plural(12, 'a', 'b', 'c')).toBe('c')
    expect(plural(22, 'a', 'b', 'c')).toBe('b')
  })
})
