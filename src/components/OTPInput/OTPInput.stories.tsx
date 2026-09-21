import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { OTPInput } from './OTPInput';

const meta: Meta<typeof OTPInput> = {
  id: 'components-forms-inputs-otpinput',
  title: 'Inputs/Text inputs/OTPInput',
  component: OTPInput,
  parameters: {
    catalog: {"entry": "@mieweb/ui", "relationships": []}, docs: { description: { component: "### What it's for\n\nA labeled group of one-character inputs for a fixed-length verification code.\n\n### Use it when\n\nAuthentication asks for a short code that users may type or paste.\n\n### Don't use it when\n\nUse Input for passwords, free text or variable-length identifiers.\n\n### Example\n\nKeep the code in parent state with value and onChange; submit from onComplete and pass the server validation error back.\n\n### Limitations\n\nKeyboard navigation and paste filtering are built in. Supply a label and translated error text. The component does not verify a code, rate-limit attempts or implement authentication." } },
    layout: 'centered',
  },
  tags: ['autodocs', 'scope:general-purpose', 'maturity:beta'],
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
