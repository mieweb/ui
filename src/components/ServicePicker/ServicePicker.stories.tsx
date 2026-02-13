import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { ServicePicker, type ServiceGroup } from './ServicePicker';

const meta: Meta<typeof ServicePicker> = {
  title: 'Inputs & Controls/ServicePicker',
  component: ServicePicker,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A service picker component with search, grouping, and multi-select support. Used for selecting services/tests in order flows.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="border-border h-[500px] w-[400px] overflow-hidden rounded-lg border">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ServicePicker>;

// Sample data
const sampleGroups: ServiceGroup[] = [
  {
    id: 'drug-testing',
    name: 'Drug Testing',
    services: [
      { id: 'dt-5', name: '5-Panel Drug Test', code: 'DT5', price: 45.0 },
      { id: 'dt-10', name: '10-Panel Drug Test', code: 'DT10', price: 65.0 },
      { id: 'dt-12', name: '12-Panel Drug Test', code: 'DT12', price: 85.0 },
    ],
    subGroups: [
      {
        id: 'dot-testing',
        name: 'DOT Testing',
        services: [
          {
            id: 'dot-pre',
            name: 'DOT Pre-Employment',
            code: 'DOTPRE',
            price: 55.0,
          },
          {
            id: 'dot-random',
            name: 'DOT Random',
            code: 'DOTRAND',
            price: 55.0,
          },
          {
            id: 'dot-post',
            name: 'DOT Post-Accident',
            code: 'DOTPA',
            price: 75.0,
          },
        ],
        subGroups: [],
      },
    ],
  },
  {
    id: 'physicals',
    name: 'Physicals',
    services: [
      { id: 'phys-basic', name: 'Basic Physical', code: 'PHYS', price: 95.0 },
      { id: 'phys-dot', name: 'DOT Physical', code: 'DOTPHYS', price: 125.0 },
      {
        id: 'phys-exec',
        name: 'Executive Physical',
        code: 'EXECPHYS',
        price: 350.0,
      },
    ],
    subGroups: [],
  },
  {
    id: 'lab-work',
    name: 'Lab Work',
    services: [
      { id: 'lab-cbc', name: 'Complete Blood Count', code: 'CBC', price: 25.0 },
      {
        id: 'lab-cmp',
        name: 'Comprehensive Metabolic Panel',
        code: 'CMP',
        price: 35.0,
      },
      { id: 'lab-lipid', name: 'Lipid Panel', code: 'LIPID', price: 30.0 },
      { id: 'lab-tsh', name: 'TSH (Thyroid)', code: 'TSH', price: 40.0 },
    ],
    subGroups: [],
  },
  {
    id: 'vaccinations',
    name: 'Vaccinations',
    services: [
      { id: 'vax-flu', name: 'Flu Shot', code: 'FLU', price: 35.0 },
      { id: 'vax-hepb', name: 'Hepatitis B', code: 'HEPB', price: 75.0 },
      { id: 'vax-tdap', name: 'Tdap', code: 'TDAP', price: 65.0 },
      { id: 'vax-mmr', name: 'MMR', code: 'MMR', price: 95.0 },
    ],
    subGroups: [],
  },
];

// Default story with controlled state
function ServicePickerExample(
  props: Partial<React.ComponentProps<typeof ServicePicker>>
) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  return (
    <div className="flex h-full flex-col">
      <ServicePicker
        {...props}
        groups={sampleGroups}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        fullWidth
      />
      <div className="border-border bg-muted/50 border-t p-3">
        <p className="text-muted-foreground text-xs">
          Selected: {selectedIds.length > 0 ? selectedIds.join(', ') : 'None'}
        </p>
      </div>
    </div>
  );
}

export const Default: Story = {
  render: (args) => <ServicePickerExample {...args} />,
  args: {
    showSearch: true,
    multiple: true,
  },
};

// With pre-selected services
function PreselectedExample() {
  const [selectedIds, setSelectedIds] = useState<string[]>([
    'dt-5',
    'phys-basic',
  ]);

  return (
    <ServicePicker
      groups={sampleGroups}
      selectedIds={selectedIds}
      onSelectionChange={setSelectedIds}
      fullWidth
    />
  );
}

export const Preselected: Story = {
  render: () => <PreselectedExample />,
  parameters: {
    docs: {
      description: { story: 'Service picker with pre-selected services.' },
    },
  },
};

// Single selection mode
function SingleSelectExample() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  return (
    <ServicePicker
      groups={sampleGroups}
      selectedIds={selectedIds}
      onSelectionChange={setSelectedIds}
      multiple={false}
      fullWidth
    />
  );
}

export const SingleSelect: Story = {
  render: () => <SingleSelectExample />,
  parameters: {
    docs: {
      description: { story: 'Service picker in single-select (radio) mode.' },
    },
  },
};

// Without search
export const NoSearch: Story = {
  render: (args) => <ServicePickerExample {...args} />,
  args: {
    showSearch: false,
    multiple: true,
  },
  parameters: {
    docs: {
      description: { story: 'Service picker without the search input.' },
    },
  },
};

// Loading state
function LoadingWrapper() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  return (
    <ServicePicker
      groups={[]}
      selectedIds={selectedIds}
      onSelectionChange={setSelectedIds}
      loading
      fullWidth
    />
  );
}

export const Loading: Story = {
  render: () => <LoadingWrapper />,
  parameters: {
    docs: {
      description: { story: 'Service picker in loading state.' },
    },
  },
};

// Error state
function ErrorWrapper() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  return (
    <ServicePicker
      groups={[]}
      selectedIds={selectedIds}
      onSelectionChange={setSelectedIds}
      error="Failed to load services. Please try again."
      fullWidth
    />
  );
}

export const Error: Story = {
  render: () => <ErrorWrapper />,
  parameters: {
    docs: {
      description: { story: 'Service picker showing an error state.' },
    },
  },
};

// Empty state
function EmptyWrapper() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  return (
    <ServicePicker
      groups={[]}
      selectedIds={selectedIds}
      onSelectionChange={setSelectedIds}
      emptyMessage="No services available for this location."
      fullWidth
    />
  );
}

export const Empty: Story = {
  render: () => <EmptyWrapper />,
  parameters: {
    docs: {
      description: { story: 'Service picker with no available services.' },
    },
  },
};

// Custom heading
export const CustomHeading: Story = {
  render: (args) => <ServicePickerExample {...args} />,
  args: {
    heading: 'Select Tests for Order',
    showSearch: true,
    multiple: true,
  },
  parameters: {
    docs: {
      description: { story: 'Service picker with custom heading text.' },
    },
  },
};

// Hidden heading
export const HiddenHeading: Story = {
  render: (args) => <ServicePickerExample {...args} />,
  args: {
    hideHeading: true,
    showSearch: true,
    multiple: true,
  },
  parameters: {
    docs: {
      description: { story: 'Service picker without the heading.' },
    },
  },
};

// Mobile viewport
export const Mobile: Story = {
  render: (args) => <ServicePickerExample {...args} />,
  args: {
    showSearch: true,
    multiple: true,
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: { story: 'Service picker on mobile viewport.' },
    },
  },
};
