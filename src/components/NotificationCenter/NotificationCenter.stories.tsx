import type { Meta, StoryObj } from '@storybook/react';

import { type Notification, NotificationCenter } from './NotificationCenter';

const meta: Meta<typeof NotificationCenter> = {
  id: 'feedback-notificationcenter',
  title: 'Components/Feedback/NotificationCenter',
  component: NotificationCenter,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `### What it's for

A persistent, readable list of notifications: type icon, title, message, timestamp, sender (\`Avatar\`), unread highlight and per-item dismiss, plus "mark all read", "clear all" and "see all" affordances. It renders whatever \`notifications\` you pass — fetching, storage and read state live in the host.

### Use it when

- Users need to catch up on things that happened while they were away (orders received, results uploaded, invoices paid) and act on them later.
- A bell menu or inbox panel in the app header.

### Don't use it when

- The message is about what the user just did — \`Toast\`.
- The list is a conversation — use the Chat components.
- There is no notion of read/unread or history; a plain list of \`Alert\`s is simpler.

### Example

\`\`\`tsx
const { notifications, markRead, markAllRead, dismiss } = useNotifications();

<NotificationCenter
  notifications={notifications}
  maxVisible={8}
  onNotificationClick={(n) => { markRead(n.id); if (n.actionUrl) navigate(n.actionUrl); }}
  onMarkAllRead={markAllRead}
  onDismiss={dismiss}
  onSeeAll={() => navigate('/notifications')}
/>
\`\`\`

### Limitations

- Each item is a clickable card (\`role="button"\`, \`tabIndex=0\`) that also contains buttons; this intentional nested-interactive pattern is excluded from the automated a11y rule here. Keep inner actions few and give them clear \`aria-label\`s.
- Timestamps are rendered as given — format and localise them before passing.
- Fixed max height with internal scroll (\`max-h-[400px]\`); wrap in your own popover or \`Sheet\`.
- \`emptyMessage\` and button labels default to English.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'feedback-toast',
          why: 'Toast for the moment; NotificationCenter for the history users return to.',
        },
        {
          type: 'uses',
          target: 'data-display-avatar',
          why: 'Sender avatars.',
        },
        {
          type: 'uses',
          target: 'actions-button',
          why: 'Header and footer actions.',
        },
      ],
    },
    a11y: {
      config: {
        // NotificationCenter uses a clickable card pattern (onClick on card)
        // with inner action buttons — this is an intentional UX pattern that
        // triggers nested-interactive. Not fixable without architectural change.
        rules: [{ id: 'nested-interactive', enabled: false }],
      },
    },
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
    message:
      'Acme Corporation has submitted a new order for DOT Physical services.',
    timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    isRead: false,
    actionLabel: 'View Order',
    priority: 'normal',
  },
  {
    id: '2',
    type: 'invoice',
    title: 'Invoice Paid',
    message:
      'Invoice #INV-2024-042 for $1,250.00 has been paid by TransCo Logistics.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    isRead: false,
    actionLabel: 'View Invoice',
  },
  {
    id: '3',
    type: 'claim',
    title: 'Provider Claim Pending',
    message:
      'Dr. Sarah Johnson has submitted a claim request to join your organization.',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    isRead: false,
    actionLabel: 'Review Claim',
    priority: 'high',
  },
  {
    id: '4',
    type: 'message',
    title: 'New Message',
    message:
      'You have a new message from Jane Smith regarding order #ORD-2024-156.',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    isRead: true,
    senderName: 'Jane Smith',
    actionLabel: 'Reply',
  },
  {
    id: '5',
    type: 'alert',
    title: 'Invoice Overdue',
    message:
      'Invoice #INV-2024-028 is now 15 days past due. Total outstanding: $850.00',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    isRead: true,
    actionLabel: 'Send Reminder',
    priority: 'urgent',
  },
  {
    id: '6',
    type: 'system',
    title: 'System Maintenance',
    message:
      'Scheduled maintenance will occur on Saturday from 2:00 AM - 4:00 AM EST.',
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
    emptyMessage: "You're all caught up!",
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
        message:
          '5 invoices totaling $4,250.00 are now past due and require immediate attention.',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        isRead: false,
        actionLabel: 'View Invoices',
        priority: 'urgent',
      },
      {
        id: '2',
        type: 'claim',
        title: 'Action Required: Provider Verification',
        message:
          'Your NPI verification is expiring in 3 days. Please update your credentials.',
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
      senderName: [
        'John Doe',
        'Jane Smith',
        'Bob Wilson',
        'Sarah Johnson',
        'Mike Brown',
        'System',
      ][i],
      senderAvatar:
        i % 2 === 0 ? undefined : `https://i.pravatar.cc/100?img=${i + 10}`,
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
