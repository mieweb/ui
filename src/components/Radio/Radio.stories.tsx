import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { RadioGroup, Radio } from './Radio';

const meta: Meta<typeof RadioGroup> = {
  title: 'Components/Radio',
  component: RadioGroup,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
    },
    disabled: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <RadioGroup name="plan" label="Select a plan" defaultValue="free">
      <Radio value="free" label="Free" />
      <Radio value="pro" label="Pro" />
      <Radio value="enterprise" label="Enterprise" />
    </RadioGroup>
  ),
};

export const Horizontal: Story = {
  render: () => (
    <RadioGroup
      name="size"
      label="Select size"
      orientation="horizontal"
      defaultValue="md"
    >
      <Radio value="sm" label="Small" />
      <Radio value="md" label="Medium" />
      <Radio value="lg" label="Large" />
    </RadioGroup>
  ),
};

export const WithDescriptions: Story = {
  render: () => (
    <RadioGroup
      name="subscription"
      label="Choose your subscription"
      defaultValue="monthly"
    >
      <Radio
        value="monthly"
        label="Monthly"
        description="$9.99 per month, cancel anytime"
      />
      <Radio
        value="yearly"
        label="Yearly"
        description="$99.99 per year, save 17%"
      />
      <Radio
        value="lifetime"
        label="Lifetime"
        description="$299.99 one-time payment"
      />
    </RadioGroup>
  ),
};

export const Small: Story = {
  render: () => (
    <RadioGroup name="option" label="Options" size="sm" defaultValue="a">
      <Radio value="a" label="Option A" />
      <Radio value="b" label="Option B" />
      <Radio value="c" label="Option C" />
    </RadioGroup>
  ),
};

export const Large: Story = {
  render: () => (
    <RadioGroup name="option" label="Options" size="lg" defaultValue="a">
      <Radio value="a" label="Option A" />
      <Radio value="b" label="Option B" />
      <Radio value="c" label="Option C" />
    </RadioGroup>
  ),
};

export const WithDisabledOption: Story = {
  render: () => (
    <RadioGroup name="option" label="Options" defaultValue="a">
      <Radio value="a" label="Option A" />
      <Radio value="b" label="Option B (disabled)" disabled />
      <Radio value="c" label="Option C" />
    </RadioGroup>
  ),
};

export const GroupDisabled: Story = {
  render: () => (
    <RadioGroup
      name="option"
      label="Options (disabled)"
      disabled
      defaultValue="a"
    >
      <Radio value="a" label="Option A" />
      <Radio value="b" label="Option B" />
      <Radio value="c" label="Option C" />
    </RadioGroup>
  ),
};

export const WithError: Story = {
  render: () => (
    <RadioGroup
      name="required"
      label="Select an option"
      error="Please select one of the options"
    >
      <Radio value="a" label="Option A" />
      <Radio value="b" label="Option B" />
      <Radio value="c" label="Option C" />
    </RadioGroup>
  ),
};

export const WithGroupDescription: Story = {
  render: () => (
    <RadioGroup
      name="notification"
      label="Notification preferences"
      description="Choose how you want to receive notifications"
      defaultValue="email"
    >
      <Radio value="email" label="Email" description="Get notified via email" />
      <Radio
        value="sms"
        label="SMS"
        description="Get notified via text message"
      />
      <Radio
        value="push"
        label="Push"
        description="Get notified via push notification"
      />
    </RadioGroup>
  ),
};

function ControlledRadioDemo() {
  const [value, setValue] = React.useState('');

  return (
    <div className="space-y-4">
      <RadioGroup
        name="controlled"
        label="Controlled Radio Group"
        value={value}
        onValueChange={setValue}
      >
        <Radio value="a" label="Option A" />
        <Radio value="b" label="Option B" />
        <Radio value="c" label="Option C" />
      </RadioGroup>
      <p className="text-muted-foreground text-xs">
        Selected: <code className="font-mono">{value || 'none'}</code>
      </p>
    </div>
  );
}

export const Controlled: Story = {
  render: () => <ControlledRadioDemo />,
};

export const PaymentMethodExample: Story = {
  render: () => (
    <RadioGroup name="payment" label="Payment method" defaultValue="card">
      <Radio
        value="card"
        label="Credit/Debit Card"
        description="Pay with Visa, Mastercard, or American Express"
      />
      <Radio
        value="paypal"
        label="PayPal"
        description="Pay with your PayPal account"
      />
      <Radio
        value="bank"
        label="Bank Transfer"
        description="Direct bank transfer (3-5 business days)"
      />
      <Radio
        value="crypto"
        label="Cryptocurrency"
        description="Pay with Bitcoin, Ethereum, or other cryptocurrencies"
        disabled
      />
    </RadioGroup>
  ),
};
