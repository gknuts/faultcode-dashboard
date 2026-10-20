import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TODAY = '2026-10-20'

function dateRange(start, end) {
  const dates = []
  let d = new Date(start + 'T00:00:00Z')
  const endDate = new Date(end + 'T00:00:00Z')
  while (d <= endDate) {
    dates.push(d.toISOString().slice(0, 10))
    d = new Date(d.getTime() + 86400000)
  }
  return dates
}

const PERIOD_START = '2026-09-20' // 30 days before TODAY

function generateOccurrences(patternId, faultCodes, _startDate, endDate) {
  // Occurrences cover the full visible period so timeline always looks populated
  const end = endDate || TODAY
  const dates = dateRange(PERIOD_START, end)
  const occs = []
  // Use a simple deterministic pseudo-random based on patternId hash
  const seed = patternId.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  for (const [fi, faultCode] of faultCodes.entries()) {
    for (const [di, date] of dates.entries()) {
      // Deterministic pseudo-random for variety
      const r1 = (seed * 31 + di * 17 + fi * 53) % 97
      const r2 = (seed * 13 + di * 41 + fi * 7) % 89
      // Skip ~15% of days
      if (r1 < 14) continue
      const isAbnormal = r2 < 38
      occs.push({
        patternId,
        faultCode,
        date,
        count: isAbnormal ? 1 + (r1 % 5) : 1,
        status: isAbnormal ? 'abnormal' : 'normal',
      })
    }
  }
  return occs
}

const assets = [
  { id: '485001', label: '485 001' },
  { id: '485002', label: '485 002' },
  { id: '485003', label: '485 003' },
  { id: '485004', label: '485 004' },
  { id: '485005', label: '485 005' },
  { id: '485008', label: '485 008' },
  { id: '485009', label: '485 009' },
  { id: '485010', label: '485 010' },
  { id: '485011', label: '485 011' },
  { id: '485012', label: '485 012' },
  { id: '485013', label: '485 013' },
  { id: '485014', label: '485 014' },
]

const faultCodes = [
  { code: '0686', description: 'Coolant temperature exceeded' },
  { code: '281F', description: 'Pressure / Temp / Viscosity individual values' },
  { code: '0402', description: 'ADB failure (nominal speed)' },
  { code: '04A4', description: 'Auto-test failure TCS1' },
  { code: '04A5', description: 'Auto-test failure TCS2' },
  { code: '0416', description: 'Smoke detector SR1 fault' },
  { code: '047B', description: 'Doors button plausibility DC1' },
  { code: '047D', description: 'Doors button plausibility DC2' },
]

const patterns = [
  // 485001: 1 new, 2 ongoing, 1 resolved
  { id: 'p01_new', assetId: '485001', faultCodes: ['0686', '281F'], startDate: '2026-10-19' },
  { id: 'p01_on1', assetId: '485001', faultCodes: ['0402'], startDate: '2026-09-15' },
  { id: 'p01_on2', assetId: '485001', faultCodes: ['04A4', '04A5'], startDate: '2026-10-01' },
  { id: 'p01_res', assetId: '485001', faultCodes: ['0416'], startDate: '2026-08-01', endDate: '2026-09-10' },

  // 485002: 2 new, 1 ongoing
  { id: 'p02_new1', assetId: '485002', faultCodes: ['0686', '281F'], startDate: '2026-10-20' },
  { id: 'p02_new2', assetId: '485002', faultCodes: ['047B', '047D'], startDate: '2026-10-18' },
  { id: 'p02_on1', assetId: '485002', faultCodes: ['0402'], startDate: '2026-09-20' },

  // 485003: 1 ongoing
  { id: 'p03_on1', assetId: '485003', faultCodes: ['0686'], startDate: '2026-09-25' },

  // 485004: 2 ongoing
  { id: 'p04_on1', assetId: '485004', faultCodes: ['04A4', '04A5'], startDate: '2026-09-10' },
  { id: 'p04_on2', assetId: '485004', faultCodes: ['0416'], startDate: '2026-10-05' },

  // 485005: 1 new, 2 ongoing
  { id: 'p05_new1', assetId: '485005', faultCodes: ['0686', '281F'], startDate: '2026-10-19' },
  { id: 'p05_on1', assetId: '485005', faultCodes: ['0402'], startDate: '2026-09-01' },
  { id: 'p05_on2', assetId: '485005', faultCodes: ['047B'], startDate: '2026-10-08' },

  // 485008: 1 new, 1 ongoing
  { id: 'p08_new1', assetId: '485008', faultCodes: ['04A4', '04A5'], startDate: '2026-10-19' },
  { id: 'p08_on1', assetId: '485008', faultCodes: ['0686', '281F'], startDate: '2026-09-15' },

  // 485009: 2 ongoing
  { id: 'p09_on1', assetId: '485009', faultCodes: ['0686', '281F'], startDate: '2026-09-20' },
  { id: 'p09_on2', assetId: '485009', faultCodes: ['0402'], startDate: '2026-10-01' },

  // 485010: 2 ongoing
  { id: 'p10_on1', assetId: '485010', faultCodes: ['04A4', '04A5'], startDate: '2026-09-15' },
  { id: 'p10_on2', assetId: '485010', faultCodes: ['0416'], startDate: '2026-09-25' },

  // 485011: 2 ongoing
  { id: 'p11_on1', assetId: '485011', faultCodes: ['0686', '281F'], startDate: '2026-09-10' },
  { id: 'p11_on2', assetId: '485011', faultCodes: ['047D'], startDate: '2026-09-20' },

  // 485012: 2 ongoing
  { id: 'p12_on1', assetId: '485012', faultCodes: ['0402'], startDate: '2026-10-01' },
  { id: 'p12_on2', assetId: '485012', faultCodes: ['04A4', '04A5'], startDate: '2026-09-15' },

  // 485013: 2 ongoing
  { id: 'p13_on1', assetId: '485013', faultCodes: ['0686', '281F'], startDate: '2026-09-05' },
  { id: 'p13_on2', assetId: '485013', faultCodes: ['0416'], startDate: '2026-09-15' },

  // 485014: 2 ongoing
  { id: 'p14_on1', assetId: '485014', faultCodes: ['04A4', '04A5'], startDate: '2026-09-20' },
  { id: 'p14_on2', assetId: '485014', faultCodes: ['047B', '047D'], startDate: '2026-10-05' },
]

const occurrences = patterns.flatMap(p =>
  generateOccurrences(p.id, p.faultCodes, p.startDate, p.endDate)
)

const data = { assets, faultCodes, patterns, occurrences }
const outPath = join(__dirname, '..', 'public', 'data', 'patterns.json')
writeFileSync(outPath, JSON.stringify(data))
console.log(`Written ${patterns.length} patterns, ${occurrences.length} occurrences → ${outPath}`)
