import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { OrderList, OrderStatus, OrderListTab, defaultOrderTabs } from './OrderList';
import { Button } from '../Button/Button';

const meta: Meta<typeof OrderList> = {
  title: 'Components/OrderList',
  component: OrderList,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof OrderList>;

// Sample order type
interface SampleOrder {
  id: string;
  orderNumber: string;
  employeeName: string;
  status: OrderStatus;
  createdAt: Date;
  services: string[];
}

// Sample data
const sampleOrders: SampleOrder[] = [
  {
    id: '1',
    orderNumber: 'ORD-001',
    employeeName: 'John Smith',
    status: 'pending',
    createdAt: new Date('2024-01-15'),
    services: ['Drug Screen', 'Physical Exam'],
  },
  {
    id: '2',
    orderNumber: 'ORD-002',
    employeeName: 'Jane Doe',
    status: 'active',
    createdAt: new Date('2024-01-14'),
    services: ['Pre-Employment Physical'],
  },
  {
    id: '3',
    orderNumber: 'ORD-003',
    employeeName: 'Bob Johnson',
    status: 'scheduled',
    createdAt: new Date('2024-01-13'),
    services: ['DOT Physical', 'Vision Test'],
  },
  {
    id: '4',
    orderNumber: 'ORD-004',
    employeeName: 'Alice Williams',
    status: 'completed',
    createdAt: new Date('2024-01-12'),
    services: ['Annual Physical'],
  },
  {
    id: '5',
    orderNumber: 'ORD-005',
    employeeName: 'Charlie Brown',
    status: 'invoiced',
    createdAt: new Date('2024-01-11'),
    services: ['Drug Screen'],
  },
  {
    id: '6',
    orderNumber: 'ORD-006',
    employeeName: 'Diana Ross',
    status: 'rejected',
    createdAt: new Date('2024-01-10'),
    services: ['Background Check'],
  },
  {
    id: '7',
    orderNumber: 'ORD-007',
    employeeName: 'Eva Green',
    status: 'in-progress',
    createdAt: new Date('2024-01-09'),
    services: ['Physical Exam', 'Hearing Test'],
  },
];

// Simple order item renderer
function OrderItem({ order }: { order: SampleOrder }) {
  const statusColors: Record<OrderStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    active: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    scheduled: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
    'in-progress': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    invoiced: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
    cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  };

  return (
    <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900 dark:text-white">
              {order.orderNumber}
            </span>
            <span
              className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[order.status]}`}
            >
              {order.status.replace('-', ' ')}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {order.employeeName}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {order.services.join(' • ')}
          </p>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {order.createdAt.toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}

// Interactive wrapper
function InteractiveDemo({
  orders = sampleOrders,
  tabs = defaultOrderTabs,
  showSearch = false,
  showActions = false,
}: {
  orders?: SampleOrder[];
  tabs?: OrderListTab[];
  showSearch?: boolean;
  showActions?: boolean;
}) {
  const [activeTab, setActiveTab] = useState('all');
  const [searchValue, setSearchValue] = useState('');

  const filteredBySearch = searchValue
    ? orders.filter(
        (o) =>
          o.employeeName.toLowerCase().includes(searchValue.toLowerCase()) ||
          o.orderNumber.toLowerCase().includes(searchValue.toLowerCase())
      )
    : orders;

  return (
    <div className="h-[500px] border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
      <OrderList
        orders={filteredBySearch}
        activeTab={activeTab}
        tabs={tabs}
        onTabChange={setActiveTab}
        renderOrder={(order) => <OrderItem order={order} />}
        getOrderStatus={(order) => order.status}
        showSearch={showSearch}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        actions={
          showActions ? (
            <Button size="sm">
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              New Order
            </Button>
          ) : undefined
        }
      />
    </div>
  );
}

export const Default: Story = {
  render: () => <InteractiveDemo />,
};

export const WithSearch: Story = {
  render: () => <InteractiveDemo showSearch />,
};

export const WithActions: Story = {
  render: () => <InteractiveDemo showActions />,
};

export const WithSearchAndActions: Story = {
  render: () => <InteractiveDemo showSearch showActions />,
};

export const SimpleTabs: Story = {
  render: () => (
    <InteractiveDemo
      tabs={[
        { id: 'all', label: 'All Orders' },
        { id: 'active', label: 'Active', statuses: ['active', 'scheduled', 'in-progress'] },
        { id: 'closed', label: 'Closed', statuses: ['completed', 'invoiced', 'rejected', 'cancelled'] },
      ]}
    />
  ),
};

export const Loading: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState('all');

    return (
      <div className="h-[500px] border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
        <OrderList<SampleOrder>
          orders={[]}
          activeTab={activeTab}
          tabs={defaultOrderTabs}
          onTabChange={setActiveTab}
          renderOrder={() => null}
          isLoading
        />
      </div>
    );
  },
};

export const Empty: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState('all');

    return (
      <div className="h-[500px] border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
        <OrderList<SampleOrder>
          orders={[]}
          activeTab={activeTab}
          tabs={defaultOrderTabs}
          onTabChange={setActiveTab}
          renderOrder={() => null}
          emptyMessage="No orders yet. Create your first order to get started."
        />
      </div>
    );
  },
};

export const CustomEmptyIcon: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState('all');

    return (
      <div className="h-[500px] border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
        <OrderList<SampleOrder>
          orders={[]}
          activeTab={activeTab}
          tabs={defaultOrderTabs}
          onTabChange={setActiveTab}
          renderOrder={() => null}
          emptyMessage="All caught up! No pending orders."
          emptyIcon={
            <svg
              className="w-12 h-12 text-green-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />
      </div>
    );
  },
};
