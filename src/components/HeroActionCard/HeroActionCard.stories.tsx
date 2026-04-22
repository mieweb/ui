import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';

import { HeroActionCard } from './HeroActionCard';

const meta: Meta<typeof HeroActionCard> = {
  title: 'Dashboard/HeroActionCard',
  component: HeroActionCard,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<typeof HeroActionCard>;

const PlusIcon = (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

const UserPlusIcon = (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z"
    />
  </svg>
);

const UploadIcon = (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
    />
  </svg>
);

export const Default: Story = {
  args: {
    eyebrow: 'Occupational health',
    title: 'Order testing for an employee',
    description:
      'Send a provider referral in under a minute — they will receive instructions automatically and you will see the status here the moment it changes.',
    primaryAction: {
      label: 'New Order',
      icon: PlusIcon,
      onClick: () => {},
    },
    secondaryActions: [
      { label: 'Add employee', icon: UserPlusIcon, onClick: () => {} },
      { label: 'Bulk order', onClick: () => {} },
      { label: 'Import CSV', icon: UploadIcon, onClick: () => {} },
    ],
  },
};

export const Minimal: Story = {
  args: {
    title: 'Order testing for an employee',
    primaryAction: { label: 'New Order', onClick: () => {} },
  },
};
