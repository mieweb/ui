import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  ProviderCard,
  ProviderCardGrid,
  ProviderCardSkeleton,
  type Provider,
} from './ProviderCard';

const sampleProvider: Provider = {
  _id: '1',
  name: 'Concentra Urgent Care',
  slug: 'concentra-urgent-care-indianapolis',
  logoURL: 'https://placehold.co/200x100/e6f7ff/0066cc?text=Concentra',
  address: {
    street1: '8501 Bash Street',
    city: 'Indianapolis',
    state: 'IN',
    postalCode: '46250',
  },
  workNumber: '3175555123',
  distance: 2.4,
  verified: true,
  services: [
    { _id: 's1', name: 'DOT Physical', slug: 'dot-physical' },
    { _id: 's2', name: 'Drug Testing', slug: 'drug-testing' },
    { _id: 's3', name: 'Flu Vaccine', slug: 'flu-vaccine' },
  ],
};

const sampleProviderNoLogo: Provider = {
  _id: '2',
  name: 'WorkHealth Occupational Medicine',
  slug: 'workhealth-occupational-medicine',
  address: {
    street1: '1234 Medical Drive',
    city: 'Carmel',
    state: 'IN',
    postalCode: '46032',
  },
  workNumber: '3175559876',
  distance: 5.7,
  services: [
    { _id: 's1', name: 'DOT Physical', slug: 'dot-physical' },
    { _id: 's2', name: 'Workers Comp', slug: 'workers-comp' },
  ],
};

const sampleProviders: Provider[] = [
  sampleProvider,
  sampleProviderNoLogo,
  {
    _id: '3',
    name: 'FastMed Urgent Care',
    slug: 'fastmed-downtown',
    address: {
      street1: '234 Market St',
      city: 'Chicago',
      state: 'IL',
      postalCode: '60601',
    },
    distance: 3.2,
    services: [{ _id: 's1', name: 'Drug Testing', slug: 'drug-testing' }],
  },
];

const meta: Meta<typeof ProviderCard> = {
  title: 'Directory/ProviderCard',
  component: ProviderCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['compact', 'list', 'featured'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof ProviderCard>;

// Default compact card
export const Default: Story = {
  args: {
    provider: sampleProvider,
    variant: 'compact',
    onClick: (provider) => alert(`Clicked ${provider.name}`),
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

// All variants
export const AllVariants: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
          Compact (grid)
        </p>
        <div className="w-80">
          <ProviderCard provider={sampleProvider} variant="compact" />
        </div>
      </div>
      <div>
        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
          List (horizontal)
        </p>
        <div className="max-w-2xl">
          <ProviderCard provider={sampleProvider} variant="list" />
        </div>
      </div>
      <div>
        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
          Featured
        </p>
        <div className="max-w-md">
          <ProviderCard provider={sampleProvider} variant="featured" />
        </div>
      </div>
    </div>
  ),
};

// Without logo (fallback initials)
export const NoLogo: Story = {
  args: {
    provider: sampleProviderNoLogo,
    variant: 'compact',
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

// Provider card grid
export const Grid: StoryObj<typeof ProviderCardGrid> = {
  render: () => (
    <div className="max-w-4xl">
      <ProviderCardGrid
        providers={sampleProviders}
        variant="compact"
        onProviderClick={(provider) => alert(`Clicked ${provider.name}`)}
      />
    </div>
  ),
};

// Loading skeletons
export const Skeleton: StoryObj<typeof ProviderCardSkeleton> = {
  render: () => (
    <div className="space-y-4">
      <div className="w-80">
        <ProviderCardSkeleton variant="compact" />
      </div>
      <div className="max-w-2xl">
        <ProviderCardSkeleton variant="list" />
      </div>
    </div>
  ),
};
