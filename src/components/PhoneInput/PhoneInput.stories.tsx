import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { PhoneInput } from './PhoneInput';

const meta: Meta<typeof PhoneInput> = {
  id: 'text-inputs-phoneinput',
  title: 'Inputs/Text inputs/PhoneInput',
  component: PhoneInput,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `### What it's for

The phone-number field. It is an \`Input\` (\`type="tel"\`, \`inputMode="numeric"\`, \`autoComplete="tel-national"\`) that formats as the user types — \`(555) 555-5555\`, or \`+1 (555) 555-5555\` for an 11-digit number starting with 1 — and hands the host **digits only** through \`onChange(value: string)\`; \`onFormattedChange\` gives the display string. \`validateOnBlur\` shows an error unless the number has exactly 10 digits. Every other \`Input\` prop (\`label\`, \`helperText\`, \`error\`, \`required\`, \`size\`, \`labelVariant\`) is accepted. The folder also exports \`PhoneInputGroup\` and the \`PhoneEntry\` / \`PhoneType\` types.

### Use it when

- A form collects one US/Canada phone number and should store it as a bare 10-digit string.
- You want the standard \`Input\` look with formatting the user cannot get wrong.

### Don't use it when

- The record can hold several numbers with a type (cell, work, fax) — \`PhoneInputGroup\`.
- You need international numbers with a country picker or carrier-aware validation — nothing in the library does this yet; the \`+CC\` formatting is best-effort and still fails \`validateOnBlur\`.
- The value is not a phone number — plain \`Input\` (never a raw \`type="tel"\`).

### Example

\`\`\`tsx
const [phone, setPhone] = React.useState(''); // "3175551234"

<PhoneInput
  label="Mobile phone"
  required
  value={phone}
  onChange={setPhone}
  validateOnBlur
  error={serverError}
/>
\`\`\`

The host stores the unformatted digits; the component re-derives the display string whenever \`value\` changes.

### Limitations

- Inherits \`Input\`'s accessibility: \`<label htmlFor>\`, \`aria-invalid\`, \`aria-describedby\` → error \`<p role="alert">\` / helper text. Formatting happens in \`onChange\` with no caret management, so editing in the middle of a number can move the caret when punctuation is inserted.
- The blur error string \`"Please enter a valid 10-digit phone number"\` and the placeholder \`(555) 555-5555\` are hard-coded English (override the placeholder via the \`placeholder\` prop; the message cannot be replaced, only pre-empted by your own \`error\`). A host \`error\` wins over the local one.
- Validation is length-only (10 digits); there is no area-code or carrier check and no \`libphonenumber\` dependency. 11+ digit numbers display with a \`+CC\` prefix but are reported invalid.
- Effectively controlled: \`value\` defaults to \`''\`; there is no \`defaultValue\`.
- RTL, dark mode and theming are whatever \`Input\` provides; the component adds no styling of its own. Depends on \`utils/phone\` (\`formatPhoneNumber\`, \`unformatPhoneNumber\`, \`isValidPhoneNumber\`).`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'text-inputs-input',
          why: 'PhoneInput formats and validates phone numbers; never use a raw Input type="tel".',
        },
        {
          type: 'alternative to',
          target: 'text-inputs-phoneinputgroup',
          why: 'PhoneInputGroup when a record holds several typed numbers; PhoneInput for exactly one.',
        },
        {
          type: 'alternative to',
          target: 'choice-inputs-countrycodedropdown',
          why: 'PhoneInput handles US/Canada 10-digit numbers alone; CountryCodeDropdown + an Input covers international numbers with libphonenumber validation.',
        },
        {
          type: 'uses',
          target: 'text-inputs-input',
          why: 'Renders an Input with type="tel" and inherits its label/error wiring.',
        },
      ],
    },
  },
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  argTypes: {
    validateOnBlur: {
      control: 'boolean',
      description:
        'Show "Please enter a valid 10-digit phone number" on blur when the number is not exactly 10 digits.',
    },
    onChange: {
      description: 'Receives the unformatted digits, not the display string.',
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
        <p className="text-sm text-muted-foreground">
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

export const FloatingLabel: Story = {
  args: {
    label: 'Phone Number',
    labelVariant: 'floating',
  },
};

export const FloatingLabelWithValue: Story = {
  args: {
    label: 'Phone Number',
    labelVariant: 'floating',
    value: '5551234567',
  },
};
