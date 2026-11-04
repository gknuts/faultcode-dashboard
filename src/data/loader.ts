import type { PatternData, Asset, FaultCode, Pattern, PatternOccurrence } from './types'

export interface RawOccurrence {
  date: string
  locomotive: string
  fault_code: string
  name: string
  occurences: number
  is_anomalous: boolean
  correlation_group_id: number | null
}

export function transformRawOccurrences(rows: RawOccurrence[]): PatternData {
  const assetMap = new Map<string, string>()
  const fcMap = new Map<string, string>()
  const groupRows = new Map<string, RawOccurrence[]>()

  for (const row of rows) {
    if (row.correlation_group_id == null) continue

    const assetId = row.locomotive.replace(/ /g, '')
    assetMap.set(assetId, row.locomotive)
    if (!fcMap.has(row.fault_code)) fcMap.set(row.fault_code, row.name)

    const key = `g${row.correlation_group_id}`
    const bucket = groupRows.get(key)
    if (bucket) bucket.push(row)
    else groupRows.set(key, [row])
  }

  const assets: Asset[] = [...assetMap.entries()]
    .map(([id, label]) => ({ id, label }))
    .sort((a, b) => a.id.localeCompare(b.id))

  const faultCodes: FaultCode[] = [...fcMap.entries()]
    .map(([code, description]) => ({ code, description }))
    .sort((a, b) => a.code.localeCompare(b.code))

  const allGroupedDates = [...groupRows.values()].flat().map(r => r.date)
  const dataMaxDate = allGroupedDates.reduce((a, b) => (b > a ? b : a), '')

  const patterns: Pattern[] = []
  const occurrences: PatternOccurrence[] = []

  for (const [patternId, bucket] of groupRows) {
    const assetId = bucket[0].locomotive.replace(/ /g, '')
    const fcs = [...new Set(bucket.map(r => r.fault_code))]
    const sortedDates = bucket.map(r => r.date).sort()
    const startDate = sortedDates[0]
    const lastDate = sortedDates[sortedDates.length - 1]

    const pattern: Pattern = { id: patternId, assetId, faultCodes: fcs, startDate }
    if (lastDate < dataMaxDate) pattern.endDate = lastDate
    patterns.push(pattern)

    for (const row of bucket) {
      const occ: PatternOccurrence = {
        patternId,
        faultCode: row.fault_code,
        date: row.date,
        count: row.occurences,
        status: row.is_anomalous ? 'abnormal' : 'normal',
      }
      if (row.correlation_group_id != null) occ.correlationGroupId = row.correlation_group_id
      occurrences.push(occ)
    }
  }

  return { assets, faultCodes, patterns, occurrences }
}

export async function loadPatternData(url?: string): Promise<PatternData> {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  const endpoint = url ?? `${base}/data/fc_occurences.json`
  const res = await fetch(endpoint)
  if (!res.ok) throw new Error('HTTP ' + res.status)
  const raw = (await res.json()) as RawOccurrence[]
  if (!Array.isArray(raw)) throw new Error('Invalid JSON structure')
  return transformRawOccurrences(raw)
}
