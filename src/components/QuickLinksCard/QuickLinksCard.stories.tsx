import type { Meta, StoryObj } from '@storybook/react';
import { QuickLinksCard } from './QuickLinksCard';

const meta: Meta<typeof QuickLinksCard> = {
  component: QuickLinksCard,
  title: 'Components/QuickLinksCard',
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof QuickLinksCard>;

const PlusIcon = (
  <svg
    className="h-5 w-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4v16m8-8H4"
    />
  </svg>
);

const UsersIcon = (
  <svg
    className="h-5 w-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
    />
  </svg>
);

const DocumentIcon = (
  <svg
    className="h-5 w-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
);

const ChartIcon = (
  <svg
    className="h-5 w-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
    />
  </svg>
);

const SettingsIcon = (
  <svg
    className="h-5 w-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

export const Default: Story = {
  args: {
    title: 'Quick Links',
    links: [
      { id: '1', label: 'New Order', icon: PlusIcon },
      { id: '2', label: 'Manage Users', icon: UsersIcon, badge: 3 },
      { id: '3', label: 'View Reports', icon: DocumentIcon },
      { id: '4', label: 'Analytics', icon: ChartIcon },
    ],
  },
};

export const WithDescriptions: Story = {
  args: {
    title: 'Quick Actions',
    links: [
      {
        id: '1',
        label: 'Create Order',
        icon: PlusIcon,
        description: 'Start a new service order',
      },
      {
        id: '2',
        label: 'Invite Users',
        icon: UsersIcon,
        description: 'Add team members to your account',
      },
      {
        id: '3',
        label: 'Generate Report',
        icon: DocumentIcon,
        description: 'Export data and analytics',
      },
      {
        id: '4',
        label: 'Settings',
        icon: SettingsIcon,
        description: 'Configure your preferences',
      },
    ],
  },
};

export const GridLayout: Story = {
  args: {
    title: 'Quick Actions',
    layout: 'grid',
    columns: 2,
    links: [
      { id: '1', label: 'New Order', icon: PlusIcon },
      { id: '2', label: 'Users', icon: UsersIcon },
      { id: '3', label: 'Reports', icon: DocumentIcon },
      { id: '4', label: 'Analytics', icon: ChartIcon },
    ],
  },
};

export const WithBadges: Story = {
  args: {
    title: 'Notifications',
    links: [
      { id: '1', label: 'Pending Orders', icon: DocumentIcon, badge: 12 },
      { id: '2', label: 'User Requests', icon: UsersIcon, badge: 5 },
      { id: '3', label: 'New Messages', icon: PlusIcon, badge: 'New' },
    ],
  },
};

export const WithDisabled: Story = {
  args: {
    title: 'Actions',
    links: [
      { id: '1', label: 'View Orders', icon: DocumentIcon },
      { id: '2', label: 'Create Report', icon: ChartIcon, disabled: true },
      {
        id: '3',
        label: 'Admin Settings',
        icon: SettingsIcon,
        disabled: true,
        description: 'Requires admin access',
      },
    ],
  },
};
