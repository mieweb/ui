import type { Meta, StoryObj } from '@storybook/react';
import { QuickAction, QuickActionGroup, QuickActionIcons } from './QuickAction';

const meta: Meta<typeof QuickAction> = {
  title: 'Components/QuickAction',
  component: QuickAction,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    color: {
      control: { type: 'select' },
      options: [
        'primary',
        'green',
        'purple',
        'orange',
        'blue',
        'red',
        'amber',
        'neutral',
      ],
    },
    disabled: {
      control: { type: 'boolean' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof QuickAction>;

export const Default: Story = {
  args: {
    title: 'Schedule Exam',
    subtitle: 'Find providers nearby',
    icon: <QuickActionIcons.Calendar />,
    color: 'primary',
  },
};

export const AllColors: Story = {
  render: () => (
    <div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      style={{ width: '800px' }}
    >
      <QuickAction
        title="Schedule Exam"
        subtitle="Find providers nearby"
        icon={<QuickActionIcons.Calendar />}
        color="primary"
      />
      <QuickAction
        title="My Orders"
        subtitle="View history"
        icon={<QuickActionIcons.Clipboard />}
        color="green"
      />
      <QuickAction
        title="My Profile"
        subtitle="Update your info"
        icon={<QuickActionIcons.User />}
        color="purple"
      />
      <QuickAction
        title="Documents"
        subtitle="Medical cards & records"
        icon={<QuickActionIcons.Document />}
        color="orange"
      />
      <QuickAction
        title="Search"
        subtitle="Find anything"
        icon={<QuickActionIcons.Search />}
        color="blue"
      />
      <QuickAction
        title="Alerts"
        subtitle="Critical issues"
        icon={<QuickActionIcons.Bell />}
        color="red"
      />
      <QuickAction
        title="Notifications"
        subtitle="View all"
        icon={<QuickActionIcons.Bell />}
        color="amber"
      />
      <QuickAction
        title="Settings"
        subtitle="Configure options"
        icon={<QuickActionIcons.Settings />}
        color="neutral"
      />
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    title: 'Disabled Action',
    subtitle: 'This action is disabled',
    icon: <QuickActionIcons.Calendar />,
    color: 'primary',
    disabled: true,
  },
};

export const WithClickHandler: Story = {
  args: {
    title: 'Clickable Action',
    subtitle: 'Click me!',
    icon: <QuickActionIcons.Search />,
    color: 'blue',
    onClick: () => console.log('QuickAction clicked!'),
  },
};

export const AsLink: Story = {
  args: {
    title: 'Documentation',
    subtitle: 'View the docs',
    icon: <QuickActionIcons.Document />,
    color: 'purple',
    as: 'a',
    href: '#docs',
  },
};

export const GroupWithTitle: Story = {
  render: () => (
    <div style={{ width: '900px' }}>
      <QuickActionGroup title="Quick Actions">
        <QuickAction
          title="Schedule Exam"
          subtitle="Find providers nearby"
          icon={<QuickActionIcons.Calendar />}
          color="primary"
        />
        <QuickAction
          title="My Orders"
          subtitle="View history"
          icon={<QuickActionIcons.Clipboard />}
          color="green"
        />
        <QuickAction
          title="My Profile"
          subtitle="Update your info"
          icon={<QuickActionIcons.User />}
          color="purple"
        />
        <QuickAction
          title="Documents"
          subtitle="Medical cards & records"
          icon={<QuickActionIcons.Document />}
          color="orange"
        />
      </QuickActionGroup>
    </div>
  ),
};

export const GroupTwoColumns: Story = {
  render: () => (
    <div style={{ width: '600px' }}>
      <QuickActionGroup title="Settings" columns={{ sm: 2, lg: 2 }}>
        <QuickAction
          title="Settings"
          subtitle="Configure options"
          icon={<QuickActionIcons.Settings />}
          color="neutral"
        />
        <QuickAction
          title="Help"
          subtitle="Get support"
          icon={<QuickActionIcons.Help />}
          color="blue"
        />
      </QuickActionGroup>
    </div>
  ),
};

export const DashboardExample: Story = {
  render: () => (
    <div style={{ width: '900px' }} className="space-y-8">
      <QuickActionGroup title="Quick Actions">
        <QuickAction
          title="Schedule Exam"
          subtitle="Find providers nearby"
          icon={<QuickActionIcons.Calendar />}
          color="primary"
        />
        <QuickAction
          title="My Orders"
          subtitle="3 pending"
          icon={<QuickActionIcons.Clipboard />}
          color="green"
        />
        <QuickAction
          title="My Profile"
          subtitle="Update your info"
          icon={<QuickActionIcons.User />}
          color="purple"
        />
        <QuickAction
          title="Documents"
          subtitle="Medical cards & records"
          icon={<QuickActionIcons.Document />}
          color="orange"
        />
      </QuickActionGroup>
    </div>
  ),
};
