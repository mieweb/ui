import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { PhoneInput } from './PhoneInput';

const meta: Meta<typeof PhoneInput> = {
  title: 'Inputs & Controls/PhoneInput',
  component: PhoneInput,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
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
    label: 'Phone Number',
  },
};

export const WithValidation: Story = {
  args: {
    label: 'Phone Number',
    validateOnBlur: true,
    helperText: 'Enter a 10-digit phone number',
  },
};

export const Controlled: Story = {
  render: function ControlledExample() {
    const [phone, setPhone] = useState('');
    return (
      <div className="space-y-4">
        <PhoneInput
          label="Phone Number"
          value={phone}
          onChange={setPhone}
          validateOnBlur
        />
        <p className="text-muted-foreground text-sm">
          Raw value: {phone || '(empty)'}
        </p>
      </div>
    );
  },
};

export const PreFilled: Story = {
  args: {
    label: 'Phone Number',
    value: '5551234567',
  },
};

export const WithError: Story = {
  args: {
    label: 'Phone Number',
    value: '555',
    error: 'Please enter a complete phone number',
    hasError: true,
  },
};

export const Disabled: Story = {
  args: {
    label: 'Phone Number',
    value: '5551234567',
    disabled: true,
  },
};
