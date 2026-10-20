const PREFIX = 'fcd2'

function get<T>(key: string): T | null {
  try {
    const v = localStorage.getItem(`${PREFIX}:${key}`)
    return v ? (JSON.parse(v) as T) : null
  } catch {
    return null
  }
}

function set(key: string, value: unknown): void {
  try {
    localStorage.setItem(`${PREFIX}:${key}`, JSON.stringify(value))
  } catch {}
}

export function loadLastSessionAt(): string | null {
  return get<string>('lastSessionAt')
}

export function saveLastSessionAt(ts: string): void {
  set('lastSessionAt', ts)
}

export function loadIgnoredPatterns(): string[] {
  return get<string[]>('ignoredPatterns') ?? []
}

export function saveIgnoredPatterns(ids: string[]): void {
  set('ignoredPatterns', ids)
}

export function loadPatternValidations(): Record<string, 'abnormal' | 'normal'> {
  return get<Record<string, 'abnormal' | 'normal'>>('patternValidations') ?? {}
}

export function savePatternValidations(v: Record<string, 'abnormal' | 'normal'>): void {
  set('patternValidations', v)
}

export function resetStorage(): void {
  for (const k of Object.keys(localStorage)) {
    if (k.startsWith(PREFIX)) localStorage.removeItem(k)
  }
}
