import type { FaultData, Asset, FaultCode, Group, DailyOccurrence } from './types'

export async function loadFaultData(): Promise<FaultData> {
  const res = await fetch('/data/faults.json')
  if (!res.ok) throw new Error('HTTP ' + res.status)
  const raw = await res.json() as Partial<FaultData>

  if (!Array.isArray(raw.assets) || !Array.isArray(raw.faultCodes) ||
      !Array.isArray(raw.groups) || !Array.isArray(raw.occurrences)) {
    throw new Error('Invalid JSON structure')
  }

  const assets = raw.assets as Asset[]
  const faultCodes = raw.faultCodes as FaultCode[]
  const groups = raw.groups as Group[]

  const assetIds = new Set(assets.map(a => a.id))
  const codeSet = new Set(faultCodes.map(f => f.code))

  // Deduplicate occurrences: same assetId+faultCode+date → sum counts, keep abnormal
  const occMap = new Map<string, DailyOccurrence>()
  for (const occ of raw.occurrences as DailyOccurrence[]) {
    if (!assetIds.has(occ.assetId)) {
      console.warn('[fcd] Unknown assetId:', occ.assetId)
      continue
    }
    if (!codeSet.has(occ.faultCode)) {
      console.warn('[fcd] Unknown faultCode:', occ.faultCode)
      continue
    }
    const key = makeBubbleKey(occ.assetId, occ.faultCode, occ.date)
    const existing = occMap.get(key)
    if (existing) {
      console.warn('[fcd] Duplicate occurrence:', key)
      occMap.set(key, {
        ...existing,
        count: existing.count + occ.count,
        status: existing.status === 'abnormal' || occ.status === 'abnormal' ? 'abnormal' : 'normal',
      })
    } else {
      occMap.set(key, occ)
    }
  }

  const occurrences = Array.from(occMap.values())

  // Validate groups: all members of same groupId must share assetId and date
  const groupMembers = new Map<string, { assetId: string; date: string }[]>()
  for (const occ of occurrences) {
    if (!occ.groupId) continue
    const members = groupMembers.get(occ.groupId) ?? []
    members.push({ assetId: occ.assetId, date: occ.date })
    groupMembers.set(occ.groupId, members)
  }

  const invalidGroups = new Set<string>()
  for (const [groupId, members] of groupMembers) {
    const first = members[0]
    for (const m of members) {
      if (m.assetId !== first.assetId || m.date !== first.date) {
        console.warn('[fcd] Group violates constraint:', groupId)
        invalidGroups.add(groupId)
        break
      }
    }
  }

  const validatedOccurrences = occurrences.map(occ => {
    if (occ.groupId && invalidGroups.has(occ.groupId)) {
      return { ...occ, groupId: undefined }
    }
    return occ
  })

  return { assets, faultCodes, groups, occurrences: validatedOccurrences }
}

function makeBubbleKey(assetId: string, faultCode: string, date: string) {
  return `${assetId}|${faultCode}|${date}`
}
