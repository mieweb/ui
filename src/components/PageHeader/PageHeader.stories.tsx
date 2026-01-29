import type { Meta, StoryObj } from '@storybook/react';
import { PageHeader } from './PageHeader';
import { Button } from '../Button/Button';

const meta: Meta<typeof PageHeader> = {
  title: 'Components/PageHeader',
  component: PageHeader,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof PageHeader>;

export const Default: Story = {
  args: {
    title: 'Orders',
    subtitle: 'Manage your referrals and orders',
  },
};

export const WithActions: Story = {
  args: {
    title: 'Provider Services',
    subtitle: 'Configure services offered by this provider',
    actions: (
      <div className="flex gap-2">
        <Button variant="outline" size="sm">
          Export
        </Button>
        <Button size="sm">Add Service</Button>
      </div>
    ),
  },
};

export const WithIcon: Story = {
  args: {
    title: 'Dashboard',
    subtitle: 'Overview of your provider activity',
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
    ),
  },
};

export const Small: Story = {
  args: {
    title: 'Recent Activity',
    size: 'sm',
    bordered: false,
  },
};

export const Large: Story = {
  args: {
    title: 'Welcome Back',
    subtitle: 'Here is what is happening with your providers today',
    size: 'lg',
    actions: <Button>Get Started</Button>,
  },
};

export const WithChildren: Story = {
  args: {
    title: 'Invoices',
    subtitle: 'View and manage invoices',
    children: (
      <div className="flex gap-4 text-sm">
        <button className="text-blue-600 dark:text-blue-400 font-medium border-b-2 border-blue-600 pb-2">
          All
        </button>
        <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 pb-2">
          Draft
        </button>
        <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 pb-2">
          Sent
        </button>
        <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 pb-2">
          Paid
        </button>
      </div>
    ),
  },
};

export const NoBorder: Story = {
  args: {
    title: 'Settings',
    subtitle: 'Manage your account preferences',
    bordered: false,
    actions: <Button variant="outline">Save Changes</Button>,
  },
};

export const ProviderExample: Story = {
  args: {
    title: 'Redimed Downtown',
    subtitle: '123 Main St, Indianapolis, IN 46202',
    icon: (
      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-content-center">
        <svg
          className="w-6 h-6 text-blue-600 dark:text-blue-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      </div>
    ),
    actions: (
      <div className="flex gap-2">
        <Button variant="outline" size="sm">
          Edit
        </Button>
        <Button variant="outline" size="sm">
          View Public
        </Button>
      </div>
    ),
  },
};
