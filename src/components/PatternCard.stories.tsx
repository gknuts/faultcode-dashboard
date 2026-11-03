import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { PatternCard } from './PatternCard'
import type { FaultCode, Pattern, PatternOccurrence } from '../data/types'

function makeDates(count: number): string[] {
  const dates: string[] = []
  const end = new Date('2026-11-03T12:00:00Z')
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(end)
    d.setUTCDate(d.getUTCDate() - i)
    dates.push(d.toISOString().slice(0, 10))
  }
  return dates
}

const DATES_30 = makeDates(30)

const FAULT_CODE_MAP = new Map<string, FaultCode>([
  ['FC001', { code: 'FC001', description: 'Brake pressure anomaly detected' }],
  ['FC002', { code: 'FC002', description: 'Engine temperature threshold exceeded' }],
])

const PATTERN: Pattern = {
  id: 'p1',
  assetId: 'a1',
  faultCodes: ['FC001', 'FC002'],
  startDate: '2026-10-15',
}

const OCCURRENCES: PatternOccurrence[] = [
  { patternId: 'p1', faultCode: 'FC001', date: '2026-10-20', count: 3, status: 'abnormal' },
  { patternId: 'p1', faultCode: 'FC001', date: '2026-10-25', count: 1, status: 'normal' },
  { patternId: 'p1', faultCode: 'FC001', date: '2026-11-01', count: 5, status: 'abnormal' },
  { patternId: 'p1', faultCode: 'FC002', date: '2026-10-22', count: 2, status: 'abnormal' },
  { patternId: 'p1', faultCode: 'FC002', date: '2026-10-28', count: 1, status: 'abnormal' },
]

const SHARED = {
  faultCodeMap: FAULT_CODE_MAP,
  occurrences: OCCURRENCES,
  dates: DATES_30,
  labelStep: 5,
  fcColWidth: 200,
  onValidate: () => {},
  onIgnore: () => {},
}

const meta = {
  component: PatternCard,
  tags: ['ai-generated'],
  args: {
    ...SHARED,
    pattern: PATTERN,
    status: 'new',
    validation: undefined,
    isIgnored: false,
  },
} satisfies Meta<typeof PatternCard>

export default meta
type Story = StoryObj<typeof meta>

export const New: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('FC001')).toBeVisible()
    await expect(canvas.getByText('Brake pressure anomaly detected')).toBeVisible()
  },
}

// Proves index.css loaded — --bg-app is defined only if the CSS file imported correctly
export const CssCheck: Story = {
  play: async ({ canvasElement }) => {
    const root = canvasElement.ownerDocument.documentElement
    await expect(getComputedStyle(root).getPropertyValue('--bg-app').trim()).toBe('#000000')
  },
}

export const Ongoing: Story = {
  args: {
    pattern: { ...PATTERN, startDate: '2026-09-01' },
    status: 'ongoing',
  },
}

export const Resolved: Story = {
  args: {
    pattern: { ...PATTERN, startDate: '2026-10-01', endDate: '2026-10-30' },
    status: 'resolved',
  },
}

export const ValidatedAbnormal: Story = {
  args: { validation: 'abnormal' },
}

export const ValidatedNormal: Story = {
  args: { validation: 'normal' },
}

export const Ignored: Story = {
  args: {
    status: 'ignored',
    isIgnored: true,
  },
}
