import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { InventoryManager } from './InventoryManager';

const mockLogEntries = [
  {
    id: '1',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    createdBy: { id: 'user-1', name: 'John Smith' },
    type: 'credit' as const,
    amount: 50,
    memo: 'Restocked from supplier',
  },
  {
    id: '2',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    createdBy: { id: 'user-2', name: 'Jane Doe' },
    type: 'debit' as const,
    amount: 5,
    memo: 'Order #12345',
  },
  {
    id: '3',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    createdBy: { id: 'user-1', name: 'John Smith' },
    type: 'debit' as const,
    amount: 10,
    memo: 'Order #12340',
  },
  {
    id: '4',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
    createdBy: { id: 'user-3', name: 'Mike Johnson' },
    type: 'credit' as const,
    amount: 100,
    memo: 'Initial inventory setup',
  },
];

const meta: Meta<typeof InventoryManager> = {
  title: 'Data Display/InventoryManager',
  component: InventoryManager,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  args: {
    serviceName: 'COVID-19 Rapid Test',
    currentInventory: 135,
    logEntries: mockLogEntries,
    showUpdateModal: false,
    isLoading: false,
  },
  argTypes: {
    serviceName: {
      description: 'Name of the service/product being managed',
      control: 'text',
    },
    currentInventory: {
      description: 'Current inventory count',
      control: { type: 'number', min: 0 },
    },
    logEntries: {
      description: 'Array of inventory log entries',
      control: 'object',
    },
    showUpdateModal: {
      description: 'Whether the update modal is visible',
      control: 'boolean',
    },
    isLoading: {
      description: 'Loading state for submit action',
      control: 'boolean',
    },
    className: {
      description: 'Additional CSS classes',
      control: 'text',
    },
    onUpdateClick: {
      action: 'update clicked',
    },
    onUpdateModalClose: {
      action: 'modal closed',
    },
    onUpdateSubmit: {
      action: 'update submitted',
    },
  },
};

export default meta;
type Story = StoryObj<typeof InventoryManager>;

export const Default: Story = {};

export const EmptyLog: Story = {
  args: {
    serviceName: 'Drug Screen (5 Panel)',
    currentInventory: 50,
    logEntries: [],
  },
};

export const LowInventory: Story = {
  args: {
    serviceName: 'Flu Vaccine',
    currentInventory: 8,
    logEntries: mockLogEntries.slice(0, 2),
  },
};

// Interactive story with modal
function InteractiveInventoryManager() {
  const [showModal, setShowModal] = useState(false);
  const [inventory, setInventory] = useState(135);
  const [logs, setLogs] = useState(mockLogEntries);

  const handleSubmit = (data: {
    type: 'credit' | 'debit';
    amount: number;
    memo: string;
  }) => {
    const newInventory =
      data.type === 'credit'
        ? inventory + data.amount
        : inventory - data.amount;
    setInventory(newInventory);

    const newLog = {
      id: String(Date.now()),
      createdAt: new Date(),
      createdBy: { id: 'current-user', name: 'Current User' },
      type: data.type,
      amount: data.amount,
      memo: data.memo,
    };
    setLogs([newLog, ...logs]);
    setShowModal(false);
  };

  return (
    <div className="max-w-2xl">
      <InventoryManager
        serviceName="COVID-19 Rapid Test"
        currentInventory={inventory}
        logEntries={logs}
        showUpdateModal={showModal}
        onUpdateClick={() => setShowModal(true)}
        onUpdateModalClose={() => setShowModal(false)}
        onUpdateSubmit={handleSubmit}
      />
    </div>
  );
}

export const Interactive: Story = {
  render: () => <InteractiveInventoryManager />,
};

export const WithModalOpen: Story = {
  args: {
    showUpdateModal: true,
  },
};
