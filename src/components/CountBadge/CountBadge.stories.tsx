import type { Meta, StoryObj } from '@storybook/react';
import { CountBadge } from './CountBadge';
import { CheckCircleIcon, AlertCircleIcon, InfoIcon } from '../Icons';

const meta: Meta<typeof CountBadge> = {
  title: 'Data Display/CountBadge',
  component: CountBadge,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'info', 'informative', 'success', 'warning', 'alert'],
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
      <p className="text-sm text-muted-foreground">Hover over any badge to see the hover state.</p>
    </div>
  ),
};

/** With icons on each variant. */
export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <CountBadge label="Info" count={2} variant="informative" icon={<InfoIcon size={14} />} />
      <CountBadge label="Success" count={4} variant="success" icon={<CheckCircleIcon size={14} />} />
      <CountBadge label="Alert" count={1} variant="alert" icon={<AlertCircleIcon size={14} />} />
    </div>
  ),
};
