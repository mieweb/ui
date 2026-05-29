import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  CaseTypeManager,
  type CaseTypeDefinition,
} from './CaseTypeManager';

const meta: Meta<typeof CaseTypeManager> = {
  title: 'Components/Case Management/CaseTypeManager',
  component: CaseTypeManager,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

function Example() {
  const [caseTypes, setCaseTypes] = useState<CaseTypeDefinition[]>([
    {
      id: '1',
      name: 'Short-term Disability',
      defaultTodos: ['Request medical documentation', 'Review eligibility'],
    },
  ]);
  let nextId = caseTypes.length + 1;
  return (
    <CaseTypeManager
      caseTypes={caseTypes}
      onAdd={(ct) =>
        setCaseTypes((prev) => [...prev, { ...ct, id: String(nextId++) }])
      }
      onUpdate={(id, changes) =>
        setCaseTypes((prev) =>
          prev.map((ct) => (ct.id === id ? { ...ct, ...changes } : ct))
        )
      }
      onDelete={(id) =>
        setCaseTypes((prev) => prev.filter((ct) => ct.id !== id))
      }
      onPreviewTodos={(todos) =>
        todos.map((title) => ({ title, dueDate: '2024-02-01' }))
      }
    />
  );
}

export const Default: Story = { render: () => <Example /> };
