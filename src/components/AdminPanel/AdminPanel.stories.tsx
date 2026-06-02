import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminPanel } from './AdminPanel';
import { CodeTableManager } from '../CodeTableManager';

const meta: Meta<typeof AdminPanel> = {
  title: 'Components/Case Management/AdminPanel',
  component: AdminPanel,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <AdminPanel
      sections={[
        {
          value: 'case-status',
          label: 'Case Status',
          content: (
            <CodeTableManager
              title="Case Status Codes"
              description="Manage case status values"
              items={[{ id: '1', code: 'Open', active: true }]}
              onAdd={() => {}}
              onUpdate={() => {}}
              onDelete={() => {}}
            />
          ),
        },
        {
          value: 'document-type',
          label: 'Document Type',
          content: (
            <CodeTableManager
              title="Document Type Codes"
              description="Manage document classification types"
              items={[{ id: '1', code: 'Medical', active: true }]}
              hasDescription
              onAdd={() => {}}
              onUpdate={() => {}}
              onDelete={() => {}}
            />
          ),
        },
      ]}
    />
  ),
};
