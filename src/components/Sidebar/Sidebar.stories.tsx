import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import {
  Sidebar,
  SidebarHeader,
  SidebarFooter,
  SidebarContent,
  SidebarNav,
  SidebarNavGroup,
  SidebarNavItem,
  SidebarToggle,
  SidebarMobileToggle,
  SidebarSearch,
  SidebarProvider,
  useSidebar,
} from './index';

// =============================================================================
// Icons
// =============================================================================

const HomeIcon = () => (
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
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    />
  </svg>
);

const UsersIcon = () => (
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
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
);

const FolderIcon = () => (
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
      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
    />
  </svg>
);

const ChartIcon = () => (
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
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
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

// =============================================================================
// Demo Components
// =============================================================================

// Logo component that shows just icon when collapsed
function AppLogo() {
  const { isCollapsed, isMobileViewport } = useSidebar();
  const showCollapsed = !isMobileViewport && isCollapsed;

  if (showCollapsed) {
    return (
      <div className="bg-primary-500 flex h-8 w-8 items-center justify-center rounded-lg font-bold text-white">
        M
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="bg-primary-500 flex h-8 w-8 items-center justify-center rounded-lg font-bold text-white">
        M
      </div>
      <div className="font-semibold text-neutral-900 dark:text-white">
        MIE App
      </div>
    </div>
  );
}

// User avatar that shows just avatar when collapsed (clicking expands)
function UserFooter() {
  const { isCollapsed, isMobileViewport, toggleCollapsed } = useSidebar();
  const showCollapsed = !isMobileViewport && isCollapsed;

  if (showCollapsed) {
    return (
      <button
        onClick={toggleCollapsed}
        className="hover:ring-primary-500 rounded-full p-0.5 transition-colors hover:ring-2"
        title="Expand sidebar"
      >
        <div className="h-8 w-8 rounded-full bg-neutral-200 dark:bg-neutral-700" />
      </button>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-neutral-200 dark:bg-neutral-700" />
        <div className="text-sm text-neutral-700 dark:text-neutral-300">
          John Doe
        </div>
      </div>
      <SidebarToggle />
    </div>
  );
}

function SidebarDemoContent() {
  const [activePage, setActivePage] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const { isCollapsed, isMobileViewport } = useSidebar();
  const showCollapsed = !isMobileViewport && isCollapsed;

  return (
    <div className="flex h-[600px] w-full overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-950">
      <Sidebar>
        <SidebarHeader>
          <AppLogo />
        </SidebarHeader>

        <SidebarContent>
          {!showCollapsed && (
            <SidebarSearch
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search menu"
            />
          )}

          <SidebarNav>
            <SidebarNavGroup
              label="Main"
              icon={<HomeIcon />}
              groupId="main"
              defaultExpanded
            >
              <SidebarNavItem
                label="Dashboard"
                icon={<HomeIcon />}
                isActive={activePage === 'dashboard'}
                onClick={() => setActivePage('dashboard')}
              />
              <SidebarNavItem
                label="Analytics"
                icon={<ChartIcon />}
                isActive={activePage === 'analytics'}
                onClick={() => setActivePage('analytics')}
                badge={12}
              />
            </SidebarNavGroup>

            <SidebarNavGroup
              label="Management"
              icon={<UsersIcon />}
              groupId="management"
            >
              <SidebarNavItem
                label="Users"
                icon={<UsersIcon />}
                isActive={activePage === 'users'}
                onClick={() => setActivePage('users')}
              />
              <SidebarNavItem
                label="Projects"
                icon={<FolderIcon />}
                isActive={activePage === 'projects'}
                onClick={() => setActivePage('projects')}
              />
            </SidebarNavGroup>

            <SidebarNavGroup
              label="Settings"
              icon={<CogIcon />}
              groupId="settings"
            >
              <SidebarNavItem
                label="General"
                icon={<CogIcon />}
                isActive={activePage === 'general'}
                onClick={() => setActivePage('general')}
              />
              <SidebarNavItem
                label="Security"
                isActive={activePage === 'security'}
                onClick={() => setActivePage('security')}
              />
            </SidebarNavGroup>
          </SidebarNav>
        </SidebarContent>

        <SidebarFooter>
          <UserFooter />
        </SidebarFooter>
      </Sidebar>

      {/* Main content area */}
      <div className="flex-1 p-6">
        <div className="mb-6 flex items-center gap-4">
          <SidebarMobileToggle />
          <h1 className="text-xl font-semibold text-neutral-900 capitalize dark:text-white">
            {activePage}
          </h1>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800">
          <p className="text-neutral-600 dark:text-neutral-400">
            Content for the {activePage} page goes here. Click navigation items
            to change pages.
          </p>
        </div>
      </div>
    </div>
  );
}

function SidebarDemo() {
  return <SidebarDemoContent />;
}

// Collapse toggle button that works in both states
function CollapseToggle() {
  const { isCollapsed, toggleCollapsed, isMobileViewport } = useSidebar();
  const showCollapsed = !isMobileViewport && isCollapsed;

  return (
    <button
      onClick={toggleCollapsed}
      className="w-full rounded-lg py-2 text-sm text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
      title={showCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    >
      {showCollapsed ? '→' : '← Collapse'}
    </button>
  );
}

function CollapsibleDemo() {
  const [activePage, setActivePage] = useState('dashboard');

  return (
    <div className="flex h-[600px] w-full overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-950">
      <Sidebar>
        <SidebarHeader>
          <AppLogo />
        </SidebarHeader>

        <SidebarContent>
          <SidebarNav>
            <SidebarNavItem
              label="Dashboard"
              icon={<HomeIcon />}
              isActive={activePage === 'dashboard'}
              onClick={() => setActivePage('dashboard')}
            />
            <SidebarNavItem
              label="Analytics"
              icon={<ChartIcon />}
              isActive={activePage === 'analytics'}
              onClick={() => setActivePage('analytics')}
            />
            <SidebarNavItem
              label="Users"
              icon={<UsersIcon />}
              isActive={activePage === 'users'}
              onClick={() => setActivePage('users')}
            />
            <SidebarNavItem
              label="Settings"
              icon={<CogIcon />}
              isActive={activePage === 'settings'}
              onClick={() => setActivePage('settings')}
            />
          </SidebarNav>
        </SidebarContent>

        <SidebarFooter>
          <CollapseToggle />
        </SidebarFooter>
      </Sidebar>

      <div className="flex-1 p-6">
        <h1 className="mb-4 text-xl font-semibold text-neutral-900 capitalize dark:text-white">
          {activePage}
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Try clicking the collapse button in the sidebar footer to see the
          collapsed state.
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// Meta
// =============================================================================

const meta: Meta<typeof Sidebar> = {
  title: 'Components/Sidebar',
  component: Sidebar,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A composable sidebar navigation component with support for collapsing, mobile drawer, groups, search, and accordion behavior.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <SidebarProvider defaultExpandedGroup="main">
        <Story />
      </SidebarProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

// =============================================================================
// Stories
// =============================================================================

export const Default: Story = {
  render: () => <SidebarDemo />,
};

export const Collapsible: Story = {
  render: () => <CollapsibleDemo />,
  parameters: {
    docs: {
      description: {
        story:
          'The sidebar can be collapsed to save screen space. Icons remain visible in collapsed state.',
      },
    },
  },
};

export const MobileView: Story = {
  render: () => <SidebarDemo />,
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story:
          'On mobile viewports, the sidebar becomes a slide-out drawer with a backdrop.',
      },
    },
  },
};
