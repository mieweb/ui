import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { InventoryManager } from './InventoryManager';

const meta: Meta<typeof InventoryManager> = {
  title: 'Components/InventoryManager',
  component: InventoryManager,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof InventoryManager>;

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

export const Default: Story = {
  args: {
    serviceName: 'COVID-19 Rapid Test',
    currentInventory: 135,
    logEntries: mockLogEntries,
    onUpdateClick: () => console.log('Update clicked'),
  },
};

export const EmptyLog: Story = {
  args: {
    serviceName: 'Drug Screen (5 Panel)',
    currentInventory: 50,
    logEntries: [],
    onUpdateClick: () => console.log('Update clicked'),
  },
};

export const LowInventory: Story = {
  args: {
    serviceName: 'Flu Vaccine',
    currentInventory: 8,
    logEntries: mockLogEntries.slice(0, 2),
    onUpdateClick: () => console.log('Update clicked'),
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
    serviceName: 'COVID-19 Rapid Test',
    currentInventory: 135,
    logEntries: mockLogEntries,
    showUpdateModal: true,
    onUpdateClick: () => console.log('Update clicked'),
    onUpdateModalClose: () => console.log('Modal closed'),
    onUpdateSubmit: (data) => console.log('Submit:', data),
  },
};
