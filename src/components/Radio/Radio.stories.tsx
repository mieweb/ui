import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { RadioGroup, Radio } from './Radio';
import { Input } from '../Input';
import { Select } from '../Select';
import { Checkbox, CheckboxGroup } from '../Checkbox';

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
  id: 'choice-inputs-radio',
  title: 'Inputs/Choice inputs/Radio',
  component: RadioGroup,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `### What it's for

One-of-N selection with native radios. \`RadioGroup\` is the unit: a \`<fieldset role="radiogroup">\` that owns the value (\`value\` + \`onValueChange\`, or \`defaultValue\`), the shared \`name\` (auto-generated with \`useId\` when omitted), \`label\` (\`labelVariant\` \`stacked\` | \`floating\`), \`description\`, \`error\`, \`disabled\`, \`size\` and \`orientation\`. Each \`Radio\` is an \`<input type="radio">\` with its own \`value\`, \`label\`, \`description\` and \`labelPosition\`; it reads everything else from the group context and throws if rendered outside one. \`radioVariants\` is exported for custom builds.

### Use it when

- The user must pick **exactly one** of 2–7 options and seeing them all at once helps the decision (plan, priority, yes/no/unknown).
- The answer is saved with the form — the native \`name\` / \`value\` submit as usual.
- Options need a second line of explanation (\`description\` on each \`Radio\`).

### Don't use it when

- Several options may be on at once — \`Checkbox\` / \`CheckboxGroup\`.
- Space is tight or the choice is a view mode in a toolbar — \`PillSelect\` (collapsed pill, one label).
- More than ~7 options, or they need search — \`Select\`.
- One option switches a live setting — \`Switch\`.

### Example

\`\`\`tsx
const [plan, setPlan] = useState('pro');

<RadioGroup name="plan" label="Plan" value={plan} onValueChange={setPlan}
  error={submitted && !plan ? 'Choose a plan' : undefined}>
  <Radio value="free" label="Free" description="Up to 3 users" />
  <Radio value="pro" label="Pro" description="Unlimited users, audit log" />
  <Radio value="enterprise" label="Enterprise" disabled />
</RadioGroup>
\`\`\`

State lives on the group; a \`Radio\` never takes \`checked\` or \`onChange\` of its own (its \`checked\` is derived from the group's value).

### Limitations

- Accessibility: \`<fieldset role="radiogroup">\` + \`<legend>\`; each \`<label htmlFor>\` is bound to its input's \`id\` (auto \`useId\`); \`aria-describedby\` on the fieldset lists the group description / error ids, on each input its own description id. Error is a \`<p role="alert">\`. Arrow-key movement between radios is the browser's native behaviour. Neither the group nor the inputs set \`aria-invalid\` or \`aria-required\`.
- \`Radio\` has no \`error\` prop — validation messages belong to the group.
- Uncontrolled \`defaultValue\` defaults to \`''\` (nothing selected); there is no built-in "clear".
- RTL: \`labelPosition\` uses \`flex-row-reverse\`, so it follows the writing direction despite the \`left\` / \`right\` names. No physical offsets.
- Theming: \`border-input\`, \`bg-background\`, checked ring \`border-primary-500 dark:border-primary-800\`, dot \`bg-primary-800 dark:bg-primary-500\`; error uses plain \`text-destructive\` (no dark override).
- No built-in strings; depends on \`class-variance-authority\` and the floating-frame variants from \`Input\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'choice-inputs-checkbox',
          why: 'Radio allows exactly one option; Checkbox lets several be on at once.',
        },
        {
          type: 'alternative to',
          target: 'choice-inputs-pillselect',
          why: 'Radio shows every option at once in a form; PillSelect collapses the same one-of-N choice into a toolbar pill.',
        },
        {
          type: 'alternative to',
          target: 'choice-inputs-select',
          why: 'Radio for up to ~7 visible options; Select when the list is long, grouped or searchable.',
        },
        {
          type: 'alternative to',
          target: 'choice-inputs-slider',
          why: 'Radio when the choice is one of a few labelled steps; Slider for a continuous numeric range.',
        },
      ],
    },
  },
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  argTypes: {
    name: {
      control: 'text',
      description: 'Group name (required for native form behavior)',
    },
    label: {
      control: 'text',
      description: 'Group label displayed above the options',
    },
    labelVariant: {
      control: 'select',
      options: ['stacked', 'floating'],
      description: 'How the group label is rendered',
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

function FloatingFormAlignmentDemo() {
  return (
    <div className="flex flex-col gap-8">
      <section>
        <h3 className="text-muted-foreground mb-2 text-xs font-medium uppercase">
          Stacked labels throughout (aligned)
        </h3>
        <form className="grid w-[560px] grid-cols-2 gap-4">
          <Input label="First name" />
          <Input label="Last name" />
          <Select
            label="Country"
            options={[
              { value: 'us', label: 'United States' },
              { value: 'gb', label: 'United Kingdom' },
            ]}
          />
          <RadioGroup
            name="contact-all-stacked"
            label="Contact method"
            orientation="horizontal"
          >
            <Radio value="email" label="Email" />
            <Radio value="phone" label="Phone" />
          </RadioGroup>
          <Input label="Street address" />
          <CheckboxGroup label="Preferences">
            <Checkbox label="Subscribe to newsletter" />
          </CheckboxGroup>
        </form>
      </section>
      <section>
        <h3 className="text-muted-foreground mb-2 text-xs font-medium uppercase">
          Stacked group labels next to floating inputs (misaligned)
        </h3>
        <form className="grid w-[560px] grid-cols-2 gap-4">
          <Input label="First name" labelVariant="floating" />
          <RadioGroup
            name="contact-stacked"
            label="Contact method"
            orientation="horizontal"
          >
            <Radio value="email" label="Email" />
            <Radio value="phone" label="Phone" />
          </RadioGroup>
        </form>
      </section>
      <section>
        <h3 className="text-muted-foreground mb-2 text-xs font-medium uppercase">
          Floating group labels (aligned)
        </h3>
        <form className="grid w-[560px] grid-cols-2 gap-4">
          <Input label="First name" labelVariant="floating" />
          <Input label="Last name" labelVariant="floating" />
          <Select
            label="Country"
            labelVariant="floating"
            options={[
              { value: 'us', label: 'United States' },
              { value: 'gb', label: 'United Kingdom' },
            ]}
          />
          <RadioGroup
            name="contact-floating"
            label="Contact method"
            labelVariant="floating"
            orientation="horizontal"
          >
            <Radio value="email" label="Email" />
            <Radio value="phone" label="Phone" />
          </RadioGroup>
          <Input label="Street address" labelVariant="floating" />
          <CheckboxGroup label="Preferences" labelVariant="floating">
            <Checkbox label="Subscribe to newsletter" />
          </CheckboxGroup>
        </form>
      </section>
    </div>
  );
}

/**
 * Mixes floating-label inputs with radio and checkbox groups to check
 * vertical alignment between self-labeled controls and top-labeled groups.
 */
export const FloatingFormAlignment: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => <FloatingFormAlignmentDemo />,
};

export const FloatingLabel: Story = {
  args: {
    name: 'contact',
    label: 'Contact method',
    labelVariant: 'floating',
    orientation: 'horizontal',
    options: [
      { value: 'email', label: 'Email' },
      { value: 'phone', label: 'Phone' },
    ],
  },
};

export const FloatingLabelSizes: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div className="flex w-72 flex-col gap-4">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <RadioGroup
          key={size}
          name={`size-${size}`}
          label={`Size ${size}`}
          labelVariant="floating"
          orientation="horizontal"
          size={size}
        >
          <Radio value="a" label="Option A" />
          <Radio value="b" label="Option B" />
        </RadioGroup>
      ))}
    </div>
  ),
};

export const FloatingLabelWithError: Story = {
  args: {
    name: 'contact-error',
    label: 'Contact method',
    labelVariant: 'floating',
    orientation: 'horizontal',
    error: 'Please choose a contact method.',
    options: [
      { value: 'email', label: 'Email' },
      { value: 'phone', label: 'Phone' },
    ],
  },
};
