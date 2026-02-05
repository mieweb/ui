import type { Meta, StoryObj } from '@storybook/react';
import { ServiceGrid, ServiceGridProps } from './ServiceGrid';

const meta: Meta<typeof ServiceGrid> = {
  title: 'Components/ServiceGrid',
  component: ServiceGrid,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    services: {
      control: 'object',
      description: 'Array of services to display',
    },
    onEdit: {
      action: 'onEdit',
      description: 'Handler for editing a service',
    },
    onManage: {
      action: 'onManage',
      description: 'Handler for managing a service (inventory, pricing, etc.)',
    },
    onDelete: {
      action: 'onDelete',
      description: 'Handler for deleting a service',
    },
    onAdd: {
      action: 'onAdd',
      description: 'Handler for adding a new service',
    },
    showAddCard: {
      control: 'boolean',
      description: 'Whether to show the add card',
    },
    isLoading: {
      control: 'boolean',
      description: 'Loading state',
    },
    skeletonCount: {
      control: { type: 'number', min: 1, max: 12 },
      description: 'Number of skeleton cards to show when loading',
    },
    emptyMessage: {
      control: 'text',
      description: 'Empty state message',
    },
    columns: {
      control: { type: 'select' },
      options: [1, 2, 3, 4],
      description: 'Grid columns',
    },
    gap: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'Gap between cards',
    },
    className: {
      control: 'text',
      description: 'Additional class name',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ServiceGrid>;

const sampleServices: ServiceGridProps['services'] = [
  {
    id: '1',
    name: 'Drug Screen (5-Panel)',
    description: 'Standard 5-panel urine drug screening test',
    price: 45.0,
    currentlyOffered: true,
    limitedInventory: true,
    inventoryCount: 15,
    inventoryTotal: 50,
    category: 'Drug Testing',
  },
  {
    id: '2',
    name: 'DOT Physical',
    description: 'Department of Transportation physical examination',
    price: 125.0,
    currentlyOffered: true,
    customPricingCount: 3,
    category: 'Physicals',
  },
  {
    id: '3',
    name: 'Pre-Employment Physical',
    description: 'Comprehensive physical exam for employment clearance',
    price: 85.0,
    currentlyOffered: true,
    category: 'Physicals',
  },
  {
    id: '4',
    name: 'Hearing Test',
    description: 'Audiometric hearing evaluation',
    price: 35.0,
    currentlyOffered: true,
    hasCustomAvailability: true,
    category: 'Testing',
  },
  {
    id: '5',
    name: 'Vision Screening',
    description: 'Basic vision acuity test',
    price: 25.0,
    currentlyOffered: false,
    category: 'Testing',
  },
  {
    id: '6',
    name: 'Breath Alcohol Test',
    description: 'Breathalyzer alcohol screening',
    price: 35.0,
    currentlyOffered: true,
    limitedInventory: true,
    inventoryCount: 3,
    inventoryTotal: 20,
    category: 'Drug Testing',
  },
];

export const Default: Story = {
  args: {
    services: sampleServices,
    showAddCard: true,
    columns: 3,
    gap: 'md',
    isLoading: false,
    skeletonCount: 6,
    emptyMessage: 'No services available',
  },
};

export const TwoColumns: Story = {
  args: {
    ...Default.args,
    columns: 2,
  },
};

export const FourColumns: Story = {
  args: {
    ...Default.args,
    columns: 4,
  },
};

export const SmallGap: Story = {
  args: {
    ...Default.args,
    gap: 'sm',
  },
};

export const LargeGap: Story = {
  args: {
    ...Default.args,
    gap: 'lg',
  },
};

export const WithoutAddCard: Story = {
  args: {
    ...Default.args,
    showAddCard: false,
  },
};

export const Loading: Story = {
  args: {
    services: [],
    isLoading: true,
    skeletonCount: 6,
    columns: 3,
    gap: 'md',
  },
};

export const LoadingFourColumns: Story = {
  args: {
    services: [],
    isLoading: true,
    skeletonCount: 8,
    columns: 4,
    gap: 'md',
  },
};

export const EmptyState: Story = {
  args: {
    services: [],
    showAddCard: false,
    emptyMessage: 'No services have been added yet.',
    columns: 3,
    gap: 'md',
  },
};

export const EmptyWithAddCard: Story = {
  args: {
    services: [],
    showAddCard: true,
    columns: 3,
    gap: 'md',
  },
};

export const FewServices: Story = {
  args: {
    ...Default.args,
    services: sampleServices.slice(0, 2),
  },
};

const manyServices = Array.from({ length: 12 }, (_, i) => ({
  id: String(i + 1),
  name: `Service ${i + 1}`,
  description: `Description for service ${i + 1}`,
  price: 25 + i * 10,
  currentlyOffered: i % 4 !== 0,
  limitedInventory: i % 3 === 0,
  inventoryCount: i % 3 === 0 ? 10 + i : undefined,
  inventoryTotal: i % 3 === 0 ? 20 : undefined,
}));

export const ManyServices: Story = {
  args: {
    services: manyServices,
    showAddCard: true,
    columns: 4,
    gap: 'md',
  },
};

export const ReadOnly: Story = {
  args: {
    services: sampleServices,
    showAddCard: false,
    columns: 3,
    gap: 'md',
  },
};
