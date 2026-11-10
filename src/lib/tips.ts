export const TIPS_KEY = 'elective-planner.tipsSeen'

export interface TipsStore {
  seen: () => boolean
  markSeen: () => void
}

/**
 * Remembers whether the first-visit tips were finished or skipped.
 * If storage is missing or throws (private mode, blocked site data), it falls back to
 * an in-memory flag, so the tips show once per session.
 */
export function createTipsStore(storage: Pick<Storage, 'getItem' | 'setItem'> | null | undefined): TipsStore {
  let seenThisSession = false
  return {
    seen() {
      if (seenThisSession) return true
      try {
        return storage?.getItem(TIPS_KEY) === '1'
      } catch {
        return false
      }
    },
    markSeen() {
      seenThisSession = true
      try {
        storage?.setItem(TIPS_KEY, '1')
      } catch {
        // Ignore: the in-memory flag covers this session.
      }
    },
  }
}
