import type { Meta, StoryObj } from '@storybook/react';

import { UserBadge } from './UserBadge';

const meta: Meta<typeof UserBadge> = {
  title: 'Components/UserBadge',
  component: UserBadge,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The canonical inline user identity: avatar + name with a hover preview card and a click-through to the user profile. Hover (or focus) the badge to reveal email, presence, roles, last-active and a "View full profile" link.',
      },
    },
  },
  argTypes: {
    onNavigate: { action: 'navigate' },
    size: { control: 'inline-radio', options: ['xs', 'sm', 'md'] },
    status: { control: 'inline-radio', options: ['active', 'inactive', null] },
  },
};

export default meta;
type Story = StoryObj<typeof UserBadge>;

export const Default: Story = {
  args: {
    name: 'Will Reiske',
    email: 'will@bluehive.com',
    status: 'active',
    href: '/employer/acme/users/u-123',
    roles: ['Employer Admin', 'View Orders'],
    lastActiveLabel: '2 hours ago',
  },
};

export const WithSubtitle: Story = {
  args: {
    ...Default.args,
    subtitle: 'Employer Admin',
  },
};

export const WithDetails: Story = {
  args: {
    ...Default.args,
    details: [
      { label: 'Orders placed', value: 42 },
      { label: 'Member since', value: 'Jan 2024' },
    ],
  },
};

export const Inactive: Story = {
  args: {
    ...Default.args,
    name: 'Dana Lee',
    email: 'dana@example.com',
    status: 'inactive',
    lastActiveLabel: '3 months ago',
    roles: ['View Orders'],
  },
};

export const AvatarOnly: Story = {
  args: {
    ...Default.args,
    avatarOnly: true,
  },
};

export const NoProfileLink: Story = {
  args: {
    name: 'System',
    email: undefined,
    href: undefined,
    disableHoverCard: true,
  },
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-4">
      <UserBadge {...args} size="xs" />
      <UserBadge {...args} size="sm" />
      <UserBadge {...args} size="md" />
    </div>
  ),
  args: {
    name: 'Will Reiske',
    email: 'will@bluehive.com',
    status: 'active',
    href: '/employer/acme/users/u-123',
    roles: ['Employer Admin'],
  },
};

export const InProse: Story = {
  render: (args) => (
    <p className="max-w-md text-sm text-foreground">
      This order was placed by{' '}
      <UserBadge {...args} avatarOnly /> earlier today. Hover the avatar for a
      quick preview, or click through to the full profile.
    </p>
  ),
  args: {
    name: 'Will Reiske',
    email: 'will@bluehive.com',
    status: 'active',
    href: '/employer/acme/users/u-123',
    roles: ['Employer Admin'],
    lastActiveLabel: '2 hours ago',
  },
};
