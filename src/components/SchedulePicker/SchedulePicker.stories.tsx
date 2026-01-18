import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import {
  SchedulePicker,
  DatePicker,
  TimePicker,
  DateButton,
  TimeButton,
  RadioOption,
} from './SchedulePicker';

const meta: Meta<typeof SchedulePicker> = {
  title: 'Components/SchedulePicker',
  component: SchedulePicker,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SchedulePicker>;

// Generate sample dates for the next 14 days
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

// Interactive Story Wrapper
const SchedulePickerDemo = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  return (
    <div className="max-w-2xl space-y-4">
      <SchedulePicker
        dates={generateDates(14)}
        times={sampleTimes}
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
};

export const Default: Story = {
  render: () => <SchedulePickerDemo />,
};

// Date Button Variations
export const DateButtons: Story = {
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

// Time Button Variations
export const TimeButtons: Story = {
  render: () => (
    <div className="flex gap-4">
      <TimeButton time="9:00 AM" />
      <TimeButton time="10:00 AM" selected />
      <TimeButton time="11:00 AM" />
    </div>
  ),
};

// Date Picker Only
const DatePickerDemo = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  return (
    <DatePicker
      dates={generateDates(10)}
      selectedDate={selectedDate}
      onDateSelect={setSelectedDate}
    />
  );
};

export const DatePickerOnly: Story = {
  render: () => <DatePickerDemo />,
};

// Time Picker Only
const TimePickerDemo = () => {
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  return (
    <div className="max-w-md">
      <TimePicker
        times={sampleTimes}
        selectedTime={selectedTime}
        onTimeSelect={setSelectedTime}
      />
    </div>
  );
};

export const TimePickerOnly: Story = {
  render: () => <TimePickerDemo />,
};

// Time Picker with 4 Columns
const TimePickerFourColumns = () => {
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  return (
    <div className="max-w-sm">
      <TimePicker
        times={sampleTimes}
        selectedTime={selectedTime}
        onTimeSelect={setSelectedTime}
        columns={4}
      />
    </div>
  );
};

export const TimePickerFourCol: Story = {
  render: () => <TimePickerFourColumns />,
};

// Radio Option Variations
export const RadioOptions: Story = {
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
const CompleteFlowDemo = () => {
  const [mode, setMode] = useState<'walk-in' | 'scheduled'>('walk-in');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

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
              dates={generateDates(14)}
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
};

export const CompleteFlow: Story = {
  render: () => <CompleteFlowDemo />,
};

// Limited Time Slots
export const LimitedTimeSlots: Story = {
  render: () => {
    const Component = () => {
      const [selectedTime, setSelectedTime] = useState<string | null>(null);
      const limitedTimes = ['9:00 AM', '11:00 AM', '2:00 PM'];

      return (
        <div className="max-w-sm">
          <TimePicker
            times={limitedTimes}
            selectedTime={selectedTime}
            onTimeSelect={setSelectedTime}
            label="Available Time Slots"
            columns={4}
          />
        </div>
      );
    };
    return <Component />;
  },
};
