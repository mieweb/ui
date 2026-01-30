import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  ServiceAccordion,
  ServiceTagCloud,
  ServiceList,
  ServiceLink,
  type ServiceCategory,
  type ServiceItem,
} from './ServiceAccordion';

const mockServices: ServiceItem[] = [
  { name: 'Drug Testing', slug: 'drug-testing', providerCount: 142 },
  { name: 'DOT Physical', slug: 'dot-physical', providerCount: 89 },
  { name: 'Breath Alcohol', slug: 'breath-alcohol', providerCount: 56 },
  { name: 'Hair Testing', slug: 'hair-testing', providerCount: 34 },
  { name: 'Lab Work', slug: 'lab-work', providerCount: 78 },
];

const mockCategories: ServiceCategory[] = [
  {
    name: 'Drug & Alcohol Testing',
    slug: 'drug-alcohol',
    services: [
      { name: 'Urine Drug Test', slug: 'urine-drug-test', providerCount: 142 },
      { name: 'Hair Drug Test', slug: 'hair-drug-test', providerCount: 34 },
      { name: 'Saliva Drug Test', slug: 'saliva-drug-test', providerCount: 28 },
      {
        name: 'Breath Alcohol Test',
        slug: 'breath-alcohol',
        providerCount: 56,
      },
    ],
    defaultExpanded: true,
  },
  {
    name: 'Physical Exams',
    slug: 'physicals',
    services: [
      { name: 'DOT Physical', slug: 'dot-physical', providerCount: 89 },
      {
        name: 'Pre-Employment Physical',
        slug: 'pre-employment',
        providerCount: 67,
      },
      { name: 'Annual Physical', slug: 'annual', providerCount: 45 },
    ],
  },
  {
    name: 'Lab Services',
    slug: 'lab',
    subCategories: [
      {
        name: 'Blood Tests',
        slug: 'blood',
        services: [
          { name: 'Complete Blood Count', slug: 'cbc', providerCount: 78 },
          { name: 'Lipid Panel', slug: 'lipid', providerCount: 65 },
        ],
      },
      {
        name: 'Imaging',
        slug: 'imaging',
        services: [
          { name: 'X-Ray', slug: 'xray', providerCount: 52 },
          { name: 'MRI', slug: 'mri', providerCount: 23 },
        ],
      },
    ],
  },
];

const meta: Meta<typeof ServiceAccordion> = {
  title: 'Search/ServiceAccordion',
  component: ServiceAccordion,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof ServiceAccordion>;

// Default accordion
export const Default: Story = {
  args: {
    categories: mockCategories,
    onServiceClick: (service) => console.log('Clicked:', service.slug),
  },
};

// All variants comparison
export const AllVariants: Story = {
  render: () => (
    <div className="space-y-8">
      {(['default', 'bordered', 'cards'] as const).map((variant) => (
        <div key={variant} className="space-y-2">
          <div className="text-sm font-medium text-gray-500 capitalize">
            {variant}
          </div>
          <ServiceAccordion
            variant={variant}
            categories={mockCategories.slice(0, 2)}
            onServiceClick={(service) => console.log('Clicked:', service.slug)}
          />
        </div>
      ))}
    </div>
  ),
};

// With controlled expanded state
function ControlledExpandedWrapper() {
  const [expanded, setExpanded] = React.useState(['Drug & Alcohol Testing']);
  return (
    <ServiceAccordion
      categories={mockCategories}
      expandedCategories={expanded}
      onExpandedChange={setExpanded}
      onServiceClick={(service) => console.log('Clicked:', service.slug)}
    />
  );
}

export const ControlledExpanded: Story = {
  render: () => <ControlledExpandedWrapper />,
};

// Sub-component: Tag Cloud
export const TagCloudDemo: StoryObj<typeof ServiceTagCloud> = {
  render: () => (
    <ServiceTagCloud
      services={mockServices}
      onServiceClick={(service) => console.log('Clicked:', service.slug)}
    />
  ),
};

// Sub-component: Simple List
export const ListDemo: StoryObj<typeof ServiceList> = {
  render: () => (
    <ServiceList
      services={mockServices}
      onServiceClick={(service) => console.log('Clicked:', service.slug)}
    />
  ),
};

// Sub-component: Service Link
export const ServiceLinkDemo: StoryObj<typeof ServiceLink> = {
  render: () => (
    <div className="space-y-2">
      {mockServices.map((service) => (
        <ServiceLink
          key={service.slug}
          service={service}
          onClick={() => console.log('Clicked:', service.slug)}
        />
      ))}
    </div>
  ),
};
