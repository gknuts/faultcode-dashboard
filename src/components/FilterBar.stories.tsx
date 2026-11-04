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
  args: {
    panelMode: 'inspect',
    inspectStart: '2026-10-03',
    inspectEnd: '2026-11-03',
    onNavigateInspect: () => {},
    assets: [
      { id: '1', label: '485 001' },
      { id: '2', label: '485 002' },
      { id: '3', label: '485 003' },
    ],
    faultCodes: [
      { code: 'A001', description: 'Traction inverter fault' },
      { code: 'B012', description: 'Pantograph pressure low' },
      { code: 'C034', description: 'Door control unit timeout' },
    ],
    inspectAssetIds: [],
    inspectFaultCodes: [],
    onSetInspectAssetIds: () => {},
    onSetInspectFaultCodes: () => {},
  },
}
