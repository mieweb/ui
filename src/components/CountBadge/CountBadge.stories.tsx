import type { Meta, StoryObj } from '@storybook/react-vite';
import { CountBadge, type CountBadgeItem } from './CountBadge';
import {
  CheckCircleIcon,
  AlertCircleIcon,
  InfoIcon,
  SearchIcon,
  PencilIcon,
  TrashIcon,
} from '../Icons';

const meta: Meta<typeof CountBadge> = {
  title: 'Components/Text & Data Display/CountBadge',
  component: CountBadge,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'default',
        'info',
        'informative',
        'success',
        'warning',
        'alert',
      ],
    },
    icon: {
      table: { disable: true },
    },
  },
};

export default meta;
type Story = StoryObj<typeof CountBadge>;

/** Default gray variant. */
export const Default: Story = {
  args: {
    label: 'Tasks',
    count: 3,
  },
};

/** Info variant using the primary accent color. */
export const Info: Story = {
  args: {
    label: 'Open Enc',
    count: 5,
    variant: 'info',
  },
};

/** Informative variant (blue). */
export const Informative: Story = {
  args: {
    label: 'Notifications',
    count: 12,
    variant: 'informative',
  },
};

/** Success variant (green). */
export const Success: Story = {
  args: {
    label: 'Completed',
    count: 8,
    variant: 'success',
  },
};

/** Warning variant (yellow). */
export const Warning: Story = {
  args: {
    label: 'Due List',
    count: 4,
    variant: 'warning',
  },
};

/** Alert variant (red). */
export const Alert: Story = {
  args: {
    label: 'eSign',
    count: 7,
    variant: 'alert',
  },
};

/** With an icon before the label. */
export const WithIcon: Story = {
  args: {
    label: 'Approved',
    count: 2,
    variant: 'success',
    icon: <CheckCircleIcon size={14} />,
  },
};

/** Row of mixed variants demonstrating typical usage. */
export const ActionRow: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <CountBadge label="Tasks" count={3} />
      <CountBadge label="Open Enc" count={5} variant="info" />
      <CountBadge label="Due List" count={4} variant="warning" />
      <CountBadge label="Order Req" count={4} variant="informative" />
      <CountBadge label="eSign" count={7} variant="alert" />
    </div>
  ),
};

/** All variants side by side. */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <CountBadge label="Default" count={1} variant="default" />
        <CountBadge label="Info" count={2} variant="info" />
        <CountBadge label="Informative" count={3} variant="informative" />
        <CountBadge label="Success" count={4} variant="success" />
        <CountBadge label="Warning" count={5} variant="warning" />
        <CountBadge label="Alert" count={6} variant="alert" />
      </div>
      <p className="text-muted-foreground text-sm">
        Hover over any badge to see the hover state.
      </p>
    </div>
  ),
};

/** With icons on each variant. */
export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <CountBadge
        label="Info"
        count={2}
        variant="informative"
        icon={<InfoIcon size={14} />}
      />
      <CountBadge
        label="Success"
        count={4}
        variant="success"
        icon={<CheckCircleIcon size={14} />}
      />
      <CountBadge
        label="Alert"
        count={1}
        variant="alert"
        icon={<AlertCircleIcon size={14} />}
      />
    </div>
  ),
};

// =============================================================================
// Hover menu stories
// =============================================================================

const sampleTasks: CountBadgeItem[] = [
  { id: '1', label: 'Review lab results', status: 'active' },
  { id: '2', label: 'Sign prescription order', status: 'pending' },
  { id: '3', label: 'Update medication list', status: 'overdue' },
];

const sampleEncounters: CountBadgeItem[] = [
  { id: 'e1', label: 'Office Visit – Smith', status: 'active' },
  { id: 'e2', label: 'Follow-up – Jones', status: 'active' },
  { id: 'e3', label: 'Annual Physical – Lee', status: 'pending' },
  { id: 'e4', label: 'Urgent Care – Patel', status: 'overdue' },
  { id: 'e5', label: 'Telehealth – Davis', status: 'completed' },
];

const sampleEsigns: CountBadgeItem[] = [
  { id: 's1', label: 'Lab Order #4521', status: 'pending' },
  { id: 's2', label: 'Referral – Cardiology', status: 'pending' },
  { id: 's3', label: 'Prescription – Lisinopril', status: 'overdue' },
  { id: 's4', label: 'Office Visit Note', status: 'pending' },
  { id: 's5', label: 'Discharge Summary', status: 'active' },
  { id: 's6', label: 'Radiology Order', status: 'pending' },
  { id: 's7', label: 'PT Referral', status: 'overdue' },
];

/** Hover over the badge to see the item table with default View / Edit / Delete actions. */
export const WithHoverMenu: Story = {
  args: {
    label: 'Tasks',
    count: 3,
    items: sampleTasks,
    onView: (item) => console.log('View:', item),
    onEdit: (item) => console.log('Edit:', item),
    onDelete: (item) => console.log('Delete:', item),
  },
};

/** Info variant with 5 encounters. Hover to see the table. */
export const HoverMenuInfo: Story = {
  render: () => (
    <CountBadge
      label="Open Enc"
      count={5}
      variant="info"
      items={sampleEncounters}
      onView={(item) => console.log('View:', item)}
      onEdit={(item) => console.log('Edit:', item)}
      onDelete={(item) => console.log('Delete:', item)}
    />
  ),
};

/** Alert variant with many items showing scroll behavior. */
export const HoverMenuAlert: Story = {
  render: () => (
    <CountBadge
      label="eSign"
      count={7}
      variant="alert"
      items={sampleEsigns}
      onView={(item) => console.log('View:', item)}
      onEdit={(item) => console.log('Edit:', item)}
      onDelete={(item) => console.log('Delete:', item)}
    />
  ),
};

/** Custom actions in the overflow menu. */
export const HoverMenuCustomActions: Story = {
  render: () => (
    <CountBadge
      label="Due List"
      count={3}
      variant="warning"
      items={sampleTasks}
      actions={[
        {
          key: 'view',
          label: 'View Details',
          icon: <SearchIcon size={12} />,
          onClick: (item) => console.log('View:', item),
        },
        {
          key: 'edit',
          label: 'Edit Item',
          icon: <PencilIcon size={12} />,
          onClick: (item) => console.log('Edit:', item),
        },
        {
          key: 'delete',
          label: 'Remove',
          icon: <TrashIcon size={12} />,
          variant: 'danger',
          onClick: (item) => console.log('Delete:', item),
        },
      ]}
    />
  ),
};

/** Row of badges — some with hover menus, some without. */
export const MixedRow: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <CountBadge
        label="Tasks"
        count={3}
        items={sampleTasks}
        onView={(item) => console.log('View:', item)}
        onEdit={(item) => console.log('Edit:', item)}
        onDelete={(item) => console.log('Delete:', item)}
      />
      <CountBadge label="Open Enc" count={5} variant="info" />
      <CountBadge
        label="eSign"
        count={7}
        variant="alert"
        items={sampleEsigns}
        onView={(item) => console.log('View:', item)}
        onDelete={(item) => console.log('Delete:', item)}
      />
      <CountBadge label="Order Req" count={4} variant="informative" />
    </div>
  ),
};
