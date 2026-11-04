import type { Meta, StoryObj } from '@storybook/react-vite'
import { InspectAssetRow, INSPECT_LEFT_WIDTH } from './InspectAssetRow'
import { getDatesInRange, formatAxisLabel } from '../lib/dates'
import type { Asset, Pattern, FaultCode, PatternOccurrence } from '../data/types'

const DATES = getDatesInRange('2026-10-03', '2026-11-03')

const FAULT_CODE_MAP = new Map<string, FaultCode>([
  ['A001', { code: 'A001', description: 'Traction inverter fault' }],
  ['B012', { code: 'B012', description: 'Pantograph pressure low' }],
  ['C034', { code: 'C034', description: 'Door control unit timeout' }],
  ['D007', { code: 'D007', description: 'Brake pressure sensor' }],
  ['E021', { code: 'E021', description: 'HVAC compressor fault' }],
])

function makeOccs(patternId: string, faultCode: string, dates: string[]): PatternOccurrence[] {
  return dates.map(date => ({
    patternId,
    faultCode,
    date,
    count: Math.floor(Math.random() * 5) + 1,
    status: 'abnormal' as const,
    correlationGroupId: parseInt(patternId.replace('p', '')),
  }))
}

const ASSETS: Asset[] = [
  { id: 'a1', label: '485 001' },
  { id: 'a2', label: '485 002' },
  { id: 'a3', label: '485 003' },
  { id: 'a4', label: '485 004' },
]

const PATTERNS: Pattern[] = [
  // 485 001 — new (no endDate) + ongoing
  { id: 'p1', assetId: 'a1', faultCodes: ['A001', 'B012'], startDate: '2026-10-20' },
  { id: 'p2', assetId: 'a1', faultCodes: ['C034'], startDate: '2026-10-05', endDate: '2026-10-18' },
  // 485 002 — ongoing only
  { id: 'p3', assetId: 'a2', faultCodes: ['D007'], startDate: '2026-09-15' },
  { id: 'p4', assetId: 'a2', faultCodes: ['E021', 'B012'], startDate: '2026-10-10' },
  // 485 003 — new, multi fault code
  { id: 'p5', assetId: 'a3', faultCodes: ['A001', 'C034', 'D007'], startDate: '2026-10-25' },
  // 485 004 — unclassified (all ended)
  { id: 'p6', assetId: 'a4', faultCodes: ['B012'], startDate: '2026-10-03', endDate: '2026-10-12' },
  { id: 'p7', assetId: 'a4', faultCodes: ['E021'], startDate: '2026-10-14', endDate: '2026-10-22' },
]

// lastSessionAt 7 days before today → patterns starting after that are "new"
const LAST_SESSION = new Date('2026-10-27T00:00:00Z').toISOString()

function deriveStatus(p: Pattern) {
  if (p.endDate) return 'unclassified' as const
  const sessionDate = LAST_SESSION.slice(0, 10)
  return p.startDate >= sessionDate ? 'new' as const : 'ongoing' as const
}

const OCCURRENCES: PatternOccurrence[] = [
  ...makeOccs('p1', 'A001', ['2026-10-20', '2026-10-21', '2026-10-23', '2026-10-25', '2026-10-28', '2026-10-30', '2026-11-01', '2026-11-03']),
  ...makeOccs('p1', 'B012', ['2026-10-20', '2026-10-22', '2026-10-24', '2026-10-27', '2026-10-29', '2026-11-02']),
  ...makeOccs('p2', 'C034', ['2026-10-05', '2026-10-07', '2026-10-09', '2026-10-11', '2026-10-14', '2026-10-16', '2026-10-18']),
  ...makeOccs('p3', 'D007', ['2026-10-04', '2026-10-07', '2026-10-10', '2026-10-13', '2026-10-16', '2026-10-19', '2026-10-22', '2026-10-25', '2026-10-28', '2026-10-31', '2026-11-03']),
  ...makeOccs('p4', 'E021', ['2026-10-10', '2026-10-12', '2026-10-15', '2026-10-18', '2026-10-21', '2026-10-24']),
  ...makeOccs('p4', 'B012', ['2026-10-11', '2026-10-14', '2026-10-17', '2026-10-20', '2026-10-23']),
  ...makeOccs('p5', 'A001', ['2026-10-25', '2026-10-27', '2026-10-29', '2026-10-31', '2026-11-02']),
  ...makeOccs('p5', 'C034', ['2026-10-26', '2026-10-28', '2026-10-30', '2026-11-01']),
  ...makeOccs('p5', 'D007', ['2026-10-25', '2026-10-28', '2026-10-31']),
  ...makeOccs('p6', 'B012', ['2026-10-04', '2026-10-06', '2026-10-08', '2026-10-10', '2026-10-12']),
  ...makeOccs('p7', 'E021', ['2026-10-15', '2026-10-17', '2026-10-19', '2026-10-21']),
]

const meta = {
  component: InspectAssetRow,
  parameters: { layout: 'padded' },
  args: {
    faultCodeMap: FAULT_CODE_MAP,
    occurrences: OCCURRENCES,
    dates: DATES,
    deriveStatus,
  },
} satisfies Meta<typeof InspectAssetRow>

export default meta
type Story = StoryObj<typeof meta>

export const AssetNew: Story = {
  name: '485 001 — new + unclassified',
  args: {
    asset: ASSETS[0],
    patterns: PATTERNS.filter(p => p.assetId === 'a1'),
  },
}

export const AssetOngoing: Story = {
  name: '485 002 — ongoing',
  args: {
    asset: ASSETS[1],
    patterns: PATTERNS.filter(p => p.assetId === 'a2'),
  },
}

export const AssetMultiFaultCode: Story = {
  name: '485 003 — new, 3 fault codes',
  args: {
    asset: ASSETS[2],
    patterns: PATTERNS.filter(p => p.assetId === 'a3'),
  },
}

export const AssetUnclassified: Story = {
  name: '485 004 — unclassified',
  args: {
    asset: ASSETS[3],
    patterns: PATTERNS.filter(p => p.assetId === 'a4'),
  },
}

export const AllAssets: Story = {
  name: 'All assets stacked',
  parameters: { layout: 'fullscreen' },
  render: (args) => {
    const labelStep = DATES.length <= 7 ? 1 : DATES.length <= 14 ? 2 : 5
    return (
      <div style={{ background: '#0B0B10', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Timeline header */}
        <div style={{
          height: 36, flexShrink: 0, display: 'flex',
          background: '#0F0F16', borderBottom: '1px solid #1E1E28',
        }}>
          <div style={{
            width: INSPECT_LEFT_WIDTH, flexShrink: 0,
            borderRight: '1px solid #1A1A26',
            display: 'flex', alignItems: 'center', padding: '0 14px',
          }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: '#2A2A3C', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Fault code</span>
          </div>
          <div style={{ flex: 1, position: 'relative' }}>
            <svg width="100%" height="100%" style={{ display: 'block' }}>
              {DATES.map((date, i) => {
                const isFirst = i === 0, isLast = i === DATES.length - 1
                if (!isFirst && !isLast && i % labelStep !== 0) return null
                const x = `${((i + 0.5) / DATES.length) * 100}%`
                return (
                  <text key={date} x={x} y="50%" dominantBaseline="middle" textAnchor="middle" fontSize={10} fill="#4A4A62">
                    {formatAxisLabel(date)}
                  </text>
                )
              })}
            </svg>
          </div>
        </div>

        {/* Asset rows */}
        <div style={{ padding: '12px 16px' }}>
          {ASSETS.map(asset => (
            <InspectAssetRow
              key={asset.id}
              {...args}
              asset={asset}
              patterns={PATTERNS.filter(p => p.assetId === asset.id)}
            />
          ))}
        </div>
      </div>
    )
  },
  args: {},
}
