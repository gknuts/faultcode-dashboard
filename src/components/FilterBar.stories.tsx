import type { Meta, StoryObj } from '@storybook/react-vite'
import FilterBar from './FilterBar'

const meta = {
  component: FilterBar,
  tags: ['ai-generated'],
  args: {
    view: '1M',
    onSetView: () => {},
    onSimulateSession: () => {},
    panelMode: 'dashboard',
    onSetPanelMode: () => {},
    newCount: 3,
    ongoingCount: 7,
  },
} satisfies Meta<typeof FilterBar>

export default meta
type Story = StoryObj<typeof meta>

export const DashboardMode: Story = {
  args: { panelMode: 'dashboard' },
}

export const InspectMode: Story = {
  args: { panelMode: 'inspect' },
}
