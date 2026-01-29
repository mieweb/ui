import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ServiceGrid, ServiceGridProps } from './ServiceGrid';

const meta: Meta<typeof ServiceGrid> = {
  title: 'Components/ServiceGrid',
  component: ServiceGrid,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
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

// Interactive demo
function InteractiveDemo(props: Partial<ServiceGridProps>) {
  const [services, setServices] = useState(sampleServices);

  const handleAdd = () => {
    const newId = String(services.length + 1);
    setServices([
      ...services,
      {
        id: newId,
        name: `New Service ${newId}`,
        description: 'A newly added service',
        price: 50.0,
        currentlyOffered: true,
      },
    ]);
  };

  const handleDelete = (id: string) => {
    setServices(services.filter((s) => s.id !== id));
  };

  const handleEdit = (id: string) => {
    console.log('Edit service:', id);
  };

  const handleManage = (id: string) => {
    console.log('Manage service:', id);
  };

  return (
    <ServiceGrid
      services={services}
      onAdd={handleAdd}
      onEdit={handleEdit}
      onManage={handleManage}
      onDelete={handleDelete}
      {...props}
    />
  );
}

export const Default: Story = {
  render: () => <InteractiveDemo />,
};

export const TwoColumns: Story = {
  render: () => <InteractiveDemo columns={2} />,
};

export const FourColumns: Story = {
  render: () => <InteractiveDemo columns={4} />,
};

export const SmallGap: Story = {
  render: () => <InteractiveDemo gap="sm" />,
};

export const LargeGap: Story = {
  render: () => <InteractiveDemo gap="lg" />,
};

export const WithoutAddCard: Story = {
  render: () => <InteractiveDemo showAddCard={false} />,
};

export const Loading: Story = {
  render: () => <ServiceGrid services={[]} isLoading skeletonCount={6} />,
};

export const LoadingFourColumns: Story = {
  render: () => (
    <ServiceGrid services={[]} isLoading skeletonCount={8} columns={4} />
  ),
};

export const EmptyState: Story = {
  render: () => (
    <ServiceGrid
      services={[]}
      showAddCard={false}
      emptyMessage="No services have been added yet."
    />
  ),
};

export const EmptyWithAddCard: Story = {
  render: () => <InteractiveDemo services={[]} showAddCard />,
  args: {
    services: [],
    showAddCard: true,
  },
};

export const FewServices: Story = {
  render: () => <InteractiveDemo services={sampleServices.slice(0, 2)} />,
};

export const ManyServices: Story = {
  render: () => {
    const manyServices = Array.from({ length: 12 }, (_, i) => ({
      id: String(i + 1),
      name: `Service ${i + 1}`,
      description: `Description for service ${i + 1}`,
      price: 25 + i * 10,
      currentlyOffered: i % 4 !== 0,
      limitedInventory: i % 3 === 0,
      inventoryCount: i % 3 === 0 ? Math.floor(Math.random() * 20) : undefined,
      inventoryTotal: i % 3 === 0 ? 20 : undefined,
    }));

    return <InteractiveDemo services={manyServices} columns={4} />;
  },
};

export const ReadOnly: Story = {
  render: () => <ServiceGrid services={sampleServices} showAddCard={false} />,
};
