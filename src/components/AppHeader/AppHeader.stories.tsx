import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import {
  AppHeader,
  AppHeaderSection,
  AppHeaderTitle,
  AppHeaderActions,
  AppHeaderDivider,
  AppHeaderIconButton,
  AppHeaderSearch,
  AppHeaderUserMenu,
} from './index';

// =============================================================================
// Icons
// =============================================================================

const BellIcon = () => (
  <svg
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
    />
  </svg>
);

const MessageIcon = () => (
  <svg
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
    />
  </svg>
);

const CogIcon = () => (
  <svg
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

const MenuIcon = () => (
  <svg
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 6h16M4 12h16M4 18h16"
    />
  </svg>
);

// =============================================================================
// Demo Components
// =============================================================================

function FullHeaderDemo() {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  return (
    <AppHeader className="w-full">
      <AppHeaderSection align="left">
        <button
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden dark:hover:bg-gray-800"
          aria-label="Open menu"
        >
          <MenuIcon />
        </button>
        <AppHeaderSearch
          onClick={() => console.log('Open search')}
          placeholder="Search everything..."
        />
      </AppHeaderSection>

      <AppHeaderSection align="right">
        <AppHeaderActions>
          <AppHeaderIconButton
            icon={<MessageIcon />}
            label="Messages"
            badge={3}
            onClick={() => console.log('Messages')}
          />
          <AppHeaderIconButton
            icon={<BellIcon />}
            label="Notifications"
            badge={5}
            onClick={() => console.log('Notifications')}
          />
          <AppHeaderIconButton
            icon={<CogIcon />}
            label="Settings"
            onClick={() => console.log('Settings')}
          />
          <AppHeaderDivider />
          <AppHeaderUserMenu
            name="John Doe"
            email="john@example.com"
            isOpen={isUserMenuOpen}
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          />
        </AppHeaderActions>
      </AppHeaderSection>
    </AppHeader>
  );
}

function SimpleHeaderDemo() {
  return (
    <AppHeader className="w-full">
      <AppHeaderSection align="left">
        <AppHeaderTitle>Dashboard</AppHeaderTitle>
      </AppHeaderSection>

      <AppHeaderSection align="right">
        <AppHeaderActions>
          <AppHeaderIconButton
            icon={<BellIcon />}
            label="Notifications"
            onClick={() => console.log('Notifications')}
          />
          <AppHeaderUserMenu name="Jane Smith" />
        </AppHeaderActions>
      </AppHeaderSection>
    </AppHeader>
  );
}

function HeaderWithTitleDemo() {
  return (
    <AppHeader className="w-full">
      <AppHeaderSection align="left">
        <button className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
          <MenuIcon />
        </button>
        <AppHeaderDivider />
        <AppHeaderTitle subtitle="Manage your team members">
          User Management
        </AppHeaderTitle>
      </AppHeaderSection>

      <AppHeaderSection align="right">
        <AppHeaderActions>
          <button className="bg-primary-500 hover:bg-primary-600 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors">
            Add User
          </button>
        </AppHeaderActions>
      </AppHeaderSection>
    </AppHeader>
  );
}

// =============================================================================
// Meta
// =============================================================================

const meta: Meta<typeof AppHeader> = {
  title: 'Components/AppHeader',
  component: AppHeader,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A composable application header with support for search, notifications, user menus, and custom actions.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// =============================================================================
// Stories
// =============================================================================

export const Default: Story = {
  render: () => <FullHeaderDemo />,
};

export const Simple: Story = {
  render: () => <SimpleHeaderDemo />,
  parameters: {
    docs: {
      description: {
        story: 'A simpler header with just a title and minimal actions.',
      },
    },
  },
};

export const WithTitle: Story = {
  render: () => <HeaderWithTitleDemo />,
  parameters: {
    docs: {
      description: {
        story:
          'Header with a page title and subtitle, along with an action button.',
      },
    },
  },
};

export const SearchButton: Story = {
  render: () => (
    <div className="bg-gray-100 p-4 dark:bg-gray-900">
      <AppHeaderSearch
        onClick={() => console.log('Open search')}
        placeholder="Search..."
      />
    </div>
  ),
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        story:
          'The search trigger button that can be used to open a command palette.',
      },
    },
  },
};

export const IconButtons: Story = {
  render: () => (
    <div className="flex gap-2 bg-gray-100 p-4 dark:bg-gray-900">
      <AppHeaderIconButton icon={<BellIcon />} label="Notifications" />
      <AppHeaderIconButton
        icon={<BellIcon />}
        label="Notifications"
        badge={5}
      />
      <AppHeaderIconButton
        icon={<BellIcon />}
        label="Notifications"
        badge={99}
      />
      <AppHeaderIconButton
        icon={<BellIcon />}
        label="Notifications"
        badge={150}
      />
      <AppHeaderIconButton icon={<BellIcon />} label="Notifications" isActive />
    </div>
  ),
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        story: 'Icon buttons with different badge states and active state.',
      },
    },
  },
};

export const UserMenu: Story = {
  render: () => (
    <div className="flex gap-4 bg-gray-100 p-4 dark:bg-gray-900">
      <AppHeaderUserMenu name="John Doe" />
      <AppHeaderUserMenu name="Jane Smith" email="jane@example.com" />
      <AppHeaderUserMenu name="Bob Wilson" initials="BW" isOpen />
    </div>
  ),
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        story: 'User menu buttons with different configurations.',
      },
    },
  },
};
