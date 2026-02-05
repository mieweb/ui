import type { Meta, StoryObj } from '@storybook/react';
import { ServiceCard, AddServiceCard } from './ServiceCard';

const meta: Meta<typeof ServiceCard> = {
  title: 'Components/ServiceCard',
  component: ServiceCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    id: {
      control: 'text',
      description: 'Unique service identifier',
    },
    name: {
      control: 'text',
      description: 'Service name displayed on the card',
    },
    description: {
      control: 'text',
      description: 'Optional service description text',
    },
    price: {
      control: 'number',
      description: 'Base price for the service',
    },
    currency: {
      control: 'select',
      options: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
      description: 'Currency code for price formatting',
    },
    currentlyOffered: {
      control: 'boolean',
      description: 'Whether the service is currently available',
    },
    limitedInventory: {
      control: 'boolean',
      description: 'Whether inventory is limited',
    },
    inventoryCount: {
      control: 'number',
      description: 'Current available inventory count',
    },
    inventoryTotal: {
      control: 'number',
      description: 'Total inventory capacity',
    },
    hasCustomAvailability: {
      control: 'boolean',
      description: 'Whether the service has custom availability settings',
    },
    customPricingCount: {
      control: 'number',
      description: 'Number of custom pricing tiers',
    },
    category: {
      control: 'text',
      description: 'Service category label',
    },
    tags: {
      control: 'object',
      description: 'Array of tag labels',
    },
    selected: {
      control: 'boolean',
      description: 'Whether the card is in selected state',
    },
    onClick: {
      action: 'clicked',
      description: 'Callback when card is clicked',
    },
    onEdit: {
      action: 'edit',
      description: 'Callback for edit action',
    },
    onManage: {
      action: 'manage',
      description: 'Callback for manage action',
    },
    onDelete: {
      action: 'delete',
      description: 'Callback for delete action',
    },
  },
  decorators: [
    (Story) => (
      <div className="w-72">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ServiceCard>;

export const Default: Story = {
  args: {
    id: 'svc-1',
    name: 'Drug Screen (5 Panel)',
    price: 45,
  },
};

export const WithDescription: Story = {
  args: {
    id: 'svc-1',
    name: 'Physical Examination',
    description:
      'Comprehensive physical exam including height, weight, blood pressure, vision, and hearing tests.',
    price: 125,
    category: 'DOT Physicals',
  },
};

export const WithInventory: Story = {
  args: {
    id: 'svc-1',
    name: 'COVID-19 Rapid Test',
    description: 'Rapid antigen test with results in 15 minutes.',
    price: 35,
    limitedInventory: true,
    inventoryCount: 47,
    inventoryTotal: 100,
  },
};

export const LowInventory: Story = {
  args: {
    id: 'svc-1',
    name: 'Flu Vaccine',
    description: 'Seasonal influenza vaccine.',
    price: 25,
    limitedInventory: true,
    inventoryCount: 8,
    inventoryTotal: 100,
  },
};

export const NotOffered: Story = {
  args: {
    id: 'svc-1',
    name: 'TB Skin Test',
    description: 'Tuberculosis screening test (currently unavailable).',
    price: 30,
    currentlyOffered: false,
  },
};

export const WithCustomPricing: Story = {
  args: {
    id: 'svc-1',
    name: 'Drug Screen (10 Panel)',
    description: 'Extended drug screening panel.',
    price: 65,
    hasCustomAvailability: true,
    customPricingCount: 3,
  },
};

export const WithTags: Story = {
  args: {
    id: 'svc-1',
    name: 'DOT Physical',
    description: 'Department of Transportation certified physical examination.',
    price: 150,
    category: 'Compliance',
    tags: ['DOT', 'FMCSA', 'CDL', 'Certification'],
  },
};

export const WithActions: Story = {
  args: {
    id: 'svc-1',
    name: 'Drug Screen (5 Panel)',
    description: 'Standard 5-panel drug screening.',
    price: 45,
    onEdit: (id) => console.log('Edit', id),
    onManage: (id) => console.log('Manage', id),
    onDelete: (id) => console.log('Delete', id),
  },
};

export const Clickable: Story = {
  args: {
    id: 'svc-1',
    name: 'Hearing Test',
    description: 'Audiometric examination.',
    price: 40,
    onClick: (id) => console.log('Clicked', id),
  },
};

export const Selected: Story = {
  args: {
    id: 'svc-1',
    name: 'Vision Test',
    description: 'Standard vision screening.',
    price: 35,
    selected: true,
    onClick: (id) => console.log('Clicked', id),
  },
};

export const FullFeatured: Story = {
  args: {
    id: 'svc-1',
    name: 'Comprehensive Health Screen',
    description:
      'Full health screening including blood work, physical exam, and drug test.',
    price: 299,
    category: 'Premium Services',
    tags: ['Premium', 'Annual', 'Executive'],
    limitedInventory: true,
    inventoryCount: 25,
    inventoryTotal: 50,
    hasCustomAvailability: true,
    customPricingCount: 2,
    onEdit: (id) => console.log('Edit', id),
    onManage: (id) => console.log('Manage', id),
  },
};

// AddServiceCard story
export const AddNew: StoryObj<typeof AddServiceCard> = {
  render: () => (
    <AddServiceCard onClick={() => console.log('Add new service')} />
  ),
};

// Grid layout example
export const ServiceGrid: Story = {
  render: () => (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      <AddServiceCard onClick={() => console.log('Add new service')} />
      <ServiceCard
        id="svc-1"
        name="Drug Screen (5 Panel)"
        price={45}
        onManage={(id) => console.log('Manage', id)}
      />
      <ServiceCard
        id="svc-2"
        name="Physical Exam"
        description="Comprehensive physical examination."
        price={125}
        onManage={(id) => console.log('Manage', id)}
      />
      <ServiceCard
        id="svc-3"
        name="COVID-19 Test"
        price={35}
        limitedInventory
        inventoryCount={12}
        inventoryTotal={100}
        onManage={(id) => console.log('Manage', id)}
      />
      <ServiceCard
        id="svc-4"
        name="TB Test"
        price={30}
        currentlyOffered={false}
        onManage={(id) => console.log('Manage', id)}
      />
    </div>
  ),
  decorators: [
    (Story) => (
      <div className="w-full">
        <Story />
      </div>
    ),
  ],
};
