import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';

import { ActivityFeed, type ActivityItem } from './ActivityFeed';

const meta: Meta<typeof ActivityFeed> = {
  title: 'Dashboard/ActivityFeed',
  component: ActivityFeed,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<typeof ActivityFeed>;

const now = Date.now();
const minutesAgo = (m: number) => new Date(now - m * 60_000).toISOString();

const items: ActivityItem[] = [
  {
    id: '1',
    kind: 'results_ready',
    title: 'Results ready for Alex Rivera',
    description: 'DOT Physical — Midwest Occ Health',
    timestamp: minutesAgo(3),
    onClick: () => {},
  },
  {
    id: '2',
    kind: 'order_accepted',
    title: 'Order accepted',
    description: 'BH-10235 — Jamie Chen',
    timestamp: minutesAgo(14),
  },
  {
    id: '3',
    kind: 'employee_added',
    title: 'New employee added',
    description: 'Sam Patel',
    actor: 'you',
    timestamp: minutesAgo(60),
  },
  {
    id: '4',
    kind: 'order_completed',
    title: 'Order completed',
    description: 'BH-10232 — Taylor Park',
    timestamp: minutesAgo(60 * 6),
  },
  {
    id: '5',
    kind: 'invoice_paid',
    title: 'Invoice paid',
    description: 'INV-221 — $1,240.00',
    timestamp: minutesAgo(60 * 26),
  },
];

export const Default: Story = {
  args: { items },
};

export const Loading: Story = {
  args: { items: [], loading: true },
};

export const Empty: Story = {
  args: { items: [] },
};
