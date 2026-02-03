import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  OrderList,
  OrderStatus,
  OrderListTab,
  defaultOrderTabs,
} from './OrderList';
import { Button } from '../Button/Button';
import { Badge } from '../Badge/Badge';

const meta: Meta<typeof OrderList> = {
  title: 'Components/OrderList',
  component: OrderList,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A tabbed list view for orders with filtering, search, and customizable rendering. Supports loading states, empty states, and custom actions.',
      },
      canvas: {
        sourceState: 'shown',
      },
    },
  },
  args: {
    showSearch: true,
    isLoading: false,
    emptyMessage: 'No orders found',
    searchPlaceholder: 'Search orders...',
  },
  argTypes: {
    orders: {
      description: 'Array of order items to display',
      control: false,
    },
    activeTab: {
      description: 'Currently selected tab ID',
      control: 'text',
    },
    tabs: {
      description:
        'Array of tab configurations with id, label, count, and statuses',
      control: false,
    },
    onTabChange: {
      description: 'Callback when tab selection changes',
      action: 'tab changed',
    },
    renderOrder: {
      description: 'Render function for each order item',
      control: false,
    },
    getOrderStatus: {
      description: 'Function to extract status from order item for filtering',
      control: false,
    },
    isLoading: {
      description: 'Show loading spinner',
      control: 'boolean',
    },
    emptyMessage: {
      description: 'Message to display when no orders',
      control: 'text',
    },
    emptyIcon: {
      description: 'Custom icon for empty state',
      control: false,
    },
    searchPlaceholder: {
      description: 'Placeholder text for search input',
      control: 'text',
    },
    searchValue: {
      description: 'Controlled search input value',
      control: 'text',
    },
    onSearchChange: {
      description: 'Callback when search value changes',
      action: 'search changed',
    },
    showSearch: {
      description: 'Show the search input',
      control: 'boolean',
    },
    actions: {
      description: 'Slot for additional action buttons',
      control: false,
    },
    className: {
      description: 'Additional CSS class names',
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof OrderList>;

// Helper to render an order item
function renderOrderItem(order: SampleOrder) {
  const statusVariants: Record<
    OrderStatus,
    'default' | 'secondary' | 'success' | 'warning' | 'danger'
  > = {
    pending: 'warning',
    active: 'default',
    scheduled: 'default',
    'in-progress': 'default',
    completed: 'success',
    rejected: 'danger',
    invoiced: 'success',
    cancelled: 'secondary',
  };

  return (
    <div className="hover:bg-muted/50 cursor-pointer p-4 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="text-foreground font-medium">
              {order.orderNumber}
            </span>
            <Badge variant={statusVariants[order.status]} size="sm">
              {order.status.replace('-', ' ')}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">{order.employeeName}</p>
          <p className="text-muted-foreground/70 mt-1 text-xs">
            {order.services.join(' • ')}
          </p>
        </div>
        <span className="text-muted-foreground text-xs">
          {order.createdAt.toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}

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

// Simple order item renderer using Badge component
function OrderItem({ order }: { order: SampleOrder }) {
  const statusVariants: Record<
    OrderStatus,
    'default' | 'secondary' | 'success' | 'warning' | 'danger'
  > = {
    pending: 'warning',
    active: 'default',
    scheduled: 'default',
    'in-progress': 'default',
    completed: 'success',
    rejected: 'danger',
    invoiced: 'success',
    cancelled: 'secondary',
  };

  return (
    <div className="hover:bg-muted/50 cursor-pointer p-4 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="text-foreground font-medium">
              {order.orderNumber}
            </span>
            <Badge variant={statusVariants[order.status]} size="sm">
              {order.status.replace('-', ' ')}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">{order.employeeName}</p>
          <p className="text-muted-foreground/70 mt-1 text-xs">
            {order.services.join(' • ')}
          </p>
        </div>
        <span className="text-muted-foreground text-xs">
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
  isLoading = false,
  emptyMessage,
}: {
  orders?: SampleOrder[];
  tabs?: OrderListTab[];
  showSearch?: boolean;
  showActions?: boolean;
  isLoading?: boolean;
  emptyMessage?: string;
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
    <div className="border-border bg-background h-[500px] overflow-hidden rounded-lg border">
      <OrderList
        orders={filteredBySearch}
        activeTab={activeTab}
        tabs={tabs}
        onTabChange={setActiveTab}
        renderOrder={(order) => <OrderItem order={order} />}
        getOrderStatus={(order) => order.status}
        isLoading={isLoading}
        showSearch={showSearch}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        emptyMessage={emptyMessage}
        actions={
          showActions ? (
            <Button size="sm" variant="ghost" className="whitespace-nowrap">
              + New
            </Button>
          ) : undefined
        }
      />
    </div>
  );
}

/**
 * Playground wrapper component for proper hook usage
 */
function PlaygroundDemo({
  showSearch,
  isLoading,
  emptyMessage,
  searchPlaceholder,
}: {
  showSearch?: boolean;
  isLoading?: boolean;
  emptyMessage?: string;
  searchPlaceholder?: string;
}) {
  const [activeTab, setActiveTab] = useState('all');
  const [searchValue, setSearchValue] = useState('');

  const filteredOrders = searchValue
    ? sampleOrders.filter(
        (o) =>
          o.employeeName.toLowerCase().includes(searchValue.toLowerCase()) ||
          o.orderNumber.toLowerCase().includes(searchValue.toLowerCase())
      )
    : sampleOrders;

  return (
    <div className="border-border bg-background h-[500px] overflow-hidden rounded-lg border">
      <OrderList
        orders={isLoading ? [] : filteredOrders}
        activeTab={activeTab}
        tabs={defaultOrderTabs}
        onTabChange={setActiveTab}
        renderOrder={renderOrderItem}
        getOrderStatus={(order: SampleOrder) => order.status}
        isLoading={isLoading}
        showSearch={showSearch}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        searchPlaceholder={searchPlaceholder}
        emptyMessage={emptyMessage}
        actions={
          <Button size="sm" variant="ghost" className="whitespace-nowrap">
            + New
          </Button>
        }
      />
    </div>
  );
}

export const Default: Story = {
  render: (args) => (
    <PlaygroundDemo
      showSearch={args.showSearch}
      isLoading={args.isLoading}
      emptyMessage={args.emptyMessage}
      searchPlaceholder={args.searchPlaceholder}
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Interactive demo - use controls to toggle showSearch, isLoading, and edit messages.',
      },
    },
  },
};

export const WithSearch: Story = {
  render: () => <InteractiveDemo showSearch />,
  parameters: {
    docs: {
      description: {
        story:
          'Order list with search input for filtering by order number or employee name.',
      },
    },
  },
};

export const WithActions: Story = {
  render: () => <InteractiveDemo showActions />,
  parameters: {
    docs: {
      description: {
        story: 'Order list with action buttons in the header area.',
      },
    },
  },
};

export const WithSearchAndActions: Story = {
  render: () => <InteractiveDemo showSearch showActions />,
  parameters: {
    docs: {
      description: {
        story: 'Full-featured order list with both search and action buttons.',
      },
    },
  },
};

export const SimpleTabs: Story = {
  render: () => (
    <InteractiveDemo
      tabs={[
        { id: 'all', label: 'All Orders' },
        {
          id: 'active',
          label: 'Active',
          statuses: ['active', 'scheduled', 'in-progress'],
        },
        {
          id: 'closed',
          label: 'Closed',
          statuses: ['completed', 'invoiced', 'rejected', 'cancelled'],
        },
      ]}
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Order list with simplified tab configuration - fewer tabs for simpler workflows.',
      },
    },
  },
};

function LoadingWrapper() {
  const [activeTab, setActiveTab] = useState('all');

  return (
    <div className="border-border bg-background h-[500px] overflow-hidden rounded-lg border">
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
}

export const Loading: Story = {
  render: () => <LoadingWrapper />,
  parameters: {
    docs: {
      description: {
        story: 'Shows a loading spinner while orders are being fetched.',
      },
    },
  },
};

function EmptyWrapper() {
  const [activeTab, setActiveTab] = useState('all');

  return (
    <div className="border-border bg-background h-[500px] overflow-hidden rounded-lg border">
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
}

export const Empty: Story = {
  render: () => <EmptyWrapper />,
  parameters: {
    docs: {
      description: {
        story: 'Shows empty state message when no orders are available.',
      },
    },
  },
};

function CustomEmptyIconWrapper() {
  const [activeTab, setActiveTab] = useState('all');

  return (
    <div className="border-border bg-background h-[500px] overflow-hidden rounded-lg border">
      <OrderList<SampleOrder>
        orders={[]}
        activeTab={activeTab}
        tabs={defaultOrderTabs}
        onTabChange={setActiveTab}
        renderOrder={() => null}
        emptyMessage="All caught up! No pending orders."
        emptyIcon={
          <svg
            className="mb-4 h-12 w-12 text-green-400"
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
}

export const CustomEmptyIcon: Story = {
  render: () => <CustomEmptyIconWrapper />,
  parameters: {
    docs: {
      description: {
        story:
          'Empty state with a custom success icon for "all caught up" scenarios.',
      },
    },
  },
};
