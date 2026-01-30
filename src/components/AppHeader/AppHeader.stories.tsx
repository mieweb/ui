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

const XIcon = () => (
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
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

const SearchIcon = () => (
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
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

// =============================================================================
// Demo Components
// =============================================================================

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
  argTypes: {
    sticky: {
      control: 'boolean',
      description: 'Whether the header is sticky',
    },
    bordered: {
      control: 'boolean',
      description: 'Whether to show border',
    },
    height: {
      control: 'text',
      description: 'Custom height class',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
    children: {
      control: false, // ReactNode can't be controlled
    },
    // Demo controls (not actual component props)
    showBranding: {
      control: 'boolean',
      description: 'Show branding/logo',
      table: { category: 'Demo Controls' },
    },
    showSearch: {
      control: 'boolean',
      description: 'Show search button',
      table: { category: 'Demo Controls' },
    },
    showMessages: {
      control: 'boolean',
      description: 'Show messages icon',
      table: { category: 'Demo Controls' },
    },
    showNotifications: {
      control: 'boolean',
      description: 'Show notifications icon',
      table: { category: 'Demo Controls' },
    },
    showSettings: {
      control: 'boolean',
      description: 'Show settings icon',
      table: { category: 'Demo Controls' },
    },
    showUserMenu: {
      control: 'boolean',
      description: 'Show user menu',
      table: { category: 'Demo Controls' },
    },
  },
  args: {
    sticky: true,
    bordered: true,
    height: 'h-16',
    showBranding: true,
    showSearch: true,
    showMessages: true,
    showNotifications: true,
    showSettings: true,
    showUserMenu: true,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// =============================================================================
// Stories
// =============================================================================

export const Default: Story = {
  render: ({
    showBranding,
    showSearch,
    showMessages,
    showNotifications,
    showSettings,
    showUserMenu,
    ...args
  }) => (
    <AppHeader {...args}>
      <AppHeaderSection align="left">
        {showBranding && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500 text-white font-bold text-sm">
              A
            </div>
            <span className="hidden font-semibold text-gray-900 dark:text-white sm:block">
              Acme Inc
            </span>
          </div>
        )}
        <button
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden dark:hover:bg-gray-800"
          aria-label="Open menu"
        >
          <MenuIcon />
        </button>
        {showSearch && (
          <AppHeaderSearch
            onClick={() => console.log('Open search')}
            placeholder="Search everything..."
          />
        )}
      </AppHeaderSection>

      <AppHeaderSection align="right">
        <AppHeaderActions>
          {showMessages && (
            <AppHeaderIconButton
              icon={<MessageIcon />}
              label="Messages"
              badge={3}
              onClick={() => console.log('Messages')}
            />
          )}
          {showNotifications && (
            <AppHeaderIconButton
              icon={<BellIcon />}
              label="Notifications"
              badge={5}
              onClick={() => console.log('Notifications')}
            />
          )}
          {showSettings && (
            <AppHeaderIconButton
              icon={<CogIcon />}
              label="Settings"
              onClick={() => console.log('Settings')}
            />
          )}
          {showUserMenu && (
            <>
              <AppHeaderDivider />
              <AppHeaderUserMenu name="John Doe" email="john@example.com" />
            </>
          )}
        </AppHeaderActions>
      </AppHeaderSection>
    </AppHeader>
  ),
};

/**
 * Mobile header story - demonstrates a responsive header pattern where
 * action icons collapse into a hamburger menu on mobile devices.
 * The story is displayed at mobile width (375px) to simulate mobile view.
 */
export const Mobile: Story = {
  render: function MobileDemo({ sticky, bordered, height }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
      <div className="relative w-full max-w-[375px] bg-gray-50 dark:bg-gray-950">
        <AppHeader
          sticky={sticky}
          bordered={bordered}
          height={height}
          className="w-full"
        >
          <AppHeaderSection align="left">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500 text-white font-bold text-sm">
                A
              </div>
            </div>
          </AppHeaderSection>

          <AppHeaderSection align="right">
            <AppHeaderActions>
              {/* Mobile search button */}
              <AppHeaderIconButton
                icon={<SearchIcon />}
                label="Search"
                onClick={() => console.log('Search')}
              />
              {/* Hamburger menu button */}
              <button
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              >
                {mobileMenuOpen ? <XIcon /> : <MenuIcon />}
              </button>
            </AppHeaderActions>
          </AppHeaderSection>
        </AppHeader>

        {/* Mobile slide-out menu */}
        {mobileMenuOpen && (
          <div className="absolute top-16 right-0 left-0 z-40 border-b border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
            <div className="flex flex-col p-4 gap-2">
              {/* User info at top */}
              <div className="flex items-center gap-3 px-2 py-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900 text-primary-900 dark:text-primary-100 font-medium">
                  JD
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    John Doe
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    john@example.com
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <button
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                onClick={() => console.log('Messages')}
              >
                <MessageIcon />
                <span>Messages</span>
                <span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                  3
                </span>
              </button>

              <button
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                onClick={() => console.log('Notifications')}
              >
                <BellIcon />
                <span>Notifications</span>
                <span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                  5
                </span>
              </button>

              <button
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                onClick={() => console.log('Settings')}
              >
                <CogIcon />
                <span>Settings</span>
              </button>

              <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
                <button
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                  onClick={() => console.log('Sign out')}
                >
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
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mock page content */}
        <div className="p-4">
          <div className="h-8 w-3/4 rounded bg-gray-200 dark:bg-gray-800 mb-4" />
          <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-800 mb-2" />
          <div className="h-4 w-5/6 rounded bg-gray-200 dark:bg-gray-800 mb-2" />
          <div className="h-4 w-4/6 rounded bg-gray-200 dark:bg-gray-800" />
        </div>
      </div>
    );
  },
  args: {
    sticky: true,
    bordered: true,
    height: 'h-16',
  },
  argTypes: {
    // Only show the core component props, not the demo controls
    showBranding: { table: { disable: true } },
    showSearch: { table: { disable: true } },
    showMessages: { table: { disable: true } },
    showNotifications: { table: { disable: true } },
    showSettings: { table: { disable: true } },
    showUserMenu: { table: { disable: true } },
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story:
          'Mobile-optimized header with icons collapsed into a hamburger menu. Click the menu button to see the slide-out panel with all actions.',
      },
    },
  },
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
