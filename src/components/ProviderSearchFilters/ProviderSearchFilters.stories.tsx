import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  ProviderSearchFilters,
  ServiceMultiSelect,
  ActiveFilters,
  CompactFilterBar,
  type ServiceOption,
  type ProviderFilters,
} from './ProviderSearchFilters';

const mockServices: ServiceOption[] = [
  {
    value: 'drug-testing',
    label: 'Drug Testing',
    category: 'Testing',
    count: 142,
  },
  {
    value: 'dot-physical',
    label: 'DOT Physical',
    category: 'Physicals',
    count: 89,
  },
  {
    value: 'breath-alcohol',
    label: 'Breath Alcohol',
    category: 'Testing',
    count: 56,
  },
  {
    value: 'hair-testing',
    label: 'Hair Testing',
    category: 'Testing',
    count: 34,
  },
  { value: 'lab-work', label: 'Lab Work', category: 'Other', count: 78 },
];

const meta: Meta<typeof ProviderSearchFilters> = {
  title: 'Search/ProviderSearchFilters',
  component: ProviderSearchFilters,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof ProviderSearchFilters>;

// Interactive demo
function FiltersDemo(
  props: Partial<React.ComponentProps<typeof ProviderSearchFilters>>
) {
  const [filters, setFilters] = React.useState<ProviderFilters>({
    radius: 25,
    services: [],
  });

  return (
    <div className="max-w-4xl space-y-4">
      <ProviderSearchFilters
        filters={filters}
        onFiltersChange={setFilters}
        services={mockServices}
        {...props}
      />
      <div className="text-sm text-gray-500 dark:text-gray-400">
        <strong>Current filters:</strong>
        <pre className="mt-1">{JSON.stringify(filters, null, 2)}</pre>
      </div>
    </div>
  );
}

// Default horizontal layout
export const Default: Story = {
  render: () => <FiltersDemo />,
};

// Vertical layout
export const Vertical: Story = {
  render: () => <FiltersDemo layout="vertical" />,
};

// Compact layout
export const Compact: Story = {
  render: () => <FiltersDemo layout="compact" />,
};

// Sub-component: Service Multi-Select
function ServiceSelectDemoWrapper() {
  const [selected, setSelected] = React.useState<string[]>([]);
  return (
    <div className="w-80">
      <ServiceMultiSelect
        services={mockServices}
        selectedServices={selected}
        onSelectionChange={setSelected}
        showCounts
      />
    </div>
  );
}

export const ServiceSelectDemo: StoryObj<typeof ServiceMultiSelect> = {
  render: () => <ServiceSelectDemoWrapper />,
};

// Sub-component: Active Filters chips
function ActiveFiltersDemoWrapper() {
  const [filters, setFilters] = React.useState<ProviderFilters>({
    services: ['drug-testing', 'dot-physical'],
    radius: 10,
    zipCode: '46220',
  });
  return (
    <ActiveFilters
      filters={filters}
      services={mockServices}
      onClearFilter={(field, value) => {
        if (field === 'services' && value) {
          setFilters({
            ...filters,
            services: filters.services.filter((s) => s !== value),
          });
        } else if (field === 'zipCode') {
          setFilters({ ...filters, zipCode: undefined });
        } else if (field === 'radius') {
          setFilters({ ...filters, radius: 25 });
        }
      }}
      onClearAll={() => setFilters({ services: [], radius: 25 })}
    />
  );
}

export const ActiveFiltersDemo: StoryObj<typeof ActiveFilters> = {
  render: () => <ActiveFiltersDemoWrapper />,
};

// Sub-component: Compact filter bar
function CompactFilterBarDemoWrapper() {
  const [filters, setFilters] = React.useState<ProviderFilters>({
    radius: 25,
    services: [],
  });
  return (
    <CompactFilterBar
      filters={filters}
      onFiltersChange={setFilters}
      services={mockServices}
    />
  );
}

export const CompactFilterBarDemo: StoryObj<typeof CompactFilterBar> = {
  render: () => <CompactFilterBarDemoWrapper />,
};
