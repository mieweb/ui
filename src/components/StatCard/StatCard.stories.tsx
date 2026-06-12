import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';

import { StatCard } from './StatCard';

const meta: Meta<typeof StatCard> = {
  title: 'Dashboard/StatCard',
  component: StatCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;

type Story = StoryObj<typeof StatCard>;

const PeopleIcon = (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
    />
  </svg>
);

const ClipboardIcon = (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"
    />
  </svg>
);

const ShieldIcon = (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
    />
  </svg>
);

export const Default: Story = {
  args: {
    label: 'Active Employees',
    value: 128,
  },
};

export const WithIconAndDelta: Story = {
  args: {
    label: 'Active Employees',
    value: 128,
    icon: PeopleIcon,
    accent: 'primary',
    delta: { value: 12, label: 'vs last 30 days' },
  },
};

export const WithNegativeDelta: Story = {
  args: {
    label: 'Open Orders',
    value: 34,
    icon: ClipboardIcon,
    accent: 'warning',
    delta: { value: -3, label: 'vs last 7 days' },
  },
};

export const Interactive: Story = {
  args: {
    label: 'Results Ready',
    value: 7,
    icon: ShieldIcon,
    accent: 'success',
    description: 'Click to view',

    onClick: () => alert('Navigate to results'),
  },
};

export const Loading: Story = {
  args: {
    label: 'Compliance Rate',
    value: 0,
    icon: ShieldIcon,
    accent: 'info',
    loading: true,
  },
};

export const Grid: Story = {
  render: () => (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Active Employees"
        value={128}
        icon={PeopleIcon}
        accent="primary"
        delta={{ value: 12, label: 'vs 30d' }}
      />
      <StatCard
        label="Open Orders"
        value={34}
        icon={ClipboardIcon}
        accent="warning"
        delta={{ value: -3, label: 'vs 7d' }}
      />
      <StatCard
        label="Results Ready"
        value={7}
        icon={ShieldIcon}
        accent="success"
        description="Needs review"
      />
      <StatCard
        label="Compliance Rate"
        value="94%"
        icon={ShieldIcon}
        accent="info"
        delta={{ value: 2, label: 'vs 30d' }}
      />
    </div>
  ),
};
