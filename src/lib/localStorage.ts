import type { Validation } from '../data/types'

const VERSION = 1

function get<T>(key: string): T | null {
  try {
    const v = localStorage.getItem(key)
    return v ? (JSON.parse(v) as T) : null
  } catch {
    return null
  }
}

function set(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

function remove(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {}
}

export function loadValidations(): Record<string, Validation> {
  return get<Record<string, Validation>>('fcd:validations') ?? {}
}

export function saveValidations(v: Record<string, Validation>): void {
  set('fcd:validations', v)
}

export function loadHiddenRows(): string[] {
  return get<string[]>('fcd:hiddenRows') ?? []
}

export function saveHiddenRows(rows: string[]): void {
  set('fcd:hiddenRows', rows)
}

export function loadCollapsedAssets(): string[] {
  return get<string[]>('fcd:collapsedAssets') ?? []
}

export function saveCollapsedAssets(assets: string[]): void {
  set('fcd:collapsedAssets', assets)
}

export function initStorage(): void {
  const version = get<number>('fcd:version')
  if (version !== VERSION) {
    // Clear old data on version mismatch
    remove('fcd:validations')
    remove('fcd:hiddenRows')
    remove('fcd:collapsedAssets')
    set('fcd:version', VERSION)
  }
}

export function resetStorage(): void {
  remove('fcd:validations')
  remove('fcd:hiddenRows')
  remove('fcd:collapsedAssets')
  remove('fcd:version')
}
