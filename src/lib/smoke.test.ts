import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('public schedule data', () => {
  const data = JSON.parse(
    readFileSync(new URL('../../data/schedule.public.json', import.meta.url), 'utf8'),
  )

  it('has the expected top-level keys', () => {
    expect(Object.keys(data)).toEqual(
      expect.arrayContaining(['meta', 'programs', 'offerings', 'programCourses', 'sections']),
    )
  })

  it('contains no lecturer names', () => {
    const named = (data.offerings as { professors?: unknown[] }[]).filter(
      (o) => Array.isArray(o.professors) && o.professors.length > 0,
    )
    expect(named).toEqual([])
  })
})
