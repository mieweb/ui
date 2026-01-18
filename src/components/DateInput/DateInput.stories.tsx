import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { DateInput } from './DateInput';

const meta: Meta<typeof DateInput> = {
  title: 'Components/DateInput',
  component: DateInput,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    mode: {
      control: 'select',
      options: ['default', 'dob', 'expiration', 'past', 'future'],
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '300px' }}>
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

export const DateOfBirth: Story = {
  args: {
    label: 'Date of Birth',
    mode: 'dob',
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
