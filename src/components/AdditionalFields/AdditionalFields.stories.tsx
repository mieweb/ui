import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { Input } from '../Input';
import {
  AdditionalFields,
  type AdditionalFieldsProps,
  type KeyValueEntry,
} from './AdditionalFields';

// =============================================================================
// Helpers
// =============================================================================

/**
 * Stateful wrapper that keeps internal value state while forwarding all
 * other args from Storybook controls so they actually take effect.
 */
function StatefulAdditionalFields({
  value: initialValue = [],
  onChange: _onChange,
  ...rest
}: AdditionalFieldsProps) {
  const [fields, setFields] = React.useState<KeyValueEntry[]>(initialValue);

  return (
    <div className="w-full max-w-2xl">
      <AdditionalFields value={fields} onChange={setFields} {...rest} />
      <div className="mt-4 rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
        <h4 className="mb-2 text-sm font-medium">Current Value:</h4>
        <pre className="text-xs">{JSON.stringify(fields, null, 2)}</pre>
      </div>
    </div>
  );
}

// =============================================================================
// Meta
// =============================================================================

const meta: Meta<typeof AdditionalFields> = {
  id: 'composite-forms-additionalfields',
  title: 'Inputs/Composite forms/AdditionalFields',
  component: AdditionalFields,
  render: (args) => <StatefulAdditionalFields {...args} />,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `### What it's for

A **free-form "extra fields" section**: rows of name + value \`Input\`s that the person filling the form adds on the spot, wrapped in a collapsible header with a count badge. Controlled through \`value: KeyValueEntry[]\` (\`{ id, name, value }\`) and \`onChange(entries)\`; \`generateId()\` is exported for creating rows yourself. \`title\` (default "Additional Information (Optional)"), \`defaultExpanded\`, \`collapsible\` (\`false\` renders a plain heading + rows), \`maxEntries\` (default 20, disables the add button), \`namePlaceholder\` / \`valuePlaceholder\` / \`addButtonLabel\`, \`disabled\`. Exports: \`AdditionalFields\`, \`generateId\`, types \`AdditionalFieldsProps\`, \`KeyValueEntry\`.

### Use it when

- A structured form (employee, order, patient) needs an escape hatch for **ad-hoc attributes** you did not model — "Badge colour: blue", "Locker: 14".
- The extra keys are decided by the **end user at fill time** and stored as loose key/value pairs.

### Don't use it when

- An administrator should **design** the custom fields once and reuse them across records with types, options and validation — \`ESheet Builder\` to author the definition, \`ESheet Renderer\` to fill it.
- Keys come from a fixed vocabulary — render \`Select\` / \`Input\` pairs per key, or \`CSVColumnMapper\` when mapping import columns to known fields.
- Values need types other than text (dates, numbers, choices) — this component only offers two text inputs per row.

### Example

\`\`\`tsx
const [extras, setExtras] = useState<KeyValueEntry[]>(
  () => Object.entries(employee.customFields ?? {}).map(([name, value]) => ({ id: generateId(), name, value }))
);

<AdditionalFields title="Custom fields" value={extras} onChange={setExtras} maxEntries={10} />

// on submit, the host serialises and persists:
const customFields = Object.fromEntries(extras.filter((e) => e.name.trim()).map((e) => [e.name, e.value]));
\`\`\`

### Limitations

- Accessibility: the collapsible header is a \`<button aria-expanded aria-controls={contentId}>\`; the content region is \`hidden\` when collapsed. Each row's inputs are \`Input\`s with visually hidden labels "Field name" / "Field value" (identical for every row — screen readers cannot tell row 1 from row 3); the remove button is \`aria-label="Remove field"\` (also not row-specific). No live announcement when rows are added or removed; focus is not moved to a newly added row.
- No validation or de-duplication: empty names, duplicate names and blank values are all allowed and emitted; the host must filter. Nothing is submitted with a form (\`Input\`s have no \`name\`).
- Adding the first row while collapsed auto-expands the section; \`maxEntries\` silently disables the add button with no message.
- i18n: defaults are English props (\`title\`, placeholders, \`addButtonLabel\`); the two hidden labels and "Remove field" are hard-coded English.
- RTL: header uses \`text-left\`; the count badge uses \`ml-1\` (physical). Theming: title \`text-gray-700 dark:text-gray-300\`, remove button \`text-red-600\`, add button and badge use \`brand-*\` classes (\`text-brand-600\`, \`bg-brand-100\`) rather than \`primary-*\` tokens. Depends on \`Button\`, \`Input\` and the \`Icons\` set (\`ChevronDownIcon\`, \`PlusIcon\`, \`TrashIcon\`).`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'composite-forms-esheet-builder',
          why: 'AdditionalFields lets the person filling a form add loose text key/value pairs; ESheet Builder lets an author define typed, reusable fields up front.',
        },
        {
          type: 'alternative to',
          target: 'composite-forms-csvcolumnmapper',
          why: 'AdditionalFields lets the user invent loose key/value pairs; CSVColumnMapper matches incoming columns to fields you already defined.',
        },
        {
          type: 'uses',
          target: 'text-inputs-input',
          why: 'Each row is two Input fields (name and value) with hidden labels.',
        },
      ],
    },
  },
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Title for the collapsible section',
    },
    defaultExpanded: {
      control: 'boolean',
      description: 'Whether the section is initially expanded',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the fields are disabled',
    },
    collapsible: {
      control: 'boolean',
      description: 'Whether to show as collapsible',
    },
    maxEntries: {
      control: 'number',
      description: 'Maximum number of entries allowed',
    },
    namePlaceholder: {
      control: 'text',
      description: 'Placeholder for the field name input',
    },
    valuePlaceholder: {
      control: 'text',
      description: 'Placeholder for the field value input',
    },
    addButtonLabel: {
      control: 'text',
      description: 'Label for the add button',
    },
    value: { table: { disable: true } },
    onChange: { table: { disable: true } },
    className: { table: { disable: true } },
  },
  args: {
    title: 'Additional Information (Optional)',
    defaultExpanded: false,
    disabled: false,
    collapsible: true,
    maxEntries: 20,
    namePlaceholder: 'Field Name',
    valuePlaceholder: 'Field Value',
    addButtonLabel: 'Add Additional Information',
    value: [],
    onChange: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof AdditionalFields>;

// =============================================================================
// Stories
// =============================================================================

export const Default: Story = {};

export const WithExistingData: Story = {
  args: {
    defaultExpanded: true,
    value: [
      { id: 'demo-1', name: 'Employee ID', value: 'EMP-12345' },
      { id: 'demo-2', name: 'Department', value: 'Engineering' },
      { id: 'demo-3', name: 'Cost Center', value: 'CC-001' },
    ],
  },
};

export const ExpandedByDefault: Story = {
  args: {
    defaultExpanded: true,
    title: 'Custom Fields',
  },
};

export const NotCollapsible: Story = {
  args: {
    collapsible: false,
    title: 'Custom Fields',
    value: [{ id: 'demo-nc-1', name: 'Custom Field 1', value: 'Value 1' }],
  },
};

export const Disabled: Story = {
  args: {
    defaultExpanded: true,
    disabled: true,
    value: [
      { id: 'demo-d-1', name: 'Employee ID', value: 'EMP-12345' },
      { id: 'demo-d-2', name: 'Department', value: 'Engineering' },
    ],
  },
};

export const WithMaxEntries: Story = {
  args: {
    defaultExpanded: true,
    maxEntries: 3,
    title: 'Additional Fields (Max 3)',
    value: [
      { id: 'demo-m-1', name: 'Field 1', value: 'Value 1' },
      { id: 'demo-m-2', name: 'Field 2', value: 'Value 2' },
    ],
  },
};

export const CustomLabels: Story = {
  args: {
    title: 'Información Adicional (Opcional)',
    namePlaceholder: 'Nombre del Campo',
    valuePlaceholder: 'Valor del Campo',
    addButtonLabel: 'Agregar Información Adicional',
  },
};

function InFormContextDemo(args: AdditionalFieldsProps) {
  const [fields, setFields] = React.useState<KeyValueEntry[]>([]);

  return (
    <div className="w-full max-w-2xl space-y-6">
      <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
        <h2 className="mb-4 text-lg font-semibold">Employee Information</h2>

        <div className="space-y-4">
          <Input label="Full Name" defaultValue="John Doe" />
          <Input
            label="Email"
            type="email"
            defaultValue="john.doe@example.com"
          />

          <hr className="border-gray-200 dark:border-gray-700" />

          <AdditionalFields {...args} value={fields} onChange={setFields} />
        </div>
      </div>
    </div>
  );
}

export const InFormContext: Story = {
  render: (args) => <InFormContextDemo {...args} />,
};

export const MobileView: Story = {
  args: {
    defaultExpanded: true,
    value: [
      { id: 'demo-mv-1', name: 'Employee ID', value: 'EMP-12345' },
      { id: 'demo-mv-2', name: 'Department', value: 'Engineering' },
    ],
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const ManyFields: Story = {
  args: {
    defaultExpanded: true,
    title: 'Many Custom Fields',
    value: Array.from({ length: 10 }, (_, i) => ({
      id: `demo-mf-${i + 1}`,
      name: `Field ${i + 1}`,
      value: `Value ${i + 1}`,
    })),
  },
};
