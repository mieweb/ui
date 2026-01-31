import type { Meta, StoryObj } from '@storybook/react';
import { useEffect, useState } from 'react';
import {
  BusinessHoursEditor,
  DaySchedule,
  createDefaultSchedule,
  create24HourSchedule,
  createWeekdaySchedule,
} from './BusinessHoursEditor';

const meta: Meta<typeof BusinessHoursEditor> = {
  title: 'Components/BusinessHoursEditor',
  component: BusinessHoursEditor,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'An editable interface for managing business hours with support for multiple time slots per day, descriptions, and copy functionality.',
      },
    },
  },
  argTypes: {
    // Hide props that are managed by the demo wrapper
    value: { table: { disable: true } },
    onChange: { table: { disable: true } },
    className: { table: { disable: true } },
    // use24Hour is not implemented in the component (native time inputs use browser locale)
    use24Hour: { table: { disable: true } },

    disabled: {
      control: 'boolean',
      description: 'Whether the editor is disabled',
    },
    showDescription: {
      control: 'boolean',
      description: 'Whether to show description field for each time slot',
    },
    weekStartsOn: {
      control: 'radio',
      options: [0, 1],
      description: 'Starting day of week (0 = Sunday, 1 = Monday)',
    },
    addHoursLabel: {
      control: 'text',
      description: 'Label for add hours button',
    },
  },
  args: {
    disabled: false,
    showDescription: true,
    weekStartsOn: 0,
    addHoursLabel: 'Add Hours',
  },
};

export default meta;
type Story = StoryObj<typeof BusinessHoursEditor>;

// Interactive wrapper
function BusinessHoursEditorWrapper({
  value: initialValue,
  onChange: _,
  ...restProps
}: Partial<React.ComponentProps<typeof BusinessHoursEditor>>) {
  const [schedule, setSchedule] = useState<DaySchedule[]>(
    initialValue || createDefaultSchedule()
  );

  // Sync schedule state when initialValue changes (e.g., from Storybook controls)
  useEffect(() => {
    if (initialValue !== undefined) {
      setSchedule(initialValue);
    }
  }, [initialValue]);

  return (
    <div className="max-w-2xl">
      <BusinessHoursEditor
        {...restProps}
        value={schedule}
        onChange={setSchedule}
      />

      <div className="mt-6 rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
        <h4 className="mb-2 text-sm font-medium">Current Schedule:</h4>
        <pre className="max-h-48 overflow-auto text-xs">
          {JSON.stringify(schedule, null, 2)}
        </pre>
      </div>
    </div>
  );
}

export const Default: Story = {
  render: (args) => <BusinessHoursEditorWrapper {...args} />,
};

export const Empty: Story = {
  render: (args) => <BusinessHoursEditorWrapper {...args} />,
  args: {
    value: [],
  },
};

export const WeekdaysOnly: Story = {
  render: (args) => <BusinessHoursEditorWrapper {...args} />,
  args: {
    value: createWeekdaySchedule('08:00', '18:00'),
  },
};

export const TwentyFourSeven: Story = {
  render: (args) => <BusinessHoursEditorWrapper {...args} />,
  args: {
    value: create24HourSchedule(),
    showDescription: false,
  },
};

export const MondayStart: Story = {
  render: (args) => <BusinessHoursEditorWrapper {...args} />,
  args: {
    value: createDefaultSchedule(),
    weekStartsOn: 1,
  },
};

export const WithDescriptions: Story = {
  render: (args) => <BusinessHoursEditorWrapper {...args} />,
  args: {
    value: [
      { day: 0, hours: [] },
      {
        day: 1,
        hours: [
          {
            id: '1',
            start: '08:00',
            end: '12:00',
            description: 'Morning shift',
          },
          {
            id: '2',
            start: '13:00',
            end: '17:00',
            description: 'Afternoon shift',
          },
        ],
      },
      {
        day: 2,
        hours: [
          {
            id: '3',
            start: '09:00',
            end: '17:00',
            description: 'Regular hours',
          },
        ],
      },
      {
        day: 3,
        hours: [
          {
            id: '4',
            start: '09:00',
            end: '17:00',
            description: 'Regular hours',
          },
        ],
      },
      {
        day: 4,
        hours: [
          {
            id: '5',
            start: '09:00',
            end: '17:00',
            description: 'Regular hours',
          },
        ],
      },
      {
        day: 5,
        hours: [
          { id: '6', start: '08:00', end: '15:00', description: 'Early close' },
        ],
      },
      { day: 6, hours: [] },
    ],
    showDescription: true,
  },
};

export const NoDescriptions: Story = {
  render: (args) => <BusinessHoursEditorWrapper {...args} />,
  args: {
    value: createDefaultSchedule(),
    showDescription: false,
  },
};

export const Disabled: Story = {
  render: (args) => <BusinessHoursEditorWrapper {...args} />,
  args: {
    value: createDefaultSchedule(),
    disabled: true,
    showDescription: true,
  },
};

export const CustomLabel: Story = {
  render: (args) => <BusinessHoursEditorWrapper {...args} />,
  args: {
    value: [],
    addHoursLabel: 'Add Time Slot',
    showDescription: true,
  },
};

export const ComplexSchedule: Story = {
  render: (args) => <BusinessHoursEditorWrapper {...args} />,
  args: {
    value: [
      {
        day: 0,
        hours: [
          {
            id: '1',
            start: '10:00',
            end: '14:00',
            description: 'Sunday brunch',
          },
        ],
      },
      {
        day: 1,
        hours: [
          { id: '2', start: '07:00', end: '10:00', description: 'Breakfast' },
          { id: '3', start: '11:00', end: '14:00', description: 'Lunch' },
          { id: '4', start: '17:00', end: '22:00', description: 'Dinner' },
        ],
      },
      {
        day: 2,
        hours: [
          { id: '5', start: '07:00', end: '10:00', description: 'Breakfast' },
          { id: '6', start: '11:00', end: '14:00', description: 'Lunch' },
          { id: '7', start: '17:00', end: '22:00', description: 'Dinner' },
        ],
      },
      {
        day: 3,
        hours: [
          { id: '8', start: '07:00', end: '10:00', description: 'Breakfast' },
          { id: '9', start: '11:00', end: '14:00', description: 'Lunch' },
          { id: '10', start: '17:00', end: '22:00', description: 'Dinner' },
        ],
      },
      {
        day: 4,
        hours: [
          { id: '11', start: '07:00', end: '10:00', description: 'Breakfast' },
          { id: '12', start: '11:00', end: '14:00', description: 'Lunch' },
          { id: '13', start: '17:00', end: '22:00', description: 'Dinner' },
        ],
      },
      {
        day: 5,
        hours: [
          { id: '14', start: '07:00', end: '10:00', description: 'Breakfast' },
          { id: '15', start: '11:00', end: '14:00', description: 'Lunch' },
          {
            id: '16',
            start: '17:00',
            end: '23:00',
            description: 'Dinner & Late Night',
          },
        ],
      },
      {
        day: 6,
        hours: [
          { id: '17', start: '09:00', end: '15:00', description: 'Brunch' },
          {
            id: '18',
            start: '17:00',
            end: '23:00',
            description: 'Dinner & Late Night',
          },
        ],
      },
    ],
    showDescription: true,
  },
};

export const Mobile: Story = {
  render: (args) => <BusinessHoursEditorWrapper {...args} />,
  args: {
    value: createDefaultSchedule(),
    showDescription: true,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
