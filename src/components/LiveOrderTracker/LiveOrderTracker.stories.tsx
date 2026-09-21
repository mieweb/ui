import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';

import { type LiveOrderItem, LiveOrderTracker } from './LiveOrderTracker';

const meta: Meta<typeof LiveOrderTracker> = {
  id: 'dashboard-liveordertracker',
  title: 'Modules/Dashboards/LiveOrderTracker',
  component: LiveOrderTracker,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:beta'],
  parameters: {
    catalog: {"entry": "@mieweb/ui", "relationships": [{"type": "uses", "target": "layout-card", "why": "Order summaries are composed from Cards."}]}, docs: { description: { component: "### What it's for\n\nAn order-status board and compact list built from Card and Badge, with six default status columns.\n\n### Use it when\n\nA workspace needs a recent-order overview with click-through to details.\n\n### Don't use it when\n\nUse a paginated table for the complete history or an editable workflow board for drag-and-drop transitions.\n\n### Example\n\nThe page fetches a bounded recent-order list, maps statuses, passes loading, and navigates from onOrderClick.\n\n### Limitations\n\nIt does not fetch or change status. Counts reflect only supplied orders; fetch full totals separately. Desktop columns reflow on small screens, and custom columns must include the statuses you want visible." } }, layout: 'padded' },
};

export default meta;

type Story = StoryObj<typeof LiveOrderTracker>;

const now = Date.now();
const minutesAgo = (m: number) => new Date(now - m * 60_000).toISOString();

const sample: LiveOrderItem[] = [
  {
    id: 'o6', orderNumber: 'BH-10239', status: 'order_refused',
    employeeName: 'Casey Green', serviceSummary: 'DOT Physical',
    providerName: 'Midwest Occ Health', updatedAt: minutesAgo(30),
  },
  {
    id: 'o1',
    orderNumber: 'BH-10234',
    status: 'order_sent',
    employeeName: 'Alex Rivera',
    serviceSummary: 'DOT Physical',
    providerName: 'Midwest Occ Health',
    updatedAt: minutesAgo(2),
    isFresh: true,
  },
  {
    id: 'o2',
    orderNumber: 'BH-10235',
    status: 'order_accepted',
    employeeName: 'Jamie Chen',
    serviceSummary: 'Drug Screen (10-panel)',
    providerName: 'Concentra',
    updatedAt: minutesAgo(14),
  },
  {
    id: 'o3',
    orderNumber: 'BH-10236',
    status: 'order_in_progress',
    employeeName: 'Sam Patel',
    serviceSummary: 'Respirator Fit + PFT',
    providerName: 'Workfit Medical',
    updatedAt: minutesAgo(45),
  },
  {
    id: 'o4',
    orderNumber: 'BH-10237',
    status: 'order_results_ready',
    employeeName: 'Morgan Lee',
    serviceSummary: 'Audiogram',
    providerName: 'Industrial Health',
    updatedAt: minutesAgo(120),
    isFresh: true,
  },
  {
    id: 'o5',
    orderNumber: 'BH-10238',
    status: 'order_completed',
    employeeName: 'Taylor Park',
    serviceSummary: 'DOT Physical',
    providerName: 'Midwest Occ Health',
    updatedAt: minutesAgo(60 * 24),
  },
];

export const Default: Story = {
  args: {
    orders: sample,
    onOrderClick: () => {},
  },
};

export const Loading: Story = {
  args: { orders: [], loading: true },
};

export const Empty: Story = {
  args: {
    orders: [],
    emptyState: (
      <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        No orders yet — start your first order above.
      </div>
    ),
  },
};
