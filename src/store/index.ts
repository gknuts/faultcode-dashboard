import { create } from 'zustand'
import type { PatternData, Pattern, ViewMode, DerivedStatus } from '../data/types'
import { getPeriodRange, getDatesInRange, todayDefaultSessionAt, todayISO } from '../lib/dates'
import {
  loadLastSessionAt, saveLastSessionAt,
  loadPatternValidations, savePatternValidations,
  resetStorage,
} from '../lib/localStorage'
import { loadPatternData } from '../data/loader'

export type LoadingState = 'loading' | 'loaded' | 'error'

export function derivePatternStatus(
  pattern: Pattern,
  lastSessionAt: string | null,
): DerivedStatus {
  if (!lastSessionAt) return 'new'
  const sessionDate = lastSessionAt.slice(0, 10)
  if (pattern.startDate >= sessionDate) return 'new'
  const today = todayISO()
  if (!pattern.endDate || pattern.endDate >= today) return 'ongoing'
  return 'unclassified'
}

export interface AppState {
  data: PatternData | null
  loadingState: LoadingState

  lastSessionAt: string | null
  patternValidations: Record<string, 'abnormal' | 'normal'>

  selectedAssetId: string | null
  view: ViewMode

  loadData: () => Promise<void>
  retryLoad: () => void
  setSelectedAsset: (id: string | null) => void
  setView: (v: ViewMode) => void
  simulateNewSession: () => void
  validatePattern: (id: string, status: 'abnormal' | 'normal') => void
}

const storedSession = loadLastSessionAt() ?? todayDefaultSessionAt()
const storedValidations = loadPatternValidations()

export const useStore = create<AppState>((set, get) => ({
  data: null,
  loadingState: 'loading',

  lastSessionAt: storedSession,
  patternValidations: storedValidations,

  selectedAssetId: null,
  view: '1M',

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
    const ts = new Date(`${todayISO()}T12:00:00Z`).toISOString()
    saveLastSessionAt(ts)
    set({ lastSessionAt: ts })
  },

  validatePattern: (id, status) => {
    const next = { ...get().patternValidations, [id]: status }
    savePatternValidations(next)
    set({ patternValidations: next })
  },

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
