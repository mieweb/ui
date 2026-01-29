import type { Meta, StoryObj } from '@storybook/react';
import { ProviderOverview } from './ProviderOverview';

const meta: Meta<typeof ProviderOverview> = {
  title: 'Provider/ProviderOverview',
  component: ProviderOverview,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ProviderOverview>;

const mockStats = {
  pendingOrders: 12,
  completedToday: 8,
  upcomingAppointments: 5,
  linkedEmployers: 24,
  pendingInvoices: 3,
  revenue: 15750,
};

const mockQuickActions = [
  {
    id: 'new-order',
    label: 'New Order',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    ),
    onClick: () => console.log('New order'),
  },
  {
    id: 'view-orders',
    label: 'View Orders',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    onClick: () => console.log('View orders'),
  },
  {
    id: 'employers',
    label: 'Employers',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    onClick: () => console.log('View employers'),
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    onClick: () => console.log('View reports'),
  },
];

const mockActivity = [
  {
    id: '1',
    type: 'order' as const,
    title: 'Order #12345 created',
    description: 'DOT Physical for John Smith',
    timestamp: new Date(Date.now() - 15 * 60000),
    status: 'pending' as const,
  },
  {
    id: '2',
    type: 'appointment' as const,
    title: 'Appointment scheduled',
    description: 'Jane Doe - Drug Screen',
    timestamp: new Date(Date.now() - 45 * 60000),
  },
  {
    id: '3',
    type: 'order' as const,
    title: 'Order #12344 completed',
    description: 'Pre-employment Physical for Mike Johnson',
    timestamp: new Date(Date.now() - 2 * 3600000),
    status: 'completed' as const,
  },
  {
    id: '4',
    type: 'employer' as const,
    title: 'New employer linked',
    description: 'ABC Trucking Company',
    timestamp: new Date(Date.now() - 24 * 3600000),
  },
  {
    id: '5',
    type: 'invoice' as const,
    title: 'Invoice #INV-2024-001 paid',
    description: '$1,250.00',
    timestamp: new Date(Date.now() - 48 * 3600000),
    status: 'completed' as const,
  },
];

export const Default: Story = {
  args: {
    providerName: 'MedCheck Clinic',
    stats: mockStats,
    quickActions: mockQuickActions,
    recentActivity: mockActivity,
    onStatClick: (stat) => console.log('Stat clicked:', stat),
    onActivityClick: (activity) => console.log('Activity clicked:', activity),
  },
};

export const WithLogo: Story = {
  args: {
    providerName: 'MedCheck Clinic',
    logoUrl: 'https://via.placeholder.com/48x48?text=MC',
    stats: mockStats,
    quickActions: mockQuickActions,
    recentActivity: mockActivity,
  },
};

export const StatsOnly: Story = {
  args: {
    providerName: 'Quick Care Occupational',
    stats: mockStats,
  },
};

export const NoActivity: Story = {
  args: {
    providerName: 'New Provider Clinic',
    stats: {
      pendingOrders: 0,
      completedToday: 0,
      upcomingAppointments: 0,
      linkedEmployers: 1,
    },
    quickActions: mockQuickActions,
    recentActivity: [],
  },
};

export const Loading: Story = {
  args: {
    providerName: 'MedCheck Clinic',
    stats: mockStats,
    isLoading: true,
  },
};

export const Mobile: Story = {
  args: {
    providerName: 'MedCheck Clinic',
    stats: mockStats,
    quickActions: mockQuickActions,
    recentActivity: mockActivity.slice(0, 3),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
