import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  ServiceBadge,
  ServiceBadgeGroup,
  ServiceCategoryBadge,
  SelectedServicesBadges,
  DOTBadge,
} from './ServiceBadge';

// Icon components for the Storybook icon selector
function TestTubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" width="1em" height="1em">
      <path d="M7 2v2h1v14a4 4 0 0 0 8 0V4h1V2H7zm6 2v6h-2V4h2zm-2 8h2v6a2 2 0 1 1-4 0v-2.5l2-1.5V12z" />
    </svg>
  );
}

function MedicalIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" width="1em" height="1em">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
    </svg>
  );
}

function BriefcaseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" width="1em" height="1em">
      <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z" />
    </svg>
  );
}

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" width="1em" height="1em">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

function LabIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" width="1em" height="1em">
      <path d="M19.8 18.4L14 10.67V6.5l1.35-1.69c.26-.33.03-.81-.39-.81H9.04c-.42 0-.65.48-.39.81L10 6.5v4.17L4.2 18.4c-.49.66-.02 1.6.8 1.6h14c.82 0 1.29-.94.8-1.6z" />
    </svg>
  );
}

function TagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" width="1em" height="1em">
      <path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z" />
    </svg>
  );
}

const iconMap: Record<string, React.ReactNode> = {
  none: undefined as unknown as React.ReactNode,
  'test-tube': <TestTubeIcon className="h-3.5 w-3.5" />,
  medical: <MedicalIcon className="h-3.5 w-3.5" />,
  briefcase: <BriefcaseIcon className="h-3.5 w-3.5" />,
  heart: <HeartIcon className="h-3.5 w-3.5" />,
  lab: <LabIcon className="h-3.5 w-3.5" />,
  tag: <TagIcon className="h-3.5 w-3.5" />,
};

const mockServices = [
  { id: '1', name: 'Drug Testing', slug: 'drug-testing' },
  { id: '2', name: 'DOT Physical', slug: 'dot-physical' },
  { id: '3', name: 'Breath Alcohol', slug: 'breath-alcohol' },
  { id: '4', name: 'Hair Testing', slug: 'hair-testing' },
];

const meta: Meta<typeof ServiceBadge> = {
  title: 'Provider/ServiceBadge',
  component: ServiceBadge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'default',
        'secondary',
        'success',
        'warning',
        'danger',
        'info',
        'outline',
        'ghost',
      ],
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    icon: {
      control: 'select',
      options: Object.keys(iconMap),
      mapping: iconMap,
      description: 'Icon to display before the label',
    },
    removable: {
      control: 'boolean',
      description: 'Show remove (X) button on the badge',
    },
    interactive: {
      control: 'boolean',
      description: 'Enable hover/focus interactive styles',
    },
    onRemove: { action: 'removed' },
    onClick: { action: 'clicked' },
  },
  args: {
    children: 'Drug Testing',
    icon: 'none' as unknown as React.ReactNode,
    removable: false,
  },
};

export default meta;
type Story = StoryObj<typeof ServiceBadge>;

// Default badge
export const Default: Story = {};

// All variants comparison
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <ServiceBadge variant="default">Default</ServiceBadge>
      <ServiceBadge variant="secondary">Secondary</ServiceBadge>
      <ServiceBadge variant="success">Success</ServiceBadge>
      <ServiceBadge variant="warning">Warning</ServiceBadge>
      <ServiceBadge variant="danger">Danger</ServiceBadge>
      <ServiceBadge variant="info">Info</ServiceBadge>
      <ServiceBadge variant="outline">Outline</ServiceBadge>
      <ServiceBadge variant="ghost">Ghost</ServiceBadge>
    </div>
  ),
};

// All sizes comparison
export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <ServiceBadge size="xs">XS</ServiceBadge>
      <ServiceBadge size="sm">SM</ServiceBadge>
      <ServiceBadge size="md">MD</ServiceBadge>
      <ServiceBadge size="lg">LG</ServiceBadge>
      <ServiceBadge size="xl">XL</ServiceBadge>
    </div>
  ),
};

// Removable badge
function RemovableWrapper() {
  const [visible, setVisible] = React.useState(true);
  if (!visible) {
    return (
      <button
        onClick={() => setVisible(true)}
        className="text-primary-600 underline"
      >
        Reset
      </button>
    );
  }
  return (
    <ServiceBadge removable onRemove={() => setVisible(false)}>
      Remove Me
    </ServiceBadge>
  );
}

export const Removable: Story = {
  render: () => <RemovableWrapper />,
};

// Badge group for provider cards
export const BadgeGroup: StoryObj<typeof ServiceBadgeGroup> = {
  render: () => (
    <div className="max-w-sm">
      <ServiceBadgeGroup maxVisible={3} size="sm">
        <ServiceBadge>Drug Testing</ServiceBadge>
        <ServiceBadge>DOT Physical</ServiceBadge>
        <ServiceBadge>Breath Alcohol</ServiceBadge>
        <ServiceBadge>Hair Testing</ServiceBadge>
        <ServiceBadge>Lab Work</ServiceBadge>
      </ServiceBadgeGroup>
    </div>
  ),
};

// Category badges
export const CategoryBadges: StoryObj<typeof ServiceCategoryBadge> = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <ServiceCategoryBadge category="drug-testing">
        Drug Testing
      </ServiceCategoryBadge>
      <ServiceCategoryBadge category="medical">Medical</ServiceCategoryBadge>
      <ServiceCategoryBadge category="occupational">
        Occupational
      </ServiceCategoryBadge>
    </div>
  ),
};

// Selected services (filter chips)
function SelectedServicesWrapper() {
  const [services, setServices] = React.useState(mockServices.slice(0, 2));
  return (
    <SelectedServicesBadges
      services={services}
      onRemove={(slug) => setServices(services.filter((s) => s.slug !== slug))}
    />
  );
}

export const SelectedServices: StoryObj<typeof SelectedServicesBadges> = {
  render: () => <SelectedServicesWrapper />,
};

// DOT compliance badge
export const DOT: StoryObj<typeof DOTBadge> = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <DOTBadge type="dot-certified" />
      <DOTBadge type="non-dot" />
      <DOTBadge type="fmcsa" />
      <DOTBadge type="faa" />
    </div>
  ),
};
