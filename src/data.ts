import raw from '../data/schedule.public.json'
import { normalizeSchedule } from './lib/schedule'
import type { RawSchedule } from './lib/types'

export const schedule = normalizeSchedule(raw as unknown as RawSchedule)
