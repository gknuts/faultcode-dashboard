import type { ViewMode, Filters } from '../data/types'
import { centeredEnd } from './dates'

const ALL_FILTER_KEYS = ['val', 'nval', 'int', 'nint', 'abn', 'norm'] as const

export interface UrlState {
  view: ViewMode
  end: string
  selectedAssets: string[]
  selectedCodes: string[]
  filters: Filters
}

export function readUrlState(): UrlState {
  const params = new URLSearchParams(window.location.search)

  const view = (params.get('view') === '1W' ? '1W' : '1M') as ViewMode

  const endRaw = params.get('end') ?? ''
  const end = /^\d{4}-\d{2}-\d{2}$/.test(endRaw) ? endRaw : centeredEnd(view)

  const assetsRaw = params.get('assets') ?? ''
  const selectedAssets = assetsRaw ? assetsRaw.split(',').filter(Boolean) : []

  const codesRaw = params.get('codes') ?? ''
  const selectedCodes = codesRaw ? codesRaw.split(',').filter(Boolean) : []

  const filtersRaw = params.get('filters') ?? ''
  const filterSet = filtersRaw
    ? new Set(filtersRaw.split(',').filter(k => ALL_FILTER_KEYS.includes(k as never)))
    : new Set(['val', 'nval', 'int', 'nint'])

  const filters: Filters = {
    validated:     filterSet.has('val'),
    notValidated:  filterSet.has('nval'),
    interesting:   filterSet.has('int'),
    notInteresting:filterSet.has('nint'),
    abnormal:      filterSet.has('abn'),
    normal:        filterSet.has('norm'),
  }

  return { view, end, selectedAssets, selectedCodes, filters }
}

export function writeUrlState(state: UrlState): void {
  const params = new URLSearchParams()
  params.set('view', state.view)
  params.set('end', state.end)
  if (state.selectedAssets.length) params.set('assets', state.selectedAssets.join(','))
  if (state.selectedCodes.length) params.set('codes', state.selectedCodes.join(','))

  const filterParts: string[] = []
  if (state.filters.validated) filterParts.push('val')
  if (state.filters.notValidated) filterParts.push('nval')
  if (state.filters.interesting) filterParts.push('int')
  if (state.filters.notInteresting) filterParts.push('nint')
  if (state.filters.abnormal) filterParts.push('abn')
  if (state.filters.normal) filterParts.push('norm')
  params.set('filters', filterParts.join(','))

  history.replaceState(null, '', '?' + params.toString())
}
