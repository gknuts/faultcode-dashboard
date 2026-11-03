import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import FilterBar from './FilterBar'

const meta = {
  component: FilterBar,
  tags: ['ai-generated'],
  args: {
    view: '1M',
    onSetView: () => {},
    onSimulateSession: () => {},
  },
} satisfies Meta<typeof FilterBar>

export default meta
type Story = StoryObj<typeof meta>

export const MonthView: Story = {
  play: async ({ canvas }) => {
    const activeBtn = canvas.getByRole('button', { name: '1M' })
    await expect(getComputedStyle(activeBtn).backgroundColor).toBe('rgb(108, 75, 245)')
  },
}

export const WeekView: Story = {
  args: { view: '1W' },
}

export const ThreeDayView: Story = {
  args: { view: '3D' },
}
