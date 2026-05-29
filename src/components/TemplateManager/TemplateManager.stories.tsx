import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  TemplateManager,
  type TemplateInput,
  type TemplateItem,
} from './TemplateManager';

const meta: Meta<typeof TemplateManager> = {
  title: 'Components/Case Management/TemplateManager',
  component: TemplateManager,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const initialTemplates: TemplateItem[] = [
  {
    id: '1',
    code: 'initial-contact',
    name: 'Initial Contact',
    description: 'Sent when first contacting an employee.',
    content: '<p>Dear {{employeeName}}, regarding case {{caseNumber}}...</p>',
    active: true,
  },
  {
    id: '2',
    code: 'rtw-notice',
    name: 'Return to Work Notice',
    description: 'Notifies the employee of an approved return-to-work date.',
    content: '<p>Your return-to-work date is set.</p>',
    active: false,
  },
];

function Example({ entityLabel }: { entityLabel: string }) {
  const [templates, setTemplates] = useState<TemplateItem[]>(initialTemplates);

  const handleAdd = (input: TemplateInput) =>
    setTemplates((prev) => [...prev, { id: `t-${prev.length + 1}`, ...input }]);
  const handleUpdate = (id: string, updates: Partial<TemplateInput>) =>
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  const handleDelete = (id: string) =>
    setTemplates((prev) => prev.filter((t) => t.id !== id));

  return (
    <TemplateManager
      templates={templates}
      onAdd={handleAdd}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      entityLabel={entityLabel}
      addDescription="Create reusable templates with Mustache variables."
      listDescription="Manage your template library."
    />
  );
}

export const LetterTemplates: Story = {
  render: () => <Example entityLabel="Letter Template" />,
};

export const CaseNoteTemplates: Story = {
  render: () => <Example entityLabel="Case Note Template" />,
};
