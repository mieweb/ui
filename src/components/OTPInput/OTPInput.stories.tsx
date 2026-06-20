import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { OTPInput } from './OTPInput';

const meta: Meta<typeof OTPInput> = {
  title: 'Components/Forms & Inputs/OTPInput',
  component: OTPInput,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    length: { control: { type: 'number', min: 4, max: 8 } },
    disabled: { control: 'boolean' },
    hasError: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

function ControlledOTP(args: React.ComponentProps<typeof OTPInput>) {
  const [value, setValue] = useState(args.value ?? '');
  return <OTPInput {...args} value={value} onChange={setValue} />;
}

export const Default: Story = {
  render: (args) => <ControlledOTP {...args} />,
  args: {
    label: 'Verification code',
    value: '',
  },
};

export const Prefilled: Story = {
  render: (args) => <ControlledOTP {...args} />,
  args: {
    label: 'Verification code',
    value: '1234',
  },
};

export const WithError: Story = {
  render: (args) => <ControlledOTP {...args} />,
  args: {
    label: 'Verification code',
    value: '0000',
    error: "That code didn't match. Try again.",
  },
};

export const FourDigits: Story = {
  render: (args) => <ControlledOTP {...args} />,
  args: {
    label: 'PIN',
    length: 4,
    value: '',
  },
};

export const Large: Story = {
  render: (args) => <ControlledOTP {...args} />,
  args: {
    label: 'Verification code',
    size: 'lg',
    value: '',
  },
};

export const Disabled: Story = {
  render: (args) => <ControlledOTP {...args} />,
  args: {
    label: 'Verification code',
    value: '12',
    disabled: true,
  },
};
