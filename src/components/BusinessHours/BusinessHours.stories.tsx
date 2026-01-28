import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  BusinessHours,
  CompactHours,
  HoursSummary,
  OpenStatusBadge,
  type BusinessHoursSchedule,
} from './BusinessHours';

// Sample data
const standardSchedule: BusinessHoursSchedule = {
  officeHours: [
    { day: 0, hours: [] },
    { day: 1, hours: [{ start: '08:00', end: '17:00' }] },
    { day: 2, hours: [{ start: '08:00', end: '17:00' }] },
    { day: 3, hours: [{ start: '08:00', end: '17:00' }] },
    { day: 4, hours: [{ start: '08:00', end: '17:00' }] },
    { day: 5, hours: [{ start: '08:00', end: '17:00' }] },
    { day: 6, hours: [] },
  ],
};

const splitShiftSchedule: BusinessHoursSchedule = {
  officeHours: [
    { day: 0, hours: [] },
    {
      day: 1,
      hours: [
        { start: '08:00', end: '12:00' },
        { start: '13:00', end: '17:00' },
      ],
    },
    {
      day: 2,
      hours: [
        { start: '08:00', end: '12:00' },
        { start: '13:00', end: '17:00' },
      ],
    },
    {
      day: 3,
      hours: [
        { start: '08:00', end: '12:00' },
        { start: '13:00', end: '17:00' },
      ],
    },
    {
      day: 4,
      hours: [
        { start: '08:00', end: '12:00' },
        { start: '13:00', end: '17:00' },
      ],
    },
    {
      day: 5,
      hours: [
        { start: '08:00', end: '12:00' },
        { start: '13:00', end: '17:00' },
      ],
    },
    { day: 6, hours: [] },
  ],
};

const textOnlySchedule: BusinessHoursSchedule = {
  officeHoursText: `Monday - Friday: 8:00 AM - 5:00 PM
Saturday: 9:00 AM - 1:00 PM
Sunday: Closed`,
};

const meta: Meta<typeof BusinessHours> = {
  title: 'Provider Directory/BusinessHours',
  component: BusinessHours,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'card', 'compact', 'inline'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    showStatus: { control: 'boolean' },
    highlightToday: { control: 'boolean' },
    use24Hour: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof BusinessHours>;

// Default full schedule display
export const Default: Story = {
  args: {
    schedule: standardSchedule,
    showStatus: true,
    highlightToday: true,
    showHeader: true,
  },
};

// Card variant (for sidebars)
export const CardVariant: Story = {
  args: {
    schedule: standardSchedule,
    variant: 'card',
  },
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
};

// Split shifts (lunch break)
export const SplitShifts: Story = {
  args: {
    schedule: splitShiftSchedule,
  },
};

// Text-only when structured hours unavailable
export const TextOnly: Story = {
  args: {
    schedule: textOnlySchedule,
  },
};

// Compact single-line for cards
export const Compact: StoryObj<typeof CompactHours> = {
  render: () => (
    <div className="space-y-4">
      <div className="rounded-lg border p-4 dark:border-gray-700">
        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
          Standard hours
        </p>
        <CompactHours schedule={standardSchedule} />
      </div>
      <div className="rounded-lg border p-4 dark:border-gray-700">
        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
          No hours available
        </p>
        <CompactHours schedule={{}} />
      </div>
    </div>
  ),
};

// Expandable summary widget
export const ExpandableSummary: StoryObj<typeof HoursSummary> = {
  render: () => (
    <div className="max-w-md">
      <HoursSummary schedule={standardSchedule} />
    </div>
  ),
};

// Open/Closed status badges
export const StatusBadges: StoryObj<typeof OpenStatusBadge> = {
  render: () => (
    <div className="flex gap-4">
      <OpenStatusBadge isOpen={true} />
      <OpenStatusBadge isOpen={false} />
    </div>
  ),
};
