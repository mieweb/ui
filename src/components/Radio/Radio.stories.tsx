import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { RadioGroup, Radio } from './Radio';

// Wrapper component to handle controlled state for stories
function RadioGroupWithState(
  props: Omit<React.ComponentProps<typeof RadioGroup>, 'children'> & {
    options?: Array<{
      value: string;
      label: string;
      description?: string;
      disabled?: boolean;
    }>;
  }
) {
  const {
    options = [
      { value: 'option-a', label: 'Option A' },
      { value: 'option-b', label: 'Option B' },
      { value: 'option-c', label: 'Option C' },
    ],
    defaultValue,
    ...rest
  } = props;

  const [value, setValue] = React.useState(defaultValue || '');

  return (
    <RadioGroup
      {...rest}
      value={value}
      onValueChange={setValue}
      defaultValue={undefined}
    >
      {options.map((opt) => (
        <Radio
          key={opt.value}
          value={opt.value}
          label={opt.label}
          description={opt.description}
          disabled={opt.disabled}
        />
      ))}
    </RadioGroup>
  );
}

// Extended args type for wrapper
type RadioGroupStoryArgs = Omit<
  React.ComponentProps<typeof RadioGroup>,
  'children' | 'onValueChange'
> & {
  options?: Array<{
    value: string;
    label: string;
    description?: string;
    disabled?: boolean;
  }>;
  onValueChange?: (value: string) => void;
};

const meta = {
  title: 'Components/Radio',
  component: RadioGroup,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    name: {
      control: 'text',
      description: 'Group name (required for native form behavior)',
    },
    label: {
      control: 'text',
      description: 'Group label displayed above the options',
    },
    description: {
      control: 'text',
      description: 'Description text below the label',
    },
    error: {
      control: 'text',
      description: 'Error message to display',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of all radio buttons',
    },
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      description: 'Layout orientation of radio items',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether all radios are disabled',
    },
    defaultValue: {
      control: 'text',
      description: 'Default selected value (uncontrolled)',
    },
    children: {
      table: { disable: true },
    },
    value: {
      table: { disable: true },
    },
    onValueChange: {
      table: { disable: true },
    },
  },
  render: (args: RadioGroupStoryArgs) => <RadioGroupWithState {...args} />,
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<RadioGroupStoryArgs>;

export const Default: Story = {
  args: {
    name: 'plan',
    label: 'Select a plan',
    defaultValue: 'option-a',
    size: 'md',
    orientation: 'vertical',
    disabled: false,
  },
};

export const Horizontal: Story = {
  args: {
    name: 'size',
    label: 'Select size',
    orientation: 'horizontal',
    defaultValue: 'option-b',
    size: 'md',
    options: [
      { value: 'sm', label: 'Small' },
      { value: 'md', label: 'Medium' },
      { value: 'lg', label: 'Large' },
    ],
  },
};

export const WithDescriptions: Story = {
  args: {
    name: 'subscription',
    label: 'Choose your subscription',
    defaultValue: 'monthly',
    options: [
      {
        value: 'monthly',
        label: 'Monthly',
        description: '$9.99 per month, cancel anytime',
      },
      {
        value: 'yearly',
        label: 'Yearly',
        description: '$99.99 per year, save 17%',
      },
      {
        value: 'lifetime',
        label: 'Lifetime',
        description: '$299.99 one-time payment',
      },
    ],
  },
};

export const Small: Story = {
  args: {
    name: 'option-sm',
    label: 'Options (Small)',
    size: 'sm',
    defaultValue: 'option-a',
  },
};

export const Large: Story = {
  args: {
    name: 'option-lg',
    label: 'Options (Large)',
    size: 'lg',
    defaultValue: 'option-a',
  },
};

export const WithDisabledOption: Story = {
  args: {
    name: 'option-disabled',
    label: 'Options',
    defaultValue: 'option-a',
    options: [
      { value: 'option-a', label: 'Option A' },
      { value: 'option-b', label: 'Option B (disabled)', disabled: true },
      { value: 'option-c', label: 'Option C' },
    ],
  },
};

export const GroupDisabled: Story = {
  args: {
    name: 'option-group-disabled',
    label: 'Options (disabled)',
    disabled: true,
    defaultValue: 'option-a',
  },
};

export const WithError: Story = {
  args: {
    name: 'required',
    label: 'Select an option',
    error: 'Please select one of the options',
  },
};

export const WithGroupDescription: Story = {
  args: {
    name: 'notification',
    label: 'Notification preferences',
    description: 'Choose how you want to receive notifications',
    defaultValue: 'email',
    options: [
      { value: 'email', label: 'Email', description: 'Get notified via email' },
      {
        value: 'sms',
        label: 'SMS',
        description: 'Get notified via text message',
      },
      {
        value: 'push',
        label: 'Push',
        description: 'Get notified via push notification',
      },
    ],
  },
};

// Showcase stories with custom render (controls disabled)
export const AllSizes: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div className="flex flex-col gap-8">
      <RadioGroup name="size-sm" label="Small" size="sm" defaultValue="a">
        <Radio value="a" label="Option A" />
        <Radio value="b" label="Option B" />
      </RadioGroup>
      <RadioGroup
        name="size-md"
        label="Medium (default)"
        size="md"
        defaultValue="a"
      >
        <Radio value="a" label="Option A" />
        <Radio value="b" label="Option B" />
      </RadioGroup>
      <RadioGroup name="size-lg" label="Large" size="lg" defaultValue="a">
        <Radio value="a" label="Option A" />
        <Radio value="b" label="Option B" />
      </RadioGroup>
    </div>
  ),
};

export const PaymentMethodExample: Story = {
  parameters: {
    controls: { disable: true },
  },
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
  parameters: {
    controls: { disable: true },
  },
  render: () => <ControlledRadioDemo />,
};
