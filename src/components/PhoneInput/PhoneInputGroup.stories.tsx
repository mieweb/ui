import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { PhoneInputGroup, type PhoneEntry } from './PhoneInput';

const meta: Meta<typeof PhoneInputGroup> = {
  id: 'text-inputs-phoneinputgroup',
  title: 'Inputs/Text inputs/PhoneInputGroup',
  component: PhoneInputGroup,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `### What it's for

A repeating list of phone numbers, each row a \`PhoneInput\` plus a native \`<select>\` for the \`PhoneType\` (\`cell\` | \`landline\` | \`home\` | \`work\` | \`fax\`) and an add (first row) or remove (later rows) button. Fully controlled through \`value: PhoneEntry[]\` / \`onChange\`; \`minEntries\` (default 1) and \`maxEntries\` (default 5) bound the list, \`required\` applies to the first row only, \`validateOnBlur\` and \`disabled\` fan out to every row, \`typeLabels\` relabels the type options. Exported from the \`PhoneInput\` folder alongside \`PhoneInput\`, \`PhoneEntry\` and \`PhoneType\`.

### Use it when

- A contact, patient or employer record stores several numbers and the type matters (which one is the fax?).
- You want the list to be padded to \`minEntries\` automatically so the form never renders empty.

### Don't use it when

- Exactly one number is collected — \`PhoneInput\`.
- The list is of URLs — \`WebsiteInputGroup\` (same pattern, exported from \`WebsiteInput\`).
- Rows need extra fields (extension, preferred flag, consent) — build your own repeater from \`PhoneInput\`; this component's row shape is fixed.

### Example

\`\`\`tsx
const [phones, setPhones] = React.useState<PhoneEntry[]>([{ number: '', type: 'cell' }]);

<PhoneInputGroup
  label="Phone numbers"
  value={phones}
  onChange={setPhones}
  required
  validateOnBlur
  maxEntries={3}
/>
\`\`\`

\`number\` holds unformatted digits (what \`PhoneInput\` emits); persist the array as-is.

### Limitations

- Each \`PhoneInput\` keeps its own \`<label htmlFor>\` / \`aria-invalid\` / \`role="alert"\` error wiring, but only the first row receives the visible \`label\`; later rows have no label at all (not even sr-only), so screen readers hear just "telephone, edit text".
- The type \`<select>\` has an sr-only \`"Phone type"\` label and the buttons have \`aria-label\` \`"Add phone number"\` / \`"Remove phone number"\` — all hard-coded English, not covered by \`typeLabels\`. Ids are \`phone-type-{index}\`, so two groups on one page produce duplicate ids.
- Removing a row does not move focus or announce the change; no \`aria-live\`. The list is not a \`<fieldset>\`.
- The type select and buttons use hard-coded palette classes (\`border-gray-300 bg-white dark:bg-gray-800\`, \`text-brand-600\`, \`text-red-600\`) rather than the semantic tokens \`Input\` uses, so they can drift from a brand theme. Layout is flex with \`gap-2\` — RTL-safe.
- Depends on \`PhoneInput\` (and therefore \`Input\` and \`utils/phone\`); the type selector is a plain \`<select>\`, not \`Select\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'contains',
          target: 'text-inputs-phoneinput',
          why: 'Every row is a PhoneInput; the group adds the type select and add/remove controls.',
        },
        {
          type: 'alternative to',
          target: 'text-inputs-phoneinput',
          why: 'PhoneInputGroup when a record holds several typed numbers; PhoneInput for exactly one.',
        },
      ],
    },
  },
  argTypes: {
    minEntries: {
      control: 'number',
      description:
        'The list is padded with empty cell entries up to this count.',
    },
    maxEntries: {
      control: 'number',
      description: 'The add button disables at this count.',
    },
    required: {
      control: 'boolean',
      description: 'Marks only the first row required.',
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-[500px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof PhoneInputGroup>;

// Default story with controlled state
function PhoneInputGroupExample(
  props: Partial<React.ComponentProps<typeof PhoneInputGroup>>
) {
  const [phones, setPhones] = useState<PhoneEntry[]>([
    { number: '', type: 'cell' },
  ]);

  return <PhoneInputGroup {...props} value={phones} onChange={setPhones} />;
}

export const Default: Story = {
  render: (args) => <PhoneInputGroupExample {...args} />,
  args: {
    label: 'Phone Number',
    required: true,
  },
};

// Pre-filled with multiple phones
function PrefilledExample() {
  const [phones, setPhones] = useState<PhoneEntry[]>([
    { number: '(555) 123-4567', type: 'cell' },
    { number: '(555) 987-6543', type: 'work' },
    { number: '(555) 111-2222', type: 'fax' },
  ]);

  return (
    <PhoneInputGroup
      value={phones}
      onChange={setPhones}
      label="Phone Numbers"
    />
  );
}

export const Prefilled: Story = {
  render: () => <PrefilledExample />,
  parameters: {
    docs: {
      description: {
        story: 'Phone input group with multiple pre-filled entries.',
      },
    },
  },
};

// With validation
function WithValidationExample() {
  const [phones, setPhones] = useState<PhoneEntry[]>([
    { number: '', type: 'cell' },
  ]);

  return (
    <PhoneInputGroup
      value={phones}
      onChange={setPhones}
      label="Phone Number"
      validateOnBlur
      required
    />
  );
}

export const WithValidation: Story = {
  render: () => <WithValidationExample />,
  parameters: {
    docs: {
      description: {
        story:
          'Phone inputs with validation on blur. Tab out of an incomplete field to see validation.',
      },
    },
  },
};

// Disabled state
function DisabledWrapper() {
  const [phones] = useState<PhoneEntry[]>([
    { number: '(555) 123-4567', type: 'cell' },
    { number: '(555) 987-6543', type: 'work' },
  ]);

  return (
    <PhoneInputGroup
      value={phones}
      onChange={() => {}}
      disabled
      label="Phone Numbers"
    />
  );
}

export const Disabled: Story = {
  render: () => <DisabledWrapper />,
  parameters: {
    docs: {
      description: {
        story: 'Disabled phone input group.',
      },
    },
  },
};

// With custom min/max entries
function MinMaxExample() {
  const [phones, setPhones] = useState<PhoneEntry[]>([
    { number: '', type: 'cell' },
    { number: '', type: 'work' },
  ]);

  return (
    <PhoneInputGroup
      value={phones}
      onChange={setPhones}
      minEntries={2}
      maxEntries={3}
      label="Phone Numbers"
    />
  );
}

export const MinMaxEntries: Story = {
  render: () => <MinMaxExample />,
  parameters: {
    docs: {
      description: {
        story:
          'Minimum 2 entries, maximum 3 entries. Cannot remove below 2 or add above 3.',
      },
    },
  },
};

// Custom type labels (i18n)
function CustomLabelsExample() {
  const [phones, setPhones] = useState<PhoneEntry[]>([
    { number: '', type: 'cell' },
  ]);

  return (
    <PhoneInputGroup
      value={phones}
      onChange={setPhones}
      label="Numéro de téléphone"
      typeLabels={{
        cell: 'Portable',
        landline: 'Fixe',
        home: 'Domicile',
        work: 'Travail',
        fax: 'Fax',
      }}
    />
  );
}

export const CustomTypeLabels: Story = {
  render: () => <CustomLabelsExample />,
  parameters: {
    docs: {
      description: {
        story: 'Phone type labels can be customized for internationalization.',
      },
    },
  },
};

// Mobile viewport
export const Mobile: Story = {
  render: (args) => <PhoneInputGroupExample {...args} />,
  args: {
    label: 'Phone Number',
    required: true,
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story: 'Phone input group on mobile viewport.',
      },
    },
  },
};
