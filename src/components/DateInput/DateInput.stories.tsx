import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { DateInput } from './DateInput';

const meta: Meta<typeof DateInput> = {
  title: 'Components/Forms & Inputs/DateInput',
  component: DateInput,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    inputType: {
      control: 'select',
      options: ['date', 'datetime-local', 'month', 'year'],
      description: 'Date value format and picker control',
    },
    timeFormat: {
      control: 'select',
      options: ['12-hour', '24-hour'],
      description: 'Time picker display format for datetime values',
    },
    mode: {
      control: 'select',
      options: ['default', 'dob', 'expiration', 'past', 'future'],
    },
    width: {
      control: 'select',
      options: ['full', 'fit', 'fixed'],
      description: 'Width behavior of the input',
    },
    showCalendar: {
      control: 'boolean',
      description: 'Show calendar picker button',
    },
    validateOnBlur: {
      control: 'boolean',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '400px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Date',
  },
};

export const WithCalendar: Story = {
  args: {
    label: 'Select Date',
    showCalendar: true,
    width: 'fixed',
  },
};

export const WithCalendarPreFilled: Story = {
  args: {
    label: 'Appointment Date',
    showCalendar: true,
    width: 'fixed',
    value: '06/15/2026',
  },
};

export const DateTime: Story = {
  args: {
    label: 'Appointment Time',
    inputType: 'datetime-local',
    value: '2026-07-21T09:30',
  },
};

export const DateTimeTwelveHour: Story = {
  args: {
    label: 'Appointment Time',
    inputType: 'datetime-local',
    timeFormat: '12-hour',
    value: '2026-07-21T21:30',
  },
};

export const Month: Story = {
  args: {
    label: 'Billing Month',
    inputType: 'month',
    value: '2026-07',
  },
};

export const Year: Story = {
  args: {
    label: 'Graduation Year',
    inputType: 'year',
    value: '2026',
  },
};

export const DateOfBirth: Story = {
  args: {
    label: 'Date of Birth',
    mode: 'dob',
    validateOnBlur: true,
    minAge: 18,
    helperText: 'Must be 18 years or older',
  },
};

export const DateOfBirthWithCalendar: Story = {
  args: {
    label: 'Date of Birth',
    mode: 'dob',
    showCalendar: true,
    validateOnBlur: true,
    minAge: 18,
    helperText: 'Must be 18 years or older',
  },
};

export const ExpirationDate: Story = {
  args: {
    label: 'License Expiration',
    mode: 'expiration',
    validateOnBlur: true,
    helperText: 'Must be a future date',
  },
};

export const ExpirationWithCalendar: Story = {
  args: {
    label: 'License Expiration',
    mode: 'expiration',
    showCalendar: true,
    validateOnBlur: true,
    helperText: 'Must be a future date',
  },
};

export const Controlled: Story = {
  render: function ControlledExample() {
    const [date, setDate] = useState('');
    return (
      <div className="space-y-4">
        <DateInput
          label="Select Date"
          value={date}
          onChange={setDate}
          validateOnBlur
        />
        <p className="text-muted-foreground text-sm">
          Value: {date || '(empty)'}
        </p>
      </div>
    );
  },
};

export const PreFilled: Story = {
  args: {
    label: 'Date',
    value: '01/15/1990',
  },
};

export const WithError: Story = {
  args: {
    label: 'Expiration Date',
    mode: 'expiration',
    value: '01/01/2020',
    error: 'Expiration date must be in the future',
    hasError: true,
  },
};

export const AllModes: Story = {
  render: () => (
    <div className="space-y-4">
      <DateInput label="Default Mode" mode="default" />
      <DateInput label="Date of Birth" mode="dob" validateOnBlur minAge={18} />
      <DateInput label="Expiration" mode="expiration" validateOnBlur />
      <DateInput label="Past Date" mode="past" validateOnBlur />
      <DateInput label="Future Date" mode="future" validateOnBlur />
    </div>
  ),
};
