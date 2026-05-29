import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { CodeTableManager, type CodeTableItem } from './CodeTableManager';

const meta: Meta<typeof CodeTableManager> = {
  title: 'Components/Case Management/CodeTableManager',
  component: CodeTableManager,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

function Example({
  hasDescription,
  categoryOptions,
  codeLabel,
}: {
  hasDescription?: boolean;
  categoryOptions?: string[];
  codeLabel?: string;
}) {
  const [items, setItems] = useState<CodeTableItem[]>([
    { id: '1', code: 'Open', description: 'Active case', active: true },
    { id: '2', code: 'Closed', description: 'Resolved case', active: false },
  ]);
  let nextId = items.length + 1;
  return (
    <CodeTableManager
      title="Case Status Codes"
      description="Manage case status values"
      items={items}
      hasDescription={hasDescription}
      categoryOptions={categoryOptions}
      codeLabel={codeLabel}
      onAdd={(item) => {
        setItems((prev) => [...prev, { ...item, id: String(nextId++) }]);
      }}
      onUpdate={(id, changes) =>
        setItems((prev) =>
          prev.map((i) => (i.id === id ? { ...i, ...changes } : i))
        )
      }
      onDelete={(id) => setItems((prev) => prev.filter((i) => i.id !== id))}
    />
  );
}

export const Default: Story = { render: () => <Example /> };

export const WithDescription: Story = {
  render: () => <Example hasDescription />,
};

export const Grouped: Story = {
  render: () => (
    <Example
      hasDescription
      codeLabel="Location Name"
      categoryOptions={['US', 'Canada']}
    />
  ),
};
