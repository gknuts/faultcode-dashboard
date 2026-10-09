import { create } from 'zustand'
import type { FaultData, ViewMode, Filters, Validation } from '../data/types'
import { navigateEnd } from '../lib/dates'
import { readUrlState, writeUrlState } from '../lib/url'
import {
  loadValidations, saveValidations,
  loadHiddenRows, saveHiddenRows,
  loadCollapsedAssets, saveCollapsedAssets,
  initStorage, resetStorage,
} from '../lib/localStorage'
import { loadFaultData } from '../data/loader'

export type LoadingState = 'loading' | 'loaded' | 'error'

export interface AppState {
  // Data
  data: FaultData | null
  loadingState: LoadingState

  // URL state
  view: ViewMode
  end: string
  selectedAssets: string[]
  selectedCodes: string[]
  filters: Filters

  // localStorage state
  validations: Record<string, Validation>
  hiddenRows: string[]
  collapsedAssets: string[]

  // UI state
  openMenuBubble: string | null

  // Actions
  setView: (v: ViewMode) => void
  setEnd: (d: string) => void
  navigatePeriod: (dir: -1 | 1) => void
  setSelectedAssets: (ids: string[]) => void
  setSelectedCodes: (codes: string[]) => void
  setFilter: (k: keyof Filters, v: boolean) => void
  qualifyBubble: (key: string, status: 'abnormal' | 'normal') => void
  toggleHiddenRow: (key: string) => void
  toggleCollapsedAsset: (id: string) => void
  setOpenMenuBubble: (key: string | null) => void
  loadData: () => Promise<void>
  retryLoad: () => void
}

function syncUrl(state: Pick<AppState, 'view' | 'end' | 'selectedAssets' | 'selectedCodes' | 'filters'>) {
  writeUrlState({
    view: state.view,
    end: state.end,
    selectedAssets: state.selectedAssets,
    selectedCodes: state.selectedCodes,
    filters: state.filters,
  })
}

const urlState = readUrlState()
initStorage()

export const useStore = create<AppState>((set, get) => ({
  data: null,
  loadingState: 'loading',

  view: urlState.view,
  end: urlState.end,
  selectedAssets: urlState.selectedAssets,
  selectedCodes: urlState.selectedCodes,
  filters: urlState.filters,

  validations: loadValidations(),
  hiddenRows: loadHiddenRows(),
  collapsedAssets: loadCollapsedAssets(),

  openMenuBubble: null,

  setView: (view) => {
    set({ view })
    syncUrl({ ...get(), view })
  },

  setEnd: (end) => {
    set({ end })
    syncUrl({ ...get(), end })
  },

  navigatePeriod: (dir) => {
    const { view, end } = get()
    const newEnd = navigateEnd(view, end, dir)
    set({ end: newEnd })
    syncUrl({ ...get(), end: newEnd })
  },

  setSelectedAssets: (selectedAssets) => {
    set({ selectedAssets })
    syncUrl({ ...get(), selectedAssets })
  },

  setSelectedCodes: (selectedCodes) => {
    set({ selectedCodes })
    syncUrl({ ...get(), selectedCodes })
  },

  setFilter: (k, v) => {
    const filters = { ...get().filters, [k]: v }
    set({ filters })
    syncUrl({ ...get(), filters })
  },

  qualifyBubble: (key, status) => {
    const validations = {
      ...get().validations,
      [key]: { status, validatedAt: new Date().toISOString() },
    }
    set({ validations })
    saveValidations(validations)
  },

  toggleHiddenRow: (key) => {
    const hiddenRows = get().hiddenRows
    const next = hiddenRows.includes(key)
      ? hiddenRows.filter(k => k !== key)
      : [...hiddenRows, key]
    set({ hiddenRows: next })
    saveHiddenRows(next)
  },

  toggleCollapsedAsset: (id) => {
    const collapsedAssets = get().collapsedAssets
    const next = collapsedAssets.includes(id)
      ? collapsedAssets.filter(k => k !== id)
      : [...collapsedAssets, id]
    set({ collapsedAssets: next })
    saveCollapsedAssets(next)
  },

  setOpenMenuBubble: (key) => set({ openMenuBubble: key }),

  loadData: async () => {
    set({ loadingState: 'loading' })
    try {
      const data = await loadFaultData()
      set({ data, loadingState: 'loaded' })
    } catch (e) {
      console.error('[fcd] Load failed:', e)
      set({ loadingState: 'error' })
    }
  },

  retryLoad: () => {
    get().loadData()
  },
}))

// Expose reset function
if (typeof window !== 'undefined') {
  ;(window as unknown as Record<string, unknown>).fcdReset = () => {
    resetStorage()
    window.location.reload()
  }
}
