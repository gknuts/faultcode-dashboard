import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { PatternCard } from './PatternCard'
import type { FaultCode, Pattern, PatternOccurrence } from '../data/types'
import rawData from '../../public/data/patterns.json'

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

const faultCodeMap = new Map<string, FaultCode>(
  rawData.faultCodes.map((fc) => [fc.code, fc as FaultCode])
)

function pickPattern(id: string): Pattern {
  const p = rawData.patterns.find((p) => p.id === id)
  if (!p) throw new Error(`Pattern ${id} not found`)
  return p as Pattern
}

function pickOccurrences(pattern: Pattern): PatternOccurrence[] {
  return (rawData.occurrences as PatternOccurrence[]).filter(
    (o) => o.patternId === pattern.id
  )
}

const NEW_PATTERN = pickPattern('g14_485014')
const ONGOING_PATTERN = pickPattern('g123_485003')
const UNCLASSIFIED_PATTERN = (rawData.patterns as Pattern[]).find((p) => !!p.endDate)!

const SHARED = {
  faultCodeMap,
  dates: DATES_30,
  labelStep: 5,
  fcColWidth: 200,
  onValidate: () => {},
}

const meta = {
  component: PatternCard,
  tags: ['ai-generated'],
  args: {
    ...SHARED,
    pattern: NEW_PATTERN,
    occurrences: pickOccurrences(NEW_PATTERN),
    status: 'new',
    validation: undefined,
    isIgnored: false,
  },
} satisfies Meta<typeof PatternCard>

export default meta
type Story = StoryObj<typeof meta>

export const New: Story = {
  play: async ({ canvas }) => {
    const firstCode = NEW_PATTERN.faultCodes[0]
    await expect(canvas.getByText(firstCode)).toBeVisible()
    await expect(canvas.getByText(faultCodeMap.get(firstCode)!.description)).toBeVisible()
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
    pattern: ONGOING_PATTERN,
    occurrences: pickOccurrences(ONGOING_PATTERN),
    status: 'ongoing',
  },
}

export const Unclassified: Story = {
  args: {
    pattern: UNCLASSIFIED_PATTERN,
    occurrences: pickOccurrences(UNCLASSIFIED_PATTERN),
    status: 'unclassified',
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
