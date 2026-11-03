import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { PatternSection } from './PatternSection'
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

const DATES = makeDates(30)

const FAULT_CODE_MAP = new Map<string, FaultCode>([
  ['FC001', { code: 'FC001', description: 'Brake pressure anomaly' }],
  ['FC002', { code: 'FC002', description: 'Engine temperature exceeded' }],
  ['FC003', { code: 'FC003', description: 'Door sensor malfunction' }],
])

const PATTERNS: Pattern[] = [
  { id: 'p1', assetId: 'a1', faultCodes: ['FC001', 'FC002'], startDate: '2026-10-15' },
  { id: 'p2', assetId: 'a1', faultCodes: ['FC003'], startDate: '2026-10-28' },
]

const OCCURRENCES: PatternOccurrence[] = [
  { patternId: 'p1', faultCode: 'FC001', date: '2026-10-20', count: 3, status: 'abnormal' },
  { patternId: 'p1', faultCode: 'FC002', date: '2026-10-22', count: 2, status: 'abnormal' },
  { patternId: 'p2', faultCode: 'FC003', date: '2026-11-01', count: 1, status: 'abnormal' },
]

const SHARED = {
  faultCodeMap: FAULT_CODE_MAP,
  occurrences: OCCURRENCES,
  dates: DATES,
  labelStep: 5,
  fcColWidth: 200,
  patternValidations: {},
  ignoredPatterns: new Set<string>(),
  onValidate: () => {},
  onIgnore: () => {},
}

const meta = {
  component: PatternSection,
  tags: ['ai-generated'],
} satisfies Meta<typeof PatternSection>

export default meta
type Story = StoryObj<typeof meta>

export const NewPatterns: Story = {
  args: {
    ...SHARED,
    title: 'New',
    status: 'new',
    patterns: PATTERNS,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('New')).toBeVisible()
    await expect(canvas.getByText('(2)')).toBeVisible()
  },
}

export const OngoingPatterns: Story = {
  args: {
    ...SHARED,
    title: 'Ongoing',
    status: 'ongoing',
    patterns: [PATTERNS[0]],
  },
}

export const UnclassifiedPatterns: Story = {
  args: {
    ...SHARED,
    title: 'Unclassified',
    status: 'unclassified',
    patterns: [{ ...PATTERNS[0], endDate: '2026-10-30' }],
  },
}
