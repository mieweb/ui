import type { Meta, StoryObj } from '@storybook/react-vite';

import { ActivityFeed, type ActivityItem } from './ActivityFeed';

const meta: Meta<typeof ActivityFeed> = {
  id: 'dashboard-activityfeed',
  title: 'Modules/Dashboards/ActivityFeed',
  component: ActivityFeed,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:beta'],
  parameters: {
    catalog: {"entry": "@mieweb/ui", "relationships": []}, docs: { description: { component: "### What it's for\n\nRecent events with timestamps, event icons, empty states and optional actions in ActivityFeed.\n\n### Use it when\n\nA dashboard needs a short, chronological summary linked to full records.\n\n### Don't use it when\n\nUse Timeline for a general process chronology or a table for searching an audit history.\n\n### Example\n\nFetch events in the page, pass items and loading, and use each item onClick to open its record.\n\n### Limitations\n\nIt does not fetch, paginate or authorize events. Supply localized titles. Relative timestamps are display text; provide a full audit screen for precise historical review." } }, layout: 'padded' },
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
