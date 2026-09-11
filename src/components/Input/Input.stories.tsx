import type { Meta, StoryObj } from '@storybook/react-vite';

import { Input } from './Input';

const meta: Meta<typeof Input> = {
  id: 'text-inputs-input',
  title: 'Inputs/Text inputs/Input',
  component: Input,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `### What it's for

The single-line text field every other text input is built on. A thin wrapper over a native \`<input>\` (all native attributes pass through, \`forwardRef\` reaches the element) that adds the field anatomy: \`label\` (\`labelVariant\` \`stacked\` | \`floating\`, \`hideLabel\` for an sr-only label), \`helperText\`, \`error\`, \`required\` + \`requiredVariant\` (\`default\` red asterisk, \`warning\` amber), \`size\` \`sm\` | \`md\` | \`lg\` and \`hasError\`. The folder also exports \`RequiredMark\` and the \`inputVariants\` / \`floatingLabelVariants\` / \`floatingGroupVariants\` / \`floatingGroupLabelVariants\` cva helpers so group controls can match its box metrics.

### Use it when

- The value is free text or a native single-line type (\`text\`, \`email\`, \`password\`, \`number\`, \`search\`) and you want the standard label / helper / error stack.
- You are building a specialised field — start from \`Input\` so it inherits the wiring (\`PhoneInput\`, \`WebsiteInput\`, \`DateInput\`, \`AddressForm\` all do).

### Don't use it when

- The value is a phone number — \`PhoneInput\` (formats and validates; never raw \`type="tel"\`).
- The value is a URL — \`WebsiteInput\` (validates; never raw \`type="url"\`).
- Multi-line text — \`Textarea\` (adds \`showCount\`, \`autoResize\`).
- A fixed set of options — \`Select\`; type-ahead over a large set — \`Autocomplete\`; a date — \`DateInput\`.
- You only need the label styling for a control that renders its own input — \`Label\`.

### Example

\`\`\`tsx
const [email, setEmail] = React.useState('');
const error = submitted && !email.includes('@') ? 'Enter a valid email address' : undefined;

<Input
  label="Email"
  type="email"
  autoComplete="email"
  required
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  helperText="We only use this for receipts."
  error={error}
/>
\`\`\`

Controlled or uncontrolled exactly like a native input; validation and the \`error\` string are owned by the host.

### Limitations

- \`<label htmlFor>\` is wired to the input's \`id\` (auto-generated with \`useId\` when omitted). \`aria-invalid\` is always rendered (\`true\` when \`hasError\` or \`error\` is set). \`aria-describedby\` points at the error paragraph, or the helper text when there is no error — helper text is hidden while an error shows. Any \`aria-describedby\` you pass is appended.
- The error is a \`<p role="alert">\`, so it is announced when it appears; there is no separate \`aria-live\` region and \`hasError\` alone (no \`error\` string) changes only the colour.
- The required asterisk is \`aria-hidden\`; the native \`required\` attribute carries the semantics.
- \`labelVariant="floating"\` ignores \`placeholder\` (a single space is used so \`:placeholder-shown\` drives the float); with \`hideLabel\` it falls back to an sr-only stacked label.
- RTL-safe: label offsets use logical \`start-3\` / \`ms-1\`. Dark mode comes from the semantic tokens (\`border-input\`, \`bg-background\`, \`text-foreground\`, \`text-destructive-700 dark:text-destructive-400\`).
- No i18n strings of its own — every visible string is a prop. No dependencies beyond \`class-variance-authority\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'text-inputs-textarea',
          why: 'Textarea for multi-line text with character count and auto-resize; Input for one line.',
        },
        {
          type: 'alternative to',
          target: 'text-inputs-phoneinput',
          why: 'PhoneInput formats and validates phone numbers; never use a raw Input type="tel".',
        },
        {
          type: 'alternative to',
          target: 'text-inputs-websiteinput',
          why: 'WebsiteInput validates URLs on blur; never use a raw Input type="url".',
        },
        {
          type: 'composes with',
          target: 'text-inputs-label',
          why: 'Label gives the same label styling to controls that do not render their own; Input already includes it via the label prop.',
        },
        {
          type: 'alternative to',
          target: 'choice-inputs-slider',
          why: 'Input type="number" when the exact figure must be typed or read; Slider for an approximate value in a bounded range.',
        },
        {
          type: 'composes with',
          target: 'choice-inputs-countrycodedropdown',
          why: 'CountryCodeDropdown sits beside an Input holding the national number; validatePhoneNumber / formatE164 check and store it against the chosen country.',
        },
      ],
    },
  },
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    labelVariant: {
      control: 'select',
      options: ['stacked', 'floating'],
      description:
        'stacked: label above the field. floating: label rests inside and floats on focus/value (ignores placeholder).',
    },
    hasError: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
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
    placeholder: 'Enter text...',
  },
};

export const WithLabel: Story = {
  args: {
    label: 'Email',
    placeholder: 'you@example.com',
    type: 'email',
  },
};

export const WithHelperText: Story = {
  args: {
    label: 'Username',
    placeholder: 'johndoe',
    helperText: 'This will be your public display name.',
  },
};

export const WithError: Story = {
  args: {
    label: 'Email',
    placeholder: 'you@example.com',
    defaultValue: 'invalid-email',
    error: 'Please enter a valid email address.',
    hasError: true,
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled Input',
    placeholder: 'Cannot edit',
    disabled: true,
    defaultValue: 'Disabled value',
  },
};

export const Small: Story = {
  args: {
    label: 'Small Input',
    placeholder: 'Small size',
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    label: 'Large Input',
    placeholder: 'Large size',
    size: 'lg',
  },
};

export const Password: Story = {
  args: {
    label: 'Password',
    type: 'password',
    placeholder: '••••••••',
  },
};

export const HiddenLabel: Story = {
  args: {
    label: 'Search',
    hideLabel: true,
    placeholder: 'Search...',
  },
};

export const FloatingLabel: Story = {
  args: {
    label: 'Account number',
    labelVariant: 'floating',
  },
};

export const FloatingLabelWithValue: Story = {
  args: {
    label: 'Recipient’s bank country',
    labelVariant: 'floating',
    defaultValue: 'British Pound',
  },
};

export const FloatingLabelRequired: Story = {
  args: {
    label: 'Sort code',
    labelVariant: 'floating',
    required: true,
  },
};

export const FloatingLabelWithError: Story = {
  args: {
    label: 'Account number',
    labelVariant: 'floating',
    defaultValue: '12',
    error: 'Account number must be 8 digits.',
  },
};

export const FloatingLabelSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Input label="Small" labelVariant="floating" size="sm" />
      <Input label="Medium" labelVariant="floating" size="md" />
      <Input label="Large" labelVariant="floating" size="lg" />
    </div>
  ),
};

export const FloatingLabelDisabled: Story = {
  args: {
    label: 'Sort code',
    labelVariant: 'floating',
    disabled: true,
    defaultValue: '04-00-04',
  },
};
