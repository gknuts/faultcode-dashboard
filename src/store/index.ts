import { create } from 'zustand'
import type { PatternData, Pattern, ViewMode, DerivedStatus } from '../data/types'
import { getPeriodRange, getDatesInRange, todayDefaultSessionAt } from '../lib/dates'
import {
  loadLastSessionAt, saveLastSessionAt,
  loadIgnoredPatterns, saveIgnoredPatterns,
  loadPatternValidations, savePatternValidations,
  resetStorage,
} from '../lib/localStorage'
import { loadPatternData } from '../data/loader'

export type LoadingState = 'loading' | 'loaded' | 'error'

export function derivePatternStatus(
  pattern: Pattern,
  lastSessionAt: string | null,
  ignoredPatterns: Set<string>,
): DerivedStatus {
  if (ignoredPatterns.has(pattern.id)) return 'ignored'
  if (pattern.endDate) return 'resolved'
  if (!lastSessionAt) return 'new'
  const sessionDate = lastSessionAt.slice(0, 10)
  return pattern.startDate >= sessionDate ? 'new' : 'ongoing'
}

export interface AppState {
  data: PatternData | null
  loadingState: LoadingState

  lastSessionAt: string | null
  ignoredPatterns: Set<string>
  patternValidations: Record<string, 'abnormal' | 'normal'>

  selectedAssetId: string | null
  view: ViewMode
  showNew: boolean
  showOngoing: boolean

  loadData: () => Promise<void>
  retryLoad: () => void
  setSelectedAsset: (id: string | null) => void
  setView: (v: ViewMode) => void
  simulateNewSession: () => void
  ignorePattern: (id: string) => void
  validatePattern: (id: string, status: 'abnormal' | 'normal') => void
  toggleShowNew: () => void
  toggleShowOngoing: () => void
}

const storedSession = loadLastSessionAt() ?? todayDefaultSessionAt()
const storedIgnored = new Set(loadIgnoredPatterns())
const storedValidations = loadPatternValidations()

export const useStore = create<AppState>((set, get) => ({
  data: null,
  loadingState: 'loading',

  lastSessionAt: storedSession,
  ignoredPatterns: storedIgnored,
  patternValidations: storedValidations,

  selectedAssetId: null,
  view: '1M',
  showNew: true,
  showOngoing: true,

  loadData: async () => {
    set({ loadingState: 'loading' })
    try {
      const data = await loadPatternData()
      const selectedAssetId = data.assets[0]?.id ?? null
      set({ data, loadingState: 'loaded', selectedAssetId })
    } catch (e) {
      console.error('[fcd] Load failed:', e)
      set({ loadingState: 'error' })
    }
  },

  retryLoad: () => get().loadData(),

  setSelectedAsset: (id) => set({ selectedAssetId: id }),

  setView: (view) => set({ view }),

  simulateNewSession: () => {
    const ts = new Date().toISOString()
    saveLastSessionAt(ts)
    set({ lastSessionAt: ts })
  },

  ignorePattern: (id) => {
    const next = new Set(get().ignoredPatterns)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    saveIgnoredPatterns([...next])
    set({ ignoredPatterns: next })
  },

  validatePattern: (id, status) => {
    const next = { ...get().patternValidations, [id]: status }
    savePatternValidations(next)
    set({ patternValidations: next })
  },

  toggleShowNew: () => set((s) => ({ showNew: !s.showNew })),
  toggleShowOngoing: () => set((s) => ({ showOngoing: !s.showOngoing })),
}))

if (typeof window !== 'undefined') {
  ;(window as unknown as Record<string, unknown>).fcdReset = () => {
    resetStorage()
    window.location.reload()
  }
}

export function usePeriodDates(view: ViewMode) {
  const [start, end] = getPeriodRange(view)
  return { start, end, dates: getDatesInRange(start, end) }
}
