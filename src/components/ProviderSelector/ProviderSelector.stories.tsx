import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ProviderSelector, ProviderOption } from './ProviderSelector';

const meta: Meta<typeof ProviderSelector> = {
  title: 'Components/ProviderSelector',
  component: ProviderSelector,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof ProviderSelector>;

const sampleProviders: ProviderOption[] = [
  {
    id: '1',
    name: 'MedCare Health Services',
    code: 'MEDCARE',
    location: 'Fort Wayne, IN',
    type: 'Occupational Health',
  },
  {
    id: '2',
    name: 'Wellness First Clinic',
    code: 'WFC',
    location: 'Indianapolis, IN',
    type: 'Primary Care',
  },
  {
    id: '3',
    name: 'Industrial Health Partners',
    code: 'IHP',
    location: 'South Bend, IN',
    type: 'Occupational Health',
  },
  {
    id: '4',
    name: 'HealthyWork Solutions',
    code: 'HWS',
    location: 'Evansville, IN',
    type: 'Occupational Health',
  },
  {
    id: '5',
    name: 'Community Care Clinic',
    code: 'CCC',
    location: 'Bloomington, IN',
    type: 'Community Health',
    isActive: false,
  },
];

// Interactive wrapper
function InteractiveDemo(
  props: Partial<React.ComponentProps<typeof ProviderSelector>>
) {
  const [selected, setSelected] = useState<ProviderOption | null>(
    sampleProviders[0]
  );

  return (
    <div className="w-80">
      <ProviderSelector
        selectedProvider={selected}
        providers={sampleProviders}
        onSelect={setSelected}
        {...props}
      />
      {selected && (
        <div className="mt-4 rounded-lg bg-gray-100 p-3 dark:bg-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Selected: <strong>{selected.name}</strong>
          </p>
        </div>
      )}
    </div>
  );
}

export const Default: Story = {
  render: () => <InteractiveDemo />,
};

export const WithLabel: Story = {
  render: () => <InteractiveDemo label="Provider" />,
};

export const WithSearch: Story = {
  render: () => <InteractiveDemo searchable label="Select Provider" />,
};

function NoSelectionWrapper() {
  const [selected, setSelected] = useState<ProviderOption | null>(null);

  return (
    <div className="w-80">
      <ProviderSelector
        selectedProvider={selected}
        providers={sampleProviders}
        onSelect={setSelected}
        label="Provider"
        placeholder="Choose a provider..."
      />
    </div>
  );
}

export const NoSelection: Story = {
  render: () => <NoSelectionWrapper />,
};

export const Loading: Story = {
  render: () => (
    <div className="w-80">
      <ProviderSelector providers={[]} isLoading label="Provider" />
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="w-80">
      <ProviderSelector
        selectedProvider={sampleProviders[0]}
        providers={sampleProviders}
        disabled
        label="Provider"
      />
    </div>
  ),
};

export const SmallSize: Story = {
  render: () => <InteractiveDemo size="sm" label="Provider" />,
};

export const LargeSize: Story = {
  render: () => <InteractiveDemo size="lg" label="Provider" />,
};

const providersWithLogos: ProviderOption[] = [
  {
    id: '1',
    name: 'MedCare Health',
    logoUrl: 'https://placehold.co/40x40/0066cc/white?text=MC',
    location: 'Fort Wayne, IN',
  },
  {
    id: '2',
    name: 'Wellness First',
    logoUrl: 'https://placehold.co/40x40/00cc66/white?text=WF',
    location: 'Indianapolis, IN',
  },
  {
    id: '3',
    name: 'Health Partners',
    logoUrl: 'https://placehold.co/40x40/cc6600/white?text=HP',
    location: 'South Bend, IN',
  },
];

function WithLogosWrapper() {
  const [selected, setSelected] = useState<ProviderOption>(
    providersWithLogos[0]
  );

  return (
    <div className="w-80">
      <ProviderSelector
        selectedProvider={selected}
        providers={providersWithLogos}
        onSelect={setSelected}
        searchable
        label="Provider"
      />
    </div>
  );
}

export const WithLogos: Story = {
  render: () => <WithLogosWrapper />,
};

const manyProviders: ProviderOption[] = Array.from({ length: 20 }, (_, i) => ({
  id: String(i + 1),
  name: `Provider ${i + 1}`,
  code: `PRV${String(i + 1).padStart(3, '0')}`,
  location: `City ${i + 1}, State`,
  type: i % 3 === 0 ? 'Type A' : i % 3 === 1 ? 'Type B' : 'Type C',
}));

function ManyProvidersWrapper() {
  const [selected, setSelected] = useState<ProviderOption>(manyProviders[0]);

  return (
    <div className="w-80">
      <ProviderSelector
        selectedProvider={selected}
        providers={manyProviders}
        onSelect={setSelected}
        searchable
        label="Provider (Searchable)"
      />
    </div>
  );
}

export const ManyProviders: Story = {
  render: () => <ManyProvidersWrapper />,
};

const inactiveProvidersList: ProviderOption[] = [
  {
    id: '1',
    name: 'Active Provider A',
    location: 'Location A',
    isActive: true,
  },
  {
    id: '2',
    name: 'Active Provider B',
    location: 'Location B',
    isActive: true,
  },
  {
    id: '3',
    name: 'Inactive Provider C',
    location: 'Location C',
    isActive: false,
  },
  {
    id: '4',
    name: 'Inactive Provider D',
    location: 'Location D',
    isActive: false,
  },
];

function InactiveProvidersWrapper() {
  const [selected, setSelected] = useState<ProviderOption>(
    inactiveProvidersList[0]
  );

  return (
    <div className="w-80">
      <ProviderSelector
        selectedProvider={selected}
        providers={inactiveProvidersList}
        onSelect={setSelected}
        label="Provider"
      />
    </div>
  );
}

export const InactiveProviders: Story = {
  render: () => <InactiveProvidersWrapper />,
};
