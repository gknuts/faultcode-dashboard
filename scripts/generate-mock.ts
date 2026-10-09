// Run: npx tsx scripts/generate-mock.ts > public/data/faults.json

import { format, subDays, addDays } from 'date-fns'

const ASSET_COUNT = 25
const FAULT_CODE_COUNT = 120  // distributed among assets, not all per asset
// Range: today-74 to today+15 = 90 days, covers centered 1M view (±15 days)
const DAYS_BEFORE = 74
const DAYS_AFTER = 15
const OCCURRENCE_RATE = 0.4
const ABNORMAL_RATE = 0.3

function today(): Date {
  return new Date()
}

function isoDate(d: Date): string {
  return format(d, 'yyyy-MM-dd')
}

// Simple seeded hash for stable colors
function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

const faultDescriptions = [
  'Temperature sensor urgency', 'Brake pressure anomaly', 'Door control unit fault',
  'MMI bus failure (reception)', 'Meld Druck/Temp/Vist-Einzelwerte', 'Axle speed mismatch',
  'Pantograph position fault', 'Air compressor overload', 'TCMS communication loss',
  'Emergency brake activation', 'Wheel slip detection', 'Traction motor fault',
  'Battery voltage low', 'Auxiliary power failure', 'Door obstruction detected',
  'Bogie vibration anomaly', 'Cooling fan failure', 'Pressure transducer fault',
  'Coupler latch error', 'HVAC unit fault',
]

const assets = Array.from({ length: ASSET_COUNT }, (_, i) => {
  const base = 485000 + i + 1
  return { id: String(base), label: `${Math.floor(base / 1000)} ${String(base % 1000).padStart(3, '0')}` }
})

const faultCodes = Array.from({ length: FAULT_CODE_COUNT }, (_, i) => {
  const hex = (0x1000 + i).toString(16).toUpperCase().slice(-4)
  const desc = faultDescriptions[i % faultDescriptions.length] + (i >= faultDescriptions.length ? ` (${Math.floor(i / faultDescriptions.length)})` : '')
  return { code: hex, description: desc }
})

interface Group { id: string; color?: string }
const groups: Group[] = []

const t = today()

// Distribute fault codes among assets: each asset gets between 8 and 40 codes
// Total pool = 120 codes; distribution is stable (hash-based)
const assetFaultCodes = new Map<string, string[]>()
for (const asset of assets) {
  // Pick 3–7 codes per asset, stable via sort-by-hash then take top N
  const assetHash = hash(asset.id + 'codes')
  const count = 3 + (assetHash % 5) // 3 to 7
  const sorted = [...faultCodes].sort((a, b) =>
    hash(asset.id + a.code + 'assign') - hash(asset.id + b.code + 'assign')
  )
  assetFaultCodes.set(asset.id, sorted.slice(0, count).map(fc => fc.code))
}

// Generate occurrences
interface Occurrence {
  assetId: string
  faultCode: string
  date: string
  count: number
  status: 'abnormal' | 'normal'
  groupId?: string
}

const occurrences: Occurrence[] = []
let groupCounter = 0

for (const asset of assets) {
  const assignedCodes = assetFaultCodes.get(asset.id)!

  const totalDays = DAYS_BEFORE + DAYS_AFTER + 1
  for (let d = 0; d < totalDays; d++) {
    const date = isoDate(addDays(subDays(t, DAYS_BEFORE), d))

    // Decide which of the asset's assigned codes fire this day
    const firedCodes: string[] = []
    for (const code of assignedCodes) {
      const h = hash(asset.id + code + date)
      if ((h % 1000) / 1000 < OCCURRENCE_RATE) {
        firedCodes.push(code)
      }
    }

    if (firedCodes.length === 0) continue

    // Maybe create a group from 2-3 of the fired codes
    let currentGroupId: string | undefined
    const groupH = hash(asset.id + date + 'group')
    if (firedCodes.length >= 2 && (groupH % 100) < 5) {
      groupCounter++
      currentGroupId = `g${groupCounter}`
      groups.push({ id: currentGroupId })
    }

    for (let i = 0; i < firedCodes.length; i++) {
      const code = firedCodes[i]
      const countH = hash(asset.id + code + date)
      const rand = (countH % 100) / 100
      const count = Math.max(1, Math.round(1 + 49 * Math.pow(1 - rand, 2)))

      const statusH = hash(asset.id + code + date + 'status')
      const status: 'abnormal' | 'normal' = (statusH % 100) / 100 < ABNORMAL_RATE ? 'abnormal' : 'normal'

      const occ: Occurrence = { assetId: asset.id, faultCode: code, date, count, status }

      if (currentGroupId && i < 3) {
        occ.groupId = currentGroupId
      }

      occurrences.push(occ)
    }
  }
}

const output = { assets, faultCodes, groups, occurrences }
console.log(JSON.stringify(output, null, 2))
