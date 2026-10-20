import type { PatternData } from './types'

export async function loadPatternData(): Promise<PatternData> {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  const res = await fetch(`${base}/data/patterns.json`)
  if (!res.ok) throw new Error('HTTP ' + res.status)
  const raw = await res.json() as Partial<PatternData>

  if (!Array.isArray(raw.assets) || !Array.isArray(raw.faultCodes) ||
      !Array.isArray(raw.patterns) || !Array.isArray(raw.occurrences)) {
    throw new Error('Invalid JSON structure')
  }

  return {
    assets: raw.assets,
    faultCodes: raw.faultCodes,
    patterns: raw.patterns,
    occurrences: raw.occurrences,
  }
}
