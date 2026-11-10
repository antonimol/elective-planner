import { describe, expect, it } from 'vitest'
import { createTipsStore, TIPS_KEY } from './tips'

function memoryStorage() {
  const map = new Map<string, string>()
  return { getItem: (k: string) => map.get(k) ?? null, setItem: (k: string, v: string) => void map.set(k, v), map }
}

describe('tips store', () => {
  it('is unseen until marked, then remembered in storage', () => {
    const storage = memoryStorage()
    const store = createTipsStore(storage)
    expect(store.seen()).toBe(false)
    store.markSeen()
    expect(store.seen()).toBe(true)
    expect(storage.map.get(TIPS_KEY)).toBe('1')
    expect(createTipsStore(storage).seen()).toBe(true)
  })

  it('falls back to once per session when storage throws', () => {
    const broken = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
    }
    const store = createTipsStore(broken)
    expect(store.seen()).toBe(false)
    store.markSeen()
    expect(store.seen()).toBe(true)
  })

  it('works without storage', () => {
    const store = createTipsStore(null)
    expect(store.seen()).toBe(false)
    store.markSeen()
    expect(store.seen()).toBe(true)
  })
})
