import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  ServiceBadge,
  ServiceBadgeGroup,
  ServiceCategoryBadge,
  SelectedServicesBadges,
  DOTBadge,
} from './ServiceBadge';
import {
  TestTubeIcon,
  StethoscopeIcon,
  BriefcaseIcon,
  HeartIcon,
  FlaskIcon,
  TagIcon,
} from '../Icons';
import type { LucideIcon } from 'lucide-react';

const iconMap: Record<string, LucideIcon | undefined> = {
  none: undefined,
  'test-tube': TestTubeIcon,
  medical: StethoscopeIcon,
  briefcase: BriefcaseIcon,
  heart: HeartIcon,
  lab: FlaskIcon,
  tag: TagIcon,
};

type ServiceBadgeStoryArgs = React.ComponentProps<typeof ServiceBadge> & {
  iconName?: keyof typeof iconMap;
};

const mockServices = [
  { id: '1', name: 'Drug Testing', slug: 'drug-testing' },
  { id: '2', name: 'DOT Physical', slug: 'dot-physical' },
  { id: '3', name: 'Breath Alcohol', slug: 'breath-alcohol' },
  { id: '4', name: 'Hair Testing', slug: 'hair-testing' },
];

const meta: Meta<ServiceBadgeStoryArgs> = {
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
    icon: { table: { disable: true } },
    iconName: {
      control: 'select',
      options: Object.keys(iconMap),
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
    iconName: 'none',
    removable: false,
  },
  render: ({ iconName, ...args }: ServiceBadgeStoryArgs) => {
    const Icon = iconName ? iconMap[iconName] : undefined;
    return (
      <ServiceBadge
        {...args}
        icon={Icon ? <Icon className="h-3.5 w-3.5" /> : undefined}
      />
    );
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
