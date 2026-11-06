import { describe, expect, it } from 'vitest'
import { buildSchedule, rawOffering } from './__fixtures__/build'
import { STORAGE_KEY, addElective, loadSelection, planOfferings, removeElective, sanitizeSelection, saveSelection } from './selection'

const mandatory = [{ program: 'FIN', status: 'mandatory' as const }]
const s = buildSchedule([
  rawOffering('M1', { section: 'TXA', programs: mandatory }),
  rawOffering('M2', { section: 'TXB', programs: mandatory }),
  rawOffering('E-TXA', { code: 'E', section: 'TXA' }),
  rawOffering('E-TXB', { code: 'E', section: 'TXB' }),
  rawOffering('E-T2', { code: 'E', section: 'TXA', term: 'T2' }),
])
const base = { programId: 'FIN', section: 'TXA', aoe: null, electiveIds: [] }

describe('selection', () => {
  it('plan = mandatory for the section + electives', () => {
    const sel = addElective(base, s.offeringsById.get('E-TXA')!, s)
    expect(planOfferings(sel, s).map((o) => o.id)).toEqual(['M1', 'E-TXA'])
  })
  it('picking another section of the same course replaces it', () => {
    let sel = addElective(base, s.offeringsById.get('E-TXA')!, s)
    sel = addElective(sel, s.offeringsById.get('E-TXB')!, s)
    expect(sel.electiveIds).toEqual(['E-TXB'])
  })
  it('the same course in another term is kept', () => {
    let sel = addElective(base, s.offeringsById.get('E-TXA')!, s)
    sel = addElective(sel, s.offeringsById.get('E-T2')!, s)
    expect(sel.electiveIds).toEqual(['E-TXA', 'E-T2'])
  })
  it('removes an elective', () => {
    expect(removeElective({ ...base, electiveIds: ['E-TXA'] }, 'E-TXA').electiveIds).toEqual([])
  })
  it('sanitize drops unknown ids, mandatory ids and invalid sections', () => {
    expect(sanitizeSelection({ ...base, electiveIds: ['E-TXA', 'nope', 'M1', 7] }, s)?.electiveIds).toEqual(['E-TXA'])
    expect(sanitizeSelection({ ...base, section: 'TXZ' }, s)).toBeNull()
    expect(sanitizeSelection('garbage', s)).toBeNull()
  })
  it('round-trips through storage and survives corrupt data', () => {
    const store = new Map<string, string>()
    const storage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    }
    const sel = { ...base, electiveIds: ['E-TXB'] }
    saveSelection(storage, sel)
    expect(loadSelection(storage, s)).toEqual(sel)
    store.set(STORAGE_KEY, '{not json')
    expect(loadSelection(storage, s)).toBeNull()
  })
})
