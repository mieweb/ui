import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  CaseActivityTab,
  type CaseActivityEntry,
  type CaseActivityADAEntry,
} from './CaseActivityTab';

const meta: Meta<typeof CaseActivityTab> = {
  title: 'Components/Case Management/CaseActivityTab',
  component: CaseActivityTab,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const entries: CaseActivityEntry[] = [
  {
    id: '1',
    timestamp: '2025-09-06T10:00:00Z',
    action: 'updated',
    field: 'status',
    userName: 'Arlene Rosario, CPDM',
    description: 'Case status changed from Pending to Open',
  },
  {
    id: '2',
    timestamp: '2025-09-05T14:30:00Z',
    action: 'added',
    field: 'restriction',
    userName: 'Arlene Rosario, CPDM',
    description: 'Added restriction: Modified Workstation',
  },
  {
    id: '3',
    timestamp: '2025-09-01T09:00:00Z',
    action: 'created',
    field: 'case',
    userName: 'Arlene Rosario, CPDM',
    description: 'Case 20250901-ADA1 created',
  },
];

const adaTracking: CaseActivityADAEntry[] = [
  { date: '2025-09-01', status: 'Pending' },
  { date: '2025-09-06', status: 'Approved' },
];

export const Default: Story = {
  args: {
    entries,
  },
};

export const WithADATracking: Story = {
  args: {
    entries,
    adaTracking,
  },
};

export const Empty: Story = {
  args: {
    entries: [],
  },
};
