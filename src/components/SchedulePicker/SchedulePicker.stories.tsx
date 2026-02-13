import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  SchedulePicker,
  DatePicker,
  TimePicker,
  DateButton,
  TimeButton,
  RadioOption,
} from './SchedulePicker';

// Generate sample dates for the next N days
const generateDates = (count: number): Date[] => {
  const dates: Date[] = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date);
  }
  return dates;
};

// Sample time slots
const sampleTimes = [
  '8:00 AM',
  '8:30 AM',
  '9:00 AM',
  '9:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '1:00 PM',
  '1:30 PM',
  '2:00 PM',
  '2:30 PM',
  '3:00 PM',
  '3:30 PM',
  '4:00 PM',
  '4:30 PM',
];

// Wrapper for SchedulePicker with internal state
function SchedulePickerWithState(
  props: Omit<
    React.ComponentProps<typeof SchedulePicker>,
    | 'dates'
    | 'times'
    | 'selectedDate'
    | 'selectedTime'
    | 'onDateSelect'
    | 'onTimeSelect'
  > & {
    dateCount?: number;
    times?: string[];
  }
) {
  const { dateCount = 14, times = sampleTimes, ...rest } = props;
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = React.useState<string | null>(null);

  const dates = React.useMemo(() => generateDates(dateCount), [dateCount]);

  return (
    <div className="max-w-2xl space-y-4">
      <SchedulePicker
        {...rest}
        dates={dates}
        times={times}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        onDateSelect={setSelectedDate}
        onTimeSelect={setSelectedTime}
      />
      <div className="mt-4 rounded-lg border border-neutral-200 p-4 dark:border-neutral-700">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Selected:{' '}
          {selectedDate
            ? selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })
            : 'No date selected'}
          {selectedTime && ` at ${selectedTime}`}
        </p>
      </div>
    </div>
  );
}

// Extended args type
type SchedulePickerStoryArgs = Omit<
  React.ComponentProps<typeof SchedulePicker>,
  | 'dates'
  | 'times'
  | 'selectedDate'
  | 'selectedTime'
  | 'onDateSelect'
  | 'onTimeSelect'
> & {
  dateCount?: number;
};

const meta = {
  title: 'Inputs & Controls/SchedulePicker',
  component: SchedulePicker,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    dateLabel: {
      control: 'text',
      description: 'Label for the date picker section',
    },
    timeLabel: {
      control: 'text',
      description: 'Label for the time picker section',
    },
    timeColumns: {
      control: 'select',
      options: [4, 6],
      description: 'Number of columns in the time grid',
    },
    showTimePicker: {
      control: 'boolean',
      description: 'Whether to show time picker (shows after date is selected)',
    },
    // Hide internal props
    dates: { table: { disable: true } },
    times: { table: { disable: true } },
    selectedDate: { table: { disable: true } },
    selectedTime: { table: { disable: true } },
    onDateSelect: { table: { disable: true } },
    onTimeSelect: { table: { disable: true } },
  },
  render: (args: SchedulePickerStoryArgs) => (
    <SchedulePickerWithState {...args} />
  ),
} satisfies Meta<typeof SchedulePicker>;

export default meta;
type Story = StoryObj<SchedulePickerStoryArgs>;

export const Default: Story = {
  args: {
    dateLabel: 'Select Date',
    timeLabel: 'Select Time',
    timeColumns: 6,
    showTimePicker: true,
    dateCount: 14,
  },
};

export const FourColumnTimes: Story = {
  args: {
    ...Default.args,
    timeColumns: 4,
  },
};

export const CustomLabels: Story = {
  args: {
    ...Default.args,
    dateLabel: 'Choose your preferred date',
    timeLabel: 'Choose your preferred time',
  },
};

export const MoreDates: Story = {
  args: {
    ...Default.args,
    dateCount: 21,
  },
};

// DatePicker standalone with wrapper
function DatePickerWithState(
  props: Omit<
    React.ComponentProps<typeof DatePicker>,
    'dates' | 'selectedDate' | 'onDateSelect'
  > & {
    dateCount?: number;
  }
) {
  const { dateCount = 10, ...rest } = props;
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const dates = React.useMemo(() => generateDates(dateCount), [dateCount]);

  return (
    <DatePicker
      {...rest}
      dates={dates}
      selectedDate={selectedDate}
      onDateSelect={setSelectedDate}
    />
  );
}

export const DatePickerOnly: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => <DatePickerWithState dateCount={10} label="Select Date" />,
};

// TimePicker standalone with wrapper
function TimePickerWithState(
  props: Omit<
    React.ComponentProps<typeof TimePicker>,
    'times' | 'selectedTime' | 'onTimeSelect'
  > & {
    times?: string[];
  }
) {
  const { times = sampleTimes, ...rest } = props;
  const [selectedTime, setSelectedTime] = React.useState<string | null>(null);

  return (
    <div className="max-w-md">
      <TimePicker
        {...rest}
        times={times}
        selectedTime={selectedTime}
        onTimeSelect={setSelectedTime}
      />
    </div>
  );
}

export const TimePickerOnly: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => <TimePickerWithState label="Select Time" columns={6} />,
};

export const TimePickerFourCol: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => <TimePickerWithState label="Select Time" columns={4} />,
};

export const LimitedTimeSlots: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <TimePickerWithState
      times={['9:00 AM', '11:00 AM', '2:00 PM']}
      label="Available Time Slots"
      columns={4}
    />
  ),
};

// DateButton showcase
export const DateButtons: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    return (
      <div className="flex gap-4">
        <DateButton date={today} />
        <DateButton date={tomorrow} selected />
      </div>
    );
  },
};

// TimeButton showcase
export const TimeButtons: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div className="flex gap-4">
      <TimeButton time="9:00 AM" />
      <TimeButton time="10:00 AM" selected />
      <TimeButton time="11:00 AM" />
    </div>
  ),
};

// RadioOption showcase
export const RadioOptions: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div className="max-w-md space-y-2">
      <RadioOption
        title="Walk-in (No appointment needed)"
        description="Visit anytime during business hours"
        selected={false}
      />
      <RadioOption
        title="Schedule an appointment"
        description="Reserve a specific date and time"
        selected
      >
        <div className="mt-4 rounded bg-neutral-100 p-2 dark:bg-neutral-800">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Additional content shown when selected
          </p>
        </div>
      </RadioOption>
    </div>
  ),
};

// Complete Flow Demo
function CompleteFlowDemo() {
  const [mode, setMode] = React.useState<'walk-in' | 'scheduled'>('walk-in');
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = React.useState<string | null>(null);

  const dates = React.useMemo(() => generateDates(14), []);

  return (
    <div className="max-w-2xl space-y-4">
      <RadioOption
        title="Walk-in (No appointment needed)"
        description="Visit anytime during business hours"
        selected={mode === 'walk-in'}
        onClick={() => setMode('walk-in')}
      />
      <RadioOption
        title="Schedule an appointment"
        description="Reserve a specific date and time"
        selected={mode === 'scheduled'}
        onClick={() => setMode('scheduled')}
      >
        {mode === 'scheduled' && (
          <div className="mt-4">
            <SchedulePicker
              dates={dates}
              times={sampleTimes}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              onDateSelect={setSelectedDate}
              onTimeSelect={setSelectedTime}
            />
          </div>
        )}
      </RadioOption>

      <div className="mt-6 rounded-lg border border-neutral-200 p-4 dark:border-neutral-700">
        <h4 className="font-medium text-neutral-900 dark:text-white">
          Selection Summary
        </h4>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          {mode === 'walk-in'
            ? 'Walk-in appointment - no reservation needed'
            : selectedDate
              ? `Scheduled: ${selectedDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}${selectedTime ? ` at ${selectedTime}` : ' - select a time'}`
              : 'Select a date to continue'}
        </p>
      </div>
    </div>
  );
}

export const CompleteFlow: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => <CompleteFlowDemo />,
};
