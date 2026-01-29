import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import {
  AdditionalFields,
  generateId,
  type KeyValueEntry,
} from './AdditionalFields';

const meta: Meta<typeof AdditionalFields> = {
  title: 'Forms/AdditionalFields',
  component: AdditionalFields,
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
  },
};

export default meta;
type Story = StoryObj<typeof AdditionalFields>;

// =============================================================================
// Stories
// =============================================================================

function DefaultDemo() {
  const [fields, setFields] = React.useState<KeyValueEntry[]>([]);

  return (
    <div className="w-full max-w-2xl">
      <AdditionalFields value={fields} onChange={setFields} />
      <div className="mt-4 rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
        <h4 className="mb-2 text-sm font-medium">Current Value:</h4>
        <pre className="text-xs">{JSON.stringify(fields, null, 2)}</pre>
      </div>
    </div>
  );
}

export const Default: Story = {
  render: () => <DefaultDemo />,
};

function WithExistingDataDemo() {
  const [fields, setFields] = React.useState<KeyValueEntry[]>([
    { id: generateId(), name: 'Employee ID', value: 'EMP-12345' },
    { id: generateId(), name: 'Department', value: 'Engineering' },
    { id: generateId(), name: 'Cost Center', value: 'CC-001' },
  ]);

  return (
    <div className="w-full max-w-2xl">
      <AdditionalFields
        value={fields}
        onChange={setFields}
        defaultExpanded={true}
      />
    </div>
  );
}

export const WithExistingData: Story = {
  render: () => <WithExistingDataDemo />,
};

function ExpandedByDefaultDemo() {
  const [fields, setFields] = React.useState<KeyValueEntry[]>([]);

  return (
    <div className="w-full max-w-2xl">
      <AdditionalFields
        value={fields}
        onChange={setFields}
        defaultExpanded={true}
        title="Custom Fields"
      />
    </div>
  );
}

export const ExpandedByDefault: Story = {
  render: () => <ExpandedByDefaultDemo />,
};

function NotCollapsibleDemo() {
  const [fields, setFields] = React.useState<KeyValueEntry[]>([
    { id: generateId(), name: 'Custom Field 1', value: 'Value 1' },
  ]);

  return (
    <div className="w-full max-w-2xl">
      <AdditionalFields
        value={fields}
        onChange={setFields}
        collapsible={false}
        title="Custom Fields"
      />
    </div>
  );
}

export const NotCollapsible: Story = {
  render: () => <NotCollapsibleDemo />,
};

function DisabledDemo() {
  const [fields] = React.useState<KeyValueEntry[]>([
    { id: generateId(), name: 'Employee ID', value: 'EMP-12345' },
    { id: generateId(), name: 'Department', value: 'Engineering' },
  ]);

  return (
    <div className="w-full max-w-2xl">
      <AdditionalFields
        value={fields}
        onChange={() => {}}
        defaultExpanded={true}
        disabled
      />
    </div>
  );
}

export const Disabled: Story = {
  render: () => <DisabledDemo />,
};

function WithMaxEntriesDemo() {
  const [fields, setFields] = React.useState<KeyValueEntry[]>([
    { id: generateId(), name: 'Field 1', value: 'Value 1' },
    { id: generateId(), name: 'Field 2', value: 'Value 2' },
  ]);

  return (
    <div className="w-full max-w-2xl">
      <AdditionalFields
        value={fields}
        onChange={setFields}
        defaultExpanded={true}
        maxEntries={3}
        title="Additional Fields (Max 3)"
      />
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Maximum 3 entries allowed. Currently: {fields.length}/3
      </p>
    </div>
  );
}

export const WithMaxEntries: Story = {
  render: () => <WithMaxEntriesDemo />,
};

function CustomLabelsDemo() {
  const [fields, setFields] = React.useState<KeyValueEntry[]>([]);

  return (
    <div className="w-full max-w-2xl">
      <AdditionalFields
        value={fields}
        onChange={setFields}
        title="Información Adicional (Opcional)"
        namePlaceholder="Nombre del Campo"
        valuePlaceholder="Valor del Campo"
        addButtonLabel="Agregar Información Adicional"
      />
    </div>
  );
}

export const CustomLabels: Story = {
  render: () => <CustomLabelsDemo />,
};

function InFormContextDemo() {
  const [fields, setFields] = React.useState<KeyValueEntry[]>([]);

  return (
    <div className="w-full max-w-2xl space-y-6">
      <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
        <h2 className="mb-4 text-lg font-semibold">Employee Information</h2>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="demo-fullname"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Full Name
            </label>
            <input
              id="demo-fullname"
              type="text"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
              defaultValue="John Doe"
            />
          </div>

          <div>
            <label
              htmlFor="demo-email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Email
            </label>
            <input
              id="demo-email"
              type="email"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
              defaultValue="john.doe@example.com"
            />
          </div>

          <hr className="border-gray-200 dark:border-gray-700" />

          <AdditionalFields value={fields} onChange={setFields} />
        </div>
      </div>
    </div>
  );
}

export const InFormContext: Story = {
  render: () => <InFormContextDemo />,
};

function MobileViewDemo() {
  const [fields, setFields] = React.useState<KeyValueEntry[]>([
    { id: generateId(), name: 'Employee ID', value: 'EMP-12345' },
    { id: generateId(), name: 'Department', value: 'Engineering' },
  ]);

  return (
    <div className="w-full max-w-sm">
      <AdditionalFields
        value={fields}
        onChange={setFields}
        defaultExpanded={true}
      />
    </div>
  );
}

export const MobileView: Story = {
  render: () => <MobileViewDemo />,
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

function ManyFieldsDemo() {
  const [fields, setFields] = React.useState<KeyValueEntry[]>(
    Array.from({ length: 10 }, (_, i) => ({
      id: generateId(),
      name: `Field ${i + 1}`,
      value: `Value ${i + 1}`,
    }))
  );

  return (
    <div className="w-full max-w-2xl">
      <AdditionalFields
        value={fields}
        onChange={setFields}
        defaultExpanded={true}
        title="Many Custom Fields"
      />
    </div>
  );
}

export const ManyFields: Story = {
  render: () => <ManyFieldsDemo />,
};
