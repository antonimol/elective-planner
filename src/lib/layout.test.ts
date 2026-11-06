import { describe, expect, it } from 'vitest'
import { assignLanes } from './layout'

describe('assignLanes', () => {
  it('gives non-overlapping blocks a full-width lane', () => {
    const r = assignLanes([
      { id: 'a', start: 480, end: 570 },
      { id: 'b', start: 570, end: 660 },
    ])
    expect(r.get('a')).toEqual({ lane: 0, lanes: 1 })
    expect(r.get('b')).toEqual({ lane: 0, lanes: 1 })
  })
  it('puts overlapping blocks side by side and reuses free lanes', () => {
    const r = assignLanes([
      { id: 'a', start: 480, end: 660 },
      { id: 'b', start: 570, end: 660 },
      { id: 'c', start: 480, end: 570 },
    ])
    expect(r.get('a')).toEqual({ lane: 0, lanes: 2 })
    expect(r.get('c')).toEqual({ lane: 1, lanes: 2 })
    expect(r.get('b')).toEqual({ lane: 1, lanes: 2 })
  })
})
