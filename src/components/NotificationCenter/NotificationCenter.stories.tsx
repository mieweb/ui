import type { Meta, StoryObj } from '@storybook/react';
import {
  NotificationCenter,
  type Notification,
} from './NotificationCenter';

const meta: Meta<typeof NotificationCenter> = {
  title: 'Provider/NotificationCenter',
  component: NotificationCenter,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    onMarkRead: { action: 'mark read' },
    onMarkAllRead: { action: 'mark all read' },
    onNotificationClick: { action: 'notification click' },
    onDismiss: { action: 'dismiss' },
    onClearAll: { action: 'clear all' },
    onSeeAll: { action: 'see all' },
  },
};

export default meta;
type Story = StoryObj<typeof NotificationCenter>;

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'order',
    title: 'New Order Received',
    message: 'Acme Corporation has submitted a new order for DOT Physical services.',
    timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    isRead: false,
    actionLabel: 'View Order',
    priority: 'normal',
  },
  {
    id: '2',
    type: 'invoice',
    title: 'Invoice Paid',
    message: 'Invoice #INV-2024-042 for $1,250.00 has been paid by TransCo Logistics.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    isRead: false,
    actionLabel: 'View Invoice',
  },
  {
    id: '3',
    type: 'claim',
    title: 'Provider Claim Pending',
    message: 'Dr. Sarah Johnson has submitted a claim request to join your organization.',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    isRead: false,
    actionLabel: 'Review Claim',
    priority: 'high',
  },
  {
    id: '4',
    type: 'message',
    title: 'New Message',
    message: 'You have a new message from Jane Smith regarding order #ORD-2024-156.',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    isRead: true,
    senderName: 'Jane Smith',
    actionLabel: 'Reply',
  },
  {
    id: '5',
    type: 'alert',
    title: 'Invoice Overdue',
    message: 'Invoice #INV-2024-028 is now 15 days past due. Total outstanding: $850.00',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    isRead: true,
    actionLabel: 'Send Reminder',
    priority: 'urgent',
  },
  {
    id: '6',
    type: 'system',
    title: 'System Maintenance',
    message: 'Scheduled maintenance will occur on Saturday from 2:00 AM - 4:00 AM EST.',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    isRead: true,
  },
];

export const Default: Story = {
  args: {
    notifications: mockNotifications,
  },
};

export const AllUnread: Story = {
  args: {
    notifications: mockNotifications.map((n) => ({ ...n, isRead: false })),
  },
};

export const AllRead: Story = {
  args: {
    notifications: mockNotifications.map((n) => ({ ...n, isRead: true })),
  },
};

export const Empty: Story = {
  args: {
    notifications: [],
    emptyMessage: 'You\'re all caught up!',
  },
};

export const Loading: Story = {
  args: {
    notifications: [],
    isLoading: true,
  },
};

export const WithMaxVisible: Story = {
  args: {
    notifications: mockNotifications,
    maxVisible: 3,
  },
};

export const UrgentNotifications: Story = {
  args: {
    notifications: [
      {
        id: '1',
        type: 'alert',
        title: 'Critical: Multiple Invoices Overdue',
        message: '5 invoices totaling $4,250.00 are now past due and require immediate attention.',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        isRead: false,
        actionLabel: 'View Invoices',
        priority: 'urgent',
      },
      {
        id: '2',
        type: 'claim',
        title: 'Action Required: Provider Verification',
        message: 'Your NPI verification is expiring in 3 days. Please update your credentials.',
        timestamp: new Date(Date.now() - 60 * 60 * 1000),
        isRead: false,
        actionLabel: 'Update Now',
        priority: 'urgent',
      },
      ...mockNotifications.slice(2),
    ],
  },
};

export const MixedPriorities: Story = {
  args: {
    notifications: [
      { ...mockNotifications[0], priority: 'normal' },
      { ...mockNotifications[1], priority: 'low' },
      { ...mockNotifications[2], priority: 'high' },
      { ...mockNotifications[3], priority: 'normal' },
      { ...mockNotifications[4], priority: 'urgent' },
    ],
  },
};

export const SingleNotification: Story = {
  args: {
    notifications: [mockNotifications[0]],
  },
};

export const WithSenderAvatars: Story = {
  args: {
    notifications: mockNotifications.map((n, i) => ({
      ...n,
      senderName: ['John Doe', 'Jane Smith', 'Bob Wilson', 'Sarah Johnson', 'Mike Brown', 'System'][i],
      senderAvatar: i % 2 === 0 ? undefined : `https://i.pravatar.cc/100?img=${i + 10}`,
    })),
  },
};

export const NoActions: Story = {
  args: {
    notifications: mockNotifications,
    onMarkAllRead: undefined,
    onClearAll: undefined,
  },
};

export const Mobile: Story = {
  args: {
    notifications: mockNotifications,
    maxVisible: 4,
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};
