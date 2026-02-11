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
  title: 'Forms/AdditionalFields',
  component: AdditionalFields,
  render: (args) => <StatefulAdditionalFields {...args} />,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          "A collapsible section for adding custom key-value pairs. Useful for additional/custom fields that don't fit into structured forms.",
      },
    },
  },
  tags: ['autodocs'],
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
