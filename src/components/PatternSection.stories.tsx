import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { PatternSection } from './PatternSection'
import type { FaultCode, Pattern, PatternOccurrence } from '../data/types'
import { transformRawOccurrences, type RawOccurrence } from '../data/loader'
import rawRows from '../../public/data/fc_occurences.json'

const DATA = transformRawOccurrences(rawRows as RawOccurrence[])

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

const faultCodeMap = new Map<string, FaultCode>(
  DATA.faultCodes.map((fc: FaultCode) => [fc.code, fc])
)

// Curated pattern IDs per status category
const NEW_IDS = ['g14', 'g10', 'g5', 'g55']
const ONGOING_IDS = ['g123', 'g51', 'g34', 'g117', 'g126', 'g129']
const UNCLASSIFIED_IDS = DATA.patterns
  .filter((p: Pattern) => !!p.endDate)
  .map((p: Pattern) => p.id)

function pickPatterns(ids: string[]): Pattern[] {
  return ids
    .map((id) => DATA.patterns.find((p: Pattern) => p.id === id))
    .filter((p): p is Pattern => p != null)
}

function pickOccurrences(patterns: Pattern[]): PatternOccurrence[] {
  const ids = new Set(patterns.map((p: Pattern) => p.id))
  return DATA.occurrences.filter((o: PatternOccurrence) => ids.has(o.patternId))
}

const NEW_PATTERNS = pickPatterns(NEW_IDS)
const ONGOING_PATTERNS = pickPatterns(ONGOING_IDS)
const UNCLASSIFIED_PATTERNS = pickPatterns(UNCLASSIFIED_IDS)

const SHARED = {
  faultCodeMap,
  dates: DATES,
  labelStep: 5,
  fcColWidth: 200,
  patternValidations: {},
  onValidate: () => {},
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
    patterns: NEW_PATTERNS,
    occurrences: pickOccurrences(NEW_PATTERNS),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('New')).toBeVisible()
    await expect(canvas.getByText(`(${NEW_PATTERNS.length})`)).toBeVisible()
  },
}

export const OngoingPatterns: Story = {
  args: {
    ...SHARED,
    title: 'Ongoing',
    status: 'ongoing',
    patterns: ONGOING_PATTERNS,
    occurrences: pickOccurrences(ONGOING_PATTERNS),
  },
}

export const UnclassifiedPatterns: Story = {
  args: {
    ...SHARED,
    title: 'Unclassified',
    status: 'unclassified',
    patterns: UNCLASSIFIED_PATTERNS,
    occurrences: pickOccurrences(UNCLASSIFIED_PATTERNS),
  },
}
