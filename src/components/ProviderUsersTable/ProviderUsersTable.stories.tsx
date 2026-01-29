import type { Meta, StoryObj } from '@storybook/react';
import { ProviderUsersTable } from './ProviderUsersTable';

const meta: Meta<typeof ProviderUsersTable> = {
  component: ProviderUsersTable,
  title: 'Components/ProviderUsersTable',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    onEditRole: { action: 'onEditRole' },
    onRemove: { action: 'onRemove' },
    onResendInvite: { action: 'onResendInvite' },
  },
};

export default meta;
type Story = StoryObj<typeof ProviderUsersTable>;

const mockUsers = [
  {
    id: 'user-1',
    name: 'John Smith',
    email: 'john.smith@example.com',
    role: 'Administrator',
    status: 'active' as const,
    lastActive: new Date('2024-01-15T10:30:00'),
  },
  {
    id: 'user-2',
    name: 'Jane Doe',
    email: 'jane.doe@example.com',
    role: 'Lab Technician',
    status: 'active' as const,
    lastActive: new Date('2024-01-14T15:45:00'),
  },
  {
    id: 'user-3',
    name: 'Bob Wilson',
    email: 'bob.wilson@example.com',
    role: 'Front Desk',
    status: 'pending' as const,
    invitedAt: new Date('2024-01-10T09:00:00'),
  },
  {
    id: 'user-4',
    name: 'Alice Johnson',
    email: 'alice.johnson@example.com',
    role: 'Billing',
    status: 'inactive' as const,
    lastActive: new Date('2023-12-01T12:00:00'),
  },
];

export const Default: Story = {
  args: {
    users: mockUsers,
    currentUserId: 'user-1',
  },
};

export const WithAvatars: Story = {
  args: {
    users: mockUsers.map((user, index) => ({
      ...user,
      avatarUrl:
        index === 0
          ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop'
          : undefined,
    })),
    currentUserId: 'user-1',
  },
};

export const NoActions: Story = {
  args: {
    users: mockUsers,
    showActions: false,
  },
};

export const Empty: Story = {
  args: {
    users: [],
    emptyMessage: 'No team members have been added yet.',
  },
};

export const Loading: Story = {
  args: {
    users: [],
    isLoading: true,
  },
};

export const AllPending: Story = {
  args: {
    users: [
      {
        id: 'user-1',
        name: 'New User 1',
        email: 'newuser1@example.com',
        role: 'Lab Technician',
        status: 'pending' as const,
        invitedAt: new Date('2024-01-15T09:00:00'),
      },
      {
        id: 'user-2',
        name: 'New User 2',
        email: 'newuser2@example.com',
        role: 'Front Desk',
        status: 'pending' as const,
        invitedAt: new Date('2024-01-14T10:00:00'),
      },
    ],
  },
};
