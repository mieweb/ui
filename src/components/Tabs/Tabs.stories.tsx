import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './Tabs';
import { Card, CardContent } from '../Card';

const meta: Meta<typeof Tabs> = {
  title: 'Components/Tabs',
  component: Tabs,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['underline', 'pills', 'enclosed'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Underline: Story = {
  render: () => (
    <div className="w-[400px]">
      <Tabs defaultValue="account" variant="underline">
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
        <TabsContent value="account">
          <Card>
            <CardContent className="pt-4">
              <p className="text-muted-foreground text-sm">
                Make changes to your account settings here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="password">
          <Card>
            <CardContent className="pt-4">
              <p className="text-muted-foreground text-sm">
                Change your password here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="notifications">
          <Card>
            <CardContent className="pt-4">
              <p className="text-muted-foreground text-sm">
                Manage your notification preferences.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  ),
};

export const Pills: Story = {
  render: () => (
    <div className="w-[400px]">
      <Tabs defaultValue="all" variant="pills">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <p className="text-muted-foreground text-sm">Showing all items.</p>
        </TabsContent>
        <TabsContent value="active">
          <p className="text-muted-foreground text-sm">
            Showing active items only.
          </p>
        </TabsContent>
        <TabsContent value="completed">
          <p className="text-muted-foreground text-sm">
            Showing completed items only.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  ),
};

export const Enclosed: Story = {
  render: () => (
    <div className="w-[400px]">
      <Tabs defaultValue="overview" variant="enclosed">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <Card>
            <CardContent className="pt-4">
              <p className="text-muted-foreground text-sm">
                Overview dashboard content.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="analytics">
          <Card>
            <CardContent className="pt-4">
              <p className="text-muted-foreground text-sm">
                Analytics dashboard content.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="reports">
          <Card>
            <CardContent className="pt-4">
              <p className="text-muted-foreground text-sm">
                Reports dashboard content.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  ),
};

function UserIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

export const WithIcons: Story = {
  render: () => (
    <div className="w-[400px]">
      <Tabs defaultValue="profile" variant="underline">
        <TabsList>
          <TabsTrigger value="profile" icon={<UserIcon />}>
            Profile
          </TabsTrigger>
          <TabsTrigger value="settings" icon={<SettingsIcon />}>
            Settings
          </TabsTrigger>
          <TabsTrigger value="notifications" icon={<BellIcon />}>
            Notifications
          </TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <p className="text-muted-foreground text-sm">Profile settings.</p>
        </TabsContent>
        <TabsContent value="settings">
          <p className="text-muted-foreground text-sm">General settings.</p>
        </TabsContent>
        <TabsContent value="notifications">
          <p className="text-muted-foreground text-sm">
            Notification preferences.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  ),
};

export const DisabledTab: Story = {
  render: () => (
    <div className="w-[400px]">
      <Tabs defaultValue="tab1" variant="underline">
        <TabsList>
          <TabsTrigger value="tab1">Enabled</TabsTrigger>
          <TabsTrigger value="tab2" disabled>
            Disabled
          </TabsTrigger>
          <TabsTrigger value="tab3">Also Enabled</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">
          <p className="text-muted-foreground text-sm">
            This tab is enabled and can be selected.
          </p>
        </TabsContent>
        <TabsContent value="tab2">
          <p className="text-muted-foreground text-sm">
            This tab is disabled and cannot be selected.
          </p>
        </TabsContent>
        <TabsContent value="tab3">
          <p className="text-muted-foreground text-sm">
            This tab is also enabled.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  ),
};

function ControlledTabsDemo() {
  const [value, setValue] = React.useState('tab1');

  return (
    <div className="w-[400px] space-y-4">
      <Tabs value={value} onValueChange={setValue} variant="pills">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          <TabsTrigger value="tab3">Tab 3</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content for Tab 1</TabsContent>
        <TabsContent value="tab2">Content for Tab 2</TabsContent>
        <TabsContent value="tab3">Content for Tab 3</TabsContent>
      </Tabs>
      <p className="text-muted-foreground text-xs">
        Current tab: <code className="font-mono">{value}</code>
      </p>
    </div>
  );
}

export const Controlled: Story = {
  render: () => <ControlledTabsDemo />,
};
