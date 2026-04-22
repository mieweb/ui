import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';

import {
  AppHeaderIconButton,
  AppHeaderSearch,
  AppHeaderUserMenu,
} from '../AppHeader/AppHeader';
import { type PortalNavGroup, PortalShell } from './PortalShell';

const meta: Meta<typeof PortalShell> = {
  title: 'Layout/PortalShell',
  component: PortalShell,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj<typeof PortalShell>;

const DashIcon = (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
    />
  </svg>
);

const groups: PortalNavGroup[] = [
  {
    label: 'Overview',
    items: [
      { key: 'dash', label: 'Dashboard', href: '/dash', icon: DashIcon },
      {
        key: 'msg',
        label: 'Messages',
        href: '/messages',
        icon: DashIcon,
        badge: 3,
      },
    ],
  },
  {
    label: 'Workforce',
    items: [
      { key: 'emp', label: 'Employees', href: '/employees', icon: DashIcon },
      { key: 'prov', label: 'Providers', href: '/providers', icon: DashIcon },
    ],
  },
];

const BellIcon = (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
    />
  </svg>
);

export const Default: Story = {
  args: {
    brand: <div className="font-bold text-primary-700">BlueHive Employer</div>,
    navGroups: groups,
    isItemActive: (it) => it.key === 'dash',
    topBarRight: (
      <>
        <AppHeaderSearch placeholder="Search orders, employees…" />
        <AppHeaderIconButton icon={BellIcon} label="Notifications" badge={2} />
        <AppHeaderUserMenu name="Jane Smith" email="jane@acme.com" />
      </>
    ),
    children: (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Drop any page content here. The shell handles the rest.
        </p>
      </div>
    ),
  },
};
