import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { PatternCard } from './PatternCard'
import type { FaultCode, Pattern, PatternOccurrence } from '../data/types'
import rawRows from '../data/story_fixtures.json'

// ── Date axis: actual period of the raw data ──────────────────────────────
const PERIOD_START = '2026-10-08'
const PERIOD_END   = '2026-11-08'

function buildDates(start: string, end: string): string[] {
  const dates: string[] = []
  const cur = new Date(`${start}T00:00:00Z`)
  const last = new Date(`${end}T00:00:00Z`)
  while (cur <= last) {
    dates.push(cur.toISOString().slice(0, 10))
    cur.setUTCDate(cur.getUTCDate() + 1)
  }
  return dates
}

const DATES = buildDates(PERIOD_START, PERIOD_END)

// ── Types matching the raw JSON ───────────────────────────────────────────
interface RawRow {
  date: string
  locomotive: string
  fault_code: string
  name: string
  occurences: number
  is_anomalous: boolean
  correlation_group_id: number
}

const rows = rawRows as RawRow[]

// ── Transform helpers ─────────────────────────────────────────────────────
function buildPattern(
  groupId: number,
  loco: string,
  ended = false,
): Pattern {
  const groupRows = rows.filter(r => r.correlation_group_id === groupId && r.locomotive === loco)
  const fcs = [...new Set(groupRows.map(r => r.fault_code))].sort()
  const dates = groupRows.map(r => r.date).sort()
  const startDate = dates[0]
  const lastDate  = dates[dates.length - 1]
  const id = `g${groupId}_${loco.replace(' ', '')}`
  return {
    id,
    assetId: loco.replace(' ', ''),
    faultCodes: fcs,
    startDate,
    ...(ended ? { endDate: lastDate } : {}),
  }
}

function buildOccurrences(pattern: Pattern, groupId: number): PatternOccurrence[] {
  return rows
    .filter(r => r.correlation_group_id === groupId)
    .map(r => ({
      patternId: pattern.id,
      faultCode: r.fault_code,
      date: r.date,
      count: r.occurences,
      status: (r.is_anomalous ? 'abnormal' : 'normal') as 'abnormal' | 'normal',
      correlationGroupId: r.correlation_group_id,
    }))
}

function buildFaultCodeMap(groupId: number): Map<string, FaultCode> {
  const map = new Map<string, FaultCode>()
  rows
    .filter(r => r.correlation_group_id === groupId)
    .forEach(r => map.set(r.fault_code, { code: r.fault_code, description: r.name }))
  return map
}

// ── Story data ────────────────────────────────────────────────────────────
// New: g32/485 003 — appeared 2026-10-07, only 2 days in view
const NEW_PATTERN  = buildPattern(32, '485 003')
const NEW_OCCS     = buildOccurrences(NEW_PATTERN, 32)
const NEW_FC_MAP   = buildFaultCodeMap(32)

// Ongoing: g137/485 011 — anomalous every day for the full 30-day period
const ONGOING_PATTERN = buildPattern(137, '485 011')
const ONGOING_OCCS    = buildOccurrences(ONGOING_PATTERN, 137)
const ONGOING_FC_MAP  = buildFaultCodeMap(137)

// Unclassified: g235/485 005 — active 2026-09-08→2026-09-26, ended before period end
const UNC_PATTERN  = buildPattern(235, '485 005', true)
const UNC_OCCS     = buildOccurrences(UNC_PATTERN, 235)
const UNC_FC_MAP   = buildFaultCodeMap(235)

const SHARED = {
  dates: DATES,
  labelStep: 5,
  fcColWidth: 200,
  onValidate: () => {},
  validation: undefined,
}

const meta = {
  component: PatternCard,
  tags: ['autodocs'],
  args: {
    ...SHARED,
    pattern: NEW_PATTERN,
    occurrences: NEW_OCCS,
    faultCodeMap: NEW_FC_MAP,
    status: 'new',
  },
} satisfies Meta<typeof PatternCard>

export default meta
type Story = StoryObj<typeof meta>

// 2-day cluster, all 3 FCs anomalous on their first appearance
export const New: Story = {
  play: async ({ canvas }) => {
    const firstCode = NEW_PATTERN.faultCodes[0]
    await expect(canvas.getByText(firstCode)).toBeVisible()
    await expect(canvas.getByText(NEW_FC_MAP.get(firstCode)!.description)).toBeVisible()
  },
}

// Anomalous every single day for 30 days — frame spans the full timeline
export const Ongoing: Story = {
  args: {
    pattern: ONGOING_PATTERN,
    occurrences: ONGOING_OCCS,
    faultCodeMap: ONGOING_FC_MAP,
    status: 'ongoing',
  },
}

// Active for 16 days then stopped — endDate set, frame ends mid-timeline
export const Unclassified: Story = {
  args: {
    pattern: UNC_PATTERN,
    occurrences: UNC_OCCS,
    faultCodeMap: UNC_FC_MAP,
    status: 'unclassified',
  },
}

export const ValidatedAbnormal: Story = {
  args: { validation: 'abnormal' },
}

export const ValidatedNormal: Story = {
  args: { validation: 'normal' },
}

export const ValidatedAbnormalOngoing: Story = {
  args: {
    pattern: ONGOING_PATTERN,
    occurrences: ONGOING_OCCS,
    faultCodeMap: ONGOING_FC_MAP,
    status: 'ongoing',
    validation: 'abnormal',
  },
}
